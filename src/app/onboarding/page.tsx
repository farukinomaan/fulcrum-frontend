'use client';

import { useState, useEffect, Suspense, ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

// --- TYPESCRIPT INTERFACES ---
interface ServiceItem {
    name: string;
    description?: string;
    icon: ReactNode;
}

// --- STATIC DATA ---
const accountingServices: ServiceItem[] = [
    { name: 'Zoho Books', description: 'Best for automation', icon: <svg className="w-8 h-8 text-[#0069D9]" viewBox="0 0 24 24" fill="currentColor"><path d="M2 3h20v18H2V3zm2 2v14h16V5H4zm2 2h12v2H6V7zm0 4h12v2H6v-2zm0 4h8v2H6v-2z" /></svg> },
    { name: 'Xero', description: 'Cloud accounting', icon: <svg className="w-8 h-8 text-[#13B5EA]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg> },
    { name: 'QuickBooks', description: 'Industry standard', icon: <svg className="w-8 h-8 text-[#2CA01C]" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2v-4H8V7h6v10z" /></svg> },
    { name: 'FreshBooks', description: 'For freelancers', icon: <svg className="w-8 h-8 text-[#0075DD]" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg> },
    { name: 'None', description: 'I use spreadsheets', icon: <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> }
];

const bankingServices: ServiceItem[] = [
    { name: 'Stripe', icon: <svg className="w-8 h-8 text-[#635BFF]" viewBox="0 0 24 24" fill="currentColor"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" /></svg> },
    { name: 'Razorpay', icon: <svg className="w-8 h-8 text-[#3395FF]" viewBox="0 0 24 24" fill="currentColor"><path d="M2.2 10.2l8.2-5.4 7.5 4.8v6.8h-4.3v-4.1l-3.2-2-3.2 2v4.1H2.2v-6.2z" /></svg> },
    { name: 'Moyasar', icon: <svg className="w-8 h-8 text-[#004CFF]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2-1-2-1-2 1 2 1zm0-3.5L6 7l6 3 6-3-6-2.5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg> },
    { name: 'Square', icon: <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="currentColor"><path d="M5.5 5.5h13v13h-13v-13zM2 2v20h20V2h-20zm16.5 16.5h-13v-13h13v13zM9.5 9.5h5v5h-5v-5z" /></svg> },
    { name: 'Shopify Pay', icon: <svg className="w-8 h-8 text-[#95BF47]" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4v16h16V4zm-2 14H6V6h12v12zM8 8h8v2H8V8z" /></svg> },
    { name: 'PayPal', icon: <svg className="w-8 h-8 text-[#003087]" viewBox="0 0 24 24" fill="currentColor"><path d="M9 19c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-9h-6v9z" /><path d="M21 4H3c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" /></svg> }
];

const channelServices: ServiceItem[] = [
    { name: 'WhatsApp', icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg> },
];

function OnboardingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState<string | null>(null);

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
                const updates: any = {};
                let nextStep = 1;

                if (settings.accounting_provider && settings.accounting_provider !== 'Not Connected') {
                    updates.accounting = settings.accounting_provider;
                    nextStep = 2; // Auto-advance to Banking
                }

                if (settings.banking_provider && settings.banking_provider !== 'Not Connected') {
                    updates.banking = settings.banking_provider;
                    nextStep = 3; // Auto-advance to Channels
                }

                if (settings.channels && settings.channels.length > 0) {
                    updates.channels = settings.channels;
                }

                if (Object.keys(updates).length > 0) {
                    setSelectedServices(prev => ({ ...prev, ...updates }));
                    setStep(current => Math.max(current, nextStep));
                }
            }
        };

        fetchProgress();
    }, [supabase]);

    // 2. Handle Callback from Backend (Zoho/Xero Redirect)
    useEffect(() => {
        const status = searchParams.get('status');
        const provider = searchParams.get('provider');

        if (status === 'connected') {
            const connectedProvider = provider ? decodeURIComponent(provider) : 'Connected Service';

            // Mark as selected
            setSelectedServices(prev => ({ ...prev, accounting: connectedProvider }));

            // FORCE Step 2 immediately
            setStep(2);

            // Clean URL
            router.replace('/onboarding');

        } else if (status === 'connected_stripe') {
            setSelectedServices(prev => ({ ...prev, banking: 'Stripe' }));
            setStep(3);
            router.replace('/onboarding');
        } else if (status === 'error') {
            alert("Connection failed. Please check your credentials.");
        }
    }, [searchParams, router]);

    // 3. Initiate Connection (The big black button)
    const handleConnectClick = async () => {
        const provider = step === 1 ? selectedServices.accounting : selectedServices.banking;
        if (!provider) return;

        setLoading(provider);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return alert("Please log in first");

            let slug = provider.toLowerCase().replace(/\s+/g, '');
            if (slug === 'zohobooks') slug = 'zoho';

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/auth/${slug}/login?user_id=${user.id}`);

            if (!res.ok) throw new Error(`Provider ${provider} not yet implemented`);

            const data = await res.json();
            window.location.href = data.url; // Redirect to Provider
        } catch (e) {
            console.error(e);
            alert(`${provider} integration is coming next! (Backend pending)`);
            setLoading(null);
        }
    };

    const handleSelectService = (provider: string, type: 'accounting' | 'banking') => {
        setSelectedServices(prev => ({ ...prev, [type]: provider }));
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
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('settings').upsert({
                user_id: user.id,
                channels: selectedServices.channels
            }, { onConflict: 'user_id' });

            if (error) {
                console.error("Save error:", error);
                alert("Database Error: " + error.message);
                return;
            }

            router.push('/');
            router.refresh();

        } catch (e) {
            console.error(e);
            alert("Unexpected error occurred.");
        }
    };

    return (
        <div className="min-h-screen bg-white p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3">
                            {/* Replaced 'F' placeholder with Logo */}
                            <Image src="/logo.png" alt="Fulcrum" width={40} height={40} className="w-10 h-10" />
                            <h2 className="text-xl font-bold text-black">Fulcrum</h2>
                    </div>
                    <div className="text-sm text-gray-500">Step {step} of 4</div>
                </div>

                <div className="mb-16">
                    <div className="flex items-center justify-between mb-4">
                        {['Accounting', 'Banking', 'Channels', 'AI Brain'].map((label, idx) => (
                            <div key={label} className="flex items-center">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all ${step > idx + 1 ? 'bg-black text-white' : step === idx + 1 ? 'bg-black text-white ring-4 ring-gray-200' : 'bg-gray-200 text-gray-400'}`}>
                                    {step > idx + 1 ? '✓' : idx + 1}
                                </div>
                                {idx < 3 && <div className={`h-1 w-16 md:w-32 mx-2 transition-all ${step > idx + 1 ? 'bg-black' : 'bg-gray-200'}`}></div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- STEP 1: ACCOUNTING --- */}
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">Connect your Accounting</h1>
                            <p className="text-gray-600 text-lg">Where do you manage your invoices and books?</p>
                        </div>
                        {!selectedServices.accounting ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {accountingServices.map((service) => (
                                    <button
                                        key={service.name}
                                        onClick={() => handleSelectService(service.name, 'accounting')} // Just Select
                                        className="group p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-black hover:shadow-xl transition-all duration-300 text-left"
                                    >
                                        <div className="flex items-start justify-between mb-4"><div className="text-black bg-gray-50 p-3 rounded-xl group-hover:bg-gray-100 transition-colors">{service.icon}</div></div>
                                        <span className="font-bold text-lg text-black block">{service.name}</span><span className="text-sm text-gray-500">{service.description}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="max-w-md mx-auto bg-gray-50 p-8 rounded-3xl border-2 border-gray-200 animate-in zoom-in-95 duration-300">
                                <div className="flex items-center gap-3 mb-6">
                                    <button onClick={() => setSelectedServices(prev => ({ ...prev, accounting: null }))} className="text-gray-400 hover:text-black">Back</button>
                                    <h2 className="text-xl font-bold text-black">Connect {selectedServices.accounting}</h2>
                                </div>
                                {selectedServices.accounting === 'None' ? (
                                    <div className="text-center py-6"><button onClick={() => setStep(2)} className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all">Continue to Banking</button></div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <button
                                            disabled={!!loading}
                                            onClick={handleConnectClick} // Actual Connect Action
                                            className="bg-black text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center gap-3 w-full justify-center disabled:opacity-50"
                                        >
                                            {loading === selectedServices.accounting ? 'Connecting...' : `Connect ${selectedServices.accounting}`}
                                        </button>
                                        <p className="mt-4 text-gray-500 text-sm text-center">We'll redirect you to {selectedServices.accounting} to approve access.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* --- STEP 2: BANKING --- */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">Banking & Payments</h1>
                            <p className="text-gray-600 text-lg">Connect your banks or payment gateways</p>
                        </div>
                        {!selectedServices.banking ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {bankingServices.map((service) => (
                                    <button
                                        key={service.name}
                                        onClick={() => handleSelectService(service.name, 'banking')} // Just Select
                                        className="group p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-black hover:shadow-xl transition-all duration-300"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-2"><div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">{service.icon}</div><span className="font-bold text-lg text-black">{service.name}</span></div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="max-w-md mx-auto bg-gray-50 p-8 rounded-3xl border-2 border-gray-200">
                                <div className="flex items-center gap-3 mb-6">
                                    <button onClick={() => setSelectedServices(prev => ({ ...prev, banking: null }))} className="text-gray-400 hover:text-black">Back</button>
                                    <h2 className="text-xl font-bold text-black">{selectedServices.banking} Credentials</h2>
                                </div>
                                <div className="flex flex-col items-center justify-center py-4">
                                    <button
                                        disabled={!!loading}
                                        onClick={handleConnectClick} // Actual Connect Action
                                        className="bg-black text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center gap-3 w-full justify-center disabled:opacity-50"
                                    >
                                        {loading === selectedServices.banking ? 'Connecting...' : `Connect ${selectedServices.banking}`}
                                    </button>
                                    <p className="mt-4 text-gray-500 text-sm text-center">We'll redirect you to {selectedServices.banking} to approve access.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- STEP 3: CHANNELS --- */}
                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">Choose Channels</h1>
                            <p className="text-gray-600 text-lg">Where should your AI assistant live?</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {channelServices.map((service) => (
                                <button key={service.name} onClick={() => toggleChannel(service.name)} className={`group p-8 bg-white border-2 rounded-2xl transition-all duration-300 ${selectedServices.channels.includes(service.name) ? 'border-black shadow-xl scale-105' : 'border-gray-200 hover:border-gray-400'}`}>
                                    <div className="flex items-center justify-between"><div className="flex items-center gap-5"><div className="text-black">{service.icon}</div><span className="font-semibold text-xl text-black">{service.name}</span></div><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedServices.channels.includes(service.name) ? 'bg-black border-black' : 'border-gray-300'}`}>{selectedServices.channels.includes(service.name) && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}</div></div>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center justify-between"><button onClick={() => setStep(2)} className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors">Back</button><button onClick={() => setStep(4)} disabled={selectedServices.channels.length === 0} className="px-8 py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50">Continue</button></div>
                    </div>
                )}

                {/* --- STEP 4: REVIEW --- */}
                {step === 4 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">You're All Set</h1>
                            <p className="text-gray-600 text-lg">We're setting up your intelligent finance brain</p>
                        </div>
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-white border-2 border-gray-200 rounded-3xl p-12 text-center mb-8">
                                <div className="w-24 h-24 bg-black rounded-2xl mx-auto mb-6 flex items-center justify-center"><span className="text-white text-3xl font-bold">✓</span></div>
                                <h3 className="text-2xl font-bold text-black mb-4">Connected Services</h3>
                                <div className="space-y-3 mb-8">
                                    {selectedServices.accounting && <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-xl"><span className="font-medium text-black">{selectedServices.accounting}</span></div>}
                                    {selectedServices.banking && <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-xl"><span className="font-medium text-black">{selectedServices.banking}</span></div>}
                                    {/* --- SHOW CHANNELS HERE --- */}
                                    {selectedServices.channels.length > 0 && (
                                        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                                            {selectedServices.channels.map(c => (
                                                <span key={c} className="px-3 py-1 bg-black text-white text-sm rounded-full">{c}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <button onClick={() => setStep(3)} className="text-gray-500 hover:text-black">Back</button>
                                <button onClick={completeOnboarding} className="px-8 py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800">Complete Setup</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
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