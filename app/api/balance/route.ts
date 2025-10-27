import type { NextRequest, NextResponse } from 'next/server'
import pool from '@/app/lib/database'
 
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId') || '1';
        const balance = searchParams.get('type') 
    } catch (error) {}
}