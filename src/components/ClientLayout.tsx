'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu, Terminal, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { CallProvider } from '@/context/CallContext';

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
import { ThemeProvider } from '@/context/ThemeContext';
import { usePathname } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspaceStore';
import GlobalPendingModal from './GlobalPendingModal';
import ChatbotWidget from './chat/ChatbotWidget';
import CommandMenu from './CommandMenu';
import FocusTimer from './FocusTimer';
import NotificationBell from './NotificationBell';

import { motion, AnimatePresence } from 'framer-motion';

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
       // Check settings based on role
       // Check settings based on role or specific user allowedMenus
       let enabledMenus = [];
       if (dbUser?.allowedMenus && dbUser.allowedMenus.length > 0) {
         enabledMenus = dbUser.allowedMenus;
       } else {
         const userMenus = storeSettings?.userEnabledMenus?.length ? storeSettings.userEnabledMenus : (storeSettings?.enabledMenus || Object.values(routeToMenuMap));
         const adminMenus = storeSettings?.adminEnabledMenus?.length ? storeSettings.adminEnabledMenus : (storeSettings?.enabledMenus || Object.values(routeToMenuMap));
         enabledMenus = dbUser?.role === 'admin' ? adminMenus : userMenus;
       }

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

  // Track usage history
  useEffect(() => {
    if (isHydrated && dbUser && currentMenuName) {
      // Use fire-and-forget fetch to log usage
      fetch('/api/users/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: dbUser.firebaseUid, path: currentMenuName })
      }).catch(err => console.error("Usage tracking error:", err));
    }
  }, [currentMenuName, isHydrated, dbUser?.firebaseUid]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function HeartbeatTrigger() {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user?.uid) return;
    
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/users/active', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firebaseUid: user.uid })
        });
      } catch (err) {
        console.error("Heartbeat error:", err);
      }
    };
    
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return null;
}

