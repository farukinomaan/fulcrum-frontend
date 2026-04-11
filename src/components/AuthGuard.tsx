'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            // 1. Handle Public Pages (Login)
            if (pathname === '/login') {
                if (user) {
                    await checkOnboarding(user.id);
                } else {
                    setLoading(false);
                }
                return;
            }

            // 2. Handle Private Pages
            if (!user) {
                router.replace('/login');
                return;
            }

            // 3. User is logged in -> Check Status
            await checkOnboarding(user.id);
        };

        const checkOnboarding = async (userId: string) => {
            // FIX: Select 'onboarding_completed' instead of just 'user_id'
            const { data: settings } = await supabase
                .from('settings')
                .select('onboarding_completed')
                .eq('user_id', userId)
                .maybeSingle(); 

            const isOnboardingPage = pathname === '/onboarding';
            
            // Treat user as "New" if settings is null OR onboarding_completed is false
            const isOnboardingComplete = settings?.onboarding_completed === true;

            if (!isOnboardingComplete && !isOnboardingPage) {
                // CASE: User hasn't finished onboarding -> Force them to Onboarding
                console.log("Redirecting to Onboarding...");
                router.replace('/onboarding');
            } 
            else if (isOnboardingComplete && isOnboardingPage) {
                // CASE: User IS finished -> Force them to Dashboard
                console.log("Redirecting to Dashboard...");
                router.replace('/');
            } 
            else {
                // CASE: User is in the right place
                setLoading(false);
            }
        };

        checkAuth();
    }, [pathname, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

    return <>{children}</>;
}