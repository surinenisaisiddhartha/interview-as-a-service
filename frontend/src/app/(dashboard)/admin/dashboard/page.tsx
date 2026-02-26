'use client';

import React from 'react';
import { MetricCard } from '@/components/ui/metriccard';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Users, Microscope, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Wk 1', completed: 45, failed: 5 },
    { name: 'Wk 2', completed: 52, failed: 3 },
    { name: 'Wk 3', completed: 38, failed: 8 },
    { name: 'Wk 4', completed: 65, failed: 2 },
];

export default function CompanyAdminOverview() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">TechCorp Dashboard</h1>
                    <p className="text-gray-500">Welcome back. Here is what&apos;s happening today.</p>
                </div>
                <div className="flex space-x-2">
                    <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                        Last 30 Days
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Recruiters" value="12" icon={Users} trend={{ value: 1, isUp: true }} color="indigo" />
                <MetricCard label="Interviews Completed" value="200" icon={Microscope} trend={{ value: 15, isUp: true }} color="blue" />
                <MetricCard label="Pass Rate" value="68%" icon={CheckCircle2} trend={{ value: 4, isUp: true }} color="green" />
                <MetricCard label="Avg Candidate Score" value="78" icon={TrendingUp} trend={{ value: 2.5, isUp: true }} color="orange" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader title="Hiring Velocity" subtitle="Number of interviews vs failures per week" />
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="completed" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title="Recent Recruiters" />
                    <div className="divide-y divide-gray-100">
                        {[
                            { name: 'Sarah Jenkins', role: 'Technical Recruiter', active: 'Now', color: 'bg-green-100 text-green-700' },
                            { name: 'Mike Ross', role: 'HR Manager', active: '12m ago', color: 'bg-gray-100 text-gray-700' },
                            { name: 'Donna Paulsen', role: 'Senior Recruiter', active: '1h ago', color: 'bg-gray-100 text-gray-700' },
                            { name: 'Harvey Specter', role: 'Hiring Lead', active: '3h ago', color: 'bg-gray-100 text-gray-700' },
                        ].map((user, idx) => (
                            <div key={idx} className="px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                                        {user.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.role}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${user.color}`}>
                                    {user.active}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
