'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { ChevronLeft, CheckCircle2, UserX, UserCheck, UserXIcon, Save, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { retellApi } from '@/services/retell.api';

const SummaryTab = ({ call }: { call: any }) => (
    <div className="space-y-6">
        <Card>
            <CardHeader title="AI Screening Summary" />
            <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-blue-800 leading-relaxed font-medium italic">
                    &quot;{call.call_summary || "No summary available for this call."}&quot;
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <h4 className="text-[10px] font-black text-green-800 uppercase tracking-widest mb-3">Core Strengths</h4>
                        <div className="text-xs text-green-700 whitespace-pre-wrap font-bold">
                            {call.strengths || "Analysis in progress..."}
                        </div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                        <h4 className="text-[10px] font-black text-red-800 uppercase tracking-widest mb-3">Weaknesses / Gaps</h4>
                        <div className="text-xs text-red-700 whitespace-pre-wrap font-bold">
                            {call.weaknesses || "None identified."}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader title="Technical Assessment" />
            <CardContent>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed">
                    {call.technical_assessment || "No technical assessment data available."}
                </div>
            </CardContent>
        </Card>
    </div>
);

const TranscriptTab = ({ transcript }: { transcript: string }) => {
    if (!transcript) return <div className="p-10 text-center text-slate-400">No transcript available.</div>;

    // Simple parser for transcripts like "AI: ... Candidate: ..."
    const lines = transcript.split('\n').filter(l => l.trim());

    return (
        <Card>
            <CardHeader title="Full Transcript" subtitle="Generated from real-time audio analysis" />
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                {lines.map((line, idx) => {
                    const isAI = line.toLowerCase().startsWith('ai:') || line.toLowerCase().startsWith('agent:');
                    const parts = line.split(':');
                    const speaker = parts[0];
                    const text = parts.slice(1).join(':').trim();

                    return (
                        <div key={idx} className={`flex space-x-4 ${isAI ? 'bg-blue-50/50 p-4 rounded-xl border border-blue-100' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${isAI ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                                }`}>{speaker[0] || '?'}</div>
                            <div>
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-xs font-black text-gray-900">{speaker}</span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{text || line}</p>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};

export default function ResultDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const [call, setCall] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCall = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const data = await retellApi.getCall(id);
                setCall(data);
            } catch (error) {
                console.error("Error fetching call:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCall();
    }, [id]);

    if (isLoading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-slate-500 font-bold text-lg">Analyzing Call Data...</p>
            </div>
        );
    }

    if (!call) return (
        <div className="h-[70vh] flex flex-col items-center justify-center space-y-4 text-slate-500">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="font-bold text-lg">Interview result not found</p>
            <Button onClick={() => router.back()}>Go Back</Button>
        </div>
    );

    const tabs = [
        { id: 'summary', label: 'Summary', content: <SummaryTab call={call} /> },
        { id: 'transcript', label: 'Transcript', content: <TranscriptTab transcript={call.transcript} /> },
    ];

    return (
        <div className="space-y-6 pb-20">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Results
            </Button>

            <Card className="overflow-hidden border-none shadow-2xl">
                <div className="bg-gradient-to-r from-indigo-600 via-blue-700 to-indigo-800 p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Sparkles className="w-32 h-32" />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center space-x-6">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30 text-4xl font-black">
                                {call.candidate_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tight">{call.candidate_name || 'Candidate'}</h1>
                                <p className="text-blue-100 font-bold opacity-90">
                                    {call.job_title || 'Role'} • Screened on {call.created_at ? new Date(call.created_at).toLocaleDateString() : 'N/A'}
                                </p>
                                <div className="flex items-center mt-3 space-x-3">
                                    <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-black rounded-full uppercase">
                                        Agent: {call.agent_id?.slice(0, 8)}...
                                    </span>
                                    <span className="text-[10px] font-black uppercase text-blue-200">
                                        Duration: {call.duration_ms ? `${Math.round(call.duration_ms / 1000 / 60)} min` : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-center bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 min-w-[200px] shadow-2xl shadow-blue-900/40">
                            <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1">Interview Score</p>
                            <div className="text-7xl font-black leading-none">{call.interview_score || 0}</div>
                            <div className="mt-3 px-3 py-1 bg-white text-blue-700 rounded-full text-[10px] font-black uppercase inline-block">
                                {call.recommend_hire ? 'Strong Hire' : 'Review Needed'}
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
                        <CardHeader title="Outcome Prediction" />
                        <CardContent className="space-y-4">
                            <div className={`p-4 rounded-2xl border flex items-center space-x-3 ${call.recommend_hire ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                                }`}>
                                {call.recommend_hire ? <CheckCircle2 className="w-6 h-6" /> : <UserX className="w-6 h-6" />}
                                <div>
                                    <p className="text-xs font-black uppercase">Recommendation</p>
                                    <p className="text-lg font-black leading-tight">{call.interview_outcome || (call.recommend_hire ? 'HIRE' : 'REJECT')}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Communication Quality</p>
                                <p className="text-sm font-bold text-slate-700">{call.communication_quality || 'N/A'}</p>
                            </div>

                            <div className="pt-4 space-y-2 border-t border-slate-100">
                                <Button fullWidth className="bg-blue-600 hover:bg-blue-700">
                                    <UserCheck className="w-4 h-4 mr-2" /> Shortlist Candidate
                                </Button>
                                <Button fullWidth variant="outline" className="text-red-600 hover:bg-red-50 border-red-200">
                                    <UserXIcon className="w-4 h-4 mr-2" /> Mark as Rejected
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {call.recording_url && (
                        <Card>
                            <CardHeader title="Audio Recording" />
                            <CardContent>
                                <audio controls className="w-full">
                                    <source src={call.recording_url} type="audio/mpeg" />
                                    Your browser does not support the audio element.
                                </audio>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
