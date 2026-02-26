'use client';

import Link from 'next/link';
import { BrainCircuit, Users, Zap, Globe, Award } from 'lucide-react';

const team = [
    { name: 'Arjun Sharma', role: 'CEO & Co-Founder', initials: 'AS' },
    { name: 'Priya Nair', role: 'CTO & Co-Founder', initials: 'PN' },
    { name: 'Marcus Lee', role: 'Head of AI Research', initials: 'ML' },
    { name: 'Sofia Chen', role: 'VP Product', initials: 'SC' },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
                <Link href="/" className="flex items-center space-x-2">
                    <BrainCircuit className="w-8 h-8 text-blue-600" />
                    <span className="text-xl font-black text-gray-900">HireSphere</span>
                </Link>
                <div className="flex items-center space-x-6">
                    <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">Pricing</Link>
                    <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Login</Link>
                    <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Get Started</Link>
                </div>
            </nav>

            <section className="py-24 px-8 text-center bg-gradient-to-b from-blue-50 to-white">
                <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-black uppercase tracking-wider mb-6">Our Story</span>
                <h1 className="text-5xl font-black text-gray-900 mb-6 max-w-3xl mx-auto leading-tight">
                    Building the Future of Fair, Intelligent Hiring
                </h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                    HireSphere was founded with one mission: eliminate bias from technical hiring using AI-powered interviews that evaluate candidates on what truly matters.
                </p>
            </section>

            <section className="max-w-5xl mx-auto px-8 py-20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-20">
                    {[{ value: '500+', label: 'Companies' }, { value: '1M+', label: 'Interviews' }, { value: '98%', label: 'Satisfaction' }, { value: '40+', label: 'Countries' }].map((stat) => (
                        <div key={stat.label}>
                            <div className="text-4xl font-black text-blue-600 mb-2">{stat.value}</div>
                            <div className="text-gray-500 font-medium">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {[
                        { icon: Zap, title: 'Mission', desc: 'Make exceptional talent accessible to every company, regardless of size or location.' },
                        { icon: Globe, title: 'Vision', desc: 'A world where every interviewing decision is backed by objective, bias-free AI insights.' },
                        { icon: Award, title: 'Values', desc: 'Fairness, transparency, and continuous improvement drive everything we build.' },
                    ].map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="p-8 bg-gray-50 rounded-2xl">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Icon className="w-6 h-6" /></div>
                            <h3 className="text-xl font-bold mb-3">{title}</h3>
                            <p className="text-gray-500">{desc}</p>
                        </div>
                    ))}
                </div>

                <div>
                    <h2 className="text-3xl font-black text-center mb-12">Meet the Team</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {team.map((member) => (
                            <div key={member.name} className="text-center p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-lg transition-shadow">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-black text-lg">
                                    {member.initials}
                                </div>
                                <h4 className="font-bold text-gray-900">{member.name}</h4>
                                <p className="text-sm text-gray-500 mt-1">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
