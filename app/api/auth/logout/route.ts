import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const response = NextResponse.json({ success: true, message: 'Вы успешно вышли' }, { status: 200 });
        
        response.cookies.set('token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 0,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Ошибка выхода:', error);
        return NextResponse.json(
            { success: false, message: 'Ошибка при выходе' },
            { status: 500 }
        );
    }
}

