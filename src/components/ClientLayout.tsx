'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Terminal, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

// Intercept hydration warnings in development to prevent browser-extension-induced overlay crashes
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    const errorMsg = args[0]?.toString() || '';
    if (
      errorMsg.includes('Hydration failed') ||
      errorMsg.includes('hydration-error') ||
      errorMsg.includes('Mismatched') ||
      errorMsg.includes('does not match the server') ||
      errorMsg.includes('bis_skin_checked') ||
      errorMsg.includes('Text content did not match')
    ) {
      return;
    }
    originalError(...args);
  };
}

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspaceStore';
import GlobalPendingModal from './GlobalPendingModal';
import ChatbotWidget from './chat/ChatbotWidget';

function ProtectedMainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const storeSettings = useWorkspaceStore(state => state.settings);
  const isHydrated = useWorkspaceStore(state => state.isHydrated);
  const { dbUser } = useAuth();

  // Route map to identify which menu controls which path
  const routeToMenuMap: Record<string, string> = {
    '/workspace': 'Workspace',
    '/tracker': 'Order Tracker',
    '/personal-projects': 'Personal Projects',
    '/message-helper': 'Message Helper',
    '/templates': 'Templates',
    '/schema': 'Schema Builder',
    '/audit': 'Audit Suite',
    '/credentials': 'Projects',
    '/mockup': 'Mockup Studio',
    '/chat': 'AI Assistant',
    '/notes': 'Team Notes',
    '/downloads': 'Downloads',
    '/member': 'Member Profile',
    '/settings': 'Settings',
    '/': 'Home'
  };

  let currentMenuName = '';
  // Check exact match first
  if (routeToMenuMap[pathname]) {
    currentMenuName = routeToMenuMap[pathname];
  } else {
    // Check if pathname starts with any of the routes (excluding '/')
    const matchedRoute = Object.keys(routeToMenuMap).find(route => route !== '/' && pathname.startsWith(route));
    if (matchedRoute) {
      currentMenuName = routeToMenuMap[matchedRoute];
    }
  }

  const isAdminOrSuperAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';
  const isSuperAdmin = dbUser?.role === 'super_admin';
  
  // By default, authorized until proven otherwise.
  // Wait until hydrated to show unauthorized to prevent flashing on load
  let isAuthorized = true;
  if (isHydrated && dbUser !== undefined) {
    if (pathname.startsWith('/admin') && !isAdminOrSuperAdmin) {
       isAuthorized = false;
    } else if (!isSuperAdmin && currentMenuName) {
       // All roles except super_admin respect the enabledMenus setting
       const enabledMenus = storeSettings?.enabledMenus || Object.values(routeToMenuMap);
       if (!enabledMenus.includes(currentMenuName)) {
         isAuthorized = false;
       }
    }
  }

  if (!isAuthorized) {
    return (
       <div className="flex flex-col items-center justify-center h-full text-center">
         <ShieldAlert className="w-16 h-16 text-red-500 mb-4 glow-red" />
         <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
         <p className="text-gray-400">You do not have permission to view this page. The administrator has disabled this section for your account.</p>
       </div>
    );
  }

  return <>{children}</>;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Don't render the sidebar or standard layout structure for the login page
  if (pathname === '/login' || pathname === '/login/') {
    return (
      <AuthProvider>
        {children}
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-[#030712]">
        {/* Sidebar - responsive built-in mobile/desktop */}
        <Sidebar isMobileOpen={isMobileOpen} onCloseMobile={() => setIsMobileOpen(false)} />
        
        {/* Main Content container */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Mobile Header Bar */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-950/80 border-b border-glass-border select-none shrink-0 z-30 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setIsMobileOpen(true)}
                className="p-2 rounded-lg bg-gray-900 border border-glass-border text-gray-400 hover:text-white transition-colors"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7.5 h-7.5 rounded-lg bg-green-500 flex items-center justify-center glow-green shrink-0">
                  <Terminal className="w-4.5 h-4.5 text-black stroke-[2.5]" />
                </div>
                <span className="font-bold text-sm tracking-wider text-white">CODE COMMANDOS HUB</span>
              </Link>
            </div>
          </header>

          {/* Main page content scroll viewport */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative bg-radial-[circle_at_top_right,rgba(16,185,129,0.03),transparent_40%]">
            <ProtectedMainContent>{children}</ProtectedMainContent>
          </main>
        </div>
      </div>
      
      {/* Global Modals */}
      <GlobalPendingModal />
      <ChatbotWidget />
    </AuthProvider>
  );
}
