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
  DollarSign
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuth } from '@/context/AuthContext';

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
  const { user } = useAuth();
  
  const [pinnedTools, setPinnedTools] = useState<string[]>(['msg-helper', 'congrats-studio']);
  
  // Real DB Data states
  const [totalProjects, setTotalProjects] = useState(0);
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0);
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);

  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Developer');

  useEffect(() => {
    store.hydrate();
  }, []);

  useEffect(() => {
    if (user?.uid) {
      fetchDashboardData();
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
      <StarBackground />
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8 pb-12 relative z-10"
      >
      {/* 1. Hero Section */}
      <motion.div variants={itemVariants} className="relative rounded-2xl p-6 lg:p-10 overflow-hidden glass-panel border-glass-border flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none -mr-20 -mt-20" />
        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-xs font-semibold shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <Zap className="w-3.5 h-3.5" />
            <span>CODE COMMANDOS HUB ACTIVE</span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {greeting}, <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{displayName}</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            Your premium online Shopify helper panel. Run card mockups, check client chats, edit workflows, and keep client communication flawless.
          </p>
        </div>
        
        {/* Continue Last Work Card */}
        <div className="bg-gray-950/60 border border-glass-border p-5 rounded-2xl shrink-0 w-full md:w-80 space-y-4 backdrop-blur-md relative z-10 shadow-xl hover:border-green-500/30 transition-colors group">
          <div className="flex items-center gap-2 text-xs font-bold text-green-400 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Continue Working</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Congratulations Studio</h4>
            <p className="text-xs text-gray-500 truncate mt-0.5">Last card compiled: Elite Layout</p>
          </div>
          <Link href="/mockup" className="flex items-center justify-between w-full text-xs bg-brand-green hover:bg-brand-green-hover text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg glow-green group-hover:scale-[1.02]">
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
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Quick Actions</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              {quickActions.map((action) => (
                <Link key={action.id} href={action.href} className="group">
                  <div className={`h-full p-6 rounded-2xl border border-glass-border bg-gradient-to-br ${action.color} hover:bg-glass-hover ${action.borderColor} transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-6 shadow-lg`}>
                    <div className="flex items-start justify-between relative z-10">
                      <div className={`p-3.5 bg-gray-900/60 rounded-xl text-white ${action.hoverIcon} transition-colors shadow-sm`}>
                        <action.icon className="w-7 h-7 stroke-[1.7]" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                    <div className="relative z-10">
                      <h4 className={`text-base font-bold text-white ${action.hoverIcon} transition-colors`}>{action.name}</h4>
                      <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{action.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 3. Dynamic Statistics */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Your Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat, i) => (
                <div key={i} className="p-4 rounded-2xl border border-glass-border bg-gray-950/40 space-y-3 hover:bg-gray-950/60 transition-colors shadow-md group">
                  <div className="p-2.5 bg-glass-hover rounded-xl inline-block text-green-400 group-hover:scale-110 transition-transform">
                    <cat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{cat.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-1">{cat.desc}</p>
                  </div>
                  <div className="text-lg font-extrabold text-white">
                    {cat.items}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Recent Activity, Pinned, Keep Notes */}
        <div className="space-y-8">
          
          {/* Pinned Tools */}
          <div className="p-5 rounded-2xl border border-glass-border bg-gray-950/30 space-y-4 shadow-lg">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Pinned Tools</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </h3>
            <div className="space-y-2">
              {pinnedTools.map((toolId) => {
                const details = getToolDetails(toolId);
                return (
                  <Link key={toolId} href={details.path} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-950/60 border border-glass-border hover:bg-glass-hover hover:border-white/10 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${details.color} group-hover:scale-110 transition-transform`}>
                        <details.icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white group-hover:text-green-400 transition-colors">{details.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{details.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-5 rounded-2xl border border-glass-border bg-gray-950/30 space-y-4 shadow-lg">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
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
          <div className="p-5 rounded-2xl border border-glass-border bg-gray-950/30 space-y-4 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
            <div className="flex items-center justify-between pt-1">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5 text-green-400" />
                Keep Notes
              </h3>
              <Link href="/notes" className="text-xs font-medium text-green-400 hover:text-green-300 hover:underline transition-colors">View All</Link>
            </div>
            <div className="space-y-3">
              {recentNotes.length > 0 ? recentNotes.map((note) => (
                <Link href="/notes" key={note._id} className="block p-4 rounded-xl bg-gray-950/60 border border-glass-border space-y-2 text-left hover:border-green-500/30 transition-colors group">
                  <h4 className="text-xs font-bold text-white group-hover:text-green-400 transition-colors truncate">{note.title}</h4>
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
        <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase select-none flex items-center justify-center gap-2">
          <span>By Refayet</span>
          <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
          <span>Code Commandos Omega Prime v1.2.0</span>
        </p>
      </div>
    </motion.div>
    </div>
  );
}
