'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client'; 
import MergeAnimation from '@/components/MergeAnimation';

export default function LoginPage() {
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectUrl}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      
      {/* --- LEFT SIDE: Google Login Only (35% Width) --- */}
      <div className="w-full lg:w-[35%] flex flex-col justify-center px-8 sm:px-12 relative z-10 bg-white">
        
        {/* Logo */}
        <div className="absolute top-8 left-8">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Fulcrum Logo" width={32} height={32} className="w-8 h-8" />
            <span className="font-medium text-xl text-neutral-900">Fulcrum</span>
          </div>
        </div>

        <div className="max-w-sm w-full mx-auto">
          <div className="mb-12">
            <h1 className="text-[2.5rem] font-light text-neutral-900 mb-4 leading-tight">
              Welcome back
            </h1>
            <p className="text-neutral-500 text-base font-light">
              Your books are waiting.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-light">
              {error}
            </div>
          )}

          {/* Google Button */}
          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-neutral-900 text-white font-normal py-4 px-6 rounded-xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 shadow-sm group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="text-[15px]">Continue with Google</span>
          </button>

          {/* <p className="mt-10 text-center text-sm text-neutral-400 font-light">
            Don't have an account?{' '}
            <Link href="/signup" className="text-neutral-900 hover:underline font-normal">
              Create account
            </Link>
          </p> */}
        </div>
      </div>

      {/* --- RIGHT SIDE: Animation Panel (65% Width) --- */}
      <div className="hidden lg:flex lg:w-[65%] bg-neutral-50 flex-col items-center justify-center relative">
        
        {/* Text Content (Above Animation) */}
        <div className="text-center z-10 mb-6 max-w-2xl px-6">
           <h2 className="text-neutral-900 text-[2rem] font-light mb-4 leading-snug">
             Your Books, Always Current
           </h2>
           <p className="text-neutral-500 text-base font-light leading-relaxed">
             We chase unpaid invoices, prep your reports, and flag issues before they become problems.
           </p>
           
           {/* Simple separator */}
           <div className="mt-8 w-16 h-[1px] bg-neutral-300 mx-auto"></div>
        </div>

        {/* Animation (Full Size, No Scaling) */}
        <div className="w-full max-w-5xl h-[600px] flex items-center justify-center">
           <MergeAnimation />
        </div>

      </div>

    </div>
  );
}