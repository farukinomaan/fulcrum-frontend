'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    FileText, Download, TrendingUp, TrendingDown,
    Calendar, ChevronRight, Activity, CreditCard, MessageSquare, CheckCircle2,
    Settings, LogOut, Zap, Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import MonthPicker from '@/components/MonthPicker';
import { downloadReportPdf, fetchSavedReports } from '@/lib/api';
import { MonthlyReportResponse, RevenueConcentration, SavedReportMeta } from '@/types/report';

export default function ReportsPage() {
    const router = useRouter();
    const supabase = createClient();

    // Dynamic API URL
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [generating, setGenerating] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [currency, setCurrency] = useState('SAR');
    const [savedReports, setSavedReports] = useState<SavedReportMeta[]>([]);

    // Initialize report data state
    const [reportData, setReportData] = useState<{
        month: string;
        revenue: number;
        expenses: number;
        net_income: number;
        profit_margin_pct: number;
        currency: string;
        expense_breakdown: Record<string, number>;
        mom: {
            prev_month_str: string;
            revenue_change_pct: number | null;
            expense_change_pct: number | null;
            net_income_change_pct: number | null;
        } | null;
        revenue_concentration: RevenueConcentration | null;
        ai_insights: {
            headline: string;
            summary: string;
            action_item: string;
        };
    }>({
        month: "Current Period",
        revenue: 0,
        expenses: 0,
        net_income: 0,
        profit_margin_pct: 0,
        currency: 'SAR',
        expense_breakdown: {},
        mom: null,
        revenue_concentration: null,
        ai_insights: {
            headline: "Ready to Generate",
            summary: "Click the generate button to analyze your latest financial data using Fulcrum AI.",
            action_item: "Waiting for analysis..."
        }
    });

    // Fetch User Preferences (Currency) & Saved Reports on Load
    useEffect(() => {
        const fetchSettingsAndReports = async () => {
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

            try {
                const reports = await fetchSavedReports();
                if (Array.isArray(reports)) {
                    setSavedReports(reports);
                }
            } catch (err) {
                // Ignore if endpoint is empty
            }
        };
        fetchSettingsAndReports();
    }, []);

    const handleGenerate = async () => {
        setGenerating(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Exact backend endpoint: POST /reports/generate
            const response = await fetch(`${API_URL}/reports/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    month: selectedMonth,
                    year: selectedYear,
                }),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server returned ${response.status}: ${errText}`);
            }

            const data: MonthlyReportResponse = await response.json();

            // Extract from structured PnL model
            const pnl = data.pnl || { revenue: 0, expenses: 0, net_income: 0, profit_margin_pct: 0, expense_breakdown: {} };
            const period = data.period || { month_name: `Month ${selectedMonth}`, year: selectedYear };

            setReportData({
                month: `${period.month_name} ${period.year}`,
                revenue: pnl.revenue ?? 0,
                expenses: pnl.expenses ?? 0,
                net_income: pnl.net_income ?? 0,
                profit_margin_pct: pnl.profit_margin_pct ?? 0,
                currency: currency,
                expense_breakdown: pnl.expense_breakdown || {},
                mom: data.mom ? {
                    prev_month_str: data.mom.prev_month_str,
                    revenue_change_pct: data.mom.revenue_change_pct,
                    expense_change_pct: data.mom.expense_change_pct,
                    net_income_change_pct: data.mom.net_income_change_pct,
                } : null,
                revenue_concentration: data.revenue_concentration || null,
                ai_insights: {
                    headline: `${period.month_name} Overview`,
                    summary: data.executive_summary || "Financial performance generated successfully.",
                    action_item: (pnl.net_income ?? 0) >= 0
                        ? `Operating at a healthy ${(pnl.profit_margin_pct ?? 0).toFixed(1)}% profit margin.`
                        : "Expenses exceed revenue for this period. Review operating cost drivers."
                }
            });

        } catch (error) {
            console.error("Report Generation Error:", error);
            alert("Failed to generate report. Check browser console for details.");
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadPdf = async () => {
        try {
            setDownloadingPdf(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Exact backend endpoint: POST /reports/download-pdf
            const res = await fetch(`${API_URL}/reports/download-pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    month: selectedMonth,
                    year: selectedYear,
                }),
            });

            if (!res.ok) throw new Error("Failed to generate PDF");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Fulcrum_Report_${selectedYear}_${selectedMonth}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("PDF Download Error:", error);
            alert("Failed to download PDF.");
        } finally {
            setDownloadingPdf(false);
        }
    };

    const formatMoney = (amount: number) => {
        return (amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">

            {/* SIDEBAR - Matched with Dashboard */}
            <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex fixed h-full z-10">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
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

                <div className="pt-4 mt-4 border-t border-slate-100 p-4">
                    <NavItem icon={<Settings />} label="Settings" onClick={() => router.push('/settings')} />
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 md:ml-64 p-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
                        <p className="text-slate-500 text-sm">Monthly P&L, MoM Variance, and Executive Summaries</p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Month & Year Picker */}
                        <MonthPicker
                            selectedMonth={selectedMonth}
                            selectedYear={selectedYear}
                            onChange={(m, y) => {
                                setSelectedMonth(m);
                                setSelectedYear(y);
                            }}
                        />

                        {/* PDF Download Button */}
                        <button
                            onClick={handleDownloadPdf}
                            disabled={downloadingPdf}
                            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
                        >
                            <Download className="w-4 h-4 text-slate-500" />
                            {downloadingPdf ? "Exporting..." : "Export PDF"}
                        </button>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-70 shadow-sm text-sm font-medium"
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT: P&L Statement */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-slate-400 uppercase">Revenue</span>
                                    {reportData.mom && <MoMBadge pct={reportData.mom.revenue_change_pct} />}
                                </div>
                                <div className="text-2xl font-bold text-emerald-600 mt-1">
                                    {reportData.currency} {formatMoney(reportData.revenue)}
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-slate-400 uppercase">Expenses</span>
                                    {reportData.mom && <MoMBadge pct={reportData.mom.expense_change_pct} isExpense />}
                                </div>
                                <div className="text-2xl font-bold text-slate-900 mt-1">
                                    {reportData.currency} {formatMoney(reportData.expenses)}
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-slate-400 uppercase">Net Income</span>
                                    {reportData.mom && <MoMBadge pct={reportData.mom.net_income_change_pct} />}
                                </div>
                                <div className={`text-2xl font-bold mt-1 ${reportData.net_income >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {reportData.currency} {formatMoney(reportData.net_income)}
                                </div>
                            </div>
                        </div>

                        {/* Detailed P&L Table */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-slate-800">Profit & Loss Statement</h3>
                                    <p className="text-xs text-slate-400">Operating margin: {(reportData.profit_margin_pct ?? 0).toFixed(1)}%</p>
                                </div>
                                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                                    {reportData.month}
                                </span>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                                    <span className="text-slate-600 font-medium">Total Revenue</span>
                                    <span className="font-semibold text-slate-900">{reportData.currency} {formatMoney(reportData.revenue)}</span>
                                </div>

                                {/* Categorized Operating Expenses */}
                                <div className="py-2">
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-3">Operating Expenses by Category</div>

                                    {Object.keys(reportData.expense_breakdown).length > 0 ? (
                                        <div className="space-y-2.5">
                                            {Object.entries(reportData.expense_breakdown).map(([cat, amt]) => {
                                                const pct = reportData.expenses > 0 ? (amt / reportData.expenses) * 100 : 0;
                                                return (
                                                    <div key={cat} className="space-y-1">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-600 capitalize">{cat.replace(/_/g, " ")}</span>
                                                            <span className="font-medium text-slate-800">
                                                                -{reportData.currency} {formatMoney(amt)} <span className="text-xs text-slate-400 font-normal">({(pct ?? 0).toFixed(0)}%)</span>
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-slate-800 rounded-full transition-all duration-500"
                                                                style={{ width: `${Math.min(pct, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <ExpenseRow label="Payroll & Contractors" amount={reportData.expenses * 0.6} currency={reportData.currency} />
                                            <ExpenseRow label="Cloud Infrastructure" amount={reportData.expenses * 0.25} currency={reportData.currency} />
                                            <ExpenseRow label="Software Subscriptions" amount={reportData.expenses * 0.15} currency={reportData.currency} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                                    <span className="font-bold text-slate-900">Net Income</span>
                                    <span className={`font-bold text-lg ${reportData.net_income >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {reportData.currency} {formatMoney(reportData.net_income)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Revenue Concentration Section */}
                        {reportData.revenue_concentration && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-slate-600" />
                                        <h3 className="font-semibold text-slate-800 text-sm">Top Revenue Sources</h3>
                                    </div>
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${reportData.revenue_concentration.concentration_risk === 'low'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : reportData.revenue_concentration.concentration_risk === 'moderate'
                                            ? 'bg-amber-50 text-amber-700'
                                            : 'bg-red-50 text-red-700'
                                        }`}>
                                        {reportData.revenue_concentration.concentration_risk} concentration risk
                                    </span>
                                </div>

                                <p className="text-xs text-slate-500 mb-4">
                                    Top client accounts for <span className="font-semibold text-slate-700">{(reportData.revenue_concentration?.top_customer_pct ?? 0).toFixed(1)}%</span> of monthly billing.
                                </p>

                                <div className="space-y-2">
                                    {reportData.revenue_concentration.top_customers.map((c) => (
                                        <div key={c.customer_name} className="flex justify-between items-center text-sm py-1.5 border-b border-slate-100 last:border-0">
                                            <span className="text-slate-700 font-medium">{c.customer_name}</span>
                                            <span className="text-slate-500 font-mono text-xs">
                                                {reportData.currency} {formatMoney(c.total_revenue)} ({((c.percentage_of_total ?? 0)).toFixed(1)}%)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: AI Insights & History */}
                    <div className="space-y-6">
                        {/* AI Executive Summary Card */}
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

                        {/* Past Statements List */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                            <h3 className="text-sm font-semibold text-slate-800 mb-3">Saved Statements</h3>
                            {savedReports.length > 0 ? (
                                <div className="space-y-2">
                                    {savedReports.map((r) => (
                                        <div
                                            key={r.id}
                                            onClick={() => {
                                                setSelectedMonth(r.month);
                                                setSelectedYear(r.year);
                                                handleGenerate();
                                            }}
                                            className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 border border-slate-100 cursor-pointer text-xs transition-colors"
                                        >
                                            <span className="font-medium text-slate-700">
                                                {r.year}-{String(r.month).padStart(2, '0')} (v{r.version})
                                            </span>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-xs text-slate-400">No saved historical reports found.</p>
                                </div>
                            )}
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

function MoMBadge({ pct, isExpense = false }: { pct: number | null | undefined, isExpense?: boolean }) {
    if (pct === null || pct === undefined || isNaN(pct)) return null;
    const isGood = isExpense ? pct <= 0 : pct >= 0;
    const isPositive = pct >= 0;

    return (
        <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isGood ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                }`}
        >
            {isPositive ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`} MoM
        </span>
    );
}
