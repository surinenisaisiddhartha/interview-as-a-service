'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Bell, Shield, Key, Globe, Palette } from 'lucide-react';

export default function SuperAdminSettings() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
                <p className="text-gray-500">Manage global configuration for HireSphere.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-2">
                    {[
                        { icon: Settings, label: 'General', active: true },
                        { icon: Bell, label: 'Notifications', active: false },
                        { icon: Shield, label: 'Security', active: false },
                        { icon: Key, label: 'API Keys', active: false },
                        { icon: Globe, label: 'Localization', active: false },
                        { icon: Palette, label: 'Appearance', active: false },
                    ].map(({ icon: Icon, label, active }) => (
                        <button key={label} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all ${active ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{label}</span>
                        </button>
                    ))}
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader title="General Settings" />
                        <CardContent className="space-y-6">
                            {[
                                { label: 'Platform Name', value: 'HireSphere', type: 'text' },
                                { label: 'Support Email', value: 'support@hiresphere.com', type: 'email' },
                                { label: 'Default Language', value: 'English (US)', type: 'select' },
                                { label: 'Timezone', value: 'UTC+05:30 (IST)', type: 'select' },
                            ].map(({ label, value, type }) => (
                                <div key={label} className="grid grid-cols-3 gap-4 items-center">
                                    <label className="text-sm font-bold text-gray-700 col-span-1">{label}</label>
                                    <input type={type === 'select' ? 'text' : type} defaultValue={value} className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            ))}
                            <div className="flex justify-end">
                                <Button>Save Changes</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader title="Danger Zone" />
                        <CardContent className="space-y-4">
                            <div className="p-4 border border-red-200 rounded-xl bg-red-50">
                                <h4 className="font-bold text-red-800 mb-1">Reset Platform Data</h4>
                                <p className="text-sm text-red-600 mb-3">This will permanently delete all interview data. This action cannot be undone.</p>
                                <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-100">Reset All Data</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
