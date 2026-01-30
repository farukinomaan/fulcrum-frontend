'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Zap, Play, CheckCircle2, AlertCircle, Trash2, Plus, Loader2, ChevronRight, MessageSquare } from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  prompt: string;
  logic: any;
  is_active: boolean;
}

interface ExecutionResult {
  rule_name: string;
  invoice_id: string;
  customer: string;
  action: string;
  message: string;
  status: string;
  timestamp: string;
}

export default function AutomationsPage() {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [running, setRunning] = useState(false);
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [logs, setLogs] = useState<ExecutionResult[]>([]);
    const [activeTab, setActiveTab] = useState<'rules' | 'logs'>('rules');
    
    const supabase = createClient();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // 1. Fetch Rules on Load
    useEffect(() => {
        const fetchRules = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if(!user) return;
            
            const res = await fetch(`${API_URL}/automation/list?user_id=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setRules(data);
            }
        };
        fetchRules();
    }, [API_URL, supabase]);

    // 2. Create New Automation (AI)
    const handleCreate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        try {
            const res = await fetch(`${API_URL}/automation/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user?.id, prompt })
            });
            
            if (res.ok) {
                setPrompt('');
                // Refresh list
                const listRes = await fetch(`${API_URL}/automation/list?user_id=${user?.id}`);
                setRules(await listRes.json());
                alert("Automation Created Successfully!");
            } else {
                alert("Failed to create automation. Try again.");
            }
        } catch (e) {
            console.error(e);
            alert("Error connecting to server");
        } finally {
            setLoading(false);
        }
    };

    // 3. Run The Engine
    const handleRunEngine = async () => {
        setRunning(true);
        setActiveTab('logs'); // Switch to view results
        const { data: { user } } = await supabase.auth.getUser();

        try {
            const res = await fetch(`${API_URL}/automation/run?user_id=${user?.id}`, {
                method: 'POST'
            });
            
            const data = await res.json();
            if (data.status === 'success') {
                setLogs(data.results);
            }
        } catch (e) {
            console.error(e);
            alert("Engine failed to run");
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto min-h-screen bg-gray-50 font-sans text-slate-900">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <Zap className="w-8 h-8 text-amber-500 fill-amber-500" /> 
                        Autopilot
                    </h1>
                    <p className="text-slate-500 mt-1">Create rules in plain English. Let AI chase your invoices.</p>
                </div>
                
                <button 
                    onClick={handleRunEngine}
                    disabled={running || rules.length === 0}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl ${running ? 'bg-slate-400 cursor-not-allowed' : 'bg-black hover:bg-slate-800'}`}
                >
                    {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                    {running ? 'Running Engine...' : 'Run Automations Now'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: CREATE & LIST */}
                <div className="lg:col-span-1 space-y-6">
                    {/* CREATE CARD */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5" /> New Rule
                        </h2>
                        <textarea 
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="e.g. Chase invoices over 1000 SAR that are 5 days overdue with a polite WhatsApp message."
                            className="w-full p-4 border border-slate-200 rounded-xl h-32 mb-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-black focus:outline-none transition-all resize-none text-sm"
                        />
                        <button 
                            onClick={handleCreate}
                            disabled={loading || !prompt}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-black disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Rule'}
                        </button>
                    </div>

                    {/* ACTIVE RULES LIST */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-slate-500 text-sm uppercase tracking-wider px-1">Active Rules</h3>
                        {rules.length === 0 && <div className="text-slate-400 text-sm italic px-1">No rules active. Create one above.</div>}
                        {rules.map(rule => (
                            <div key={rule.id} className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-amber-400 transition-all cursor-default relative">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800 text-sm">{rule.name}</h4>
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2">"{rule.prompt}"</p>
                                <div className="mt-3 flex gap-2">
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 uppercase">{rule.logic?.trigger}</span>
                                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-100 uppercase">{rule.logic?.action}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: EXECUTION LOGS */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[600px] flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" /> Execution Activity
                            </h3>
                            <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{logs.length} Actions</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0">
                            {logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <Zap className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p>No actions taken yet.</p>
                                    <p className="text-sm mt-1">Click "Run Automations" to scan your invoices.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {logs.map((log, idx) => (
                                        <div key={idx} className="p-6 hover:bg-slate-50 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-green-100 text-green-700 p-2 rounded-lg">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </span>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{log.rule_name}</h4>
                                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                                            <span>Invoice: {log.invoice_id}</span>
                                                            <span>•</span>
                                                            <span>{log.customer}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-mono text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            
                                            <div className="ml-12">
                                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 relative group">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 rounded-l-xl"></div>
                                                    <p className="whitespace-pre-wrap font-medium">{log.message}</p>
                                                </div>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Action: {log.action}</span>
                                                    <span className="text-xs text-green-600 font-medium">Draft Generated Successfully</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}