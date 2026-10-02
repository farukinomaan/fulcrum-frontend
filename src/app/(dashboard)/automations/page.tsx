/* 
=> Allows users to create automation rules and integrate with Gmail APIs .
*/



'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
    Zap, Play, CheckCircle2, Plus, Loader2, MessageSquare, 
    Trash2, CreditCard, FileText, Settings, Bell, LogOut, LayoutDashboard, Send, Mail 
} from 'lucide-react';

// --- TYPES ---
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
    // --- STATE ---
    const [promptText, setPromptText] = useState(''); // Renamed to avoid window.prompt conflict
    const [loading, setLoading] = useState(false);
    const [running, setRunning] = useState(false);
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [logs, setLogs] = useState<ExecutionResult[]>([]);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [sendingIndex, setSendingIndex] = useState<number | null>(null);
    const [connecting, setConnecting] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams(); // To check for ?status=connected
    const supabase = createClient();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // --- EFFECTS ---
    useEffect(() => {
        // Check for Gmail Success
        if (searchParams.get('status') === 'connected') {
            alert("✅ Gmail Connected Successfully!");
            router.replace('/automations'); // Clean URL
        }

        // Fetch Rules
        const fetchRules = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if(!user) {
                router.push('/login');
                return;
            }
            const res = await fetch(`${API_URL}/automation/list?user_id=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setRules(data);
            }
        };
        fetchRules();
    }, [router, API_URL, supabase, searchParams]);

    // --- ACTIONS ---

    const handleCreate = async () => {
        if (!promptText.trim()) return;
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        try {
            //takes the user's natural language input
            await fetch(`${API_URL}/automation/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user?.id, prompt: promptText })
            });
            
            // Refresh list
            const res = await fetch(`${API_URL}/automation/list?user_id=${user?.id}`);
            if(res.ok) setRules(await res.json());
            setPromptText('');
        } catch (e) {
            console.error(e);
            alert("Failed to create rule");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if(!confirm("Are you sure you want to delete this rule?")) return;
        setDeletingId(id);
        try {
            const res = await fetch(`${API_URL}/automation/delete?id=${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setRules(prev => prev.filter(r => r.id !== id));
            } else {
                alert("Failed to delete rule");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setDeletingId(null);
        }
    };


    // allows the user to review the AI's decisions before actually firing off emails
    const handleRunEngine = async () => {
        setRunning(true);
        const { data: { user } } = await supabase.auth.getUser();
        try {
            const res = await fetch(`${API_URL}/automation/run?user_id=${user?.id}`, { method: 'POST' });
            const data = await res.json();
            setLogs(data.results || []);
        } catch (e) {
            console.error(e);
            alert("Engine run failed");
        } finally {
            setRunning(false);
        }
    };

    // Connect Gmail

    const handleConnectGmail = async () => {
        setConnecting(true);
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) return;
        
        try {
            // Call backend to get the Google Auth URL
            const res = await fetch(`${API_URL}/auth/gmail/login?user_id=${user.id}`);
            const data = await res.json();
            
            if (data.url) {
                // Redirect user to Google
                window.location.href = data.url;
            } else {
                alert("Failed to initiate Gmail connection.");
            }
        } catch (e) {
            console.error(e);
            alert("Connection error");
        } finally {
            setConnecting(false);
        }
    };

    // SEND EMAIL
    const handleSend = async (log: ExecutionResult, index: number) => {
        
        setSendingIndex(index);
        const { data: { user } } = await supabase.auth.getUser();

        try {
            const res = await fetch(`${API_URL}/automation/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user?.id,
                    // REMOVED to_email HERE
                    subject: `Invoice Reminder: ${log.invoice_id}`,
                    body: log.message
                })
            });
            
            const data = await res.json();
            
            if(res.ok && data.status === 'success') {
                alert(`✅ ${data.message}`);
            } else {
                const errorMsg = data.detail || data.message || "Unknown Server Error";
                if(errorMsg.includes("Gmail not connected")) {
                    if(confirm("Gmail is not connected. Connect now?")) {
                        handleConnectGmail();
                    }
                } else {
                    alert(`❌ Failed: ${errorMsg}`);
                }
            }
        } catch (e) {
            console.error(e);
            alert("Network Error: Could not connect to server.");
        } finally {
            setSendingIndex(null);
        }
    };
 
    // Sign out logic 
    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <>
            {/* MAIN CONTENT */}
                <div className="flex-1 overflow-auto bg-slate-50/50 p-4 md:p-8 min-h-screen">
                    <div className="max-w-7xl mx-auto h-full flex flex-col">
                        
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 sm:mb-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
                                    <Zap className="w-5 h-5 text-white fill-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Autopilot</h1>
                                    <p className="text-sm text-slate-500 mt-1">Create rules. Let AI chase your invoices.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handleConnectGmail}
                                    disabled={connecting}
                                    className="flex items-center gap-2 justify-center px-4 py-2 font-medium text-sm text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-all h-10"
                                >
                                    {connecting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Mail className="w-4 h-4" />}
                                    <span className="hidden sm:inline">Connect Gmail</span>
                                    <span className="sm:hidden">Gmail</span>
                                </button>
                                <button 
                                    onClick={handleRunEngine}
                                    disabled={running || rules.length === 0}
                                    title="Run Automations"
                                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${running ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
                                >
                                    {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                            
                            <div className="lg:col-span-1 flex flex-col gap-6 h-[calc(100vh-250px)]">
                                <div className="bg-white p-6 rounded-[20px] border border-slate-200/60 shadow-sm shrink-0">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Plus className="w-5 h-5 text-slate-900" />
                                        <h2 className="font-bold text-base text-slate-900">New Rule</h2>
                                    </div>
                                    <textarea 
                                        value={promptText}
                                        onChange={e => setPromptText(e.target.value)}
                                        placeholder="e.g. Chase invoices over 1000 SAR that are late."
                                        className="w-full p-4 border border-slate-200/60 rounded-xl h-32 mb-4 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:border-slate-400 focus:outline-none transition-all resize-none text-sm placeholder:text-slate-400"
                                    />
                                    <button 
                                        onClick={handleCreate}
                                        disabled={loading || !promptText}
                                        className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-all flex justify-center items-center gap-2 shadow-sm"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Rule'}
                                    </button>
                                </div>

                                <div className="flex-1 bg-white rounded-[20px] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                                    <div className="px-6 py-5 border-b border-slate-100 shrink-0">
                                        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-slate-900 fill-slate-900" />
                                            Active Rules
                                        </h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                                        {rules.length === 0 && (
                                            <div className="text-slate-400 text-sm p-8 flex flex-col items-center justify-center h-full gap-2 text-center">
                                                <Zap className="w-6 h-6 text-slate-300" />
                                                <p>No active rules.</p>
                                            </div>
                                        )}
                                        {rules.map(rule => (
                                            <div key={rule.id} className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-orange-500 rounded-r-full"></div>
                                                <div className="flex justify-between items-start mb-2 ml-3">
                                                    <h4 className="font-semibold text-slate-900 text-sm pr-6">{rule.name}</h4>
                                                    <button onClick={() => handleDelete(rule.id)} className="text-slate-400 hover:text-rose-500 transition-colors" disabled={deletingId === rule.id}>
                                                        {deletingId === rule.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-2 ml-3">"{rule.prompt}"</p>
                                                <div className="mt-3 flex gap-2 ml-3">
                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 uppercase">{rule.logic?.trigger}</span>
                                                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 uppercase">{rule.logic?.action}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-2 h-[calc(100vh-250px)]">
                                <div className="bg-white rounded-[20px] border border-slate-200/60 shadow-sm h-full flex flex-col overflow-hidden">
                                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                                        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-slate-900" /> Execution Activity
                                        </h3>
                                        <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{logs.length} Actions</span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-0 bg-slate-50/30">
                                        {logs.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                                <MessageSquare className="w-8 h-8 text-slate-300 mb-3" />
                                                <p className="font-medium text-slate-500 text-sm">No actions taken yet.</p>
                                                <p className="text-xs mt-1">Click the play button to scan.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100">
                                                {logs.map((log, idx) => (
                                                    <div key={idx} className="p-5 sm:p-6 bg-white hover:bg-slate-50/50 transition-colors group">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex items-start sm:items-center gap-3 flex-col sm:flex-row">
                                                                <div className="text-emerald-500 shrink-0">
                                                                    <CheckCircle2 className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold text-sm text-slate-900">{log.rule_name}</h4>
                                                                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                                        <span className="font-medium text-slate-600">Invoice: {log.invoice_id}</span>
                                                                        <span>•</span>
                                                                        <span>{log.customer}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleSend(log, idx)}
                                                                disabled={sendingIndex === idx}
                                                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0 h-9"
                                                            >
                                                                {sendingIndex === idx ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Send className="w-3.5 h-3.5" />}
                                                                <span className="hidden sm:inline">{sendingIndex === idx ? "Sending..." : "Send Email"}</span>
                                                                <span className="sm:hidden">{sendingIndex === idx ? "..." : "Send"}</span>
                                                            </button>
                                                        </div>
                                                        <div className="sm:ml-8">
                                                            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4 text-sm text-slate-700 relative overflow-hidden">
                                                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-600 rounded-r-full"></div>
                                                                <p className="whitespace-pre-wrap leading-relaxed ml-3">{log.message}</p>
                                                            </div>
                                                            <div className="mt-3 flex items-center gap-2 ml-3">
                                                                <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">Action: {log.action}</span>
                                                                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Draft Ready</span>
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
                </div>
        </>
    );
}