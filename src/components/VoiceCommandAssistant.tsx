'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, VolumeX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  startSynthesizedRain, 
  startSynthesizedHum, 
  startSynthesizedCosmic,
  stopSynthesizedRain, 
  stopSynthesizedHum,
  stopSynthesizedCosmic,
  playKeyboardClick
} from '@/lib/audioSynth';

export default function VoiceCommandAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [statusMsg, setStatusMsg] = useState('Click to speak');
  const [successCommand, setSuccessCommand] = useState<string | null>(null);
  
  const router = useRouter();
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatusMsg('Speech recognition not supported in this browser.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      setStatusMsg('Listening for commands...');
      setSpokenText('');
      setSuccessCommand(null);
    };

    rec.onresult = (event: any) => {
      const result = event.results[0][0].transcript.toLowerCase().trim();
      setSpokenText(result);
      processVoiceCommand(result);
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setStatusMsg('Microphone access denied.');
      } else {
        setStatusMsg(`Error: ${event.error}`);
      }
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Voice Assistant is not supported in this browser.');
      return;
    }

    playKeyboardClick('brown', 0.55);

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  const processVoiceCommand = (command: string) => {
    // Navigations
    if (command.includes('workspace') || command.includes('go to workspace')) {
      triggerSuccess('Workspace Navigation', () => router.push('/workspace'));
    } else if (command.includes('meeting') || command.includes('go to meetings')) {
      triggerSuccess('Meetings Navigation', () => router.push('/meetings'));
    } else if (command.includes('tracker') || command.includes('go to tracker')) {
      triggerSuccess('Order Tracker Navigation', () => router.push('/tracker'));
    } else if (command.includes('personal') || command.includes('go to personal')) {
      triggerSuccess('Personal Projects Navigation', () => router.push('/personal-projects'));
    } else if (command.includes('focus') || command.includes('go to focus')) {
      triggerSuccess('Focus Studio Navigation', () => router.push('/focus'));
    } else if (command.includes('settings') || command.includes('go to settings')) {
      triggerSuccess('Settings Navigation', () => router.push('/settings'));
    } else if (command.includes('home') || command.includes('go to dashboard')) {
      triggerSuccess('Dashboard Navigation', () => router.push('/'));
    }
    
    // Ambient Synths
    else if (command.includes('play rain') || command.includes('start rain')) {
      triggerSuccess('Ambient Rain Started', () => {
        localStorage.setItem('zen_rain_volume', '35');
        startSynthesizedRain(35);
      });
    } else if (command.includes('play hum') || command.includes('start hum')) {
      triggerSuccess('Ambient Hum Started', () => {
        localStorage.setItem('zen_hum_volume', '25');
        startSynthesizedHum(25);
      });
    } else if (command.includes('play cosmic') || command.includes('start cosmic') || command.includes('cosmic wind')) {
      triggerSuccess('Cosmic Wind Started', () => {
        localStorage.setItem('zen_cosmic_volume', '30');
        startSynthesizedCosmic(30);
      });
    } else if (command.includes('mute') || command.includes('stop sound') || command.includes('silence')) {
      triggerSuccess('Ambient Muted', () => {
        localStorage.setItem('zen_rain_volume', '0');
        localStorage.setItem('zen_hum_volume', '0');
        localStorage.setItem('zen_cosmic_volume', '0');
        stopSynthesizedRain();
        stopSynthesizedHum();
        stopSynthesizedCosmic();
      });
    }

    // Controls
    else if (command.includes('turbo') || command.includes('turbo mode') || command.includes('graphics')) {
      triggerSuccess('Turbo Graphics Toggled', () => {
        const current3d = localStorage.getItem('3d_mode') !== 'false';
        localStorage.setItem('3d_mode', String(!current3d));
        window.dispatchEvent(new Event('storage'));
      });
    } else if (command.includes('search') || command.includes('open search') || command.includes('command console')) {
      triggerSuccess('Search Triggered', () => {
        // Dispatches standard Ctrl+K key event
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: true,
          bubbles: true
        });
        window.dispatchEvent(event);
      });
    }

    // Default Fallback
    else {
      setStatusMsg(`Command not recognized: "${command}"`);
      const isClicks = localStorage.getItem('focus_global_clicks') === 'true';
      if (isClicks) {
        playKeyboardClick('brown', 0.8);
      }
    }
  };

  const triggerSuccess = (label: string, action: () => void) => {
    setSuccessCommand(label);
    setStatusMsg(`Executing: ${label}`);
    
    // Play cherry keyboard sound on recognition match
    const isClicks = localStorage.getItem('focus_global_clicks') === 'true';
    if (isClicks) {
      playKeyboardClick('brown', 0.9);
    }

    setTimeout(() => {
      action();
      setIsListening(false);
      setSuccessCommand(null);
    }, 1000);
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Listening Status Popup HUD */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="absolute bottom-full mb-3 bg-gray-950/95 border border-purple-500/30 backdrop-blur-md rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(168,85,247,0.15)] flex flex-col items-center gap-3 w-52 text-center z-50 pointer-events-auto"
          >
            {/* Pulsing wave animation */}
            <div className="relative flex items-center justify-center w-10 h-10">
              <span className="absolute w-8 h-8 rounded-full bg-purple-500/25 animate-ping" />
              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                <Mic className="w-3.5 h-3.5 text-white animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Voice Assistant</span>
              <span className={`text-[11px] font-bold block ${successCommand ? 'text-green-400 font-extrabold animate-bounce' : 'text-white'}`}>
                {statusMsg}
              </span>
            </div>

            {spokenText && (
              <div className="bg-black/40 border border-white/5 rounded-lg px-2.5 py-1.5 w-full text-[10px] text-gray-400 font-mono italic truncate select-none">
                "{spokenText}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic trigger button */}
      <button
        onClick={toggleListening}
        className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
          isListening 
            ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-105' 
            : 'bg-black/40 border-glass-border text-gray-400 hover:text-purple-400 hover:border-purple-500/30'
        }`}
        title="Voice Command Assistant"
      >
        <Mic className="w-4 h-4" />
      </button>
    </div>
  );
}
