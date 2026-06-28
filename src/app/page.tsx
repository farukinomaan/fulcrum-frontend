'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  Activity, CreditCard, FileText, Zap, MessageSquare, Settings as SettingsIcon,
  Check, X, AlertCircle, Landmark, Sparkles, Loader2, TrendingUp, TrendingDown
} from 'lucide-react';

interface AIAction {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  metadata: any;
}

// Fallback seed data in case database is empty or still syncing
const SEED_FALLBACK: AIAction[] = [
  { id: '1', title: 'Match Found', description: 'Found a matching invoice in QuickBooks for the USD 2,500 Stripe payout.', category: 'banking', priority: 'high', metadata: { action_type: 'reconcile' } },
  { id: '2', title: 'Overdue Invoice', description: 'Invoice #FAL-042 for Acme Corp (SAR 12,000) is 5 days overdue.', category: 'accounting', priority: 'high', metadata: { action_type: 'invoice_chase' } },
  { id: '3', title: 'Runway Anomaly', description: 'Your infrastructure spend jumped 22% this month due to AWS data transfer fees.', category: 'runway', priority: 'medium', metadata: { action_type: 'review_spend' } }
];

function NavItem({ icon, label, active = false, onClick }: {
  icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-neutral-900 text-white shadow-sm'
          : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
        className: `w-4 h-4 ${active ? 'text-white' : 'text-neutral-400'}`,
      })}
      {label}
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [actions, setActions] = useState<AIAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchActions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setActions(SEED_FALLBACK);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('ai_actions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setActions(data);
      } else {
        // Fallback to seeds if live table is currently empty
        setActions(SEED_FALLBACK);
      }
    } catch (e) {
      setActions(SEED_FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = async (id: string, nextStatus: 'completed' | 'dismissed') => {
    setProcessingId(id);
    
    // Try to update DB if it's a real live record
    if (!['1', '2', '3'].includes(id)) {
      await supabase
        .from('ai_actions')
        .update({ status: nextStatus })
        .eq('id', id);
    }

    setActions(prev => prev.filter(item => item.id !== id));
    setProcessingId(null);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* ── Sidebar ── */}
      <aside className="w-60 bg-white border-r border-neutral-100 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-5 border-b border-neutral-100">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <Image src="/logo.png" alt="Fulcrum" width={26} height={26} className="w-6 h-6" />
            <span className="font-semibold text-base tracking-tight text-neutral-900">Fulcrum</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-0.5">
          <NavItem icon={<Activity />}     label="Live Feed" active />
          <NavItem icon={<CreditCard />}   label="Transactions" onClick={() => router.push('/transactions')} />
          <NavItem icon={<FileText />}     label="Reports"      onClick={() => router.push('/reports')} />
          <NavItem icon={<Zap />}          label="Automations"  onClick={() => router.push('/automations')} />
          <NavItem icon={<MessageSquare />}label="Ask Fulcrum"   onClick={() => router.push('/chat')} />
        </nav>
        <div className="p-4 border-t border-neutral-100">
          <NavItem icon={<SettingsIcon />} label="Settings" onClick={() => router.push('/settings')} />
        </div>
      </aside>

      {/* ── Main Content Container ── */}
      <main className="flex-1 md:ml-60 min-h-screen flex flex-col">
        {/* Top Header */}
        <div className="bg-white border-b border-neutral-100 px-8 py-5 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <p className="text-xs font-medium text-neutral-500">Books are audit-ready</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-white text-xs font-semibold">
              ME
            </div>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="max-w-5xl w-full mx-auto px-8 py-8 space-y-6">
          
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Runway */}
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-2">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Runway</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-semibold text-neutral-900">99.9 Months</p>
                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +2mo
                </span>
              </div>
            </div>

            {/* Cash on Hand */}
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-2">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Cash on Hand</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-semibold text-neutral-900">USD 0.00</p>
                <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> -1.2%
                </span>
              </div>
            </div>

            {/* Burn Rate */}
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-2">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Burn Rate</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-semibold text-neutral-900">USD 0.00</p>
                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Stable
                </span>
              </div>
            </div>
          </div>

          {/* Action Inbox Box Container */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-neutral-900" />
                <h2 className="text-sm font-semibold text-neutral-900">Action Inbox</h2>
              </div>
              <span className="text-xs font-medium text-neutral-400 bg-neutral-50 border border-neutral-200 px-2.5 py-1 rounded-full">
                {actions.length} Task{actions.length !== 1 && 's'} Pending
              </span>
            </div>

            {loading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
              </div>
            ) : actions.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center mx-auto">
                  <Check className="w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-sm font-medium text-neutral-900">Inbox Completely Clear</p>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  Fulcrum AI is running in the background monitoring financial anomalies.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {actions.map((action) => (
                  <div key={action.id} className="p-5 flex items-start gap-4 hover:bg-neutral-50/50 transition-all group">
                    <div className={`mt-0.5 p-2 rounded-lg border flex-shrink-0 ${
                      action.priority === 'high' 
                        ? 'bg-red-50 border-red-100 text-red-600' 
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                    }`}>
                      <AlertCircle className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-neutral-900">{action.title}</p>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 px-1.5 py-0.5 bg-neutral-100 rounded">
                          {action.category}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed">{action.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                      {action.metadata?.action_type === 'reconcile' && (
                        <button 
                          disabled={!!processingId}
                          onClick={() => handleAction(action.id, 'completed')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-all"
                        >
                          Reconcile
                        </button>
                      )}

                      {action.metadata?.action_type === 'invoice_chase' && (
                        <button 
                          disabled={!!processingId}
                          onClick={() => handleAction(action.id, 'completed')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-all"
                        >
                          Chase Invoice
                        </button>
                      )}

                      {action.metadata?.action_type === 'review_spend' && (
                        <button 
                          disabled={!!processingId}
                          onClick={() => handleAction(action.id, 'completed')}
                          className="flex items-center gap-1 px-3 py-1.5 border border-neutral-200 bg-white text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-all"
                        >
                          Review Details
                        </button>
                      )}

                      <button
                        disabled={!!processingId}
                        onClick={() => handleAction(action.id, 'dismissed')}
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}