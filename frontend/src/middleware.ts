import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // Role-based access: redirect to /login if wrong role
        if (path.startsWith('/super-admin') && token?.role !== 'superadmin') {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        if (path.startsWith('/admin') && token?.role !== 'company_admin' && token?.role !== 'superadmin') {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        if (path.startsWith('/recruiter') && token?.role !== 'recruiter' && token?.role !== 'company_admin' && token?.role !== 'superadmin') {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            // Unauthenticated users are redirected to /login (not /api/auth/signin)
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: '/login',
        },
    }
);

export const config = {
    matcher: [
        "/super-admin/:path*",
        "/admin/:path*",
        "/recruiter/:path*",
    ],
};
