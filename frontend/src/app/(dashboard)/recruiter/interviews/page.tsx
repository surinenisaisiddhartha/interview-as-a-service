'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Microscope,
    Calendar,
    Plus,
    Clock,
    User,
    Video,
    Check,
    BarChart3,
    UserCheck,
    History,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Sparkles
} from 'lucide-react';
import { DataTable } from '@/components/ui/datatable';
import { MOCK_INTERVIEWS, MOCK_JDS, MOCK_RESUMES, MOCK_AGENTS } from '@/data/mockData';
import { Interview } from '@/types';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';

const SLOTS = [
    { time: '09:00 AM', candidate: 'Mark Spencer', role: 'Senior React Dev', agent: 'Aurora AI', status: 'confirmed' },
    { time: '10:30 AM', candidate: 'Sarah Jenkins', role: 'Backend Architect', agent: 'Zenith Bot', status: 'pending' },
    { time: '12:00 PM', candidate: '', role: '', agent: '', status: 'free' },
    { time: '02:00 PM', candidate: 'Alex Turner', role: 'Data Scientist', agent: 'Vision Pro', status: 'confirmed' },
    { time: '03:30 PM', candidate: '', role: '', agent: '', status: 'free' },
    { time: '05:00 PM', candidate: 'Priya Nair', role: 'Product Lead', agent: 'Aurora AI', status: 'pending' },
];

