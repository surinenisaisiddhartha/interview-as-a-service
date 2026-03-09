import NextAuth, { NextAuthOptions } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db";
import { authenticateCognitoUser } from "@/lib/cognito";
import crypto from "crypto";

export const authOptions: NextAuthOptions = {
    providers: [
        CognitoProvider({
            clientId: process.env.COGNITO_CLIENT_ID!,
            clientSecret: process.env.COGNITO_CLIENT_SECRET!,
            issuer: process.env.COGNITO_ISSUER!,
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name ?? profile.email,
                    email: profile.email,
                    image: profile.picture,
                    cognitoGroups: profile['cognito:groups'] || []
                };
            }
        }),
        CredentialsProvider({
            name: 'Email & Password',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                try {
                    const user = await authenticateCognitoUser(
                        credentials.email,
                        credentials.password
                    );
                    return {
                        id: user.sub,
                        email: user.email,
                        cognitoGroups: user.groups,
                    };
                } catch (err: any) {
                    throw new Error(err.message || 'Invalid email or password');
                }
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async jwt({ token, user, profile }) {
            // First time sign-in
            if (user) {
                try {
                    const cognitoSub = user.id;
                    const email = user.email || (profile as any)?.email || 'no-email@hiresphere.local';
                    const groups = (user as any).cognitoGroups as string[] || (profile as any)?.['cognito:groups'] || [];

                    let dbRole: 'superadmin' | 'company_admin' | 'recruiter' = 'recruiter';
                    if (groups.includes('SuperAdmin')) dbRole = 'superadmin';
                    else if (groups.includes('Admin') || groups.includes('CompanyAdmin')) dbRole = 'company_admin';

                    // Sync User to postgres database using raw SQL upsert
                    // id follows the S3 slug pattern: {role}-{hex8}
                    const newUserId = `${dbRole}-${crypto.randomBytes(4).toString('hex')}`;

                    const result = await pool.query(
                        `INSERT INTO users (id, cognito_sub, email, role)
                         VALUES ($1, $2, $3, $4::"Role")
                         ON CONFLICT (email) DO UPDATE
                           SET cognito_sub = EXCLUDED.cognito_sub,
                               role = EXCLUDED.role
                         RETURNING id, role, company_id`,
                        [newUserId, cognitoSub, email, dbRole]
                    );

                    const dbUser = result.rows[0];
                    token.userId = dbUser.id;
                    token.role = dbUser.role;
                    token.companyId = dbUser.company_id;
                } catch (error) {
                    console.error("Error syncing Cognito user to Database:", error);
                    token.error = "DatabaseSyncFailed";
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.userId;
                (session.user as any).role = token.role;
                (session.user as any).companyId = token.companyId;
            }
            return session;
        }
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
