'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import WorkspaceOverviewTab from './WorkspaceOverviewTab';
import MonthlyTargetTab from './MonthlyTargetTab';
import TeamDeliveryTab from './TeamDeliveryTab';
import { LayoutDashboard, Target, Truck } from 'lucide-react';

interface Props {
  csvDataOrders: string;
}

export default function WorkspaceDashboard({ csvDataOrders }: Props) {
  const { dbUser, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'monthly_target' | 'team_delivery'>('overview');

  if (loading || !dbUser) {
    return <div className="p-8 text-white">Loading workspace...</div>;
  }

  const canViewMonthlyTarget = dbUser.role === 'super_admin' || dbUser.role === 'admin' || dbUser.canViewWorkspaceMonthlyTarget;
  const canViewTeamDelivery = dbUser.role === 'super_admin' || dbUser.role === 'admin' || dbUser.canViewWorkspaceTeamDelivery;

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      {(canViewMonthlyTarget || canViewTeamDelivery) && (
        <div className="flex border-b border-glass-border">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3 text-xs uppercase font-extrabold flex items-center gap-2 ${
              activeTab === 'overview' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-500 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          
          {canViewMonthlyTarget && (
            <button
              onClick={() => setActiveTab('monthly_target')}
              className={`px-5 py-3 text-xs uppercase font-extrabold flex items-center gap-2 ${
                activeTab === 'monthly_target' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4" /> Monthly Target
            </button>
          )}

          {canViewTeamDelivery && (
            <button
              onClick={() => setActiveTab('team_delivery')}
              className={`px-5 py-3 text-xs uppercase font-extrabold flex items-center gap-2 ${
                activeTab === 'team_delivery' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" /> Team Delivery
            </button>
          )}
        </div>
      )}

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'overview' && <WorkspaceOverviewTab />}
        {activeTab === 'monthly_target' && canViewMonthlyTarget && <MonthlyTargetTab />}
        {activeTab === 'team_delivery' && canViewTeamDelivery && <TeamDeliveryTab csvDataOrders={csvDataOrders} />}
      </div>
    </div>
  );
}
