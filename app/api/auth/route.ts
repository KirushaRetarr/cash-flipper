import { NextRequest, NextResponse } from 'next/server'
import pool from '@/app/lib/database'
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { loginMethod, email, username, password } = body;

        if (loginMethod === 'email') {
            const existing = await pool.query(
                "SELECT * FROM users WHERE email = $1", [email]
            );
            if (existing.rows.length > 0) {
                const user = existing.rows[0];
                const isPasswordValid = await bcrypt.compare(password, user.password_hash);
                if (isPasswordValid) {
                    return NextResponse.json({ success: true, user });
                } else {
                    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
                }
            }
        } else {
            const existing = await pool.query(
                "SELECT * FROM users WHERE username = $1", [username]
            );
            if (existing.rows.length > 0) {
                const user = existing.rows[0];
                const isPasswordValid = await bcrypt.compare(password, user.password_hash);
                if (isPasswordValid) {
                    return NextResponse.json({ success: true, user });
                } else {
                    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
                }
            }
        }
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        return NextResponse.json(
          { success: false, message: 'Ошибка сервера при авторизации' },
          { status: 500 }
        );
    }
}