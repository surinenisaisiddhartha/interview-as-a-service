'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Briefcase, Building2, Upload, FileText, CheckCircle2,
    X, BarChart3, Loader2, Search, Filter, ChevronRight,
    User, MoreHorizontal, Check, ExternalLink, Sparkles,
    MapPin, Calendar, Download, BadgeCheck, Clock, Mail, Phone,
    ArrowLeft, Share2, Printer
} from 'lucide-react';
import { JD } from '@/types';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/input';

export default function JDDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const id = params?.id as string;
    const userId = (session as any)?.user?.id;

    const [jd, setJd] = useState<JD | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [pendingCandidates, setPendingCandidates] = useState<{ candidate_id: string, s3_key: string, filename: string }[]>([]);
    const [results, setResults] = useState<any>({});
    const [showResults, setShowResults] = useState(false);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [candidateProfile, setCandidateProfile] = useState<any>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(false);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const fetchJDData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const jdRes = await fetch(`/api/jds/${id}`);
                if (jdRes.ok) {
                    const jdData = await jdRes.json();
                    setJd(jdData);

                    const matchesRes = await fetch(`/api/jds/${id}/matches`);
                    if (matchesRes.ok) {
                        const matchesData = await matchesRes.json();
                        if (matchesData.match_data && Object.keys(matchesData.match_data).length > 0) {
                            setResults(matchesData.match_data);
                            setShowResults(true);
                        }
                    }
                } else {
                    toast.error("Failed to load job description");
                }
            } catch (error) {
                console.error("Error fetching JD data:", error);
                toast.error("Error loading page data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchJDData();
    }, [id]);

    const handleUpload = async (uploadedFiles: File[]) => {
        if (uploadedFiles.length === 0) return;
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('companyId', jd?.companyId || '');
            formData.append('userId', userId || '');
            formData.append('jdId', id);
            uploadedFiles.forEach(file => {
                formData.append('files', file);
            });

            const uploadRes = await fetch('/api/resumes/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) throw new Error('Upload failed');

            const uploadData = await uploadRes.json();
            const successful = (uploadData.results || [])
                .filter((r: any) => r.status === 'success')
                .map((r: any) => ({
                    candidate_id: r.candidate_id,
                    s3_key: r.s3_key,
                    filename: r.filename
                }));

            if (successful.length > 0) {
                setPendingCandidates(prev => [...prev, ...successful]);
                toast.success(`${successful.length} resumes uploaded`);
            }
        } catch (error) {
            toast.error("Failed to upload resumes");
        } finally {
            setUploading(false);
            setFiles([]);
        }
    };

    const handleProcess = async () => {
        if (pendingCandidates.length === 0) return;
        setProcessing(true);
        try {
            const processRes = await fetch('/api/resumes/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jdId: id,
                    candidates: pendingCandidates.map(c => ({
                        candidate_id: c.candidate_id,
                        s3_key: c.s3_key
                    })),
                }),
            });

            if (!processRes.ok) throw new Error('Processing failed');

            const processData = await processRes.json();
            setResults((prev: any) => ({ ...prev, ...(processData.match_data || {}) }));
            setPendingCandidates([]);
            setShowResults(true);
            toast.success("Analysis complete");
        } catch (error) {
            toast.error("Processing failed");
        } finally {
            setProcessing(false);
        }
    };

    const fetchCandidateProfile = async (candidateId: string) => {
        setIsProfileLoading(true);
        setSelectedCandidateId(candidateId);
        try {
            const res = await fetch(`/api/candidates/${candidateId}`);
            if (res.ok) {
                const data = await res.json();
                setCandidateProfile(data);
            } else {
                toast.error("Failed to load candidate profile");
            }
        } catch (error) {
            console.error("Error fetching candidate profile:", error);
            toast.error("Error loading profile");
        } finally {
            setIsProfileLoading(false);
        }
    };

    const sortedCandidates = useMemo(() => {
        return Object.values(results)
            .filter((c: any) =>
                (c.candidate_name || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a: any, b: any) => {
                const scoreA = a.match_scores?.final_match_percentage || a.final_match_percentage || 0;
                const scoreB = b.match_scores?.final_match_percentage || b.final_match_percentage || 0;
                return scoreB - scoreA;
            });
    }, [results, searchTerm]);

    if (isLoading) return <div className="p-24 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
    if (!jd) return <div className="p-24 text-center">Role not found</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 px-4 py-6 font-sans text-slate-900">
            {/* Breadcrumb Header */}
            <div className="space-y-1">
                <nav className="flex items-center space-x-2 text-[13px] font-medium text-slate-500">
                    <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => router.push('/admin/jds')}>JD Section</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-900">{jd.title}</span>
                </nav>
                <div className="flex items-baseline space-x-3">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">{jd.title}</h1>
                    <span className="text-slate-400 font-medium">/</span>
                    <p className="text-slate-500 font-medium">
                        {jd.clientCompany ? `${jd.clientCompany} (via ${jd.companyName})` : jd.companyName}
                    </p>
                </div>
            </div>

            {/* Drag & Drop Upload Bar */}
            <div
                className={`group relative overflow-hidden bg-white border-2 border-dashed rounded-2xl transition-all duration-200 ${isDragging ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300'
                    }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const droppedFiles = Array.from(e.dataTransfer.files);
                    handleUpload(droppedFiles);
                }}
            >
                <div className="px-8 py-10 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        {uploading ? <Loader2 className="animate-spin" /> : <Upload className="w-6 h-6" />}
                    </div>
                    <div>
                        <p className="text-base font-semibold text-slate-900">
                            {uploading ? 'Uploading your resumes...' : 'Upload Resumes – Drag & Drop or Browse Files'}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">Supports PDF, DOC, DOCX</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="rounded-xl px-8 border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                        disabled={uploading}
                    >
                        Browse Files
                    </Button>
                    <input
                        id="file-upload"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleUpload(Array.from(e.target.files || []))}
                    />
                </div>
                {/* Visual indicator for drag status */}
                {isDragging && <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />}
            </div>

            {/* Pending Files Action Bar */}
            {pendingCandidates.length > 0 && (
                <div className="bg-blue-600 text-white rounded-2xl px-6 py-4 flex items-center justify-between shadow-xl shadow-blue-200 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold">{pendingCandidates.length} Resumes Ready</p>
                            <p className="text-xs text-blue-100 opacity-90">Upload successful. Ready to run AI matching analysis.</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleProcess}
                        disabled={processing}
                        className="bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-bold px-8"
                    >
                        {processing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {processing ? 'Analyzing...' : 'Process All Resumes'}
                    </Button>
                </div>
            )}

            {/* Main Candidates Section */}
            <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search candidates by name..."
                            className="pl-10 rounded-xl border-slate-200 bg-white focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 text-sm flex-1 sm:flex-none">
                            <Filter className="w-4 h-4 mr-2" /> Filters
                        </Button>
                        <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 text-sm flex-1 sm:flex-none">
                            <BarChart3 className="w-4 h-4 mr-2" /> Match %
                        </Button>
                    </div>
                </div>

                {/* Candidate List */}
                <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl bg-white border">
                    <div className="divide-y divide-slate-100">
                        {sortedCandidates.length > 0 ? (
                            sortedCandidates.map((c: any) => {
                                const score = Math.round(c.match_scores?.final_match_percentage || c.final_match_percentage || 0);
                                const isQualified = (c.qualification_status || '').toLowerCase() === 'qualified';

                                return (
                                    <div key={c.candidate_id} className="group p-6 hover:bg-slate-50 transition-all flex flex-col lg:flex-row lg:items-center gap-6">
                                        {/* Candidate Info */}
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                                    {c.candidate_name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 flex items-center">
                                                        {c.candidate_name || 'Anonymous candidate'}
                                                        <ExternalLink className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {(c.matched_required_skills || []).slice(0, 4).map((skill: string) => (
                                                            <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-bold tracking-tight">
                                                                {skill.toUpperCase()}
                                                            </span>
                                                        ))}
                                                        {(c.matched_required_skills || []).length > 4 && (
                                                            <span className="text-[11px] text-slate-400 font-medium self-center">
                                                                +{(c.matched_required_skills || []).length - 4} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* AI Insight Snippet */}
                                            <div className="flex items-start space-x-2 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50">
                                                <Sparkles className="w-3.5 h-3.5 text-emerald-600 mt-0.5" />
                                                <p className="text-[12px] text-emerald-800 leading-tight">
                                                    <span className="font-bold">AI Insight:</span> Strong matching on required skills. {c.experience_years ? `${c.experience_years} years exp.` : ''}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Matching Stats */}
                                        <div className="w-full lg:w-48 space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className={`text-[11px] font-black uppercase tracking-wider ${isQualified ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                    {isQualified ? 'Qualified' : 'Disqualified'}
                                                </span>
                                                <span className="text-xl font-black text-slate-900">{score}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-700 ${score > 70 ? 'bg-blue-600' : score > 40 ? 'bg-slate-400' : 'bg-rose-400'}`}
                                                    style={{ width: `${score}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                className="rounded-xl border-slate-200 text-slate-700 font-bold text-xs px-4 h-9"
                                                onClick={() => fetchCandidateProfile(c.candidate_id)}
                                            >
                                                View Profile
                                            </Button>
                                            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs px-4 h-9 shadow-md shadow-blue-100">
                                                Shortlist
                                            </Button>
                                            <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-slate-600 w-9 h-9">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-20 text-center space-y-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                    <User className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">No candidates analyzed</p>
                                    <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">
                                        Upload resumes above to see AI-ranked candidates for this role.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
            {/* Candidate Profile Slide-over */}
            {selectedCandidateId && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity animate-in fade-in"
                        onClick={() => { setSelectedCandidateId(null); setCandidateProfile(null); }}
                    />

                    {/* Panel */}
                    <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-[#F8FAFC] z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Header Navigation */}
                        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                            <button
                                onClick={() => { setSelectedCandidateId(null); setCandidateProfile(null); }}
                                className="flex items-center text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to candidates
                            </button>
                            <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 rounded-xl h-9 w-9">
                                    <Share2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 rounded-xl h-9 w-9">
                                    <Printer className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:text-slate-600 rounded-xl h-9 w-9"
                                    onClick={() => { setSelectedCandidateId(null); setCandidateProfile(null); }}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto">
                            {isProfileLoading ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4">
                                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                                    <p className="text-slate-500 font-medium">Fetching profile details...</p>
                                </div>
                            ) : candidateProfile ? (
                                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Column (Main Content) */}
                                    <div className="lg:col-span-2 space-y-8">
                                        {/* Profile Hero */}
                                        <div className="flex items-start space-x-6">
                                            <div className="relative">
                                                <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400 border-2 border-white shadow-sm overflow-hidden">
                                                    {candidateProfile.full_name?.[0] || 'U'}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-white">
                                                    <Check className="w-4 h-4 stroke-[3px]" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{candidateProfile.full_name}</h2>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                                    <div className="flex items-center text-slate-600 font-bold text-sm">
                                                        <BadgeCheck className="w-4 h-4 text-blue-500 mr-1.5" />
                                                        {candidateProfile.current_designation || 'Candidate'}
                                                    </div>
                                                    <div className="flex items-center text-slate-500 font-medium text-sm">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                                                        {candidateProfile.current_company || 'Remote'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center text-slate-400 text-xs font-medium mt-2">
                                                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                                                    Last active 2 hours ago
                                                </div>
                                            </div>
                                        </div>

                                        {/* Matched Skills */}
                                        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                                            <h3 className="text-lg font-black text-slate-900">Matched Skills</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {results[selectedCandidateId]?.matched_required_skills?.map((skill: string) => (
                                                    <div key={skill} className="flex items-center px-4 py-2 bg-blue-50/50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100/50">
                                                        <Check className="w-3 h-3 mr-2" />
                                                        {skill}
                                                    </div>
                                                ))}
                                                {results[selectedCandidateId]?.missing_required_skills?.map((skill: string) => (
                                                    <div key={skill} className="flex items-center px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-xs font-bold border border-slate-100">
                                                        {skill}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* AI Insight */}
                                        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="text-lg font-black text-slate-900">AI Insight</h3>
                                                <div className="flex">
                                                    <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                                                    <div className="w-2 h-2 rounded-full border-2 border-emerald-500 -ml-1 mt-2" />
                                                </div>
                                            </div>
                                            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/30">
                                                <p className="text-slate-700 leading-relaxed text-sm">
                                                    Candidate shows strong technical experience in <span className="font-bold text-slate-900">{results[selectedCandidateId]?.matched_required_skills?.slice(0, 3).join(", ")}</span>.
                                                    {candidateProfile.summary || "This candidate possesses the core competencies required for the role."}
                                                </p>
                                                <p className="text-slate-500 text-xs mt-3 font-medium italic underline underline-offset-4 decoration-blue-200">
                                                    Highly qualified for {jd.title} role.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Experience Card */}
                                        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                                        <Building2 className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900">{candidateProfile.current_company || 'Current Company'}</h4>
                                                        <p className="text-sm text-slate-500 font-medium">{candidateProfile.city || 'Remote'}</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm text-slate-400 font-medium">2020 – Present</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{candidateProfile.current_designation || 'Professional'}</p>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {['Frontend', 'Developer', 'React'].map(tag => (
                                                        <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-[11px] font-bold border border-slate-100">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Download Bar */}
                                        <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                            <div className="flex items-center text-slate-500 font-bold text-sm">
                                                <Download className="w-4 h-4 mr-2" />
                                                Download Resume
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-black text-slate-400 uppercase">PDF</div>
                                                <div className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-black text-slate-400 uppercase">UI</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column (Sidebar) */}
                                    <div className="space-y-6">
                                        {/* Mini Profile Card */}
                                        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold overflow-hidden border border-slate-50">
                                                    {candidateProfile.full_name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 text-sm leading-tight">{candidateProfile.full_name}</h4>
                                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{candidateProfile.current_designation || 'Engineer'}</p>
                                                    <div className="flex items-center text-slate-400 text-[10px] mt-1">
                                                        <CheckCircle2 className="w-3 h-3 mr-1 text-slate-300" />
                                                        {candidateProfile.overall_experience_years || '0'} years experience
                                                    </div>
                                                </div>
                                            </div>

                                            {/* AI Match Box */}
                                            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-lg font-black text-slate-900 tracking-tight">AI Match</span>
                                                    <div className="flex items-center px-2 py-1 bg-white rounded-lg border border-slate-200">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                                                        <span className="text-[11px] font-black text-slate-900">{Math.round(results[selectedCandidateId]?.match_scores?.final_match_percentage || 0)}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 transition-all duration-1000"
                                                        style={{ width: `${Math.round(results[selectedCandidateId]?.match_scores?.final_match_percentage || 0)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm h-11 shadow-lg shadow-blue-100">
                                                    Shortlist Candidate
                                                </Button>
                                                <Button variant="outline" className="w-full border-slate-200 text-slate-700 rounded-xl font-bold text-sm h-11 bg-white">
                                                    Schedule Interview
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Experience List Sidebar */}
                                        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                                            <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider">Experience</h4>
                                            <div className="space-y-4">
                                                <div className="flex items-start space-x-3">
                                                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white mt-0.5 shadow-sm">
                                                        <div className="text-[10px] font-black">+</div>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs font-black text-slate-900 leading-tight">{candidateProfile.current_company || 'TechSolutions'}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">{candidateProfile.current_designation || 'Engineer'}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">2020 – Present</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start space-x-3">
                                                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white mt-0.5 shadow-sm">
                                                        <div className="text-[10px] font-black">F</div>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs font-black text-slate-900 leading-tight">Previous Company</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">Engineer</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">2018 – 2020</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="outline" className="w-full border-slate-100 text-slate-500 rounded-xl font-bold text-xs h-10 bg-slate-50/50 hover:bg-slate-50">
                                                <Download className="w-3.5 h-3.5 mr-2" />
                                                Download Resume
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    No profile data available.
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}