function WorkspaceHydrator() {
  const { user } = useAuth();
  const hydrate = useWorkspaceStore(state => state.hydrate);
  
  useEffect(() => {
    if (user?.uid) {
      hydrate(user.uid);
    }
  }, [user?.uid, hydrate]);

  return null;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const storeSettings = useWorkspaceStore(state => state.settings);

  const activeFont = storeSettings?.fontFamily || 'sans';
  const activeRadius = storeSettings?.borderRadius || 'xl';

  const getGoogleFontLink = (font: string) => {
    switch(font) {
      case 'roboto':
        return 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap';
      case 'outfit':
        return 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap';
      case 'playfair':
        return 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap';
      case 'fira-code':
        return 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;700&display=swap';
      case 'montserrat':
        return 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap';
      case 'lora':
        return 'https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap';
      default:
        return '';
    }
  };

  const getFontFamilyCss = (font: string) => {
    switch(font) {
      case 'roboto':
        return "'Roboto', ui-sans-serif, system-ui, sans-serif";
      case 'outfit':
        return "'Outfit', ui-sans-serif, system-ui, sans-serif";
      case 'playfair':
        return "'Playfair Display', Georgia, serif";
      case 'fira-code':
        return "'Fira Code', monospace";
      case 'montserrat':
        return "'Montserrat', ui-sans-serif, system-ui, sans-serif";
      case 'lora':
        return "'Lora', Georgia, serif";
      default:
        return "'Inter', ui-sans-serif, system-ui, sans-serif";
    }
  };

  const getRadiusCssValues = (radius: string) => {
    switch (radius) {
      case 'none':
        return { xs: '0px', sm: '0px', md: '0px', lg: '0px', xl: '0px', '2xl': '0px', '3xl': '0px' };
      case 'sm':
        return { xs: '1px', sm: '2px', md: '3px', lg: '4px', xl: '6px', '2xl': '8px', '3xl': '12px' };
      case 'md':
        return { xs: '2px', sm: '4px', md: '6px', lg: '8px', xl: '10px', '2xl': '12px', '3xl': '16px' };
      case 'lg':
        return { xs: '3px', sm: '6px', md: '8px', lg: '12px', xl: '14px', '2xl': '18px', '3xl': '24px' };
      case 'xl':
        return { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '20px', '2xl': '24px', '3xl': '32px' };
      case '2xl':
        return { xs: '6px', sm: '12px', md: '16px', lg: '24px', xl: '28px', '2xl': '36px', '3xl': '48px' };
      case '3xl':
        return { xs: '8px', sm: '16px', md: '24px', lg: '32px', xl: '40px', '2xl': '48px', '3xl': '64px' };
      default:
        return { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '20px', '2xl': '24px', '3xl': '32px' };
    }
  };

  const fontUrl = getGoogleFontLink(activeFont);
  const fontFamilyCss = getFontFamilyCss(activeFont);
  const radiusVals = getRadiusCssValues(activeRadius);

  // Don't render the sidebar or standard layout structure for the login page
  if (pathname === '/login' || pathname === '/login/') {
    return (
      <AuthProvider>
        {fontUrl && <link href={fontUrl} rel="stylesheet" />}
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --radius-xs: ${radiusVals.xs} !important;
            --radius-sm: ${radiusVals.sm} !important;
            --radius-md: ${radiusVals.md} !important;
            --radius-lg: ${radiusVals.lg} !important;
            --radius-xl: ${radiusVals.xl} !important;
            --radius-2xl: ${radiusVals['2xl']} !important;
            --radius-3xl: ${radiusVals['3xl']} !important;
            --font-sans: ${fontFamilyCss} !important;
            --font-geist-sans: ${fontFamilyCss} !important;
          }
          body, html, button, input, select, textarea, [class*="font-sans"] {
            font-family: ${fontFamilyCss} !important;
          }
          *:not(pre):not(code):not(.font-mono):not(kbd):not([class*="font-mono"]) {
            font-family: ${fontFamilyCss} !important;
          }
          .rounded:not(.rounded-full), [class*="rounded-md"]:not(.rounded-full) {
            border-radius: ${radiusVals.md} !important;
          }
          .rounded-sm:not(.rounded-full) {
            border-radius: ${radiusVals.sm} !important;
          }
          .rounded-lg:not(.rounded-full) {
            border-radius: ${radiusVals.lg} !important;
          }
          .rounded-xl:not(.rounded-full) {
            border-radius: ${radiusVals.xl} !important;
          }
          .rounded-2xl:not(.rounded-full) {
            border-radius: ${radiusVals['2xl']} !important;
          }
          .rounded-3xl:not(.rounded-full) {
            border-radius: ${radiusVals['3xl']} !important;
          }
        `}} />
        {children}
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        {fontUrl && <link href={fontUrl} rel="stylesheet" />}
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --radius-xs: ${radiusVals.xs} !important;
            --radius-sm: ${radiusVals.sm} !important;
            --radius-md: ${radiusVals.md} !important;
            --radius-lg: ${radiusVals.lg} !important;
            --radius-xl: ${radiusVals.xl} !important;
            --radius-2xl: ${radiusVals['2xl']} !important;
            --radius-3xl: ${radiusVals['3xl']} !important;
            --font-sans: ${fontFamilyCss} !important;
            --font-geist-sans: ${fontFamilyCss} !important;
          }
          body, html, button, input, select, textarea, [class*="font-sans"] {
            font-family: ${fontFamilyCss} !important;
          }
          *:not(pre):not(code):not(.font-mono):not(kbd):not([class*="font-mono"]) {
            font-family: ${fontFamilyCss} !important;
          }
          .rounded:not(.rounded-full), [class*="rounded-md"]:not(.rounded-full) {
            border-radius: ${radiusVals.md} !important;
          }
          .rounded-sm:not(.rounded-full) {
            border-radius: ${radiusVals.sm} !important;
          }
          .rounded-lg:not(.rounded-full) {
            border-radius: ${radiusVals.lg} !important;
          }
          .rounded-xl:not(.rounded-full) {
            border-radius: ${radiusVals.xl} !important;
          }
          .rounded-2xl:not(.rounded-full) {
            border-radius: ${radiusVals['2xl']} !important;
          }
          .rounded-3xl:not(.rounded-full) {
            border-radius: ${radiusVals['3xl']} !important;
          }
        `}} />
        <CallProvider>
          <HeartbeatTrigger />
          <WorkspaceHydrator />
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
                <div className="w-7.5 h-7.5 rounded-lg bg-brand-green flex items-center justify-center glow-green shrink-0" style={{ backgroundColor: 'var(--color-brand-green)' }}>
                  <Terminal className="w-4.5 h-4.5 text-black stroke-[2.5]" />
                </div>
                <span className="font-bold text-sm tracking-wider text-white hidden sm:inline-block">CODE COMMANDOS HUB</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <FocusTimer />
            </div>
          </header>

          {/* Main page content scroll viewport */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative bg-radial-[circle_at_top_right,rgba(16,185,129,0.03),transparent_40%]">
            <div className="hidden md:flex absolute top-6 right-8 z-50 items-center gap-4">
              <NotificationBell />
              <FocusTimer />
            </div>
            <ProtectedMainContent>{children}</ProtectedMainContent>
          </main>
        </div>
      </div>
      
        {/* Global Modals */}
        <CommandMenu />
        <GlobalPendingModal />
        <ChatbotWidget />
        </CallProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
