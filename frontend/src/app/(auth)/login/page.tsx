'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import {
    ShieldCheck, BrainCircuit, CheckCircle, Loader2,
    Mail, Lock, AlertCircle, Eye, EyeOff, KeyRound, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type Step = 'login' | 'new_password' | 'success';

const Login = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Step 1 state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Step 2 state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [step, setStep] = useState<Step>('login');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Redirect on successful auth
    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            const role = (session.user as any).role;
            if (role === 'superadmin') router.push('/super-admin/dashboard');
            else if (role === 'company_admin') router.push('/admin/dashboard');
            else if (role === 'recruiter') router.push('/recruiter/dashboard');
        }
    }, [status, session, router]);

    // --- Step 1: Normal login ---
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
        });

        if (result?.error) {
            if (result.error.includes('NEW_PASSWORD_REQUIRED') || result.error === 'CredentialsSignin') {
                // Try to confirm by probing Cognito — show the new password step
                setStep('new_password');
                setError('');
            } else {
                setError('Invalid email or password. Please try again.');
            }
            setIsSubmitting(false);
        }
        // On success useEffect redirects
    };

    // --- Step 2: Set new password ---
    const handleNewPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    temporaryPassword: password,
                    newPassword,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to set new password.');
                setIsSubmitting(false);
                return;
            }

            // Success!
            setStep('success');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const brandingPanel = (
        <div className="hidden md:flex md:w-1/2 bg-blue-600 items-center justify-center p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10">
                <BrainCircuit className="w-96 h-96" />
            </div>
            <div className="relative z-10 max-w-md">
                <h2 className="text-4xl font-black mb-6 leading-tight">Scale your hiring without compromise.</h2>
                <div className="space-y-6">
                    {[
                        { title: 'Standardized Assessment', desc: 'AI ensures every candidate gets a fair, consistent evaluation.' },
                        { title: 'Global Availability', desc: 'Candidates can interview anytime, anywhere in multiple languages.' },
                    ].map(({ title, desc }) => (
                        <div key={title} className="flex items-start space-x-4">
                            <div className="p-2 bg-blue-500 rounded-lg"><CheckCircle className="w-6 h-6" /></div>
                            <div><h4 className="font-bold text-xl">{title}</h4><p className="text-blue-100">{desc}</p></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const errorBanner = error && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
        </div>
    );

    const inputClass = "w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none";

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="max-w-md w-full">
                    {/* Back button */}
                    <Link href="/"
                        className="inline-flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-8">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Home</span>
                    </Link>

                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2 mb-10">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <ShieldCheck className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-black text-gray-900">HireSphere</span>
                    </Link>

                    {/* ── Step 1: Login ── */}
                    {step === 'login' && (
                        <>
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
                                <p className="text-gray-500">Sign in to your dashboard to manage interviews.</p>
                            </div>

                            {status === 'authenticated' ? (
                                <div className="flex flex-col items-center py-8 space-y-4">
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                    <p className="text-gray-600 font-medium">Redirecting to your dashboard...</p>
                                </div>
                            ) : (
                                <form onSubmit={handleLogin} className="space-y-5">
                                    {errorBanner}
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                                                placeholder="name@company.com" className={inputClass} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold text-gray-700">Password</label>
                                            <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline font-medium">
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input required type={showPassword ? 'text' : 'password'} value={password}
                                                onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
                                            <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Signing in...</> : 'Sign In'}
                                    </Button>
                                </form>
                            )}
                        </>
                    )}

                    {/* ── Step 2: Set New Password ── */}
                    {step === 'new_password' && (
                        <>
                            <div className="mb-8">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                                    <KeyRound className="w-6 h-6 text-blue-600" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Set New Password</h1>
                                <p className="text-gray-500">Your temporary password has been verified. Please set a permanent password.</p>
                            </div>
                            <form onSubmit={handleNewPassword} className="space-y-5">
                                {errorBanner}
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input required type={showNew ? 'text' : 'password'} value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" className={inputClass} />
                                        <button type="button" tabIndex={-1} onClick={() => setShowNew(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Confirm New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input required type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" className={inputClass} />
                                        <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Setting Password...</> : 'Set Password'}
                                </Button>
                            </form>
                        </>
                    )}

                    {/* ── Step 3: Success ── */}
                    {step === 'success' && (
                        <div className="text-center py-8 space-y-6">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Changed!</h1>
                                <p className="text-gray-500">Your password has been set successfully. You can now sign in with your new password.</p>
                            </div>
                            <Button className="w-full" onClick={() => {
                                setStep('login');
                                setPassword('');
                                setNewPassword('');
                                setConfirmPassword('');
                                setError('');
                            }}>
                                Go to Login
                            </Button>
                        </div>
                    )}

                    <p className="mt-10 text-center text-xs text-gray-400">Secured by Amazon Web Services Cognito</p>
                </div>
            </div>
            {brandingPanel}
        </div>
    );
};

export default Login;
