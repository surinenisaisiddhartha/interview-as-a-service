'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { MOCK_INTERVIEWS } from '@/data/mockData';
import { ChevronLeft, CheckCircle2, UserX, UserCheck, UserXIcon, Save } from 'lucide-react';

const SummaryTab = ({ interview }: { interview: typeof MOCK_INTERVIEWS[0] }) => (
    <div className="space-y-6">
        <Card>
            <CardHeader title="AI Screening Summary" />
            <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-blue-800 leading-relaxed font-medium italic">
                    &quot;{interview.candidateName} shows exceptional depth in modern architectural patterns. Communication is fluid and results-oriented.&quot;
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <h4 className="text-[10px] font-black text-green-800 uppercase tracking-widest mb-3">Core Strengths</h4>
                        <ul className="text-xs text-green-700 space-y-2 font-bold">
                            <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Expert-level React Ecosystem knowledge</li>
                            <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Articulate system-design logic</li>
                            <li className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-2" /> High cultural alignment score</li>
                        </ul>
                    </div>
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                        <h4 className="text-[10px] font-black text-red-800 uppercase tracking-widest mb-3">Weaknesses / Gaps</h4>
                        <ul className="text-xs text-red-700 space-y-2 font-bold">
                            <li className="flex items-center"><UserX className="w-3.5 h-3.5 mr-2" /> Shallow experience with Cloud-native CI/CD</li>
                            <li className="flex items-center"><UserX className="w-3.5 h-3.5 mr-2" /> Occasionally verbose explanations</li>
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
);

const EvalTab = ({ score }: { score: number }) => (
    <Card>
        <CardHeader title="AI Evaluation Breakdown" />
        <CardContent className="space-y-6">
            {[
                { skill: 'Technical Depth', score: Math.min(score + 10, 100) },
                { skill: 'Problem Solving', score: score },
                { skill: 'Communication', score: Math.min(score + 5, 100) },
                { skill: 'Cultural Fit', score: Math.max(score - 5, 0) },
            ].map(({ skill, score: s }) => (
                <div key={skill}>
                    <div className="flex justify-between mb-1">
                        <span className="text-sm font-bold text-gray-900">{skill}</span>
                        <span className={`text-sm font-black ${s >= 80 ? 'text-green-600' : 'text-orange-600'}`}>{s}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full" style={{ width: `${s}%` }}></div>
                    </div>
                </div>
            ))}
        </CardContent>
    </Card>
);

const SkillGapTab = () => (
    <Card>
        <CardHeader title="Skill Gap Analysis" />
        <CardContent>
            <div className="space-y-4">
                {[
                    { skill: 'React / Next.js', required: 90, candidate: 95, status: 'Exceeds' },
                    { skill: 'TypeScript', required: 80, candidate: 85, status: 'Meets' },
                    { skill: 'Cloud / AWS', required: 70, candidate: 45, status: 'Gap' },
                    { skill: 'System Design', required: 85, candidate: 80, status: 'Meets' },
                ].map(row => (
                    <div key={row.skill} className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-900 w-40">{row.skill}</span>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full" style={{ width: `${row.candidate}%` }}></div>
                                </div>
                                <span className="text-xs font-bold text-gray-500 w-8">{row.candidate}%</span>
                            </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase w-16 text-center ${row.status === 'Gap' ? 'bg-red-100 text-red-700' :
                                row.status === 'Exceeds' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                            }`}>{row.status}</span>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
);

const TranscriptTab = () => (
    <Card>
        <CardHeader title="Full Transcript" subtitle="Generated from real-time audio analysis" />
        <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
            {[
                { speaker: 'AI', text: 'Hello! Can you walk me through your experience with React?', time: '0:05' },
                { speaker: 'Candidate', text: 'I have 5 years of experience. I recently led a migration from class components to hooks.', time: '0:45' },
                { speaker: 'AI', text: 'How did you handle performance optimization during that migration?', time: '1:12' },
                { speaker: 'Candidate', text: 'We used memoization extensively and implemented virtualization with react-window.', time: '1:50' },
            ].map((entry, idx) => (
                <div key={idx} className={`flex space-x-4 ${entry.speaker === 'AI' ? 'bg-blue-50/50 p-4 rounded-xl border border-blue-100' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${entry.speaker === 'AI' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>{entry.speaker[0]}</div>
                    <div>
                        <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-black text-gray-900">{entry.speaker}</span>
                            <span className="text-[10px] text-gray-400">{entry.time}</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{entry.text}</p>
                    </div>
                </div>
            ))}
        </CardContent>
    </Card>
);

export default function ResultDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const interview = MOCK_INTERVIEWS.find(i => i.id === id);

    if (!interview) return <div>Result not found</div>;

    const tabs = [
        { id: 'summary', label: 'Summary', content: <SummaryTab interview={interview} /> },
        { id: 'eval', label: 'AI Evaluation', content: <EvalTab score={interview.aiScore} /> },
        { id: 'gap', label: 'Skill Gap', content: <SkillGapTab /> },
        { id: 'transcript', label: 'Transcript', content: <TranscriptTab /> },
    ];

    return (
        <div className="space-y-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Results
            </Button>

            <Card className="overflow-hidden border-none shadow-2xl">
                <div className="bg-gradient-to-r from-indigo-600 via-blue-700 to-indigo-800 p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <div className="w-32 h-32 border-8 border-white rounded-full"></div>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center space-x-6">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30 text-4xl font-black">
                                {interview.candidateName.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tight">{interview.candidateName}</h1>
                                <p className="text-blue-100 font-bold opacity-90">{interview.jobRole} • Screened on {interview.date}</p>
                                <div className="flex items-center mt-3 space-x-3">
                                    <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-black rounded-full uppercase">
                                        AI Agent: {interview.agentName}
                                    </span>
                                    <span className="text-[10px] font-black uppercase text-blue-200">Duration: {interview.duration}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-center bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 min-w-[200px] shadow-2xl shadow-blue-900/40">
                            <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1">AI Match Score</p>
                            <div className="text-7xl font-black leading-none">{interview.aiScore}</div>
                            <div className="mt-3 px-3 py-1 bg-white text-blue-700 rounded-full text-[10px] font-black uppercase inline-block">
                                {interview.aiScore >= 75 ? 'Strong Match' : 'Review Needed'}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <Tabs tabs={tabs} />
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader title="Shortlist Decision" />
                        <CardContent className="space-y-2">
                            <p className="text-xs text-gray-500 italic">You can manually override the AI recommendation.</p>
                            <Button fullWidth className="bg-green-600 hover:bg-green-700">
                                <UserCheck className="w-4 h-4 mr-2" /> Shortlist Candidate
                            </Button>
                            <Button fullWidth variant="outline" className="text-red-600 hover:bg-red-50 border-red-200">
                                <UserXIcon className="w-4 h-4 mr-2" /> Reject Candidate
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader title="Recruiter Evaluation" />
                        <CardContent>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Internal Notes</label>
                            <textarea className="w-full border border-gray-200 rounded-xl p-3 text-sm h-32 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 mt-2"
                                placeholder="Share your thoughts with the team..." />
                            <Button fullWidth variant="ghost" className="border border-gray-100 hover:bg-gray-50 mt-2">
                                <Save className="w-4 h-4 mr-2" /> Save Notes
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
