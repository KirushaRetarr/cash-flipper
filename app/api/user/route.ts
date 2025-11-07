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

        const userInfo = await pool.query(
            'SELECT id, username, email, avatar_url, theme, language, created_at, updated_at FROM users WHERE id = $1', [decoded.id]
        )

        if (userInfo.rows.length === 0) {
            return NextResponse.json({ message: 'Не удалось получить баланс пользователя' }, { status: 404 })
        }
        
        const response = NextResponse.json({
            user: userInfo.rows,
        }, { status: 200 })

        return response
    } catch (error) {
        return NextResponse.json({ message: 'Не удалось получить баланс на сервере' }, { status: 500 })
    }
}