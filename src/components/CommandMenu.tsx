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
  Command
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function CommandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const items = [
    { name: 'Home Dashboard', path: '/', icon: Home, category: 'Navigation' },
    { name: 'Workspace Board', path: '/workspace', icon: Command, category: 'Navigation' },
    { name: 'Order Tracker', path: '/tracker', icon: Briefcase, category: 'Navigation' },
    { name: 'Personal Projects', path: '/personal-projects', icon: FileCode, category: 'Navigation' },
    { name: 'Team Notes', path: '/notes', icon: StickyNote, category: 'Navigation' },
    { name: 'Settings', path: '/settings', icon: Settings, category: 'Navigation' },
    
    { name: 'Fiverr Message Checker', path: '/message-helper', icon: ShieldCheck, category: 'Tools' },
    { name: 'Congrats Studio', path: '/mockup', icon: Trophy, category: 'Tools' },
    { name: 'AI Assistant', path: '/chat', icon: MessageSquare, category: 'Tools' },
    { name: 'Templates', path: '/templates', icon: FileCode, category: 'Tools' },
    
    { name: 'Logout', action: () => signOut(auth), icon: LogOut, category: 'Actions', text: 'text-red-400' },
  ];

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) || 
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item: any) => {
    setIsOpen(false);
    if (item.action) {
      item.action();
    } else if (item.path) {
      router.push(item.path);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-gray-950 border border-glass-border rounded-2xl shadow-2xl z-[101] overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 border-b border-glass-border">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools, pages, or commands..."
                className="w-full bg-transparent text-white text-base outline-none placeholder:text-gray-500"
              />
              <div className="text-[10px] font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded border border-glass-border uppercase shrink-0">
                ESC to close
              </div>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="space-y-1">
                  {['Navigation', 'Tools', 'Actions'].map((category) => {
                    const categoryItems = filteredItems.filter(i => i.category === category);
                    if (categoryItems.length === 0) return null;
                    return (
                      <div key={category} className="mb-2">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          {category}
                        </div>
                        {categoryItems.map((item) => (
                          <button
                            key={item.name}
                            onClick={() => handleSelect(item)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
                          >
                            <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                              <item.icon className={`w-4 h-4 text-gray-400 group-hover:text-white ${item.text || ''}`} />
                            </div>
                            <span className={`text-sm font-medium text-gray-300 group-hover:text-white ${item.text || ''}`}>{item.name}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
