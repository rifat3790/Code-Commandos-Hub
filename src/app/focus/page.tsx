'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  SkipForward, 
  Plus, 
  Trash2, 
  Check, 
  Keyboard, 
  CloudRain, 
  Cpu, 
  Music, 
  ClipboardList, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  playKeyboardClick, 
  startSynthesizedRain, 
  stopSynthesizedRain, 
  updateRainVolume, 
  startSynthesizedHum, 
  stopSynthesizedHum, 
  updateHumVolume,
  KeyboardSwitchType
} from '@/lib/audioSynth';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

const LOFI_STREAMS = [
  { name: 'Coding Lofi Beats', url: 'https://streams.ilovemusic.de/iloveradio17.mp3', desc: 'Chill lofi study beats to code to.' },
  { name: 'Retro Synthwave', url: 'https://streams.ilovemusic.de/iloveradio23.mp3', desc: 'Outrun and vaporwave high-octane neon tracks.' },
  { name: 'Cyberpunk Ambient', url: 'https://stream.zeno.fm/f3b5u78uq7zuv', desc: 'Heavy industrial digital atmosphere.' }
];

export default function FocusPage() {
  const [isClient, setIsClient] = useState(false);
  
  // Custom switch types
  const [switchType, setSwitchType] = useState<KeyboardSwitchType>('brown');
  const [isGlobalClicks, setIsGlobalClicks] = useState(false);
  
  // Audio state
  const [volumeClicks, setVolumeClicks] = useState(50);
  const [volumeRain, setVolumeRain] = useState(0);
  const [volumeHum, setVolumeHum] = useState(0);
  
  // Music player states
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [activeStreamIndex, setActiveStreamIndex] = useState(0);
  const [volumeMusic, setVolumeMusic] = useState(30);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Notepad states
  const [notepadText, setNotepadText] = useState('');
  
  // Task state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  // Clock
  const [currentTime, setCurrentTime] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    
    // Load local storage states
    if (typeof window !== 'undefined') {
      const savedGlobal = localStorage.getItem('focus_global_clicks');
      if (savedGlobal) setIsGlobalClicks(savedGlobal === 'true');

      const savedType = localStorage.getItem('focus_switch_type');
      if (savedType) setSwitchType(savedType as KeyboardSwitchType);

      const savedTasks = localStorage.getItem('focus_tasks');
      if (savedTasks) setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save tasks helper
  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('focus_tasks', JSON.stringify(newTasks));
  };

  // Sync settings to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('focus_global_clicks', String(isGlobalClicks));
      localStorage.setItem('focus_switch_type', switchType);
    }
  }, [isGlobalClicks, switchType, isClient]);

  // Handle ambient Rain generator changes
  useEffect(() => {
    if (!isClient) return;
    if (volumeRain > 0) {
      startSynthesizedRain(volumeRain / 100);
    } else {
      stopSynthesizedRain();
    }
    return () => stopSynthesizedRain();
  }, [volumeRain, isClient]);

  // Handle ambient Hum generator changes
  useEffect(() => {
    if (!isClient) return;
    if (volumeHum > 0) {
      startSynthesizedHum(volumeHum / 100);
    } else {
      stopSynthesizedHum();
    }
    return () => stopSynthesizedHum();
  }, [volumeHum, isClient]);

  // Handle HTML5 stream audio player changes
  useEffect(() => {
    if (!isClient) return;

    if (isMusicPlaying) {
      if (audioRef.current) {
        audioRef.current.src = LOFI_STREAMS[activeStreamIndex].url;
        audioRef.current.volume = volumeMusic / 100;
        setStreamError(null);
        audioRef.current.play().catch(err => {
          console.error("Audio stream playback failed:", err);
          setStreamError("Failed to connect to stream server. Retrying...");
          setIsMusicPlaying(false);
        });
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isMusicPlaying, activeStreamIndex, isClient]);

  // Handle music volume updates
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volumeMusic / 100;
    }
  }, [volumeMusic]);

  // Handle local keystrokes inside Notepad
  const handleNotepadKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Avoid double clicking on trigger keys
    playKeyboardClick(switchType, volumeClicks / 100);
  };

  // Task Handlers
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false
    };
    saveTasks([...tasks, newTask]);
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
  };

  if (!isClient) return null;

  return (
    <main className="min-h-screen p-4 md:p-8 bg-[#030712] text-[#f3f4f6] relative select-none pb-24 overflow-y-auto">
      {/* Hidden audio element for streams */}
      <audio ref={audioRef} crossOrigin="anonymous" loop />

      {/* 1. Ambient Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header with Digital Clock */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-glass-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
              <Headphones className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-white via-gray-200 to-green-400 bg-clip-text text-transparent uppercase tracking-wider">
                Focus Coding Studio
              </h1>
              <p className="text-xs text-gray-400 font-mono">ENHANCE YOUR COGNITIVE PROGRAMMING FLOW</p>
            </div>
          </div>
        </div>

        {/* Digital Clock */}
        <div className="bg-[#0a0f1d]/60 border border-glass-border rounded-xl px-5 py-2 flex flex-col items-center shadow-xl">
          <span className="text-xs font-mono text-green-400 font-bold tracking-widest uppercase mb-0.5">Studio Clock</span>
          <span className="text-xl font-bold font-mono text-white tracking-widest">{currentTime}</span>
        </div>
      </div>

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Mechanical Synthesizers & Sound Mixer */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Keyboard Switch Select */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-600" />
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <Keyboard className="w-5 h-5 text-green-400" />
                <h3 className="font-bold text-sm tracking-wider uppercase text-white font-mono">Mechanical Keyclick Synthesizer</h3>
              </div>
              <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/25 rounded-md px-2 py-0.5 font-bold font-mono">
                WEB AUDIO API
              </span>
            </div>

            {/* Switch Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Blue Switch */}
              <button 
                onClick={() => setSwitchType('blue')}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                  switchType === 'blue' 
                    ? 'border-blue-500/50 bg-blue-950/20 shadow-lg shadow-blue-500/10' 
                    : 'border-glass-border bg-[#0a0f1d]/30 hover:border-white/10 hover:bg-glass-hover'
                }`}
              >
                <div className="w-6 h-6 rounded bg-blue-500 mb-3 flex items-center justify-center text-xs font-bold text-black font-mono shadow-md">B</div>
                <h4 className="font-bold text-xs text-white">MX Blue (Clicky)</h4>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Crisp metallic tactile snap. Very satisfying and loud click.</p>
              </button>

              {/* Brown Switch */}
              <button 
                onClick={() => setSwitchType('brown')}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                  switchType === 'brown' 
                    ? 'border-yellow-600/50 bg-amber-950/20 shadow-lg shadow-yellow-500/10' 
                    : 'border-glass-border bg-[#0a0f1d]/30 hover:border-white/10 hover:bg-glass-hover'
                }`}
              >
                <div className="w-6 h-6 rounded bg-amber-700 mb-3 flex items-center justify-center text-xs font-bold text-black font-mono shadow-md">Br</div>
                <h4 className="font-bold text-xs text-white">MX Brown (Tactile)</h4>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Quiet plastic thud with moderate tactile feel. Balanced option.</p>
              </button>

              {/* Red Switch */}
              <button 
                onClick={() => setSwitchType('red')}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                  switchType === 'red' 
                    ? 'border-red-500/50 bg-red-950/20 shadow-lg shadow-red-500/10' 
                    : 'border-glass-border bg-[#0a0f1d]/30 hover:border-white/10 hover:bg-glass-hover'
                }`}
              >
                <div className="w-6 h-6 rounded bg-red-600 mb-3 flex items-center justify-center text-xs font-bold text-black font-mono shadow-md">R</div>
                <h4 className="font-bold text-xs text-white">MX Red (Linear)</h4>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Smooth linear travel with a deep bottom-out thud. Quietest.</p>
              </button>
            </div>

            {/* Slider & Global Toggle */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-glass-border pt-5">
              <div className="flex items-center gap-3 w-full md:w-1/2">
                <Volume2 className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-400 font-mono w-16">Volume: {volumeClicks}%</span>
                <input 
                  type="range" 
                  min="0" 
                  max="100"
                  value={volumeClicks}
                  onChange={(e) => setVolumeClicks(Number(e.target.value))}
                  className="w-full accent-green-500 cursor-pointer h-1 bg-gray-800 rounded-lg appearance-none"
                />
              </div>

              {/* Global Keypress Toggle */}
              <div className="flex items-center justify-between bg-black/30 border border-glass-border rounded-xl p-3 w-full md:w-auto gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white font-mono">Global typing clicks</h4>
                  <p className="text-[9px] text-gray-500 leading-tight">Plays clicks typing anywhere on the website</p>
                </div>
                <button
                  onClick={() => setIsGlobalClicks(!isGlobalClicks)}
                  className={`w-11 h-6 rounded-full p-1 transition-all ${isGlobalClicks ? 'bg-green-500' : 'bg-gray-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform ${isGlobalClicks ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Ambient Sound Mixer & Lofi Radio */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <Music className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm tracking-wider uppercase text-white font-mono">Ambience Sound Mixer</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Rain Sound Synthesizer Slider */}
              <div className="bg-black/25 border border-glass-border rounded-xl p-4 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white font-mono">Rain Sound</span>
                  </div>
                  {volumeRain > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block mb-1">Synthesized Noise</span>
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="range" 
                      min="0" 
                      max="100"
                      value={volumeRain}
                      onChange={(e) => setVolumeRain(Number(e.target.value))}
                      className="w-full accent-blue-400 cursor-pointer h-1 bg-gray-800 rounded-lg appearance-none"
                    />
                    <span className="text-[10px] text-gray-400 font-mono w-8 text-right">{volumeRain}%</span>
                  </div>
                </div>
              </div>

              {/* Fan/Server Hum Synthesizer Slider */}
              <div className="bg-black/25 border border-glass-border rounded-xl p-4 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white font-mono">Server Hum</span>
                  </div>
                  {volumeHum > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block mb-1">FM 60Hz Generator</span>
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="range" 
                      min="0" 
                      max="100"
                      value={volumeHum}
                      onChange={(e) => setVolumeHum(Number(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer h-1 bg-gray-800 rounded-lg appearance-none"
                    />
                    <span className="text-[10px] text-gray-400 font-mono w-8 text-right">{volumeHum}%</span>
                  </div>
                </div>
              </div>

              {/* Lofi Beats player */}
              <div className="bg-black/25 border border-glass-border rounded-xl p-4 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white font-mono">Music Stream</span>
                  </div>
                  {isMusicPlaying && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />}
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block mb-1">LOFI Girl Web Radio</span>
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="range" 
                      min="0" 
                      max="100"
                      value={volumeMusic}
                      onChange={(e) => setVolumeMusic(Number(e.target.value))}
                      className="w-full accent-purple-400 cursor-pointer h-1 bg-gray-800 rounded-lg appearance-none"
                    />
                    <span className="text-[10px] text-gray-400 font-mono w-8 text-right">{volumeMusic}%</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Stream Selector Panel */}
            <div className="mt-6 border-t border-glass-border pt-5">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono mb-3">Lofi Radio Stations</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {LOFI_STREAMS.map((stream, idx) => {
                  const isActive = activeStreamIndex === idx;
                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl border flex flex-col justify-between select-none ${
                        isActive 
                          ? 'border-purple-500/40 bg-purple-950/10' 
                          : 'border-glass-border bg-[#0a0f1d]/20 hover:border-white/5 hover:bg-glass-hover'
                      }`}
                    >
                      <div>
                        <h5 className={`text-xs font-bold ${isActive ? 'text-purple-400' : 'text-white'}`}>{stream.name}</h5>
                        <p className="text-[9px] text-gray-500 mt-1 leading-normal">{stream.desc}</p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {isActive && isMusicPlaying ? (
                          <button 
                            onClick={() => setIsMusicPlaying(false)}
                            className="px-2.5 py-1 text-[9px] rounded-md font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 shadow-md transition-colors"
                          >
                            <Pause className="w-3 h-3" /> PAUSE
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              setActiveStreamIndex(idx);
                              setIsMusicPlaying(true);
                            }}
                            className="px-2.5 py-1 text-[9px] rounded-md font-bold bg-[#0d1527] hover:bg-glass-hover border border-glass-border text-gray-300 flex items-center gap-1 transition-colors"
                          >
                            <Play className="w-3 h-3" /> CONNECT
                          </button>
                        )}
                        
                        {isActive && isMusicPlaying && (
                          <div className="flex items-end gap-0.5 h-3">
                            <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 1.1 }} className="w-0.5 bg-purple-500" />
                            <motion.div animate={{ height: [8, 3, 8] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-purple-500" />
                            <motion.div animate={{ height: [2, 10, 2] }} transition={{ repeat: Infinity, duration: 1.3 }} className="w-0.5 bg-purple-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {streamError && (
                <div className="mt-3 text-[10px] text-red-400 font-mono flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-400 rounded-full animate-ping" />
                  {streamError}
                </div>
              )}
            </div>

          </div>

          {/* Section 3: Keyboard Click Sandbox / Typing Notepad */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-green-400" />
              <h3 className="font-bold text-sm tracking-wider uppercase text-white font-mono">Notepad Sandbox</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-normal">
              Type or paste code snippets here to hear and feel the mechanical keyboard keystroke clicks. 
            </p>
            
            <textarea 
              value={notepadText}
              onChange={(e) => setNotepadText(e.target.value)}
              onKeyDown={handleNotepadKeyDown}
              placeholder="Start coding here... (e.g. {% schema %} or function main() { ... })"
              className="w-full h-40 bg-black/35 border border-glass-border rounded-xl p-4 font-mono text-xs text-gray-300 focus:outline-none focus:border-green-500/50 shadow-inner resize-none transition-colors"
            />
            <div className="flex justify-between items-center mt-2.5">
              <span className="text-[10px] text-gray-500 font-mono">Characters: {notepadText.length} | Lines: {notepadText.split('\n').length}</span>
              <button 
                onClick={() => setNotepadText('')}
                className="text-[10px] text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                Clear Sandbox
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Cyber Task Manager & Visualizer */}
        <div className="space-y-6">
          
          {/* CSS Beats Visualizer */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between h-44">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
            <span className="text-xs font-mono text-gray-400 tracking-widest uppercase flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />
              Audio Visualizer HUD
            </span>
            
            {/* Visualizer bars bouncing dynamically if music is playing */}
            <div className="flex justify-center items-end h-20 gap-1.5 px-4">
              {[...Array(24)].map((_, idx) => {
                const heights = [
                  [12, 45, 12], [8, 30, 8], [24, 70, 24], [18, 55, 18],
                  [32, 85, 32], [28, 65, 28], [14, 40, 14], [6, 20, 6],
                  [10, 50, 10], [16, 60, 16], [22, 75, 22], [30, 90, 30],
                  [26, 80, 26], [20, 65, 20], [12, 45, 12], [8, 30, 8],
                  [24, 70, 24], [18, 55, 18], [32, 85, 32], [28, 65, 28],
                  [14, 40, 14], [6, 20, 6], [10, 50, 10], [16, 60, 16]
                ];
                const animDuration = [
                  0.7, 0.9, 1.2, 0.8,
                  1.4, 1.1, 0.9, 0.6,
                  1.0, 1.3, 0.8, 1.5,
                  1.2, 1.0, 0.7, 0.9,
                  1.2, 0.8, 1.4, 1.1,
                  0.9, 0.6, 1.0, 1.3
                ];
                return (
                  <motion.div 
                    key={idx}
                    animate={isMusicPlaying ? { height: heights[idx] } : { height: 6 }}
                    transition={{
                      repeat: Infinity,
                      duration: animDuration[idx],
                      ease: "easeInOut"
                    }}
                    className={`w-1 rounded-t bg-gradient-to-t ${
                      idx < 8 
                        ? 'from-blue-600 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]' 
                        : idx < 16 
                          ? 'from-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]' 
                          : 'from-purple-500 to-green-400 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                    }`}
                  />
                );
              })}
            </div>
            
            <p className="text-[9px] text-gray-500 font-mono text-center tracking-wider">
              {isMusicPlaying ? 'SYNCHRONIZING DIGITAL CARRIER WAVE...' : 'STANDBY - WAITING FOR CARRIER...'}
            </p>
          </div>

          {/* Task List / Session Goals */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between h-[436px]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
            
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <ClipboardList className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-sm tracking-wider uppercase text-white font-mono">Session Focus Goals</h3>
            </div>

            {/* Input Form */}
            <form onSubmit={handleAddTask} className="flex gap-2 mb-4 shrink-0">
              <input 
                type="text" 
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Enter workspace task..."
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-black/35 border border-glass-border text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-gray-650"
              />
              <button 
                type="submit"
                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Scrollable Tasks container */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              <AnimatePresence initial={false}>
                {tasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <p className="text-xs text-gray-500 font-mono select-none">No active tasks in this queue.</p>
                    <p className="text-[10px] text-gray-650 mt-1">Add items above to start tracking!</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`p-3 rounded-xl border flex items-center justify-between select-none ${
                        task.completed 
                          ? 'border-green-500/10 bg-green-950/5 text-gray-500 line-through' 
                          : 'border-glass-border bg-[#0a0f1d]/25 hover:border-white/5 text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                        <button
                          type="button"
                          onClick={() => toggleTask(task.id)}
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            task.completed 
                              ? 'border-green-500 bg-green-500 text-black' 
                              : 'border-glass-border hover:border-blue-400'
                          }`}
                        >
                          {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <span className="text-xs truncate">{task.text}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 shrink-0 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
            
            {/* Task stats footer */}
            {tasks.length > 0 && (
              <div className="mt-4 border-t border-glass-border pt-3.5 shrink-0 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>Completed: {tasks.filter(t => t.completed).length} / {tasks.length}</span>
                <button 
                  onClick={() => saveTasks([])}
                  className="hover:text-red-400 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </main>
  );
}
