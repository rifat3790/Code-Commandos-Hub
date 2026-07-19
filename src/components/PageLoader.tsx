'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function PageLoader() {
  const layoutTheme = useWorkspaceStore(state => state.settings?.globalLayout) || 'default';

  const themeColors = {
    default: {
      glow: 'bg-green-500/15',
      ring1: 'border-green-500/30 border-t-green-500',
      ring2: 'border-green-500/20 border-b-green-500 border-t-green-500',
      core: 'from-green-500 to-emerald-600 border-green-400',
      icon: 'text-black'
    },
    cyber: {
      glow: 'bg-emerald-500/15',
      ring1: 'border-emerald-500/30 border-t-emerald-500',
      ring2: 'border-emerald-500/20 border-b-emerald-500 border-t-emerald-500',
      core: 'from-emerald-500 to-cyan-600 border-emerald-400',
      icon: 'text-black'
    },
    aurora: {
      glow: 'bg-indigo-500/15',
      ring1: 'border-indigo-500/30 border-t-indigo-500',
      ring2: 'border-indigo-500/20 border-b-indigo-500 border-t-indigo-500',
      core: 'from-indigo-500 to-purple-600 border-indigo-400',
      icon: 'text-white'
    },
    gold: {
      glow: 'bg-yellow-500/15',
      ring1: 'border-yellow-500/30 border-t-yellow-500',
      ring2: 'border-yellow-500/20 border-b-yellow-500 border-t-yellow-500',
      core: 'from-yellow-500 to-amber-600 border-yellow-400',
      icon: 'text-black'
    },
    slate: {
      glow: 'bg-slate-500/15',
      ring1: 'border-slate-500/30 border-t-slate-500',
      ring2: 'border-slate-500/20 border-b-slate-500 border-t-slate-500',
      core: 'from-slate-500 to-zinc-650 border-slate-400',
      icon: 'text-white'
    }
  };

  const colors = themeColors[layoutTheme as keyof typeof themeColors] || themeColors.default;

  return (
    <div suppressHydrationWarning={true} className="fixed inset-0 flex flex-col items-center justify-center bg-[#030712] z-[9999] select-none overflow-hidden">
      {/* 1. Ambient Radial Glow */}
      <div suppressHydrationWarning={true} className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_60%)] pointer-events-none" />

      {/* 2. Scanning Grid Layer */}
      <div suppressHydrationWarning={true} className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{
             backgroundImage: 'linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)',
             backgroundSize: '24px 24px'
           }} 
      />

      {/* 3. Outer Neon Cyber Rings & Glowing Logo */}
      <div suppressHydrationWarning={true} className="relative flex items-center justify-center w-48 h-48">
        <motion.div
          suppressHydrationWarning={true}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative flex items-center justify-center"
        >
          {/* Backlight Glow */}
          <div suppressHydrationWarning={true} className={`absolute w-24 h-24 blur-2xl rounded-full ${colors.glow}`} />
          
          {/* Fast outer dashed circle */}
          <motion.div
            suppressHydrationWarning={true}
            animate={{ rotate: 360 }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
            className={`absolute w-32 h-32 rounded-full border border-dashed ${colors.ring1}`}
          />

          {/* Faster inner solid double circle */}
          <motion.div
            suppressHydrationWarning={true}
            animate={{ rotate: -360 }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
            className={`absolute w-24 h-24 rounded-full border border-double ${colors.ring2}`}
          />

          {/* Fast Dynamic Core Orb */}
          <motion.div
            suppressHydrationWarning={true}
            animate={{
              scale: [1, 1.08, 1],
              boxShadow: [
                "0 0 15px rgba(168, 85, 247, 0.25)",
                "0 0 35px rgba(168, 85, 247, 0.55)",
                "0 0 15px rgba(168, 85, 247, 0.25)"
              ]
            }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className={`relative w-14 h-14 rounded-2xl bg-gradient-to-tr flex items-center justify-center z-10 border ${colors.core}`}
          >
            <Terminal className={`w-7 h-7 stroke-[3] ${colors.icon}`} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
