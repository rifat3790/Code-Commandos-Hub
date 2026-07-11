'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  FileCode, 
  Trophy, 
  MessageSquare, 
  StickyNote, 
  Download, 
  Settings, 
  ArrowRight, 
  Star, 
  Clock, 
  Plus,
  Zap,
  Briefcase,
  DollarSign,
  Phone,
  Video,
  MessageCircle,
  Palette
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuth } from '@/context/AuthContext';
import { useCall } from '@/context/CallContext';

function StarBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.offsetHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.offsetHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const stars: { x: number; y: number; size: number; alpha: number; delta: number }[] = [];
    const count = 75;

    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        delta: (Math.random() * 0.015 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#00C950';

      stars.forEach((star) => {
        star.alpha += star.delta;
        if (star.alpha <= 0.1 || star.alpha >= 0.8) {
          star.delta = -star.delta;
        }
        star.alpha = Math.max(0.1, Math.min(0.8, star.alpha));

        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-25 z-0"
    />
  );
}

export default function HomePage() {
  const store = useWorkspaceStore();
  const { user, dbUser } = useAuth();
  const { startCall } = useCall();
  
  const [pinnedTools, setPinnedTools] = useState<string[]>(['msg-helper', 'congrats-studio']);
  const [activeVisitors, setActiveVisitors] = useState<{count: number, list: any[]}>({ count: 0, list: [] });
  const [loadingActive, setLoadingActive] = useState(false);
  
  // Real DB Data states
  const [totalProjects, setTotalProjects] = useState(0);
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0);
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);

  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Developer');
  const isSuperAdmin = dbUser?.role === 'super_admin';
  const activeHomeLayout = store.settings?.globalLayout || 'default';

  const homeLayouts = [
    { id: 'default', name: 'Layout 1: Neon Glassmorphic' },
    { id: 'slate', name: 'Layout 2: Clean Slate & Platinum' },
    { id: 'aurora', name: 'Layout 3: Aurora Gradient' },
    { id: 'cyber', name: 'Layout 4: Cyber-Chrono (Green)' },
    { id: 'gold', name: 'Layout 5: Royal Gold & Onyx' }
  ];

  const homeLayoutStyles = useMemo(() => {
    switch(activeHomeLayout) {
      case 'slate': // Layout 2: Clean Slate & Platinum
        return {
          wrapper: "space-y-8 pb-12 relative z-10 font-sans",
          starBackground: false,
          heroContainer: "relative rounded-none p-6 lg:p-10 bg-gray-900 border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-none",
          heroGradient: "",
          heroBadge: "inline-flex items-center gap-1.5 px-3 py-1 rounded-none bg-gray-800 border border-gray-700 text-gray-300 text-xs font-semibold uppercase tracking-wider",
          heroTitle: "text-3xl lg:text-5xl font-bold tracking-tight text-white leading-tight",
          heroTitleSpan: "text-gray-300 border-b-2 border-gray-750 pb-0.5",
          heroDesc: "text-gray-400 text-sm md:text-base leading-relaxed",
          resumeCard: "bg-gray-950 border border-gray-800 p-5 rounded-none shrink-0 w-full md:w-80 space-y-4 relative z-10 shadow-none hover:border-gray-650 transition-colors group",
          resumeCardBtn: "flex items-center justify-between w-full text-xs bg-gray-850 hover:bg-gray-800 text-white font-bold py-2.5 px-4 rounded-none border border-gray-700 transition-all group-hover:scale-[1.01]",
          sectionTitle: "text-xs font-bold text-gray-450 uppercase tracking-widest border-b border-gray-800 pb-2 flex items-center gap-2",
          cardContainer: "h-full p-6 rounded-none border border-gray-800 bg-gray-900 hover:bg-gray-850 hover:border-gray-750 transition-all duration-200 relative overflow-hidden flex flex-col justify-between space-y-6",
          cardIconBox: "p-3.5 bg-gray-850 rounded-none text-gray-300 transition-colors border border-gray-800",
          statCard: "p-4 rounded-none border border-gray-800 bg-gray-900/60 space-y-3 hover:bg-gray-850 transition-colors shadow-none group",
          statIconBox: "p-2.5 bg-gray-850 rounded-none inline-block text-gray-400 border border-gray-800",
          statValue: "text-lg font-bold text-white font-mono",
          widgetCard: "p-5 rounded-none border border-gray-800 bg-gray-900/60 space-y-4 shadow-none relative overflow-hidden",
          widgetHeaderBar: "absolute top-0 left-0 w-full h-0.5 bg-gray-700",
          widgetTitle: "text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between",
          widgetItem: "flex items-center justify-between p-3 rounded-none bg-gray-950 border border-gray-850 hover:border-gray-750 transition-all text-left",
          widgetAvatar: "w-8.5 h-8.5 rounded-none bg-gray-850 border border-gray-800 flex items-center justify-center font-bold text-xs text-gray-300 overflow-hidden shrink-0",
          widgetRoleBadge: "inline-block text-[8px] font-bold uppercase tracking-wider text-gray-450 bg-gray-850 border border-gray-800 px-1.5 py-0.2 rounded-none font-mono",
          noteCard: "block p-4 rounded-none bg-gray-950 border border-gray-850 space-y-2 text-left hover:border-gray-750 transition-colors group",
          noteCardTitle: "text-xs font-bold text-white group-hover:text-gray-300 transition-colors truncate",
          footerText: "text-[10px] text-gray-500 font-mono tracking-widest uppercase select-none flex items-center justify-center gap-2"
        };
      case 'aurora': // Layout 3: Aurora Gradient & Mesh Flow
        return {
          wrapper: "space-y-8 pb-12 relative z-10 font-sans",
          starBackground: true,
          heroContainer: "relative rounded-3xl p-6 lg:p-10 overflow-hidden border border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 via-purple-950/10 to-blue-950/20 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_8px_32px_rgba(99,102,241,0.1)]",
          heroGradient: "absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -mr-20 -mt-20",
          heroBadge: "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold shadow-[0_0_15px_rgba(99,102,241,0.15)]",
          heroTitle: "text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight",
          heroTitleSpan: "bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent",
          heroDesc: "text-indigo-200/80 text-sm md:text-base leading-relaxed",
          resumeCard: "bg-indigo-950/40 border border-indigo-500/25 p-5 rounded-2xl shrink-0 w-full md:w-80 space-y-4 backdrop-blur-md relative z-10 shadow-xl hover:border-indigo-500/50 transition-colors group",
          resumeCardBtn: "flex items-center justify-between w-full text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 group-hover:scale-[1.02]",
          sectionTitle: "text-lg font-bold text-white flex items-center gap-2",
          cardContainer: "h-full p-6 rounded-2xl border border-indigo-500/15 bg-gradient-to-br from-indigo-950/20 to-purple-950/10 hover:from-indigo-950/30 hover:to-purple-950/20 hover:border-indigo-500/35 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-6 shadow-md",
          cardIconBox: "p-3.5 bg-indigo-500/10 rounded-xl text-indigo-300 group-hover:text-white transition-colors shadow-sm",
          statCard: "p-4 rounded-2xl border border-indigo-500/10 bg-indigo-950/10 space-y-3 hover:bg-indigo-950/20 hover:border-indigo-500/20 transition-all duration-300 shadow-md group",
          statIconBox: "p-2.5 bg-indigo-500/10 rounded-xl inline-block text-indigo-300 group-hover:scale-110 transition-transform",
          statValue: "text-lg font-extrabold text-white",
          widgetCard: "p-5 rounded-2xl border border-indigo-500/20 bg-indigo-950/5 space-y-4 shadow-[0_0_20px_rgba(99,102,241,0.05)] relative overflow-hidden",
          widgetHeaderBar: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500",
          widgetTitle: "text-xs font-bold text-indigo-300/80 uppercase tracking-wider flex items-center justify-between",
          widgetItem: "flex items-center justify-between p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/10 hover:border-indigo-500/30 transition-all text-left",
          widgetAvatar: "w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-800 flex items-center justify-center font-bold text-xs text-white border border-indigo-500/20 overflow-hidden shrink-0",
          widgetRoleBadge: "inline-block text-[8px] font-extrabold uppercase tracking-wider text-indigo-400/80 bg-indigo-500/10 px-1.5 py-0.2 rounded font-mono",
          noteCard: "block p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/10 space-y-2 text-left hover:border-indigo-500/35 transition-colors group",
          noteCardTitle: "text-xs font-bold text-white group-hover:text-indigo-400 transition-colors truncate",
          footerText: "text-[10px] text-indigo-400/60 font-mono tracking-widest uppercase select-none flex items-center justify-center gap-2"
        };
      case 'cyber': // Layout 4: Cyberpunk Matrix Tech
        return {
          wrapper: "space-y-8 pb-12 relative z-10 font-mono",
          starBackground: false,
          heroContainer: "relative rounded-none p-6 lg:p-10 bg-black border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_0_20px_rgba(16,185,129,0.05)]",
          heroGradient: "",
          heroBadge: "inline-flex items-center gap-1.5 px-3 py-1 rounded-none bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 text-xs font-semibold uppercase tracking-widest",
          heroTitle: "text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight uppercase",
          heroTitleSpan: "text-emerald-400 animate-pulse",
          heroDesc: "text-emerald-500/80 text-xs md:text-sm leading-relaxed",
          resumeCard: "bg-black border-2 border-dashed border-emerald-500/30 p-5 rounded-none shrink-0 w-full md:w-80 space-y-4 relative z-10 shadow-none hover:border-emerald-500/60 transition-colors group",
          resumeCardBtn: "flex items-center justify-between w-full text-xs bg-emerald-950 border border-emerald-500/50 hover:bg-emerald-900 text-emerald-350 font-bold py-2.5 px-4 rounded-none transition-all uppercase tracking-wider group-hover:scale-[1.01]",
          sectionTitle: "text-xs font-extrabold text-emerald-400 uppercase tracking-widest border-b border-emerald-500/30 pb-1 flex items-center gap-2",
          cardContainer: "h-full p-6 rounded-none border border-emerald-500/20 bg-black hover:bg-emerald-950/10 hover:border-emerald-500/50 transition-all duration-200 relative overflow-hidden flex flex-col justify-between space-y-6",
          cardIconBox: "p-3.5 bg-black border border-emerald-500/30 rounded-none text-emerald-400 group-hover:text-emerald-300 transition-colors",
          statCard: "p-4 rounded-none border border-emerald-500/20 bg-black space-y-3 hover:bg-emerald-950/10 hover:border-emerald-500/40 transition-colors shadow-none group",
          statIconBox: "p-2.5 bg-black border border-emerald-500/25 rounded-none inline-block text-emerald-400 group-hover:scale-105 transition-transform",
          statValue: "text-lg font-bold text-white font-mono",
          widgetCard: "p-5 rounded-none border border-emerald-500/30 bg-black space-y-4 relative overflow-hidden",
          widgetHeaderBar: "absolute top-0 left-0 w-full h-1 bg-emerald-500/60",
          widgetTitle: "text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-between",
          widgetItem: "flex items-center justify-between p-3 rounded-none bg-black border border-emerald-500/10 hover:border-emerald-500/40 transition-all text-left",
          widgetAvatar: "w-8.5 h-8.5 rounded-none bg-black border border-emerald-500/45 flex items-center justify-center font-bold text-xs text-emerald-400 overflow-hidden shrink-0",
          widgetRoleBadge: "inline-block text-[8px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950 border border-emerald-500/30 px-1.5 py-0.2 rounded-none font-mono",
          noteCard: "block p-4 rounded-none bg-black border border-emerald-500/10 space-y-2 text-left hover:border-emerald-500/40 transition-colors group",
          noteCardTitle: "text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate uppercase",
          footerText: "text-[10px] text-emerald-500/60 font-mono tracking-widest uppercase select-none flex items-center justify-center gap-2"
        };
      case 'gold': // Layout 5: Royal Gold & Onyx
        return {
          wrapper: "space-y-8 pb-12 relative z-10 font-sans",
          starBackground: false,
          heroContainer: "relative rounded-2xl p-6 lg:p-10 bg-[#0b0b0b] border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_8px_30px_rgba(217,119,6,0.05)]",
          heroGradient: "absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -mr-20 -mt-20",
          heroBadge: "inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-[0_0_15px_rgba(217,119,6,0.1)]",
          heroTitle: "text-3xl lg:text-5xl font-black tracking-tight text-white leading-tight",
          heroTitleSpan: "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 bg-clip-text text-transparent drop-shadow-sm",
          heroDesc: "text-amber-250/70 text-sm md:text-base leading-relaxed",
          resumeCard: "bg-[#141414] border border-amber-500/20 p-5 rounded-2xl shrink-0 w-full md:w-80 space-y-4 relative z-10 shadow-xl hover:border-amber-500/40 transition-colors group",
          resumeCardBtn: "flex items-center justify-between w-full text-xs bg-amber-600 hover:bg-amber-500 text-black font-extrabold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-amber-600/10 group-hover:scale-[1.02]",
          sectionTitle: "text-base font-bold text-amber-350 flex items-center gap-2 uppercase tracking-wide",
          cardContainer: "h-full p-6 rounded-2xl border border-amber-500/10 bg-[#121212] hover:bg-[#181818] hover:border-amber-500/30 hover:shadow-[0_4px_20px_rgba(217,119,6,0.08)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-6 shadow-sm",
          cardIconBox: "p-3.5 bg-black border border-amber-500/20 rounded-xl text-amber-400 group-hover:text-amber-300 transition-colors shadow-sm",
          statCard: "p-4 rounded-2xl border border-amber-500/10 bg-black space-y-3 hover:bg-[#121212] hover:border-amber-500/20 transition-all duration-300 shadow-md group",
          statIconBox: "p-2.5 bg-black border border-amber-500/15 rounded-xl inline-block text-amber-400 group-hover:scale-110 transition-transform",
          statValue: "text-lg font-extrabold text-white font-mono",
          widgetCard: "p-5 rounded-2xl border border-amber-500/25 bg-[#0b0b0b] space-y-4 shadow-lg relative overflow-hidden",
          widgetHeaderBar: "absolute top-0 left-0 w-full h-1 bg-amber-500/50",
          widgetTitle: "text-xs font-bold text-amber-300/80 uppercase tracking-wider flex items-center justify-between",
          widgetItem: "flex items-center justify-between p-3 rounded-xl bg-black border border-amber-500/15 hover:border-amber-500/35 transition-all text-left",
          widgetAvatar: "w-8.5 h-8.5 rounded-full bg-black border border-amber-500/30 flex items-center justify-center font-bold text-xs text-amber-300 overflow-hidden shrink-0",
          widgetRoleBadge: "inline-block text-[8px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono",
          noteCard: "block p-4 rounded-xl bg-black border border-amber-500/10 space-y-2 text-left hover:border-amber-500/30 transition-colors group",
          noteCardTitle: "text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate",
          footerText: "text-[10px] text-amber-500/50 font-mono tracking-widest uppercase select-none flex items-center justify-center gap-2"
        };
      default: // Neon Glassmorphic (Default)
        return {
          wrapper: "space-y-8 pb-12 relative z-10",
          starBackground: true,
          heroContainer: "relative rounded-2xl p-6 lg:p-10 overflow-hidden glass-panel border-glass-border flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl",
          heroGradient: "absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none -mr-20 -mt-20",
          heroBadge: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-xs font-semibold shadow-[0_0_15px_rgba(34,197,94,0.1)]",
          heroTitle: "text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight",
          heroTitleSpan: "bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent",
          heroDesc: "text-gray-400 text-sm md:text-base leading-relaxed",
          resumeCard: "bg-gray-950/60 border border-glass-border p-5 rounded-2xl shrink-0 w-full md:w-80 space-y-4 backdrop-blur-md relative z-10 shadow-xl hover:border-green-500/30 transition-colors group",
          resumeCardBtn: "flex items-center justify-between w-full text-xs bg-brand-green hover:bg-brand-green-hover text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg glow-green group-hover:scale-[1.02]",
          sectionTitle: "text-lg font-bold text-white flex items-center gap-2",
          cardContainer: "h-full p-6 rounded-2xl border border-glass-border bg-gradient-to-br from-green-500/20 to-emerald-500/10 hover:bg-glass-hover hover:border-green-500/30 transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-6 shadow-lg",
          cardIconBox: "p-3.5 bg-gray-900/60 rounded-xl text-white group-hover:text-green-400 transition-colors shadow-sm",
          statCard: "p-4 rounded-2xl border border-glass-border bg-gray-950/40 space-y-3 hover:bg-gray-950/60 transition-colors shadow-md group",
          statIconBox: "p-2.5 bg-glass-hover rounded-xl inline-block text-green-400 group-hover:scale-110 transition-transform",
          statValue: "text-lg font-extrabold text-white",
          widgetCard: "p-5 rounded-2xl border border-glass-border bg-gray-950/30 space-y-4 shadow-lg relative overflow-hidden",
          widgetHeaderBar: "",
          widgetTitle: "text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between",
          widgetItem: "flex items-center justify-between p-3 rounded-xl bg-gray-950/60 border border-glass-border hover:border-white/10 transition-all text-left",
          widgetAvatar: "w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-800 flex items-center justify-center font-bold text-xs text-white border border-purple-500/20 overflow-hidden shrink-0",
          widgetRoleBadge: "inline-block text-[8px] font-extrabold uppercase tracking-wider text-purple-400/80 bg-purple-500/10 px-1.5 py-0.2 rounded font-mono",
          noteCard: "block p-4 rounded-xl bg-gray-950/60 border border-glass-border space-y-2 text-left hover:border-green-500/30 transition-colors group",
          noteCardTitle: "text-xs font-bold text-white group-hover:text-green-400 transition-colors truncate",
          footerText: "text-[10px] text-gray-500 font-mono tracking-widest uppercase select-none flex items-center justify-center gap-2"
        };
    }
  }, [activeHomeLayout]);

  useEffect(() => {
    store.hydrate();
  }, []);

  const fetchActiveVisitors = async () => {
    if (!user?.uid) return;
    setLoadingActive(true);
    try {
      const res = await fetch(`/api/users/active?uid=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setActiveVisitors({ count: data.count, list: data.activeUsers || [] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActive(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchDashboardData();
      fetchActiveVisitors();
      const interval = setInterval(fetchActiveVisitors, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?.uid) return;
    try {
      // 1. Fetch Personal Projects for Earnings
      const projRes = await fetch(`/api/personal-projects?uid=${user.uid}`);
      const projData = await projRes.json();
      if (projData.success && projData.projects) {
        setTotalProjects(projData.projects.length);
        const total = projData.projects.reduce((acc: number, p: any) => acc + (Number(p.revenue) || 0), 0);
        setLifetimeEarnings(total);
      }

      // 2. Fetch Notes
      const noteRes = await fetch(`/api/notes?uid=${user.uid}`);
      const noteData = await noteRes.json();
      if (noteData.success && noteData.notes) {
        const standardNotes = noteData.notes.filter((n: any) => n.type === 'note' || n.type === 'checklist');
        setTotalNotes(standardNotes.length);
        setRecentNotes(standardNotes.slice(0, 2));
      }

    } catch (err) {
      console.error('Failed to load dynamic dashboard data', err);
    }
  };

  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else if (hour < 22) setGreeting('Good evening');
    else setGreeting('Good night');
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  const quickActions = [
    {
      id: 'msg-helper',
      name: 'Analyze Fiverr Message',
      desc: 'Scan text for policy flags and correct them instantly.',
      icon: ShieldCheck,
      color: 'from-green-500/20 to-emerald-500/10',
      borderColor: 'group-hover:border-green-500/30',
      hoverIcon: 'group-hover:text-green-400',
      href: '/message-helper',
    },
    {
      id: 'congrats-studio',
      name: 'Create Congrats Card',
      desc: 'Build client achievement review mockups for your feed.',
      icon: Trophy,
      color: 'from-blue-500/20 to-indigo-500/10',
      borderColor: 'group-hover:border-blue-500/30',
      hoverIcon: 'group-hover:text-blue-400',
      href: '/mockup',
    },
    {
      id: 'template-center',
      name: 'Open Template Center',
      desc: 'Browse Gmail & Notion preloaded Shopify responses.',
      icon: FileCode,
      color: 'from-purple-500/20 to-pink-500/10',
      borderColor: 'group-hover:border-purple-500/30',
      hoverIcon: 'group-hover:text-purple-400',
      href: '/templates',
    },
    {
      id: 'meeting-clarify',
      name: 'Ask AI Assistant',
      desc: 'Draft message revisions and Shopify coding answers.',
      icon: MessageSquare,
      color: 'from-amber-500/20 to-orange-500/10',
      borderColor: 'group-hover:border-amber-500/30',
      hoverIcon: 'group-hover:text-amber-400',
      href: '/chat',
    }
  ];

  const categories = [
    { name: 'Lifetime Earnings', items: `$${lifetimeEarnings.toLocaleString()}`, desc: 'Total revenue collected', icon: DollarSign },
    { name: 'Client Projects', items: `${totalProjects} completed`, desc: 'Personal projects tracked', icon: Briefcase },
    { name: 'Keep Notes', items: `${totalNotes} records`, desc: 'Active notes & checklists', icon: StickyNote },
    { name: 'Template Presets', items: '24+ available', desc: 'Preloaded Shopify replies', icon: FileCode }
  ];

  const getToolDetails = (id: string) => {
    switch(id) {
      case 'msg-helper':
        return { name: 'Message Helper', path: '/message-helper', desc: 'Fiverr Policy Scanner', icon: ShieldCheck, color: 'text-green-400 bg-green-500/10' };
      case 'congrats-studio':
        return { name: 'Mockup Studio', path: '/mockup', desc: 'Congratulation Mockups', icon: Trophy, color: 'text-blue-400 bg-blue-500/10' };
      case 'template-center':
        return { name: 'Template Center', path: '/templates', desc: 'Shopify Preset Replies', icon: FileCode, color: 'text-purple-400 bg-purple-500/10' };
      default:
        return { name: 'Message Helper', path: '/message-helper', desc: 'Fiverr Policy Scanner', icon: ShieldCheck, color: 'text-green-400 bg-green-500/10' };
    }
  };

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-100px)]">
      {homeLayoutStyles.starBackground && <StarBackground />}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={homeLayoutStyles.wrapper}
      >

        {/* 1. Hero Section */}
        <motion.div variants={itemVariants} className={homeLayoutStyles.heroContainer}>
          {homeLayoutStyles.heroGradient && <div className={homeLayoutStyles.heroGradient} />}
          <div className="space-y-3 max-w-2xl relative z-10">
            <div className={homeLayoutStyles.heroBadge}>
              <Zap className="w-3.5 h-3.5" />
              <span>CODE COMMANDOS HUB ACTIVE</span>
            </div>
            <h1 className={homeLayoutStyles.heroTitle}>
              {greeting}, <span className={homeLayoutStyles.heroTitleSpan}>{displayName}</span>
            </h1>
            <p className={homeLayoutStyles.heroDesc}>
              Your premium online Shopify helper panel. Run card mockups, check client chats, edit workflows, and keep client communication flawless.
            </p>
          </div>
          
          {/* Continue Last Work Card */}
          <div className={homeLayoutStyles.resumeCard}>
            <div className="flex items-center gap-2 text-xs font-bold text-green-400 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>Continue Working</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Congratulations Studio</h4>
              <p className="text-xs text-gray-500 truncate mt-0.5">Last card compiled: Elite Layout</p>
            </div>
            <Link href="/mockup" className={homeLayoutStyles.resumeCardBtn}>
              <span>Resume Card Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Grid: Left column widgets, Right column widgets */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Side: Actions and Categories */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* 2. Quick Actions */}
            <div className="space-y-4">
              <h3 className={homeLayoutStyles.sectionTitle}>
                <span>Quick Actions</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                {quickActions.map((action) => (
                  <Link key={action.id} href={action.href} className="group">
                    <div className={homeLayoutStyles.cardContainer}>
                      <div className="flex items-start justify-between relative z-10">
                        <div className={homeLayoutStyles.cardIconBox}>
                          <action.icon className="w-7 h-7 stroke-[1.7]" />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                      <div className="relative z-10">
                        <h4 className={`text-base font-bold text-white group-hover:text-green-400 transition-colors`}>{action.name}</h4>
                        <p className="text-xs text-gray-450 mt-1.5 leading-relaxed">{action.desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 3. Dynamic Statistics */}
            <div className="space-y-4">
              <h3 className={homeLayoutStyles.sectionTitle}>Your Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map((cat, i) => (
                  <div key={i} className={homeLayoutStyles.statCard}>
                    <div className={homeLayoutStyles.statIconBox}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{cat.name}</h4>
                      <p className="text-[10px] text-gray-500 mt-1">{cat.desc}</p>
                    </div>
                    <div className={homeLayoutStyles.statValue}>
                      {cat.items}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Side: Recent Activity, Pinned, Keep Notes */}
          <div className="space-y-8">
            
            {/* Active Visitors Online */}
            <div className={homeLayoutStyles.widgetCard}>
              {homeLayoutStyles.widgetHeaderBar && <div className={homeLayoutStyles.widgetHeaderBar} />}
              <h3 className={homeLayoutStyles.widgetTitle}>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                  Active Visitors ({activeVisitors.count})
                </span>
                <button 
                  onClick={fetchActiveVisitors} 
                  disabled={loadingActive}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-bold uppercase transition-colors"
                >
                  {loadingActive ? '...' : 'Refresh'}
                </button>
              </h3>

              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {activeVisitors.list.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No active visitors online.</p>
                ) : (
                  activeVisitors.list.map((u, i) => (
                    <div key={i} className={homeLayoutStyles.widgetItem}>
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={homeLayoutStyles.widgetAvatar}>
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.name || u.email} className="w-full h-full object-cover" />
                          ) : (
                            (u.name || u.email).split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase()
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">{u.name || u.email.split('@')[0]}</p>
                          <span className={homeLayoutStyles.widgetRoleBadge}>
                            {u.role}
                          </span>
                        </div>
                      </div>

                      {u.email !== user?.email && (
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button
                            onClick={() => {
                              const uid = u.firebaseUid || 'admin';
                              const name = u.name || u.email.split('@')[0];
                              window.dispatchEvent(new CustomEvent('open-chat', { detail: { uid, name } }));
                            }}
                            className="p-1.5 bg-gray-900 border border-gray-800 hover:border-purple-500/20 text-gray-400 hover:text-purple-400 rounded-lg transition-all"
                            title="Message"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => startCall(u.firebaseUid || 'admin', u.name || u.email.split('@')[0], 'audio')}
                            className="p-1.5 bg-gray-900 border border-gray-800 hover:border-purple-500/20 text-gray-400 hover:text-purple-400 rounded-lg transition-all"
                            title="Audio Call"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => startCall(u.firebaseUid || 'admin', u.name || u.email.split('@')[0], 'video')}
                            className="p-1.5 bg-gray-900 border border-gray-800 hover:border-purple-500/20 text-gray-400 hover:text-purple-400 rounded-lg transition-all"
                            title="Video Call"
                          >
                            <Video className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pinned Tools */}
            <div className={homeLayoutStyles.widgetCard}>
              {homeLayoutStyles.widgetHeaderBar && <div className={homeLayoutStyles.widgetHeaderBar} />}
              <h3 className={homeLayoutStyles.widgetTitle}>
                <span>Pinned Tools</span>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </h3>
              <div className="space-y-2">
                {pinnedTools.map((toolId) => {
                  const details = getToolDetails(toolId);
                  return (
                    <Link key={toolId} href={details.path} className={homeLayoutStyles.widgetItem}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${details.color} group-hover:scale-110 transition-transform`}>
                          <details.icon className="w-4.5 h-4.5" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-white group-hover:text-green-400 transition-colors">{details.name}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{details.desc}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-650 group-hover:text-white transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className={homeLayoutStyles.widgetCard}>
              {homeLayoutStyles.widgetHeaderBar && <div className={homeLayoutStyles.widgetHeaderBar} />}
              <h3 className={homeLayoutStyles.widgetTitle}>
                <span>Recent Activity</span>
                <Clock className="w-4 h-4 text-gray-500" />
              </h3>
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {store.recentActivities.length > 0 ? (
                  store.recentActivities.slice(0, 5).map((act) => (
                    <div key={act.id} className="text-left space-y-1 relative pl-4 before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:bg-green-500 before:rounded-full">
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] font-bold text-white truncate max-w-[150px]">{act.title}</span>
                        <span className="text-[9px] text-gray-500 font-medium">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 line-clamp-1">{act.details}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">No recent history.</p>
                )}
              </div>
            </div>

            {/* Keep Notes Widget */}
            <div className={homeLayoutStyles.widgetCard}>
              {homeLayoutStyles.widgetHeaderBar && <div className={homeLayoutStyles.widgetHeaderBar} />}
              <div className="flex items-center justify-between pt-1">
                <h3 className={homeLayoutStyles.widgetTitle + " flex items-center gap-1.5"}>
                  <StickyNote className="w-3.5 h-3.5 text-green-400" />
                  Keep Notes
                </h3>
                <Link href="/notes" className="text-xs font-medium text-green-400 hover:text-green-300 hover:underline transition-colors">View All</Link>
              </div>
              <div className="space-y-3">
                {recentNotes.length > 0 ? recentNotes.map((note) => (
                  <Link href="/notes" key={note._id} className={homeLayoutStyles.noteCard}>
                    <h4 className={homeLayoutStyles.noteCardTitle}>{note.title}</h4>
                    <p className="text-[10.5px] text-gray-400 line-clamp-2 leading-relaxed">
                      {note.content || `${note.listItems?.length || 0} checklists total`}
                    </p>
                  </Link>
                )) : (
                  <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-gray-500">
                    No notes saved yet.
                  </div>
                )}
              </div>
            </div>
        </div>
        </div>
        <div className="pt-10 pb-4 text-center border-t border-white/5 mt-10 shrink-0">
          <p className={homeLayoutStyles.footerText}>
            <span>By Refayet</span>
            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
            <span>Code Commandos Omega Prime v1.2.0</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
