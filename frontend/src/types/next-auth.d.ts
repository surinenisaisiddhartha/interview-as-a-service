import "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role: 'superadmin' | 'company_admin' | 'recruiter';
            companyId?: string | null;
        }
    }

    interface User {
        id: string;
        email?: string | null;
        cognitoGroups?: string[];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        userId: string;
        role: 'superadmin' | 'company_admin' | 'recruiter';
        companyId?: string | null;
    }
}
