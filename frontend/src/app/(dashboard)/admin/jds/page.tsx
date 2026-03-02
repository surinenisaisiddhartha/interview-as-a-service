'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/datatable';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { MOCK_JDS } from '@/data/mockData';
import { FilePlus, Briefcase, Eye, Wand2, Loader2, BrainCircuit } from 'lucide-react';
import { JD } from '@/types';

export default function AdminJDs() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [jdText, setJdText] = useState('');
    const [extractedSkills, setExtractedSkills] = useState<string[]>([]);

    const handleAnalyze = async () => {
        if (!jdText) return;
        setIsAnalyzing(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setExtractedSkills(['React', 'TypeScript', 'Node.js', 'System Design', 'Agile']);
        setIsAnalyzing(false);
    };

    const columns = [
        {
            header: 'Role Title', accessor: (j: JD) => (
                <div className="flex items-center space-x-3">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold">{j.title}</span>
                </div>
            )
        },
        {
            header: 'Skills Extracted', accessor: (j: JD) => (
                <div className="flex flex-wrap gap-1">
                    {j.skills.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-600">{s}</span>
                    ))}
                </div>
            )
        },
        {
            header: 'Status', accessor: (j: JD) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${j.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{j.status}</span>
            )
        },
        {
            header: 'Actions', accessor: () => (
                <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-2" /> Preview</Button>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Job Descriptions</h1>
                    <p className="text-gray-500">Define roles and skills for AI-powered candidate screening.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <FilePlus className="w-4 h-4 mr-2" /> Upload JD
                </Button>
            </div>

            <Card>
                <CardHeader title="TechCorp Positions" />
                <DataTable columns={columns} data={MOCK_JDS} />
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Job Description" size="lg"
                footer={<><Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button disabled={!extractedSkills.length}>Save Role</Button></>}
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-gray-700">Paste JD Text</label>
                            <textarea
                                className="w-full border rounded-xl p-3 text-sm h-64 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Paste the job description here..."
                                value={jdText}
                                onChange={e => setJdText(e.target.value)}
                            />
                        </div>
                        <Button fullWidth variant="secondary" onClick={handleAnalyze} disabled={isAnalyzing || !jdText}>
                            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                            AI Extract Intelligence
                        </Button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 min-h-[300px]">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Extracted Intelligence</h4>
                        {extractedSkills.length > 0 ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 mb-2">Technical Core</p>
                                    <div className="flex flex-wrap gap-2">
                                        {extractedSkills.map(s => (
                                            <span key={s} className="px-3 py-1 bg-white border border-blue-100 text-blue-700 rounded-lg text-xs font-bold shadow-sm">{s}</span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 mb-2">Suggested Agents</p>
                                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                                        <div className="w-6 h-6 bg-indigo-100 rounded flex items-center justify-center text-indigo-600">
                                            <BrainCircuit className="w-4 h-4" />
                                        </div>
                                        <span>Aurora AI (Highly Recommended)</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <Wand2 className="w-10 h-10 text-gray-200 mb-2" />
                                <p className="text-sm text-gray-400 italic">Extract JD to see AI analysis here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
