'use client';

import React, { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { DataTable } from '@/components/ui/datatable';
import { Button } from '@/components/ui/button';
import { MOCK_USERS } from '@/data/mockData';
import { Search, UserPlus, Filter, Shield, Mail } from 'lucide-react';
import { User, Role } from '@/types';

export default function SuperAdminUsers() {
    const [searchTerm, setSearchTerm] = useState('');

    const columns = [
        {
            header: 'User', accessor: (u: User) => (
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                        {u.name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Role', accessor: (u: User) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${u.role === Role.SUPER_ADMIN ? 'bg-red-100 text-red-700' :
                        u.role === Role.ADMIN ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {u.role.replace('_', ' ')}
                </span>
            )
        },
        { header: 'Company', accessor: (u: User) => u.companyName || 'HireSphere (Internal)' },
        {
            header: 'Status', accessor: (u: User) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {u.status}
                </span>
            )
        },
        { header: 'Last Login', accessor: (u: User) => u.lastActive || 'Today' },
        {
            header: 'Actions', accessor: () => (
                <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Mail className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Shield className="w-4 h-4" /></Button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Platform Users</h1>
                    <p className="text-gray-500">Manage access control for all platform participants.</p>
                </div>
                <Button>
                    <UserPlus className="w-4 h-4 mr-2" /> Invite User
                </Button>
            </div>

            <Card>
                <CardHeader title="All Users" action={
                    <div className="flex space-x-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm outline-none w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="sm"><Filter className="w-4 h-4" /></Button>
                    </div>
                } />
                <DataTable
                    columns={columns}
                    data={MOCK_USERS.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))}
                />
            </Card>
        </div>
    );
}
