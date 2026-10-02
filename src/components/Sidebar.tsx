'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Activity,
  CreditCard,
  FileText,
  Zap,
  MessageSquare,
  Settings,
  Moon,
  Sun,
  LogOut,
  Inbox,
  LayoutDashboard
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useTheme } from 'next-themes';

export interface NavItemType {
  label: string;
  href?: string;
  icon: React.ReactNode;
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed like Gemini, or false if preferred
  const [mounted, setMounted] = useState(false);
  
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') {
      return pathname === '/';
    }
    if (href === '/inbox?view=transactions') {
      return pathname === '/inbox' && searchParams.get('view') === 'transactions';
    }
    if (href === '/inbox') {
      return pathname === '/inbox' && searchParams.get('view') !== 'transactions';
    }
    return pathname.startsWith(href) && href !== '/' && href !== '/inbox';
  };

  const navItems: NavItemType[] = [
    { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Inbox', href: '/inbox', icon: <Inbox className="w-5 h-5" /> },
    { label: 'Transactions', href: '/inbox?view=transactions', icon: <CreditCard className="w-5 h-5" /> },
    { label: 'Reports', href: '/reports', icon: <FileText className="w-5 h-5" /> },
    { label: 'Automations', href: '/automations', icon: <Zap className="w-5 h-5" /> },
    { label: 'Ask Fulcrum', href: '/chat', icon: <MessageSquare className="w-5 h-5" /> }
  ];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Floating Logo (Visible only when collapsed on mobile) */}
      <div className={`md:hidden fixed top-0 left-0 p-3 z-40 transition-opacity duration-300 ${isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={() => setIsCollapsed(false)}
          className="w-10 h-10 bg-[#121212] rounded-xl flex items-center justify-center shadow-md border border-zinc-800"
        >
          <Image src="/logo.png" alt="Fulcrum Logo" width={24} height={24} className="brightness-0 invert opacity-90" />
        </button>
      </div>

      {/* Main Sidebar */}
      <div className={`h-screen z-50 shrink-0 shadow-xl transition-all duration-300 ${
        isCollapsed 
          ? 'fixed top-0 left-0 -translate-x-full w-full md:sticky md:translate-x-0 md:w-[72px]' 
          : 'fixed inset-0 translate-x-0 w-full md:sticky md:w-64'
      }`}>
        <div className="flex flex-col h-full w-full bg-[#121212] text-zinc-400 border-r border-zinc-800">
          
          {/* Header (Logo acts as toggle) */}
          <div className="p-4 flex items-center h-20 shrink-0">
            <button 
              onClick={handleToggleCollapse} 
              className={`flex items-center transition-all ${isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-2 w-full'} rounded-xl hover:bg-zinc-800/50 cursor-pointer`}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Image src="/logo.png" alt="Fulcrum Logo" width={32} height={32} className="w-8 h-8 shrink-0 brightness-0 invert opacity-90" />
              
              <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-[200px] opacity-100 md:max-w-0 md:opacity-0' : 'max-w-[200px] opacity-100'}`}>
                <span className="font-semibold text-xl tracking-tight text-white whitespace-nowrap">Fulcrum</span>
              </div>
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-2 overflow-y-auto no-scrollbar">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.href) {
                      router.push(item.href);
                      if (typeof window !== 'undefined' && window.innerWidth < 768) {
                        setIsCollapsed(true);
                      }
                    }
                  }}
                  className={`flex items-center transition-all group relative rounded-full ${
                    isCollapsed 
                      ? 'w-full px-4 py-3 gap-4 md:justify-center md:w-12 md:h-12 md:mx-auto md:px-0 md:gap-0' 
                      : 'w-full px-4 py-3 gap-4'
                  } ${
                    active 
                      ? 'bg-zinc-800/80 text-white' 
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className={`${active ? 'text-blue-400' : 'text-zinc-400 group-hover:text-zinc-300'} shrink-0 flex items-center justify-center`}>
                    {item.icon}
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? "max-w-[200px] opacity-100 md:max-w-0 md:opacity-0" : "max-w-[200px] opacity-100"}`}><span className="whitespace-nowrap font-medium">{item.label}</span></div>
                </button>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-3 space-y-2 shrink-0">
            {mounted && (
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`flex items-center transition-all rounded-full ${
                  isCollapsed ? 'w-full px-4 py-3 gap-4 md:justify-center md:w-12 md:h-12 md:mx-auto md:px-0 md:gap-0' : 'w-full px-4 py-3 gap-4'
                } text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200`}
                title={isCollapsed ? (theme === 'dark' ? "Light Mode" : "Dark Mode") : undefined}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
                <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-[200px] opacity-100 md:max-w-0 md:opacity-0' : 'max-w-[200px] opacity-100'}`}>
                  <span className="whitespace-nowrap">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
              </button>
            )}

            <button 
               onClick={() => {
                 router.push('/settings');
                 if (typeof window !== 'undefined' && window.innerWidth < 768) {
                   setIsCollapsed(true);
                 }
               }}
               className={`flex items-center transition-all rounded-full ${
                 isCollapsed ? 'w-full px-4 py-3 gap-4 md:justify-center md:w-12 md:h-12 md:mx-auto md:px-0 md:gap-0' : 'w-full px-4 py-3 gap-4'
               } text-sm font-medium ${
                 isActive('/settings') ? 'bg-zinc-800/80 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
               }`}
               title={isCollapsed ? "Settings" : undefined}
            >
              <Settings className="w-5 h-5 shrink-0" />
              <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-[200px] opacity-100 md:max-w-0 md:opacity-0' : 'max-w-[200px] opacity-100'}`}><span className="whitespace-nowrap">Settings</span></div>
            </button>
            
            {/* User Profile */}
            <div className={`mt-2 flex items-center transition-all ${isCollapsed ? 'justify-between p-3 md:justify-center md:p-2' : 'justify-between p-3'} rounded-3xl bg-zinc-800/30 border border-zinc-700/50 hover:bg-zinc-800/60`}>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-zinc-700 text-white flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer">
                  N
                </div>
                <div className={`flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-[200px] opacity-100 md:max-w-0 md:opacity-0' : 'max-w-[200px] opacity-100'}`}>
                  <span className="text-sm font-medium text-white truncate leading-tight">My Account</span>
                  <span className="text-xs text-zinc-400 truncate mt-0.5">Pro Plan</span>
                </div>
              </div>
              <button onClick={handleSignOut} className={`text-zinc-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-zinc-700 shrink-0 ${isCollapsed ? 'md:hidden' : ''}`} title="Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
