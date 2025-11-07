import { NextRequest, NextResponse } from 'next/server'
import pool from '@/app/lib/database'
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

                const token = jwt.sign(
                    {id: user.id, email: user.email},
                    process.env.JWT_SECRET!,
                    {expiresIn: "7d"}
                );

                const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
                response.cookies.set("token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "development",
                    sameSite: 'strict',
                    maxAge: 60 * 60 * 24 * 7,
                    path: "/",
                })

                if (isPasswordValid) {
                    return response;
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

                const token = jwt.sign(
                    {id: user.id, email: user.email},
                    process.env.JWT_SECRET!,
                    {expiresIn: "7d"}
                );

                const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
                response.cookies.set("token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "development",
                    sameSite: 'strict',
                    maxAge: 60 * 60 * 24 * 7,
                    path: "/",
                })

                if (isPasswordValid) {
                    return response;
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

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ isAuthenticated: false }, { status: 401 });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; email: string };
            
            const userResult = await pool.query(
                "SELECT id, username, email FROM users WHERE id = $1",
                [decoded.id]
            );

            if (userResult.rows.length === 0) {
                return NextResponse.json({ isAuthenticated: false }, { status: 401 });
            }

            const user = userResult.rows[0];
            
            return NextResponse.json({ 
                isAuthenticated: true, 
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                },
            }, { status: 200 });
        } catch (error) {
            return NextResponse.json({ isAuthenticated: false }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ isAuthenticated: false }, { status: 500 });
    }
}