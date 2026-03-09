import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
    req: Request,
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const companyId = formData.get('companyId') as string;
        const userId = formData.get('userId') as string;
        const jdId = formData.get('jdId') as string;

        if (!companyId || !userId || !jdId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Forward to python backend
        const backendRes = await fetch(`http://localhost:8000/companies/${companyId}/users/${userId}/jds/${jdId}/resumes`, {
            method: 'POST',
            body: formData, // Send the same formData which contains the files
        });

        if (!backendRes.ok) {
            const errorData = await backendRes.json().catch(() => ({}));
            return NextResponse.json({ error: errorData.detail || 'Failed to upload resumes to backend' }, { status: backendRes.status });
        }

        const data = await backendRes.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Resume upload proxy error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
