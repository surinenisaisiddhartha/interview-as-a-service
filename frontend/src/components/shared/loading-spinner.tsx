import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 24, className = '' }: { size?: number; className?: string }) {
    return <Loader2 className={`animate-spin text-blue-600 ${className}`} size={size} />;
}
