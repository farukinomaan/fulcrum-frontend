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
            // 1. Check if user is logged in
            const { data: { user } } = await supabase.auth.getUser();

            // Allow access to public pages (Login/Signup)
            if (pathname === '/login' || pathname === '/signup') {
                if (user) {
                    // If already logged in, check onboarding status
                    checkOnboarding(user.id);
                } else {
                    setLoading(false);
                }
                return;
            }

            // If not logged in and trying to access private page -> Redirect to Login
            if (!user) {
                router.replace('/login');
                return;
            }

            // 2. Check Onboarding Status
            await checkOnboarding(user.id);
        };

        const checkOnboarding = async (userId: string) => {
            // Check if user has settings (which implies onboarding is done)
            const { data: settings } = await supabase
                .from('settings')
                .select('user_id')
                .eq('user_id', userId)
                .single();

            const isOnboardingPage = pathname === '/onboarding';

            if (!settings && !isOnboardingPage) {
                // If no settings & not on onboarding page -> Go to Onboarding
                router.replace('/onboarding');
            } else if (settings && isOnboardingPage) {
                // If settings exist & trying to view onboarding -> Go to Dashboard
                router.replace('/');
            } else {
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