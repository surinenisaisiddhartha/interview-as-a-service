'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Search, Plus, Zap, Activity, Loader2, Building, CheckCircle2 } from 'lucide-react';
import { retellApi } from '@/services/retell.api';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/modal';

interface RetellAgent {
    agent_id: string;
    agent_name: string;
    llm_id: string;
    company_id: string | null;
    status: string;
    created_at: string;
}

interface Company {
    id: string;
    name: string;
}

export default function SuperAdminAgents() {
    const [isInitializing, setIsInitializing] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [lastLlmId, setLastLlmId] = useState<string | null>(null);
    const [agents, setAgents] = useState<RetellAgent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal & Assignment State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<RetellAgent | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

    const fetchAgents = useCallback(async () => {
        try {
            const data = await retellApi.getAgents();
            setAgents(data);
        } catch (error: any) {
            console.error('Failed to fetch agents:', error);
            toast.error('Failed to load agents from database');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchCompanies = async () => {
        try {
            const data = await retellApi.getCompanies();
            setCompanies(data);
        } catch (error: any) {
            toast.error('Failed to load companies');
        }
    };

    useEffect(() => {
        fetchAgents();
        const savedLlm = localStorage.getItem('retell_last_llm_id');
        if (savedLlm) {
            setLastLlmId(savedLlm);
        }
    }, [fetchAgents]);

    const handleInitializeBrain = async () => {
        setIsInitializing(true);
        try {
            const res = await retellApi.createLLM();
            setLastLlmId(res.llm_id);
            localStorage.setItem('retell_last_llm_id', res.llm_id);
            toast.success('AI Brain (LLM) Initialized Successfully!');
        } catch (error: any) {
            toast.error('Failed to initialize LLM: ' + error.message);
        } finally {
            setIsInitializing(false);
        }
    };

    const handleDeployAgent = async () => {
        if (!lastLlmId) {
            toast.error('Please initialize the AI Brain (LLM) first!');
            return;
        }
        setIsDeploying(true);
        try {
            await retellApi.createAgent(lastLlmId);
            toast.success(`Agent deployed successfully!`);
            fetchAgents(); // Refresh from DB
        } catch (error: any) {
            toast.error('Failed to deploy agent: ' + error.message);
        } finally {
            setIsDeploying(false);
        }
    };

    const openManageModal = (agent: RetellAgent) => {
        setSelectedAgent(agent);
        setSelectedCompanyId(agent.company_id || '');
        setIsModalOpen(true);
        fetchCompanies();
    };

    const handleAssignAgent = async () => {
        if (!selectedAgent || !selectedCompanyId) {
            toast.error('Please select a company');
            return;
        }

        setIsAssigning(true);
        try {
            await retellApi.assignAgent(selectedAgent.agent_id, selectedCompanyId);
            toast.success('Agent assigned successfully!');
            setIsModalOpen(false);
            fetchAgents(); // Refresh list
        } catch (error: any) {
            toast.error('Failed to assign agent: ' + error.message);
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Retell AI Management</h1>
                    <p className="text-gray-500">Initialize brains and deploy voice agents for companies.</p>
                </div>
                <div className="flex space-x-3">
                    <Button
                        variant="outline"
                        onClick={handleInitializeBrain}
                        disabled={isInitializing}
                        className="rounded-xl border-slate-200"
                    >
                        {isInitializing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
                        {lastLlmId ? 'Re-initialize Brain' : 'Initialize Brain'}
                    </Button>
                    <Button
                        onClick={handleDeployAgent}
                        disabled={isDeploying}
                        className="bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                    >
                        {isDeploying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        Deploy New Agent
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-xl shadow-indigo-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Zap className="w-8 h-8 opacity-50" />
                            <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded tracking-widest uppercase">Live Agents</span>
                        </div>
                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider">Total Deployed</p>
                        <h3 className="text-4xl font-black mt-1">
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : agents.length}
                            <span className="text-lg font-normal opacity-70 ml-2">agents</span>
                        </h3>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Activity className="w-8 h-8 text-emerald-500" />
                            <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2 py-1 rounded uppercase tracking-wider">System Status</span>
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Last Brain ID</p>
                        <h3 className="text-sm font-mono font-bold text-slate-900 truncate mt-2 bg-slate-50 p-2 rounded border border-slate-100">
                            {lastLlmId || 'No active brain'}
                        </h3>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <BrainCircuit className="w-8 h-8 text-blue-500" />
                            <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-1 rounded uppercase tracking-wider">Network</span>
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Platform Stability</p>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">99.9% <span className="text-sm font-medium text-slate-400">uptime</span></h3>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 overflow-hidden rounded-2xl shadow-sm border bg-white">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-bold text-slate-800">Deployed Agents History</span>
                            <p className="text-xs text-slate-500 font-medium">Manage and assign voice agents to client companies</p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" placeholder="Filter agents..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none w-64 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {isLoading ? (
                            <div className="p-12 flex flex-col items-center">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                                <p className="text-slate-400 font-medium">Loading agents from database...</p>
                            </div>
                        ) : agents.length > 0 ? (
                            agents.map((agent) => (
                                <div key={agent.agent_id} className="group p-5 flex items-center justify-between hover:bg-slate-50/80 transition-all">
                                    <div className="flex items-center space-x-5">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover:scale-110 transition-transform">
                                            <BrainCircuit className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 text-lg">{agent.agent_name}</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <p className="text-[11px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">ID: {agent.agent_id}</p>
                                                {agent.company_id ? (
                                                    <span className="flex items-center text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                        <Building className="w-3 h-3 mr-1" />
                                                        {agent.company_id}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded italic">
                                                        Unassigned
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-8">
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Created On</p>
                                            <p className="text-sm font-bold text-slate-700">{new Date(agent.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${agent.status === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {agent.status}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all px-4"
                                                onClick={() => openManageModal(agent)}
                                            >
                                                Manage
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-20 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <Zap className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-lg">No agents deployed yet</h3>
                                <p className="text-slate-400 max-w-xs mx-auto mt-2 text-sm font-medium">Use the "Deploy New Agent" button to create your first voice interview agent.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Manage Agent Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Manage Agent: ${selectedAgent?.agent_name}`}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                        <Button
                            onClick={handleAssignAgent}
                            disabled={isAssigning}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold px-6"
                        >
                            {isAssigning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Assign to Company
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 py-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Agent Details</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[11px] text-slate-500">Agent ID</p>
                                <p className="text-xs font-mono font-bold text-slate-900 truncate">{selectedAgent?.agent_id}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-500">LLM Brain ID</p>
                                <p className="text-xs font-mono font-bold text-slate-900 truncate">{selectedAgent?.llm_id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center">
                            <Building className="w-4 h-4 mr-2 text-indigo-500" />
                            Assign to Company
                        </label>
                        <select
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none"
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                        >
                            <option value="">Select a company from database...</option>
                            {companies.map(company => (
                                <option key={company.id} value={company.id}>
                                    {company.name} ({company.id})
                                </option>
                            ))}
                        </select>
                        <p className="text-[11px] text-slate-400 italic">Assigning an agent allows that company to use it for candidate calling.</p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
