'use client';

import Link from 'next/link';
import { BrainCircuit, CheckCircle, ArrowRight, Zap, Shield, Globe } from 'lucide-react';

const plans = [
    {
        name: 'Basic',
        price: '$99',
        description: 'Perfect for small teams just getting started',
        features: ['Up to 50 interviews/month', '1 AI Agent', 'Basic analytics', 'Email support'],
        highlighted: false,
        cta: 'Get Started',
    },
    {
        name: 'Pro',
        price: '$299',
        description: 'For growing recruitment teams with higher volume',
        features: ['Up to 500 interviews/month', '5 AI Agents', 'Advanced analytics', 'Priority support', 'Custom JD templates', 'ATS integrations'],
        highlighted: true,
        cta: 'Start Free Trial',
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        description: 'For large organizations with custom requirements',
        features: ['Unlimited interviews', 'Unlimited AI Agents', 'White-label options', 'Dedicated CSM', 'Custom integrations', 'SLA guarantee', 'On-premise option'],
        highlighted: false,
        cta: 'Contact Sales',
    },
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-white">
            <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
                <Link href="/" className="flex items-center space-x-2">
                    <BrainCircuit className="w-8 h-8 text-blue-600" />
                    <span className="text-xl font-black text-gray-900">HireSphere</span>
                </Link>
                <div className="flex items-center space-x-4">
                    <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Login</Link>
                    <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">Sign Up</Link>
                </div>
            </nav>

            <section className="py-24 px-8 text-center bg-gradient-to-b from-blue-50 to-white">
                <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-black uppercase tracking-wider mb-6">Simple Pricing</span>
                <h1 className="text-5xl font-black text-gray-900 mb-4">Choose Your Plan</h1>
                <p className="text-xl text-gray-500 max-w-xl mx-auto">Flexible pricing that scales with your hiring needs. No hidden fees.</p>
            </section>

            <section className="max-w-6xl mx-auto px-8 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div key={plan.name} className={`rounded-2xl p-8 border-2 flex flex-col ${plan.highlighted ? 'border-blue-600 bg-blue-600 text-white shadow-2xl shadow-blue-200 scale-105' : 'border-gray-100 bg-white'}`}>
                            <div className="mb-6">
                                <h3 className={`text-lg font-black uppercase tracking-wider ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>{plan.name}</h3>
                                <div className="text-4xl font-black mt-2 mb-2">{plan.price}<span className={`text-base font-normal ${plan.highlighted ? 'text-blue-200' : 'text-gray-400'}`}>{plan.price !== 'Custom' ? '/mo' : ''}</span></div>
                                <p className={`text-sm ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>{plan.description}</p>
                            </div>
                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features.map((f) => (
                                    <li key={f} className={`flex items-center text-sm ${plan.highlighted ? 'text-blue-50' : 'text-gray-600'}`}>
                                        <CheckCircle className="w-4 h-4 mr-3 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href={plan.price === 'Custom' ? '/contact' : '/signup'} className={`block text-center py-3 rounded-xl font-bold text-sm transition-all ${plan.highlighted ? 'bg-white text-blue-700 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                                {plan.cta} <ArrowRight className="inline w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    {[{ icon: Shield, title: 'SOC 2 Compliant', desc: 'Your data is protected by enterprise-grade security.' },
                    { icon: Globe, title: 'Global Infrastructure', desc: '99.99% uptime SLA with multi-region redundancy.' },
                    { icon: Zap, title: 'Instant Onboarding', desc: 'Get up and running in minutes, not months.' }].map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="p-8 bg-gray-50 rounded-2xl">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4"><Icon className="w-6 h-6" /></div>
                            <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                            <p className="text-sm text-gray-500">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
