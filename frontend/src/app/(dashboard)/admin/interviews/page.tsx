'use client';

import React, { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { DataTable } from '@/components/ui/datatable';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { MOCK_INTERVIEWS, MOCK_JDS, MOCK_RESUMES, MOCK_AGENTS } from '@/data/mockData';
import { Plus, Calendar, Clock, UserCheck, BrainCircuit } from 'lucide-react';
import { Interview } from '@/types';
import { useRouter } from 'next/navigation';

export default function AdminInterviews() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ candidateName: '', jdId: '', resumeId: '', agentId: '', difficulty: 'Medium' });

    const columns = [
        { header: 'Candidate', accessor: (i: Interview) => i.candidateName },
        { header: 'JD / Role', accessor: (i: Interview) => i.jobRole },
        { header: 'Recruiter', accessor: (i: Interview) => i.recruiterName },
        {
            header: 'Status', accessor: (i: Interview) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${i.status === 'completed' ? 'bg-green-100 text-green-700' :
                        i.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>{i.status}</span>
            )
        },
        { header: 'AI Score', accessor: (i: Interview) => i.aiScore || '-' },
        {
            header: 'Actions', accessor: (i: Interview) => (
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/admin/interviews/${i.id}`); }}>
                    View Report
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
                    <p className="text-gray-500">Manage recruitment workflow and interview sessions.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Schedule Interview
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { icon: Calendar, label: 'Scheduled Today', value: '14 Sessions', color: 'blue' },
                    { icon: UserCheck, label: 'Avg Candidate Score', value: '78%', color: 'green' },
                    { icon: Clock, label: 'Avg Interview Length', value: '24m', color: 'purple' },
                ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="p-4 bg-white rounded-xl border border-gray-100 flex items-center space-x-4">
                        <div className={`p-3 bg-${color}-50 text-${color}-600 rounded-xl`}><Icon className="w-6 h-6" /></div>
                        <div><p className="text-sm text-gray-500">{label}</p><p className="text-xl font-bold">{value}</p></div>
                    </div>
                ))}
            </div>

            <Card>
                <CardHeader title="Recent Sessions" />
                <DataTable columns={columns} data={MOCK_INTERVIEWS.filter(i => i.companyId === 'c1')} onRowClick={(i) => router.push(`/admin/interviews/${i.id}`)} />
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule AI Interview"
                footer={<><Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={() => setIsModalOpen(false)}>Confirm Schedule</Button></>}
            >
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">Candidate Name</label>
                        <input type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Full Name"
                            value={formData.candidateName} onChange={e => setFormData({ ...formData, candidateName: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-gray-700">Job Description</label>
                            <select className="w-full border rounded-lg px-3 py-2 outline-none">
                                <option value="">Select JD</option>
                                {MOCK_JDS.map(jd => <option key={jd.id} value={jd.id}>{jd.title}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-gray-700">Resume / Profile</label>
                            <select className="w-full border rounded-lg px-3 py-2 outline-none">
                                <option value="">Select Candidate</option>
                                {MOCK_RESUMES.map(r => <option key={r.id} value={r.id}>{r.candidateName}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">AI Agent</label>
                        <div className="grid grid-cols-3 gap-2">
                            {MOCK_AGENTS.map(agent => (
                                <button key={agent.id} className={`p-3 border rounded-xl text-center transition-all ${formData.agentId === agent.id ? 'border-blue-600 bg-blue-50' : 'hover:border-gray-300'}`}
                                    onClick={() => setFormData({ ...formData, agentId: agent.id })}>
                                    <BrainCircuit className={`w-5 h-5 mx-auto mb-1 ${formData.agentId === agent.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <p className="text-[10px] font-bold truncate">{agent.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">Interview Difficulty</label>
                        <div className="flex gap-2">
                            {['Easy', 'Medium', 'Hard'].map(d => (
                                <button key={d} className={`flex-1 py-2 border rounded-lg text-sm font-bold ${formData.difficulty === d ? 'bg-gray-900 text-white border-gray-900' : 'hover:bg-gray-50'}`}
                                    onClick={() => setFormData({ ...formData, difficulty: d })}>{d}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
