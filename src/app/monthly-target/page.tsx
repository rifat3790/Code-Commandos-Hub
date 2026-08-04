'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import MonthlyTargetTab from '@/components/workspace/MonthlyTargetTab';
import { ShieldAlert, Target, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MonthlyTargetPage() {
  const { dbUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b16] flex items-center justify-center p-6 text-gray-400">
        <div className="flex items-center gap-3 bg-gray-900 border border-glass-border px-6 py-4 rounded-2xl shadow-2xl">
          <Target className="w-6 h-6 animate-pulse text-brand-green" />
          <span className="text-sm font-semibold">Loading Monthly Target Dashboard...</span>
        </div>
      </div>
    );
  }

  const canViewMonthlyTarget = Boolean(
    dbUser?.role === 'super_admin' ||
    dbUser?.role === 'admin' ||
    dbUser?.canViewWorkspaceMonthlyTarget ||
    (dbUser?.allowedMenus && dbUser.allowedMenus.includes('Monthly Target'))
  );

  if (!canViewMonthlyTarget) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-gray-900/90 border border-red-500/30 rounded-2xl max-w-lg w-full p-8 text-center space-y-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-400 shadow-lg shadow-red-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Access Restricted</h2>
            <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
              You do not have permission to view the Monthly Target dashboard. Please contact your system administrator to request access permission.
            </p>
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-center gap-3">
            <Link
              href="/workspace"
              className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Workspace</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      <MonthlyTargetTab />
    </div>
  );
}
