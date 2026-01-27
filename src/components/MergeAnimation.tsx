'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function MergeAnimation() {
  // --- SCROLLING LOGOS ---
  const allInputs = [
    { id: 'zoho',    color: '#0096FF', logo: 'https://cdn.simpleicons.org/zoho/0096FF' },
    { id: 'stripe',  color: '#635BFF', logo: 'https://cdn.simpleicons.org/stripe/635BFF' },
    { id: 'razor',   color: '#3395FF', logo: 'https://cdn.simpleicons.org/razorpay/3395FF' },
    { id: 'qbooks',  color: '#2CA01C', logo: 'https://cdn.simpleicons.org/quickbooks/2CA01C' },
    { id: 'xero',    color: '#13B5EA', logo: 'https://cdn.simpleicons.org/xero/13B5EA' },
    { id: 'shopify', color: '#96BF48', logo: 'https://cdn.simpleicons.org/shopify/96BF48' },
    { id: 'salesf',  color: '#00A1E0', logo: 'https://cdn.simpleicons.org/salesforce/00A1E0' },
    { id: 'hubspot', color: '#FF7A59', logo: 'https://cdn.simpleicons.org/hubspot/FF7A59' },
    { id: 'notion',  color: '#000000', logo: 'https://cdn.simpleicons.org/notion/ffffff' }, 
    { id: 'drive',   color: '#4285F4', logo: 'https://cdn.simpleicons.org/googledrive/4285F4' },
    { id: 'slack-in',color: '#E01E5A', logo: 'https://cdn.simpleicons.org/slack/E01E5A' },
    { id: 'gmail-in',color: '#EA4335', logo: 'https://cdn.simpleicons.org/gmail/EA4335' },
  ];

  // --- STATIC OUTPUTS ---
  const outputs = [
    { id: 1, color: '#E01E5A', y: 240, logo: 'https://cdn.simpleicons.org/slack/E01E5A' },
    { id: 2, color: '#EA4335', y: 360, logo: 'https://cdn.simpleicons.org/gmail/EA4335' },
  ];

  // --- STATIC LINE POSITIONS ---
  const staticLines = [180, 260, 340, 420];

  const centerX = 400;
  const centerY = 300;
  const startX = 100;
  const endX = 700;

  // Scroll Configuration
  const gap = 80; 
  const totalHeight = allInputs.length * gap;
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    const speed = 0.4; 

    const animate = () => {
      setOffset((prev) => (prev + speed) % totalHeight);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [totalHeight]);

  const dashArray = "80 400"; 

  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <svg viewBox="0 0 800 600" className="w-full h-full max-w-5xl" fill="none">
        
        {/* --- DEFINITIONS FOR FADE MASK --- */}
        <defs>
          <linearGradient id="fade-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="20%" stopColor="white" stopOpacity="0" /> 
            <stop offset="35%" stopColor="white" stopOpacity="1" />
            <stop offset="65%" stopColor="white" stopOpacity="1" />
            <stop offset="80%" stopColor="white" stopOpacity="0" /> 
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="scroll-mask">
            <rect x="0" y="0" width="200" height="600" fill="url(#fade-gradient)" />
          </mask>
        </defs>

        {/* --- 1. FIXED LINES WITH MOVEMENT --- */}
        {staticLines.map((yPos, i) => {
          const pathD = `M ${startX + 40} ${yPos} C ${startX + 150} ${yPos}, ${centerX - 150} ${centerY}, ${centerX - 50} ${centerY}`;
          return (
            <g key={`line-${i}`}>
              <path 
                d={pathD} 
                stroke="#475569" 
                strokeWidth="1.5" 
                fill="none" 
                opacity="0.2" 
              />
              <motion.path
                d={pathD}
                stroke="#cbd5e1" 
                strokeWidth="2"
                fill="none"
                strokeDasharray={dashArray}
                strokeLinecap="round"
                strokeOpacity="0.8"
                animate={{ strokeDashoffset: [480, 0] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.2
                }}
              />
            </g>
          );
        })}

        {/* --- 2. SCROLLING ICONS (BIGGER) --- */}
        <g mask="url(#scroll-mask)">
          {allInputs.map((item, index) => {
            let currentY = ((index * gap + offset) % totalHeight) - 50;
            if (currentY < 100 || currentY > 500) return null;

            return (
              <g key={item.id}>
                 {/* BIGGER CIRCLE: r="30" (60px diameter) */}
                 <circle cx={startX} cy={currentY} r="30" fill="white" stroke={item.color} strokeWidth="3" />
                 
                 {/* BIGGER ICON: 32x32px */}
                 <image href={item.logo} x={startX - 16} y={currentY - 16} width="32" height="32" />
              </g>
            );
          })}
        </g>

        {/* --- 3. CENTER HUB (Fixed) --- */}
        <g>
          <circle cx={centerX} cy={centerY} r="50" stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.2" />
          <circle cx={centerX} cy={centerY} r="65" stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.1" />
          <circle cx={centerX} cy={centerY} r="40" fill="#0f172a" stroke="#3b82f6" strokeWidth="4" />
          <text x={centerX} y={centerY + 8} textAnchor="middle" fill="white" fontWeight="bold" fontSize="24" style={{ fontFamily: 'sans-serif' }}>F</text>
        </g>

        {/* --- 4. RIGHT SIDE OUTPUTS (BIGGEST) --- */}
        {outputs.map((item) => {
          const pathD = `M ${centerX + 50} ${centerY} C ${centerX + 150} ${centerY}, ${endX - 150} ${item.y}, ${endX - 40} ${item.y}`;
          return (
            <g key={`out-${item.id}`}>
               <path d={pathD} stroke="#475569" strokeWidth="1.5" fill="none" opacity="0.2" />
               <motion.path 
                d={pathD} 
                stroke="#cbd5e1"
                strokeWidth="2" 
                strokeDasharray={dashArray}
                strokeLinecap="round"
                strokeOpacity="0.8"
                animate={{ strokeDashoffset: [480, 0] }} 
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 0.5 }} 
               />

               {/* BIGGEST CIRCLE: r="36" (72px diameter) */}
               <circle cx={endX} cy={item.y} r="36" fill="white" stroke={item.color} strokeWidth="3" />
               
               {/* BIGGEST ICON: 40x40px */}
               <image href={item.logo} x={endX - 20} y={item.y - 20} width="40" height="40" />
            </g>
          );
        })}

      </svg>
    </div>
  );
}