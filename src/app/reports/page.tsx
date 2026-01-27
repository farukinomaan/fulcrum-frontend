'use client';

import React, { useState } from 'react';
import { 
  FileText, Download, TrendingUp, TrendingDown, 
  Calendar, ChevronRight, Activity, CreditCard, MessageSquare, CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function ReportsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [generating, setGenerating] = useState(false);
  
  // Initialize with placeholders so the UI isn't empty
  const [reportData, setReportData] = useState({
    month: "Current Period",
    revenue: 0,
    expenses: 0,
    net_income: 0,
    ai_insights: {
        headline: "Ready to Generate",
        summary: "Click the generate button to analyze your latest financial data using Fulcrum AI.",
        action_item: "Waiting for analysis..."
    }
  });

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
        // 1. Get User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        // 2. Call Python Backend
        const response = await fetch('http://localhost:8000/reports/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id })
        });

        const data = await response.json();
        
        // 3. Update UI with Real Data
        if (data.revenue !== undefined) {
            setReportData(data);
        }

    } catch (error) {
        console.error("Report Generation Error:", error);
        alert("Failed to generate report. Is the backend running?");
    } finally {
        setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex fixed h-full z-10">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">F</div>
            <span className="font-semibold text-lg tracking-tight">Fulcrum</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavItem icon={<Activity />} label="Live Feed" onClick={() => router.push('/')} />
          <NavItem icon={<CreditCard />} label="Transactions" onClick={() => router.push('/')} />
          <NavItem icon={<FileText />} label="Reports" active />
          <NavItem icon={<MessageSquare />} label="Ask Fulcrum" onClick={() => router.push('/chat')} />
        </nav>
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
                  SAR {reportData.revenue.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-400 uppercase">Expenses</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  SAR {reportData.expenses.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-400 uppercase">Net Income</div>
                <div className={`text-2xl font-bold mt-1 ${reportData.net_income >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  SAR {reportData.net_income.toLocaleString()}
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
                  <span className="font-semibold">SAR {reportData.revenue.toLocaleString()}</span>
                </div>
                
                <div className="py-2">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2">Operating Expenses</div>
                  {/* Dynamic mock rows based on total expenses */}
                  <ExpenseRow label="Payroll & Contractors" amount={reportData.expenses * 0.6} />
                  <ExpenseRow label="Cloud Infrastructure" amount={reportData.expenses * 0.25} />
                  <ExpenseRow label="Software Subscriptions" amount={reportData.expenses * 0.15} />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Net Income</span>
                  <span className={`font-bold text-lg ${reportData.net_income >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    SAR {reportData.net_income.toLocaleString()}
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

            {/* Past Reports List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 px-2">Past Statements</h3>
              <div className="space-y-1">
                <ReportItem month="September 2025" status="Audit Ready" />
                <ReportItem month="August 2025" status="Audit Ready" />
                <ReportItem month="July 2025" status="Audit Ready" />
              </div>
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
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-slate-900 text-white shadow-md' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      }`}
    >
      {React.cloneElement(icon, { className: `w-4 h-4 ${active ? 'text-white' : ''}` })}
      {label}
    </button>
  );
}

function ExpenseRow({ label, amount }: { label: string, amount: number }) {
  return (
    <div className="flex justify-between items-center text-sm py-1.5 hover:bg-slate-50 rounded px-2 -mx-2 transition-colors">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium">-{amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
    </div>
  );
}

function ReportItem({ month, status }: { month: string, status: string }) {
  return (
    <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
          <FileText className="w-4 h-4" />
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-slate-900">{month}</div>
          <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-2 h-2" /> {status}
          </div>
        </div>
      </div>
      <Download className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
    </button>
  );
}