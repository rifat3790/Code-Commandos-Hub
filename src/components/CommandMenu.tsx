'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Home, 
  Settings, 
  MessageSquare, 
  Trophy, 
  ShieldCheck, 
  Briefcase, 
  StickyNote, 
  FileCode,
  LogOut,
  Command,
  Video,
  Layers,
  Gauge,
  Database,
  Headphones,
  Download,
  User,
  Cpu,
  Moon,
  CloudRain,
  Volume2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
  playKeyboardClick, 
  startSynthesizedRain, 
  stopSynthesizedRain, 
  startSynthesizedHum, 
  stopSynthesizedHum 
} from '@/lib/audioSynth';

export default function CommandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { user, dbUser } = useAuth();
  
  // Fetch store data
  const { settings, notes, templates, updateSettings } = useWorkspaceStore();

  // Helper for sound feedback
  const playClickFeedback = () => {
    const isGlobalClicks = localStorage.getItem('focus_global_clicks') === 'true';
    if (isGlobalClicks) {
      const switchType = (localStorage.getItem('focus_switch_type') || 'brown') as any;
      playKeyboardClick(switchType, 0.45);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        playClickFeedback();
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        playClickFeedback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Preset Applicator standalone support
  const applyPreset = async (preset: 'cosmic' | 'cyber' | 'royal' | 'silent') => {
    if (preset === 'cosmic') {
      localStorage.setItem('zen_hum_volume', '25');
      localStorage.setItem('zen_rain_volume', '0');
      startSynthesizedHum(25);
      stopSynthesizedRain();
      localStorage.setItem('focus_global_clicks', 'true');
      localStorage.setItem('3d_mode', 'true');
      window.dispatchEvent(new Event('3d_mode_changed'));
      await updateSettings({ globalLayout: 'aurora', global3DStyle: 'nebula' });
    } else if (preset === 'cyber') {
      localStorage.setItem('zen_rain_volume', '35');
      localStorage.setItem('zen_hum_volume', '12');
      startSynthesizedRain(35);
      startSynthesizedHum(12);
      localStorage.setItem('focus_global_clicks', 'true');
      localStorage.setItem('3d_mode', 'true');
      window.dispatchEvent(new Event('3d_mode_changed'));
      await updateSettings({ globalLayout: 'cyber', global3DStyle: 'cyber' });
    } else if (preset === 'royal') {
      localStorage.setItem('zen_hum_volume', '20');
      localStorage.setItem('zen_rain_volume', '0');
      startSynthesizedHum(20);
      stopSynthesizedRain();
      localStorage.setItem('3d_mode', 'true');
      window.dispatchEvent(new Event('3d_mode_changed'));
      await updateSettings({ globalLayout: 'gold', global3DStyle: 'gold' });
    } else if (preset === 'silent') {
      localStorage.setItem('zen_rain_volume', '0');
      localStorage.setItem('zen_hum_volume', '0');
      stopSynthesizedRain();
      stopSynthesizedHum();
      localStorage.setItem('focus_global_clicks', 'false');
      localStorage.setItem('3d_mode', 'false');
      window.dispatchEvent(new Event('3d_mode_changed'));
      await updateSettings({ globalLayout: 'slate', global3DStyle: 'default' });
    }
  };

  const handleTurboToggle = () => {
    const is3d = localStorage.getItem('3d_mode') !== 'false';
    localStorage.setItem('3d_mode', String(!is3d));
    window.dispatchEvent(new Event('3d_mode_changed'));
  };

  const isSuperAdmin = dbUser?.role === 'super_admin' || dbUser?.email === 'refayethossenmd@gmail.com';
  const isGloballyAllowed = settings?.allowCommandersDock === true;
  const showSystem = isSuperAdmin || isGloballyAllowed;

  // Build items list
  const baseItems = [
    { name: 'Home Dashboard', path: '/', icon: Home, category: 'Navigation', shortcut: '⌘1' },
    { name: 'Workspace Board', path: '/workspace', icon: Command, category: 'Navigation', shortcut: '⌘2' },
    { name: 'Meetings Room', path: '/meetings', icon: Video, category: 'Navigation', shortcut: '⌘3' },
    { name: 'Order Tracker', path: '/tracker', icon: Briefcase, category: 'Navigation', shortcut: '⌘4' },
    { name: 'Personal Projects', path: '/personal-projects', icon: FileCode, category: 'Navigation', shortcut: '⌘5' },
    { name: 'Team Notes', path: '/notes', icon: StickyNote, category: 'Navigation', shortcut: '⌘6' },
    { name: 'Settings', path: '/settings', icon: Settings, category: 'Navigation', shortcut: '⌘S' },
    
    { name: 'Fiverr Message Checker', path: '/message-helper', icon: ShieldCheck, category: 'Tools', shortcut: 'Tool' },
    { name: 'Congrats Studio', path: '/mockup', icon: Trophy, category: 'Tools', shortcut: 'Tool' },
    { name: 'AI Assistant', path: '/chat', icon: MessageSquare, category: 'Tools', shortcut: 'Tool' },
    { name: 'Templates Builder', path: '/templates', icon: FileCode, category: 'Tools', shortcut: 'Tool' },
    { name: 'Schema Builder', path: '/schema', icon: Layers, category: 'Tools', shortcut: 'Tool' },
    { name: 'Audit Suite', path: '/audit', icon: Gauge, category: 'Tools', shortcut: 'Tool' },
    { name: 'Projects Credentials', path: '/credentials', icon: Database, category: 'Tools', shortcut: 'Tool' },
    { name: 'Focus Studio', path: '/focus', icon: Headphones, category: 'Tools', shortcut: 'Tool' },
    { name: 'Downloads Centre', path: '/downloads', icon: Download, category: 'Tools', shortcut: 'Tool' },
    { name: 'Member Profile', path: '/member', icon: User, category: 'Tools', shortcut: 'Tool' },

    { name: 'Toggle Turbo Mode (3D Engine)', action: handleTurboToggle, icon: Cpu, category: 'System', shortcut: 'Turbo' },
    { name: 'Preset Ambiance: Cyber Rain', action: () => applyPreset('cyber'), icon: CloudRain, category: 'System', shortcut: 'Preset' },
    { name: 'Preset Ambiance: Cosmic Void', action: () => applyPreset('cosmic'), icon: Moon, category: 'System', shortcut: 'Preset' },
    { name: 'Preset Ambiance: Royal Focus', action: () => applyPreset('royal'), icon: Trophy, category: 'System', shortcut: 'Preset' },
    { name: 'Preset Ambiance: Silent Focus', action: () => applyPreset('silent'), icon: Volume2, category: 'System', shortcut: 'Preset' },
    
    { name: 'Logout Account', action: () => signOut(auth), icon: LogOut, category: 'Actions', shortcut: 'Esc', className: 'text-red-400' },
  ].filter(item => {
    if (item.category === 'System') return showSystem;
    return true;
  });

  // Dynamic Notes Map
  const dynamicNotes = (notes || []).map(n => ({
    name: `Note: ${n.title}`,
    path: `/notes?id=${n.id}`,
    icon: StickyNote,
    category: 'Notes',
    shortcut: (n as any).category || 'Note'
  }));

  // Dynamic Templates Map
  const dynamicTemplates = (templates || []).map(t => ({
    name: `Template: ${t.title}`,
    path: `/templates?id=${t.id}`,
    icon: FileCode,
    category: 'Templates',
    shortcut: t.category || 'Template'
  }));

  const allItems: any[] = [...baseItems, ...dynamicNotes, ...dynamicTemplates];

  // Fuzzy Search filter
  const filteredItems = allItems.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) || 
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  // Keep selectedIndex in bounds when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle arrow keys & enter inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      playClickFeedback();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      playClickFeedback();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelect = (item: any) => {
    setIsOpen(false);
    playClickFeedback();
    if (item.action) {
      item.action();
    } else if (item.path) {
      router.push(item.path);
    }
  };

  // Categorize grouped items for rendering while maintaining overall index mapping
  let globalIndexCounter = 0;
  const categories = ['Navigation', 'Tools', 'Notes', 'Templates', 'System', 'Actions'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[90%] max-w-xl bg-gray-950/95 border border-glass-border rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.22)] z-[101] overflow-hidden backdrop-blur-2xl font-sans"
          >
            {/* Input Header */}
            <div className="flex items-center gap-3.5 p-4 border-b border-white/5 relative">
              <Search className="w-5 h-5 text-purple-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search notes, templates, pages, or toggle Turbo mode..."
                className="w-full bg-transparent text-white text-base outline-none placeholder:text-gray-500 font-sans"
              />
              <div className="text-[9px] font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded border border-glass-border uppercase shrink-0">
                ESC
              </div>
            </div>
            
            {/* List Body */}
            <div 
              ref={scrollContainerRef}
              className="max-h-[380px] overflow-y-auto p-2.5 custom-scrollbar space-y-3"
            >
              {filteredItems.length === 0 ? (
                <div className="p-10 text-center text-xs text-gray-500 italic">
                  No matches found for "{query}"
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((category) => {
                    const categoryItems = filteredItems.filter(i => i.category === category);
                    if (categoryItems.length === 0) return null;
                    
                    return (
                      <div key={category} className="space-y-1">
                        <div className="px-3 py-1 text-[9px] font-black text-purple-400/70 uppercase tracking-widest">
                          {category}
                        </div>
                        {categoryItems.map((item) => {
                          const currentItemIndex = filteredItems.indexOf(item);
                          const isActive = selectedIndex === currentItemIndex;
                          
                          return (
                            <button
                              key={item.name + currentItemIndex}
                              onClick={() => handleSelect(item)}
                              onMouseEnter={() => setSelectedIndex(currentItemIndex)}
                              data-active={isActive ? "true" : "false"}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left relative overflow-hidden group cursor-pointer ${
                                isActive 
                                  ? 'bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-l-2 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.08)]' 
                                  : 'hover:bg-white/5 border-l-2 border-transparent text-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`p-1.5 rounded-lg transition-colors ${
                                  isActive ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-gray-400 group-hover:text-white'
                                }`}>
                                  <item.icon className={`w-4 h-4 ${item.className || ''}`} />
                                </div>
                                <span className={`text-xs font-semibold truncate ${
                                  isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                                } ${item.className || ''}`}>
                                  {item.name}
                                </span>
                              </div>
                              
                              {/* Shortcut/Type Badge */}
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                                isActive 
                                  ? 'bg-purple-500/20 border-purple-500/35 text-purple-300' 
                                  : 'bg-gray-900 border-white/5 text-gray-500'
                              }`}>
                                {item.shortcut}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer guide */}
            <div className="px-4 py-2.5 bg-gray-900/60 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-medium">
              <div className="flex items-center gap-2">
                <span>↑↓ to navigate</span>
                <span className="w-1 h-1 rounded-full bg-gray-700" />
                <span>↵ to select</span>
              </div>
              <div className="font-mono text-[9px] text-gray-600">
                Active Items: {filteredItems.length}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
