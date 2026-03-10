import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<any> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const min_score = searchParams.get('min_score');
        const status = searchParams.get('status');
        const top_n = searchParams.get('top_n');

        let backendUrl = `http://localhost:8000/matches/job/${id}?`;
        if (min_score) backendUrl += `min_score=${min_score}&`;
        if (status) backendUrl += `status=${status}&`;
        if (top_n) backendUrl += `top_n=${top_n}&`;

        // Forward to python backend matching service
        const backendRes = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!backendRes.ok) {
            // It's possible there are no matches yet, which the backend might return as 404
            if (backendRes.status === 404) {
                return NextResponse.json({ candidates: [] });
            }
            const errData = await backendRes.json().catch(() => ({}));
            return NextResponse.json({ error: errData.detail || 'Failed to fetch matches' }, { status: backendRes.status });
        }

        const data = await backendRes.json();

        // Transform the results list to the format expected by the frontend results state
        // The frontend results state is currently a map: { [candidate_id]: candidate_data }
        const matchMap: Record<string, any> = {};
        if (data.candidates && Array.isArray(data.candidates)) {
            data.candidates.forEach((c: any) => {
                matchMap[c.candidate_id] = c;
            });
        }

        return NextResponse.json({ match_data: matchMap });
    } catch (error) {
        console.error('Failed to proxy fetch matches:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
