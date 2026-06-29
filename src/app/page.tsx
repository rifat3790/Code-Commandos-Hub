'use client';

import React, { useEffect, useState } from 'react';
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
  Zap
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
      ctx.fillStyle = '#34d399'; // subtle emerald twinkling star dust

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

  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : store.memberProfile?.name) || 'Developer';

  useEffect(() => {
    store.hydrate();
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
      href: '/message-helper',
    },
    {
      id: 'congrats-studio',
      name: 'Create Congrats Card',
      desc: 'Build client achievement review mockups for your feed.',
      icon: Trophy,
      color: 'from-blue-500/20 to-indigo-500/10',
      borderColor: 'group-hover:border-blue-500/30',
      href: '/mockup',
    },
    {
      id: 'template-center',
      name: 'Open Template Center',
      desc: 'Browse Gmail & Notion preloaded Shopify responses.',
      icon: FileCode,
      color: 'from-purple-500/20 to-pink-500/10',
      borderColor: 'group-hover:border-purple-500/30',
      href: '/templates',
    },
    {
      id: 'meeting-clarify',
      name: 'Ask AI Assistant',
      desc: 'Draft message revisions and Shopify coding answers.',
      icon: MessageSquare,
      color: 'from-amber-500/20 to-orange-500/10',
      borderColor: 'group-hover:border-amber-500/30',
      href: '/chat',
    }
  ];

  const categories = [
    { name: 'Communications', items: 34, desc: 'Fiverr replies, followups, extensions', icon: MessageSquare },
    { name: 'Achievement Cards', items: 10, desc: 'Review mockup template styles', icon: Trophy },
    { name: 'Shopify Scripts', items: 15, desc: 'Setup checklists, policy configurations', icon: FileCode },
    { name: 'Internal Notes', items: store.notes.length, desc: 'Tasks list, board reminders', icon: StickyNote }
  ];

  // Helper to get tool details for pinned section
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
      <motion.div variants={itemVariants} className="relative rounded-2xl p-6 lg:p-8 overflow-hidden glass-panel border-glass-border flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-green-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>CODE COMMANDOS HUB ACTIVE</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            Welcome back, <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{displayName}</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Your premium online Shopify helper panel. Run card mockups, check client chats, edit workflows, and keep client communication flawless.
          </p>
        </div>
        
        {/* Continue Last Work Card */}
        <div className="bg-gray-950/50 border border-glass-border p-4 rounded-xl shrink-0 w-full md:w-80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-green-400 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Continue Working</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Congratulations Studio</h4>
            <p className="text-xs text-gray-500 truncate">Last card compiled: Elite Layout</p>
          </div>
          <Link href="/mockup" className="flex items-center justify-between w-full text-xs bg-green-500 hover:bg-green-600 text-black font-semibold py-2 px-3.5 rounded-lg transition-colors">
            <span>Resume Card Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link key={action.id} href={action.href} className="group">
                  <div className={`h-full p-5 rounded-xl border border-glass-border bg-gradient-to-br ${action.color} hover:bg-glass-hover hover:border-white/10 transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-4`}>
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-gray-900/60 rounded-lg text-white group-hover:text-green-400 transition-colors">
                        <action.icon className="w-6 h-6 stroke-[1.7]" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white group-hover:text-green-400 transition-colors">{action.name}</h4>
                      <p className="text-xs text-gray-400 mt-1">{action.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 3. Tool Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Tool Categories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat, i) => (
                <div key={i} className="p-4 rounded-xl border border-glass-border bg-gray-950/30 space-y-2">
                  <div className="p-2 bg-glass-hover rounded-lg inline-block text-green-400">
                    <cat.icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{cat.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">{cat.desc}</p>
                  </div>
                  <div className="text-xs font-bold text-green-400">
                    {cat.items} presets
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Recent Activity, Pinned, Team Notes */}
        <div className="space-y-8">
          
          {/* Pinned Tools */}
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Pinned Tools</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </h3>
            <div className="space-y-2">
              {pinnedTools.map((toolId) => {
                const details = getToolDetails(toolId);
                return (
                  <Link key={toolId} href={details.path} className="flex items-center justify-between p-3 rounded-lg bg-gray-950/60 border border-glass-border hover:bg-glass-hover hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${details.color}`}>
                        <details.icon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white">{details.name}</p>
                        <p className="text-[10px] text-gray-500">{details.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Recent Activity</span>
              <Clock className="w-4 h-4 text-gray-500" />
            </h3>
            <div className="space-y-3.5 max-h-[200px] overflow-y-auto pr-1">
              {store.recentActivities.length > 0 ? (
                store.recentActivities.slice(0, 5).map((act) => (
                  <div key={act.id} className="text-left space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white truncate max-w-[150px]">{act.title}</span>
                      <span className="text-[9px] text-gray-500">
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

          {/* Team Notes Widget */}
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Team Notes</h3>
              <Link href="/notes" className="text-xs text-green-400 hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {store.notes.slice(0, 2).map((note) => (
                <div key={note.id} className="p-3 rounded-lg bg-gray-950/40 border border-glass-border space-y-1.5 text-left">
                  <h4 className="text-xs font-bold text-white truncate">{note.title}</h4>
                  <p className="text-[10px] text-gray-400 line-clamp-2">
                    {note.content || `${note.listItems?.length || 0} checklists total`}
                  </p>
                </div>
              ))}
            </div>
          </div>
      </div>
      </div>
      <div className="pt-8 pb-4 text-center border-t border-white/5 mt-8 shrink-0">
        <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase select-none">
          Build with Refayet • Code Commandos Omega Prime v1.2.0
        </p>
      </div>
    </motion.div>
    </div>
  );
}
