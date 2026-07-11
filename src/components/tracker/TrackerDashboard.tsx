"use client";

import { useState } from 'react';
import OrdersDashboard from './OrdersDashboard';
import IssuesDashboard from './IssuesDashboard';
import { LayoutDashboard, AlertCircle, Palette } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuth } from '@/context/AuthContext';

export default function TrackerDashboard({ 
  csvDataOrders, 
  csvDataIssues 
}: { 
  csvDataOrders: string, 
  csvDataIssues: string 
}) {
  const [activeTab, setActiveTab] = useState<'orders' | 'issues'>('orders');
  const { settings, updateSettings } = useWorkspaceStore();
  const { dbUser } = useAuth();

  const isSuperAdmin = dbUser?.role === 'super_admin';
  const activeLayout = settings?.trackerLayout || 'default';

  const layouts = [
    { id: 'default', name: 'Layout 1: Neon Glassmorphic' },
    { id: 'slate', name: 'Layout 2: Clean Slate & Platinum' },
    { id: 'aurora', name: 'Layout 3: Aurora Gradient' },
    { id: 'cyber', name: 'Layout 4: Cyber-Chrono (Green)' },
    { id: 'gold', name: 'Layout 5: Royal Gold & Onyx' },
    { id: 'obsidian', name: 'Layout 6: Obsidian Minimalist' },
    { id: 'frost', name: 'Layout 7: Glassmorphism Frost (Ice)' },
    { id: 'tokyo', name: 'Layout 8: Tokyo Midnight (Neon)' },
    { id: 'emerald', name: 'Layout 9: Emerald Forest (Velvet)' },
    { id: 'cosmic', name: 'Layout 10: Cosmic Nebula' }
  ];

  const handleLayoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ trackerLayout: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex bg-gray-900 border-glass-border p-1 rounded-2xl w-full md:w-fit shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium text-sm w-1/2 md:w-auto justify-center ${
              activeTab === 'orders' 
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20 glow-purple' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Orders Tracker
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium text-sm w-1/2 md:w-auto justify-center ${
              activeTab === 'issues' 
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20 glow-red' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Project Issues
          </button>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2 bg-gray-900/80 border border-glass-border rounded-2xl px-4 py-2.5 shadow-[0_0_15px_rgba(168,85,247,0.05)] w-full sm:w-auto">
            <Palette className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-xs font-semibold text-gray-300 whitespace-nowrap">Dashboard Theme:</span>
            <select
              value={activeLayout}
              onChange={handleLayoutChange}
              className="bg-transparent text-xs font-bold text-white border-none outline-none cursor-pointer focus:ring-0 w-full sm:w-48"
            >
              {layouts.map((l) => (
                <option key={l.id} value={l.id} className="bg-gray-950 text-gray-200 font-medium">
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeTab === 'orders' ? (
        <OrdersDashboard csvData={csvDataOrders} activeLayout={activeLayout} />
      ) : (
        <IssuesDashboard csvData={csvDataIssues} activeLayout={activeLayout} />
      )}
    </div>
  );
}
