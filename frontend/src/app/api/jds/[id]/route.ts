import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
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
        const userRole = (session as any).user.role;
        const userCompanyId = (session as any).user.companyId;

        // Fetch job from database.
        const query = `
            SELECT 
                j.s3_job_id AS id,
                j.title,
                j.company_name AS "companyName",
                j.client_company AS "clientCompany",
                j.s3_link AS "s3Link",
                j.created_at AS "createdAt",
                j.required_skills AS "requiredSkills",
                c.id AS "companyId",
                c.name AS "resolvedCompanyName"
            FROM jobs j
            LEFT JOIN companies c ON j.company_name = c.id
            WHERE j.s3_job_id = $1
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        const row = result.rows[0];

        // Security check: recruiters can only see their own company's jobs
        if (userRole !== 'superadmin' && row.companyName !== userCompanyId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const job = {
            id: row.id,
            title: row.title,
            companyName: row.resolvedCompanyName || row.companyName || 'Unknown company',
            clientCompany: row.clientCompany,
            companyId: row.companyId || '',
            s3Link: row.s3Link,
            status: 'active',
            skills: Array.isArray(row.requiredSkills) ? row.requiredSkills : [],
            createdAt: row.createdAt
        };

        return NextResponse.json(job);
    } catch (error) {
        console.error('Failed to fetch JD:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
