import React from 'react';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: { value: string; label: string }[];
    error?: string;
}

export function FormSelect({ label, options, error, className = '', ...props }: FormSelectProps) {
    return (
        <div className="flex flex-col mb-4">
            <label className="text-sm font-bold text-gray-700 mb-1.5">{label}</label>
            <select
                className={`px-4 py-2 border bg-white rounded-xl text-sm outline-none transition-shadow ${error ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-blue-500'
                    } ${className}`}
                {...props}
            >
                <option value="" disabled>Select {label}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
        </div>
    );
}
