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
                    // If logged in, decide where to go
                    await checkOnboarding(user.id);
                } else {
                    setLoading(false);
                }
                return;
            }

            // 2. Handle Private Pages (Dashboard, Onboarding)
            if (!user) {
                router.replace('/login');
                return;
            }

            // 3. User is logged in -> Check Onboarding
            await checkOnboarding(user.id);
        };

        const checkOnboarding = async (userId: string) => {
            // We check if the 'settings' row exists for this user.
            // Using .maybeSingle() is safer than .single() because it returns null instead of erroring if empty.
            const { data: settings, error } = await supabase
                .from('settings')
                .select('user_id')
                .eq('user_id', userId)
                .maybeSingle(); 

            const isOnboardingPage = pathname === '/onboarding';

            if (!settings && !isOnboardingPage) {
                // CASE: New User (No settings) -> trying to access Dashboard
                // ACTION: Force them to Onboarding
                console.log("Redirecting to Onboarding...");
                router.replace('/onboarding');
            } 
            else if (settings && isOnboardingPage) {
                // CASE: Old User (Has settings) -> trying to access Onboarding
                // ACTION: Force them to Dashboard
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