'use client';

import React from 'react';
import { MetricCard } from '@/components/ui/metriccard';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Building2, Users, Microscope, BrainCircuit, Activity, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const data = [
    { name: 'Mon', interviews: 40 },
    { name: 'Tue', interviews: 30 },
    { name: 'Wed', interviews: 60 },
    { name: 'Thu', interviews: 45 },
    { name: 'Fri', interviews: 90 },
    { name: 'Sat', interviews: 20 },
    { name: 'Sun', interviews: 15 },
];

const companyData = [
    { name: 'TechCorp', value: 450 },
    { name: 'DevSol', value: 300 },
    { name: 'BioGen', value: 200 },
    { name: 'RetailX', value: 150 },
];

const outcomeData = [
    { name: 'Pass', value: 65, color: '#10b981' },
    { name: 'Fail', value: 25, color: '#ef4444' },
    { name: 'Partial', value: 10, color: '#f59e0b' },
];

export default function SuperAdminOverview() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
                    <p className="text-gray-500">Real-time health and performance metrics for HireSphere.</p>
                </div>
                <div className="flex space-x-3">
                    <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm flex items-center text-gray-600">
                        <Activity className="w-4 h-4 mr-2 text-green-500" />
                        System Live
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Companies" value="242" icon={Building2} trend={{ value: 12, isUp: true }} color="blue" />
                <MetricCard label="Active Agents" value="18" icon={BrainCircuit} trend={{ value: 2, isUp: true }} color="indigo" />
                <MetricCard label="Interviews Today" value="1,240" icon={Microscope} trend={{ value: 8, isUp: true }} color="green" />
                <MetricCard label="Avg AI Score" value="72.4" icon={TrendingUp} trend={{ value: 1.4, isUp: true }} color="purple" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader title="Interview Volume Trend" subtitle="Daily interview completions across platform" />
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="interviews" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title="Top Companies by Usage" subtitle="Interviews processed this month" />
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={companyData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader title="Outcome Distribution" />
                    <CardContent className="h-64 flex flex-col items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={outcomeData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {outcomeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center space-x-4 mt-4">
                            {outcomeData.map((d) => (
                                <div key={d.name} className="flex items-center">
                                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: d.color }}></div>
                                    <span className="text-xs text-gray-500">{d.name} ({d.value}%)</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader title="Live Activity Feed" action={<span className="text-xs text-blue-600 font-medium cursor-pointer">View All</span>} />
                    <div className="divide-y divide-gray-100">
                        {[
                            { type: 'completed', text: 'Interview #4203 completed by Aurora AI for TechCorp', time: '2 min ago', icon: CheckCircle2, color: 'text-green-500' },
                            { type: 'alert', text: 'AI Agent "Vision Pro" latency spike detected', time: '5 min ago', icon: AlertCircle, color: 'text-orange-500' },
                            { type: 'created', text: 'New company "RetailX" joined the platform', time: '12 min ago', icon: Building2, color: 'text-blue-500' },
                            { type: 'started', text: 'John Doe started interview for Senior React Developer', time: '15 min ago', icon: Microscope, color: 'text-indigo-500' },
                        ].map((activity, idx) => (
                            <div key={idx} className="px-6 py-4 flex items-start space-x-4">
                                <div className={`mt-1 ${activity.color}`}>
                                    <activity.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900 font-medium">{activity.text}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
