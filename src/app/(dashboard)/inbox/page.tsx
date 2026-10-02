'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Send, Bell, CheckCircle2, AlertCircle, Clock,
  TrendingUp, MessageSquare, Activity as ActivityIcon,
  FileText, CreditCard, RefreshCw, DollarSign,
  LogOut, Settings, Zap, X, Landmark, ArrowUpRight, Sparkles, Loader2, Check
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

// --- TYPES ---
interface Invoice {
  id: string;
  total_amount: number;
  status: string;
  external_id: string;
  currency: string;
  issue_date: string;
}

interface Transaction {
  id: string;
  amount: number;
  description: string;
  reconciliation_status: string;
  currency: string;
  transaction_date: string;
}

interface AIAction {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  metadata: {
    action_type: 'reconcile' | 'invoice_chase' | 'review_spend';
    target_id?: string;
  };
  timestamp?: string;
}


export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialView = searchParams.get('view') === 'transactions' ? 'transactions' : 'feed';
  const [activeView, setActiveView] = useState<'feed' | 'transactions'>(initialView);

  useEffect(() => {
    setActiveView(searchParams.get('view') === 'transactions' ? 'transactions' : 'feed');
  }, [searchParams]);


  // Real Data State
  const [actions, setActions] = useState<AIAction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Stats & Dynamic Providers
  const [stats, setStats] = useState({
    cash_on_hand: 0,
    burn_rate: 0,
    runway: 0,
    revenue: 0,
    currency: '',
    providers: {
      accounting: 'Accounting',
      banking: 'Bank'
    }
  });

  const [loadingData, setLoadingData] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [reconLoading, setReconLoading] = useState(false);
  const [reconResult, setReconResult] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const supabase = createClient();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // FETCH ACTION INBOX & STATS 
  const fetchDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // A. Fetch Active AI Actions
    const { data } = await supabase
      .from('ai_actions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setActions(data.map((item: any) => ({
        ...item,
        timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
    }

    // B. Fetch Dashboard Stats
    try {
      const response = await fetch(`${API_URL}/dashboard/stats?user_id=${user.id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.cards) {
          setStats(prev => ({
            ...prev,
            ...result.cards,
            providers: result.providers || { accounting: 'Zoho Books', banking: 'Stripe' },
            currency: result.cards.currency || 'SAR'
          }));
        }
      }
    } catch (e) {
      console.error("Failed to fetch dashboard stats", e);
    }
  };

  useEffect(() => {
    let channel: any;
    fetchDashboardData();

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`ai-actions-feed-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ai_actions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newItem = payload.new as any;
            if (newItem.status === 'pending') {
              setActions((prev) => {
                return [{
                  ...newItem,
                  timestamp: 'Just now'
                }, ...prev];
              });
            }
          }
        )
        .subscribe();
    }
    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FETCH TRANSACTIONS (On Tab Switch)
  useEffect(() => {
    if (activeView === 'transactions') {
      loadRealData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  const loadRealData = async () => {
    try {
      setLoadingData(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [invRes, txnRes] = await Promise.all([
          fetch(`${API_URL}/invoices?user_id=${user.id}`).catch(err => null),
          fetch(`${API_URL}/transactions?user_id=${user.id}`).catch(err => null)
        ]);

        if (invRes && invRes.ok) {
          const invData = await invRes.json();
          setInvoices(Array.isArray(invData) ? invData : []);
        } else {
          setInvoices([]);
        }

        if (txnRes && txnRes.ok) {
          const txnData = await txnRes.json();
          if (txnData && txnData.transactions) {
            setTransactions(txnData.transactions);
          } else if (Array.isArray(txnData)) {
            setTransactions(txnData);
          } else {
            setTransactions([]);
          }
        } else {
          setTransactions([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch real data", error);
    } finally {
      setLoadingData(false);
    }
  };

  // HANDLERS 
  const handleRefresh = async () => {
    setSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Please log in first");

      const res = await fetch(`${API_URL}/dashboard/sync?user_id=${user.id}`, {
        method: 'POST'
      });

      const result = await res.json();
      if (result.status === 'error') {
        alert("Sync Failed: " + result.message);
      } else {
        await fetchDashboardData();
        if (activeView === 'transactions') {
          await loadRealData();
        }
      }
    } catch (e) {
      console.error(e);
      alert("Network error connecting to backend");
    } finally {
      setSyncing(false);
    }
  };

  const handleReconcile = async () => {
    setReconLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const result = await api.runReconciliation(user.id);
        setReconResult(result);
        await loadRealData();
      } catch (e) {
        console.error("Reconciliation failed", e);
      } finally {
        setReconLoading(false);
        setTimeout(() => setReconResult(null), 5000);
      }
    }
  };

  const handleInboxAction = async (id: string, nextStatus: 'completed' | 'dismissed') => {
    setProcessingId(id);

    await supabase
      .from('ai_actions')
      .update({ status: nextStatus })
      .eq('id', id);
      
    setActions(prev => prev.filter(item => item.id !== id));
    setProcessingId(null);
  };

  const handleViewChange = (view: 'feed' | 'transactions') => {
    setActiveView(view);
    const newUrl = view === 'transactions' ? '/inbox?view=transactions' : '/inbox';
    window.history.pushState({}, '', newUrl);
  };

  const formatMoney = (amount: number) => {
    return Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <>


        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen">

          {/* VIEW 1: LIVE FEED */}
          {activeView === 'feed' && (
            <div className="p-8 max-w-5xl mx-auto space-y-8">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  label="Runway"
                  value={`${stats.runway} Months`}
                  trend="+2mo"
                  positive
                />
                <StatCard
                  label="Cash on Hand"
                  value={`${stats.currency} ${formatMoney(stats.cash_on_hand)}`}
                  trend="-1.2%"
                />
                <StatCard
                  label="Burn Rate"
                  value={`${stats.currency} ${formatMoney(stats.burn_rate)}`}
                  trend="Stable"
                  positive
                />
              </div>

              {/* Action Inbox Window Layout */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-slate-900" /> Action Inbox
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                      {actions.length} Pending
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                  {actions.length === 0 ? (
                    <div className="p-16 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto">
                        <Check className="w-4 h-4 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-900">Inbox Completely Clear</p>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        Fulcrum AI is running in the background monitoring financial anomalies.
                      </p>
                    </div>
                  ) : (
                    actions.map((action) => (
                      <div key={action.id} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-all group animate-in fade-in duration-200">
                        <div className={`mt-0.5 p-2 rounded-lg border flex-shrink-0 ${action.priority === 'high'
                            ? 'bg-red-50 border-red-100 text-red-600'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}>
                          <AlertCircle className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-slate-900">{action.title}</h4>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded">
                                {action.category}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3" /> {action.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{action.description}</p>
                        </div>

                        {/* Inline Interaction Triggers */}
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 shrink-0 self-center">
                          {action.metadata?.action_type === 'reconcile' && (
                            <button
                              disabled={!!processingId}
                              onClick={() => handleInboxAction(action.id, 'completed')}
                              className="px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-all shadow-sm"
                            >
                              Reconcile
                            </button>
                          )}

                          {action.metadata?.action_type === 'invoice_chase' && (
                            <button
                              disabled={!!processingId}
                              onClick={() => handleInboxAction(action.id, 'completed')}
                              className="px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-all shadow-sm"
                            >
                              Chase Invoice
                            </button>
                          )}

                          {action.metadata?.action_type === 'review_spend' && (
                            <button
                              disabled={!!processingId}
                              onClick={() => handleInboxAction(action.id, 'completed')}
                              className="px-3 py-1.5 border border-slate-200 bg-white text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-all shadow-sm"
                            >
                              Review Details
                            </button>
                          )}

                          <button
                            disabled={!!processingId}
                            onClick={() => handleInboxAction(action.id, 'dismissed')}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: TRANSACTIONS */}
          {activeView === 'transactions' && (
            <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-sm">
                    <Landmark className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Real-Time Data</h2>
                    <p className="text-xs sm:text-sm text-slate-400">Synced from {stats.providers.accounting} & {stats.providers.banking}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <button onClick={handleRefresh} disabled={syncing} className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 hover:shadow-sm transition-all disabled:opacity-50">
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">{syncing ? 'Syncing…' : `Sync ${stats.providers.accounting}`}</span>
                    <span className="sm:hidden">Sync</span>
                  </button>
                  <button onClick={handleReconcile} disabled={reconLoading} className="inline-flex items-center gap-2 h-9 px-5 text-sm font-semibold text-white bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg hover:from-slate-800 hover:to-slate-700 transition-all disabled:opacity-60 shadow-md hover:shadow-lg">
                    <RefreshCw className={`w-3.5 h-3.5 ${reconLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">{reconLoading ? 'Reconciling…' : 'Reconcile Now'}</span>
                    <span className="sm:hidden">{reconLoading ? '…' : 'Reconcile'}</span>
                  </button>
                </div>
              </div>

              {loadingData ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3"><div className="w-8 h-8 border-[3px] border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div><span className="text-sm text-slate-400 font-medium">Loading data…</span></div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <DataMetric
                      label="Total Revenue"
                      value={`${stats.currency} ${formatMoney(invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total_amount), 0))}`}
                      icon={<TrendingUp className="text-green-600" />}
                    />
                    <DataMetric
                      label="Outstanding"
                      value={`${stats.currency} ${formatMoney(invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + Number(i.total_amount), 0))}`}
                      icon={<Clock className="text-amber-600" />}
                    />
                    <DataMetric
                      label="Matched"
                      value={`${transactions.filter(t => t.reconciliation_status === 'matched').length}/${transactions.length}`}
                      icon={<DollarSign className="text-blue-600" />}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* INVOICE CARD */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm h-[500px] flex flex-col">
                      <div className="px-5 sm:px-6 py-4 border-b border-slate-100/80 flex justify-between items-center bg-gradient-to-r from-slate-50/80 to-white shrink-0">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <h3 className="font-bold text-sm text-slate-900 tracking-tight">Recent Invoices</h3>
                        </div>
                        <span className="text-[11px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">{stats.providers.accounting}</span>
                      </div>
                      <div className="divide-y divide-slate-50 overflow-auto flex-1">
                        {invoices.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                              <FileText className="w-4 h-4 text-slate-300" />
                            </div>
                            <p className="text-xs text-slate-400 font-medium">No invoices found.</p>
                          </div>
                        )}
                        {invoices.map(inv => (
                          <div key={inv.id} className="px-5 sm:px-6 py-3.5 hover:bg-slate-50/50 flex justify-between items-center group transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-slate-900">{inv.external_id}</span>
                                <StatusBadge status={inv.status} />
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1">{inv.issue_date}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-slate-900 tabular-nums">{formatMoney(inv.total_amount)}</div>
                              <div className="text-[11px] text-slate-400">{inv.currency}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* BANK CARD */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm h-[500px] flex flex-col">
                      <div className="px-5 sm:px-6 py-4 border-b border-slate-100/80 flex justify-between items-center bg-gradient-to-r from-slate-50/80 to-white shrink-0">
                        <div className="flex items-center gap-2">
                          <Landmark className="w-3.5 h-3.5 text-slate-400" />
                          <h3 className="font-bold text-sm text-slate-900 tracking-tight">Bank Activity</h3>
                        </div>
                        <span className="text-[11px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">{stats.providers.banking} / Bank</span>
                      </div>
                      <div className="divide-y divide-slate-50 overflow-auto flex-1">
                        {transactions.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                              <Landmark className="w-4 h-4 text-slate-300" />
                            </div>
                            <p className="text-xs text-slate-400 font-medium">No transactions found.</p>
                          </div>
                        )}
                        {transactions.map(txn => (
                          <div key={txn.id} className="px-5 sm:px-6 py-3.5 hover:bg-slate-50/50 flex justify-between items-center transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-slate-900">{txn.description}</span>
                              </div>
                              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full border mt-1 inline-block ${txn.reconciliation_status === 'matched' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {txn.reconciliation_status}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold tabular-nums ${Number(txn.amount) > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                {formatMoney(txn.amount)}
                              </div>
                              <div className="text-[11px] text-slate-400">{txn.transaction_date}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      {/* Toast */}
      {reconResult && (
        <div className="fixed bottom-6 right-6 bg-white border border-slate-200 shadow-xl p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
          <div className="bg-green-100 p-2 rounded-lg text-green-600"><CheckCircle2 className="w-5 h-5" /></div>
          <div>
            <div className="font-semibold text-sm">Reconciliation Complete</div>
            <div className="text-xs text-slate-500">{reconResult.matches_found ? `Matched ${reconResult.matches_found} items` : 'No new matches found'}</div>
          </div>
        </div>
      )}
    </>
  );
}

// --- SUB-COMPONENTS ---
function NavItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>{React.cloneElement(icon, { className: "w-4 h-4" })}{label}</button>;
}
function StatCard({ label, value, trend, positive = false }: any) {
  return <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"><div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{label}</div><div className="flex items-end justify-between"><div className="text-2xl font-bold text-slate-900">{value}</div><div className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}><TrendingUp className={`w-3 h-3 ${!positive && 'rotate-180'}`} /> {trend}</div></div></div>;
}
function DataMetric({ label, value, icon, textOnly }: any) {
  const colorMap: Record<string, { border: string; bg: string; hover: string }> = {
    'Total Revenue': { border: 'bg-gradient-to-b from-emerald-400 to-emerald-600', bg: 'hover:border-emerald-200/60', hover: 'bg-emerald-50' },
    'Outstanding': { border: 'bg-gradient-to-b from-amber-400 to-orange-500', bg: 'hover:border-amber-200/60', hover: 'bg-amber-50' },
    'Matched': { border: 'bg-gradient-to-b from-blue-400 to-indigo-600', bg: 'hover:border-blue-200/60', hover: 'bg-blue-50' },
  };
  const colors = colorMap[label] || { border: 'bg-gradient-to-b from-slate-400 to-slate-600', bg: '', hover: 'bg-slate-50' };
  return (
    <div className={`group bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 shadow-sm ${colors.bg} hover:shadow-lg transition-all duration-300 relative overflow-hidden min-h-[120px] flex flex-col justify-between`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${colors.border} rounded-r-full`} />
      <div className="ml-3">
        <div className="flex justify-between items-start mb-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">{label}</span>
          <div className={`w-6 h-6 rounded-md ${colors.hover} flex items-center justify-center`}>{React.cloneElement(icon, { className: 'w-3 h-3' })}</div>
        </div>
        <div className={`font-bold ${textOnly ? 'text-lg' : 'text-2xl sm:text-3xl'} text-slate-900 tabular-nums tracking-tight`}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      </div>
    </div>
  );
}
function StatusBadge({ status }: { status: string }) {
  const isPaid = status === 'paid';
  return <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>{status}</span>;
}