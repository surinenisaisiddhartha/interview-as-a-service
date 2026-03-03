'use client';

import React, { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { MOCK_JDS, MOCK_COMPANIES } from '@/data/mockData';
import { FilePlus, Briefcase, Upload, FileText, BarChart3, Users, Award, Building2, Pencil } from 'lucide-react';
import { JD } from '@/types';

export default function AdminJDs() {
    const router = useRouter();
    const pathname = usePathname();

    const [jds, setJds] = useState<JD[]>(MOCK_JDS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadMode, setUploadMode] = useState<'paste' | 'file'>('paste');
    const [roleTitle, setRoleTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
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
        setJdFile(null);
        setJdText('');
    };

    const canSaveJD =
        !!roleTitle.trim() &&
        !!companyName.trim() &&
        (uploadMode === 'file' ? !!jdFile : !!jdText.trim());

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
                    <p className="text-gray-500">View and manage all roles and their companies from a single place.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <FilePlus className="w-4 h-4 mr-2" /> Upload JD
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="flex items-center justify-between py-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                                Total Roles
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {jdKpi.totalRoles}
                            </p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center justify-between py-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                                Active Roles
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {jdKpi.activeRoles}
                            </p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
                            <Award className="w-5 h-5 text-emerald-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center justify-between py-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                                Companies
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {jdKpi.companyCount}
                            </p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader title="All Roles" />
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {jds.map(j => (
                            <button
                                key={j.id}
                                type="button"
                                onClick={() => handleRowClick(j)}
                                className="text-left border border-gray-100 rounded-xl p-4 bg-white hover:border-blue-200 hover:shadow-sm transition flex flex-col justify-between"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                            <Briefcase className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {j.title}
                                            </p>
                                            <p className="flex items-center text-xs text-gray-500 mt-1">
                                                <Building2 className="w-3.5 h-3.5 mr-1" />
                                                {companyNameById[j.companyId] || 'Unknown company'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end space-y-1">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                j.status === 'active'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                            }`}
                                        >
                                            {j.status}
                                        </span>
                                        <button
                                            type="button"
                                            className="inline-flex items-center text-[11px] text-blue-600 hover:text-blue-800"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleEditClick(j);
                                            }}
                                        >
                                            <Pencil className="w-3 h-3 mr-1" />
                                            Edit
                                        </button>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1">
                                        Skills
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {j.skills.map(s => (
                                            <span
                                                key={s}
                                                className="px-2 py-0.5 bg-gray-100 rounded text-[11px] font-medium text-gray-700"
                                            >
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-[11px] text-gray-500">
                                        {mockCandidates.length} candidates · {kpi.avgScore}% matching
                                    </p>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                    <span className="text-[11px] text-gray-400">
                                        Click card to edit role information
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        type="button"
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleOpenProcess(j);
                                        }}
                                    >
                                        <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> View
                                    </Button>
                                </div>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

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
                        <Button disabled={!canSaveJD}>Save Role</Button>
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
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                Company Name
                            </label>
                            <input
                                value={companyName}
                                onChange={e => setCompanyName(e.target.value)}
                                placeholder="e.g. TechCorp"
                                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setUploadMode('file')}
                            className={`flex items-center px-3 py-1.5 rounded-full transition ${
                                uploadMode === 'file'
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
                            className={`flex items-center px-3 py-1.5 rounded-full transition ${
                                uploadMode === 'paste'
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
                                                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                                        c.status === 'Shortlisted'
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
