'use client';

import { DashboardLayout } from '@/layouts/dashboard-layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600 font-medium">Authenticating...</p>
                </div>
            </div>
        );
    }

    if (!session) return null;

    return <DashboardLayout>{children}</DashboardLayout>;
}
