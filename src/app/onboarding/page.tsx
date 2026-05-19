'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import {
    ChevronRight, Building2, User, Phone,
    Globe, Wallet, Loader2, BookOpen, CreditCard, ArrowLeft, Check
} from 'lucide-react';

// --- TYPESCRIPT INTERFACES ---
interface ServiceItem {
    id: string;
    name: string;
    description: string;
    badge?: string;
    logo?: string | null;
}

// --- STATIC DATA ---
const accountingOptions: ServiceItem[] = [
    { id: 'zoho', name: 'Zoho Books', description: 'Two-way sync', logo: 'https://www.google.com/s2/favicons?domain=zoho.com&sz=128' },
    { id: 'xero', name: 'Xero', description: 'Two-way sync', logo: 'https://www.google.com/s2/favicons?domain=xero.com&sz=128' },
    { id: 'quickbooks', name: 'QuickBooks', description: 'Coming soon', badge: 'Soon', logo: 'https://www.google.com/s2/favicons?domain=quickbooks.intuit.com&sz=128' },
    { id: 'none', name: 'None', description: 'Manual / Spreadsheet', logo: null }
];

const bankingOptions: ServiceItem[] = [
    { id: 'stripe', name: 'Stripe', description: 'Payments & payouts', logo: 'https://www.google.com/s2/favicons?domain=stripe.com&sz=128' },
    { id: 'razorpay', name: 'Razorpay', description: 'Coming soon', badge: 'Soon', logo: 'https://www.google.com/s2/favicons?domain=razorpay.com&sz=128' },
    { id: 'paypal', name: 'PayPal', description: 'Coming soon', badge: 'Soon', logo: 'https://www.google.com/s2/favicons?domain=paypal.com&sz=128' },
    { id: 'none', name: 'None', description: 'Manual reconciliation', logo: null }
];

const countryCodes = [
    { code: '+1', country: 'US/CA' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'IN' },
    { code: '+966', country: 'SA' },
    { code: '+971', country: 'UAE' },
    { code: '+61', country: 'AU' },
    { code: '+49', country: 'DE' },
];

const STEPS = [
    { id: 1, label: 'Your Details', sublabel: 'Name, company & currency' },
    { id: 2, label: 'Connect Tools', sublabel: 'Accounting & payments' },
];


