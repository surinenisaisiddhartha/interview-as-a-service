'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DataTable } from '@/components/ui/datatable';
import { Button } from '@/components/ui/button';
import { MOCK_AGENTS } from '@/data/mockData';
import { BrainCircuit, Search, Plus, Zap, Activity } from 'lucide-react';
import { Agent } from '@/types';

export default function SuperAdminAgents() {
    const columns = [
        {
            header: 'Agent Name', accessor: (a: Agent) => (
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <BrainCircuit className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-gray-900">{a.name}</span>
                </div>
            )
        },
        { header: 'Type', accessor: (a: Agent) => a.type },
        { header: 'Companies', accessor: (a: Agent) => a.assignedCompanies },
        { header: 'Total Int.', accessor: (a: Agent) => a.totalInterviews },
        {
            header: 'Failure Rate', accessor: (a: Agent) => (
                <span className={parseFloat(a.failureRate) > 2 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                    {a.failureRate}
                </span>
            )
        },
        { header: 'Avg Duration', accessor: (a: Agent) => a.avgDuration },
        {
            header: 'Status', accessor: (a: Agent) => (
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${a.status === 'online' ? 'bg-green-100 text-green-700' :
                        a.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {a.status}
                </span>
            )
        },
        {
            header: 'Actions', accessor: () => (
                <Button variant="ghost" size="sm">Configure</Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
                    <p className="text-gray-500">Manage and monitor global AI interview agents.</p>
                </div>
                <Button>
                    <Plus className="w-4 h-4 mr-2" /> Deploy New Agent
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-indigo-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Zap className="w-8 h-8 opacity-50" />
                            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">High Performance</span>
                        </div>
                        <p className="text-indigo-100 text-sm font-medium">Platform Capacity</p>
                        <h3 className="text-3xl font-bold">12.5k <span className="text-lg font-normal">calls/hr</span></h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Activity className="w-8 h-8 text-green-500" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Avg Latency</p>
                        <h3 className="text-3xl font-bold text-gray-900">184ms</h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <BrainCircuit className="w-8 h-8 text-blue-500" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Global Tokens Usage</p>
                        <h3 className="text-3xl font-bold text-gray-900">4.2M</h3>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader title="All Agents" action={
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Search agents..." className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm outline-none w-48 focus:w-64 transition-all" />
                    </div>
                } />
                <DataTable columns={columns} data={MOCK_AGENTS} />
            </Card>
        </div>
    );
}
