'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { MOCK_COMPANIES, MOCK_INTERVIEWS, MOCK_USERS } from '@/data/mockData';
import { ChevronLeft, Building2, Users, Microscope, BarChart3, BrainCircuit } from 'lucide-react';
import { DataTable } from '@/components/ui/datatable';

export default function CompanyDetail() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const company = MOCK_COMPANIES.find(c => c.id === id);

    if (!company) return <div>Company not found</div>;

    const tabs = [
        {
            id: 'overview',
            label: 'Overview',
            content: (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2">
                        <CardHeader title="Organization Info" />
                        <CardContent className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Company Name</p>
                                <p className="font-bold text-gray-900">{company.name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Plan Level</p>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-black rounded uppercase">{company.plan}</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Joined Date</p>
                                <p className="font-bold text-gray-900">{company.createdAt}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-black rounded uppercase">{company.status}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader title="AI Capacity" />
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-gray-500">Token Usage</span>
                                    <span className="text-blue-600">{company.aiUsage}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full" style={{ width: company.aiUsage }}></div>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs font-bold text-gray-500 mb-1">Interviews Remaining</p>
                                <p className="text-xl font-black text-gray-900">4,250</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        },
        {
            id: 'users',
            label: 'Admins & Recruiters',
            content: (
                <Card>
                    <DataTable
                        columns={[
                            { header: 'Name', accessor: 'name' as keyof typeof MOCK_USERS[0] },
                            { header: 'Email', accessor: 'email' as keyof typeof MOCK_USERS[0] },
                            { header: 'Role', accessor: 'role' as keyof typeof MOCK_USERS[0] },
                            { header: 'Status', accessor: 'status' as keyof typeof MOCK_USERS[0] },
                        ]}
                        data={MOCK_USERS.filter(u => u.companyId === id)}
                    />
                </Card>
            )
        },
        {
            id: 'interviews',
            label: 'Sessions',
            content: (
                <Card>
                    <DataTable
                        columns={[
                            { header: 'Candidate', accessor: 'candidateName' as keyof typeof MOCK_INTERVIEWS[0] },
                            { header: 'Role', accessor: 'jobRole' as keyof typeof MOCK_INTERVIEWS[0] },
                            { header: 'Agent', accessor: 'agentName' as keyof typeof MOCK_INTERVIEWS[0] },
                            { header: 'Score', accessor: 'aiScore' as keyof typeof MOCK_INTERVIEWS[0] },
                            { header: 'Status', accessor: 'status' as keyof typeof MOCK_INTERVIEWS[0] },
                        ]}
                        data={MOCK_INTERVIEWS.filter(i => i.companyId === id)}
                    />
                </Card>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/super-admin/companies')}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> All Companies
                </Button>
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                        <p className="text-xs text-gray-500">Org ID: {company.id}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center space-x-4">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Users className="w-5 h-5" /></div>
                    <div><p className="text-xs text-gray-500 font-bold">Admins</p><p className="font-black">{company.adminCount}</p></div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center space-x-4">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><BrainCircuit className="w-5 h-5" /></div>
                    <div><p className="text-xs text-gray-500 font-bold">AI Agents</p><p className="font-black">{company.agentCount}</p></div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center space-x-4">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600"><Microscope className="w-5 h-5" /></div>
                    <div><p className="text-xs text-gray-500 font-bold">Interviews</p><p className="font-black">{company.interviewsCount}</p></div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center space-x-4">
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><BarChart3 className="w-5 h-5" /></div>
                    <div><p className="text-xs text-gray-500 font-bold">Usage</p><p className="font-black">{company.aiUsage}</p></div>
                </div>
            </div>

            <Tabs tabs={tabs} />
        </div>
    );
}
