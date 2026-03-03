import React from 'react';
import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: React.ElementType;
    action?: React.ReactNode;
}

export function EmptyState({ title, description, icon: Icon = FileQuestion, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 mb-4">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">{description}</p>
            {action}
        </div>
    );
}