// SERVICE CARD
function ServiceCard({
    opt,
    isSelected,
    isLoading,
    onClick,
    disabled,
}: {
    opt: ServiceItem;
    isSelected: boolean;
    isLoading: boolean;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={isLoading || disabled}
            className={`
                group relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left w-full
                ${isSelected
                    ? 'border-neutral-900 bg-neutral-900 shadow-lg'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
                }
                ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            {/* Logo - Added a white background block when selected */}
            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md transition-colors ${isSelected ? "bg-white shadow-sm" : ""}`}>
                {opt.logo ? (
                    <img
                        src={opt.logo}
                        alt={`${opt.name} logo`}
                        // Removed the invert hack, slightly adjusted sizing for padding
                        className="w-6 h-6 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                ) : (
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${isSelected ? "text-neutral-900" : "bg-neutral-100 text-neutral-400"}`}>—</div>
                )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm leading-tight ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                    {opt.name}
                </p>
                <p className={`text-xs mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                    {isSelected ? 'Selected' : opt.description}
                </p>
            </div>

            {/* State Icon */}
            <div className="flex-shrink-0">
                {isLoading ? (
                    <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
                ) : isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                        <Check className="w-3 h-3 text-neutral-900" strokeWidth={3} />
                    </div>
                ) : opt.badge ? (
                    <span className="text-[10px] font-medium text-neutral-400 border border-neutral-200 px-1.5 py-0.5 rounded-full">
                        {opt.badge}
                    </span>
                ) : null}
            </div>
        </button>
    );
}

// SIDEBAR STEP INDICATOR
function StepIndicator({ currentStep }: { currentStep: number }) {
    return (
        <div className="flex flex-col gap-0">
            {STEPS.map((s, i) => {
                const done = currentStep > s.id;
                const active = currentStep === s.id;
                return (
                    <div key={s.id} className="flex items-start gap-3.5">
                        <div className="flex flex-col items-center">
                            <div className={`
                                w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-all duration-300
                                ${done ? 'bg-neutral-900 text-white'
                                    : active ? 'bg-neutral-900 text-white ring-4 ring-neutral-900/10'
                                        : 'bg-neutral-100 text-neutral-400'}
                            `}>
                                {done ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : s.id}
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`w-px h-10 mt-1 mb-1 transition-colors duration-300 ${done ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
                            )}
                        </div>
                        <div className="pt-0.5 pb-1">
                            <p className={`text-sm font-semibold transition-colors ${active || done ? 'text-neutral-900' : 'text-neutral-400'}`}>
                                {s.label}
                            </p>
                            <p className={`text-xs mt-0.5 transition-colors ${active ? 'text-neutral-500' : 'text-neutral-300'}`}>
                                {s.sublabel}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// FIELD WRAPPER
function Field({ label, required, icon: Icon, children }: {
    label: string; required?: boolean; icon?: any; children: React.ReactNode;
}) {
    return (
        <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-2">
                {Icon && <Icon className="w-3.5 h-3.5 text-neutral-400" />}
                {label}
                {required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

const inputCls = `
    w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg
    focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/8
    transition-all text-sm text-neutral-900 placeholder:text-neutral-300
`;

const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23737373' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: 'right 0.75rem center',
    paddingRight: '2.5rem',
    appearance: 'none' as const,
};

// MAIN CONTENT
function OnboardingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        full_name: '',
        country_code: '+1',
        phone_number: '',
        company_name: '',
        company_address: '',
        currency: 'USD'
    });

    const [selectedServices, setSelectedServices] = useState<{
        accounting: string | null;
        banking: string | null;
        channels: string[];
    }>({
        accounting: null,
        banking: null,
        channels: [],
    });

    // Run ONCE on mount — read searchParams directly, don't add as dep to avoid re-run loop
    useEffect(() => {
        const loadState = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: settings } = await supabase
                .from('settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            // Read URL params here (snapshot at mount)
            const urlStatus = searchParams.get('status');
            const urlProvider = searchParams.get('provider');

            let newAccounting: string | null = null;
            let newBanking: string | null = null;

            if (settings) {
                setFormData(prev => ({
                    ...prev,
                    full_name: settings.full_name || '',
                    company_name: settings.business_name || '',
                    company_address: settings.company_address || '',
                    currency: settings.currency || 'USD',
                }));

                if (settings.business_name) setStep(2);

                newAccounting = settings.accounting_provider;
                newBanking = settings.banking_provider;

                // Ghost-connection guard — only filter when DB explicitly says false
                if (newAccounting === 'Zoho Books' && settings.zoho_connected === false) {
                    newAccounting = 'None';
                }
                if (newBanking === 'Stripe' && settings.stripe_connected === false) {
                    newBanking = 'None';
                }
            }

            // ── URL overrides (returning from OAuth) ──
            if (urlStatus === 'connected') {
                let resolvedProvider = urlProvider ? decodeURIComponent(urlProvider) : 'Connected Service';
                if (resolvedProvider.toLowerCase().replace(/\s+/g, '') === 'zohobooks') {
                    resolvedProvider = 'Zoho Books';
                }
                newAccounting = resolvedProvider;
                setStep(2);

                // FIX: Persist immediately so next DB read reflects the connection
                await supabase.from('settings').upsert({
                    user_id: user.id,
                    accounting_provider: resolvedProvider,
                    zoho_connected: resolvedProvider === 'Zoho Books',
                }, { onConflict: 'user_id' });

            } else if (urlStatus === 'connected_stripe') {
                newBanking = 'Stripe';
                setStep(2);

                // FIX: Persist Stripe immediately
                await supabase.from('settings').upsert({
                    user_id: user.id,
                    banking_provider: 'Stripe',
                    stripe_connected: true,
                }, { onConflict: 'user_id' });
            }

            // Sanitise stale text values
            if (newAccounting === 'Not Connected') newAccounting = 'None';
            if (newBanking === 'Not Connected') newBanking = 'None';

            setSelectedServices(prev => ({
                ...prev,
                accounting: newAccounting ?? prev.accounting,
                banking: newBanking ?? prev.banking,
                channels: settings?.channels || prev.channels
            }));

            // Clear URL params after reading them
            if (urlStatus) {
                router.replace('/onboarding');
            }
        };

        loadState();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ← intentionally empty: we capture searchParams as a snapshot above

    // --- ACTIONS ---

    const handleSaveDetails = async () => {
        if (!formData.full_name || !formData.phone_number || !formData.company_name || !formData.currency) {
            alert("Please fill in all required fields.");
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
        if (error) alert("Error saving: " + error.message);
        else setStep(2);
    };

    const handleConnectOAuth = async (provider: string, type: 'accounting' | 'banking') => {
        if (!provider) return;

        if (provider === 'None') {
            setSelectedServices(prev => ({ ...prev, [type]: 'None' }));
            return;
        }

        setLoading(provider);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return alert("Please log in first.");

            let slug = provider.toLowerCase().replace(/\s+/g, '');
            if (slug === 'zohobooks') slug = 'zoho';

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/auth/${slug}/login?user_id=${user.id}`);
            if (!res.ok) throw new Error(`Provider ${provider} not yet implemented`);

            const data = await res.json();
            window.location.href = data.url;
        } catch (e) {
            console.error(e);
            alert(`${provider} integration is coming soon. Please select 'None' or a supported provider.`);
            setLoading(null);
        }
    };

    const completeOnboarding = async () => {
        if (!selectedServices.accounting) {
            alert("Please select an accounting option to continue.");
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const isZoho = selectedServices.accounting.toLowerCase().includes('zoho');
        const isStripe = selectedServices.banking?.toLowerCase().includes('stripe') || false;

        await supabase.from('settings').upsert({
            user_id: user.id,
            channels: selectedServices.channels,
            onboarding_completed: true,
            accounting_provider: selectedServices.accounting,
            banking_provider: selectedServices.banking,
            zoho_connected: isZoho,
            stripe_connected: isStripe
        }, { onConflict: 'user_id' });

        router.push('/');
    };

    // RENDER
    // Refactor the code later 
    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">

            {/* ── Top Nav ── */}
            <header className="bg-white border-b border-neutral-100 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2.5">
                    <Image src="/logo.png" alt="Fulcrum" width={26} height={26} className="w-6 h-6" />
                    <span className="text-base font-semibold text-neutral-900 tracking-tight">Fulcrum</span>
                </div>
                {/* Mobile step pill */}
                <span className="sm:hidden text-xs font-medium text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-full">
                    Step {step} of {STEPS.length}
                </span>
            </header>

            {/* ── Body ── */}
            <div className="flex flex-1">

                {/* ── Left Sidebar (desktop) ── */}
                <aside className="hidden sm:flex flex-col w-60 xl:w-68 bg-white border-r border-neutral-100 px-8 py-10 flex-shrink-0">
                    <div className="mb-8">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
                            Getting Started
                        </p>
                        <h2 className="text-lg font-semibold text-neutral-900 leading-snug">
                            Set up your workspace
                        </h2>
                    </div>

                    <StepIndicator currentStep={step} />

                    <div className="mt-auto pt-8 border-t border-neutral-100">
                        <p className="text-xs text-neutral-400 leading-relaxed">
                            🔒 Your data is encrypted and never shared with third parties.
                        </p>
                    </div>
                </aside>

                {/* ── Main Panel ── */}
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-lg mx-auto px-5 sm:px-10 py-10">

                        {/* ══ STEP 1 ══ */}
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-bottom-3 duration-400">
                                <div className="mb-8">
                                    <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
                                        Tell us about your business
                                    </h1>
                                    <p className="text-sm text-neutral-500 leading-relaxed">
                                        We need a few details to personalise your workspace.
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    <Field label="Full Name" required icon={User}>
                                        <input
                                            type="text"
                                            value={formData.full_name}
                                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                            placeholder="Jane Smith"
                                            className={inputCls}
                                        />
                                    </Field>

                                    <Field label="Phone Number" required icon={Phone}>
                                        <div className="flex gap-2">
                                            <select
                                                value={formData.country_code}
                                                onChange={e => setFormData({ ...formData, country_code: e.target.value })}
                                                className="px-3 py-3 bg-white border border-neutral-200 rounded-lg focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/8 text-sm cursor-pointer"
                                                style={{ ...selectStyle, paddingRight: '1.8rem' }}
                                            >
                                                {countryCodes.map(c => (
                                                    <option key={c.code} value={c.code}>{c.code} {c.country}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="tel"
                                                value={formData.phone_number}
                                                onChange={e => setFormData({ ...formData, phone_number: e.target.value.replace(/\D/g, '') })}
                                                placeholder="Mobile number"
                                                className={`${inputCls} flex-1`}
                                            />
                                        </div>
                                    </Field>

                                    <Field label="Company Name" required icon={Building2}>
                                        <input
                                            type="text"
                                            value={formData.company_name}
                                            onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                                            placeholder="Acme Corp"
                                            className={inputCls}
                                        />
                                    </Field>

                                    <Field label="Company Address" icon={Globe}>
                                        <input
                                            type="text"
                                            value={formData.company_address}
                                            onChange={e => setFormData({ ...formData, company_address: e.target.value })}
                                            placeholder="City, Country"
                                            className={inputCls}
                                        />
                                    </Field>

                                    <Field label="Reporting Currency" required icon={Wallet}>
                                        <select
                                            value={formData.currency}
                                            onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                            className={inputCls}
                                            style={selectStyle}
                                        >
                                            <option value="USD">USD — US Dollar</option>
                                            <option value="EUR">EUR — Euro</option>
                                            <option value="GBP">GBP — British Pound</option>
                                            <option value="SAR">SAR — Saudi Riyal</option>
                                            <option value="AED">AED — UAE Dirham</option>
                                            <option value="INR">INR — Indian Rupee</option>
                                        </select>
                                    </Field>
                                </div>

                                <button
                                    onClick={handleSaveDetails}
                                    disabled={loading === 'saving'}
                                    className="w-full mt-8 py-3.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 active:scale-[.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                                >
                                    {loading === 'saving'
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                                        : <>Continue <ChevronRight className="w-4 h-4" /></>
                                    }
                                </button>

                                <p className="text-center text-xs text-neutral-400 mt-4">
                                    You can update these details later in Settings.
                                </p>
                            </div>
                        )}

                        {/* ══ STEP 2 ══ */}
                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-bottom-3 duration-400 space-y-8">
                                <div>
                                    <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
                                        Connect your tools
                                    </h1>
                                    <p className="text-sm text-neutral-500 leading-relaxed">
                                        Link your software to enable automatic syncing and reconciliation.
                                    </p>
                                </div>

                                {/* Accounting Section */}
                                <section>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-neutral-500" />
                                            <h3 className="text-sm font-semibold text-neutral-900">Accounting Software</h3>
                                        </div>
                                        <span className="text-[11px] font-semibold bg-neutral-900 text-white px-2.5 py-1 rounded-full tracking-wide">
                                            Required
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-400 mb-4 ml-6">
                                        Sync invoices, bills, and expenses automatically.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {accountingOptions.map(opt => (
                                            <ServiceCard
                                                key={opt.id}
                                                opt={opt}
                                                isSelected={selectedServices.accounting === opt.name}
                                                isLoading={loading === opt.name}
                                                onClick={() => handleConnectOAuth(opt.name, 'accounting')}
                                                disabled={!!opt.badge && opt.name !== 'None'}
                                            />
                                        ))}
                                    </div>
                                </section>

                                {/* Banking Section */}
                                <section>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-neutral-500" />
                                            <h3 className="text-sm font-semibold text-neutral-900">Banking & Payments</h3>
                                        </div>
                                        <span className="text-[11px] font-medium text-neutral-500 border border-neutral-200 bg-white px-2.5 py-1 rounded-full">
                                            Optional
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-400 mb-4 ml-6">
                                        Connect a payment processor for automatic reconciliation.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {bankingOptions.map(opt => (
                                            <ServiceCard
                                                key={opt.id}
                                                opt={opt}
                                                isSelected={selectedServices.banking === opt.name}
                                                isLoading={loading === opt.name}
                                                onClick={() => handleConnectOAuth(opt.name, 'banking')}
                                                disabled={!!opt.badge && opt.name !== 'None'}
                                            />
                                        ))}
                                    </div>
                                </section>

                                {/* Footer CTA */}
                                <div className="pt-4 border-t border-neutral-100 flex items-center gap-3">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700 transition-colors px-3 py-2 rounded-lg hover:bg-neutral-100"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                                    </button>
                                    <button
                                        onClick={completeOnboarding}
                                        className="flex-1 py-3.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 active:scale-[.99] transition-all flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        Complete Setup <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>

                                <p className="text-center text-xs text-neutral-400">
                                    Integrations can be changed at any time in Settings.
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
            </div>
        }>
            <OnboardingContent />
        </Suspense>
    );
}