'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { DataTable } from '@/components/ui/datatable';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { FormInput } from '@/components/forms/form-input';
import { UserPlus, Settings, Trash2, Shield, Mail, Eye, ChevronLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function SuperAdminCompanyUsers() {
    const { id: userCompanyId } = useParams() as { id: string };
    const router = useRouter();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [newUserData, setNewUserData] = useState({ name: '', email: '', phone: '', role: 'company_admin' });

    useEffect(() => {
        if (userCompanyId) {
            fetchUsers();
        }
    }, [userCompanyId]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/users?companyId=${userCompanyId}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newUserData.email,
                    name: newUserData.name,
                    phone: newUserData.phone,
                    role: newUserData.role,
                    companyId: userCompanyId
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create user');
            }

            // Success
            setIsModalOpen(false);
            setNewUserData({ name: '', email: '', phone: '', role: 'company_admin' });
            fetchUsers();

        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = [
        {
            header: 'User', accessor: (u: any) => (
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-100">
                        {u.email ? u.email.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <span className="font-semibold block text-gray-900">{u.name || u.email.split('@')[0]}</span>
                        <span className="text-xs text-gray-500">{u.email}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Role', accessor: (u: any) => (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase rounded">
                    {u.role.replace('_', ' ')}
                </span>
            )
        },
        {
            header: 'Enrolled On', accessor: (u: any) => (
                <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
            )
        },
        {
            header: 'Actions', accessor: () => (
                <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" type="button"><Settings className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" type="button" className="text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <Button variant="ghost" size="sm" onClick={() => router.push('/super-admin/companies')}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Companies
            </Button>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Company Users Management</h1>
                    <p className="text-gray-500">Create company admins and recruiters for this specific organization.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" /> Invite User
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-gray-100 flex items-center space-x-4 rounded-xl">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Shield className="w-6 h-6" /></div>
                    <div><p className="text-xs font-bold text-gray-500 uppercase">Total Users</p><p className="text-xl font-black">{users.length}</p></div>
                </div>
                <div className="p-4 bg-white border border-gray-100 flex items-center space-x-4 rounded-xl">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Eye className="w-6 h-6" /></div>
                    <div><p className="text-xs font-bold text-gray-500 uppercase">Company ID</p><p className="text-xs break-all text-gray-500">{userCompanyId}</p></div>
                </div>
                <div className="p-4 bg-white border border-gray-100 flex items-center space-x-4 rounded-xl">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Mail className="w-6 h-6" /></div>
                    <div><p className="text-xs font-bold text-gray-500 uppercase">Pending Invites</p><p className="text-xl font-black">0</p></div>
                </div>
            </div>

            <Card>
                <CardHeader title="Internal Team Members" subtitle="Real-time access and role management" />
                <DataTable columns={columns} data={users} />
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title="Invite New User">
                <form className="space-y-4" onSubmit={handleCreateUser}>
                    <div className="p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 text-sm flex items-start space-x-3">
                        <Shield className="w-5 h-5 shrink-0" />
                        <p>This user will be securely assigned to Company ID <strong>{userCompanyId}</strong> and locked to its data scope.</p>
                    </div>

                    {errorMsg && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                            {errorMsg}
                        </div>
                    )}

                    <FormInput
                        label="Full Name"
                        type="text"
                        required
                        placeholder="John Doe"
                        value={newUserData.name}
                        onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    />

                    <FormInput
                        label="Work Email"
                        type="email"
                        required
                        placeholder="user@company.com"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    />

                    <FormInput
                        label="Phone Number"
                        type="tel"
                        required
                        placeholder="+1 555-0100"
                        value={newUserData.phone}
                        onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                    />

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700">Role</label>
                        <select
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                            value={newUserData.role}
                            onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                        >
                            <option value="company_admin">Company Admin</option>
                            <option value="recruiter">Recruiter</option>
                        </select>
                    </div>

                    <div className="text-xs text-gray-500 mt-1 mb-4">
                        An email will be sent by AWS Cognito to this address with a temporary password to login.
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Send Invitation'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
