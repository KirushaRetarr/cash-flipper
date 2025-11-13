import { NextRequest, NextResponse } from 'next/server'
import pool from '@/app/lib/database'
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Токен не найден' }, { status: 401 })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number }

        const userBalance = await pool.query(
            'SELECT * FROM user_balances WHERE user_id = $1', [decoded.id]
        )

        const userBalanceHistory = await pool.query(
            'SELECT * FROM balance_history WHERE user_id = $1', [decoded.id]
        )

        if (userBalance.rows.length === 0) {
            return NextResponse.json({ message: 'Не удалось получить баланс пользователя' }, { status: 404 })
        }
        
        const response = NextResponse.json({
            balance: userBalance.rows,
            balanceHistory: userBalanceHistory.rows
        }, { status: 200 })

        return response
    } catch (error) {
        return NextResponse.json({ message: 'Не удалось получить баланс на сервере' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Токен не найден' }, { status: 401 })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number }
        const body = await request.json();
        const { amount, operation } = body as { amount: number; operation: 'add' | 'subtract' };

        if (!amount || amount <= 0 || !operation || !['add', 'subtract'].includes(operation)) {
            return NextResponse.json({ message: 'Некорректные данные запроса.' }, { status: 400 })
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Получаем текущий баланс
            const balanceResult = await client.query(
                `SELECT amount FROM user_balances WHERE user_id = $1 AND balance_type = $2 FOR UPDATE`,
                [decoded.id, 'bets']
            );

            if (balanceResult.rowCount === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ message: 'Баланс не найден.' }, { status: 404 })
            }

            const currentBalance = Number(balanceResult.rows[0].amount);
            const newBalance = operation === 'add' 
                ? currentBalance + amount 
                : Math.max(0, currentBalance - amount); // Не позволяем уйти в минус

            // Обновляем баланс
            await client.query(
                `UPDATE user_balances 
                 SET amount = $1, updated_at = NOW() 
                 WHERE user_id = $2 AND balance_type = $3`,
                [newBalance, decoded.id, 'bets']
            );

            // Записываем в историю с change_type = 'manual_adjustment' (не будет отображаться в статистике)
            await client.query(
                `INSERT INTO balance_history
                  (user_id, balance_type, amount_before, amount_after, change_type, related_id, description)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    decoded.id,
                    'bets',
                    currentBalance,
                    newBalance,
                    'manual_adjustment',
                    null,
                    operation === 'add' ? `Ручное пополнение: +${amount.toFixed(2)}$` : `Ручное списание: -${amount.toFixed(2)}$`,
                ],
            );

            await client.query('COMMIT');

            return NextResponse.json({
                message: operation === 'add' ? 'Баланс успешно пополнен.' : 'Баланс успешно уменьшен.',
                balance: newBalance
            }, { status: 200 })

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Ошибка обновления баланса:', error);
        return NextResponse.json({ message: 'Не удалось обновить баланс.' }, { status: 500 })
    }
}