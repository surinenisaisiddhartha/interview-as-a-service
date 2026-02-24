'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metriccard';
import { Brain, Zap, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';

const usageData = [
    { name: '00:00', tokens: 400 },
    { name: '04:00', tokens: 300 },
    { name: '08:00', tokens: 800 },
    { name: '12:00', tokens: 1200 },
    { name: '16:00', tokens: 1500 },
    { name: '20:00', tokens: 1100 },
    { name: '23:59', tokens: 600 },
];

const modelDistribution = [
    { name: 'gemini-3-flash', value: 65, color: '#2563eb' },
    { name: 'gemini-2.5-flash', value: 25, color: '#4f46e5' },
    { name: 'gemini-3-pro', value: 10, color: '#9333ea' },
];

export default function SuperAdminAIAnalytics() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Intelligence Analytics</h1>
                <p className="text-gray-500">Advanced metrics on LLM performance and token distribution.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total AI Calls" value="1.2M" icon={Zap} color="indigo" />
                <MetricCard label="Avg. Eval Time" value="1.4s" icon={Clock} color="blue" />
                <MetricCard label="Failure Rate" value="0.04%" icon={AlertTriangle} color="red" />
                <MetricCard label="Token Efficiency" value="98.2%" icon={TrendingUp} color="green" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader title="Real-time Token Usage" subtitle="Global token consumption in the last 24 hours" />
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={usageData}>
                                <defs>
                                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="tokens" stroke="#4f46e5" fillOpacity={1} fill="url(#colorTokens)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title="Model Distribution" subtitle="API calls per selected LLM model" />
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={modelDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                    {modelDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader title="Agent Performance Matrix" />
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Intent Accuracy</p>
                            <p className="text-2xl font-black text-gray-900">94.8%</p>
                            <div className="w-full bg-gray-200 h-1.5 mt-3 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full w-[94.8%]"></div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bias Detection Score</p>
                            <p className="text-2xl font-black text-gray-900">99.1%</p>
                            <div className="w-full bg-gray-200 h-1.5 mt-3 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full w-[99.1%]"></div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hallucination Index</p>
                            <p className="text-2xl font-black text-gray-900">0.21%</p>
                            <div className="w-full bg-gray-200 h-1.5 mt-3 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 h-full w-[10%]"></div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
