// registr
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/app/lib/database'
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, email, password } = body;

        const hashedPassword = await bcrypt.hash(password, 10);

        if (!username || !email || !password) {
            return NextResponse.json({ error: "Заполни все поля" }, { status: 400 });
        }
      
        const existing = await pool.query(
            "SELECT * FROM users WHERE email = $1", [email]
        );
        if (existing.rows.length > 0) {
            return NextResponse.json({ error: "Такой пользователь уже существует" }, { status: 409 });
        }

        const result = await pool.query(`INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *`, [username, email, hashedPassword]);
        
        const user = result.rows[0];
        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        return NextResponse.json(
          { success: false, message: 'Ошибка сервера при регистрации' },
          { status: 500 }
        );
    }
}