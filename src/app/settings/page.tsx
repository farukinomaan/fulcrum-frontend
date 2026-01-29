'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image'; 
import { 
  User, CreditCard, Bell, Shield, LogOut, 
  CheckCircle2, AlertCircle, Save, Activity, FileText, MessageSquare, Settings as SettingsIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Settings State
  const [formData, setFormData] = useState({
    business_name: '',
    currency: 'SAR',
    language: 'en'
  });

  const [providers, setProviders] = useState({
    accounting: 'Not Connected',
    banking: 'Not Connected'
  });

  // 1. Fetch Data on Load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);

        // Fetch Settings from DB
        const { data: settings, error } = await supabase
          .from('settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (settings) {
          setFormData({
            business_name: settings.business_name || '',
            currency: settings.currency || 'SAR',
            language: settings.language || 'en'
          });
          setProviders({
            accounting: settings.accounting_provider || 'Not Connected',
            banking: settings.banking_provider || 'Not Connected'
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        // FIX: This ensures the loading spinner always stops!
        setLoading(false);
      }
    };

    fetchData();
  }, [router, supabase]);

  // 2. Save Handler
  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          user_id: user.id,
          ...formData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      alert("Settings saved successfully!");
      // Force reload to update currency across the app
      window.location.reload();
    } catch (error: any) {
      alert("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Helper to Navigation (Matches Dashboard)
  const navigateTo = (path: string) => router.push(path);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex fixed h-full z-10">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('/')}>
            <Image src="/logo.png" alt="Fulcrum Logo" width={32} height={32} className="w-8 h-8" />
            <span className="font-semibold text-lg tracking-tight">Fulcrum</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavItem icon={<Activity />} label="Live Feed" onClick={() => navigateTo('/')} />
          <NavItem icon={<CreditCard />} label="Transactions" onClick={() => navigateTo('/?view=transactions')} />
          <NavItem icon={<FileText />} label="Reports" onClick={() => navigateTo('/reports')} />
          <NavItem icon={<MessageSquare />} label="Ask Fulcrum" onClick={() => navigateTo('/chat')} />
        </nav>
        <div className="pt-4 mt-4 border-t border-slate-100 p-4">
          <NavItem icon={<SettingsIcon />} label="Settings" active />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900 mb-8">Settings</h1>

          <div className="space-y-6">
            
            {/* 1. Connected Services */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Connected Services
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-medium">Accounting</div>
                    <div className="font-semibold text-slate-900">{providers.accounting}</div>
                  </div>
                  <CheckCircle2 className={`w-5 h-5 ${providers.accounting !== 'Not Connected' ? 'text-emerald-500' : 'text-slate-300'}`} />
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-medium">Banking</div>
                    <div className="font-semibold text-slate-900">{providers.banking}</div>
                  </div>
                  <CheckCircle2 className={`w-5 h-5 ${providers.banking !== 'Not Connected' ? 'text-emerald-500' : 'text-slate-300'}`} />
                </div>
              </div>
            </div>

            {/* 2. General Preferences */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> General Preferences
              </h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                  <input 
                    type="text" 
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                    placeholder="Enter your business name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                    <select 
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                    >
                      <option value="SAR">SAR (Saudi Riyal)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                      <option value="AED">AED (UAE Dirham)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
                    <select 
                      value={formData.language}
                      onChange={(e) => setFormData({...formData, language: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                    >
                      <option value="en">English</option>
                      <option value="ar">Arabic (Coming Soon)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>

            {/* 3. Account Actions */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-semibold text-red-600 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Danger Zone
              </h2>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Sign out of your account on this device.</div>
                <button 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

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