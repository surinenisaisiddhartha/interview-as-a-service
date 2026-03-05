'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, CheckCircle2, Upload } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { onboardingApi } from '@/services/onboarding.api';

export default function UploadJDPage() {
    const { data: session } = useSession();
    const companyId = (session?.user as any)?.companyId as string | undefined;
    const userId = (session?.user as any)?.id as string | undefined;

    const [title, setTitle] = useState('');
    const [jdText, setJdText] = useState('');
    const [department, setDepartment] = useState('Engineering');
    const [saved, setSaved] = useState(false);
    const [jdFile, setJdFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSave = async () => {
        if (!companyId || !userId) {
            setErrorMsg('Missing session context (company/user). Please login again.');
            return;
        }
        if (!jdFile) {
            setErrorMsg('Please select a JD file to upload.');
            return;
        }

        setIsUploading(true);
        setErrorMsg('');

        try {
            await onboardingApi.uploadJd(companyId, userId, jdFile, {
                title,
                department,
                jdText,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e: any) {
            setErrorMsg(e?.message || 'Failed to upload JD');
        } finally {
            setIsUploading(false);
        }
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
                            {errorMsg && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                    {errorMsg}
                                </div>
                            )}
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
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">JD File</label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={e => setJdFile(e.target.files?.[0] ?? null)}
                                    className="block w-full text-sm"
                                />
                            </div>
                            <div className="flex space-x-3">
                                <Button onClick={handleSave} disabled={!title || !jdText.trim() || !jdFile || isUploading}>
                                    {saved ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                    {saved ? 'Uploaded!' : isUploading ? 'Uploading...' : 'Upload JD'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6" />
            </div>
        </div>
    );
}
