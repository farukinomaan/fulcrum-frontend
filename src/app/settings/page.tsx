// Code Refactoring needed in this file 



'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import {
  User, CreditCard, Bell, Shield, LogOut,
  CheckCircle2, AlertCircle, Activity, FileText,
  MessageSquare, Settings as SettingsIcon, ChevronRight,
  Loader2, RefreshCw, XCircle, Zap, Check, Plug, Unplug, BookOpen, Wallet
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string | null;
  category: 'accounting' | 'banking';
  available: boolean;
}

// Static Data
const ACCOUNTING: Integration[] = [
  { id: 'zoho',        name: 'Zoho Books', description: 'Two-way sync of invoices & expenses', logo: 'https://www.google.com/s2/favicons?domain=zoho.com&sz=64',              category: 'accounting', available: true  },
  { id: 'xero',        name: 'Xero',       description: 'Two-way sync of invoices & expenses',logo: 'https://www.google.com/s2/favicons?domain=xero.com&sz=64',              category: 'accounting', available: true  },
  { id: 'quickbooks',  name: 'QuickBooks', description: 'Two-way sync of invoices & expenses',                         logo:'https://www.google.com/s2/favicons?domain=intuit.com&sz=64', category: 'accounting', available: true },
];

const BANKING: Integration[] = [
  { id: 'stripe',   name: 'Stripe',   description: 'Payments, payouts & reconciliation', logo: 'https://www.google.com/s2/favicons?domain=stripe.com&sz=64',   category: 'banking', available: true  },
  { id: 'razorpay', name: 'Razorpay', description: 'Coming soon',                        logo: 'https://www.google.com/s2/favicons?domain=razorpay.com&sz=64', category: 'banking', available: false },
  { id: 'paypal',   name: 'PayPal',   description: 'Coming soon',                        logo: 'https://www.google.com/s2/favicons?domain=paypal.com&sz=64',   category: 'banking', available: false },
];

// Helpers 
function getIntegrationByProviderName(name: string | null, list: Integration[]): Integration | null {
  if (!name || name === 'Not Connected' || name === 'None') return null;
  return list.find(i => i.name.toLowerCase() === name.toLowerCase()) ?? null;
}

function getLogoForProvider(name: string | null): string | null {
  const all = [...ACCOUNTING, ...BANKING];
  const match = all.find(i => i.name.toLowerCase() === (name ?? '').toLowerCase());
  return match?.logo ?? null;
}

// Sub-components 

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

