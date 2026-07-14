'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  FileCode, 
  Trophy, 
  ShieldAlert, 
  Download, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles,
  ArrowUpRight,
  Pin,
  Save,
  Loader2,
  Palette
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function WorkspacePage() {
  const store = useWorkspaceStore();
  const { user, dbUser } = useAuth();
  
  const [newStickyText, setNewStickyText] = useState('');
  const [stickyColor, setStickyColor] = useState('yellow');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [quickSearch, setQuickSearch] = useState('');
  
  // Sticky Notes from MongoDB
  const [stickyNotes, setStickyNotes] = useState<any[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);

  // Freelance Calculator state variables
  const [grossAmount, setGrossAmount] = useState<number>(1000);
  const [platformFeePercent, setPlatformFeePercent] = useState<number>(20);
  const [withdrawalFeePercent, setWithdrawalFeePercent] = useState<number>(2);
  const [conversionRate, setConversionRate] = useState<number>(115);
  const [currencySymbol, setCurrencySymbol] = useState<string>('৳');
  const [isSavingCalc, setIsSavingCalc] = useState(false);

  const isSuperAdmin = dbUser?.role === 'super_admin';
  const activeWorkspaceLayout = store.settings?.globalLayout || 'default';

  const workspaceLayouts = [
    { id: 'default', name: 'Layout 1: Neon Glassmorphic' },
    { id: 'slate', name: 'Layout 2: Clean Slate & Platinum' },
    { id: 'aurora', name: 'Layout 3: Aurora Gradient' },
    { id: 'cyber', name: 'Layout 4: Cyber-Chrono (Green)' },
    { id: 'gold', name: 'Layout 5: Royal Gold & Onyx' }
  ];

  const workspaceLayoutStyles = useMemo(() => {
    switch(activeWorkspaceLayout) {
      case 'slate': // Layout 2: Clean Slate & Platinum
        return {
          wrapper: "space-y-8 pb-12 font-sans",
          headerTitle: "text-2xl lg:text-3xl font-bold tracking-tight text-white",
          headerDesc: "text-gray-400 text-sm",
          cardContainer: "p-5 rounded-none border border-gray-800 bg-gray-900 hover:border-gray-650 hover:bg-gray-850 transition-all group relative overflow-hidden",
          cardIconBox: "p-2.5 bg-gray-850 text-gray-300 rounded-none group-hover:scale-105 transition-transform border border-gray-800",
          cardTitle: "text-sm font-bold text-white group-hover:text-gray-350 transition-colors",
          cardDesc: "text-xs text-gray-450 mt-1",
          widgetCard: "p-5 rounded-none border border-gray-800 bg-gray-900/60 space-y-4 shadow-none relative overflow-hidden",
          widgetHeaderBar: "absolute top-0 left-0 w-full h-0.5 bg-gray-700",
          widgetTitle: "text-xs font-bold text-gray-450 uppercase tracking-widest flex items-center gap-2",
          inputField: "px-3 py-1.5 text-xs rounded-none bg-gray-955 border border-gray-800 text-white w-full focus:border-gray-600 outline-none",
          selectField: "px-2 py-1.5 text-xs rounded-none bg-gray-955 border border-gray-800 text-white cursor-pointer focus:border-gray-600 outline-none",
          actionBtn: "p-2 rounded-none bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white transition-colors border border-gray-700",
          stickyCard: "p-4 rounded-none border flex flex-col justify-between h-36 shadow-none transition-shadow",
          stickyText: "text-xs overflow-y-auto leading-relaxed h-full pr-1 font-normal",
          presetCard: "p-3 rounded-none bg-gray-955 border border-gray-850 space-y-2 text-left hover:border-gray-750 transition-colors",
          calcResultBox: "flex justify-between font-black text-xs text-white font-mono bg-gray-850 p-2 rounded-none border border-gray-755"
        };
      case 'aurora': // Layout 3: Aurora Gradient & Mesh Flow
        return {
          wrapper: "space-y-8 pb-12 font-sans",
          headerTitle: "text-2xl lg:text-3xl font-extrabold tracking-tight text-white",
          headerDesc: "text-indigo-200/80 text-sm",
          cardContainer: "p-5 rounded-2xl border border-indigo-500/10 bg-indigo-950/20 hover:border-indigo-500/35 hover:bg-indigo-950/30 transition-all duration-300 hover:scale-[1.01] shadow-md group relative overflow-hidden",
          cardIconBox: "p-2.5 bg-indigo-500/10 text-indigo-300 rounded-xl group-hover:scale-110 transition-transform",
          cardTitle: "text-sm font-bold text-white group-hover:text-indigo-400 transition-colors",
          cardDesc: "text-xs text-indigo-200/70 mt-1",
          widgetCard: "p-5 rounded-2xl border border-indigo-500/20 bg-indigo-950/5 space-y-4 shadow-[0_8px_32px_rgba(99,102,241,0.08)] relative overflow-hidden",
          widgetHeaderBar: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500",
          widgetTitle: "text-sm font-bold text-indigo-200 flex items-center gap-2",
          inputField: "px-3 py-1.5 text-xs rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-white w-full focus:ring-2 focus:ring-indigo-500/50 outline-none",
          selectField: "px-2 py-1.5 text-xs rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-white cursor-pointer focus:ring-2 focus:ring-indigo-500/50 outline-none",
          actionBtn: "p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md disabled:opacity-50 transition-all duration-300",
          stickyCard: "p-4 rounded-2xl border flex flex-col justify-between h-36 shadow-md hover:shadow-lg transition-shadow duration-300",
          stickyText: "text-xs overflow-y-auto leading-relaxed h-full pr-1 font-medium",
          presetCard: "p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/10 space-y-2 text-left hover:border-indigo-500/30 transition-colors",
          calcResultBox: "flex justify-between font-black text-xs text-indigo-300 font-mono bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20 shadow-[0_2px_10px_rgba(99,102,241,0.05)]"
        };
      case 'cyber': // Layout 4: Cyberpunk Matrix Tech
        return {
          wrapper: "space-y-8 pb-12 font-mono",
          headerTitle: "text-2xl lg:text-3xl font-black tracking-tight text-white uppercase",
          headerDesc: "text-emerald-500/80 text-xs",
          cardContainer: "p-5 rounded-none border border-emerald-500/25 bg-black hover:border-emerald-500/50 hover:bg-emerald-950/10 transition-all duration-200 group relative overflow-hidden",
          cardIconBox: "p-2.5 bg-black border border-emerald-500/30 text-emerald-400 rounded-none group-hover:scale-105 transition-transform",
          cardTitle: "text-sm font-bold text-white group-hover:text-emerald-400 transition-colors uppercase",
          cardDesc: "text-[11px] text-emerald-500/70 mt-1",
          widgetCard: "p-5 rounded-none border border-emerald-500/30 bg-black space-y-4 shadow-[0_0_15px_rgba(16,185,129,0.05)] relative overflow-hidden",
          widgetHeaderBar: "absolute top-0 left-0 w-full h-1 bg-emerald-500/60",
          widgetTitle: "text-xs font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-widest",
          inputField: "px-3 py-1.5 text-xs rounded-none bg-black border border-emerald-500/40 text-emerald-400 w-full focus:border-emerald-500 outline-none font-mono",
          selectField: "px-2 py-1.5 text-xs rounded-none bg-black border border-emerald-500/40 text-emerald-400 cursor-pointer focus:border-emerald-500 outline-none font-mono",
          actionBtn: "p-2 rounded-none bg-black border-2 border-dashed border-emerald-500/50 hover:bg-emerald-950/30 text-emerald-400 disabled:opacity-50 transition-colors",
          stickyCard: "p-4 rounded-none border flex flex-col justify-between h-36 shadow-none transition-shadow",
          stickyText: "text-xs overflow-y-auto leading-relaxed h-full pr-1 font-mono",
          presetCard: "p-3 rounded-none bg-black border border-emerald-500/10 space-y-2 text-left hover:border-emerald-500/30 transition-colors",
          calcResultBox: "flex justify-between font-black text-xs text-emerald-450 font-mono bg-emerald-950/20 p-2 rounded-none border border-emerald-500/30 animate-pulse"
        };
      case 'gold': // Layout 5: Royal Gold & Onyx
        return {
          wrapper: "space-y-8 pb-12 font-sans",
          headerTitle: "text-2xl lg:text-3xl font-black tracking-tight text-white uppercase tracking-wider",
          headerDesc: "text-amber-250/70 text-sm",
          cardContainer: "p-5 rounded-2xl border border-amber-500/10 bg-[#121212] hover:border-amber-500/30 hover:bg-[#1a1a1a] hover:shadow-[0_4px_20px_rgba(217,119,6,0.08)] transition-all duration-300 group relative overflow-hidden",
          cardIconBox: "p-2.5 bg-black border border-amber-500/20 text-amber-400 rounded-xl group-hover:scale-110 transition-transform",
          cardTitle: "text-sm font-bold text-white group-hover:text-amber-300 transition-colors",
          cardDesc: "text-xs text-amber-200/60 mt-1",
          widgetCard: "p-5 rounded-2xl border border-amber-500/25 bg-[#0b0b0b] space-y-4 shadow-lg relative overflow-hidden",
          widgetHeaderBar: "absolute top-0 left-0 w-full h-1 bg-amber-500/50",
          widgetTitle: "text-sm font-bold text-amber-300 flex items-center gap-2 uppercase tracking-wide",
          inputField: "px-3 py-1.5 text-xs rounded-xl bg-black border border-amber-500/20 text-white w-full focus:ring-1 focus:ring-amber-500/40 outline-none",
          selectField: "px-2 py-1.5 text-xs rounded-xl bg-black border border-amber-500/20 text-white cursor-pointer focus:ring-1 focus:ring-amber-500/40 outline-none",
          actionBtn: "p-2 rounded-xl bg-amber-650 hover:bg-amber-500 text-black font-bold disabled:opacity-50 transition-colors shadow-sm",
          stickyCard: "p-4 rounded-xl border flex flex-col justify-between h-36 shadow-md hover:shadow-lg transition-shadow duration-300",
          stickyText: "text-xs overflow-y-auto leading-relaxed h-full pr-1 font-medium",
          presetCard: "p-3 rounded-xl bg-black border border-amber-500/10 space-y-2 text-left hover:border-amber-500/35 transition-colors",
          calcResultBox: "flex justify-between font-black text-xs text-amber-450 font-mono bg-amber-500/10 p-2 rounded-xl border border-amber-500/20"
        };
      default: // Neon Glassmorphic (Default)
        return {
          wrapper: "space-y-8 pb-12",
          headerTitle: "text-2xl lg:text-3xl font-extrabold tracking-tight text-white",
          headerDesc: "text-gray-400 text-sm",
          cardContainer: "p-5 rounded-xl border border-glass-border bg-gray-950/40 hover:border-green-500/30 hover:bg-glass-hover transition-all group relative overflow-hidden",
          cardIconBox: "p-2.5 bg-green-500/10 text-green-400 rounded-lg group-hover:scale-110 transition-transform",
          cardTitle: "text-sm font-bold text-white group-hover:text-green-400 transition-colors",
          cardDesc: "text-xs text-gray-400 mt-1",
          widgetCard: "p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden",
          widgetHeaderBar: "",
          widgetTitle: "text-base font-bold text-white flex items-center gap-2",
          inputField: "px-3 py-1.5 text-xs rounded-lg glass-input w-full focus:ring-2 focus:ring-green-500/50 outline-none",
          selectField: "px-2 py-1.5 text-xs rounded-lg glass-input cursor-pointer focus:ring-2 focus:ring-green-500/50 outline-none",
          actionBtn: "p-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-black transition-colors",
          stickyCard: "p-4 rounded-xl border flex flex-col justify-between h-36 shadow-lg hover:shadow-xl transition-shadow",
          stickyText: "text-xs overflow-y-auto leading-relaxed h-full pr-1 font-medium",
          presetCard: "p-3 rounded-lg bg-gray-950/60 border border-glass-border space-y-2 text-left hover:border-white/10 transition-colors",
          calcResultBox: "flex justify-between font-black text-xs text-emerald-400 font-mono bg-green-500/10 p-2 rounded-lg border border-green-500/20"
        };
    }
  }, [activeWorkspaceLayout]);

  useEffect(() => {
    store.hydrate();
  }, []);

  useEffect(() => {
    if (user?.uid) {
      fetchStickyNotes();
      fetchUserSettings();
    }
  }, [user]);

  const fetchUserSettings = async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`/api/users/me?uid=${user.uid}`);
      const data = await res.json();
      if (data.success && data.user?.calculatorSettings) {
        const calc = data.user.calculatorSettings;
        if (calc.platformFeePercent !== undefined) setPlatformFeePercent(calc.platformFeePercent);
        if (calc.withdrawalFeePercent !== undefined) setWithdrawalFeePercent(calc.withdrawalFeePercent);
        if (calc.conversionRate !== undefined) setConversionRate(calc.conversionRate);
        if (calc.currencySymbol !== undefined) setCurrencySymbol(calc.currencySymbol);
      }
    } catch (err) {
      console.error('Failed to fetch user settings:', err);
    }
  };

  const saveCalculatorSettings = async () => {
    if (!user?.uid) return;
    setIsSavingCalc(true);
    try {
      const res = await fetch(`/api/users/me?uid=${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculatorSettings: {
            platformFeePercent,
            withdrawalFeePercent,
            conversionRate,
            currencySymbol
          }
        })
      });
      if (res.ok) {
        toast.success('Calculator settings saved!');
      } else {
        toast.error('Failed to save calculator settings.');
      }
    } catch (err) {
      toast.error('Error saving settings.');
    } finally {
      setIsSavingCalc(false);
    }
  };

  const fetchStickyNotes = async () => {
    if (!user?.uid) return;
    try {
      setIsLoadingNotes(true);
      const res = await fetch(`/api/notes?uid=${user.uid}`);
      const data = await res.json();
      if (data.success) {
        setStickyNotes(data.notes.filter((n: any) => n.type === 'sticky'));
      }
    } catch (err) {
      console.error('Failed to fetch sticky notes:', err);
      toast.error('Failed to load sticky board');
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleAddSticky = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStickyText.trim() || !user?.uid) return;
    
    try {
      const res = await fetch(`/api/notes?uid=${user.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Sticky Note',
          content: newStickyText.trim(),
          type: 'sticky',
          color: stickyColor
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setStickyNotes([data.note, ...stickyNotes]);
        setNewStickyText('');
        toast.success('Sticky added!');
      } else {
        toast.error('Failed to add sticky.');
      }
    } catch (err) {
      toast.error('Error adding sticky.');
    }
  };

  const handleDeleteSticky = async (id: string) => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`/api/notes/${id}?uid=${user.uid}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setStickyNotes(stickyNotes.filter(n => n._id !== id));
        toast.success('Sticky deleted');
      } else {
        toast.error('Failed to delete sticky');
      }
    } catch (err) {
      toast.error('Error deleting sticky');
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    store.logActivity('Template Copied', 'template', `Quick Delivery item copied.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick delivery presets filter
  const deliveryTemplates = store.templates.filter(
    t => (t.category === 'Delivery' || t.category === 'Followup') && 
         t.title.toLowerCase().includes(quickSearch.toLowerCase())
  ).slice(0, 4);

  const colors = [
    { value: 'yellow', border: 'border-yellow-500/30', bg: 'bg-yellow-950/20', text: 'text-yellow-200' },
    { value: 'pink', border: 'border-pink-500/30', bg: 'bg-pink-950/20', text: 'text-pink-200' },
    { value: 'blue', border: 'border-blue-500/30', bg: 'bg-blue-950/20', text: 'text-blue-200' },
    { value: 'green', border: 'border-green-500/30', bg: 'bg-green-950/20', text: 'text-green-200' },
    { value: 'purple', border: 'border-purple-500/30', bg: 'bg-purple-950/20', text: 'text-purple-200' },
  ];

  return (
    <div className={workspaceLayoutStyles.wrapper}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={workspaceLayoutStyles.headerTitle}>WORKSPACE BOARD</h1>
          <p className={workspaceLayoutStyles.headerDesc}>All operations deck. Sticky notes, quick template exports, and tool launchers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT & CENTER: Core Launcher Grid & Sticky Notes */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Quick Launcher Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Open Message Helper */}
            <div className={workspaceLayoutStyles.cardContainer}>
              <Link href="/message-helper" className="absolute inset-0 z-10" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-green-500/10 transition-colors" />
              <div className="flex items-start justify-between relative z-10">
                <div className={workspaceLayoutStyles.cardIconBox}>
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <div className="mt-4 relative z-10">
                <h3 className={workspaceLayoutStyles.cardTitle}>Fiverr Message Checker</h3>
                <p className={workspaceLayoutStyles.cardDesc}>Review drafts for flagged words (e.g. payment, contact) and correct them.</p>
              </div>
            </div>

            {/* Open Templates */}
            <div className={workspaceLayoutStyles.cardContainer}>
              <Link href="/templates" className="absolute inset-0 z-10" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
              <div className="flex items-start justify-between relative z-10">
                <div className={workspaceLayoutStyles.cardIconBox}>
                  <FileCode className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <div className="mt-4 relative z-10">
                <h3 className={workspaceLayoutStyles.cardTitle}>Team Template Hub</h3>
                <p className={workspaceLayoutStyles.cardDesc}>Access over 20+ preset updates, delivery followups, and billing queries.</p>
              </div>
            </div>

            {/* Generate Mockup */}
            <div className={workspaceLayoutStyles.cardContainer}>
              <Link href="/mockup" className="absolute inset-0 z-10" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
              <div className="flex items-start justify-between relative z-10">
                <div className={workspaceLayoutStyles.cardIconBox}>
                  <Trophy className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <div className="mt-4 relative z-10">
                <h3 className={workspaceLayoutStyles.cardTitle}>Congratulations Studio</h3>
                <p className={workspaceLayoutStyles.cardDesc}>Render high-end congratulatory review blocks to PNG images.</p>
              </div>
            </div>

            {/* Open Chat */}
            <div className={workspaceLayoutStyles.cardContainer}>
              <Link href="/chat" className="absolute inset-0 z-10" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
              <div className="flex items-start justify-between relative z-10">
                <div className={workspaceLayoutStyles.cardIconBox}>
                  <MessageSquare className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <div className="mt-4 relative z-10">
                <h3 className={workspaceLayoutStyles.cardTitle}>Chat Assistant</h3>
                <p className={workspaceLayoutStyles.cardDesc}>Write, simplify, or fix tone locally for client revisions.</p>
              </div>
            </div>

          </div>

          {/* Sticky Notes Canvas */}
          <div className={workspaceLayoutStyles.widgetCard}>
            {workspaceLayoutStyles.widgetHeaderBar && <div className={workspaceLayoutStyles.widgetHeaderBar} />}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className={workspaceLayoutStyles.widgetTitle}>
                <Pin className="w-4.5 h-4.5 text-green-400" />
                <span>Cloud Sticky Board</span>
              </h2>
              <form onSubmit={handleAddSticky} className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Sticky note..."
                  value={newStickyText}
                  onChange={(e) => setNewStickyText(e.target.value)}
                  className={workspaceLayoutStyles.inputField + " w-full sm:w-60"}
                />
                <select
                  value={stickyColor}
                  onChange={(e) => setStickyColor(e.target.value)}
                  className={workspaceLayoutStyles.selectField}
                >
                  <option value="yellow">Yellow</option>
                  <option value="pink">Pink</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                </select>
                <button type="submit" disabled={!newStickyText.trim() || isLoadingNotes} className={workspaceLayoutStyles.actionBtn}>
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 min-h-[160px]">
              {isLoadingNotes ? (
                <div className="col-span-full flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                </div>
              ) : stickyNotes.length > 0 ? (
                <AnimatePresence>
                  {stickyNotes.map((note) => {
                    const style = colors.find(c => c.value === note.color) || colors[0];
                    return (
                      <motion.div 
                        key={note._id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={workspaceLayoutStyles.stickyCard + ` ${style.border} ${style.bg}`}
                      >
                        <p className={workspaceLayoutStyles.stickyText + ` ${style.text}`}>
                          {note.content}
                        </p>
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/10">
                          <span className="text-[9px] text-white/50 font-medium">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                          <button 
                            onClick={() => handleDeleteSticky(note._id)}
                            className="p-1 rounded text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <div className="col-span-full text-center py-10 border border-dashed border-glass-border rounded-xl text-gray-500 text-xs bg-gray-950/30">
                  <Pin className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                  Your cloud sticky board is empty.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Quick Delivery & Recent Downloads */}
        <div className="space-y-6">
          
          {/* Quick Delivery Template copy widget */}
          <div className={workspaceLayoutStyles.widgetCard}>
            {workspaceLayoutStyles.widgetHeaderBar && <div className={workspaceLayoutStyles.widgetHeaderBar} />}
            <div>
              <h2 className={workspaceLayoutStyles.widgetTitle}>
                <Sparkles className="w-4.5 h-4.5 text-green-400" />
                <span>Quick Delivery</span>
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5">Quick copy presets for delivery & followups.</p>
            </div>

            <input
              type="text"
              placeholder="Search delivery presets..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className={workspaceLayoutStyles.inputField}
            />

            <div className="space-y-3.5">
              {deliveryTemplates.map((tpl) => (
                <div key={tpl.id} className={workspaceLayoutStyles.presetCard}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[170px]">{tpl.title}</span>
                    <button
                      onClick={() => handleCopyText(tpl.id, tpl.content)}
                      className="p-1 rounded bg-glass-hover hover:bg-green-500/10 text-gray-400 hover:text-green-400 transition-all"
                    >
                      {copiedId === tpl.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-3 bg-gray-900/50 p-1.5 rounded leading-relaxed">
                    {tpl.content}
                  </p>
                </div>
              ))}
              {deliveryTemplates.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No matching presets.</p>
              )}
            </div>
          </div>

          {/* Freelance Earnings & Fee Calculator */}
          {(() => {
            const platformFeeUSD = grossAmount * (platformFeePercent / 100);
            const withdrawalFeeUSD = (grossAmount - platformFeeUSD) * (withdrawalFeePercent / 100);
            const netEarningsUSD = grossAmount - platformFeeUSD - withdrawalFeeUSD;
            const netEarningsLocal = netEarningsUSD * conversionRate;

            return (
              <div className={workspaceLayoutStyles.widgetCard}>
                {workspaceLayoutStyles.widgetHeaderBar && <div className={workspaceLayoutStyles.widgetHeaderBar} />}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className={workspaceLayoutStyles.widgetTitle}>
                      <Sparkles className="w-4.5 h-4.5 text-green-400" />
                      <span>Freelance Calculator</span>
                    </h2>
                    <p className="text-[10px] text-gray-500 mt-0.5">Rates sync automatically with your account.</p>
                  </div>
                  <button 
                    onClick={saveCalculatorSettings}
                    disabled={isSavingCalc}
                    className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors flex items-center justify-center shrink-0"
                    title="Save current rates as default"
                  >
                    {isSavingCalc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </button>
                </div>

                <div className="space-y-3 text-left">
                  {/* Gross Amount Input */}
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-bold text-gray-400 uppercase">Order Budget (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold font-sans text-xs">$</span>
                      <input
                        type="number"
                        value={grossAmount || ''}
                        onChange={(e) => setGrossAmount(Number(e.target.value))}
                        className={workspaceLayoutStyles.inputField + " pl-7 pr-3 font-bold"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Platform Fee Percent Input */}
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-gray-400 uppercase">Platform Fee (%)</label>
                      <input
                        type="number"
                        value={platformFeePercent || ''}
                        onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
                        className={workspaceLayoutStyles.inputField + " font-semibold"}
                      />
                    </div>
                    {/* Withdrawal Fee Percent Input */}
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-gray-400 uppercase">Transfer Fee (%)</label>
                      <input
                        type="number"
                        value={withdrawalFeePercent || ''}
                        onChange={(e) => setWithdrawalFeePercent(Number(e.target.value))}
                        className={workspaceLayoutStyles.inputField + " font-semibold"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Exchange Rate */}
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-gray-400 uppercase">Exchange Rate</label>
                      <input
                        type="number"
                        value={conversionRate || ''}
                        onChange={(e) => setConversionRate(Number(e.target.value))}
                        className={workspaceLayoutStyles.inputField + " font-semibold"}
                      />
                    </div>
                    {/* Currency Code */}
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-gray-400 uppercase">Currency Symbol</label>
                      <input
                        type="text"
                        value={currencySymbol}
                        onChange={(e) => setCurrencySymbol(e.target.value)}
                        className={workspaceLayoutStyles.inputField + " font-semibold text-center"}
                      />
                    </div>
                  </div>

                  {/* Earnings Breakdown */}
                  <div className="border-t border-glass-border pt-3 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-gray-400">
                      <span>Gross Budget:</span>
                      <span className="text-white font-mono">${(grossAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-400 text-[11px]">
                      <span>Platform Fee ({platformFeePercent}%):</span>
                      <span className="font-mono">-${platformFeeUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-400 text-[11px]">
                      <span>Transfer/Withdraw Fee ({withdrawalFeePercent}%):</span>
                      <span className="font-mono">-${withdrawalFeeUSD.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-dashed border-white/5 pt-2 flex justify-between font-extrabold text-sm text-green-400">
                      <span>Net Earnings (USD):</span>
                      <span className="font-mono">${netEarningsUSD.toFixed(2)}</span>
                    </div>
                    <div className={workspaceLayoutStyles.calcResultBox}>
                      <span>Local Currency ({currencySymbol}):</span>
                      <span>{currencySymbol}{netEarningsLocal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
