'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, CreditCard, Activity, FileText, MessageSquare, 
  CheckCircle2, AlertCircle, RefreshCw, Power, Shield, XCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  
  // Real State
  const [preferences, setPreferences] = useState({
    user_id: '',
    zoho_connected: false,
    stripe_connected: false,
    pref_auto_chase: false,
    pref_expense_cat: false,
    pref_payroll_sync: false,
    last_synced: 'Never'
  });

  // 1. Fetch Settings on Load
  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         router.push('/login');
         return;
      }

      try {
        const res = await fetch(`http://localhost:8000/settings/?user_id=${user.id}`);
        const data = await res.json();
        
        if (data) {
           setPreferences({ ...data, user_id: user.id });
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [router]);

  // 2. Handle Sync Action
  const handleSync = async (provider: string) => {
    setSyncing(provider);
    try {
        // Call your actual sync endpoint
        await fetch(`http://localhost:8000/dashboard/sync?user_id=${preferences.user_id}`, { method: 'POST' });
        
        // Update 'last synced' UI mock
        setPreferences(prev => ({ ...prev, last_synced: 'Just now' }));
    } catch (e) {
        alert("Sync failed");
    } finally {
        setTimeout(() => setSyncing(null), 1500);
    }
  };

  // 3. Handle Toggles (Auto-Save)
  const togglePref = async (key: string) => {
    // Optimistic Update
    const newValue = !preferences[key as keyof typeof preferences];
    setPreferences(prev => ({ ...prev, [key]: newValue }));

    try {
        await fetch('http://localhost:8000/settings/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: preferences.user_id,
                [key]: newValue
            })
        });
    } catch (e) {
        console.error("Save failed", e);
        // Revert on failure
        setPreferences(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  // 4. Handle Sign Out
  const handleSignOut = async () => {
      await supabase.auth.signOut();
      router.push('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading settings...</div>;

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
          <NavItem icon={<FileText />} label="Reports" onClick={() => router.push('/reports')} />
          <NavItem icon={<MessageSquare />} label="Ask Fulcrum" onClick={() => router.push('/chat')} />
          <div className="pt-4 mt-4 border-t border-slate-100">
             <NavItem icon={<Settings />} label="Settings" active />
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-8">
        
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings & Integrations</h1>
            <p className="text-slate-500 text-sm">Manage your data sources and AI preferences.</p>
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ZOHO BOOKS */}
            <IntegrationCard 
               name="Zoho Books"
               type="Accounting Source"
               initial="Z"
               color="bg-blue-600"
               connected={preferences.zoho_connected}
               lastSynced={preferences.last_synced}
               syncing={syncing === 'zoho'}
               onSync={() => handleSync('zoho')}
            />

            {/* STRIPE */}
            <IntegrationCard 
               name="Stripe"
               type="Payment Gateway"
               initial="S"
               color="bg-indigo-600"
               connected={preferences.stripe_connected}
               lastSynced={preferences.last_synced}
               syncing={syncing === 'stripe'}
               onSync={() => handleSync('stripe')}
            />

            {/* BANK ACCOUNT (Static for now) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-48 opacity-75">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Bank Feed</h3>
                    <p className="text-xs text-slate-500">Direct Connection</p>
                  </div>
                </div>
                <button className="text-xs font-semibold text-blue-600 hover:underline">Connect</button>
              </div>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
                 <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                 <p className="text-xs text-slate-500 leading-relaxed">Securely connect your primary business account via Plaid.</p>
              </div>
            </div>

          </div>

          {/* AI Configuration */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> AI Accountant Preferences
                </h3>
             </div>
             <div className="p-6 space-y-6">
                
                <PreferenceRow 
                    label="Auto-Chase Invoices" 
                    desc="Allow AI to draft emails for overdue payments automatically." 
                    active={preferences.pref_auto_chase}
                    onToggle={() => togglePref('pref_auto_chase')}
                />

                <PreferenceRow 
                    label="Expense Categorization" 
                    desc="Auto-tag transactions based on description history." 
                    active={preferences.pref_expense_cat}
                    onToggle={() => togglePref('pref_expense_cat')}
                />

                <PreferenceRow 
                    label="Payroll Sync" 
                    desc="Sync employee data from Deel/Gusto." 
                    active={preferences.pref_payroll_sync}
                    onToggle={() => togglePref('pref_payroll_sync')}
                />

             </div>
          </div>
          
          <div className="pt-8 border-t border-slate-200">
             <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-red-600 font-medium hover:text-red-700">
                <Power className="w-4 h-4" /> Sign Out
             </button>
          </div>

        </div>
      </main>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function NavItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>{React.cloneElement(icon, { className: `w-4 h-4 ${active ? 'text-white' : ''}` })}{label}</button>
  );
}

function IntegrationCard({ name, type, initial, color, connected, lastSynced, syncing, onSync }: any) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-white font-bold`}>{initial}</div>
              <div>
                <h3 className="font-semibold text-slate-900">{name}</h3>
                <p className="text-xs text-slate-500">{type}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {connected ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {connected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          <div className="mt-4">
             <div className="text-xs text-slate-400 mb-2">Last synced: {lastSynced}</div>
             <button onClick={onSync} disabled={!connected} className="w-full py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 disabled:opacity-50">
               <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
               {syncing ? 'Syncing...' : 'Sync Now'}
             </button>
          </div>
        </div>
    );
}

function PreferenceRow({ label, desc, active, onToggle }: any) {
    return (
        <div className="flex items-center justify-between">
           <div>
              <div className="text-sm font-medium text-slate-900">{label}</div>
              <div className="text-xs text-slate-500">{desc}</div>
           </div>
           <button onClick={onToggle} className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${active ? 'left-5' : 'left-0.5'}`}></div>
           </button>
        </div>
    );
}