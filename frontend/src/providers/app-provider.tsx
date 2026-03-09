'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/providers/auth-provider';

import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AuthProvider>
                {children}
                <Toaster position="top-right" />
            </AuthProvider>
        </SessionProvider>
    );
}
