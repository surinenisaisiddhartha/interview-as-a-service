'use client';

import React, { useState } from 'react';
import { DataTable } from '@/components/ui/datatable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MOCK_COMPANIES } from '@/data/mockData';
import { Search, Filter, Plus, MoreHorizontal } from 'lucide-react';
import { Company } from '@/types';
import { useRouter } from 'next/navigation';

export default function SuperAdminCompanies() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    const columns = [
        {
            header: 'Company Name', accessor: (c: Company) => (
                <div className="font-semibold text-gray-900">{c.name}</div>
            )
        },
        { header: 'Admins', accessor: (c: Company) => c.adminCount },
        { header: 'AI Agents', accessor: (c: Company) => c.agentCount },
        { header: 'Total Interviews', accessor: (c: Company) => c.interviewsCount },
        {
            header: 'AI Usage', accessor: (c: Company) => (
                <div className="flex items-center">
                    <div className="w-24 bg-gray-100 h-2 rounded-full mr-2 overflow-hidden">
                        <div className="bg-blue-600 h-full" style={{ width: c.aiUsage }}></div>
                    </div>
                    <span className="text-xs font-medium text-gray-500">{c.aiUsage}</span>
                </div>
            )
        },
        {
            header: 'Plan', accessor: (c: Company) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
                        c.plan === 'Pro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {c.plan}
                </span>
            )
        },
        {
            header: 'Status', accessor: (c: Company) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {c.status.toUpperCase()}
                </span>
            )
        },
        {
            header: '', accessor: () => (
                <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
                    <p className="text-gray-500">Manage all organizations on the HireSphere platform.</p>
                </div>
                <Button>
                    <Plus className="w-4 h-4 mr-2" /> Add New Company
                </Button>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search companies by name or ID..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                                <Filter className="w-4 h-4 mr-2" /> Filters
                            </Button>
                            <Button variant="outline" size="sm">Export CSV</Button>
                        </div>
                    </div>
                </CardContent>
                <DataTable
                    columns={columns}
                    data={MOCK_COMPANIES.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))}
                    onRowClick={(c) => router.push(`/super-admin/companies/${c.id}`)}
                />
            </Card>
        </div>
    );
}
