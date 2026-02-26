'use client';

import React, { useCallback, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle2, X, Wand2, Loader2 } from 'lucide-react';

export default function UploadResumePage() {
    const [files, setFiles] = useState<File[]>([]);
    const [processing, setProcessing] = useState(false);
    const [processed, setProcessed] = useState<string[]>([]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const dropped = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.docx'));
        setFiles(prev => [...prev, ...dropped]);
    }, []);

    const handleProcess = async () => {
        setProcessing(true);
        await new Promise(res => setTimeout(res, 2000));
        setProcessed(files.map(f => f.name));
        setProcessing(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Upload Resumes</h1>
                <p className="text-gray-500">Add candidate profiles. AI will parse and extract skills automatically.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="p-0">
                            <div
                                onDrop={handleDrop}
                                onDragOver={e => e.preventDefault()}
                                className="m-6 border-2 border-dashed border-blue-200 rounded-2xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
                                onClick={() => document.getElementById('resume-upload')?.click()}
                            >
                                <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-700 mb-2">Drop resumes here or click to browse</h3>
                                <p className="text-sm text-gray-400">Supports PDF and DOCX files. Up to 20 files at once.</p>
                                <input id="resume-upload" type="file" multiple accept=".pdf,.docx" className="hidden"
                                    onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
                            </div>
                        </CardContent>
                    </Card>

                    {files.length > 0 && (
                        <Card>
                            <CardHeader title={`${files.length} ${files.length === 1 ? 'File' : 'Files'} Queued`} action={
                                <Button onClick={handleProcess} disabled={processing}>
                                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                                    {processing ? 'Parsing...' : 'Parse with AI'}
                                </Button>
                            } />
                            <div className="divide-y divide-gray-100">
                                {files.map((file, idx) => (
                                    <div key={idx} className="px-6 py-3 flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            {processed.includes(file.name) ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <FileText className="w-5 h-5 text-gray-400" />}
                                            <span className="text-sm font-medium text-gray-700">{file.name}</span>
                                            <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                        {!processed.includes(file.name) && (
                                            <button onClick={() => setFiles(f => f.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                <Card>
                    <CardHeader title="Parsing Tips" />
                    <CardContent className="space-y-4 text-sm text-gray-600">
                        {['Upload PDFs for best extraction accuracy.', 'Ensure resumes are text-based, not scanned images.', 'AI extracts: name, email, skills, experience, education.', 'Results are matched against active Job Descriptions.'].map((tip, i) => (
                            <div key={i} className="flex items-start space-x-2">
                                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                <p>{tip}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
