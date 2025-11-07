import { NextRequest, NextResponse } from 'next/server'
import pool from '@/app/lib/database'
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { betName, betSum, betMultiply, betDescription } = body

        const token = request.cookies.get('token')?.value
        if (!token) {
            return NextResponse.json({ message: '=Не удалось получить токен=' }, { status: 401 });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number }

        const betsBalanceQuery = await pool.query(
            'SELECT * FROM user_balances WHERE user_id = $1 AND balance_type = $2', [decoded.id, 'bets']
        )
        const betsBalance = betsBalanceQuery.rows[0].amount;

        const cryptoBalanceQuery = await pool.query(
            'SELECT * FROM user_balances WHERE user_id = $1 AND balance_type = $2', [decoded.id, 'crypto']
        )

        if (betsBalance < betSum) {
            return NextResponse.json({ message: `Недостаточно средств. Доступно: ${betsBalance}$, требуется: ${betSum}$` }, { status: 400 });
        }
        
        await pool.query(`INSERT INTO bets (user_id, title, description, amount, odds, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [decoded.id, betName, betDescription, betSum, betMultiply, 'active']);
        
        return NextResponse.json({ message: '=Все хорошо=' }, { status: 200 })
    } catch (err) {
        return NextResponse.json({ message: err }, { status: 500 })
    }
}