'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';

export default function PageLoader() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const logQueue = [
      "Initializing core modules...",
      "Resolving security handshake...",
      "Syncing workspace databases...",
      "Establishing terminal pipeline...",
      "Readying Developer Hub...",
    ];

    const timerIds: NodeJS.Timeout[] = [];

    logQueue.forEach((text, index) => {
      const id = setTimeout(() => {
        setLogs((prev) => [...prev, text]);
      }, (index + 1) * 300);
      timerIds.push(id);
    });

    return () => {
      timerIds.forEach((id) => clearTimeout(id));
    };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#030712] z-[9999] select-none overflow-hidden">
      {/* 1. Ambient Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_65%)] pointer-events-none" />

      {/* 2. Scanning Grid Layer (Subtle tech grid effect) */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
           style={{
             backgroundImage: 'linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)',
             backgroundSize: '24px 24px'
           }} 
      />

      {/* 3. Outer Neon Cyber Rings & Glowing Logo */}
      <div className="relative flex items-center justify-center w-48 h-48">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative flex items-center justify-center"
        >
          {/* Backlight Glow */}
          <div className="absolute w-24 h-24 bg-green-500/10 blur-2xl rounded-full" />
          
          {/* Slow outer dashed circle */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute w-36 h-36 rounded-full border border-dashed border-green-500/20 border-t-green-500/50"
          />

          {/* Faster inner solid double circle */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute w-28 h-28 rounded-full border border-double border-green-500/15 border-b-green-500/60 border-t-green-500/60"
          />

          {/* Dynamic Core Orb */}
          <motion.div
            animate={{
              scale: [1, 1.04, 1],
              boxShadow: [
                "0 0 20px rgba(16, 185, 129, 0.2)",
                "0 0 38px rgba(16, 185, 129, 0.55)",
                "0 0 20px rgba(16, 185, 129, 0.2)"
              ]
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center z-10 border border-green-400/30"
          >
            <Terminal className="w-8 h-8 text-black stroke-[2.5]" />
          </motion.div>
        </motion.div>
      </div>

      {/* 4. Branding & Title */}
      <div className="mt-4 flex flex-col items-center text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="flex items-center gap-2 font-mono text-[9px] tracking-[0.3em] text-green-400 font-semibold mb-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          SECURE SEED LINK ESTABLISHED
        </motion.div>

        <motion.h1
          initial={{ letterSpacing: "0.15em", opacity: 0 }}
          animate={{ letterSpacing: "0.25em", opacity: 1 }}
          transition={{ delay: 0.35, duration: 1.0, ease: "easeOut" }}
          className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-green-400 uppercase select-none mr-[-0.25em]"
        >
          CODE COMMANDOS
        </motion.h1>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100px" }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="h-[1px] bg-gradient-to-r from-transparent via-green-500/40 to-transparent mt-3 mb-6"
        />
      </div>

      {/* 5. Interactive Log Console */}
      <div className="w-72 max-w-sm rounded-xl border border-glass-border bg-[#0a0f1d]/50 backdrop-blur-md p-4 font-mono text-[10px] text-gray-400 space-y-2 shadow-2xl relative overflow-hidden">
        {/* Neon Light Scan Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ y: ["-100%", "250%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-full h-1/3 bg-gradient-to-b from-transparent via-green-500/5 to-transparent"
          />
        </div>

        {logs.length === 0 ? (
          <div className="text-gray-600 select-none animate-pulse flex items-center gap-1.5">
            <span className="w-1 h-3 bg-gray-600 animate-blink shrink-0" />
            Connecting to nodes...
          </div>
        ) : (
          logs.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-start gap-2 line-clamp-1"
            >
              <span className="text-green-500 shrink-0 select-none">&gt;</span>
              <span className="text-gray-300">{log}</span>
              {index === logs.length - 1 && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-1.5 h-3 bg-green-500 shrink-0 self-center"
                />
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* 6. Version Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="absolute bottom-6 font-mono text-[8px] tracking-widest text-gray-500 uppercase"
      >
        OPERATING SYSTEM V2.4.0
      </motion.p>
    </div>
  );
}
