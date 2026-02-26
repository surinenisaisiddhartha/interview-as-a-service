'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Wand2, Loader2, CheckCircle2, Upload } from 'lucide-react';

export default function UploadJDPage() {
    const [title, setTitle] = useState('');
    const [jdText, setJdText] = useState('');
    const [department, setDepartment] = useState('Engineering');
    const [analyzing, setAnalyzing] = useState(false);
    const [skills, setSkills] = useState<string[]>([]);
    const [saved, setSaved] = useState(false);

    const handleAnalyze = async () => {
        if (!jdText.trim()) return;
        setAnalyzing(true);
        await new Promise(res => setTimeout(res, 1800));
        setSkills(['React', 'TypeScript', 'Next.js', 'REST APIs', 'System Design', 'Node.js']);
        setAnalyzing(false);
    };

    const handleSave = async () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Upload Job Description</h1>
                <p className="text-gray-500">Define the role and let AI extract required skills and keywords.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader title="Role Information" />
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">Job Title</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">Department</label>
                                    <select value={department} onChange={e => setDepartment(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-white">
                                        {['Engineering', 'Product', 'Design', 'Data Science', 'Marketing', 'Operations'].map(d => <option key={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">Experience Level</label>
                                    <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-white">
                                        <option>Junior (0–2 years)</option>
                                        <option>Mid-Level (2–5 years)</option>
                                        <option selected>Senior (5+ years)</option>
                                        <option>Lead / Principal</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">Job Description</label>
                                <textarea value={jdText} onChange={e => setJdText(e.target.value)} rows={10}
                                    placeholder="Paste or type the full job description here..."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                            </div>
                            <div className="flex space-x-3">
                                <Button onClick={handleAnalyze} disabled={analyzing || !jdText} variant="secondary">
                                    {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                                    Extract Skills with AI
                                </Button>
                                <Button onClick={handleSave} disabled={!title || !skills.length}>
                                    {saved ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                    {saved ? 'Saved!' : 'Save JD'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className={!skills.length ? 'opacity-50' : ''}>
                        <CardHeader title="AI Extracted Skills" />
                        <CardContent>
                            {skills.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {skills.map(s => (
                                        <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100 flex items-center">
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> {s}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">Extract skills to see AI analysis</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
