'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image'; 
import {
    FileText, Download, TrendingUp, TrendingDown,
    Calendar, ChevronRight, Activity, CreditCard, MessageSquare, CheckCircle2,
    Settings, LogOut, Zap 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function ReportsPage() {
    const router = useRouter();
    const supabase = createClient();

    // Dynamic API URL
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const [generating, setGenerating] = useState(false);
    const [currency, setCurrency] = useState('SAR'); // Default currency, will update on load

    // Initialize with placeholders
    const [reportData, setReportData] = useState({
        month: "Current Period",
        revenue: 0,
        expenses: 0,
        net_income: 0,
        currency: '', 
        ai_insights: {
            headline: "Ready to Generate",
            summary: "Click the generate button to analyze your latest financial data using Fulcrum AI.",
            action_item: "Waiting for analysis..."
        }
    });

    // Fetch User Preferences (Currency) on Load
    useEffect(() => {
        const fetchSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('settings')
                    .select('currency')
                    .eq('user_id', user.id)
                    .single();
                if (data?.currency) {
                    setCurrency(data.currency);
                    setReportData(prev => ({ ...prev, currency: data.currency }));
                }
            }
        };
        fetchSettings();
    }, []);

    const handleGenerate = async () => {
        setGenerating(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Use Dynamic API URL
            const response = await fetch(`${API_URL}/reports/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id })
            });

            if (!response.ok) throw new Error("Backend generation failed");

            const data = await response.json();

            // Update UI with Real Data
            if (data.revenue !== undefined) {
                setReportData({
                    ...data,
                    currency: data.currency || currency // Use backend currency if provided, else fallback
                });
            }

        } catch (error) {
            console.error("Report Generation Error:", error);
            alert("Failed to generate report. Make sure the backend is connected.");
        } finally {
            setGenerating(false);
        }
    };

    const formatMoney = (amount: number) => {
        return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">

            {/* SIDEBAR - Matched with Dashboard */}
            <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex fixed h-full z-10">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
                        {/* LOGO REPLACEMENT */}
                        <Image src="/logo.png" alt="Fulcrum Logo" width={32} height={32} className="w-8 h-8" />
                        <span className="font-semibold text-lg tracking-tight">Fulcrum</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <NavItem icon={<Activity />} label="Live Feed" onClick={() => router.push('/')} />
                    <NavItem icon={<CreditCard />} label="Transactions" onClick={() => router.push('/?view=transactions')} />
                    <NavItem icon={<FileText />} label="Reports" active />
                    <NavItem icon={<Zap />} label="Automations" onClick={() => router.push('/automations')} />
                    <NavItem icon={<MessageSquare />} label="Ask Fulcrum" onClick={() => router.push('/chat')} />
                </nav>

                {/* SETTINGS LINK ADDED */}
                <div className="pt-4 mt-4 border-t border-slate-100 p-4">
                    <NavItem icon={<Settings />} label="Settings" onClick={() => router.push('/settings')} />
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 md:ml-64 p-8">

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
                        <p className="text-slate-500 text-sm">Monthly P&L and Executive Summaries</p>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-70 shadow-lg shadow-purple-500/20"
                    >
                        {generating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <FileText className="w-4 h-4" />
                                Generate Report
                            </>
                        )}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT: P&L Statement */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="text-xs font-medium text-slate-400 uppercase">Revenue</div>
                                <div className="text-2xl font-bold text-emerald-600 mt-1">
                                    {reportData.currency} {formatMoney(reportData.revenue)}
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="text-xs font-medium text-slate-400 uppercase">Expenses</div>
                                <div className="text-2xl font-bold text-slate-900 mt-1">
                                    {reportData.currency} {formatMoney(reportData.expenses)}
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="text-xs font-medium text-slate-400 uppercase">Net Income</div>
                                <div className={`text-2xl font-bold mt-1 ${reportData.net_income >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {reportData.currency} {formatMoney(reportData.net_income)}
                                </div>
                            </div>
                        </div>

                        {/* Detailed Table */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-semibold text-slate-800">Profit & Loss Statement</h3>
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{reportData.month}</span>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                                    <span className="text-slate-600">Total Revenue</span>
                                    <span className="font-semibold">{reportData.currency} {formatMoney(reportData.revenue)}</span>
                                </div>

                                <div className="py-2">
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Operating Expenses</div>
                                    {/* Dynamic mock rows - Ensure amounts are formatted */}
                                    <ExpenseRow label="Payroll & Contractors" amount={reportData.expenses * 0.6} currency={reportData.currency} />
                                    <ExpenseRow label="Cloud Infrastructure" amount={reportData.expenses * 0.25} currency={reportData.currency} />
                                    <ExpenseRow label="Software Subscriptions" amount={reportData.expenses * 0.15} currency={reportData.currency} />
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                                    <span className="font-bold text-slate-900">Net Income</span>
                                    <span className={`font-bold text-lg ${reportData.net_income >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {reportData.currency} {formatMoney(reportData.net_income)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: AI Insights */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden transition-all duration-500">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4 text-purple-300">
                                    <MessageSquare className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">AI Executive Summary</span>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{reportData.ai_insights.headline}</h3>
                                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                                    {reportData.ai_insights.summary}
                                </p>
                                <div className="p-3 bg-white/10 rounded-lg border border-white/10 text-sm">
                                    <div className="flex items-start gap-2">
                                        <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="block font-medium text-emerald-400">Action Item</span>
                                            <span className="text-slate-300 text-xs">{reportData.ai_insights.action_item}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative Glow */}
                            <div className={`absolute -top-10 -right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-20 ${generating ? 'animate-pulse' : ''}`}></div>
                        </div>

                        {/* Past Reports List - Removed Hardcoded Data */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center py-8">
                            <h3 className="text-sm font-semibold text-slate-800 mb-3">Past Statements</h3>
                            <p className="text-xs text-slate-400">No past reports available.</p>
                            {/* Logic to list real reports would go here once backend endpoint exists */}
                        </div>

                    </div>
                </div>

            </main>
        </div>
    );
}

// --- SUBCOMPONENTS ---

function NavItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
        >
            {React.cloneElement(icon, { className: `w-4 h-4 ${active ? 'text-white' : ''}` })}
            {label}
        </button>
    );
}

function ExpenseRow({ label, amount, currency }: { label: string, amount: number, currency: string }) {
    return (
        <div className="flex justify-between items-center text-sm py-1.5 hover:bg-slate-50 rounded px-2 -mx-2 transition-colors">
            <span className="text-slate-500">{label}</span>
            <span className="text-slate-800 font-medium">-{currency} {amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </div>
    );
}