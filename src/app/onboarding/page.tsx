'use client';

import { useState, useEffect, Suspense, ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { ChevronRight, CheckCircle2, Building2, User, Phone, Globe, Wallet, Loader2 } from 'lucide-react';

// --- TYPESCRIPT INTERFACES ---
interface ServiceItem {
    id: string;
    name: string;
    description: string;
}

// --- STATIC DATA ---
const accountingOptions: ServiceItem[] = [
    { id: 'zoho', name: 'Zoho Books', description: 'Two-way sync' },
    { id: 'xero', name: 'Xero', description: 'Two-way sync' },
    { id: 'quickbooks', name: 'QuickBooks', description: 'Coming soon' },
    { id: 'none', name: 'None', description: 'Manual / Spreadsheet' }
];

const bankingOptions: ServiceItem[] = [
    { id: 'stripe', name: 'Stripe', description: 'Payments & payouts' },
    { id: 'razorpay', name: 'Razorpay', description: 'Coming soon' },
    { id: 'paypal', name: 'PayPal', description: 'Coming soon' },
    { id: 'none', name: 'None', description: 'Manual reconciliation' }
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
        
        // Handle "None" selection locally
        if (provider === 'None') {
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
            alert(`${provider} integration is coming soon! For now, please select 'None' or a supported provider.`);
            setLoading(null);
        }
    };

    const completeOnboarding = async () => {
        if(!selectedServices.accounting) return alert("Accounting integration is required.");
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Calculate boolean flags
        const isZoho = selectedServices.accounting.toLowerCase().includes('zoho');
        const isStripe = selectedServices.banking?.toLowerCase().includes('stripe') || false;

        await supabase.from('settings').upsert({
            user_id: user.id,
            channels: selectedServices.channels,
            onboarding_completed: true,
            
            // Text Fields
            accounting_provider: selectedServices.accounting,
            banking_provider: selectedServices.banking,

            // Boolean Flags
            zoho_connected: isZoho,
            stripe_connected: isStripe
        }, { onConflict: 'user_id' });

        router.push('/');
    };

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Header / Nav */}
            <div className="border-b border-neutral-200 bg-white px-6 py-5 flex items-center justify-between sticky top-0 backdrop-blur-sm z-10 shadow-sm">
                <div className="flex items-center gap-2.5">
                    <Image src="/logo.png" alt="Fulcrum" width={28} height={28} className="w-7 h-7" />
                    <span className="text-lg font-medium text-neutral-900">Fulcrum</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-400 font-light">
                    <span className={step >= 1 ? "text-neutral-900 font-normal" : ""}>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className={step >= 2 ? "text-neutral-900 font-normal" : ""}>Connect</span>
                </div>
            </div>

            <main className="max-w-xl mx-auto px-6 py-12">
                
                {/* --- STEP 1: BUSINESS DETAILS --- */}
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-10">
                            <h1 className="text-3xl font-light text-neutral-900 mb-3 leading-tight">Tell us about you</h1>
                            <p className="text-neutral-500 text-base font-light">We need a few details to get started.</p>
                        </div>

                        <div className="space-y-5">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-normal text-neutral-700 mb-2 flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-neutral-400" /> 
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={formData.full_name}
                                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3.5 bg-white border border-neutral-200 rounded-lg focus:bg-white focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all text-sm"
                                />
                            </div>

                            {/* Phone Number - LOCKED TO NUMBERS ONLY */}
                            <div>
                                <label className="block text-sm font-normal text-neutral-700 mb-2 flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-neutral-400" /> 
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <select 
                                        value={formData.country_code}
                                        onChange={e => setFormData({...formData, country_code: e.target.value})}
                                        className="px-3 py-3.5 bg-white border border-neutral-200 rounded-lg focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer text-sm"
                                        style={{
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23525252' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E")`,
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'right 0.75rem center',
                                            paddingRight: '2.5rem',
                                            appearance: 'none'
                                        }}
                                    >
                                        {countryCodes.map(c => (
                                            <option key={c.code} value={c.code}>{c.code} ({c.country})</option>
                                        ))}
                                    </select>
                                    <input 
                                        type="tel" 
                                        value={formData.phone_number}
                                        onChange={e => {
                                            // REGEX: Strip out anything that is NOT a number
                                            const onlyNums = e.target.value.replace(/\D/g, '');
                                            setFormData({...formData, phone_number: onlyNums});
                                        }}
                                        placeholder="Mobile Number"
                                        className="flex-1 px-4 py-3.5 bg-white border border-neutral-200 rounded-lg focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* Company Name */}
                            <div>
                                <label className="block text-sm font-normal text-neutral-700 mb-2 flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5 text-neutral-400" /> 
                                    Company Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={formData.company_name}
                                    onChange={e => setFormData({...formData, company_name: e.target.value})}
                                    placeholder="Acme Corp"
                                    className="w-full px-4 py-3.5 bg-white border border-neutral-200 rounded-lg focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all text-sm"
                                />
                            </div>

                            {/* Company Address */}
                            <div>
                                <label className="block text-sm font-normal text-neutral-700 mb-2 flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5 text-neutral-400" /> 
                                    Company Address
                                </label>
                                <input 
                                    type="text" 
                                    value={formData.company_address}
                                    onChange={e => setFormData({...formData, company_address: e.target.value})}
                                    placeholder="City, Country"
                                    className="w-full px-4 py-3.5 bg-white border border-neutral-200 rounded-lg focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all text-sm"
                                />
                            </div>

                            {/* Currency */}
                            <div>
                                <label className="block text-sm font-normal text-neutral-700 mb-2 flex items-center gap-2">
                                    <Wallet className="w-3.5 h-3.5 text-neutral-400" /> 
                                    Reporting Currency <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    value={formData.currency}
                                    onChange={e => setFormData({...formData, currency: e.target.value})}
                                    className="w-full px-4 py-3.5 bg-white border border-neutral-200 rounded-lg focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer text-sm"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23525252' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 0.75rem center',
                                        paddingRight: '2.5rem',
                                        appearance: 'none'
                                    }}
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
                                className="w-full mt-8 py-3.5 bg-neutral-900 text-white rounded-lg font-normal hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                            >
                                {loading === 'saving' ? 'Saving...' : 'Continue'} 
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* --- STEP 2: CONNECT SERVICES (REDESIGNED) --- */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                        <div className="mb-4">
                            <h1 className="text-3xl font-light text-neutral-900 mb-3 leading-tight">Connect your tools</h1>
                            <p className="text-neutral-500 text-base font-light">Link your software to enable autonomous syncing.</p>
                        </div>

                        {/* 1. Accounting Integration Grid */}
                        <div>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-normal text-base text-neutral-900">Accounting Software</h3>
                                    <p className="text-xs text-neutral-400 font-light mt-1">Required to sync your books</p>
                                </div>
                                <span className="text-xs bg-neutral-900 text-white px-2.5 py-1 rounded-full font-light">Required</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                {accountingOptions.map(opt => {
                                    const isSelected = selectedServices.accounting === opt.name;
                                    const isLoading = loading === opt.name;
                                    
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleConnectOAuth(opt.name, 'accounting')}
                                            disabled={isLoading}
                                            className={`relative flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                                                isSelected 
                                                    ? 'border-neutral-900 ring-1 ring-neutral-900 bg-neutral-50 shadow-sm' 
                                                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center w-full mb-2">
                                                <span className={`font-medium text-sm ${isSelected ? 'text-neutral-900' : ''}`}>
                                                    {opt.name}
                                                </span>
                                                {isSelected && <CheckCircle2 className="w-4 h-4 text-neutral-900" />}
                                                {isLoading && <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />}
                                            </div>
                                            <span className="text-xs text-neutral-500 font-light">
                                                {isSelected ? 'Connected' : opt.description}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Banking Integration Grid */}
                        <div>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-normal text-base text-neutral-900">Banking & Payments</h3>
                                    <p className="text-xs text-neutral-400 font-light mt-1">Optional: Connect payment processors</p>
                                </div>
                                <span className="text-xs text-neutral-500 px-2.5 py-1 rounded-full border border-neutral-200 bg-white font-light">Optional</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                {bankingOptions.map(opt => {
                                    const isSelected = selectedServices.banking === opt.name;
                                    const isLoading = loading === opt.name;
                                    
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleConnectOAuth(opt.name, 'banking')}
                                            disabled={isLoading}
                                            className={`relative flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                                                isSelected 
                                                    ? 'border-neutral-900 ring-1 ring-neutral-900 bg-neutral-50 shadow-sm' 
                                                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center w-full mb-2">
                                                <span className={`font-medium text-sm ${isSelected ? 'text-neutral-900' : ''}`}>
                                                    {opt.name}
                                                </span>
                                                {isSelected && <CheckCircle2 className="w-4 h-4 text-neutral-900" />}
                                                {isLoading && <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />}
                                            </div>
                                            <span className="text-xs text-neutral-500 font-light">
                                                {isSelected ? 'Connected' : opt.description}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-neutral-100">
                            <button 
                                onClick={() => setStep(1)} 
                                className="px-5 py-3 text-neutral-500 font-light hover:text-neutral-900 transition-colors text-sm"
                            >
                                Back
                            </button>
                            <button 
                                onClick={completeOnboarding}
                                className="flex-1 py-3.5 bg-neutral-900 text-white rounded-lg font-normal hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                Complete Setup 
                                <ChevronRight className="w-4 h-4" />
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
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
            </div>
        }>
            <OnboardingContent />
        </Suspense>
    );
}