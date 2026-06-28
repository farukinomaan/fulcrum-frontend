'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Check, X, AlertCircle, RefreshCw, 
  ArrowUpRight, Landmark, Zap, Sparkles, Loader2 
} from 'lucide-react';

interface AIAction {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  metadata: any;
}

export default function LiveFeedPage() {
  const supabase = createClient();
  const [actions, setActions] = useState<AIAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch proactive items
  const fetchActions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('ai_actions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setActions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchActions();
  }, []);

  // Handle Action Completion / Dismissal
  const handleAction = async (id: string, nextStatus: 'completed' | 'dismissed') => {
    setProcessingId(id);
    
    // 1. Update status in DB
    await supabase
      .from('ai_actions')
      .update({ status: nextStatus })
      .eq('id', id);

    // 2. Optimistically update local state for crisp zero-latency UX
    setActions(prev => prev.filter(item => item.id !== id));
    setProcessingId(null);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* --- Existing Top Metrics (Runway, Cash, Burn Rate) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Your current minimalist metric cards go here */}
      </div>

      {/* --- Agentic Action Box --- */}
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
          /* Clean Zero State */
          <div className="p-16 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center mx-auto">
              <Check className="w-4 h-4 text-neutral-900" />
            </div>
            <p className="text-sm font-medium text-neutral-900">Inbox Completely Clear</p>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Fulcrum AI is running in the background monitoring financial anomalies.
            </p>
          </div>
        ) : (
          /* Interactive Feed Loop */
          <div className="divide-y divide-neutral-100">
            {actions.map((action) => (
              <div key={action.id} className="p-5 flex items-start gap-4 hover:bg-neutral-50/50 transition-all group">
                {/* Priority / Category Pill */}
                <div className={`mt-0.5 p-2 rounded-lg border flex-shrink-0 ${
                  action.priority === 'high' 
                    ? 'bg-red-50 border-red-100 text-red-600' 
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                }`}>
                  <AlertCircle className="w-4 h-4" />
                </div>

                {/* Contextual Body */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900">{action.title}</p>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 px-1.5 py-0.5 bg-neutral-100 rounded">
                      {action.category}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">{action.description}</p>
                </div>

                {/* Action Engine Triggers */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                  {action.metadata?.action_type === 'reconcile' && (
                    <button 
                      disabled={!!processingId}
                      onClick={() => handleAction(action.id, 'completed')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-all"
                    >
                      <Landmark className="w-3 h-3" /> Reconcile
                    </button>
                  )}

                  {action.metadata?.action_type === 'invoice_chase' && (
                    <button 
                      disabled={!!processingId}
                      onClick={() => handleAction(action.id, 'completed')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-all"
                    >
                      <Zap className="w-3 h-3" /> Chase Invoice
                    </button>
                  )}

                  {action.metadata?.action_type === 'review_spend' && (
                    <button 
                      disabled={!!processingId}
                      onClick={() => handleAction(action.id, 'completed')}
                      className="flex items-center gap-1 px-3 py-1.5 border border-neutral-200 bg-white text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-all"
                    >
                      <ArrowUpRight className="w-3 h-3" /> Review Details
                    </button>
                  )}

                  {/* Universal Dismiss Trigger */}
                  <button
                    disabled={!!processingId}
                    onClick={() => handleAction(action.id, 'dismissed')}
                    className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-all"
                    title="Dismiss alert"
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
  );
}