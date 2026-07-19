'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Keyboard, 
  CloudRain, 
  Sliders, 
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuth } from '@/context/AuthContext';
import { 
  playKeyboardClick, 
  startSynthesizedRain, 
  stopSynthesizedRain, 
  startSynthesizedHum, 
  stopSynthesizedHum,
  KeyboardSwitchType 
} from '@/lib/audioSynth';

export default function ZenAmbianceCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Store settings
  const { settings, updateSettings } = useWorkspaceStore();
  const { dbUser } = useAuth();

  const isSuperAdmin = dbUser?.role === 'super_admin' || dbUser?.email === 'refayethossenmd@gmail.com';
  const isGloballyAllowed = settings?.allowCommandersDock === true;

  if (!isSuperAdmin && !isGloballyAllowed) {
    return null;
  }

  // Local Sound States
  const [rainVol, setRainVol] = useState(0);
  const [humVol, setHumVol] = useState(0);
  const [clicksEnabled, setClicksEnabled] = useState(false);
  const [switchType, setSwitchType] = useState<KeyboardSwitchType>('brown');
  const [threeDEnabled, setThreeDEnabled] = useState(true);

  // Initialize values from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 3D Mode
    const mode3D = localStorage.getItem('3d_mode') !== 'false';
    setThreeDEnabled(mode3D);

    // Clicks
    const clicks = localStorage.getItem('focus_global_clicks') === 'true';
    setClicksEnabled(clicks);

    const st = (localStorage.getItem('focus_switch_type') || 'brown') as KeyboardSwitchType;
    setSwitchType(st);

    // Read volumes
    const rVol = Number(localStorage.getItem('zen_rain_volume') || '0');
    const hVol = Number(localStorage.getItem('zen_hum_volume') || '0');
    setRainVol(rVol);
    setHumVol(hVol);

    // If volumes are positive on load, start synthesized audio
    if (rVol > 0) {
      setTimeout(() => startSynthesizedRain(rVol), 1000);
    }
    if (hVol > 0) {
      setTimeout(() => startSynthesizedHum(hVol), 1200);
    }

    // Handle clicks outside to close
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);

    // Listen to external 3D mode changes
    const check3DMode = () => {
      setThreeDEnabled(localStorage.getItem('3d_mode') !== 'false');
    };
    window.addEventListener('3d_mode_changed', check3DMode);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('3d_mode_changed', check3DMode);
    };
  }, []);

  // Sync volume changes to synthesized nodes
  const handleRainChange = (val: number) => {
    setRainVol(val);
    localStorage.setItem('zen_rain_volume', String(val));
    if (val > 0) {
      startSynthesizedRain(val);
    } else {
      stopSynthesizedRain();
    }
  };

  const handleHumChange = (val: number) => {
    setHumVol(val);
    localStorage.setItem('zen_hum_volume', String(val));
    if (val > 0) {
      startSynthesizedHum(val);
    } else {
      stopSynthesizedHum();
    }
  };

  // Keyboard clicks toggle
  const toggleClicks = () => {
    const newVal = !clicksEnabled;
    setClicksEnabled(newVal);
    localStorage.setItem('focus_global_clicks', String(newVal));
    if (newVal) {
      playKeyboardClick(switchType, 0.5);
    }
  };

  const handleSwitchChange = (type: KeyboardSwitchType) => {
    setSwitchType(type);
    localStorage.setItem('focus_switch_type', type);
    playKeyboardClick(type, 0.6);
  };

  // Turbo Mode (Toggler for 3D engine)
  const toggleTurboMode = () => {
    const nextVal = !threeDEnabled;
    setThreeDEnabled(nextVal);
    localStorage.setItem('3d_mode', String(nextVal));
    window.dispatchEvent(new Event('3d_mode_changed'));
  };

  // Presets applicator
  const applyPreset = async (preset: 'cosmic' | 'cyber' | 'royal' | 'silent') => {
    if (preset === 'cosmic') {
      // Cosmic Void
      handleHumChange(25);
      handleRainChange(0);
      setClicksEnabled(true);
      localStorage.setItem('focus_global_clicks', 'true');
      setThreeDEnabled(true);
      localStorage.setItem('3d_mode', 'true');
      window.dispatchEvent(new Event('3d_mode_changed'));
      await updateSettings({ globalLayout: 'aurora', global3DStyle: 'nebula' });
    } else if (preset === 'cyber') {
      // Cyber Rain
      handleRainChange(35);
      handleHumChange(12);
      setClicksEnabled(true);
      localStorage.setItem('focus_global_clicks', 'true');
      setThreeDEnabled(true);
      localStorage.setItem('3d_mode', 'true');
      window.dispatchEvent(new Event('3d_mode_changed'));
      await updateSettings({ globalLayout: 'cyber', global3DStyle: 'cyber' });
    } else if (preset === 'royal') {
      // Royal Chamber
      handleHumChange(20);
      handleRainChange(0);
      setThreeDEnabled(true);
      localStorage.setItem('3d_mode', 'true');
      window.dispatchEvent(new Event('3d_mode_changed'));
      await updateSettings({ globalLayout: 'gold', global3DStyle: 'gold' });
    } else if (preset === 'silent') {
      // Silent Focus / Performance mode
      handleRainChange(0);
      handleHumChange(0);
      setClicksEnabled(false);
      localStorage.setItem('focus_global_clicks', 'false');
      setThreeDEnabled(false);
      localStorage.setItem('3d_mode', 'false');
      window.dispatchEvent(new Event('3d_mode_changed'));
      await updateSettings({ globalLayout: 'slate', global3DStyle: 'default' });
    }
  };

  // Check if any sound is currently active
  const isSoundActive = rainVol > 0 || humVol > 0 || clicksEnabled;

  return (
    <div className="relative" ref={containerRef}>
      {/* Header Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 relative ${
          isOpen 
            ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
            : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
        }`}
        title="Zen Ambiance & Performance"
      >
        <Sparkles className={`w-4 h-4 ${isSoundActive ? 'text-purple-400 animate-pulse' : ''}`} />
        
        {/* Active wave visualizer indicator */}
        {isSoundActive && (
          <div className="flex gap-0.5 items-end h-2 w-3.5 px-0.5 pointer-events-none">
            <span className="w-[1.5px] h-full bg-purple-400 rounded-full animate-[bounce_0.6s_infinite]" />
            <span className="w-[1.5px] h-3/4 bg-purple-400 rounded-full animate-[bounce_0.6s_infinite_0.15s]" />
            <span className="w-[1.5px] h-1/2 bg-purple-400 rounded-full animate-[bounce_0.6s_infinite_0.3s]" />
          </div>
        )}
      </button>

      {/* Popover overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 bg-gray-950/90 backdrop-blur-xl border border-glass-border shadow-[0_0_40px_rgba(168,85,247,0.18)] rounded-2xl p-4 w-[285px] z-50 text-left space-y-4 font-sans"
          >
            {/* Title */}
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Zen Ambiance HUD</span>
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">v1.2.0</span>
            </div>

            {/* Performance Turbo Mode */}
            <div className="bg-gray-900/60 p-2.5 rounded-xl border border-white/5 space-y-1.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Cpu className={`w-3.5 h-3.5 ${!threeDEnabled ? 'text-green-400' : 'text-gray-400'}`} />
                  <span className="text-[11px] font-bold text-gray-200">Turbo Mode (Battery Saver)</span>
                </div>
                <button
                  onClick={toggleTurboMode}
                  className={`w-7 h-4 rounded-full transition-all relative flex items-center cursor-pointer ${
                    !threeDEnabled ? 'bg-green-500' : 'bg-gray-800'
                  }`}
                >
                  <span className={`w-3 h-3 bg-white rounded-full transition-all absolute ${
                    !threeDEnabled ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
              <p className="text-[9px] text-gray-500 leading-normal">
                {!threeDEnabled 
                  ? '3D graphics disabled. System resources maximized.' 
                  : 'WebGL Background active. Disable to improve page speed.'}
              </p>
            </div>

            {/* Ambient Soundscapes Mixer */}
            <div className="space-y-3">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <Sliders className="w-3 h-3 text-purple-400" />
                Soundscape Mixer
              </span>

              <div className="space-y-2.5">
                {/* Rain Volume */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-300 flex items-center gap-1">
                      🌧️ Rain Synth
                    </span>
                    <span className="font-mono text-gray-500">{rainVol}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={rainVol}
                    onChange={(e) => handleRainChange(Number(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Hum Volume */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-300 flex items-center gap-1">
                      <Moon className="w-3.5 h-3.5 text-indigo-400" /> Celestial Hum
                    </span>
                    <span className="font-mono text-gray-500">{humVol}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={humVol}
                    onChange={(e) => handleHumChange(Number(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Keyboard Click Sounds */}
            <div className="space-y-2 pt-1.5 border-t border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  ⌨️ Keyboard Clicks
                </span>
                <button
                  onClick={toggleClicks}
                  className={`w-7 h-4 rounded-full transition-all relative flex items-center cursor-pointer ${
                    clicksEnabled ? 'bg-purple-600' : 'bg-gray-800'
                  }`}
                >
                  <span className={`w-3 h-3 bg-white rounded-full transition-all absolute ${
                    clicksEnabled ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {clicksEnabled && (
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {(['blue', 'brown', 'red'] as KeyboardSwitchType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleSwitchChange(type)}
                      className={`text-[9px] font-bold py-1 px-1.5 rounded-lg border transition-all cursor-pointer ${
                        switchType === type 
                          ? 'bg-purple-500/20 border-purple-500 text-purple-400' 
                          : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {type === 'blue' ? 'MX Blue' : type === 'brown' ? 'MX Brown' : 'MX Red'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Luxury Presets */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                Ambiance Presets
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => applyPreset('cyber')}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-[10px] text-gray-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  <span>🌧️</span> Cyber Rain
                </button>
                <button
                  onClick={() => applyPreset('cosmic')}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-[10px] text-gray-300 hover:border-purple-500/40 hover:text-purple-400 transition-colors text-left cursor-pointer"
                >
                  <span>🌌</span> Cosmic Void
                </button>
                <button
                  onClick={() => applyPreset('royal')}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-[10px] text-gray-300 hover:border-yellow-500/40 hover:text-yellow-400 transition-colors text-left cursor-pointer"
                >
                  <span>🏆</span> Royal Focus
                </button>
                <button
                  onClick={() => applyPreset('silent')}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-[10px] text-gray-300 hover:border-blue-500/40 hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  <span>🌿</span> Silent Focus
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
