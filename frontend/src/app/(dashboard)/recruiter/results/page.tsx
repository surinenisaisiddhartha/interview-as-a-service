'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metriccard';
import { TrendingUp, Users, ClipboardList, Clock, Search, Filter, Eye, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/ui/datatable';
import { Button } from '@/components/ui/button';
import { retellApi } from '@/services/retell.api';

export default function ResultsListPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const candidateIdFilter = searchParams.get('candidateId');

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [calls, setCalls] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const basePath = pathname.startsWith('/admin') ? '/admin' : '/recruiter';

    useEffect(() => {
        const fetchCalls = async () => {
            setIsLoading(true);
            try {
                let data;
                if (candidateIdFilter) {
                    data = await retellApi.getCallsForCandidate(candidateIdFilter);
                } else {
                    data = await retellApi.getCalls();
                }
                setCalls(data || []);
            } catch (error) {
                console.error("Error fetching calls:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCalls();
    }, [candidateIdFilter]);

    const filteredCalls = calls.filter(c => {
        const name = c.candidate_name || '';
        const role = c.job_title || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            role.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.call_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const columns = [
        {
            header: 'Candidate Name', accessor: (c: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{c.candidate_name || 'Unknown'}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                </div>
            )
        },
        { header: 'JD Role', accessor: (c: any) => c.job_title || 'N/A' },
        {
            header: 'Duration',
            accessor: (c: any) => c.duration_ms ? `${Math.round(c.duration_ms / 1000 / 60)} min` : '0 min'
        },
        {
            header: 'Interview Score', accessor: (c: any) => (
                <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${(c.interview_score || 0) >= 8 ? 'bg-green-500' : (c.interview_score || 0) >= 6 ? 'bg-blue-500' : 'bg-red-500'}`}
                            style={{ width: `${(c.interview_score || 0) * 10}%` }}></div>
                    </div>
                    <span className="font-bold text-sm text-gray-900">{c.interview_score || 0}/10</span>
                </div>
            )
        },
        {
            header: 'Status', accessor: (c: any) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${c.call_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                    {c.call_status}
                </span>
            )
        },
        {
            header: 'Action', accessor: (c: any) => (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`${basePath}/results/${c.call_id}`); }}>
                    <Eye className="w-4 h-4 mr-1" /> View
                </Button>
            )
        },
    ];

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-slate-500 font-medium">Loading interview results...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Interview Results</h1>
                    <p className="text-gray-500">Analyze AI-driven evaluation outcomes for screened candidates.</p>
                </div>
                {candidateIdFilter && (
                    <Button variant="outline" onClick={() => router.push(`${basePath}/results`)}>
                        Show All Results
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Screened" value={calls.length} icon={Users} color="blue" />
                <MetricCard label="Pass Rate" value={`${Math.round((calls.filter(c => c.recommend_hire).length / (calls.length || 1)) * 100)}%`} icon={TrendingUp} color="green" />
                <MetricCard label="Avg. Score" value={(calls.reduce((acc, c) => acc + (c.interview_score || 0), 0) / (calls.length || 1)).toFixed(1)} icon={ClipboardList} color="indigo" />
                <MetricCard label="Completed" value={calls.filter(c => c.call_status === 'completed').length} icon={Clock} color="orange" />
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
                                <option value="registered">Registered</option>
                            </select>
                            <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> More Filters</Button>
                        </div>
                    </div>
                    {filteredCalls.length > 0 ? (
                        <DataTable
                            columns={columns}
                            data={filteredCalls}
                            onRowClick={(c) => router.push(`${basePath}/results/${c.call_id}`)}
                        />
                    ) : (
                        <div className="py-20 text-center text-slate-400">
                            No interview results found.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
