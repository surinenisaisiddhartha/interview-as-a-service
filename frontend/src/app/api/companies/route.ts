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

        // Proxy the creation request to the Python Backend
        // This ensures the backend creates the S3 folder structure first, generates the id,
        // and inserts the row into Postgres natively.
        const backendRes = await fetch('http://localhost:8000/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_name: name })
        });

        if (!backendRes.ok) {
            const errorData = await backendRes.json().catch(() => ({}));
            console.error('Backend returned error:', errorData);
            if (backendRes.status === 400 && errorData.detail?.includes('exists')) {
                return NextResponse.json({ error: 'Company name already exists' }, { status: 400 });
            }
            return NextResponse.json({ error: errorData.detail || 'Failed to create company via Backend' }, { status: backendRes.status });
        }

        const data = await backendRes.json();

        // After backend succeeds, we'll return its response out to the frontend client.
        // It returns { "company_id": "test-corp-abcd" }. Let's map it to match UI expectations if necessary.
        return NextResponse.json({ id: data.company_id, name: name }, { status: 201 });

    } catch (error: any) {
        console.error('Failed to create company:', error.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session as any).user?.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Proxy to the Python FastAPI backend
        // This ensures we get the companies including their assigned agents
        const backendRes = await fetch('http://localhost:8000/companies', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!backendRes.ok) {
            console.error('FastAPI Backend returned error for GET /companies');
            return NextResponse.json({ error: 'Failed to fetch companies from backend' }, { status: backendRes.status });
        }

        const data = await backendRes.json();

        // Match frontend expected naming (e.g. createdAt instead of created_at)
        // Note: The FastAPI backend currently returns created_at if included. 
        // Let's ensure consistency if we want it displayed.
        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch companies:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
