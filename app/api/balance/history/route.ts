import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/database';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Не удалось получить токен.' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };

    const historyResult = await pool.query(
      `
      SELECT id,
             balance_type,
             amount_before,
             amount_after,
             change_type,
             related_id,
             description,
             created_at
      FROM balance_history
      WHERE user_id = $1 AND balance_type = $2 AND change_type != 'manual_adjustment'
      ORDER BY created_at ASC
      `,
      [decoded.id, 'bets'],
    );

    return NextResponse.json({ history: historyResult.rows }, { status: 200 });
  } catch (error) {
    console.error('Ошибка получения истории баланса:', error);
    return NextResponse.json({ message: 'Не удалось загрузить историю баланса.' }, { status: 500 });
  }
}

