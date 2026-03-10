import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
    req: Request,
    { params }: { params: any }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { companyId, userId, jdId } = await params;

        // Security check
        const userCompanyId = (session as any)?.user?.companyId;
        const userRole = (session as any)?.user?.role;

        if (userRole !== 'superadmin' && userCompanyId !== companyId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const formData = await req.formData();

        // Proxy to Python Backend
        const backendRes = await fetch(`http://localhost:8000/companies/${companyId}/users/${userId}/jds/${jdId}/resumes`, {
            method: 'POST',
            body: formData,
        });

        if (!backendRes.ok) {
            const errorText = await backendRes.text();
            console.error('Backend upload Resumes error:', errorText);
            return NextResponse.json({ error: 'Failed to upload resumes to backend.' }, { status: backendRes.status });
        }

        const backendData = await backendRes.json();

        return NextResponse.json(backendData, { status: 201 });
    } catch (error: any) {
        console.error('Failed to upload resumes:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
