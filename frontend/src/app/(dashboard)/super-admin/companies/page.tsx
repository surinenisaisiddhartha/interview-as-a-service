'use client';

import React, { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/datatable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Filter, Plus, MoreHorizontal } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { FormInput } from '@/components/forms/form-input';
import { useRouter } from 'next/navigation';

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
        adminEmail: ''
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
            // 1. Create Company
            const compRes = await fetch('/api/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: formData.companyName })
            });
            const compData = await compRes.json();

            if (!compRes.ok) {
                throw new Error(compData.error || 'Failed to create company');
            }

            // 2. Create Company Admin mapped to this company
            if (formData.adminEmail) {
                const userRes = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.adminEmail,
                        role: 'company_admin',
                        companyId: compData.id
                    })
                });

                if (!userRes.ok) {
                    const userData = await userRes.json();
                    throw new Error(userData.error || 'Failed to create company admin');
                }
            }

            // Success
            setIsModalOpen(false);
            setFormData({ companyName: '', adminEmail: '' });
            fetchCompanies();

        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = [
        {
            header: 'Company Name', accessor: (c: any) => (
                <div className="font-semibold text-gray-900">{c.name}</div>
            )
        },
        {
            header: 'Created At', accessor: (c: any) => (
                <div className="text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</div>
            )
        },
        {
            header: '', accessor: () => (
                <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
                    <p className="text-gray-500">Manage all organizations on the HireSphere platform.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add New Company
                </Button>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search companies..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>

                <DataTable
                    columns={columns}
                    data={companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))}
                    onRowClick={(c) => router.push(`/super-admin/companies/${c.id}`)}
                />
            </Card>

            {/* Create Company Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => !isSubmitting && setIsModalOpen(false)}
                title="Add New Company"
            >
                <form onSubmit={handleCreateCompany} className="space-y-4">
                    {errorMsg && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                            {errorMsg}
                        </div>
                    )}

                    <FormInput
                        label="Company Name"
                        required
                        placeholder="e.g. Acme Corp"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />

                    <FormInput
                        label="Admin Email Address"
                        required
                        type="email"
                        placeholder="admin@acme.com"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    />

                    <div className="text-xs text-gray-500 mt-1 mb-4">
                        An email will be sent by AWS Cognito to this address with a temporary password.
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Company & Admin'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
