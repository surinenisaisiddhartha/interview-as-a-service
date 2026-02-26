'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Bell, Shield, Users } from 'lucide-react';

export default function AdminSettings() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
                <p className="text-gray-500">Configure your organization&apos;s HireSphere settings.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-2">
                    {[{ icon: Settings, label: 'General', active: true }, { icon: Bell, label: 'Notifications', active: false }, { icon: Shield, label: 'Security', active: false }, { icon: Users, label: 'Permissions', active: false }].map(({ icon: Icon, label, active }) => (
                        <button key={label} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left ${active ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{label}</span>
                        </button>
                    ))}
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader title="Company Information" />
                        <CardContent className="space-y-6">
                            {[{ label: 'Company Name', value: 'TechCorp Inc.' }, { label: 'Primary Contact', value: 'admin@techcorp.com' }, { label: 'Billing Email', value: 'billing@techcorp.com' }].map(({ label, value }) => (
                                <div key={label} className="grid grid-cols-3 gap-4 items-center">
                                    <label className="text-sm font-bold text-gray-700">{label}</label>
                                    <input defaultValue={value} className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            ))}
                            <div className="flex justify-end"><Button>Save Changes</Button></div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
