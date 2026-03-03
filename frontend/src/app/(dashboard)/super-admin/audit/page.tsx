'use client';

import React, { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { DataTable } from '@/components/ui/datatable';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download, ShieldAlert } from 'lucide-react';

const MOCK_LOGS = [
    { id: 'l1', action: 'Login Success', user: 'super@hiresphere.com', company: 'HireSphere', module: 'Auth', timestamp: '2024-05-24 10:20:05' },
    { id: 'l2', action: 'Company Created', user: 'super@hiresphere.com', company: 'RetailX', module: 'Companies', timestamp: '2024-05-24 09:15:22' },
    { id: 'l3', action: 'Agent Maintenance Start', user: 'System', company: 'Global', module: 'Agents', timestamp: '2024-05-23 23:00:00' },
    { id: 'l4', action: 'Password Change', user: 'admin@techcorp.com', company: 'TechCorp', module: 'Users', timestamp: '2024-05-23 14:10:45' },
    { id: 'l5', action: 'API Key Rotated', user: 'super@hiresphere.com', company: 'HireSphere', module: 'Settings', timestamp: '2024-05-23 11:05:12' },
];

export default function AuditLogs() {
    const [searchTerm, setSearchTerm] = useState('');

    const columns = [
        {
            header: 'Action', accessor: (l: typeof MOCK_LOGS[0]) => (
                <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-gray-900">{l.action}</span>
                </div>
            )
        },
        { header: 'User', accessor: (l: typeof MOCK_LOGS[0]) => l.user },
        { header: 'Company', accessor: (l: typeof MOCK_LOGS[0]) => l.company },
        { header: 'Module', accessor: (l: typeof MOCK_LOGS[0]) => <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{l.module}</span> },
        { header: 'Timestamp', accessor: (l: typeof MOCK_LOGS[0]) => l.timestamp },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
                    <p className="text-gray-500">Security and activity tracking across the entire platform.</p>
                </div>
                <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export Logs</Button>
            </div>

            <Card>
                <CardHeader title="Activity History" action={
                    <div className="flex space-x-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm outline-none w-64 focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="sm"><Filter className="w-4 h-4" /></Button>
                    </div>
                } />
                <DataTable columns={columns} data={MOCK_LOGS} />
            </Card>
        </div>
    );
}
