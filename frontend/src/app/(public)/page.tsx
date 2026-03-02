'use client';

import React from 'react';
import Link from 'next/link';
import { Microscope, BrainCircuit, FileText, Globe, CheckCircle, ChevronRight, PlayCircle, ShieldCheck } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
    <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
            <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
);

export default function Home() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <ShieldCheck className="text-white w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black text-gray-900 tracking-tight">HireSphere</span>
                </div>
                <div className="hidden md:flex items-center space-x-8">
                    <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium">Features</a>
                    <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 font-medium">Process</a>
                    <a href="#pricing" className="text-gray-600 hover:text-blue-600 font-medium">Pricing</a>
                </div>
                <div className="flex items-center space-x-4">
                    <Link href="/login" className="text-gray-700 font-semibold hover:text-blue-600">Login</Link>
                    <Link href="/signup" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">Start Free</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                    <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold mb-8 border border-blue-100">
                        <BrainCircuit className="w-4 h-4 mr-2" />
                        Next-Gen Interviewing Platform
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight max-w-4xl mb-8 leading-tight">
                        AI-Powered <span className="text-blue-600 italic">Interview</span> as a Service
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mb-12 leading-relaxed">
                        Automate your first-round screenings with intelligent AI agents. Scale your hiring globally with consistent, bias-free evaluations.
                    </p>
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                        <Link href="/signup" className="px-8 py-4 bg-gray-900 text-white rounded-xl text-lg font-bold hover:bg-gray-800 transition-all shadow-xl shadow-gray-200">
                            Get Started Now
                        </Link>
                        <button className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl text-lg font-bold hover:bg-gray-50 transition-all flex items-center justify-center">
                            <PlayCircle className="w-5 h-5 mr-2" /> Watch Demo
                        </button>
                    </div>

                    <div className="mt-20 relative w-full max-w-5xl">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-[2.5rem] blur-2xl opacity-50"></div>
                        <img
                            src="https://picsum.photos/1200/600"
                            alt="Dashboard Preview"
                            className="relative rounded-[2rem] shadow-2xl border border-gray-100 w-full object-cover h-[400px]"
                        />
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Built for Enterprise Hiring</h2>
                        <p className="text-lg text-gray-600">The most advanced AI interviewing infrastructure available today.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard icon={BrainCircuit} title="AI Voice Interviews" description="Real-time, low-latency natural voice conversations with domain-specific AI agents." />
                        <FeatureCard icon={FileText} title="JD + Resume Intelligence" description="Automatically match candidates to Job Descriptions with deep skill extraction." />
                        <FeatureCard icon={Microscope} title="Automated AI Scoring" description="Standardized scoring based on technical competency and cultural fit analysis." />
                        <FeatureCard icon={Globe} title="Multi-tenant SaaS" description="Isolated environments for every organization with custom branding and agents." />
                        <FeatureCard icon={ShieldCheck} title="GDPR Compliant" description="Full security suite with audit logs, data encryption, and bias detection monitors." />
                        <FeatureCard icon={CheckCircle} title="ATS Integration" description="Seamlessly sync results back to your existing Applicant Tracking Systems." />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between">
                    <div className="mb-12 md:mb-0">
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
                            <span className="text-xl font-bold tracking-tight">HireSphere</span>
                        </div>
                        <p className="text-gray-400 max-w-xs">
                            Redefining human capital through intelligent automation and fair assessments.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
                        <div>
                            <h4 className="font-bold mb-6">Product</h4>
                            <ul className="space-y-4 text-gray-400">
                                <li><a href="#" className="hover:text-blue-400">Features</a></li>
                                <li><a href="#" className="hover:text-blue-400">AI Agents</a></li>
                                <li><a href="#" className="hover:text-blue-400">Enterprise</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6">Company</h4>
                            <ul className="space-y-4 text-gray-400">
                                <li><a href="#" className="hover:text-blue-400">About Us</a></li>
                                <li><a href="#" className="hover:text-blue-400">Security</a></li>
                                <li><a href="#" className="hover:text-blue-400">Privacy</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6">Social</h4>
                            <ul className="space-y-4 text-gray-400">
                                <li><a href="#" className="hover:text-blue-400">LinkedIn</a></li>
                                <li><a href="#" className="hover:text-blue-400">Twitter</a></li>
                                <li><a href="#" className="hover:text-blue-400">GitHub</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-800 mt-16 pt-8 text-center text-gray-500 text-sm">
                    © 2024 HireSphere Inc. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