export default function RecruiterInterviewsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'sessions' | 'schedule'>('sessions');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ candidateName: '', jdId: '', resumeId: '', agentId: '', difficulty: 'Medium' });

    const columns = [
        { header: 'Candidate', accessor: (i: Interview) => i.candidateName },
        { header: 'JD / Role', accessor: (i: Interview) => i.jobRole },
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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Interviews & Schedule</h1>
                    <p className="text-gray-500">Manage interview sessions and daily calendar in one place.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="bg-gray-100 p-1 rounded-xl flex">
                        <button
                            onClick={() => setActiveTab('sessions')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'sessions' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <History className="w-3.5 h-3.5 inline-block mr-1.5" />
                            History
                        </button>
                        <button
                            onClick={() => setActiveTab('schedule')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'schedule' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Calendar className="w-3.5 h-3.5 inline-block mr-1.5" />
                            Schedule
                        </button>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5">
                        <Plus className="w-4 h-4 mr-2" /> Schedule Interview
                    </Button>
                </div>
            </div>

            {activeTab === 'sessions' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: Calendar, label: 'Sessions Today', value: '14 Sessions', color: 'blue' },
                            { icon: UserCheck, label: 'Avg Candidate Score', value: '78%', color: 'emerald' },
                            { icon: Clock, label: 'Avg Duration', value: '24m', color: 'indigo' },
                        ].map(({ icon: Icon, label, value, color }) => (
                            <div key={label} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">{label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-full bg-${color}-50 flex items-center justify-center`}>
                                    <Icon className={`w-5 h-5 text-${color}-400`} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
                        <CardHeader className="px-8 py-5 border-b border-gray-50 bg-white">
                            <div className="flex items-center justify-between w-full">
                                <h3 className="font-semibold text-gray-800 text-lg">Recent Sessions</h3>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" className="rounded-lg border-gray-200 text-gray-700 text-sm font-medium h-9 px-4">
                                        ← Prev
                                    </Button>
                                    <Button variant="outline" size="sm" className="rounded-lg border-gray-200 text-gray-700 text-sm font-medium h-9 px-4">
                                        Next &gt;
                                    </Button>
                                    <Button variant="outline" size="sm" className="rounded-lg border-gray-200 text-gray-700 text-sm font-medium h-9 px-4">
                                        Next &gt;
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-8 py-4 text-left font-semibold">Candidate</th>
                                        <th className="px-6 py-4 text-center font-semibold">JD / Role</th>
                                        <th className="px-6 py-4 text-center font-semibold">Recruiter</th>
                                        <th className="px-6 py-4 text-center font-semibold">Status</th>
                                        <th className="px-6 py-4 text-center font-semibold">AI Score</th>
                                        <th className="px-8 py-4 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { id: 1, name: 'Mark Spencer', role: 'Senior React Developer', exp: '5 years', recruiter: 'HR Recruiter', status: 'completed', score: 85, initial: '1' },
                                        { id: 5, name: 'Sarah Jenkins', role: 'Senior React Developer', exp: '3 years', recruiter: 'HR Recruiter', status: 'completed', score: 94, initial: '5' },
                                        { id: 'A', name: 'Alex Turner', role: 'Senior React Developer', exp: '3 years', recruiter: 'HR Recruiter', status: 'completed', score: 94, initial: 'A' },
                                    ].map((c, idx) => (
                                        <React.Fragment key={idx}>
                                            <tr className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-5 border-b border-gray-50">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center relative overflow-hidden shadow-sm border border-white">
                                                            <div className="absolute inset-0 bg-gray-200" />
                                                            <User className="w-7 h-7 text-gray-400 relative z-10" />
                                                            {/* Actual avatar would go here */}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-xs font-bold text-blue-500 w-4">{c.initial}</span>
                                                                <p className="font-bold text-gray-900 leading-tight text-lg">{c.name}</p>
                                                            </div>
                                                            <p className="text-xs text-gray-500 font-bold ml-6">{c.role}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 border-b border-gray-50 text-center">
                                                    <span className="text-sm font-bold text-gray-600">{c.exp}</span>
                                                </td>
                                                <td className="px-6 py-5 border-b border-gray-50 text-center">
                                                    <span className="text-sm font-bold text-gray-600">{c.recruiter}</span>
                                                </td>
                                                <td className="px-6 py-5 border-b border-gray-50 text-center">
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100/50">
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 border-b border-gray-50 text-center">
                                                    <div className="inline-flex items-center justify-center w-12 h-10 bg-emerald-50 rounded-xl border border-emerald-100/50">
                                                        <span className="text-lg font-bold text-emerald-700">{c.score}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 border-b border-gray-50 text-right">
                                                    <Button variant="outline" size="sm" className="rounded-xl border-gray-200 text-gray-700 font-bold text-xs px-5 h-10 shadow-sm hover:bg-gray-50 group-hover:border-gray-300">
                                                        View Report <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                            {(idx === 0 || idx === 2) && (
                                                <tr className="bg-[#F8FAFC]">
                                                    <td colSpan={6} className="px-8 py-3.5 border-b border-gray-100">
                                                        <div className="flex items-center justify-between group cursor-pointer">
                                                            <div className="flex items-center text-gray-400 font-bold text-[13px]">
                                                                <Check className="w-4 h-4 mr-3 text-gray-300" />
                                                                Available slot — click to schedule
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-gray-50 p-6 flex justify-center">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">End of Recent Sessions</p>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-2">
                    <Card className="lg:col-span-3 rounded-2xl border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-8 py-6 border-b border-gray-50 bg-white flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Today, Feb 23, 2026</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Monday</p>
                            </div>
                            <div className="flex bg-white rounded-xl border border-gray-200 p-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600">
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" className="h-8 px-4 text-xs font-bold text-gray-700">Today</Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600">
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {SLOTS.map((slot, idx) => (
                                <div key={idx} className={`px-8 py-5 flex items-center space-x-6 hover:bg-gray-50/50 transition-colors ${slot.status === 'free' ? 'opacity-50' : ''}`}>
                                    <div className="w-24 text-sm font-bold text-gray-400">{slot.time}</div>
                                    {slot.status !== 'free' ? (
                                        <>
                                            <div className={`w-1.5 h-12 rounded-full shrink-0 ${slot.status === 'confirmed' ? 'bg-emerald-500' : 'bg-yellow-400'}`} />
                                            <div className="flex items-center space-x-4 flex-1">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold border border-white shadow-sm overflow-hidden">
                                                    {slot.candidate.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 leading-tight">{slot.candidate}</p>
                                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{slot.role} • Agent: <span className="font-bold text-gray-700">{slot.agent}</span></p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${slot.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-yellow-50 text-yellow-700 border border-yellow-100'}`}>
                                                    {slot.status}
                                                </span>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                                                    <Video className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <button className="flex-1 group flex items-center space-x-3 py-3 px-4 rounded-2xl border-2 border-dashed border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all text-gray-400 hover:text-blue-600">
                                            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            <span className="text-sm font-bold">Available slot — click to schedule</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="space-y-6">
                        <Card className="rounded-2xl border-gray-100 shadow-sm p-6 space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Today's Summary</h4>
                            <div className="space-y-3">
                                {[
                                    { icon: Calendar, label: 'Total', value: '4', color: 'blue' },
                                    { icon: Check, label: 'Confirmed', value: '2', color: 'emerald' },
                                    { icon: Clock, label: 'Pending', value: '2', color: 'yellow' },
                                    { icon: User, label: 'Free', value: '2', color: 'gray' }
                                ].map(({ icon: Icon, label, value, color }) => (
                                    <div key={label} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 border border-gray-50">
                                        <div className="flex items-center space-x-2.5">
                                            <Icon className={`w-4 h-4 text-${color}-500`} />
                                            <span className="text-xs font-bold text-gray-600">{label}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{value}</span>
                                    </div>
                                ))}
                            </div>
                            <Button className="w-full bg-gray-900 hover:bg-black text-white rounded-lg font-bold text-xs h-10 mt-2">
                                Export Day Schedule
                            </Button>
                        </Card>

                        <div className="p-6 bg-blue-600 rounded-2xl text-white space-y-4 shadow-xl shadow-blue-100">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Microscope className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">AI Ready</h4>
                                <p className="text-xs text-blue-100 font-medium">Your AI agents are calibrated and ready for today's sessions.</p>
                            </div>
                            <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-bold text-xs border-none h-10">
                                View Agents
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reuse Schedule Modal Logic */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule AI Interview"
                footer={<><Button variant="outline" className="rounded-xl" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={() => setIsModalOpen(false)}>Confirm Schedule</Button></>}
            >
                <div className="space-y-4 py-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Candidate Name</label>
                        <input type="text" className="w-full border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="Full Name"
                            value={formData.candidateName} onChange={e => setFormData({ ...formData, candidateName: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Job Description</label>
                            <select className="w-full border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white cursor-pointer">
                                <option value="">Select JD</option>
                                {MOCK_JDS.map(jd => <option key={jd.id} value={jd.id}>{jd.title}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Candidate Profile</label>
                            <select className="w-full border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white cursor-pointer">
                                <option value="">Select Profile</option>
                                {MOCK_RESUMES.map(r => <option key={r.id} value={r.id}>{r.candidateName}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Select AI Agent</label>
                        <div className="grid grid-cols-3 gap-2">
                            {MOCK_AGENTS.map(agent => (
                                <button key={agent.id} className={`p-3 border rounded-2xl text-center transition-all ${formData.agentId === agent.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}
                                    onClick={() => setFormData({ ...formData, agentId: agent.id })}>
                                    <Sparkles className={`w-5 h-5 mx-auto mb-1.5 ${formData.agentId === agent.id ? 'text-blue-600' : 'text-slate-400'}`} />
                                    <p className="text-[10px] font-black truncate text-slate-900">{agent.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Interview Difficulty</label>
                        <div className="flex gap-2">
                            {['Easy', 'Medium', 'Hard'].map(d => (
                                <button key={d} className={`flex-1 py-2.5 border rounded-xl text-xs font-black transition-all ${formData.difficulty === d ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' : 'border-slate-100 hover:bg-slate-50 text-slate-500'}`}
                                    onClick={() => setFormData({ ...formData, difficulty: d })}>{d}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
