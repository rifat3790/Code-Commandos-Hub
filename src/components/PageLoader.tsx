'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';

export default function PageLoader() {
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
          <div suppressHydrationWarning={true} className="absolute w-24 h-24 bg-green-500/15 blur-2xl rounded-full" />
          
          {/* Fast outer dashed circle (reduced duration to 4.5s) */}
          <motion.div
            suppressHydrationWarning={true}
            animate={{ rotate: 360 }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
            className="absolute w-32 h-32 rounded-full border border-dashed border-green-500/30 border-t-green-500"
          />

          {/* Faster inner solid double circle (reduced duration to 2.8s) */}
          <motion.div
            suppressHydrationWarning={true}
            animate={{ rotate: -360 }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
            className="absolute w-24 h-24 rounded-full border border-double border-green-500/20 border-b-green-500 border-t-green-500"
          />

          {/* Fast Dynamic Core Orb (reduced duration to 1.2s) */}
          <motion.div
            suppressHydrationWarning={true}
            animate={{
              scale: [1, 1.08, 1],
              boxShadow: [
                "0 0 15px rgba(16, 185, 129, 0.3)",
                "0 0 35px rgba(16, 185, 129, 0.7)",
                "0 0 15px rgba(16, 185, 129, 0.3)"
              ]
            }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center z-10 border border-green-400"
          >
            <Terminal className="w-7 h-7 text-black stroke-[3]" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
