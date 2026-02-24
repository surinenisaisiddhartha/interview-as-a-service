'use client';

import React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { DataTable } from '@/components/ui/datatable';
import { Button } from '@/components/ui/button';
import { MOCK_RESUMES } from '@/data/mockData';
import { Upload, FileText, CheckCircle2 } from 'lucide-react';
import { Resume } from '@/types';

export default function AdminResumes() {
    const columns = [
        {
            header: 'Candidate', accessor: (r: Resume) => (
                <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold">{r.candidateName}</span>
                </div>
            )
        },
        { header: 'Experience', accessor: (r: Resume) => r.experience },
        {
            header: 'Extracted Skills', accessor: (r: Resume) => (
                <div className="flex flex-wrap gap-1">
                    {r.skills.slice(0, 3).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">{s}</span>
                    ))}
                    {r.skills.length > 3 && <span className="text-[10px] text-gray-400">+{r.skills.length - 3}</span>}
                </div>
            )
        },
        {
            header: 'Status', accessor: (r: Resume) => (
                <div className="flex items-center text-green-600 font-bold text-[10px] uppercase">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> {r.status}
                </div>
            )
        },
        { header: 'Actions', accessor: () => <Button variant="ghost" size="sm">Score AI</Button> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Resumes</h1>
                    <p className="text-gray-500">Intelligent parsing and skill extraction for candidates.</p>
                </div>
                <Button>
                    <Upload className="w-4 h-4 mr-2" /> Batch Upload
                </Button>
            </div>
            <Card>
                <CardHeader title="Processed Candidates" />
                <DataTable columns={columns} data={MOCK_RESUMES} />
            </Card>
        </div>
    );
}
