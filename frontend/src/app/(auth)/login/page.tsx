'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { Role } from '@/types';
import { ShieldCheck, Mail, Lock, Loader2, ChevronDown, BrainCircuit, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>(Role.RECRUITER);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await login(email, role);
            const dashboardPaths = {
                [Role.SUPER_ADMIN]: '/super-admin',
                [Role.ADMIN]: '/admin',
                [Role.RECRUITER]: '/recruiter',
            };
            router.push(dashboardPaths[role]);
        } catch (error) {
            console.error('Login failed', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left side: Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="max-w-md w-full">
                    <div className="mb-10 flex flex-col items-center md:items-start">
                        <Link href="/" className="flex items-center space-x-2 mb-8">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                <ShieldCheck className="text-white w-6 h-6" />
                            </div>
                            <span className="text-2xl font-black text-gray-900">HireSphere</span>
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
                        <p className="text-gray-500">Sign in to your dashboard to manage interviews.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Login As</label>
                            <div className="relative">
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as Role)}
                                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
                                >
                                    <option value={Role.RECRUITER}>Recruiter</option>
                                    <option value={Role.ADMIN}>Company Admin</option>
                                    <option value={Role.SUPER_ADMIN}>Super Admin</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                                <span className="text-sm text-gray-600">Remember me</span>
                            </label>
                            <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Forgot password?</a>
                        </div>

                        <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Signing in...
                                </>
                            ) : 'Sign In'}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-gray-600">
                        Don&apos;t have an account? <Link href="/signup" className="font-bold text-blue-600 hover:text-blue-700">Sign up</Link>
                    </p>
                </div>
            </div>

            {/* Right side: Branding */}
            <div className="hidden md:flex md:w-1/2 bg-blue-600 items-center justify-center p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <BrainCircuit className="w-96 h-96" />
                </div>
                <div className="relative z-10 max-w-md">
                    <h2 className="text-4xl font-black mb-6 leading-tight">Scale your hiring without compromise.</h2>
                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <div className="p-2 bg-blue-500 rounded-lg">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl">Standardized Assessment</h4>
                                <p className="text-blue-100">AI ensures every candidate gets a fair, consistent evaluation based on real requirements.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="p-2 bg-blue-500 rounded-lg">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl">Global Availability</h4>
                                <p className="text-blue-100">Candidates can interview anytime, anywhere in multiple languages.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
