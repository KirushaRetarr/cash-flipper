import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/database';
import jwt from 'jsonwebtoken';

const ALLOWED_STATUSES = ['active', 'win', 'loss', 'refund'] as const;
type BetStatus = (typeof ALLOWED_STATUSES)[number];

const roundMoney = (value: number) => Number(value.toFixed(2));

const calculateBasePotential = (stake: number, totalOdds: number) =>
  roundMoney(stake * totalOdds);

const potentialForStatus = (status: BetStatus, stake: number, totalOdds: number) => {
  const base = calculateBasePotential(stake, totalOdds);
  switch (status) {
    case 'loss':
      return 0;
    case 'refund':
      return roundMoney(stake);
    case 'win':
    case 'active':
    default:
      return base;
  }
};

const creditForStatus = (status: BetStatus, stake: number, totalOdds: number) => {
  switch (status) {
    case 'win':
      return calculateBasePotential(stake, totalOdds);
    case 'refund':
      return roundMoney(stake);
    default:
      return 0;
  }
};

const historyDescription = (status: BetStatus, delta: number, betId: number) => {
  if (delta > 0) {
    if (status === 'win') {
      return `Выплата по ставке #${betId}`;
    }
    if (status === 'refund') {
      return `Возврат ставки #${betId}`;
    }
    return `Пополнение по ставке #${betId}`;
  }
  return `Корректировка по ставке #${betId}`;
};

const historyChangeType = (status: BetStatus, delta: number) => {
  if (delta > 0) {
    return status === 'win' ? 'bet_win' : status === 'refund' ? 'bet_refund' : 'bet_adjust';
  }
  return 'bet_adjust';
};

const getUserId = (request: NextRequest): number | null => {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return null;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    return decoded.id;
  } catch {
    return null;
  }
};

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ message: 'Не удалось получить токен.' }, { status: 401 });
    }

    const betsResult = await pool.query(
      `
      SELECT
        b.id,
        b.created_at,
        b.updated_at,
        b.bet_type,
        b.category,
        b.stake_amount,
        b.total_odds,
        b.potential_payout,
        b.status,
        COALESCE(
          json_agg(
            json_build_object(
              'id', e.id,
              'discipline', e.discipline,
              'teamA', e.team_a,
              'teamB', e.team_b,
              'scope', e.scope,
              'mapNumber', e.map_number,
              'market', e.market,
              'selection', e.selection,
              'odds', e.odds
            )
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'
        ) AS events
      FROM bets b
      LEFT JOIN bet_events e ON e.bet_id = b.id
      WHERE b.user_id = $1
      GROUP BY b.id
      ORDER BY b.created_at DESC
      `,
      [userId],
    );

    return NextResponse.json({ bets: betsResult.rows }, { status: 200 });
  } catch (error) {
    console.error('Ошибка получения истории ставок:', error);
    return NextResponse.json({ message: 'Не удалось загрузить историю ставок.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ message: 'Не удалось получить токен.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { betId, status } = body as { betId: number; status: BetStatus };

    if (!betId || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ message: 'Некорректные данные запроса.' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const betResult = await client.query(
        `
        SELECT id, stake_amount, total_odds, potential_payout, status
        FROM bets
        WHERE id = $1 AND user_id = $2
        FOR UPDATE
        `,
        [betId, userId],
      );

      if (betResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Ставка не найдена.' }, { status: 404 });
      }

      const bet = betResult.rows[0];
      const prevStatus = bet.status as BetStatus;

      if (prevStatus === status) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Статус не изменился.' }, { status: 200 });
      }

      const stakeAmount = Number(bet.stake_amount);
      const totalOdds = Number(bet.total_odds);

      const prevCredit = creditForStatus(prevStatus, stakeAmount, totalOdds);
      const nextCredit = creditForStatus(status, stakeAmount, totalOdds);
      const delta = roundMoney(nextCredit - prevCredit);

      const balanceResult = await client.query(
        `SELECT amount FROM user_balances WHERE user_id = $1 AND balance_type = $2 FOR UPDATE`,
        [userId, 'bets'],
      );

      if (balanceResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Баланс для ставок не найден.' }, { status: 400 });
      }

      const balanceBefore = Number(balanceResult.rows[0].amount);
      const balanceAfter = roundMoney(balanceBefore + delta);

      const newPotential = potentialForStatus(status, stakeAmount, totalOdds);

      await client.query(
        `UPDATE bets
         SET status = $1,
             potential_payout = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [status, newPotential, betId],
      );

      if (delta !== 0) {
        await client.query(
          `UPDATE user_balances
             SET amount = $1, updated_at = NOW()
           WHERE user_id = $2 AND balance_type = $3`,
          [balanceAfter, userId, 'bets'],
        );

        await client.query(
          `INSERT INTO balance_history
            (user_id, balance_type, amount_before, amount_after, change_type, related_id, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            userId,
            'bets',
            balanceBefore,
            balanceAfter,
            historyChangeType(status, delta),
            betId,
            historyDescription(status, delta, betId),
          ],
        );
      }

      await client.query('COMMIT');

      return NextResponse.json(
        {
          message: 'Статус обновлён.',
          balance: balanceAfter,
          bet: {
            ...bet,
            status,
            potential_payout: newPotential,
            stake_amount: stakeAmount,
            total_odds: totalOdds,
            updated_at: new Date().toISOString(),
          },
        },
        { status: 200 },
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Ошибка обновления статуса ставки:', error);
    return NextResponse.json({ message: 'Не удалось обновить статус ставки.' }, { status: 500 });
  }
}

