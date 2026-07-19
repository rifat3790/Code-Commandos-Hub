'use client';

import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  MessageSquare, 
  Cpu, 
  Sliders, 
  ChevronUp, 
  ChevronDown, 
  Sparkles,
  Zap,
  VolumeX,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceCommandAssistant from './VoiceCommandAssistant';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuth } from '@/context/AuthContext';
import { 
  playKeyboardClick, 
  startSynthesizedRain, 
  stopSynthesizedRain, 
  startSynthesizedHum, 
  stopSynthesizedHum 
} from '@/lib/audioSynth';

export default function CommandersDock() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [threeDEnabled, setThreeDEnabled] = useState(true);
  const [showAmbianceMini, setShowAmbianceMini] = useState(false);
  const { settings, updateSettings } = useWorkspaceStore();
  const { dbUser } = useAuth();

  const isSuperAdmin = dbUser?.role === 'super_admin' || dbUser?.email === 'refayethossenmd@gmail.com';
  const isGloballyAllowed = settings?.allowCommandersDock === true;

  if (!isSuperAdmin && !isGloballyAllowed) {
    return null;
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Default to collapsed, unless user previously set a preference
    const saved = localStorage.getItem('commanders_dock_collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    } else {
      setIsCollapsed(true);
    }

    const mode3d = localStorage.getItem('3d_mode') !== 'false';
    setThreeDEnabled(mode3d);

    const handle3DChange = () => {
      setThreeDEnabled(localStorage.getItem('3d_mode') !== 'false');
    };
    window.addEventListener('3d_mode_changed', handle3DChange);
    return () => window.removeEventListener('3d_mode_changed', handle3DChange);
  }, []);

  const playClick = () => {
    const isGlobalClicks = localStorage.getItem('focus_global_clicks') === 'true';
    if (isGlobalClicks) {
      const type = (localStorage.getItem('focus_switch_type') || 'brown') as any;
      playKeyboardClick(type, 0.45);
    }
  };

  const triggerCommandMenu = () => {
    playClick();
    // Simulate Ctrl+K keydown to toggle command menu
    const event = new KeyboardEvent('keydown', {
      ctrlKey: true,
      key: 'k',
      bubbles: true
    });
    window.dispatchEvent(event);
  };

  const triggerChatWidget = () => {
    playClick();
    window.dispatchEvent(new CustomEvent('toggle_chatbot_widget'));
  };

  const toggle3DMode = () => {
    playClick();
    const newVal = !threeDEnabled;
    setThreeDEnabled(newVal);
    localStorage.setItem('3d_mode', String(newVal));
    window.dispatchEvent(new Event('3d_mode_changed'));
  };

  const switchTheme = async (themeName: 'default' | 'cyber' | 'aurora' | 'gold' | 'slate') => {
    playClick();
    const style3D = themeName === 'aurora' ? 'nebula' : themeName === 'cyber' ? 'cyber' : themeName === 'gold' ? 'gold' : 'default';
    await updateSettings({
      globalLayout: themeName,
      global3DStyle: style3D
    });
  };

  const applyAudioPreset = (preset: 'rain' | 'hum' | 'mute') => {
    playClick();
    if (preset === 'rain') {
      localStorage.setItem('zen_rain_volume', '35');
      startSynthesizedRain(35);
    } else if (preset === 'hum') {
      localStorage.setItem('zen_hum_volume', '25');
      startSynthesizedHum(25);
    } else {
      localStorage.setItem('zen_rain_volume', '0');
      localStorage.setItem('zen_hum_volume', '0');
      stopSynthesizedRain();
      stopSynthesizedHum();
    }
    setShowAmbianceMini(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[45] font-sans pointer-events-none select-none flex flex-col items-center">
      <AnimatePresence>
        {!isCollapsed ? (
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 26, stiffness: 330 }}
            className="bg-gray-950/75 backdrop-blur-2xl border border-glass-border rounded-2xl px-5 py-3 flex items-center gap-5 shadow-[0_15px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(168,85,247,0.12)] pointer-events-auto relative min-w-[340px]"
          >
            {/* Collapse toggle */}
            <button 
              onClick={() => { playClick(); setIsCollapsed(true); localStorage.setItem('commanders_dock_collapsed', 'true'); }}
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 p-0.5 rounded-full bg-gray-950 border border-glass-border text-gray-500 hover:text-purple-400 cursor-pointer hover:bg-gray-900 transition-all shadow-md"
              title="Collapse Dock"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Section 1: Quick Triggers */}
            <div className="flex items-center gap-2.5 border-r border-white/5 pr-4 shrink-0">
              <button
                onClick={triggerCommandMenu}
                className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-purple-400 hover:border-purple-500/30 transition-all cursor-pointer"
                title="Search Command Console (⌘K)"
              >
                <Terminal className="w-4 h-4" />
              </button>

              <button
                onClick={triggerChatWidget}
                className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-purple-400 hover:border-purple-500/30 transition-all cursor-pointer"
                title="Toggle Chat AI assistant"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              <VoiceCommandAssistant />
            </div>

            {/* Section 2: Ambiance & Performance */}
            <div className="flex items-center gap-2.5 border-r border-white/5 pr-4 shrink-0 relative">
              {/* Turbo Mode Toggler */}
              <button
                onClick={toggle3DMode}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  !threeDEnabled 
                    ? 'bg-green-500/10 border-green-500/35 text-green-400 hover:bg-green-500/20' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:border-white/20'
                }`}
                title={!threeDEnabled ? "Turbo Mode Active (3D Off)" : "Enable Turbo Mode (Saves CPU)"}
              >
                <Cpu className={`w-4 h-4 ${!threeDEnabled ? 'animate-pulse' : ''}`} />
              </button>

              {/* Quick Audio Preset */}
              <button
                onClick={() => { playClick(); setShowAmbianceMini(!showAmbianceMini); }}
                className={`p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-purple-400 hover:border-purple-500/30 transition-all cursor-pointer relative`}
                title="Quick Sounds"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showAmbianceMini && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: -45, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute -top-12 left-0 bg-gray-950 border border-glass-border p-1 rounded-xl flex gap-1 shadow-2xl z-50 shrink-0"
                  >
                    <button onClick={() => applyAudioPreset('rain')} className="text-[10px] font-bold px-2 py-1 hover:bg-white/5 rounded-lg text-blue-400 cursor-pointer">🌧️ Rain</button>
                    <button onClick={() => applyAudioPreset('hum')} className="text-[10px] font-bold px-2 py-1 hover:bg-white/5 rounded-lg text-indigo-400 cursor-pointer">🌌 Hum</button>
                    <button onClick={() => applyAudioPreset('mute')} className="text-[10px] font-bold px-2 py-1 hover:bg-red-500/10 text-red-400 rounded-lg cursor-pointer">🔇 Mute</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Section 3: Luxury Accent Swapper */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => switchTheme('cyber')}
                className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-400 hover:scale-125 transition-transform cursor-pointer shadow-[0_0_8px_#10B981]"
                title="Emerald Cyber theme"
              />
              <button
                onClick={() => switchTheme('aurora')}
                className="w-3.5 h-3.5 rounded-full bg-indigo-500 border border-indigo-400 hover:scale-125 transition-transform cursor-pointer shadow-[0_0_8px_#6366F1]"
                title="Cosmic Indigo theme"
              />
              <button
                onClick={() => switchTheme('gold')}
                className="w-3.5 h-3.5 rounded-full bg-yellow-500 border border-yellow-400 hover:scale-125 transition-transform cursor-pointer shadow-[0_0_8px_#F59E0B]"
                title="Royal Gold theme"
              />
              <button
                onClick={() => switchTheme('slate')}
                className="w-3.5 h-3.5 rounded-full bg-slate-500 border border-slate-400 hover:scale-125 transition-transform cursor-pointer shadow-[0_0_8px_#94A3B8]"
                title="Steel Slate theme"
              />
              <button
                onClick={() => switchTheme('default')}
                className="w-3.5 h-3.5 rounded-full bg-green-500 border border-green-400 hover:scale-125 transition-transform cursor-pointer shadow-[0_0_8px_#22C55E]"
                title="Default Mint theme"
              />
            </div>

          </motion.div>
        ) : (
          /* Collapsed Pill */
          <motion.button
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={() => { playClick(); setIsCollapsed(false); localStorage.setItem('commanders_dock_collapsed', 'false'); }}
            className="bg-purple-600 border border-purple-500 text-white rounded-full p-2.5 shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center cursor-pointer hover:bg-purple-500 hover:scale-105 transition-all pointer-events-auto"
            title="Expand Command Dock"
          >
            <ChevronUp className="w-4 h-4 animate-bounce" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
