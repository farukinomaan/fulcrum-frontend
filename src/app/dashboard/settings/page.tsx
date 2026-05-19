//Settings

'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('workspaces')
          .select('*')
          .eq('owner_id', user.id)
          .single();
        setWorkspaceData(data);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleUpdate = async (column: string, value: any) => {
    const { error } = await supabase
      .from('workspaces')
      .update({ [column]: value })
      .eq('owner_id', workspaceData.owner_id);
    
    if (!error) alert(`${column} updated successfully!`);
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-8">
        {/* Accounting Section */}
        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🏦 Accounting: {workspaceData?.accounting_provider}
          </h2>
          <div className="grid gap-4">
            <input 
              type="password" 
              placeholder="Update Client Secret" 
              className="w-full p-3 border rounded-xl"
              onBlur={(e) => handleUpdate('accounting_secret', e.target.value)} 
            />
          </div>
        </section>

        {/* Banking Section */}
        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            💳 Banking: {workspaceData?.banking_provider}
          </h2>
          <button className="px-6 py-2 bg-black text-white rounded-lg font-medium">
            Reconnect Bank Account
          </button>
        </section>

        {/* Communication Channels */}
        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold mb-4">📢 Communication Channels</h2>
          <div className="flex gap-2">
            {workspaceData?.channels?.map((channel: string) => (
              <span key={channel} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                {channel}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}