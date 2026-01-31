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
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [sendingIndex, setSendingIndex] = useState<number | null>(null);
    const [connecting, setConnecting] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams(); // To check for ?status=connected
    const supabase = createClient();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // --- EFFECTS ---
    useEffect(() => {
        // 1. Check for Gmail Success
        if (searchParams.get('status') === 'connected') {
            alert("✅ Gmail Connected Successfully!");
            router.replace('/automations'); // Clean URL
        }

        // 2. Fetch Rules
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

    // --- NEW: CONNECT GMAIL ---
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

    // --- UPDATED: SEND EMAIL ---
    const handleSend = async (log: ExecutionResult, index: number) => {
        const email = window.prompt("Confirm Recipient Email:", "test@example.com");
        if(!email) return;

        setSendingIndex(index);
        const { data: { user } } = await supabase.auth.getUser();

        try {
            const res = await fetch(`${API_URL}/automation/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user?.id,
                    to_email: email,
                    subject: `Invoice Reminder: ${log.invoice_id}`,
                    body: log.message
                })
            });
            
            const data = await res.json();
            
            // --- FIX: Check for 'detail' (FastAPI error) OR 'message' ---
            if(res.ok && data.status === 'success') {
                alert(`✅ ${data.message}`);
            } else {
                // Determine the actual error message
                // FastAPI returns errors in 'detail', while our success responses use 'message'
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

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            
            {/* SIDEBAR */}
            <div className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <Image src="/logo.png" alt="Fulcrum" width={32} height={32} className="w-8 h-8" />
                        <span className="font-semibold text-lg tracking-tight">Fulcrum</span>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    <NavItem icon={<LayoutDashboard />} label="Live Feed" onClick={() => router.push('/')} />
                    <NavItem icon={<CreditCard />} label="Transactions" onClick={() => router.push('/?view=transactions')} />
                    <NavItem icon={<FileText />} label="Reports" onClick={() => router.push('/reports')} />
                    <NavItem icon={<Zap />} label="Automations" active onClick={() => {}} />
                    <NavItem icon={<MessageSquare />} label="Ask Fulcrum" onClick={() => router.push('/chat')} />
                </nav>
                <div className="pt-4 mt-4 border-t border-slate-100 p-4">
                    <NavItem icon={<Settings />} label="Settings" onClick={() => router.push('/settings')} />
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-h-screen md:pl-64 transition-all">
                
                {/* HEADER */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                        <span className="text-sm font-medium text-slate-600">Autopilot Mode</span>
                    </div>
                    <div className="flex items-center gap-4 relative">
                        {/* CONNECT GMAIL BUTTON */}
                        <button 
                            onClick={handleConnectGmail}
                            disabled={connecting}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                        >
                            {connecting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Mail className="w-4 h-4" />}
                            Connect Gmail
                        </button>
                        
                        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><Bell className="w-5 h-5" /></button>
                        <div className="relative">
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">ME</button>
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95">
                                    <div className="px-4 py-3 border-b border-slate-100"><p className="text-sm font-medium text-slate-900">My Account</p></div>
                                    <button onClick={() => router.push('/settings')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Settings className="w-4 h-4" /> Settings</button>
                                    <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><LogOut className="w-4 h-4" /> Sign Out</button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto bg-slate-50 p-8">
                    <div className="max-w-7xl mx-auto h-full flex flex-col">
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                                    <Zap className="w-8 h-8 text-amber-500 fill-amber-500" /> 
                                    Autopilot
                                </h1>
                                <p className="text-slate-500 mt-1">Create rules. Let AI chase your invoices.</p>
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

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
                            
                            <div className="lg:col-span-1 flex flex-col gap-6 h-[calc(100vh-250px)]">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> New Rule</h2>
                                    <textarea 
                                        value={promptText}
                                        onChange={e => setPromptText(e.target.value)}
                                        placeholder="e.g. Chase invoices over 1000 SAR that are late."
                                        className="w-full p-4 border border-slate-200 rounded-xl h-32 mb-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-black focus:outline-none transition-all resize-none text-sm"
                                    />
                                    <button 
                                        onClick={handleCreate}
                                        disabled={loading || !promptText}
                                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-black disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Rule'}
                                    </button>
                                </div>

                                <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                        <h3 className="font-semibold text-slate-500 text-sm uppercase tracking-wider">Active Rules</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {rules.length === 0 && <div className="text-slate-400 text-sm italic text-center p-4">No active rules.</div>}
                                        {rules.map(rule => (
                                            <div key={rule.id} className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-amber-400 transition-all relative">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-slate-800 text-sm pr-6">{rule.name}</h4>
                                                    <button onClick={() => handleDelete(rule.id)} className="text-slate-300 hover:text-red-500 transition-colors" disabled={deletingId === rule.id}>
                                                        {deletingId === rule.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                                                    </button>
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
                            </div>

                            <div className="lg:col-span-2 h-[calc(100vh-250px)]">
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
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
                                                <p className="text-sm mt-1">Click "Run Automations Now" to scan.</p>
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
                                                            <button 
                                                                onClick={() => handleSend(log, idx)}
                                                                disabled={sendingIndex === idx}
                                                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                                            >
                                                                {sendingIndex === idx ? <Loader2 className="w-3 h-3 animate-spin"/> : <Send className="w-3 h-3" />}
                                                                {sendingIndex === idx ? "Sending..." : "Send Email"}
                                                            </button>
                                                        </div>
                                                        <div className="ml-12">
                                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 relative group">
                                                                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 rounded-l-xl"></div>
                                                                <p className="whitespace-pre-wrap font-medium">{log.message}</p>
                                                            </div>
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Action: {log.action}</span>
                                                                <span className="text-xs text-green-600 font-medium">Draft Ready</span>
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
            </div>
        </div>
    );
}

// --- SUB-COMPONENT: NavItem ---
function NavItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
    >
        {React.cloneElement(icon, { className: "w-4 h-4" })}
        {label}
    </button>
  );
}