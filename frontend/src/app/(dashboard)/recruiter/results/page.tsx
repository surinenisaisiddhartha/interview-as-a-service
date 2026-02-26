'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metriccard';
import { MOCK_INTERVIEWS } from '@/data/mockData';
import { TrendingUp, Users, ClipboardList, Clock, Search, Filter, Eye } from 'lucide-react';
import { DataTable } from '@/components/ui/datatable';
import { Button } from '@/components/ui/button';
import { Interview } from '@/types';

export default function ResultsListPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const basePath = pathname.startsWith('/admin') ? '/admin' : '/recruiter';
    const interviews = MOCK_INTERVIEWS.filter(i => i.status === 'completed' || i.status === 'failed');

    const filteredInterviews = interviews.filter(i => {
        const matchesSearch = i.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.jobRole.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const columns = [
        {
            header: 'Candidate Name', accessor: (i: Interview) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{i.candidateName}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{i.date}</span>
                </div>
            )
        },
        { header: 'JD Role', accessor: (i: Interview) => i.jobRole },
        { header: 'Agent Used', accessor: (i: Interview) => i.agentName },
        { header: 'Duration', accessor: (i: Interview) => i.duration },
        {
            header: 'Overall Score', accessor: (i: Interview) => (
                <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${i.aiScore >= 80 ? 'bg-green-500' : i.aiScore >= 60 ? 'bg-blue-500' : 'bg-red-500'}`}
                            style={{ width: `${i.aiScore}%` }}></div>
                    </div>
                    <span className="font-bold text-sm text-gray-900">{i.aiScore}%</span>
                </div>
            )
        },
        {
            header: 'Status', accessor: (i: Interview) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${i.aiScore >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {i.aiScore >= 75 ? 'Passed' : 'Failed'}
                </span>
            )
        },
        {
            header: 'Action', accessor: (i: Interview) => (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`${basePath}/results/${i.id}`); }}>
                    <Eye className="w-4 h-4 mr-1" /> View
                </Button>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Interview Results</h1>
                <p className="text-gray-500">Analyze AI-driven evaluation outcomes for screened candidates.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Screened" value={interviews.length} icon={Users} color="blue" />
                <MetricCard label="Pass Rate" value="68%" icon={TrendingUp} color="green" />
                <MetricCard label="Avg. Score" value="74.2" icon={ClipboardList} color="indigo" />
                <MetricCard label="Pending Review" value="5" icon={Clock} color="orange" />
            </div>

            <Card>
                <CardHeader title="Candidate Screening Registry" />
                <CardContent className="p-0">
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search candidates or roles..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <select
                                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                            </select>
                            <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> More Filters</Button>
                        </div>
                    </div>
                    <DataTable
                        columns={columns}
                        data={filteredInterviews}
                        onRowClick={(i) => router.push(`${basePath}/results/${i.id}`)}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
