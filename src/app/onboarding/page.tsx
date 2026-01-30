'use client';

import { useState, useEffect, Suspense, ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { ChevronRight, CheckCircle2, Building2, User, Phone, Globe, Wallet, MessageSquare } from 'lucide-react';

// --- TYPESCRIPT INTERFACES ---
interface ServiceItem {
    id: string;
    name: string;
    icon?: ReactNode;
}

// --- STATIC DATA ---
const accountingOptions: ServiceItem[] = [
    { id: 'zoho', name: 'Zoho Books' },
    { id: 'xero', name: 'Xero' },
    { id: 'quickbooks', name: 'QuickBooks' },
    { id: 'freshbooks', name: 'FreshBooks' },
    { id: 'none', name: 'None / Spreadsheet' }
];

const bankingOptions: ServiceItem[] = [
    { id: 'stripe', name: 'Stripe' },
    { id: 'razorpay', name: 'Razorpay' },
    { id: 'paypal', name: 'PayPal' },
    { id: 'square', name: 'Square' }
];

const channelServices: ServiceItem[] = [
    { id: 'whatsapp', name: 'WhatsApp', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg> },
];

// Common country codes
const countryCodes = [
    { code: '+1', country: 'US/CA' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'IN' },
    { code: '+966', country: 'SA' },
    { code: '+971', country: 'UAE' },
    { code: '+61', country: 'AU' },
    { code: '+49', country: 'DE' },
];

function OnboardingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState<string | null>(null);

    // Form Data for Step 1
    const [formData, setFormData] = useState({
        full_name: '',
        country_code: '+1',
        phone_number: '',
        company_name: '',
        company_address: '',
        currency: 'USD'
    });

    // Integration State
    const [selectedServices, setSelectedServices] = useState<{
        accounting: string | null;
        banking: string | null;
        channels: string[];
    }>({
        accounting: null,
        banking: null,
        channels: [],
    });

    // 1. Fetch saved progress on load
    useEffect(() => {
        const fetchProgress = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: settings } = await supabase
                .from('settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (settings) {
                setFormData(prev => ({
                    ...prev,
                    full_name: settings.full_name || '',
                    company_name: settings.business_name || '',
                    company_address: settings.company_address || '',
                    currency: settings.currency || 'USD',
                }));

                const updates: any = {};
                
                // If business name exists, move to Step 2
                if (settings.business_name) setStep(2);

                if (settings.accounting_provider && settings.accounting_provider !== 'Not Connected') {
                    updates.accounting = settings.accounting_provider;
                }
                if (settings.banking_provider && settings.banking_provider !== 'Not Connected') {
                    updates.banking = settings.banking_provider;
                }
                if (settings.channels && settings.channels.length > 0) {
                    updates.channels = settings.channels;
                }

                if (Object.keys(updates).length > 0) {
                    setSelectedServices(prev => ({ ...prev, ...updates }));
                }
                
                // Check if returning from OAuth
                const status = searchParams.get('status');
                if(!status && settings.business_name) setStep(2);
            }
        };

        fetchProgress();
    }, [supabase, searchParams]);

    // 2. Handle OAuth Callbacks
    useEffect(() => {
        const status = searchParams.get('status');
        const provider = searchParams.get('provider');

        if (status === 'connected') {
            const connectedProvider = provider ? decodeURIComponent(provider) : 'Connected Service';
            setSelectedServices(prev => ({ ...prev, accounting: connectedProvider }));
            setStep(2);
            router.replace('/onboarding');
        } else if (status === 'connected_stripe') {
            setSelectedServices(prev => ({ ...prev, banking: 'Stripe' }));
            setStep(2);
            router.replace('/onboarding');
        }
    }, [searchParams, router]);

    // --- ACTIONS ---

    const handleSaveDetails = async () => {
        if (!formData.full_name || !formData.phone_number || !formData.company_name || !formData.currency) {
            alert("Please fill in all required fields marked with *");
            return;
        }

        setLoading('saving');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('settings').upsert({
            user_id: user.id,
            full_name: formData.full_name,
            business_name: formData.company_name,
            company_address: formData.company_address,
            currency: formData.currency,
            phone: `${formData.country_code} ${formData.phone_number}`,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        setLoading(null);

        if (error) {
            alert("Error saving details: " + error.message);
        } else {
            setStep(2);
        }
    };

    const handleConnectOAuth = async (provider: string, type: 'accounting' | 'banking') => {
        if (!provider) return;
        if (provider === 'None / Spreadsheet') {
            setSelectedServices(prev => ({ ...prev, [type]: 'None' }));
            return;
        }

        setLoading(provider);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return alert("Please log in first");
            
            let slug = provider.toLowerCase().replace(/\s+/g, '');
            if (slug === 'zohobooks') slug = 'zoho';
            
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/auth/${slug}/login?user_id=${user.id}`);
            
            if (!res.ok) throw new Error(`Provider ${provider} not yet implemented`);
            
            const data = await res.json();
            window.location.href = data.url; 
        } catch (e) {
            console.error(e);
            alert(`${provider} integration is coming soon!`);
            setLoading(null);
        }
    };

    const toggleChannel = (channel: string) => {
        setSelectedServices(prev => ({
            ...prev,
            channels: prev.channels.includes(channel)
                ? prev.channels.filter(c => c !== channel)
                : [...prev.channels, channel]
        }));
    };

    const completeOnboarding = async () => {
        if(!selectedServices.accounting) return alert("Accounting integration is required.");
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('settings').upsert({
            user_id: user.id,
            channels: selectedServices.channels,
            onboarding_completed: true
        }, { onConflict: 'user_id' });

        router.push('/');
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Header / Nav */}
            <div className="border-b border-gray-100 p-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <Image src="/logo.png" alt="Fulcrum" width={32} height={32} className="w-8 h-8" />
                    <span className="text-xl font-bold tracking-tight">Fulcrum</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                    <span className={step >= 1 ? "text-black" : ""}>Details</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className={step >= 2 ? "text-black" : ""}>Connect Services</span>
                </div>
            </div>

            <main className="max-w-2xl mx-auto p-6 md:p-12">
                
                {/* --- STEP 1: BUSINESS DETAILS --- */}
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold mb-2">Tell us about you</h1>
                            <p className="text-gray-500">We need these details to set up your financial brain.</p>
                        </div>

                        <div className="space-y-6">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Full Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={formData.full_name}
                                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                                    placeholder="e.g. John Doe"
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-black focus:outline-none transition-all"
                                />
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <select 
                                        value={formData.country_code}
                                        onChange={e => setFormData({...formData, country_code: e.target.value})}
                                        className="p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-black focus:outline-none appearance-none cursor-pointer"
                                    >
                                        {countryCodes.map(c => (
                                            <option key={c.code} value={c.code}>{c.code} ({c.country})</option>
                                        ))}
                                    </select>
                                    <input 
                                        type="tel" 
                                        value={formData.phone_number}
                                        onChange={e => setFormData({...formData, phone_number: e.target.value})}
                                        placeholder="Mobile Number"
                                        className="flex-1 p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-black focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Company Name */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Building2 className="w-4 h-4" /> Company Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={formData.company_name}
                                    onChange={e => setFormData({...formData, company_name: e.target.value})}
                                    placeholder="e.g. Acme Corp"
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-black focus:outline-none transition-all"
                                />
                            </div>

                            {/* Company Address */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Globe className="w-4 h-4" /> Company Address
                                </label>
                                <input 
                                    type="text" 
                                    value={formData.company_address}
                                    onChange={e => setFormData({...formData, company_address: e.target.value})}
                                    placeholder="City, Country"
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-black focus:outline-none transition-all"
                                />
                            </div>

                            {/* Currency */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Wallet className="w-4 h-4" /> Reporting Currency <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    value={formData.currency}
                                    onChange={e => setFormData({...formData, currency: e.target.value})}
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-black focus:outline-none appearance-none cursor-pointer"
                                >
                                    <option value="USD">USD - US Dollar</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="GBP">GBP - British Pound</option>
                                    <option value="SAR">SAR - Saudi Riyal</option>
                                    <option value="AED">AED - UAE Dirham</option>
                                    <option value="INR">INR - Indian Rupee</option>
                                </select>
                            </div>

                            <button 
                                onClick={handleSaveDetails}
                                disabled={loading === 'saving'}
                                className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 mt-8"
                            >
                                {loading === 'saving' ? 'Saving...' : 'Continue'} <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* --- STEP 2: CONNECT SERVICES --- */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Connect Services</h1>
                            <p className="text-gray-500">Link your financial sources. Accounting is required.</p>
                        </div>

                        {/* 1. Accounting Selection */}
                        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                                Accounting Software <span className="text-xs bg-black text-white px-2 py-1 rounded-full">Required</span>
                            </h3>
                            
                            <div className="flex flex-col gap-4">
                                <select 
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-black"
                                    onChange={(e) => {
                                        if (e.target.value === 'none') return;
                                        handleConnectOAuth(e.target.options[e.target.selectedIndex].text, 'accounting');
                                    }}
                                    value={selectedServices.accounting ? 'connected' : 'default'}
                                >
                                    <option value="default" disabled>Select your provider...</option>
                                    {accountingOptions.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                                    ))}
                                </select>

                                {selectedServices.accounting && (
                                    <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span className="font-semibold">Connected: {selectedServices.accounting}</span>
                                        <button 
                                            onClick={() => setSelectedServices(prev => ({...prev, accounting: null}))}
                                            className="ml-auto text-xs underline"
                                        >Change</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Banking Selection */}
                        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                Banking & Payments <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                            </h3>
                            
                            <div className="flex flex-col gap-4">
                                <select 
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-black"
                                    onChange={(e) => {
                                        if (e.target.value === 'default') return;
                                        handleConnectOAuth(e.target.options[e.target.selectedIndex].text, 'banking');
                                    }}
                                    value={selectedServices.banking ? 'connected' : 'default'}
                                >
                                    <option value="default" disabled>Select your bank...</option>
                                    {bankingOptions.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                                    ))}
                                </select>

                                {selectedServices.banking && (
                                    <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span className="font-semibold">Connected: {selectedServices.banking}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                         {/* 3. Channels Selection */}
                        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" /> AI Channels <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                            </h3>
                            
                            <div className="grid grid-cols-1 gap-3">
                                {channelServices.map((service) => (
                                    <button 
                                        key={service.id} 
                                        onClick={() => toggleChannel(service.name)} 
                                        className={`group p-4 bg-white border-2 rounded-xl transition-all duration-300 flex items-center justify-between ${selectedServices.channels.includes(service.name) ? 'border-black shadow-md ring-1 ring-black' : 'border-gray-100 hover:border-gray-300'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-black">{service.icon}</div>
                                            <span className="font-semibold">{service.name}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedServices.channels.includes(service.name) ? 'bg-black border-black' : 'border-gray-300'}`}>
                                            {selectedServices.channels.includes(service.name) && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setStep(1)} className="px-6 py-4 text-gray-500 font-bold hover:text-black">Back</button>
                            <button 
                                onClick={completeOnboarding}
                                className="flex-1 py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                            >
                                Complete Setup <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OnboardingContent />
        </Suspense>
    );
}