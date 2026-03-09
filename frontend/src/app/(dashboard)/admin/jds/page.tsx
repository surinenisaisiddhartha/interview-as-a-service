'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { MOCK_COMPANIES } from '@/data/mockData';
import { FilePlus, Briefcase, Upload, FileText, BarChart3, Users, Award, Building2, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { JD } from '@/types';

export default function AdminJDs() {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session } = useSession();

    const userRole = (session?.user as any)?.role;
    const userCompanyId = (session?.user as any)?.companyId;
    const userId = (session?.user as any)?.id;

    const [jds, setJds] = useState<JD[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadMode, setUploadMode] = useState<'paste' | 'file'>('paste');
    const [roleTitle, setRoleTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [clientCompanyName, setClientCompanyName] = useState('');
    const [jdFile, setJdFile] = useState<File | null>(null);
    const [jdText, setJdText] = useState('');
    const [isProcessOpen, setIsProcessOpen] = useState(false);
    const [selectedJD, setSelectedJD] = useState<JD | null>(null);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [infoJD, setInfoJD] = useState<JD | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [editingCompanyId, setEditingCompanyId] = useState<string>('');
    const [editingStatus, setEditingStatus] = useState<'active' | 'draft'>('active');
    const [editingSkills, setEditingSkills] = useState<string>('');
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]);

    const fetchRoles = async () => {
        setIsLoadingRoles(true);
        try {
            const res = await fetch('/api/jds');
            if (res.ok) {
                const data = await res.json();
                setJds(data);
            }
        } catch (error) {
            console.error('Failed to fetch JDs:', error);
        } finally {
            setIsLoadingRoles(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await fetch('/api/companies');
            if (res.ok) {
                const data = await res.json();
                setCompanies(data);
            }
        } catch (error) {
            console.error('Failed to fetch companies:', error);
        }
    };

    useEffect(() => {
        if (session) {
            fetchRoles();
            if (userRole === 'superadmin') {
                fetchCompanies();
            }
        }
    }, [session]);

    const handleOpenProcess = (jd: JD) => {
        setSelectedJD(jd);
        setIsProcessOpen(true);
    };

    const handleRowClick = (jd: JD) => {
        const base =
            pathname.startsWith('/recruiter') ? '/recruiter' : '/admin';
        router.push(`${base}/jds/${jd.id}`);
    };

    const handleEditClick = (jd: JD) => {
        setInfoJD(jd);
        setEditingTitle(jd.title);
        setEditingCompanyId(jd.companyId);
        setEditingStatus(jd.status);
        setEditingSkills(jd.skills.join(', '));
        setIsInfoOpen(true);
    };

    const handleCloseJDModal = () => {
        setIsModalOpen(false);
        setUploadMode('paste');
        setRoleTitle('');
        setCompanyName('');
        setClientCompanyName('');
        setJdFile(null);
        setJdText('');
    };

    const canSaveJD = (() => {
        if (!roleTitle.trim()) return false;

        // Superadmin needs a company typed/selected
        if (userRole === 'superadmin' && !companyName.trim()) return false;

        if (uploadMode === 'file') return !!jdFile;
        else return !!jdText.trim();
    })();

    const handleSaveRole = async () => {
        // Resolve target uploading company
        const targetCompanyId = userRole === 'superadmin' ? companyName : userCompanyId;

        if (!targetCompanyId || !userId) {
            toast.error("Missing company or user information required for upload");
            return;
        }

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('role', roleTitle.trim());
            if (clientCompanyName.trim()) {
                formData.append('client_company', clientCompanyName.trim());
            }

            if (uploadMode === 'file' && jdFile) {
                formData.append('file', jdFile);
            } else if (uploadMode === 'paste' && jdText) {
                // If using text paste, bundle it into a Blob as .txt
                const blob = new Blob([jdText], { type: 'text/plain' });
                formData.append('file', blob, 'jd_raw_text.txt');
            }

            const uploadEndpoint = `/api/companies/${targetCompanyId}/users/${userId}/jds/upload`;

            const res = await fetch(uploadEndpoint, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.error || 'Failed to upload Role');
                return;
            }

            toast.success("Job description uploaded successfully!");
            handleCloseJDModal();
            fetchRoles(); // Refresh the grid
        } catch (error: any) {
            console.error(error);
            toast.error("Internal Request Error");
        } finally {
            setIsSaving(false);
        }
    };

    const companyNameById = useMemo(() => {
        const map: Record<string, string> = {};
        MOCK_COMPANIES.forEach(c => {
            map[c.id] = c.name;
        });
        return map;
    }, []);

    const jdKpi = useMemo(() => {
        const totalRoles = jds.length;
        const activeRoles = jds.filter(j => j.status === 'active').length;
        const companyCount = new Set(jds.map(j => j.companyId)).size;
        return { totalRoles, activeRoles, companyCount };
    }, [jds]);

    const handleSaveRoleInfo = () => {
        if (!infoJD) return;
        const cleanedSkills = editingSkills
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        setJds(prev =>
            prev.map(j =>
                j.id === infoJD.id
                    ? {
                        ...j,
                        title: editingTitle.trim() || j.title,
                        companyId: editingCompanyId || j.companyId,
                        status: editingStatus,
                        skills: cleanedSkills.length ? cleanedSkills : j.skills,
                    }
                    : j,
            ),
        );
        setIsInfoOpen(false);
        setInfoJD(null);
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

    const kpi = useMemo(() => {
        const total = mockCandidates.length;
        const avgScore =
            total === 0
                ? 0
                : Math.round(
                    mockCandidates.reduce((sum, c) => sum + c.score, 0) / total,
                );
        const shortlisted = mockCandidates.filter(
            c => c.status === 'Shortlisted',
        ).length;
        return { total, avgScore, shortlisted };
    }, [mockCandidates]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">JD Section</h1>
                    <p className="text-gray-500">Manage job descriptions and roles in one place</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5">
                    <FilePlus className="w-4 h-4 mr-2" /> Upload JD
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-gray-200 shadow-none">
                    <CardContent className="flex items-center justify-between py-5 px-5">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Roles</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{jdKpi.totalRoles}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-none">
                    <CardContent className="flex items-center justify-between py-5 px-5">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Active Roles</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{jdKpi.activeRoles}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-none">
                    <CardContent className="flex items-center justify-between py-5 px-5">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Companies</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{jdKpi.companyCount}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* All Roles Section */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">All Roles</h2>
                <Card className="border border-gray-200 shadow-none rounded-2xl">
                    <CardContent className="p-5">
                        {/* Card panel header */}
                        <div className="flex items-center justify-between mb-5">
                            <span className="font-semibold text-gray-800">All Roles</span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="rounded-lg border-gray-200 text-gray-700 text-sm font-medium h-9 px-4"
                                >
                                    <Users className="w-4 h-4 mr-2 text-gray-500" />
                                    View Candidates
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-lg border-gray-200 text-gray-700 text-sm font-medium h-9 px-4"
                                >
                                    <Pencil className="w-4 h-4 mr-2 text-gray-500" />
                                    Edit Role
                                </Button>
                            </div>
                        </div>

                        {isLoadingRoles ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-blue-500 w-7 h-7" />
                            </div>
                        ) : jds.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No roles yet</p>
                                <p className="text-sm mt-1">Upload a JD to get started</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {jds.map(j => (
                                    <div
                                        key={j.id}
                                        className="border border-gray-200 rounded-xl p-4 bg-white hover:border-blue-200 hover:shadow-sm transition cursor-pointer flex flex-col"
                                        onClick={() => handleRowClick(j)}
                                    >
                                        {/* Role card header */}
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Briefcase className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                                                        {j.title}
                                                    </p>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${j.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {j.status === 'active' ? 'Active' : 'Draft'}
                                                    </span>
                                                </div>
                                                <p className="flex items-center text-xs text-gray-500 mt-1">
                                                    <Building2 className="w-3 h-3 mr-1 flex-shrink-0" />
                                                    <span className="truncate">
                                                        {j.clientCompany
                                                            ? `${j.clientCompany} (via ${j.companyName || 'Unknown'})`
                                                            : j.companyName || 'Unknown company'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Skills */}
                                        <div className="mb-4">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Skills</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(j.skills || []).slice(0, 4).map(s => (
                                                    <span key={s} className="px-2.5 py-1 bg-gray-100 rounded-md text-[11px] font-medium text-gray-700">
                                                        {s}
                                                    </span>
                                                ))}
                                                {(j.skills || []).length > 4 && (
                                                    <span className="text-[11px] text-gray-400 font-medium self-center">+{j.skills.length - 4}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                                            <span className="text-xs text-gray-500">{mockCandidates.length} candidates matched</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-lg border-gray-200 text-gray-700 text-xs h-8 px-3"
                                                onClick={e => { e.stopPropagation(); handleEditClick(j); }}
                                            >
                                                <Pencil className="w-3 h-3 mr-1.5" />
                                                Edit Role
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseJDModal}
                title="Upload Job Description"
                size="lg"
                footer={
                    <>
                        <Button variant="outline" onClick={handleCloseJDModal}>
                            Cancel
                        </Button>
                        <Button disabled={!canSaveJD || isSaving} onClick={handleSaveRole}>
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {isSaving ? 'Uploading...' : 'Save Role'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                Role Name
                            </label>
                            <input
                                value={roleTitle}
                                onChange={e => setRoleTitle(e.target.value)}
                                placeholder="e.g. Senior Frontend Engineer"
                                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        {userRole === 'superadmin' && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                    Company
                                </label>
                                <select
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">Select a company...</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                Client Company (Optional)
                            </label>
                            <input
                                value={clientCompanyName}
                                onChange={e => setClientCompanyName(e.target.value)}
                                placeholder="e.g. Acme Corp"
                                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setUploadMode('file')}
                            className={`flex items-center px-3 py-1.5 rounded-full transition ${uploadMode === 'file'
                                ? 'bg-white shadow text-gray-900'
                                : 'text-gray-500'
                                }`}
                        >
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            Upload JD File
                        </button>
                        <button
                            type="button"
                            onClick={() => setUploadMode('paste')}
                            className={`flex items-center px-3 py-1.5 rounded-full transition ${uploadMode === 'paste'
                                ? 'bg-white shadow text-gray-900'
                                : 'text-gray-500'
                                }`}
                        >
                            <FileText className="w-3.5 h-3.5 mr-1.5" />
                            Paste JD Text
                        </button>
                    </div>

                    <div className="space-y-4">
                        {uploadMode === 'file' ? (
                            <div
                                className="border-2 border-dashed border-blue-200 rounded-2xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/40 transition cursor-pointer"
                                onClick={() =>
                                    document.getElementById('jd-file-input')?.click()
                                }
                            >
                                <Upload className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                                <p className="text-sm font-semibold text-gray-700 mb-1">
                                    Drop JD file here or click to browse
                                </p>
                                <p className="text-xs text-gray-400">
                                    Supports PDF or DOCX.
                                </p>
                                <input
                                    id="jd-file-input"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={e => {
                                        const file =
                                            e.target.files && e.target.files[0]
                                                ? e.target.files[0]
                                                : null;
                                        setJdFile(file);
                                    }}
                                />
                                {jdFile && (
                                    <div className="mt-4 text-xs text-gray-600">
                                        Selected:{' '}
                                        <span className="font-medium">{jdFile.name}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">
                                    Paste JD Text
                                </label>
                                <textarea
                                    className="w-full border rounded-xl p-3 text-sm h-56 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Paste the job description here..."
                                    value={jdText}
                                    onChange={e => setJdText(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isProcessOpen}
                onClose={() => setIsProcessOpen(false)}
                title={
                    selectedJD
                        ? `View Matches: ${selectedJD.title}`
                        : 'View Matches'
                }
                size="lg"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-blue-700 uppercase">
                                    Total Candidates
                                </p>
                                <p className="text-xl font-bold text-blue-900">
                                    {kpi.total}
                                </p>
                            </div>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                                <Award className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-emerald-700 uppercase">
                                    Avg Match Score
                                </p>
                                <p className="text-xl font-bold text-emerald-900">
                                    {kpi.avgScore}%
                                </p>
                            </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-amber-700 uppercase">
                                    Shortlisted
                                </p>
                                <p className="text-xl font-bold text-amber-900">
                                    {kpi.shortlisted}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">
                                    Candidates for this role
                                </p>
                                <p className="text-xs text-gray-500">
                                    Showing mock candidates with name, skills, experience,
                                    status & score.
                                </p>
                            </div>
                        </div>
                        <div className="max-h-80 overflow-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Candidate</th>
                                        <th className="px-4 py-2 text-left">Skills</th>
                                        <th className="px-4 py-2 text-left">Experience</th>
                                        <th className="px-4 py-2 text-left">Status</th>
                                        <th className="px-4 py-2 text-left">Match %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {[...mockCandidates]
                                        .sort((a, b) => a.score - b.score)
                                        .map(c => (
                                            <tr key={c.id}>
                                                <td className="px-4 py-3 font-medium text-gray-800">
                                                    {c.name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {c.skills.map(s => (
                                                            <span
                                                                key={s}
                                                                className="px-2 py-0.5 bg-gray-100 rounded text-[11px] text-gray-700"
                                                            >
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {c.experience}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.status === 'Shortlisted'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : c.status === 'Rejected'
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
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
                title="Role Information"
                size="md"
                footer={
                    <>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsInfoOpen(false);
                                setInfoJD(null);
                            }}
                        >
                            Close
                        </Button>
                        <Button
                            onClick={handleSaveRoleInfo}
                            disabled={
                                !editingTitle.trim() ||
                                !editingCompanyId ||
                                !editingStatus
                            }
                        >
                            Save Changes
                        </Button>
                    </>
                }
            >
                {infoJD && (
                    <div className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                Role Name
                            </label>
                            <input
                                value={editingTitle}
                                onChange={e => setEditingTitle(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                Company
                            </label>
                            <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <select
                                    value={editingCompanyId}
                                    onChange={e => setEditingCompanyId(e.target.value)}
                                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">Select company...</option>
                                    {MOCK_COMPANIES.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                Skills
                            </p>
                            <textarea
                                value={editingSkills}
                                onChange={e => setEditingSkills(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[70px]"
                                placeholder="Comma separated, e.g. React, TypeScript, Node.js"
                            />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                Status
                            </p>
                            <select
                                value={editingStatus}
                                onChange={e =>
                                    setEditingStatus(e.target.value as 'active' | 'draft')
                                }
                                className="border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
