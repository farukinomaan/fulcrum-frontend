'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image'; // <--- Added Image Import
import {
    Send, Bot, User, ArrowLeft,
    Sparkles, Activity as ActivityIcon,
    CreditCard, FileText, MessageSquare, Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

// --- TYPES ---
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isThinking?: boolean;
}

export default function ChatPage() {
    const router = useRouter();
    const supabase = createClient();

    // --- CRITICAL FIX: Use Dynamic API URL ---
    // This connects to Render in production, ensuring the AI doesn't get stuck on "Typing..."
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hello! I'm Fulcrum AI. I can analyze your invoices, transactions, and runway. What would you like to know?",
            timestamp: new Date()
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-resize textarea height
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userText = input;
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        setIsTyping(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("You must be logged in to use Fulcrum AI.");
            }

            // --- FIX: Use the variable here instead of hardcoded localhost ---
            const response = await fetch(`${API_URL}/agent/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    query: userText
                })
            });

            if (!response.ok) {
                throw new Error(`Server Error: ${response.status}`);
            }

            const data = await response.json();

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response || "I encountered an error analyzing your data.",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);

        } catch (error: any) {
            console.error("AI Error:", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Connection Error: ${error.message || "Is the backend running?"}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900">

            {/* --- SIDEBAR --- */}
            <div className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
                        {/* --- LOGO REPLACEMENT HERE --- */}
                        <Image src="/logo.png" alt="Fulcrum Logo" width={32} height={32} className="w-8 h-8" />
                        <span className="font-semibold text-lg tracking-tight">Fulcrum</span>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    <NavItem icon={<ActivityIcon />} label="Live Feed" onClick={() => router.push('/')} />
                    <NavItem icon={<CreditCard />} label="Transactions" onClick={() => router.push('/?view=transactions')} />
                    <NavItem icon={<FileText />} label="Reports" onClick={() => router.push('/reports')} />
                    <NavItem icon={<MessageSquare />} label="Ask Fulcrum" active />
                    <NavItem icon={<Zap />} label="Automations" onClick={() => router.push('/automations')} />
                </nav>
            </div>

            {/* --- MAIN CHAT AREA --- */}
            <div className="flex-1 flex flex-col h-full relative">

                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/')} className="md:hidden p-2 hover:bg-slate-100 rounded-lg">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                Fulcrum AI
                            </h1>
                            {/* <p className="text-xs text-slate-500"></p> */}
                        </div>
                    </div>
                </header>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                            {/* Avatar (Assistant) */}
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-purple-700" />
                                </div>
                            )}

                            {/* Bubble */}
                            <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user'
                                    ? 'bg-black text-white rounded-br-none'
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                                }`}>
                                {msg.content}
                                <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>

                            {/* Avatar (User) */}
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-slate-600" />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center shrink-0">
                                <Sparkles className="w-3 h-3 text-purple-700 animate-pulse" />
                            </div>
                            <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* INPUT AREA */}
                <div className="p-6 bg-white border-t border-slate-200 shrink-0">
                    <div className="max-w-5xl mx-auto relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-black transition-all">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about revenue..."
                            className="w-full bg-transparent border-none outline-none text-sm resize-none max-h-48 min-h-[52px] py-3 pl-3 overflow-hidden"
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                            className="p-3 bg-black text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-[1px] mr-[1px]"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="text-center mt-3">
                        <span className="text-[10px] text-slate-400">Fulcrum AI can make mistakes. Verify important financial data.</span>
                    </div>
                </div>

            </div>
        </div>
    );
}

function NavItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
        >
            {React.cloneElement(icon, { className: `w-4 h-4 ${active ? 'text-white' : ''}` })}
            {label}
        </button>
    );
}