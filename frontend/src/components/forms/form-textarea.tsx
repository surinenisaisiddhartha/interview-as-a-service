import React from 'react';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    error?: string;
}

export function FormTextarea({ label, error, className = '', ...props }: FormTextareaProps) {
    return (
        <div className="flex flex-col mb-4">
            <label className="text-sm font-bold text-gray-700 mb-1.5">{label}</label>
            <textarea
                className={`px-4 py-3 border rounded-xl text-sm outline-none transition-shadow resize-y min-h-[100px] ${error ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-blue-500'
                    } ${className}`}
                {...props}
            />
            {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
        </div>
    );
}
