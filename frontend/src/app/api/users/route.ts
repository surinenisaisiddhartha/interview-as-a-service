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

        const { email, role, companyId, name, phone } = await req.json();

        if (!email || !role || !companyId || !name || !phone) {
            return NextResponse.json({ error: 'Missing required fields (email, role, companyId, name, phone)' }, { status: 400 });
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

        // 2. Delegate to Python Backend to create S3 structure and Postgres Record
        const backendRes = await fetch(`http://localhost:8000/companies/${companyId}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                name,
                role,
                phone_number: phone,
                cognito_sub: cognitoSub
            })
        });

        if (!backendRes.ok) {
            const errorText = await backendRes.text();
            console.error('Backend user creation error:', errorText);
            // Optionally, we could attempt to rollback Cognito creation here via a new deleteCognitoUser function.
            // But since createCognitoUser has its own rollback for group assignment failures, it's a start.
            return NextResponse.json({ error: 'Failed to provision user in the backend.' }, { status: backendRes.status });
        }

        const backendData = await backendRes.json();

        return NextResponse.json({
            id: backendData.user_id,
            cognitoSub,
            email,
            role,
            companyId
        }, { status: 201 });
    } catch (error: any) {
        console.error('Failed to create user:', error);
        if (error.name === 'UsernameExistsException') {
            return NextResponse.json({ error: 'User already exists in Cognito.' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session as any)?.user?.role;
        const url = new URL(req.url);
        const queryCompanyId = url.searchParams.get('companyId');

        let targetCompanyId = (session as any)?.user?.companyId;

        if (userRole === 'superadmin' && queryCompanyId) {
            targetCompanyId = queryCompanyId;
        }

        if (!session || !targetCompanyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await pool.query(
            `SELECT id, cognito_sub AS "cognitoSub", email, role, company_id AS "companyId", created_at AS "createdAt", name, phone_number
             FROM users
             WHERE company_id = $1
             ORDER BY created_at DESC`,
            [targetCompanyId]
        );

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
