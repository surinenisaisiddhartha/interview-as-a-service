import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: string;
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

const variants = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    neutral: 'bg-gray-100 text-gray-700',
};

export function StatusBadge({ status, variant = 'neutral' }: StatusBadgeProps) {
    return (
        <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider', variants[variant])}>
            {status}
        </span>
    );
}
