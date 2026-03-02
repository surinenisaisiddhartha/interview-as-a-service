import React from 'react';

// Using a basic div placeholder until recharts is fully configured
interface BarChartProps {
    data: any[];
    xKey: string;
    yKey: string;
    height?: number;
}

export function BarChart({ data, xKey, yKey, height = 300 }: BarChartProps) {
    return (
        <div
            className="flex items-end justify-between bg-blue-50/20 rounded-xl p-4 border border-blue-100"
            style={{ height }}
        >
            {data.map((item, i) => (
                <div key={i} className="flex flex-col items-center flex-1 mx-1 group">
                    <div className="w-full bg-blue-500 rounded-t-md group-hover:bg-blue-600 transition-colors"
                        style={{ height: `${(item[yKey] / Math.max(...data.map(d => d[yKey]))) * 100}%` }} />
                    <span className="text-[10px] text-gray-500 mt-2 truncate w-full text-center">{item[xKey]}</span>
                </div>
            ))}
        </div>
    );
}
