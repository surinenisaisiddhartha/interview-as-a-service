import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userRole = (session as any).user.role;
        const userCompanyId = (session as any).user.companyId;

        // Fetch jobs from database.
        let query = `
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
        `;

        let params: any[] = [];

        // If the user is a company admin or recruiter, they should only see their company's roles.
        if (userRole !== 'superadmin' && userCompanyId) {
            query += ` WHERE j.company_name = $1`;
            params.push(userCompanyId);
        }

        query += ` ORDER BY j.created_at DESC`;

        const result = await pool.query(query, params);

        const mappedJobs = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            // Fallback to the parsed company_name if the resolved join fails
            companyName: row.resolvedCompanyName || row.companyName || 'Unknown company',
            clientCompany: row.clientCompany,
            companyId: row.companyId || '',
            s3Link: row.s3Link,
            status: 'active', // Mocking active status as there is no status prop right now
            skills: Array.isArray(row.requiredSkills) ? row.requiredSkills : [],
            createdAt: row.createdAt
        }));

        return NextResponse.json(mappedJobs);
    } catch (error) {
        console.error('Failed to fetch JDs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
