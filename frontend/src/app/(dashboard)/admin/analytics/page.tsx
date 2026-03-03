'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metriccard';
import { TrendingUp, Users, CheckCircle, Clock, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const scoreDistribution = [
    { range: '0-40', count: 12 },
    { range: '41-60', count: 45 },
    { range: '61-80', count: 120 },
    { range: '81-100', count: 88 },
];
const genderDiversity = [
    { name: 'Male', value: 55, color: '#3b82f6' },
    { name: 'Female', value: 42, color: '#ec4899' },
    { name: 'Other', value: 3, color: '#8b5cf6' },
];

export default function AdminAnalytics() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Talent Analytics</h1>
                    <p className="text-gray-500">Deep dive into recruitment performance and candidate metrics for TechCorp.</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Date Range</Button>
                    <Button>Download Report</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Applicants" value="1,420" icon={Users} color="blue" />
                <MetricCard label="Interviews Done" value="265" icon={CheckCircle} color="green" />
                <MetricCard label="Avg. Response" value="48h" icon={Clock} color="indigo" />
                <MetricCard label="Hiring Velocity" value="+12%" icon={TrendingUp} color="orange" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader title="Candidate Score Distribution" subtitle="Technical assessment scores across all departments" />
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scoreDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="range" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader title="Pipeline Diversity" subtitle="Gender distribution based on resume parsing" />
                    <CardContent className="h-80 flex flex-col items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={genderDiversity} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {genderDiversity.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center space-x-4 mt-2">
                            {genderDiversity.map(d => (
                                <div key={d.name} className="flex items-center">
                                    <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: d.color }}></div>
                                    <span className="text-[10px] text-gray-500 font-medium">{d.name} ({d.value}%)</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader title="Hiring Progress" />
                <CardContent>
                    <div className="space-y-6">
                        {[
                            { label: 'Engineering', count: 120, target: 150, color: 'bg-blue-600' },
                            { label: 'Product', count: 45, target: 50, color: 'bg-indigo-600' },
                            { label: 'Design', count: 18, target: 40, color: 'bg-purple-600' },
                            { label: 'Marketing', count: 32, target: 35, color: 'bg-orange-600' },
                        ].map(dept => (
                            <div key={dept.label}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-gray-900">{dept.label}</span>
                                    <span className="text-xs text-gray-500">{dept.count} / {dept.target} Hires</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className={`${dept.color} h-full`} style={{ width: `${(dept.count / dept.target) * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
