'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    FileText, Download, TrendingUp, TrendingDown,
    Calendar, ChevronRight, Activity, CreditCard, MessageSquare, CheckCircle2,
    Settings, LogOut, Zap, Users, Sparkles
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
            const pnl = data.pnl || { revenue: 0, expenses: 0, net_income: 0, margin_pct: 0, expense_breakdown: {} };

            setReportData({
                month: data.month || `${selectedMonth}/${selectedYear}`,
                revenue: pnl.revenue ?? 0,
                expenses: pnl.expenses ?? 0,
                net_income: pnl.net_income ?? 0,
                profit_margin_pct: pnl.margin_pct ?? 0,
                currency: data.currency || currency,
                expense_breakdown: pnl.expense_breakdown || {},
                mom: data.mom ? {
                    prev_month_str: data.mom.prev_month_label,
                    revenue_change_pct: data.mom.revenue_change_pct,
                    expense_change_pct: data.mom.expense_change_pct,
                    net_income_change_pct: data.mom.net_income_change_pct,
                } : null,
                revenue_concentration: data.revenue_concentration || null,
                ai_insights: {
                    headline: data.ai_insights?.headline || `${data.month} Overview`,
                    summary: data.ai_insights?.summary || "Financial performance generated successfully.",
                    action_item: data.ai_insights?.action_item || "Review operating cost drivers."
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
    const MONTH_NAMES = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    return (
        <>
            <main className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

                    {/* ── Header ── */}
                    <div className="mb-8 sm:mb-10">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2.5 mb-1">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-sm">
                                        <FileText className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                        Financial Reports
                                    </h1>
                                </div>
                                <div className="flex items-center gap-3 mt-3 ml-[42px]">
                                    <MonthPicker
                                        selectedMonth={selectedMonth}
                                        selectedYear={selectedYear}
                                        onChange={(m, y) => {
                                            setSelectedMonth(m);
                                            setSelectedYear(y);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <button
                                    onClick={handleDownloadPdf}
                                    disabled={downloadingPdf}
                                    className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 hover:shadow-sm transition-all disabled:opacity-50"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{downloadingPdf ? "Exporting…" : "Export PDF"}</span>
                                    <span className="sm:hidden">{downloadingPdf ? "…" : "PDF"}</span>
                                </button>

                                <button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="inline-flex items-center gap-2 h-9 px-5 text-sm font-semibold text-white bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg hover:from-slate-800 hover:to-slate-700 transition-all disabled:opacity-60 shadow-md hover:shadow-lg"
                                >
                                    {generating ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span className="hidden sm:inline">Analyzing…</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Generate Report</span>
                                            <span className="sm:hidden">Generate</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Metric Cards ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        {/* Revenue */}
                        <div className="group bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6 shadow-sm hover:shadow-lg hover:border-emerald-200/60 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-r-full" />
                            <div className="ml-3">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Revenue</span>
                                    </div>
                                    {reportData.mom && <MoMBadge pct={reportData.mom.revenue_change_pct} />}
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xs text-slate-400 font-medium">{reportData.currency}</span>
                                    <span className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">{formatMoney(reportData.revenue)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Expenses */}
                        <div className="group bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6 shadow-sm hover:shadow-lg hover:border-amber-200/60 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-orange-500 rounded-r-full" />
                            <div className="ml-3">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
                                            <CreditCard className="w-3 h-3 text-amber-600" />
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Expenses</span>
                                    </div>
                                    {reportData.mom && <MoMBadge pct={reportData.mom.expense_change_pct} isExpense />}
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xs text-slate-400 font-medium">{reportData.currency}</span>
                                    <span className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">{formatMoney(reportData.expenses)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Net Income */}
                        <div className="group bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6 shadow-sm hover:shadow-lg hover:border-blue-200/60 transition-all duration-300 relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1 h-full rounded-r-full ${reportData.net_income >= 0 ? 'bg-gradient-to-b from-blue-400 to-indigo-600' : 'bg-gradient-to-b from-rose-400 to-rose-600'}`} />
                            <div className="ml-3">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${reportData.net_income >= 0 ? 'bg-blue-50' : 'bg-rose-50'}`}>
                                            <Activity className={`w-3 h-3 ${reportData.net_income >= 0 ? 'text-blue-600' : 'text-rose-600'}`} />
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Net Income</span>
                                    </div>
                                    {reportData.mom && <MoMBadge pct={reportData.mom.net_income_change_pct} />}
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xs text-slate-400 font-medium">{reportData.currency}</span>
                                    <span className={`text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${reportData.net_income >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>
                                        {formatMoney(reportData.net_income)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Main Grid ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                        {/* ── Left Column ── */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* P&L Table */}
                            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                                <div className="px-5 sm:px-6 py-4 border-b border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-slate-50/80 to-white">
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-[15px] tracking-tight">Profit & Loss Statement</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Operating margin: {(reportData.profit_margin_pct ?? 0).toFixed(1)}%</p>
                                    </div>
                                    <span className="text-[11px] bg-slate-900 text-white px-3 py-1 rounded-full font-semibold self-start sm:self-auto shadow-sm">
                                        {reportData.month}
                                    </span>
                                </div>

                                <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-4">
                                    {/* Revenue Row */}
                                    <div className="flex justify-between items-center py-2.5 px-3 -mx-3 rounded-lg bg-emerald-50/40">
                                        <span className="text-sm text-slate-700 font-semibold flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Total Revenue
                                        </span>
                                        <span className="text-sm font-bold text-slate-900 tabular-nums">{reportData.currency} {formatMoney(reportData.revenue)}</span>
                                    </div>

                                    {/* Expense Breakdown */}
                                    <div className="py-2">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-4 flex items-center gap-2">
                                            <div className="h-px flex-1 bg-slate-100" />
                                            Operating Expenses
                                            <div className="h-px flex-1 bg-slate-100" />
                                        </div>

                                        {Object.keys(reportData.expense_breakdown).length > 0 ? (
                                            <div className="space-y-3.5">
                                                {Object.entries(reportData.expense_breakdown).map(([cat, amt]) => {
                                                    const pct = reportData.expenses > 0 ? (amt / reportData.expenses) * 100 : 0;
                                                    return (
                                                        <div key={cat} className="space-y-1.5 group/row">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-600 capitalize group-hover/row:text-slate-900 transition-colors">{cat.replace(/_/g, " ")}</span>
                                                                <span className="font-semibold text-slate-800 tabular-nums">
                                                                    -{reportData.currency} {formatMoney(amt)}{" "}
                                                                    <span className="text-[11px] text-slate-400 font-normal">({(pct ?? 0).toFixed(0)}%)</span>
                                                                </span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-slate-600 to-slate-800 rounded-full transition-all duration-700 ease-out"
                                                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="space-y-0.5">
                                                <ExpenseRow label="Payroll & Contractors" amount={reportData.expenses * 0.6} currency={reportData.currency} />
                                                <ExpenseRow label="Cloud Infrastructure" amount={reportData.expenses * 0.25} currency={reportData.currency} />
                                                <ExpenseRow label="Software Subscriptions" amount={reportData.expenses * 0.15} currency={reportData.currency} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Net Income Row */}
                                    <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-slate-200">
                                        <span className="font-bold text-slate-900 text-base">Net Income</span>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-xs text-slate-400 font-medium">{reportData.currency}</span>
                                            <span className={`font-black text-xl tabular-nums ${reportData.net_income >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {formatMoney(reportData.net_income)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Revenue Concentration */}
                            {reportData.revenue_concentration && (
                                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                                                <Users className="w-3.5 h-3.5 text-violet-600" />
                                            </div>
                                            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Top Revenue Sources</h3>
                                        </div>
                                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold self-start sm:self-auto ${reportData.revenue_concentration.concentration_risk
                                                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                            }`}>
                                            {reportData.revenue_concentration.concentration_risk ? "High" : "Low"} Risk
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-500 mb-4">
                                        Top client accounts for <span className="font-bold text-slate-700">{(reportData.revenue_concentration?.top_customer_share_pct ?? 0).toFixed(1)}%</span> of monthly billing.
                                    </p>

                                    <div className="divide-y divide-slate-50">
                                        {reportData.revenue_concentration.top_customers.map((c) => (
                                            <div key={c.customer_id} className="flex justify-between items-center text-sm py-3 hover:bg-slate-50/50 transition-colors -mx-2 px-2 rounded-lg">
                                                <span className="text-slate-700 font-medium">{c.customer_id}</span>
                                                <span className="text-slate-500 font-mono text-xs tabular-nums">
                                                    {reportData.currency} {formatMoney(c.total_paid)} <span className="text-slate-400">({((c.revenue_share_pct ?? 0)).toFixed(1)}%)</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Right Column ── */}
                        <div className="space-y-6">

                            {/* AI Executive Summary */}
                            <div className="rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden relative bg-gradient-to-br from-white via-white to-emerald-50/30">
                                {/* Accent strip */}
                                <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

                                <div className="p-5 sm:p-6">
                                    <div className="flex items-center gap-2.5 mb-5">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm shadow-emerald-200">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-slate-900 block leading-tight">AI Summary</span>
                                            <span className="text-[10px] text-slate-400 font-medium">Powered by Fulcrum AI</span>
                                        </div>
                                    </div>

                                    {reportData.ai_insights.headline === "Ready to Generate" ? (
                                        <div className="py-8 flex flex-col items-center justify-center text-center">
                                            <div className="w-14 h-14 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center border border-slate-200/60 mb-4 shadow-inner">
                                                <Sparkles className="w-5 h-5 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-700 mb-1">Ready for Analysis</p>
                                            <p className="text-xs text-slate-400 max-w-[220px] leading-relaxed">
                                                Click &ldquo;Generate Report&rdquo; to unlock AI-driven insights on your financial data.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <h3 className="text-base font-bold text-slate-900 leading-snug">{reportData.ai_insights.headline}</h3>
                                            <p className="text-[13px] text-slate-600 leading-relaxed">
                                                {reportData.ai_insights.summary}
                                            </p>
                                            <div className="p-3.5 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 rounded-xl border border-emerald-100/80">
                                                <div className="flex items-start gap-2.5">
                                                    <div className="mt-0.5 w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                                        <TrendingDown className="w-3 h-3 text-emerald-700" />
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs font-bold text-emerald-900 mb-0.5">Action Item</span>
                                                        <span className="text-xs text-emerald-800/70 leading-relaxed">{reportData.ai_insights.action_item}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Loading overlay */}
                                {generating && (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[3px] z-20 flex flex-col items-center justify-center gap-3">
                                        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                                        <span className="text-sm font-medium text-slate-500">Analyzing your data…</span>
                                    </div>
                                )}
                            </div>

                            {/* Saved Statements */}
                            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                                <div className="px-5 sm:px-6 py-4 border-b border-slate-100/80 bg-gradient-to-r from-slate-50/80 to-white">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Saved Statements</h3>
                                    </div>
                                </div>
                                <div className="px-5 sm:px-6 py-4">
                                    {savedReports.length > 0 ? (
                                        <div className="space-y-1">
                                            {savedReports.map((r) => (
                                                <div
                                                    key={r.id}
                                                    onClick={() => {
                                                        setSelectedMonth(r.month);
                                                        setSelectedYear(r.year);
                                                        handleGenerate();
                                                    }}
                                                    className="flex items-center justify-between p-3 -mx-2 rounded-xl hover:bg-slate-50 cursor-pointer text-xs transition-all group hover:shadow-sm"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                                                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-slate-700 block">{MONTH_NAMES[r.month - 1]} {r.year}</span>
                                                            <span className="text-[10px] text-slate-400">Version {r.version}</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
                                                <FileText className="w-4 h-4 text-slate-300" />
                                            </div>
                                            <p className="text-xs text-slate-400 font-medium">No saved reports yet</p>
                                            <p className="text-[11px] text-slate-300 mt-0.5">Generate your first report above</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </main>
        </>
    );
}

// --- SUBCOMPONENTS ---

function ExpenseRow({ label, amount, currency }: { label: string, amount: number, currency: string }) {
    return (
        <div className="flex justify-between items-center text-sm py-2.5 px-3 -mx-3 hover:bg-slate-50/80 rounded-lg transition-colors group/exp">
            <span className="text-slate-500 group-hover/exp:text-slate-700 transition-colors flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
                {label}
            </span>
            <span className="text-slate-800 font-semibold tabular-nums">-{currency} {amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </div>
    );
}

function MoMBadge({ pct, isExpense = false }: { pct: number | null | undefined, isExpense?: boolean }) {
    if (pct === null || pct === undefined || isNaN(pct)) return null;
    const isGood = isExpense ? pct <= 0 : pct >= 0;
    const isPositive = pct >= 0;

    return (
        <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${isGood
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-rose-50 text-rose-700 border border-rose-100"
            }`}
        >
            {isGood ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {isPositive ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`}
        </span>
    );
}
