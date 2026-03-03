'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    ShieldCheck, Mail, Loader2, CheckCircle,
    AlertCircle, ArrowLeft, Lock, Eye, EyeOff, KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type Step = 'email' | 'otp_password' | 'success';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<Step>('email');

    // Step 1
    const [email, setEmail] = useState('');

    // Step 2
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const errorBanner = error && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
        </div>
    );

    const inputClass = "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none";
    const inputClassPr = "w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none";

    // ── Step 1: Send OTP ────────────────────────────────────────────────────────
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed to send OTP.'); return; }
            setStep('otp_password');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Step 2: Verify OTP + set new password ──────────────────────────────────
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
        if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed to reset password.'); return; }
            setStep('success');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* ── Left Panel ── */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="max-w-md w-full">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2 mb-10">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <ShieldCheck className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-black text-gray-900">HireSphere</span>
                    </Link>

                    {/* ── Step 1: Email ── */}
                    {step === 'email' && (
                        <>
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                                <p className="text-gray-500">Enter your registered email and we'll send a one-time verification code (OTP).</p>
                            </div>
                            <form onSubmit={handleSendOtp} className="space-y-5">
                                {errorBanner}
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                                            placeholder="name@company.com" className={inputClass} />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Sending OTP...</> : 'Send OTP'}
                                </Button>
                                <Link href="/login" className="flex items-center justify-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                                    <ArrowLeft className="w-4 h-4" /><span>Back to Login</span>
                                </Link>
                            </form>
                        </>
                    )}

                    {/* ── Step 2: OTP + New Password ── */}
                    {step === 'otp_password' && (
                        <>
                            <div className="mb-8">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                                    <KeyRound className="w-6 h-6 text-blue-600" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Set New Password</h1>
                                <p className="text-gray-500">
                                    We sent a 6-digit OTP to <span className="font-semibold text-gray-800">{email}</span>.
                                    Enter it below along with your new password.
                                </p>
                            </div>
                            <form onSubmit={handleResetPassword} className="space-y-5">
                                {errorBanner}

                                {/* OTP */}
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">One-Time Password (OTP)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            required
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={otp}
                                            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                            placeholder="6-digit code"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                {/* New Password */}
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input required type={showNew ? 'text' : 'password'} value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters"
                                            className={inputClassPr} />
                                        <button type="button" tabIndex={-1} onClick={() => setShowNew(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Confirm New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input required type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password"
                                            className={inputClassPr} />
                                        <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Resetting...</> : 'Reset Password'}
                                </Button>

                                <button type="button" onClick={() => { setStep('email'); setError(''); setOtp(''); }}
                                    className="flex items-center justify-center space-x-1 text-sm text-gray-500 hover:text-blue-600 w-full transition-colors">
                                    <ArrowLeft className="w-4 h-4" /><span>Resend OTP</span>
                                </button>
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
                                <p className="text-gray-500">Your password has been successfully reset. You can now sign in with your new password.</p>
                            </div>
                            <Link href="/login">
                                <Button className="w-full">Go to Login</Button>
                            </Link>
                        </div>
                    )}

                    <p className="mt-10 text-center text-xs text-gray-400">Secured by Amazon Web Services Cognito</p>
                </div>
            </div>

            {/* ── Right Branding Panel ── */}
            <div className="hidden md:flex md:w-1/2 bg-blue-600 items-center justify-center p-12 text-white">
                <div className="max-w-md text-center">
                    <div className="w-24 h-24 bg-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                        <Mail className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-black mb-4">Secure Password Reset</h2>
                    <p className="text-blue-100 text-lg">
                        We send a one-time verification code to your registered email. Enter it to securely set your new password.
                    </p>
                </div>
            </div>
        </div>
    );
}
