'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AutomationsPage() {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [rules, setRules] = useState<any[]>([]);
    const supabase = createClient();

    // Fetch existing rules
    useEffect(() => {
        const fetchRules = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if(!user) return;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/automation/list?user_id=${user.id}`);
            const data = await res.json();
            setRules(data);
        };
        fetchRules();
    }, []);

    const handleCreate = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/automation/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user?.id, prompt })
        });

        setLoading(false);
        window.location.reload(); 
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">AI Automations</h1>
            
            {/* INPUT SECTION */}
            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm mb-8">
                <label className="block font-bold mb-2">Describe your automation</label>
                <textarea 
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="e.g., Chase any invoice over 1000 SAR that is 5 days late with a polite WhatsApp message."
                    className="w-full p-4 border rounded-xl h-32 mb-4 bg-gray-50 focus:bg-white transition-colors"
                />
                <button 
                    onClick={handleCreate}
                    disabled={loading || !prompt}
                    className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50"
                >
                    {loading ? "Thinking..." : "Create Automation"}
                </button>
            </div>

            {/* LIST SECTION */}
            <div className="space-y-4">
                {rules.map(rule => (
                    <div key={rule.id} className="p-6 bg-white border rounded-xl flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">{rule.name}</h3>
                            <p className="text-gray-500 text-sm">"{rule.prompt}"</p>
                            <div className="mt-2 flex gap-2">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    Trigger: {rule.logic.trigger}
                                </span>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    Action: {rule.logic.action}
                                </span>
                            </div>
                        </div>
                        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}