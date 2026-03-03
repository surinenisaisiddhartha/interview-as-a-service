import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { createCognitoUser } from '@/lib/cognito';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        // In production, ensure session user is either superadmin or company_admin
        const userRole = (session as any)?.user?.role;

        if (!session || (userRole !== 'superadmin' && userRole !== 'company_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email, role, companyId } = await req.json();

        if (!email || !role || !companyId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Role hierarchies: SuperAdmins can create Company Admins. Company Admins can create Recruiters.
        if (userRole === 'company_admin' && role !== 'recruiter') {
            return NextResponse.json({ error: 'Company Admins can only create Recruiters' }, { status: 403 });
        }

        if (userRole === 'company_admin' && (session as any).user.companyId !== companyId) {
            return NextResponse.json({ error: 'Cannot create user for a different company' }, { status: 403 });
        }

        // 1. Create in Cognito
        const cognitoSub = await createCognitoUser(email, role);

        // 2. Save in Postgres
        const dbUser = await prisma.user.create({
            data: {
                cognitoSub,
                email,
                role,
                companyId
            }
        });

        return NextResponse.json(dbUser, { status: 201 });
    } catch (error: any) {
        console.error('Failed to create user:', error);
        if (error.code === 'P2002') {
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
        const userRole = (session as any)?.user?.role;
        const companyId = (session as any)?.user?.companyId;

        // Ensure user is authorized
        if (!session || !companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Company Admins and Recruiters can view users in their company (though recruiters might have limited view)
        // For now, if they have a companyId, fetch users for that company
        const users = await prisma.user.findMany({
            where: {
                companyId: companyId
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
