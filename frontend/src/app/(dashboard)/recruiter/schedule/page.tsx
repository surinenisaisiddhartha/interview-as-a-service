'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Plus, Video, Check } from 'lucide-react';

const SLOTS = [
    { time: '09:00 AM', candidate: 'Mark Spencer', role: 'Senior React Dev', agent: 'Aurora AI', status: 'confirmed' },
    { time: '10:30 AM', candidate: 'Sarah Jenkins', role: 'Backend Architect', agent: 'Zenith Bot', status: 'pending' },
    { time: '12:00 PM', candidate: '', role: '', agent: '', status: 'free' },
    { time: '02:00 PM', candidate: 'Alex Turner', role: 'Data Scientist', agent: 'Vision Pro', status: 'confirmed' },
    { time: '03:30 PM', candidate: '', role: '', agent: '', status: 'free' },
    { time: '05:00 PM', candidate: 'Priya Nair', role: 'Product Lead', agent: 'Aurora AI', status: 'pending' },
];

export default function SchedulePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Interview Schedule</h1>
                    <p className="text-gray-500">Today&apos;s AI interview calendar. All times are in IST.</p>
                </div>
                <Button><Plus className="w-4 h-4 mr-2" /> Schedule Interview</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader title="Today — Feb 23, 2026" subtitle="Monday" action={
                        <div className="flex space-x-2">
                            <Button variant="outline" size="sm">← Prev</Button>
                            <Button variant="outline" size="sm">Next →</Button>
                        </div>
                    } />
                    <div className="divide-y divide-gray-100">
                        {SLOTS.map((slot, idx) => (
                            <div key={idx} className={`px-6 py-4 flex items-center space-x-4 ${slot.status === 'free' ? 'opacity-40 hover:opacity-100 cursor-pointer hover:bg-blue-50/50' : ''}`}>
                                <div className="w-20 text-sm font-bold text-gray-500 shrink-0">{slot.time}</div>
                                {slot.status !== 'free' ? (
                                    <>
                                        <div className={`w-1.5 h-12 rounded-full shrink-0 ${slot.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-400'}`} />
                                        <div className="flex items-center space-x-3 flex-1">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black">{slot.candidate.charAt(0)}</div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{slot.candidate}</p>
                                                <p className="text-xs text-gray-500">{slot.role} • Agent: {slot.agent}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${slot.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{slot.status}</span>
                                            <Button variant="ghost" size="sm"><Video className="w-4 h-4" /></Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 text-sm text-gray-400 flex items-center space-x-2">
                                        <Plus className="w-4 h-4" />
                                        <span>Available slot — click to schedule</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader title="Today's Summary" />
                        <CardContent className="space-y-4">
                            {[{ icon: Calendar, label: 'Total Interviews', value: '4' }, { icon: Check, label: 'Confirmed', value: '2' }, { icon: Clock, label: 'Pending', value: '2' }, { icon: User, label: 'Free Slots', value: '2' }].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-sm text-gray-600"><Icon className="w-4 h-4 text-gray-400" />{label}</div>
                                    <span className="font-bold text-gray-900">{value}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
