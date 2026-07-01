'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Home, 
  LayoutDashboard, 
  ShieldAlert, 
  FileCode2, 
  Trophy, 
  MessageSquare, 
  User, 
  Download, 
  StickyNote, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Terminal,
  Clock,
  X,
  Layers,
  Database,
  Gauge,
  LogOut,
  FolderKanban
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hydrate = useWorkspaceStore((state) => state.hydrate);
  const profile = useWorkspaceStore((state) => state.memberProfile);
  const isHydrated = useWorkspaceStore((state) => state.isHydrated);
  const { user, dbUser } = useAuth();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : profile?.name) || 'Developer';
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const baseNavItemsRaw = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Workspace', path: '/workspace', icon: LayoutDashboard },
    { name: 'Order Tracker', path: '/tracker', icon: LayoutDashboard },
    { name: 'Personal Projects', path: '/personal-projects', icon: FolderKanban },
    { name: 'Message Helper', path: '/message-helper', icon: ShieldAlert },
    { name: 'Templates', path: '/templates', icon: FileCode2 },
    { name: 'Schema Builder', path: '/schema', icon: Layers },
    { name: 'Audit Suite', path: '/audit', icon: Gauge },
    { name: 'Projects', path: '/credentials', icon: Database },
    { name: 'Mockup Studio', path: '/mockup', icon: Trophy },
    { name: 'AI Assistant', path: '/chat', icon: MessageSquare },
    { name: 'Team Notes', path: '/notes', icon: StickyNote },
    { name: 'Downloads', path: '/downloads', icon: Download },
    { name: 'Member Profile', path: '/member', icon: User },
    { name: 'Shopify Codes', path: '/shopify-codes', icon: FileCode2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const storeSettings = useWorkspaceStore((state) => state.settings);
  const userMenus = storeSettings?.userEnabledMenus?.length ? storeSettings.userEnabledMenus : (storeSettings?.enabledMenus || baseNavItemsRaw.map(n => n.name));
  const adminMenus = storeSettings?.adminEnabledMenus?.length ? storeSettings.adminEnabledMenus : (storeSettings?.enabledMenus || baseNavItemsRaw.map(n => n.name));

  // For non-super_admin users, filter out disabled menus
  const isAdminOrSuperAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';
  const baseNavItems = baseNavItemsRaw.filter(item => {
    if (dbUser?.role === 'super_admin') return true;
    if (dbUser?.role === 'admin') return adminMenus.includes(item.name);
    return userMenus.includes(item.name);
  });

  const navItems = isAdminOrSuperAdmin
    ? [...baseNavItems, { name: 'Admin Panel', path: '/admin', icon: ShieldAlert }]
    : baseNavItems;

  // Helper to render navigation list items
  const renderNavLinks = (isMobileLayout = false) => {
    return (
      <nav className="p-3 space-y-1.5 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              href={item.path}
              onClick={isMobileLayout ? onCloseMobile : undefined}
            >
              <div
                suppressHydrationWarning
                className={`relative flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-sm font-medium transition-all group overflow-hidden ${
                  isActive 
                    ? 'text-green-400 bg-green-950/25 border border-green-500/20' 
                    : 'text-gray-400 hover:text-white hover:bg-glass-hover border border-transparent'
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-green-400 glow-green' : 'text-gray-400 group-hover:text-white transition-colors'}`} />
                
                {(!isCollapsed || isMobileLayout) && (
                  <span className="truncate">
                    {item.name}
                  </span>
                )}

                {/* Tooltip for Collapsed Desktop Mode */}
                {isCollapsed && !isMobileLayout && (
                  <div className="absolute left-[80px] bg-gray-900 border border-glass-border px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}

                {/* Active Indicator Bar */}
                {isActive && !isMobileLayout && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute right-0 top-2 bottom-2 w-1 bg-green-400 rounded-l"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    );
  };

  return (
    <>
      {/* 1. MOBILE BACKDROP OVERLAY */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* 2. MOBILE DRAWER SIDEBAR (SLIDES IN) */}
      <aside
        suppressHydrationWarning
        className={`fixed inset-y-0 left-0 w-[260px] bg-[#070b16] border-r border-glass-border flex flex-col justify-between select-none z-50 md:hidden transform transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Top header with close button */}
          <div className="p-4 flex items-center justify-between border-b border-glass-border">
            <Link href="/" className="flex items-center gap-3 overflow-hidden" onClick={onCloseMobile}>
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center glow-green shrink-0">
                <Terminal className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-white via-gray-300 to-green-400 bg-clip-text text-transparent truncate">
                CODE COMMANDOS HUB
              </span>
            </Link>
            <button 
              onClick={onCloseMobile}
              className="p-1.5 rounded-md hover:bg-glass-hover text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          {renderNavLinks(true)}
        </div>

        {/* User profile footer */}
        <div className="p-4 pb-16 border-t border-glass-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-500 to-emerald-800 flex items-center justify-center font-bold text-sm text-white border border-green-500/30 overflow-hidden shrink-0">
            {isHydrated && user?.photoURL ? (
              <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              isHydrated ? initials : 'CC'
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{isHydrated ? displayName : 'Developer'}</p>
            <div className="flex items-center gap-1 text-[10px] text-green-400">
              <Clock className="w-2.5 h-2.5" />
              <span>Online Ready</span>
            </div>
            <p className="text-[9px] text-gray-500 font-mono mt-1 select-none">
              By Rifat
            </p>
          </div>
          <button 
            onClick={handleLogout} 
            className="ml-auto p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 3. DESKTOP COLLAPSIBLE SIDEBAR */}
      <motion.aside
        suppressHydrationWarning
        animate={{ width: isCollapsed ? '70px' : '260px' }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden md:flex sticky top-0 h-screen glass-panel border-r border-glass-border flex-col justify-between shrink-0 select-none z-40"
      >
        <div>
          {/* Top Header */}
          <div className="p-4 flex items-center justify-between border-b border-glass-border">
            <Link href="/" className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center glow-green shrink-0">
                <Terminal className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              {!isCollapsed && (
                <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-white via-gray-300 to-green-400 bg-clip-text text-transparent truncate">
                  CODE COMMANDOS HUB
                </span>
              )}
            </Link>
            
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-md hover:bg-glass-hover text-gray-400 hover:text-white transition-colors"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          {renderNavLinks(false)}
        </div>

        {/* Bottom Profile Section */}
        <div className="p-3 pb-16 border-t border-glass-border">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-glass-hover transition-colors overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-500 to-emerald-800 flex items-center justify-center font-bold text-sm text-white border border-green-500/30 overflow-hidden shrink-0">
                {isHydrated && user?.photoURL ? (
                  <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  isHydrated ? initials : 'CC'
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{isHydrated ? displayName : 'Developer'}</p>
                <div className="flex items-center gap-1 text-[10px] text-green-400">
                  <Clock className="w-2.5 h-2.5" />
                  <span>Online Ready</span>
                </div>
                <p className="text-[9px] text-gray-500 font-mono mt-1 select-none">
                  By Rifat
                </p>
              </div>
              <button 
                onClick={handleLogout} 
                className="ml-auto p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center p-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-500 to-emerald-800 flex items-center justify-center font-bold text-xs text-white border border-green-500/30 overflow-hidden shrink-0">
                {isHydrated && user?.photoURL ? (
                  <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  isHydrated ? initials : 'CC'
                )}
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
