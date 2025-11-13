import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/database';
import jwt from 'jsonwebtoken';

type IncomingEvent = {
  discipline: string;
  teamA: string;
  teamB: string;
  scope: 'overall' | 'map';
  mapNumber?: number | null;
  market: 'winner' | 'total' | 'exact_score';
  selection: string;
  totalSide?: 'over' | 'under' | null;
  totalLine?: number | null;
  odds: number;
};

const VALID_DISCIPLINES = ['cs2', 'dota2'];

function validateEvents(events: IncomingEvent[], betType: 'single' | 'express') {
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error('Необходимо указать хотя бы одно событие.');
  }

  if (betType === 'express' && events.length < 2) {
    throw new Error('Экспресс должен содержать минимум два события.');
  }

  events.forEach((event, index) => {
    if (!VALID_DISCIPLINES.includes(event.discipline)) {
      throw new Error(`Событие #${index + 1}: недопустимая дисциплина.`);
    }
    if (!event.teamA || !event.teamB || event.teamA === event.teamB) {
      throw new Error(`Событие #${index + 1}: необходимо выбрать две разные команды.`);
    }
    if (!['overall', 'map'].includes(event.scope)) {
      throw new Error(`Событие #${index + 1}: недопустимый тип охвата (общая/карта).`);
    }
    if (event.scope === 'map') {
      if (!event.mapNumber || event.mapNumber < 1 || event.mapNumber > 5) {
        throw new Error(`Событие #${index + 1}: номер карты должен быть в диапазоне 1-5.`);
      }
    }
    if (!['winner', 'total', 'exact_score'].includes(event.market)) {
      throw new Error(`Событие #${index + 1}: недопустимый тип ставки.`);
    }
    if (!event.selection) {
      throw new Error(`Событие #${index + 1}: необходимо указать исход.`);
    }
    if (event.market === 'total') {
      if (!event.totalSide || !['over', 'under'].includes(event.totalSide)) {
        throw new Error(`Событие #${index + 1}: необходимо указать сторону тотала (б/м).`);
      }
      const allowedLines = event.scope === 'overall' ? [2.5] : [18.5, 19.5, 20.5, 21.5, 22.5, 23.5];
      if (!event.totalLine || !allowedLines.includes(event.totalLine)) {
        throw new Error(`Событие #${index + 1}: недопустимое значение линии тотала.`);
      }
    } else {
      if (event.totalSide || event.totalLine) {
        throw new Error(`Событие #${index + 1}: параметры тотала допустимы только для тоталов.`);
      }
    }
    if (event.market === 'exact_score' && !['2-0', '2-1', '0-2', '1-2'].includes(event.selection)) {
      throw new Error(`Событие #${index + 1}: недопустимый точный счёт.`);
    }
    if (event.odds === undefined || event.odds === null || Number(event.odds) <= 0) {
      throw new Error(`Событие #${index + 1}: необходимо указать коэффициент больше 0.`);
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Не удалось получить токен.' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };

    const body = await request.json();
    const {
      betType,
      category = 'cybersport',
      stakeAmount,
      events,
      totalOdds,
    }: {
      betType: 'single' | 'express';
      category?: string;
      stakeAmount: number;
      events: IncomingEvent[];
      totalOdds?: number;
    } = body;

    if (!betType || !['single', 'express'].includes(betType)) {
      return NextResponse.json({ message: 'Некорректный тип ставки.' }, { status: 400 });
    }

    if (!stakeAmount || Number(stakeAmount) <= 0) {
      return NextResponse.json({ message: 'Сумма ставки должна быть больше 0.' }, { status: 400 });
    }

    validateEvents(events, betType);

    const computedTotalOdds =
      betType === 'express'
        ? events.reduce((acc, event) => acc + Number(event.odds || 0), 0)
        : Number(events[0].odds);

    if (totalOdds && Math.abs(totalOdds - computedTotalOdds) > 0.001) {
      return NextResponse.json({ message: 'Итоговый коэффициент не совпадает с событиями.' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const balanceResult = await client.query(
        'SELECT amount FROM user_balances WHERE user_id = $1 AND balance_type = $2 FOR UPDATE',
        [decoded.id, 'bets'],
      );

      if (balanceResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { message: 'Баланс для ставок не найден.' },
          { status: 400 },
        );
      }

      const currentBalance = Number(balanceResult.rows[0].amount ?? 0);

      if (currentBalance < stakeAmount) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { message: `Недостаточно средств. Доступно: ${currentBalance}$, требуется: ${stakeAmount}$` },
          { status: 400 },
        );
      }

      const potentialPayout = Number((stakeAmount * computedTotalOdds).toFixed(2));

      const insertBetResult = await client.query(
        `INSERT INTO bets (user_id, bet_type, category, stake_amount, total_odds, potential_payout)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          decoded.id,
          betType,
          category,
          stakeAmount,
          computedTotalOdds,
          potentialPayout,
        ],
      );

      const betId = insertBetResult.rows[0].id;

      for (const event of events) {
        const mapNumberValue = event.scope === 'map' ? event.mapNumber ?? null : null;
        const totalSideValue = event.market === 'total' ? event.totalSide ?? null : null;
        const totalLineValue = event.market === 'total' ? event.totalLine ?? null : null;

        await client.query(
          `INSERT INTO bet_events (bet_id, discipline, team_a, team_b, scope, map_number, market, selection, total_side, total_line, odds)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            betId,
            event.discipline,
            event.teamA,
            event.teamB,
            event.scope,
            mapNumberValue,
            event.market,
            event.selection,
            totalSideValue,
            totalLineValue,
            event.odds,
          ],
        );
      }

      const updateBalanceResult = await client.query(
        `UPDATE user_balances
         SET amount = amount - $1, updated_at = NOW()
         WHERE user_id = $2 AND balance_type = $3
         RETURNING amount`,
        [stakeAmount, decoded.id, 'bets'],
      );

      if (updateBalanceResult.rowCount === 0) {
        throw new Error('Не удалось обновить баланс пользователя.');
      }

      const updatedBalance = Number(updateBalanceResult.rows[0].amount);

      await client.query(
        `INSERT INTO balance_history
          (user_id, balance_type, amount_before, amount_after, change_type, related_id, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          decoded.id,
          'bets',
          currentBalance,
          updatedBalance,
          'bet_place',
          betId,
          'Списание на ставку',
        ],
      );

      await client.query('COMMIT');

      return NextResponse.json(
        { message: 'Ставка успешно создана.', balance: updatedBalance, betId },
        { status: 200 },
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    console.error('Ошибка при создании ставки:', err);
    const message = err instanceof Error ? err.message : 'Неизвестная ошибка.';
    return NextResponse.json({ message }, { status: 500 });
  }
}