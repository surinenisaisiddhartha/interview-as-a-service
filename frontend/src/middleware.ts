import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Role required per URL prefix.
 * Middleware checks the `hireSphere_role` cookie set by AuthProvider on login.
 */
const PROTECTED_ROUTES: Record<string, string> = {
    '/super-admin': 'SUPER_ADMIN',
    '/admin': 'ADMIN',
    '/recruiter': 'RECRUITER',
};

/** Where each role lands after login */
const ROLE_DASHBOARDS: Record<string, string> = {
    SUPER_ADMIN: '/super-admin/dashboard',
    ADMIN: '/admin/dashboard',
    RECRUITER: '/recruiter/dashboard',
};

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const role = request.cookies.get('hireSphere_role')?.value;

    // Determine which protected prefix this route belongs to
    const matchedPrefix = Object.keys(PROTECTED_ROUTES).find(
        (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
    );

    // Not a protected route — allow through
    if (!matchedPrefix) return NextResponse.next();

    // Not logged in → redirect to login with return URL
    if (!role) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    const requiredRole = PROTECTED_ROUTES[matchedPrefix];

    // Wrong role → redirect to their own dashboard
    if (role !== requiredRole) {
        const dashboard = ROLE_DASHBOARDS[role];
        if (dashboard) {
            return NextResponse.redirect(new URL(dashboard, request.url));
        }
        // Unknown role → back to login
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/super-admin/:path*', '/admin/:path*', '/recruiter/:path*'],
};
