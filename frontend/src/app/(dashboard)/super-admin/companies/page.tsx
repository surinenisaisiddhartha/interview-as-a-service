'use client';

import React, { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/datatable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Filter, Plus, MoreHorizontal, Building2, Users as UsersIcon, Activity, Shield, BrainCircuit } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { FormInput } from '@/components/forms/form-input';
import { useRouter } from 'next/navigation';
import { companiesApi } from '@/services/companies.api';
import { onboardingApi } from '@/services/onboarding.api';

export default function SuperAdminCompanies() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [companies, setCompanies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [formData, setFormData] = useState({
        companyName: '',
    });

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/companies');
            if (res.ok) {
                const data = await res.json();
                setCompanies(data);
            } else {
                console.error('Failed to fetch companies:', await res.text());
            }
        } catch (error) {
            console.error('Failed to fetch companies', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: formData.companyName })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create company');
            }

            // Success
            setIsModalOpen(false);
            setFormData({ companyName: '' });
            fetchCompanies();

        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = [
        {
            header: 'Company', accessor: (c: any) => (
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 shadow-sm">
                        {c.name ? c.name.charAt(0).toUpperCase() : <Building2 className="w-5 h-5" />}
                    </div>
                    <div>
                        <span className="font-bold block text-gray-900">{c.name}</span>
                        <span className="text-xs text-gray-500 font-medium">ID: {c.id || 'N/A'}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Assigned Voice Agent', accessor: (c: any) => (
                <div className="flex flex-col space-y-1">
                    {c.assigned_agents && c.assigned_agents.length > 0 ? (
                        c.assigned_agents.map((name: string, idx: number) => (
                            <div key={idx} className="flex items-center text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-fit">
                                <BrainCircuit className="w-3 h-3 mr-1.5" />
                                {name}
                            </div>
                        ))
                    ) : (
                        <span className="text-xs text-gray-400 font-medium italic">No agent assigned</span>
                    )}
                </div>
            )
        },
        {
            header: 'Enrolled Date', accessor: (c: any) => (
                <div className="flex items-center space-x-2 text-sm text-gray-600 font-medium">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                </div>
            )
        },
        {
            header: '', accessor: (c: any) => (
                <div className="flex items-center justify-end space-x-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border-0 font-semibold"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/super-admin/companies/${c.id}/users`);
                        }}
                    >
                        Manage Users
                    </Button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            )
        },
    ];

    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
                    <p className="text-gray-500">Manage all organizations on the HireSphere platform.</p>
                </div>
                <div className="flex items-center space-x-3">
                    {viewMode === 'grid' && (
                        <Button variant="outline" onClick={() => setViewMode('table')}>
                            View as Table
                        </Button>
                    )}
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add New Company
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                    onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                    className={`p-4 bg-white border flex items-center space-x-4 rounded-xl shadow-sm transition-all cursor-pointer hover:border-blue-300 hover:shadow-md ${viewMode === 'grid' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100'}`}
                >
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Building2 className="w-6 h-6" /></div>
                    <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Companies</p><p className="text-xl font-black">{companies.length}</p></div>
                </div>
                <div className="p-4 bg-white border border-gray-100 flex items-center space-x-4 rounded-xl shadow-sm">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl"><UsersIcon className="w-6 h-6" /></div>
                    <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Users</p><p className="text-xl font-black">---</p></div>
                </div>
                <div className="p-4 bg-white border border-gray-100 flex items-center space-x-4 rounded-xl shadow-sm">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Activity className="w-6 h-6" /></div>
                    <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Avg. Session Time</p><p className="text-xl font-black">45m</p></div>
                </div>
            </div>

            {viewMode === 'table' ? (
                <Card className="shadow-sm border-gray-200">
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search organizations..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent hover:border-gray-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))}
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {companies.map((c) => (
                        <Card key={c.id} className="hover:shadow-md transition-shadow border-gray-200 overflow-hidden flex flex-col">
                            <div className="h-2 bg-blue-600"></div>
                            <CardContent className="p-6 flex-1 flex flex-col relative">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 shadow-sm text-lg">
                                        {c.name ? c.name.charAt(0).toUpperCase() : <Building2 className="w-6 h-6" />}
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600 p-1">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1">{c.name}</h3>
                                <p className="text-xs text-gray-500 font-medium mb-4">ID: {c.id || 'N/A'}</p>

                                <div className="space-y-2 mb-6">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Assigned Voice Agents</p>
                                    <div className="flex flex-wrap gap-2">
                                        {c.assigned_agents && c.assigned_agents.length > 0 ? (
                                            c.assigned_agents.map((name: string, idx: number) => (
                                                <div key={idx} className="flex items-center text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                                                    <BrainCircuit className="w-3 h-3 mr-1" />
                                                    {name}
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-[10px] text-gray-400 font-medium italic">No agent assigned</span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-auto space-y-4">
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <span>Enrolled</span>
                                        <span className="font-medium text-gray-700">{new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full bg-gray-50 hover:bg-gray-100 border-gray-200"
                                        onClick={() => router.push(`/super-admin/companies/${c.id}/users`)}
                                    >
                                        Manage Users
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {companies.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500 border border-dashed rounded-xl border-gray-300">
                            No organizations found.
                        </div>
                    )}
                </div>
            )}

            {/* Create Company Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => !isSubmitting && setIsModalOpen(false)}
                title="Add New Organization"
            >
                <form onSubmit={handleCreateCompany} className="space-y-4">
                    <div className="p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 text-sm flex items-start space-x-3 mb-2">
                        <Shield className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>Registering a new organization automatically provisions secure S3 storage and a dedicated workspace. You will need to invite users to this company afterward.</p>
                    </div>

                    {errorMsg && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium">
                            {errorMsg}
                        </div>
                    )}

                    <FormInput
                        label="Organization Name"
                        required
                        placeholder="e.g. Acme Corporation"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />

                    <div className="flex items-center justify-end space-x-3 pt-5 border-t border-gray-100 mt-6">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsModalOpen(false)}
                            disabled={isSubmitting}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                            {isSubmitting ? 'Provisioning...' : 'Create Workspace'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
