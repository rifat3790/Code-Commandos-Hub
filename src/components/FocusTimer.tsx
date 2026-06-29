'use client';

import React, { useState, useEffect } from 'react';
import { Play, Square, TimerReset, Settings, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FocusTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [isHovered, setIsHovered] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [focusLength, setFocusLength] = useState(25);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      // Play sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
      
      if (mode === 'focus') {
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('focus');
        setTimeLeft(focusLength * 60);
      }
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, focusLength]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? focusLength * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleApplySettings = () => {
    setShowSettings(false);
    if (!isActive && mode === 'focus') {
      setTimeLeft(focusLength * 60);
    }
  };

  return (
    <div 
      className="relative flex items-center bg-gray-950 border border-glass-border rounded-xl shadow-lg ml-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-center px-3 py-1.5 gap-2 transition-colors ${isActive && mode === 'focus' ? 'text-brand-green' : isActive ? 'text-blue-400' : 'text-gray-400'}`} style={{ color: isActive && mode === 'focus' ? 'var(--color-brand-green)' : undefined }}>
        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'animate-pulse' : ''} ${isActive && mode === 'focus' ? 'bg-brand-green' : isActive ? 'bg-blue-400' : 'bg-gray-500'}`} style={{ backgroundColor: isActive && mode === 'focus' ? 'var(--color-brand-green)' : undefined }} />
        <span className="font-mono font-bold text-sm select-none w-12 text-center">{formatTime(timeLeft)}</span>
      </div>

      <AnimatePresence>
        {(isHovered || isActive) && (
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center overflow-hidden pr-2 border-l border-white/5"
          >
            <button 
              onClick={toggleTimer}
              className="p-1.5 mx-1 text-gray-400 hover:text-white transition-colors"
            >
              {isActive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button 
              onClick={resetTimer}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <TimerReset className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full right-0 mt-2 p-3 bg-gray-900 border border-glass-border rounded-xl shadow-2xl z-50 w-48"
          >
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Focus Length (min)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={focusLength}
                onChange={(e) => setFocusLength(Number(e.target.value))}
                className="w-full bg-gray-950 border border-glass-border rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                style={{ '--tw-ring-color': 'var(--color-brand-green)' } as any}
                min="1"
                max="120"
              />
              <button 
                onClick={handleApplySettings}
                className="p-1.5 bg-brand-green/20 text-brand-green rounded-lg hover:bg-brand-green/30 transition-colors"
                style={{ color: 'var(--color-brand-green)' }}
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
