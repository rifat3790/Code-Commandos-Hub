'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Terminal } from 'lucide-react';
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

import { AuthProvider } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

import GlobalPendingModal from './GlobalPendingModal';

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
            {children}
          </main>
        </div>
      </div>
      
      {/* Global Modals */}
      <GlobalPendingModal />
    </AuthProvider>
  );
}
