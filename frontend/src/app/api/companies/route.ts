import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Only Super Admins can create companies
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        // In actual production, ensure session role is strictly checked
        if (!session || (session as any).user?.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
        }

        const company = await prisma.company.create({
            data: { name }
        });

        return NextResponse.json(company, { status: 201 });
    } catch (error: any) {
        console.error('Failed to create company:', error.message);
        // Handle Prisma unique constraint violation
        if (error.code === 'P2002') {
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

        const companies = await prisma.company.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(companies);
    } catch (error) {
        console.error('Failed to fetch companies:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
