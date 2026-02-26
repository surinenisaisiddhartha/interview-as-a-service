import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export function FormInput({ label, error, className = '', ...props }: FormInputProps) {
    return (
        <div className="flex flex-col mb-4">
            <label className="text-sm font-bold text-gray-700 mb-1.5">{label}</label>
            <input
                className={`px-4 py-2 border rounded-xl text-sm outline-none transition-shadow ${error ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-blue-500'
                    } ${className}`}
                {...props}
            />
            {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
        </div>
    );
}
