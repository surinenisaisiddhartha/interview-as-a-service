'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { BrainCircuit, Mail, ArrowRight } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await new Promise(res => setTimeout(res, 1500));
        setSent(true);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-2xl mb-4 border border-blue-500/30">
                        <BrainCircuit className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-black text-white">Reset Password</h1>
                    <p className="text-blue-200 mt-2">We&apos;ll send a reset link to your email</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                    {sent ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Check your email</h3>
                            <p className="text-blue-200 text-sm mb-6">We&apos;ve sent a password reset link to <strong className="text-white">{email}</strong></p>
                            <Link href="/login" className="inline-flex items-center text-blue-400 hover:text-blue-300 font-bold text-sm">
                                Back to login <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-blue-200 uppercase tracking-widest mb-2">Work Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-blue-300/50 outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                        placeholder="you@company.com"
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center">
                                {loading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : 'Send Reset Link'}
                            </button>
                            <p className="text-center text-sm text-blue-300">
                                Remember your password? <Link href="/login" className="text-blue-400 hover:underline font-bold">Sign in</Link>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
