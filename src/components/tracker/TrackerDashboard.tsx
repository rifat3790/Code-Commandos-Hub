"use client";

import { useState } from 'react';
import OrdersDashboard from './OrdersDashboard';
import IssuesDashboard from './IssuesDashboard';
import { LayoutDashboard, AlertCircle } from 'lucide-react';

export default function TrackerDashboard({ 
  csvDataOrders, 
  csvDataIssues 
}: { 
  csvDataOrders: string, 
  csvDataIssues: string 
}) {
  const [activeTab, setActiveTab] = useState<'orders' | 'issues'>('orders');

  return (
    <div className="space-y-6">
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

      {activeTab === 'orders' ? (
        <OrdersDashboard csvData={csvDataOrders} />
      ) : (
        <IssuesDashboard csvData={csvDataIssues} />
      )}
    </div>
  );
}
