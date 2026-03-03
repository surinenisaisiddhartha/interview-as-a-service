import React from 'react';

// Simple placeholder for line charts
interface LineChartProps {
    data: any[];
    height?: number;
}

export function LineChart({ height = 300 }: LineChartProps) {
    return (
        <div
            className="flex items-center justify-center bg-indigo-50/20 rounded-xl p-4 border border-indigo-100 text-indigo-400 font-medium text-sm"
            style={{ height }}
        >
            Line Chart Widget Placeholder
        </div>
    );
}