// Section card wrapper
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, description, icon: Icon }: {
  title: string; description?: string; icon?: any;
}) {
  return (
    <div className="px-6 py-4 border-b border-neutral-100 flex items-start gap-3">
      {Icon && (
        <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-3.5 h-3.5 text-neutral-600" />
        </div>
      )}
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
        {description && <p className="text-xs text-neutral-400 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

// Integration row
function IntegrationRow({
  integration,
  connected,
  onConnect,
  onDisconnect,
  loading,
}: {
  integration: Integration;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-4 px-6 border-b border-neutral-50 last:border-0">
      {/* Logo */}
      <div className="w-9 h-9 rounded-lg border border-neutral-100 bg-neutral-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {integration.logo ? (
          <img
            src={integration.logo}
            alt={integration.name}
            className="w-6 h-6 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <Plug className="w-4 h-4 text-neutral-300" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-neutral-900">{integration.name}</p>
          {!integration.available && (
            <span className="text-[10px] font-medium text-neutral-400 border border-neutral-200 px-1.5 py-0.5 rounded-full">
              Soon
            </span>
          )}
          {connected && (
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Connected
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-400 mt-0.5 truncate">{integration.description}</p>
      </div>

      {/* Action */}
      <div className="flex-shrink-0">
        {loading ? (
          <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
        ) : connected ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onConnect}
              className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300 px-3 py-1.5 rounded-lg transition-all hover:bg-neutral-50"
            >
              <RefreshCw className="w-3 h-3" /> Reconnect
            </button>
            <button
              onClick={onDisconnect}
              className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 border border-red-100 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all hover:bg-red-50"
            >
              <Unplug className="w-3 h-3" /> Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={onConnect}
            disabled={!integration.available}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all border ${
              integration.available
                ? 'text-neutral-900 border-neutral-900 hover:bg-neutral-900 hover:text-white'
                : 'text-neutral-300 border-neutral-200 cursor-not-allowed'
            }`}
          >
            <Plug className="w-3 h-3" />
            {integration.available ? 'Connect' : 'Coming soon'}
          </button>
        )}
      </div>
    </div>
  );
}

// Input component
function FormInput({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/8 transition-all"
      />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/8 transition-all cursor-pointer appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23737373' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.875rem center',
          paddingRight: '2.5rem',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// Toast
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 ${
      type === 'success'
        ? 'bg-white border-emerald-200 text-neutral-900'
        : 'bg-white border-red-200 text-neutral-900'
    }`}>
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        : <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      }
      {message}
    </div>
  );
}

// Main Settings Content
function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'integrations' | 'account'>('integrations');

  const [formData, setFormData] = useState({
    business_name: '',
    full_name: '',
    currency: 'USD',
    language: 'en',
  });

  const [connectedProviders, setConnectedProviders] = useState<{
    accounting: string | null;
    banking: string | null;
    zoho_connected: boolean;
    stripe_connected: boolean;
  }>({
    accounting: null,
    banking: null,
    zoho_connected: false,
    stripe_connected: false,
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // Load state (handle OAuth callbacks too)
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      // Fetch from the View instead of the raw settings table
      const { data: settings } = await supabase
        .from('user_integrations_status') 
        .select('*')
        .eq('user_id', user.id)
        .single();

      const urlStatus = searchParams.get('status');
      const urlProvider = searchParams.get('provider');

      let acc = settings?.accounting_provider ?? null;
      let bank = settings?.banking_provider ?? null;

      // Read the dynamic booleans calculated by the DB
      let zoho = settings?.zoho_is_active ?? false;
      let quickbooks = settings?.quickbooks_is_active ?? false;
      let xero = settings?.xero_is_active ?? false;
      let freshbooks = settings?.freshbooks_is_active ?? false;
      let stripe = settings?.stripe_is_active ?? false;

      // The universal Ghost Guards
      if (acc === 'Zoho Books' && !zoho) acc = null;
      if (acc === 'QuickBooks' && !quickbooks) acc = null;
      if (acc === 'Xero' && !xero) acc = null;
      if (acc === 'FreshBooks' && !freshbooks) acc = null;
      if (bank === 'Stripe' && !stripe) bank = null;

      // OAuth callback handling
      if (urlStatus === 'connected' && urlProvider) {
        let resolved = decodeURIComponent(urlProvider);
        if (resolved.toLowerCase().replace(/\s+/g, '') === 'zohobooks') resolved = 'Zoho Books';
        acc = resolved;
        
        // Just update the string, let the SQL view handle the true/false logic
        await supabase.from('settings').upsert({
          user_id: user.id,
          accounting_provider: resolved,
        }, { onConflict: 'user_id' });
        
        showToast(`${resolved} connected successfully`, 'success');
      } else if (urlStatus === 'connected_stripe') {
        bank = 'Stripe';
        
        await supabase.from('settings').upsert({
          user_id: user.id,
          banking_provider: 'Stripe',
        }, { onConflict: 'user_id' });
        
        showToast('Stripe connected successfully', 'success');
      }

      if (settings) {
        setFormData({
          business_name: settings.business_name || '',
          full_name: settings.full_name || '',
          currency: settings.currency || 'USD',
          language: settings.language || 'en',
        });
      }

      setConnectedProviders({ accounting: acc, banking: bank, zoho_connected: zoho, stripe_connected: stripe });
      if (urlStatus) router.replace('/settings');
      setLoading(false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save general settings 
  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('settings').upsert({
        user_id: user.id,
        business_name: formData.business_name,
        full_name: formData.full_name,
        currency: formData.currency,
        language: formData.language,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      showToast('Settings saved', 'success');
    } catch (e: any) {
      showToast('Failed to save: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Connect OAuth 
  const handleConnect = async (integration: Integration) => {
    if (!integration.available) return;
    setConnectingId(integration.id);
    try {
      let slug = integration.id;
      if (slug === 'zoho') slug = 'zoho';
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/auth/${slug}/login?user_id=${user.id}&return_to=/settings`
      );
      if (!res.ok) throw new Error('Not implemented');
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      showToast(`${integration.name} integration is coming soon`, 'error');
      setConnectingId(null);
    }
  };

  //  Disconnect 
  const handleDisconnect = async (integration: Integration) => {
    const isAccounting = integration.category === 'accounting';
    const updates: any = { user_id: user.id };

    if (isAccounting) {
      updates.accounting_provider = null;
      // Destroy the token to ensure the dynamic view returns 'false'
      if (integration.id === 'zoho') await supabase.from('zoho_tokens').delete().eq('user_id', user.id);
      if (integration.id === 'quickbooks') await supabase.from('quickbooks_tokens').delete().eq('user_id', user.id);
      if (integration.id === 'xero') await supabase.from('xero_tokens').delete().eq('user_id', user.id);
      if (integration.id === 'freshbooks') await supabase.from('freshbooks_tokens').delete().eq('user_id', user.id);
    } else {
      updates.banking_provider = null;
      if (integration.id === 'stripe') await supabase.from('integrations').delete().match({ user_id: user.id, provider: 'Stripe' });
    }

    // Clear the active provider name from settings
    await supabase.from('settings').upsert(updates, { onConflict: 'user_id' });
    
    setConnectedProviders(prev => ({
      ...prev,
      accounting: isAccounting ? null : prev.accounting,
      banking: !isAccounting ? null : prev.banking,
    }));
    
    showToast(`${integration.name} disconnected`, 'success');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navigateTo = (path: string) => router.push(path);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
      </div>
    );
  }

  const TABS = [
    { id: 'integrations' as const, label: 'Integrations', icon: Plug },
    { id: 'general' as const,      label: 'General',      icon: SettingsIcon },
    { id: 'account' as const,      label: 'Account',      icon: User },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex">

      {/* ── Sidebar ── */}
      <aside className="w-60 bg-white border-r border-neutral-100 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-5 border-b border-neutral-100">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigateTo('/')}>
            <Image src="/logo.png" alt="Fulcrum" width={26} height={26} className="w-6 h-6" />
            <span className="font-semibold text-base tracking-tight text-neutral-900">Fulcrum</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-0.5">
          <NavItem icon={<Activity />}     label="Live Feed"    onClick={() => navigateTo('/')} />
          <NavItem icon={<CreditCard />}   label="Transactions" onClick={() => navigateTo('/?view=transactions')} />
          <NavItem icon={<FileText />}     label="Reports"      onClick={() => navigateTo('/reports')} />
          <NavItem icon={<Zap />} label="Automations" onClick={() => router.push('/automations')} />
          <NavItem icon={<MessageSquare />}label="Ask Fulcrum"  onClick={() => navigateTo('/chat')} />
        </nav>
        <div className="p-4 border-t border-neutral-100">
          <NavItem icon={<SettingsIcon />} label="Settings" active />
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 md:ml-60 min-h-screen">
        
        {/* Page header */}
        <div className="bg-white border-b border-neutral-100 px-8 py-5 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">Settings</h1>
              <p className="text-xs text-neutral-400 mt-0.5">Manage your workspace preferences and integrations</p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-8 py-8">

          {/* ── Tab Nav ── */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl mb-8 w-fit">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ══ INTEGRATIONS TAB ══ */}
          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Summary bar */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Accounting', value: connectedProviders.accounting, logo: getLogoForProvider(connectedProviders.accounting), icon: BookOpen },
                  { label: 'Banking', value: connectedProviders.banking, logo: getLogoForProvider(connectedProviders.banking), icon: Wallet },
                ].map(item => {
                  const connected = !!item.value;
                  return (
                    <div key={item.label} className={`bg-white rounded-xl border p-4 flex items-center gap-3 ${connected ? 'border-emerald-100' : 'border-neutral-200'}`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${connected ? 'bg-emerald-50' : 'bg-neutral-100'}`}>
                        {connected && item.logo ? (
                          <img src={item.logo} alt={item.value!} className="w-5 h-5 object-contain" />
                        ) : (
                          <item.icon className={`w-4 h-4 ${connected ? 'text-emerald-600' : 'text-neutral-400'}`} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{item.label}</p>
                        <p className={`text-sm font-medium truncate ${connected ? 'text-neutral-900' : 'text-neutral-400'}`}>
                          {item.value || 'Not connected'}
                        </p>
                      </div>
                      <div className="ml-auto flex-shrink-0">
                        {connected
                          ? <span className="w-2 h-2 rounded-full bg-emerald-500 block" />
                          : <span className="w-2 h-2 rounded-full bg-neutral-300 block" />
                        }
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Accounting integrations */}
              <Card>
                <CardHeader
                  title="Accounting Software"
                  description="Connect your accounting platform to sync invoices, bills, and expenses automatically."
                  icon={BookOpen}
                />
                <div className="divide-y divide-neutral-50">
                  {ACCOUNTING.map(integration => (
                    <IntegrationRow
                      key={integration.id}
                      integration={integration}
                      connected={connectedProviders.accounting === integration.name}
                      onConnect={() => handleConnect(integration)}
                      onDisconnect={() => handleDisconnect(integration)}
                      loading={connectingId === integration.id}
                    />
                  ))}
                </div>
              </Card>

              {/* Banking integrations */}
              <Card>
                <CardHeader
                  title="Banking & Payments"
                  description="Connect payment processors for automatic transaction reconciliation."
                  icon={Wallet}
                />
                <div className="divide-y divide-neutral-50">
                  {BANKING.map(integration => (
                    <IntegrationRow
                      key={integration.id}
                      integration={integration}
                      connected={connectedProviders.banking === integration.name}
                      onConnect={() => handleConnect(integration)}
                      onDisconnect={() => handleDisconnect(integration)}
                      loading={connectingId === integration.id}
                    />
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ══ GENERAL TAB ══ */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card>
                <CardHeader title="Business Details" description="Update your company information" icon={SettingsIcon} />
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormInput
                      label="Full Name"
                      value={formData.full_name}
                      onChange={v => setFormData(p => ({ ...p, full_name: v }))}
                      placeholder="Jane Smith"
                    />
                    <FormInput
                      label="Business Name"
                      value={formData.business_name}
                      onChange={v => setFormData(p => ({ ...p, business_name: v }))}
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormSelect
                      label="Reporting Currency"
                      value={formData.currency}
                      onChange={v => setFormData(p => ({ ...p, currency: v }))}
                      options={[
                        { value: 'USD', label: 'USD — US Dollar' },
                        { value: 'EUR', label: 'EUR — Euro' },
                        { value: 'GBP', label: 'GBP — British Pound' },
                        { value: 'SAR', label: 'SAR — Saudi Riyal' },
                        { value: 'AED', label: 'AED — UAE Dirham' },
                        { value: 'INR', label: 'INR — Indian Rupee' },
                      ]}
                    />
                    <FormSelect
                      label="Language"
                      value={formData.language}
                      onChange={v => setFormData(p => ({ ...p, language: v }))}
                      options={[
                        { value: 'en', label: 'English' },
                        { value: 'ar', label: 'Arabic (Coming soon)' },
                      ]}
                    />
                  </div>
                </div>
                <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-neutral-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-neutral-800 active:scale-[.98] transition-all disabled:opacity-50 shadow-sm"
                  >
                    {saving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      : <><Check className="w-4 h-4" /> Save Changes</>
                    }
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* ══ ACCOUNT TAB ══ */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

              {/* Profile info card */}
              <Card>
                <CardHeader title="Account" description="Your login and profile information" icon={User} />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-base">
                        {(formData.full_name || user?.email || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        {formData.full_name || 'No name set'}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">{user?.email}</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-5 border-t border-neutral-100 grid grid-cols-2 gap-3 text-xs text-neutral-500">
                    <div>
                      <p className="font-semibold text-neutral-400 uppercase tracking-wide mb-1">Account ID</p>
                      <p className="font-mono text-neutral-600 truncate">{user?.id?.slice(0, 16)}…</p>
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-400 uppercase tracking-wide mb-1">Member since</p>
                      <p className="text-neutral-600">{new Date(user?.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Danger zone */}
              <Card>
                <div className="px-6 py-4 border-b border-red-50 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-red-600">Danger Zone</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Irreversible and destructive actions</p>
                  </div>
                </div>
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">Sign out</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Sign out of your account on this device.</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 px-4 py-2 rounded-lg transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </Card>
            </div>
          )}

        </div>
      </main>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

// ─── Page export (Suspense for useSearchParams) ───────────────────────────────
export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}