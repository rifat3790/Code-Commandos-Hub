"use client";

import { useState } from 'react';
import OrdersDashboard from './OrdersDashboard';
import IssuesDashboard from './IssuesDashboard';
import WorkloadMetricsTab from './WorkloadMetricsTab';
import { LayoutDashboard, AlertCircle, TrendingUp } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuth } from '@/context/AuthContext';

export default function TrackerDashboard({ 
  csvDataOrders, 
  csvDataIssues 
}: { 
  csvDataOrders: string, 
  csvDataIssues: string 
}) {
  const [activeTab, setActiveTab] = useState<'orders' | 'issues' | 'metrics'>('orders');
  const { settings, updateSettings } = useWorkspaceStore();
  const { dbUser } = useAuth();

  const isSuperAdmin = dbUser?.role === 'super_admin';
  const activeLayout = settings?.globalLayout || 'default';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex bg-gray-900 border-glass-border p-1 rounded-2xl w-full md:w-fit overflow-x-auto whitespace-nowrap scrollbar-none flex-nowrap shrink-0 max-w-full shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium text-sm shrink-0 justify-center ${
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
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium text-sm shrink-0 justify-center ${
              activeTab === 'issues' 
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20 glow-red' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Project Issues
          </button>
          {(dbUser?.email === 'refayethossenmd@gmail.com' || dbUser?.showWorkloadMetrics === true) && (
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium text-sm shrink-0 justify-center ${
                activeTab === 'metrics' 
                  ? 'bg-green-500 text-white shadow-md shadow-green-500/20 glow-green' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Workload Metrics
            </button>
          )}
        </div>
      </div>

      {activeTab === 'orders' ? (
        <OrdersDashboard csvData={csvDataOrders} activeLayout={activeLayout} />
      ) : activeTab === 'issues' ? (
        <IssuesDashboard csvData={csvDataIssues} activeLayout={activeLayout} />
      ) : (
        <WorkloadMetricsTab csvData={csvDataOrders} />
      )}
    </div>
  );
}
