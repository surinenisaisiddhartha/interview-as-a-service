import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { createCognitoUser } from '@/lib/cognito';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session as any)?.user?.role;

        if (!session || (userRole !== 'superadmin' && userRole !== 'company_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email, role, companyId } = await req.json();

        if (!email || !role || !companyId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Role hierarchies
        if (userRole === 'company_admin' && role !== 'recruiter') {
            return NextResponse.json({ error: 'Company Admins can only create Recruiters' }, { status: 403 });
        }

        if (userRole === 'company_admin' && (session as any).user.companyId !== companyId) {
            return NextResponse.json({ error: 'Cannot create user for a different company' }, { status: 403 });
        }

        // 1. Create in Cognito
        const cognitoSub = await createCognitoUser(email, role);

        // 2. Save in Postgres (id will be set by the backend S3 onboarding flow;
        //    this route handles direct DB inserts where the caller may supply an id,
        //    or we fall back to a generated slug for frontend-only creation)
        const userId = `${role}-${crypto.randomBytes(4).toString('hex')}`;

        const result = await pool.query(
            `INSERT INTO users (id, cognito_sub, email, role, company_id)
             VALUES ($1, $2, $3, $4::\"Role\", $5)
             RETURNING id, cognito_sub AS "cognitoSub", email, role, company_id AS "companyId", created_at AS "createdAt"`,
            [userId, cognitoSub, email, role, companyId]
        );

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error: any) {
        console.error('Failed to create user:', error);
        if (error.code === '23505') {
            return NextResponse.json({ error: 'User with this email already exists in Database.' }, { status: 400 });
        }
        if (error.name === 'UsernameExistsException') {
            return NextResponse.json({ error: 'User already exists in Cognito.' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const companyId = (session as any)?.user?.companyId;

        if (!session || !companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await pool.query(
            `SELECT id, cognito_sub AS "cognitoSub", email, role, company_id AS "companyId", created_at AS "createdAt"
             FROM users
             WHERE company_id = $1
             ORDER BY created_at DESC`,
            [companyId]
        );

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
