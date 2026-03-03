'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MOCK_JDS, MOCK_COMPANIES } from '@/data/mockData';
import { Briefcase, Building2, Upload, FileText, CheckCircle2, X, BarChart3 } from 'lucide-react';

export default function JDDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const jd = useMemo(() => MOCK_JDS.find(j => j.id === id), [id]);
    const company = useMemo(
        () => MOCK_COMPANIES.find(c => c.id === jd?.companyId),
        [jd],
    );

    const [files, setFiles] = useState<File[]>([]);
    const [processing, setProcessing] = useState(false);
    const [processed, setProcessed] = useState<string[]>([]);
    const [showResults, setShowResults] = useState(false);

    const handleProcess = async () => {
        setProcessing(true);
        await new Promise(res => setTimeout(res, 1800));
        setProcessed(files.map(f => f.name));
        setProcessing(false);
        setShowResults(true);
    };

    const mockCandidates = useMemo(
        () => [
            {
                id: 'c1',
                name: 'Mark Spencer',
                skills: ['React', 'Next.js', 'AWS'],
                experience: '5 years',
                status: 'Shortlisted',
                score: 91,
            },
            {
                id: 'c2',
                name: 'Sarah Jenkins',
                skills: ['Python', 'Django', 'React'],
                experience: '3 years',
                status: 'In Review',
                score: 84,
            },
            {
                id: 'c3',
                name: 'Aman Verma',
                skills: ['TypeScript', 'Node.js', 'PostgreSQL'],
                experience: '6 years',
                status: 'Rejected',
                score: 62,
            },
        ],
        [],
    );

    const sortedCandidates = useMemo(
        () => [...mockCandidates].sort((a, b) => b.score - a.score),
        [mockCandidates],
    );

    if (!jd) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-gray-500">Role not found.</p>
                <Button variant="outline" onClick={() => router.back()}>
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {jd.title}
                    </h1>
                    <p className="flex items-center text-sm text-gray-500 mt-1">
                        <Building2 className="w-4 h-4 mr-1" />
                        {company?.name || 'Unknown company'}
                    </p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    Back to JD Section
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-12">
                            <Button
                                size="lg"
                                className="text-base py-6 px-8"
                                onClick={() =>
                                    document
                                        .getElementById('jd-role-resume-upload')
                                        ?.click()
                                }
                            >
                                <Upload className="w-5 h-5 mr-3" />
                                Upload Resumes for this Role
                            </Button>
                            <p className="text-sm text-gray-500 mt-4">
                                Supports PDF, DOC, DOCX
                            </p>
                            <input
                                id="jd-role-resume-upload"
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx"
                                className="hidden"
                                onChange={e =>
                                    setFiles(prev => [
                                        ...prev,
                                        ...Array.from(e.target.files || []),
                                    ])
                                }
                            />
                        </CardContent>
                    </Card>

                    {files.length > 0 && (
                        <Card>
                            <CardHeader
                                title={`${files.length} ${files.length === 1 ? 'Resume' : 'Resumes'
                                    } Selected`}
                            />
                            <div className="divide-y divide-gray-100">
                                {files.map((file, idx) => (
                                    <div
                                        key={idx}
                                        className="px-6 py-3 flex items-center justify-between"
                                    >
                                        <div className="flex items-center space-x-3">
                                            {processed.includes(file.name) ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <FileText className="w-5 h-5 text-gray-400" />
                                            )}
                                            <span className="text-sm font-medium text-gray-800">
                                                {file.name}
                                            </span>
                                        </div>
                                        {!processed.includes(file.name) && (
                                            <button
                                                onClick={() =>
                                                    setFiles(f =>
                                                        f.filter(
                                                            (_, i) => i !== idx,
                                                        ),
                                                    )
                                                }
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {files.length > 0 && (
                        <div className="flex justify-end">
                            <Button onClick={handleProcess} disabled={processing}>
                                <BarChart3 className="w-4 h-4 mr-2" />
                                {processing ? 'Processing...' : 'Process'}
                            </Button>
                        </div>
                    )}

                    {showResults && (
                        <Card>
                            <CardHeader title="Candidates & Matching" />
                            <CardContent className="space-y-4">
                                <p className="text-xs text-gray-500">
                                    Showing candidates in{' '}
                                    <span className="font-semibold">
                                        descending
                                    </span>{' '}
                                    order of match percentage.
                                </p>
                                <div className="border rounded-xl overflow-hidden">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                            <tr>
                                                <th className="px-4 py-2 text-left">
                                                    Candidate
                                                </th>
                                                <th className="px-4 py-2 text-left">
                                                    Matching Skills
                                                </th>
                                                <th className="px-4 py-2 text-left">
                                                    Experience
                                                </th>
                                                <th className="px-4 py-2 text-left">
                                                    Status
                                                </th>
                                                <th className="px-4 py-2 text-left">
                                                    Match %
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {sortedCandidates.map(c => (
                                                <tr key={c.id}>
                                                    <td className="px-4 py-3 font-medium text-gray-900">
                                                        {c.name}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {c.skills.map(
                                                                s => (
                                                                    <span
                                                                        key={s}
                                                                        className="px-2 py-0.5 bg-gray-100 rounded text-[11px] text-gray-700"
                                                                    >
                                                                        {s}
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700">
                                                        {c.experience}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.status ===
                                                                'Shortlisted'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : c.status ===
                                                                    'Rejected'
                                                                    ? 'bg-red-100 text-red-700'
                                                                    : 'bg-amber-100 text-amber-700'
                                                                }`}
                                                        >
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-semibold text-gray-900">
                                                            {c.score}
                                                        </span>
                                                        <span className="text-xs text-gray-400 ml-0.5">
                                                            / 100
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader title="Role Summary" />
                        <CardContent className="space-y-2 text-sm text-gray-700">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Role</span>
                                <span className="font-medium">{jd.title}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Company</span>
                                <span className="font-medium">
                                    {company?.name || 'Unknown'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Status</span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${jd.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                        }`}
                                >
                                    {jd.status}
                                </span>
                            </div>
                            <div className="space-y-1 pt-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase">
                                    Skills
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {jd.skills.map(s => (
                                        <span
                                            key={s}
                                            className="px-2 py-0.5 bg-gray-100 rounded text-[11px] text-gray-700"
                                        >
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}


