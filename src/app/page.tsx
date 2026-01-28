'use client';

import React, { useState, useEffect } from 'react';
import {
  Send, Bell, CheckCircle2, AlertCircle, Clock,
  ArrowUpRight, TrendingUp, MessageSquare,
  Activity as ActivityIcon, FileText, CreditCard,
  RefreshCw, DollarSign, ShieldCheck, Settings
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

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

interface Activity {
  id: string;
  type: 'reconciliation' | 'anomaly' | 'invoice' | 'payroll';
  source: string;
  title: string;
  description: string;
  timestamp: string;
  actionLabel?: string;
}

export default function Home() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<'feed' | 'transactions'>('feed');
  const [query, setQuery] = useState('');

  // Real Data State
  const [activities, setActivities] = useState<Activity[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // --- DASHBOARD STATS STATE ---
  const [stats, setStats] = useState({
    cash_on_hand: 0,
    burn_rate: 0,
    runway: 0,
    revenue: 0,
    currency: 'SAR'
  });

  const [loadingData, setLoadingData] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [reconLoading, setReconLoading] = useState(false);
  const [reconResult, setReconResult] = useState<any>(null);

  const supabase = createClient();
  // --- FIX 1: Use Environment Variable for API URL ---
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // --- 1. FETCH LIVE FEED & STATS ---
  useEffect(() => {
    let channel: any;

    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // A. Fetch Activities
      const { data } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id) // Filter by User ID
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setActivities(data.map((item: any) => ({
          ...item,
          timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionLabel: item.action_label
        })));
      }

      // B. Fetch Dashboard Stats (Using API_URL)
      try {
        const response = await fetch(`${API_URL}/dashboard/stats?user_id=${user.id}`);
        if (response.ok) {
            const result = await response.json();
            if (result.cards) {
              setStats(prev => ({
                ...prev,
                ...result.cards,
                currency: result.cards.currency || 'SAR'
              }));
            }
        }
      } catch (e) {
        console.error("Failed to fetch dashboard stats", e);
      }

      // C. Realtime Subscription (With Security Filter)
      channel = supabase
        .channel(`activities-feed-${user.id}`)
        .on(
            'postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'activities',
                filter: `user_id=eq.${user.id}` // --- FIX 2: Stop Data Leaks ---
            }, 
            (payload) => {
                const newItem = payload.new as any;
                setActivities((prev) => [{
                ...newItem,
                timestamp: 'Just now',
                actionLabel: newItem.action_label
                }, ...prev]);
            }
        )
        .subscribe();
    };

    fetchInitialData();

    return () => { 
        if (channel) supabase.removeChannel(channel); 
    };
  }, []);

  // --- 2. FETCH TRANSACTIONS (On Tab Switch) ---
  useEffect(() => {
    if (activeView === 'transactions') {
      loadRealData();
    }
  }, [activeView]);

  const loadRealData = async () => {
    try {
      setLoadingData(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [invData, txnResponse] = await Promise.all([
          api.getInvoices(user.id),
          api.getTransactions(user.id)
        ]);
        setInvoices(invData || []);

        const data = txnResponse as any;
        if (data && data.transactions) setTransactions(data.transactions);
        else if (Array.isArray(data)) setTransactions(data);
        else setTransactions([]);
      }
    } catch (error) {
      console.error("Failed to fetch real data", error);
    } finally {
      setLoadingData(false);
    }
  };

  // --- 3. HANDLERS ---
  const handleRefresh = async () => {
    setSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Please log in first");

      // Use API_URL here too
      await fetch(`${API_URL}/dashboard/sync?user_id=${user.id}`, {
        method: 'POST'
      });

      if (activeView === 'transactions') loadRealData();

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
      const result = await api.runReconciliation(user.id);
      setReconResult(result);
      await loadRealData();
      setReconLoading(false);
      setTimeout(() => setReconResult(null), 5000);
    }
  };

  const handleTestFeed = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('activities').insert({
      user_id: user.id,
      type: 'anomaly',
      source: 'System Test',
      title: 'Test Notification',
      description: 'This is a test to verify the Live Feed is working.',
      action_label: 'Dismiss'
    });

    if (error) alert("Feed Write Error: " + error.message);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">

      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">F</div>
            <span className="font-semibold text-lg tracking-tight">Fulcrum</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavItem
            icon={<ActivityIcon />}
            label="Live Feed"
            active={activeView === 'feed'}
            onClick={() => setActiveView('feed')}
          />
          <NavItem
            icon={<CreditCard />}
            label="Transactions"
            active={activeView === 'transactions'}
            onClick={() => setActiveView('transactions')}
          />
          <NavItem
            icon={<FileText />}
            label="Reports"
            onClick={() => router.push('/reports')}
          />

          <NavItem
            icon={<MessageSquare />}
            label="Ask Fulcrum"
            onClick={() => router.push('/chat')}
          />
        </nav>
        <div className="pt-4 mt-4 border-t border-slate-100">
          <NavItem icon={<Settings />} label="Settings" onClick={() => router.push('/settings')} />
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-900 rounded-xl p-4 text-white">
            <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Your Partner</div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">SJ</div>
              <div>
                <div className="text-sm font-medium">Sarah Jenkins</div>
                <div className="text-xs text-slate-400">Accountant</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-h-screen md:pl-64 transition-all">

        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-medium text-slate-600">Books are audit-ready</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative"><Bell className="w-5 h-5" /></button>
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300"></div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-50">

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
                  value={`${stats.currency} ${stats.cash_on_hand.toLocaleString()}`}
                  trend="-1.2%"
                />
                <StatCard
                  label="Burn Rate"
                  value={`${stats.currency} ${stats.burn_rate.toLocaleString()}`}
                  trend="Stable"
                  positive
                />
              </div>

              {/* Activity Stream Window */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <ActivityIcon className="w-5 h-5" /> Activity Stream
                  </h3>
                  <div className="flex items-center gap-2">
                    <button onClick={handleTestFeed} className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50">Test Feed</button>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Live</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                  {activities.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No recent activity. <br /> Try syncing transactions.</div>
                  ) : (
                    activities.map((activity) => <FeedItem key={activity.id} {...activity} />)
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: TRANSACTIONS */}
          {activeView === 'transactions' && (
            <div className="p-8 max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Real-Time Data</h2>
                  <p className="text-sm text-slate-500">Synced from Zoho & Stripe</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleRefresh} disabled={syncing} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 shadow-sm">
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing...' : 'Sync Zoho'}
                  </button>
                  <button onClick={handleReconcile} disabled={reconLoading} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-black text-white hover:bg-slate-800 disabled:opacity-50 shadow-sm">
                    <RefreshCw className={`w-4 h-4 ${reconLoading ? 'animate-spin' : ''}`} /> {reconLoading ? 'Reconciling...' : 'Reconcile Now'}
                  </button>
                </div>
              </div>

              {loadingData ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-black"></div></div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <DataMetric label="Total Revenue" value={invoices.reduce((s, i) => s + Number(i.total_amount), 0)} icon={<TrendingUp className="text-green-600" />} />
                    <DataMetric label="Outstanding" value={invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + Number(i.total_amount), 0)} icon={<Clock className="text-amber-600" />} />
                    <DataMetric label="Matched" value={`${transactions.filter(t => t.reconciliation_status === 'matched').length}/${transactions.length}`} icon={<DollarSign className="text-blue-600" />} />
                    <DataMetric label="Compliance" value="ZATCA Ready" icon={<ShieldCheck className="text-green-600" />} textOnly />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="px-5 py-4 border-b border-slate-200 flex justify-between bg-slate-50/50">
                        <h3 className="font-semibold text-sm">Recent Invoices</h3>
                        <span className="text-xs text-slate-500">Zoho Books</span>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-[500px] overflow-auto">
                        {invoices.length === 0 && <div className="p-10 text-sm text-slate-400 text-center">No invoices found.</div>}
                        {invoices.map(inv => (
                          <div key={inv.id} className="p-4 hover:bg-slate-50 flex justify-between items-center group">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-slate-900">{inv.external_id}</span>
                                <StatusBadge status={inv.status} />
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">{inv.issue_date}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-slate-900">{Number(inv.total_amount).toLocaleString()}</div>
                              <div className="text-xs text-slate-400">{inv.currency}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="px-5 py-4 border-b border-slate-200 flex justify-between bg-slate-50/50">
                        <h3 className="font-semibold text-sm">Bank Activity</h3>
                        <span className="text-xs text-slate-500">Stripe / Bank</span>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-[500px] overflow-auto">
                        {transactions.length === 0 && <div className="p-10 text-sm text-slate-400 text-center">No transactions found.</div>}
                        {transactions.map(txn => (
                          <div key={txn.id} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-slate-900">{txn.description}</span>
                              </div>
                              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border mt-1 inline-block ${txn.reconciliation_status === 'matched' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {txn.reconciliation_status}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className={`font-semibold ${Number(txn.amount) > 0 ? 'text-green-600' : 'text-slate-900'}`}>
                                {Number(txn.amount).toLocaleString()}
                              </div>
                              <div className="text-xs text-slate-400">{txn.transaction_date}</div>
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
    </div>
  );
}

// --- SUB-COMPONENTS ---
function NavItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>{React.cloneElement(icon, { className: "w-4 h-4" })}{label}</button>;
}
function StatCard({ label, value, trend, positive = false }: any) {
  return <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"><div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{label}</div><div className="flex items-end justify-between"><div className="text-2xl font-bold text-slate-900">{value}</div><div className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}><TrendingUp className={`w-3 h-3 ${!positive && 'rotate-180'}`} /> {trend}</div></div></div>;
}
function FeedItem({ title, description, timestamp, type, actionLabel }: any) {
  const icons: any = { reconciliation: <CheckCircle2 className="text-emerald-500 w-5 h-5" />, anomaly: <AlertCircle className="text-amber-500 w-5 h-5" />, invoice: <Send className="text-blue-500 w-5 h-5" /> };
  return <div className="p-5 hover:bg-slate-50 transition-colors group"><div className="flex gap-4"><div className="mt-1 flex-shrink-0 bg-slate-50 p-2 rounded-lg border border-slate-100 h-fit">{icons[type] || <ActivityIcon className="w-5 h-5 text-slate-400" />}</div><div className="flex-1"><div className="flex justify-between items-start"><h4 className="text-sm font-semibold text-slate-900">{title}</h4><span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {timestamp}</span></div><p className="text-sm text-slate-600 mt-1 leading-relaxed">{description}</p>{actionLabel && <button className="mt-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50">{actionLabel}</button>}</div></div></div>;
}
function DataMetric({ label, value, icon, textOnly }: any) {
  return <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[120px]"><div className="flex justify-between items-start"><div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</div><div className="p-2 bg-slate-50 rounded-lg">{icon}</div></div><div className={`font-semibold ${textOnly ? 'text-lg' : 'text-2xl'} text-slate-900`}>{typeof value === 'number' ? value.toLocaleString() : value}</div></div>;
}
function StatusBadge({ status }: { status: string }) {
  const isPaid = status === 'paid';
  return <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${isPaid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{status}</span>;
}