import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Only Super Admins can create companies
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session as any).user?.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO companies (id, name)
             VALUES ($1, $2)
             RETURNING id, name, created_at AS "createdAt"`,
            // NOTE: The company is created via the backend /companies endpoint which generates
            // the S3 slug-ID. This frontend route is for read operations by superadmin.
            // For new company creation the caller should use the FastAPI backend endpoint.
            // If needed here, pass id explicitly: for now we return an error directing to backend.
            [null, name]
        );

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error: any) {
        console.error('Failed to create company:', error.message);
        // Unique constraint violation
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Company name already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session as any).user?.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await pool.query(
            `SELECT id, name, created_at AS "createdAt"
             FROM companies
             ORDER BY created_at DESC`
        );

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch companies:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
