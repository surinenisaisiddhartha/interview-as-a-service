'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MOCK_RESUMES } from '@/data/mockData';
import { DataTable } from '@/components/ui/datatable';
import { Search, Filter, Star, User } from 'lucide-react';
import { Resume } from '@/types';

export default function RecruiterCandidates() {
    const columns = [
        {
            header: 'Candidate', accessor: (r: Resume) => (
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">{r.candidateName.charAt(0)}</div>
                    <span className="font-semibold">{r.candidateName}</span>
                </div>
            )
        },
        { header: 'Experience', accessor: (r: Resume) => r.experience },
        {
            header: 'Skills', accessor: (r: Resume) => (
                <div className="flex flex-wrap gap-1">
                    {r.skills.slice(0, 3).map((s: string) => <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">{s}</span>)}
                    {r.skills.length > 3 && <span className="text-[10px] text-gray-400">+{r.skills.length - 3}</span>}
                </div>
            )
        },
        {
            header: 'Status', accessor: (r: Resume) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.status === 'parsed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span>
            )
        },
        {
            header: 'Actions', accessor: () => (
                <div className="flex space-x-2">
                    <Button variant="outline" size="sm"><User className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm"><Star className="w-4 h-4" /></Button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
                    <p className="text-gray-500">All shortlisted and parsed candidates for your active jobs.</p>
                </div>
                <Button>Upload Resume</Button>
            </div>
            <Card>
                <CardHeader title="Candidate Pool" action={
                    <div className="flex space-x-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input placeholder="Search candidates..." className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm outline-none w-56" />
                        </div>
                        <Button variant="outline" size="sm"><Filter className="w-4 h-4" /></Button>
                    </div>
                } />
                <DataTable columns={columns} data={MOCK_RESUMES} />
            </Card>
        </div>
    );
}
