'use client';

import React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { DataTable } from '@/components/ui/datatable';
import { Button } from '@/components/ui/button';
import { MOCK_INTERVIEWS } from '@/data/mockData';
import { Search, Filter, FileText, ExternalLink } from 'lucide-react';
import { Interview } from '@/types';

export default function SuperAdminInterviews() {
    const columns = [
        {
            header: 'Candidate', accessor: (i: Interview) => (
                <div>
                    <div className="font-semibold text-gray-900">{i.candidateName}</div>
                    <div className="text-xs text-gray-500">{i.jobRole}</div>
                </div>
            )
        },
        { header: 'Company', accessor: (i: Interview) => i.companyName },
        { header: 'Agent', accessor: (i: Interview) => i.agentName },
        {
            header: 'Score', accessor: (i: Interview) => (
                <div className={`font-bold ${i.aiScore >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                    {i.aiScore > 0 ? i.aiScore : 'N/A'}
                </div>
            )
        },
        {
            header: 'Status', accessor: (i: Interview) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${i.status === 'completed' ? 'bg-green-100 text-green-700' :
                        i.status === 'failed' ? 'bg-red-100 text-red-700' :
                            i.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {i.status}
                </span>
            )
        },
        { header: 'Date', accessor: (i: Interview) => i.date },
        {
            header: '', accessor: () => (
                <div className="flex space-x-2">
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <FileText className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded">
                        <ExternalLink className="w-4 h-4" />
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Global Interviews</h1>
                    <p className="text-gray-500">Monitor all interview sessions across the platform.</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filters</Button>
                    <Button>Export Data</Button>
                </div>
            </div>

            <Card>
                <CardHeader title="Session Logs" action={
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Search by candidate or company..." className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm outline-none w-64" />
                    </div>
                } />
                <DataTable columns={columns} data={MOCK_INTERVIEWS} />
            </Card>
        </div>
    );
}
