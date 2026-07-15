'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Plus, Save, Calendar, ChevronLeft, Trash2, Edit2, UserPlus, Target, TrendingUp, X, DollarSign, Award, Percent } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function MonthlyTargetTab() {
  const { user, dbUser } = useAuth();
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active navigation states
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Modals state
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [newMonthName, setNewMonthName] = useState('');
  const [isCreatingMonth, setIsCreatingMonth] = useState(false);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeEditTarget, setActiveEditTarget] = useState<any | null>(null);
  const [isSavingTarget, setIsSavingTarget] = useState(false);

  const isAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';

  useEffect(() => {
    if (user?.uid) {
      fetchTargets();
    }
  }, [user]);

  const fetchTargets = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/workspace/targets?uid=${user.uid}`);
      const data = await res.json();
      if (data.success) {
        setTargets(data.targets);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load targets');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique months from targets
  const uniqueMonths = Array.from(new Set(targets.map(t => t.monthName))).sort((a, b) => {
    // Sort descending (latest month first)
    return b.localeCompare(a);
  });

  const handleCreateMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedMonth = newMonthName.trim();
    if (!formattedMonth || !user?.uid) return;

    if (uniqueMonths.includes(formattedMonth)) {
      toast.error('This month folder already exists!');
      return;
    }

    setIsCreatingMonth(true);
    try {
      // Initialize the month with a default target (Team CC) with no members
      const res = await fetch('/api/workspace/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          teamName: 'CC',
          monthName: formattedMonth,
          members: []
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Month folder "${formattedMonth}" created`);
        setNewMonthName('');
        setIsMonthModalOpen(false);
        await fetchTargets();
        setSelectedMonth(formattedMonth); // Auto navigate to newly created month
      } else {
        toast.error(data.error || 'Failed to create month');
      }
    } catch (err) {
      toast.error('Error creating month');
    } finally {
      setIsCreatingMonth(false);
    }
  };

  const handleCreateTeamTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const team = newTeamName.trim().toUpperCase();
    if (!team || !selectedMonth || !user?.uid) return;

    // Check if team target already exists for selectedMonth
    const teamExists = targets.some(t => t.monthName === selectedMonth && t.teamName.toUpperCase() === team);
    if (teamExists) {
      toast.error(`Team "${team}" target already exists for ${selectedMonth}!`);
      return;
    }

    setIsCreatingTeam(true);
    try {
      const res = await fetch('/api/workspace/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          teamName: team,
          monthName: selectedMonth,
          members: []
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Team ${team} target created for ${selectedMonth}`);
        setNewTeamName('');
        setIsTeamModalOpen(false);
        fetchTargets();
      } else {
        toast.error(data.error || 'Failed to create team target');
      }
    } catch (err) {
      toast.error('Error creating team target');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleDeleteTeamTarget = async (targetId: string, teamName: string) => {
    if (!user?.uid) return;
    if (!confirm(`Are you sure you want to delete targets for Team ${teamName}? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/workspace/targets?uid=${user.uid}&id=${targetId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Deleted Team ${teamName} targets`);
        fetchTargets();
      } else {
        toast.error(data.error || 'Failed to delete target');
      }
    } catch (err) {
      toast.error('Error deleting target');
    }
  };

  const handleDeleteMonthFolder = async (monthName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering month navigation click
    if (!user?.uid) return;
    if (!confirm(`Are you sure you want to delete the entire month "${monthName}"? All team targets and employee records inside it will be permanently deleted!`)) return;

    try {
      const res = await fetch(`/api/workspace/targets?uid=${user.uid}&month=${encodeURIComponent(monthName)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Month folder "${monthName}" and all contents deleted`);
        if (selectedMonth === monthName) {
          setSelectedMonth(null);
        }
        fetchTargets();
      } else {
        toast.error(data.error || 'Failed to delete month folder');
      }
    } catch (err) {
      toast.error('Error deleting month folder');
    }
  };

  // Open edit modal for specific team targets
  const handleOpenEditModal = (target: any) => {
    // Deep copy target so edits don't affect live state until save
    setActiveEditTarget(JSON.parse(JSON.stringify(target)));
    setIsEditModalOpen(true);
  };

  const handleAddMemberRow = () => {
    if (!activeEditTarget) return;
    const updated = {
      ...activeEditTarget,
      members: [
        ...activeEditTarget.members,
        { employeeId: '', name: '', officialTarget: 0, teamTarget: 0, achieved: 0 }
      ]
    };
    setActiveEditTarget(updated);
  };

  const handleRemoveMemberRow = (idx: number) => {
    if (!activeEditTarget) return;
    const updatedMembers = [...activeEditTarget.members];
    updatedMembers.splice(idx, 1);
    setActiveEditTarget({
      ...activeEditTarget,
      members: updatedMembers
    });
  };

  const handleMemberFieldChange = (idx: number, field: string, value: any) => {
    if (!activeEditTarget) return;
    const updatedMembers = [...activeEditTarget.members];
    updatedMembers[idx] = {
      ...updatedMembers[idx],
      [field]: value
    };
    setActiveEditTarget({
      ...activeEditTarget,
      members: updatedMembers
    });
  };

  const handleSaveEditedTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditTarget || !user?.uid) return;

    // Validate members
    const invalidMember = activeEditTarget.members.some((m: any) => !m.employeeId.trim() || !m.name.trim());
    if (invalidMember) {
      toast.error('All member rows must have a valid Employee ID and Name');
      return;
    }

    setIsSavingTarget(true);
    try {
      const res = await fetch('/api/workspace/targets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          targetId: activeEditTarget._id,
          members: activeEditTarget.members
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Targets saved successfully');
        setIsEditModalOpen(false);
        setActiveEditTarget(null);
        fetchTargets();
      } else {
        toast.error(data.error || 'Failed to save targets');
      }
    } catch (err) {
      toast.error('Error saving targets');
    } finally {
      setIsSavingTarget(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 flex flex-col justify-center items-center gap-3">
        <Loader2 className="w-10 h-10 text-brand-green animate-spin" />
        <span className="text-gray-400 text-sm font-semibold tracking-wider uppercase">Loading targets database...</span>
      </div>
    );
  }

  // Filter targets for active selected month
  const activeMonthTargets = targets.filter(t => t.monthName === selectedMonth);

  return (
    <div className="space-y-6">
      {/* Month Selection View */}
      {!selectedMonth ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-[#0b0f19] border border-gray-800 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-white font-extrabold text-2xl flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-white/5 shadow-inner">
                  <Calendar className="w-6 h-6 text-brand-green" />
                </div>
                Monthly Targets
              </h2>
              <p className="text-sm text-gray-400 mt-2 font-medium">Select a month folder to view and configure company performance targets.</p>
            </div>
            
            {isAdmin && (
              <button 
                onClick={() => setIsMonthModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-sm transition-all shadow-lg glow-green cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
                Create Month
              </button>
            )}
          </div>

          {uniqueMonths.length === 0 ? (
            <div className="glass-panel p-16 rounded-2xl border border-glass-border text-center flex flex-col items-center">
              <Calendar className="w-16 h-16 text-gray-700 mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">No Months Registered</h3>
              <p className="text-gray-400 mb-6 max-w-md">Initialize a performance month folder to start tracking team target objectives and achievements.</p>
              {isAdmin && (
                <button 
                  onClick={() => setIsMonthModalOpen(true)} 
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-sm transition-all shadow-lg glow-green"
                >
                  <Plus className="w-4 h-4 stroke-[3px]" /> Create First Month
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {uniqueMonths.map(m => {
                const monthTeams = targets.filter(t => t.monthName === m);
                const totalTargetVal = monthTeams.reduce((acc, t) => acc + t.members.reduce((sum: number, mem: any) => sum + (mem.teamTarget || 0), 0), 0);
                const totalAchievedVal = monthTeams.reduce((acc, t) => acc + t.members.reduce((sum: number, mem: any) => sum + (mem.achieved || 0), 0), 0);
                const achievementPercent = totalTargetVal > 0 ? Math.round((totalAchievedVal / totalTargetVal) * 100) : 0;

                return (
                  <div 
                    key={m} 
                    onClick={() => setSelectedMonth(m)}
                    className="glass-panel p-6 rounded-2xl border border-glass-border hover:border-brand-green/40 cursor-pointer transition-all hover:-translate-y-1.5 group relative overflow-hidden flex flex-col justify-between min-h-[180px] bg-[#0c101d]/60 hover:bg-[#0f1527]/80"
                  >
                    {/* Glow decoration */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors" />
                    
                    {isAdmin && (
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all z-20">
                        <button 
                          onClick={(e) => handleDeleteMonthFolder(m, e)} 
                          className="p-2 text-red-400 hover:text-red-355 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all border border-red-500/20"
                          title="Delete Month Folder"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div>
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 border border-green-500/20 group-hover:border-green-500/40 transition-colors">
                        <Calendar className="w-5 h-5 text-brand-green group-hover:scale-110 transition-transform" />
                      </div>
                      <h3 className="text-lg font-black text-white group-hover:text-brand-green transition-colors leading-tight">{m}</h3>
                      <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">{monthTeams.length} {monthTeams.length === 1 ? 'Team' : 'Teams'} Setup</p>
                    </div>

                    <div className="mt-6 pt-3 border-t border-glass-border space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-gray-400">
                        <span>Month Target Progress</span>
                        <span className={achievementPercent >= 100 ? 'text-green-400' : achievementPercent > 60 ? 'text-yellow-400' : 'text-gray-400'}>
                          {achievementPercent}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${achievementPercent >= 100 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : achievementPercent > 60 ? 'bg-yellow-500' : 'bg-brand-green'}`}
                          style={{ width: `${Math.min(100, achievementPercent)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Month Details View */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedMonth(null)}
                className="p-2.5 bg-gray-900 border border-glass-border hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-all flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">{selectedMonth} TARGETS</h2>
                <p className="text-xs text-gray-400 font-semibold mt-0.5 uppercase tracking-wider">Workspace Performance Ledger</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-stretch sm:self-auto">
              <button 
                onClick={fetchTargets}
                className="p-3 bg-gray-900 border border-glass-border hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-all shrink-0"
              >
                <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {isAdmin && (
                <button 
                  onClick={() => setIsTeamModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg glow-green shrink-0 flex-1 sm:flex-initial justify-center"
                >
                  <Plus className="w-4 h-4 stroke-[3px]" />
                  Add Team Target
                </button>
              )}
            </div>
          </div>

          {/* Month Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="glass-panel p-5 rounded-2xl border border-glass-border bg-[#0b0f19]/40 relative overflow-hidden flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Targets Value</p>
                <p className="text-2xl font-black text-white mt-0.5">
                  ${activeMonthTargets.reduce((acc, t) => acc + t.members.reduce((sum: number, mem: any) => sum + (mem.teamTarget || 0), 0), 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-glass-border bg-[#0b0f19]/40 relative overflow-hidden flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Achieved Value</p>
                <p className="text-2xl font-black text-green-400 mt-0.5">
                  ${activeMonthTargets.reduce((acc, t) => acc + t.members.reduce((sum: number, mem: any) => sum + (mem.achieved || 0), 0), 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-glass-border bg-[#0b0f19]/40 relative overflow-hidden flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <Percent className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Overall Achievement</p>
                <p className="text-2xl font-black text-yellow-400 mt-0.5">
                  {(() => {
                    const tar = activeMonthTargets.reduce((acc, t) => acc + t.members.reduce((sum: number, mem: any) => sum + (mem.teamTarget || 0), 0), 0);
                    const ach = activeMonthTargets.reduce((acc, t) => acc + t.members.reduce((sum: number, mem: any) => sum + (mem.achieved || 0), 0), 0);
                    return tar > 0 ? Math.round((ach / tar) * 100) : 0;
                  })()}%
                </p>
              </div>
            </div>
          </div>

          {/* Active Teams Target Cards */}
          <div className="space-y-8">
            {activeMonthTargets.map(target => {
              const totalOfficialTarget = target.members.reduce((sum: number, m: any) => sum + (Number(m.officialTarget) || 0), 0);
              const totalTeamTarget = target.members.reduce((sum: number, m: any) => sum + (Number(m.teamTarget) || 0), 0);
              const totalAchieved = target.members.reduce((sum: number, m: any) => sum + (Number(m.achieved) || 0), 0);
              const teamAchievement = totalTeamTarget > 0 ? Math.round((totalAchieved / totalTeamTarget) * 100) : 0;

              return (
                <div key={target._id} className="bg-gray-900/60 border border-glass-border rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
                  <div className="p-5 border-b border-glass-border bg-black/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 uppercase tracking-tight">Team {target.teamName}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase font-mono tracking-wider ${
                          teamAchievement >= 100 ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                          teamAchievement > 60 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                          'bg-gray-500/10 border-gray-500/30 text-gray-400'
                        }`}>
                          {teamAchievement}% Achieved
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">Targets Configured for {target.members.length} {target.members.length === 1 ? 'member' : 'members'}</p>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleOpenEditModal(target)}
                          className="px-4 py-2 border border-blue-500/30 hover:border-blue-500/60 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold uppercase rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Manage Team
                        </button>
                        <button
                          onClick={() => handleDeleteTeamTarget(target._id, target.teamName)}
                          className="p-2 border border-red-500/30 hover:border-red-500/60 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all cursor-pointer"
                          title="Delete Team targets"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Presentation Read-Only Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead className="bg-[#0b0f19] text-[11px] text-gray-400 font-bold uppercase tracking-widest border-b border-glass-border">
                        <tr>
                          <th className="px-6 py-4">Employee ID</th>
                          <th className="px-6 py-4">Member Name</th>
                          <th className="px-6 py-4 text-right">Official Target</th>
                          <th className="px-6 py-4 text-right">Team Target</th>
                          <th className="px-6 py-4 text-right">Achieved</th>
                          <th className="px-6 py-4 text-right w-44">Achievement progress</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-glass-border bg-black/10">
                        {target.members.map((m: any, idx: number) => {
                          const itemProgress = m.teamTarget > 0 ? Math.round((m.achieved / m.teamTarget) * 100) : 0;
                          return (
                            <tr key={idx} className="hover:bg-gray-800/20 transition-all duration-200">
                              <td className="px-6 py-3.5 text-xs font-mono font-bold text-gray-400">{m.employeeId}</td>
                              <td className="px-6 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center text-xs font-extrabold text-brand-green">
                                    {m.name.charAt(0)}
                                  </div>
                                  <span className="text-white text-sm font-medium">{m.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-3.5 text-right font-mono text-gray-300 text-sm font-medium">${m.officialTarget?.toLocaleString()}</td>
                              <td className="px-6 py-3.5 text-right font-mono text-gray-300 text-sm font-semibold">${m.teamTarget?.toLocaleString()}</td>
                              <td className="px-6 py-3.5 text-right font-mono text-green-400 text-sm font-black">${m.achieved?.toLocaleString()}</td>
                              <td className="px-6 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  <span className={`text-xs font-black w-8 ${itemProgress >= 100 ? 'text-green-400' : itemProgress > 60 ? 'text-yellow-400' : 'text-gray-400'}`}>{itemProgress}%</span>
                                  <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-700 ${itemProgress >= 100 ? 'bg-green-500' : itemProgress > 60 ? 'bg-yellow-500' : 'bg-brand-green'}`} 
                                      style={{ width: `${Math.min(100, itemProgress)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {target.members.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                              No targets configured for this team yet. {isAdmin ? 'Click "Manage Team" to add members.' : ''}
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-black/30 border-t-2 border-glass-border">
                        <tr className="font-extrabold text-xs uppercase tracking-wider text-white">
                          <td colSpan={2} className="px-6 py-4 text-right">TOTAL LEDGER</td>
                          <td className="px-6 py-4 text-right font-mono text-gray-300">${totalOfficialTarget?.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-mono text-yellow-400">${totalTeamTarget?.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-mono text-green-400">${totalAchieved?.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <span className="text-yellow-400 text-xs font-black">{teamAchievement}%</span>
                              <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" 
                                  style={{ width: `${Math.min(100, teamAchievement)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE MONTH MODAL */}
      <AnimatePresence>
        {isMonthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsMonthModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm bg-gray-900 border border-glass-border rounded-2xl shadow-2xl overflow-hidden z-10">
              <div className="p-5 border-b border-glass-border flex justify-between items-center bg-black/40">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-green" /> Create Month Folder
                </h3>
                <button onClick={() => setIsMonthModalOpen(false)} className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateMonth} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Month Name</label>
                  <input 
                    required 
                    autoFocus 
                    type="text" 
                    placeholder="e.g. July 2026" 
                    value={newMonthName} 
                    onChange={e => setNewMonthName(e.target.value)} 
                    className="w-full glass-input px-3.5 py-2.5 text-sm bg-black/50 border border-gray-800 rounded-xl focus:border-green-500 focus:outline-none text-white transition-colors" 
                  />
                  <p className="text-[10px] text-gray-500">Provide Month and Year to distinguish target collections.</p>
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsMonthModalOpen(false)} className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" disabled={isCreatingMonth} className="px-5 py-2.5 text-xs font-extrabold bg-brand-green hover:bg-brand-green-hover text-black rounded-xl transition-colors flex items-center gap-2 shadow-lg glow-green">
                    {isCreatingMonth ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Folder'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE TEAM TARGET MODAL */}
      <AnimatePresence>
        {isTeamModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsTeamModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm bg-gray-900 border border-glass-border rounded-2xl shadow-2xl overflow-hidden z-10">
              <div className="p-5 border-b border-glass-border flex justify-between items-center bg-black/40">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-brand-green" /> Add Team Target
                </h3>
                <button onClick={() => setIsTeamModalOpen(false)} className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateTeamTarget} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Team Initials / Code</label>
                  <input 
                    required 
                    autoFocus 
                    type="text" 
                    placeholder="e.g. CC, CM, QA, DM" 
                    value={newTeamName} 
                    onChange={e => setNewTeamName(e.target.value)} 
                    className="w-full glass-input px-3.5 py-2.5 text-sm bg-black/50 border border-gray-800 rounded-xl focus:border-green-500 focus:outline-none text-white transition-colors" 
                  />
                  <p className="text-[10px] text-gray-500">Provide team code (normally 2 letters like CC, CM) for {selectedMonth}.</p>
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsTeamModalOpen(false)} className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" disabled={isCreatingTeam} className="px-5 py-2.5 text-xs font-extrabold bg-brand-green hover:bg-brand-green-hover text-black rounded-xl transition-colors flex items-center gap-2 shadow-lg glow-green">
                    {isCreatingTeam ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Team'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT TARGETS (MANAGE TEAM MEMBERS) MODAL */}
      <AnimatePresence>
        {isEditModalOpen && activeEditTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-4xl bg-gray-900 border border-glass-border rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
            >
              <div className="p-5 border-b border-glass-border flex justify-between items-center bg-black/40">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 uppercase">
                    <Edit2 className="w-5 h-5 text-brand-green" /> Manage Team {activeEditTarget.teamName} Targets
                  </h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Month: {activeEditTarget.monthName}</p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedTarget} className="flex-1 overflow-y-auto p-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Configure Member Entry List</span>
                    <button
                      type="button"
                      onClick={handleAddMemberRow}
                      className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Add Member Row
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-gray-800 rounded-xl">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#0b0f19] text-gray-400 font-bold uppercase tracking-wider border-b border-gray-800">
                        <tr>
                          <th className="px-4 py-3">Employee ID</th>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3 text-right">Official Target ($)</th>
                          <th className="px-4 py-3 text-right">Team Target ($)</th>
                          <th className="px-4 py-3 text-right">Achieved ($)</th>
                          <th className="px-4 py-3 text-center w-16">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50 bg-black/20">
                        {activeEditTarget.members.map((m: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-800/10 transition-colors">
                            <td className="px-3 py-2">
                              <input 
                                required
                                type="text" 
                                value={m.employeeId} 
                                onChange={e => handleMemberFieldChange(idx, 'employeeId', e.target.value)} 
                                placeholder="ID (e.g. EMP-101)" 
                                className="w-28 bg-black border border-gray-850 px-2 py-1.5 rounded-lg text-white font-mono" 
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input 
                                required
                                type="text" 
                                value={m.name} 
                                onChange={e => handleMemberFieldChange(idx, 'name', e.target.value)} 
                                placeholder="Employee Name" 
                                className="w-44 bg-black border border-gray-850 px-2 py-1.5 rounded-lg text-white font-semibold" 
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input 
                                type="number" 
                                value={m.officialTarget} 
                                onChange={e => handleMemberFieldChange(idx, 'officialTarget', Math.max(0, Number(e.target.value)))} 
                                className="w-24 bg-black border border-gray-850 px-2 py-1.5 rounded-lg text-white text-right font-mono" 
                                min="0"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input 
                                type="number" 
                                value={m.teamTarget} 
                                onChange={e => handleMemberFieldChange(idx, 'teamTarget', Math.max(0, Number(e.target.value)))} 
                                className="w-24 bg-black border border-gray-850 px-2 py-1.5 rounded-lg text-white text-right font-semibold font-mono" 
                                min="0"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input 
                                type="number" 
                                value={m.achieved} 
                                onChange={e => handleMemberFieldChange(idx, 'achieved', Math.max(0, Number(e.target.value)))} 
                                className="w-24 bg-black border border-green-950/40 px-2 py-1.5 rounded-lg text-green-400 text-right font-bold font-mono focus:border-green-500" 
                                min="0"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button 
                                type="button" 
                                onClick={() => handleRemoveMemberRow(idx)}
                                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {activeEditTarget.members.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500 font-medium">No employees added. Click "Add Member Row" to append entries.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-glass-border flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsEditModalOpen(false)} 
                    className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSavingTarget} 
                    className="px-5 py-2.5 text-xs font-extrabold bg-brand-green hover:bg-brand-green-hover text-black rounded-xl transition-colors flex items-center gap-2 shadow-lg glow-green cursor-pointer"
                  >
                    {isSavingTarget ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Team targets
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
