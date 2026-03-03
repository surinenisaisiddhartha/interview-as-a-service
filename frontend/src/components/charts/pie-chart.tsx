import React from 'react';

export function PieChart({ height = 300 }: { height?: number }) {
    return (
        <div
            className="flex items-center justify-center bg-blue-50/20 rounded-xl p-4 border border-blue-100 text-blue-400 font-medium text-sm"
            style={{ height }}
        >
            Pie Chart Widget Placeholder
        </div>
    );
}
