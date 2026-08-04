'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Loader2, Plus, Save, Calendar, ChevronLeft, Trash2, Edit2, 
  Target, TrendingUp, X, DollarSign, Award, Percent, 
  Sliders, Info, Sparkles, AlertCircle, RefreshCw, Trophy, Star, 
  Zap, ChevronDown, ChevronUp, CheckCircle2, Search,
  ClipboardList, Inbox, User, Layers, ArrowUpRight, Flame
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// Circular Progress Ring Component
const ProgressRing = ({ percentage, size = 100, strokeWidth = 8, colorClass = "text-emerald-400", glowColor = "rgba(16, 185, 129, 0.3)" }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;
  
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          className="text-gray-800/80"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            filter: `drop-shadow(0 0 6px ${glowColor})`
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-lg font-black text-white font-mono">{percentage}%</span>
        <span className="text-[7px] text-gray-400 font-extrabold uppercase tracking-widest">Achieved</span>
      </div>
    </div>
  );
};

export default function MonthlyTargetTab() {
  const { user, dbUser, loading: authLoading } = useAuth();
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Month & Navigation
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'overview' | 'simulator'>('ledger');
  const [memberSearch, setMemberSearch] = useState<string>('');
  
  // Target Multiplier Slider for simulator
  const [simulatorMultiplier, setSimulatorMultiplier] = useState<number>(100);

  // Accordions for Team cards
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

  // Modals state
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [newMonthName, setNewMonthName] = useState('');
  const [isCreatingMonth, setIsCreatingMonth] = useState(false);
  
  // Carry Over States
  const [carryOverChecked, setCarryOverChecked] = useState(false);
  const [sourceMonthSelect, setSourceMonthSelect] = useState('');
  const [selectedTeamsChecklist, setSelectedTeamsChecklist] = useState<Record<string, boolean>>({});

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeEditTarget, setActiveEditTarget] = useState<any | null>(null);
  const [isSavingTarget, setIsSavingTarget] = useState(false);
  
  // Bulk Quick Paste Tool
  const [showQuickPaste, setShowQuickPaste] = useState(false);
  const [quickPasteText, setQuickPasteText] = useState('');

  // Pending changes states
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const [isApprovalQueueOpen, setIsApprovalQueueOpen] = useState(false);
  const [isProcessingDecision, setIsProcessingDecision] = useState<string | null>(null);

  // User target adjustment states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [activeRequestTarget, setActiveRequestTarget] = useState<any>(null);
  const [requestedAchieved, setRequestedAchieved] = useState<string>('');
  const [requestType, setRequestType] = useState<'add' | 'override'>('add');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const isAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';
  const activeUid = user?.uid || dbUser?.firebaseUid;
  const lastFetchedUid = useRef<string | null>(null);

  const fetchPendingChanges = async () => {
    try {
      const res = await fetch('/api/pending');
      const data = await res.json();
      if (data.success) {
        const targetChanges = data.changes.filter((c: any) => c.collectionName === 'workspaceTargets');
        setPendingChanges(targetChanges);
      }
    } catch (err) {
      console.error('Failed to load pending changes:', err);
    }
  };

  useEffect(() => {
    if (activeUid) {
      if (activeUid !== lastFetchedUid.current) {
        lastFetchedUid.current = activeUid;
        fetchTargets(activeUid);
        if (isAdmin) {
          fetchPendingChanges();
        }
      }
    } else {
      if (!authLoading) {
        setLoading(false);
      }
    }
  }, [activeUid, authLoading, isAdmin]);

  // Extract unique months sorted descending
  const uniqueMonths = useMemo(() => {
    return Array.from(new Set(targets.map(t => t.monthName))).sort((a, b) => b.localeCompare(a));
  }, [targets]);

  // Auto-select latest month if none selected
  useEffect(() => {
    if (uniqueMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(uniqueMonths[0]);
    }
  }, [uniqueMonths, selectedMonth]);

  // Set default source month for carry-over
  useEffect(() => {
    if (uniqueMonths.length > 0 && !sourceMonthSelect) {
      setSourceMonthSelect(uniqueMonths[0]);
    }
  }, [uniqueMonths, sourceMonthSelect]);

  // Auto-select all teams of source month
  useEffect(() => {
    if (sourceMonthSelect) {
      const sourceMonthTargets = targets.filter(t => t.monthName === sourceMonthSelect);
      const initialChecklist: Record<string, boolean> = {};
      sourceMonthTargets.forEach(t => {
        initialChecklist[t._id] = true;
      });
      setSelectedTeamsChecklist(initialChecklist);
    } else {
      setSelectedTeamsChecklist({});
    }
  }, [sourceMonthSelect, targets]);

  // Expand first team accordion by default when month changes
  useEffect(() => {
    if (selectedMonth) {
      const activeMonthTargets = targets.filter((t: any) => t.monthName === selectedMonth);
      if (activeMonthTargets.length > 0) {
        setExpandedTeams({ [activeMonthTargets[0]._id]: true });
      }
      setSimulatorMultiplier(100);
    }
  }, [selectedMonth, targets]);

  const fetchTargets = async (uidToFetch?: string) => {
    const fetchUid = uidToFetch || activeUid;
    if (!fetchUid) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/workspace/targets?uid=${fetchUid}`);
      const data = await res.json();
      if (data.success) {
        setTargets(data.targets || []);
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (err: any) {
      toast.error('Failed to load targets');
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = (e?: React.MouseEvent) => {
    if (typeof window === 'undefined') return;
    let origin: any = { y: 0.6 };
    if (e) {
      origin = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      };
    }
    confetti({
      particleCount: 120,
      spread: 70,
      origin,
      colors: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899']
    });
  };

  const getDaysRemainingInMonth = (monthStr: string) => {
    if (!monthStr) return { daysLeft: 0, totalDays: 30, isCurrentMonth: false, isPast: false, isFuture: false };
    const parts = monthStr.split(' ');
    if (parts.length !== 2) return { daysLeft: 15, totalDays: 30, isCurrentMonth: false, isPast: false, isFuture: false };
    
    const monthNames = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ];
    const mIndex = monthNames.indexOf(parts[0].toLowerCase());
    const year = parseInt(parts[1]);
    
    if (mIndex === -1 || isNaN(year)) return { daysLeft: 15, totalDays: 30, isCurrentMonth: false, isPast: false, isFuture: false };
    
    const totalDays = new Date(year, mIndex + 1, 0).getDate();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    if (currentMonth === mIndex && currentYear === year) {
      const daysLeft = Math.max(1, totalDays - now.getDate());
      return { daysLeft, totalDays, isCurrentMonth: true, isPast: false, isFuture: false };
    } else if (year < currentYear || (year === currentYear && mIndex < currentMonth)) {
      return { daysLeft: 0, totalDays, isCurrentMonth: false, isPast: true, isFuture: false };
    } else {
      return { daysLeft: totalDays, totalDays, isCurrentMonth: false, isPast: false, isFuture: true };
    }
  };

  const handleDecision = async (changeId: string, decision: 'approve' | 'reject') => {
    if (!activeUid) return;
    setIsProcessingDecision(changeId);
    try {
      const res = await fetch('/api/pending/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: activeUid,
          changeId,
          decision
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Request ${decision}d successfully!`);
        fetchTargets(activeUid);
        fetchPendingChanges();
      } else {
        toast.error(data.error || 'Failed to process decision');
      }
    } catch (err) {
      toast.error('Failed to communicate with server');
    } finally {
      setIsProcessingDecision(null);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequestTarget || !activeUid) return;
    let newVal = Number(requestedAchieved);
    if (isNaN(newVal) || newVal < 0) {
      toast.error('Please enter a valid achieved score');
      return;
    }

    if (requestType === 'add') {
      newVal = (activeRequestTarget.oldAchieved || 0) + newVal;
    }
    
    setIsSubmittingRequest(true);
    try {
      const body = {
        firebaseUid: activeUid,
        email: user?.email || dbUser?.email || '',
        action: 'update',
        collectionName: 'workspaceTargets',
        documentId: activeRequestTarget.targetId,
        data: {
          targetId: activeRequestTarget.targetId,
          teamName: activeRequestTarget.teamName,
          monthName: activeRequestTarget.monthName,
          memberName: activeRequestTarget.memberName,
          memberEmployeeId: activeRequestTarget.employeeId,
          oldAchieved: activeRequestTarget.oldAchieved,
          requestedAchieved: newVal
        }
      };
      
      const res = await fetch('/api/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Your update request was submitted to admins!');
        setIsRequestModalOpen(false);
      } else {
        toast.error(data.error || 'Failed to submit request');
      }
    } catch (err) {
      toast.error('Failed to submit request');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleCreateMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedMonth = newMonthName.trim();
    if (!formattedMonth || !activeUid) return;

    if (uniqueMonths.includes(formattedMonth)) {
      toast.error('This month folder already exists!');
      return;
    }

    setIsCreatingMonth(true);
    try {
      const teamsToClone = targets.filter(t => t.monthName === sourceMonthSelect && selectedTeamsChecklist[t._id]);
      
      if (carryOverChecked && teamsToClone.length > 0) {
        for (const target of teamsToClone) {
          const res = await fetch('/api/workspace/targets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: activeUid,
              teamName: target.teamName,
              monthName: formattedMonth,
              members: target.members.map((m: any) => ({
                employeeId: m.employeeId,
                name: m.name,
                officialTarget: m.officialTarget || 0,
                teamTarget: m.teamTarget || 0,
                achieved: 0
              }))
            })
          });
          await res.json();
        }
        toast.success(`Cloned ${teamsToClone.length} team(s) to ${formattedMonth}`);
      } else {
        const res = await fetch('/api/workspace/targets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: activeUid,
            teamName: 'CC',
            monthName: formattedMonth,
            members: []
          })
        });
        await res.json();
        toast.success(`Created month folder ${formattedMonth}`);
      }

      setNewMonthName('');
      setIsMonthModalOpen(false);
      setSelectedMonth(formattedMonth);
      fetchTargets();
    } catch (err) {
      toast.error('Error creating month folder');
    } finally {
      setIsCreatingMonth(false);
    }
  };

  const handleCreateTeamTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const team = newTeamName.trim().toUpperCase();
    if (!team || !selectedMonth || !activeUid) return;

    const teamExists = targets.some((t: any) => t.monthName === selectedMonth && t.teamName.toUpperCase() === team);
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
          uid: activeUid,
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
    if (!activeUid) return;
    if (!confirm(`Are you sure you want to delete targets for Team ${teamName}? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/workspace/targets?uid=${activeUid}&id=${targetId}`, {
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
    e.stopPropagation();
    if (!activeUid) return;
    if (!confirm(`Are you sure you want to delete the entire month "${monthName}"? All team targets and employee records inside it will be permanently deleted!`)) return;

    try {
      const res = await fetch(`/api/workspace/targets?uid=${activeUid}&month=${encodeURIComponent(monthName)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Month folder "${monthName}" deleted`);
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

  const handleOpenEditModal = (target: any) => {
    setActiveEditTarget(JSON.parse(JSON.stringify(target)));
    setIsEditModalOpen(true);
    setShowQuickPaste(false);
    setQuickPasteText('');
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
    if (!activeEditTarget || !activeUid) return;

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
          uid: activeUid,
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
        triggerConfetti();
      } else {
        toast.error(data.error || 'Failed to save targets');
      }
    } catch (err) {
      toast.error('Error saving target');
    } finally {
      setIsSavingTarget(false);
    }
  };

  const handleApplyQuickPaste = () => {
    if (!quickPasteText.trim() || !activeEditTarget) return;

    const lines = quickPasteText.trim().split('\n');
    const newMembers: any[] = [];

    lines.forEach(line => {
      const parts = line.split(/[\t,;]+/).map(p => p.trim());
      if (parts.length >= 2) {
        const empId = parts[0] || '';
        const name = parts[1] || '';
        const officialT = parseFloat(parts[2]?.replace(/[^0-9.]/g, '')) || 0;
        const teamT = parseFloat(parts[3]?.replace(/[^0-9.]/g, '')) || 0;
        const ach = parseFloat(parts[4]?.replace(/[^0-9.]/g, '')) || 0;

        if (empId && name) {
          newMembers.push({
            employeeId: empId,
            name: name,
            officialTarget: officialT,
            teamTarget: teamT,
            achieved: ach
          });
        }
      }
    });

    if (newMembers.length > 0) {
      setActiveEditTarget({
        ...activeEditTarget,
        members: [...activeEditTarget.members, ...newMembers]
      });
      toast.success(`Appended ${newMembers.length} member(s) from paste data!`);
      setQuickPasteText('');
      setShowQuickPaste(false);
    } else {
      toast.error('Could not parse any valid member rows. Ensure columns: ID, Name, OfficialTarget, TeamTarget, Achieved');
    }
  };

  const toggleAccordion = (id: string) => {
    setExpandedTeams(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Compute active month statistics
  const activeMonthTargets = useMemo(() => {
    return targets.filter(t => t.monthName === selectedMonth);
  }, [targets, selectedMonth]);

  const timingInfo = useMemo(() => {
    return getDaysRemainingInMonth(selectedMonth || '');
  }, [selectedMonth]);

  const { totalOfficialTargetVal, totalTeamTargetVal, totalAchievedVal, allMembers } = useMemo(() => {
    let offVal = 0;
    let teamVal = 0;
    let achVal = 0;
    const membersList: any[] = [];

    activeMonthTargets.forEach(t => {
      t.members.forEach((m: any) => {
        offVal += Number(m.officialTarget) || 0;
        teamVal += Number(m.teamTarget) || 0;
        achVal += Number(m.achieved) || 0;
        membersList.push({ ...m, teamName: t.teamName, targetId: t._id });
      });
    });

    return {
      totalOfficialTargetVal: offVal,
      totalTeamTargetVal: teamVal,
      totalAchievedVal: achVal,
      allMembers: membersList
    };
  }, [activeMonthTargets]);

  const officialAchievementRate = totalOfficialTargetVal > 0 ? Math.round((totalAchievedVal / totalOfficialTargetVal) * 100) : 0;
  const teamAchievementRate = totalTeamTargetVal > 0 ? Math.round((totalAchievedVal / totalTeamTargetVal) * 100) : 0;

  const smashedTargetMembers = allMembers.filter(m => (m.teamTarget > 0 && m.achieved >= m.teamTarget) || (m.officialTarget > 0 && m.achieved >= m.officialTarget));
  const onTrackMembers = allMembers.filter(m => m.teamTarget > 0 && m.achieved >= m.teamTarget * 0.75 && m.achieved < m.teamTarget);
  const behindTargetMembers = allMembers.filter(m => m.teamTarget > 0 && m.achieved < m.teamTarget * 0.75);

  const currentMonthIndex = uniqueMonths.indexOf(selectedMonth || '');
  const handlePrevMonth = () => {
    if (currentMonthIndex < uniqueMonths.length - 1) {
      setSelectedMonth(uniqueMonths[currentMonthIndex + 1]);
    }
  };
  const handleNextMonth = () => {
    if (currentMonthIndex > 0) {
      setSelectedMonth(uniqueMonths[currentMonthIndex - 1]);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 text-gray-100 font-sans">
      {/* Hero Command Center Header Banner */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-gradient-to-r from-gray-900 via-gray-900/95 to-emerald-950/40 border border-glass-border p-6 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
              <Target className="w-8 h-8 text-emerald-400 glow-green shrink-0" />
              Monthly Target Command Center
            </h1>
            {selectedMonth && (
              <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs font-mono uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {selectedMonth}
              </span>
            )}
            <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase font-mono tracking-widest ${timingInfo.isPast ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
              {timingInfo.isPast ? 'Concluded' : 'Running'}
            </span>
          </div>
          <p className="text-gray-400 text-xs md:text-sm font-medium">
            Real-time monthly revenue goals, team deliverables, and individual employee target ledgers.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap z-10 w-full xl:w-auto justify-start xl:justify-end">
          {/* Month Selector Pills Dropdown */}
          {uniqueMonths.length > 0 && (
            <div className="flex items-center bg-black/60 border border-glass-border rounded-xl p-1 shrink-0">
              <button 
                onClick={handlePrevMonth}
                disabled={currentMonthIndex >= uniqueMonths.length - 1}
                className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <select
                value={selectedMonth || ''}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-emerald-300 font-black text-xs px-2 py-1 focus:outline-none cursor-pointer uppercase"
              >
                {uniqueMonths.map(m => (
                  <option key={m} value={m} className="bg-gray-900 text-white">{m}</option>
                ))}
              </select>

              <button 
                onClick={handleNextMonth}
                disabled={currentMonthIndex <= 0}
                className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Next Month"
              >
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          )}

          <button 
            onClick={() => {
              fetchTargets();
              if (isAdmin) fetchPendingChanges();
            }}
            className="p-2.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-glass-border rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
            title="Refresh Targets Data"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                fetchPendingChanges();
                setIsApprovalQueueOpen(true);
              }}
              className="relative p-2.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-glass-border rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
              title="Target Approval Requests"
            >
              <Inbox className="w-4 h-4 text-blue-400" />
              {pendingChanges.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white animate-bounce shadow-md">
                  {pendingChanges.length}
                </span>
              )}
            </button>
          )}

          {isAdmin && (
            <>
              <button 
                onClick={() => setIsMonthModalOpen(true)}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-glass-border rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>+ Month</span>
              </button>

              <button 
                onClick={() => setIsTeamModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
                <span>Add Team</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4 Full-Width KPI Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Card 1: Official Target Coverage */}
        <div className="bg-gray-900/90 border border-glass-border p-5 rounded-2xl shadow-xl flex items-center justify-between gap-4 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1.5">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block">Official Target Coverage</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono">${totalAchievedVal.toLocaleString()}</span>
              <span className="text-xs text-gray-500 font-semibold font-mono">/ ${totalOfficialTargetVal.toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">Official target completion status</p>
          </div>
          <ProgressRing 
            percentage={officialAchievementRate} 
            size={76} 
            strokeWidth={7} 
            colorClass={officialAchievementRate >= 100 ? "text-emerald-400" : officialAchievementRate >= 75 ? "text-emerald-400" : "text-amber-400"}
            glowColor={officialAchievementRate >= 100 ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}
          />
        </div>

        {/* Card 2: Team Target Coverage */}
        <div className="bg-gray-900/90 border border-glass-border p-5 rounded-2xl shadow-xl flex items-center justify-between gap-4 relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="space-y-1.5">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block">Team Target Coverage</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono">${totalAchievedVal.toLocaleString()}</span>
              <span className="text-xs text-gray-500 font-semibold font-mono">/ ${totalTeamTargetVal.toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">Internal team target coverage</p>
          </div>
          <ProgressRing 
            percentage={teamAchievementRate} 
            size={76} 
            strokeWidth={7} 
            colorClass={teamAchievementRate >= 100 ? "text-blue-400" : teamAchievementRate >= 75 ? "text-blue-400" : "text-amber-400"}
            glowColor="rgba(59,130,246,0.3)"
          />
        </div>

        {/* Card 3: Target Smashed & Performers */}
        <div className="bg-gray-900/90 border border-glass-border p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block">Target Performers</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold shrink-0">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-300 font-mono flex items-center gap-2">
              <span>{smashedTargetMembers.length}</span>
              <span className="text-xs font-bold text-gray-400 font-sans">/ {allMembers.length} Members Smashed</span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              {onTrackMembers.length} member(s) currently on track (75%-99%)
            </p>
          </div>
        </div>

        {/* Card 4: Pace & Required Daily Run Rate */}
        <div className="bg-gray-900/90 border border-glass-border p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block">Calendar Pace & Run-Rate</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            {timingInfo.isCurrentMonth ? (
              <>
                <div className="text-2xl font-black text-amber-300 font-mono">
                  ${Math.round(Math.max(0, totalTeamTargetVal - totalAchievedVal) / timingInfo.daysLeft).toLocaleString()} <span className="text-xs font-sans text-gray-400">/ day</span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium mt-1">
                  Required run-rate for remaining {timingInfo.daysLeft} days
                </p>
              </>
            ) : timingInfo.isPast ? (
              <>
                <div className="text-2xl font-black text-gray-300 font-mono">Concluded</div>
                <p className="text-[10px] text-gray-400 font-medium mt-1">Month ledger period is concluded</p>
              </>
            ) : (
              <>
                <div className="text-2xl font-black text-emerald-400 font-mono">Upcoming</div>
                <p className="text-[10px] text-gray-400 font-medium mt-1">Month target starts soon ({timingInfo.totalDays} days)</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar & Search Input */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-gray-900/90 border border-glass-border p-2 rounded-2xl shadow-xl">
        <div className="flex bg-black/60 border border-glass-border p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'ledger'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Teams & Members Ledger</span>
          </button>
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard & Rankings</span>
          </button>
          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'simulator'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Target Simulator</span>
          </button>
        </div>

        {/* Member Search Bar in Ledger view */}
        {activeSubTab === 'ledger' && (
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search member by name or ID..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-black/60 border border-glass-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
            {memberSearch && (
              <button 
                onClick={() => setMemberSearch('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Tab Content Display */}
      {loading ? (
        <div className="p-16 text-center text-gray-400 flex items-center justify-center gap-3 bg-gray-900/60 border border-glass-border rounded-2xl">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="font-semibold text-sm">Syncing monthly target framework...</span>
        </div>
      ) : activeMonthTargets.length === 0 ? (
        <div className="p-16 text-center bg-gray-900/80 border border-glass-border rounded-2xl space-y-4 shadow-xl">
          <Target className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-black text-white uppercase tracking-wider">No teams registered for {selectedMonth || 'this month'}</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Click "+ Add Team" to start configuring targets for team members in {selectedMonth || 'this month'}.
          </p>
          {isAdmin && (
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              + Add Team
            </button>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* Sub-Tab 1: Ledger View (Team Accordions & Member Tables) */}
          {activeSubTab === 'ledger' && (
            <motion.div 
              key="ledger-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 w-full"
            >
              {activeMonthTargets.map(target => {
                const totalOfficial = target.members.reduce((sum: number, m: any) => sum + (Number(m.officialTarget) || 0), 0);
                const totalTeam = target.members.reduce((sum: number, m: any) => sum + (Number(m.teamTarget) || 0), 0);
                const totalAchieved = target.members.reduce((sum: number, m: any) => sum + (Number(m.achieved) || 0), 0);
                const teamAchievement = totalTeam > 0 ? Math.round((totalAchieved / totalTeam) * 100) : 0;
                const isExpanded = !!expandedTeams[target._id];

                // Filter members by search text
                const filteredMembers = target.members.filter((m: any) => {
                  if (!memberSearch.trim()) return true;
                  const q = memberSearch.toLowerCase().trim();
                  return (
                    m.name?.toLowerCase().includes(q) ||
                    m.employeeId?.toLowerCase().includes(q)
                  );
                });

                return (
                  <div 
                    key={target._id} 
                    className="bg-gray-900/90 border border-glass-border hover:border-emerald-500/40 rounded-2xl overflow-hidden shadow-2xl transition-all"
                  >
                    {/* Team Header Trigger */}
                    <div 
                      onClick={() => toggleAccordion(target._id)}
                      className="p-4 bg-black/50 hover:bg-black/70 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0 shadow-inner">
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-base font-black text-white uppercase tracking-tight">Team {target.teamName}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase font-mono tracking-widest ${
                              teamAchievement >= 100 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              teamAchievement >= 75 ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                              'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            }`}>
                              {teamAchievement}% Achieved
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                            {target.members.length} {target.members.length === 1 ? 'Member' : 'Members'} Configured
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <div>
                            <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Goal</span>
                            <span className="text-gray-200 font-bold">${totalTeam.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Achieved</span>
                            <span className="text-emerald-400 font-black">${totalAchieved.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(target)}
                                className="px-3 py-1.5 border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/25 text-blue-300 text-xs font-extrabold uppercase rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Manage</span>
                              </button>
                              <button
                                onClick={() => handleDeleteTeamTarget(target._id, target.teamName)}
                                className="p-1.5 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all cursor-pointer"
                                title="Delete Team"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <div className="p-1.5 bg-black/40 border border-glass-border rounded-xl text-gray-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Member Table Content */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-white/5 overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs text-gray-300">
                              <thead>
                                <tr className="bg-black/60 border-b border-glass-border text-gray-400 font-black uppercase text-[10px] tracking-wider">
                                  <th className="py-3 px-4">Employee ID</th>
                                  <th className="py-3 px-4">Member Name</th>
                                  <th className="py-3 px-4 text-right">Official Target</th>
                                  <th className="py-3 px-4 text-right">Team Target</th>
                                  <th className="py-3 px-4 text-right">Achieved</th>
                                  <th className="py-3 px-4">Progress Bar</th>
                                  <th className="py-3 px-4 text-center">Status</th>
                                  <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {filteredMembers.length === 0 ? (
                                  <tr>
                                    <td colSpan={8} className="py-8 text-center text-gray-500 italic">
                                      {memberSearch ? 'No team members match your search query.' : 'No members configured for this team yet.'}
                                    </td>
                                  </tr>
                                ) : (
                                  filteredMembers.map((m: any, idx: number) => {
                                    const memTeamT = Number(m.teamTarget) || 0;
                                    const memAch = Number(m.achieved) || 0;
                                    const pct = memTeamT > 0 ? Math.round((memAch / memTeamT) * 100) : 0;

                                    let statusBadge = (
                                      <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold uppercase">
                                        Behind
                                      </span>
                                    );
                                    if (pct >= 100) {
                                      statusBadge = (
                                        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1">
                                          <Flame className="w-3 h-3 text-emerald-400" /> Smashed
                                        </span>
                                      );
                                    } else if (pct >= 75) {
                                      statusBadge = (
                                        <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-bold uppercase">
                                          On Track
                                        </span>
                                      );
                                    }

                                    return (
                                      <tr key={idx} className="hover:bg-black/30 transition-colors">
                                        <td className="py-3 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                                          {m.employeeId || '—'}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                                          <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-black text-emerald-400">
                                              {m.name ? m.name.charAt(0).toUpperCase() : 'M'}
                                            </div>
                                            <span>{m.name}</span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono font-semibold text-gray-300 whitespace-nowrap">
                                          ${(Number(m.officialTarget) || 0).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                                          ${(Number(m.teamTarget) || 0).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 whitespace-nowrap">
                                          ${(Number(m.achieved) || 0).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 min-w-[140px]">
                                          <div className="space-y-1">
                                            <div className="w-full bg-black/50 border border-glass-border h-2 rounded-full overflow-hidden">
                                              <div 
                                                className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min(100, pct)}%` }}
                                              />
                                            </div>
                                            <div className="text-[9px] font-mono text-gray-400 font-bold text-right">{pct}%</div>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4 text-center whitespace-nowrap">
                                          {statusBadge}
                                        </td>
                                        <td className="py-3 px-4 text-right whitespace-nowrap">
                                          {!isAdmin ? (
                                            <button
                                              onClick={() => {
                                                setActiveRequestTarget({
                                                  targetId: target._id,
                                                  teamName: target.teamName,
                                                  monthName: target.monthName,
                                                  memberName: m.name,
                                                  employeeId: m.employeeId,
                                                  oldAchieved: m.achieved || 0
                                                });
                                                setRequestedAchieved('');
                                                setRequestType('add');
                                                setIsRequestModalOpen(true);
                                              }}
                                              className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-lg text-[10px] font-bold cursor-pointer"
                                            >
                                              Request Update
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => handleOpenEditModal(target)}
                                              className="p-1 text-gray-400 hover:text-white"
                                              title="Edit Target"
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Sub-Tab 2: Leaderboard & Rankings */}
          {activeSubTab === 'overview' && (
            <motion.div 
              key="overview-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full"
            >
              {/* Smashed Targets Wall of Fame */}
              <div className="bg-gray-900/90 border border-glass-border p-6 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
                  <Flame className="w-5 h-5 text-emerald-400" /> Target Smashed Wall of Fame ({smashedTargetMembers.length})
                </h3>
                {smashedTargetMembers.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 italic space-y-2">
                    <Trophy className="w-10 h-10 text-gray-700 mx-auto" />
                    <p>No members have smashed their 100% target goal yet in {selectedMonth}.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {smashedTargetMembers.map((m, idx) => (
                      <div key={idx} className="p-3.5 bg-black/50 border border-emerald-500/30 rounded-xl flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-black text-emerald-400">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-white">{m.name}</div>
                            <div className="text-[10px] text-gray-400 uppercase font-mono font-bold">Team {m.teamName} • ID: {m.employeeId}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-emerald-400 font-mono">${(Number(m.achieved) || 0).toLocaleString()}</div>
                          <div className="text-[9px] font-bold text-emerald-300 font-mono">100%+ Goal Met</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Team Standings Leaderboard */}
              <div className="bg-gray-900/90 border border-glass-border p-6 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
                  <Trophy className="w-5 h-5 text-amber-400" /> Team Standings Leaderboard
                </h3>
                <div className="space-y-3">
                  {activeMonthTargets.map((t, idx) => {
                    const goal = t.members.reduce((sum: number, m: any) => sum + (Number(m.teamTarget) || 0), 0);
                    const ach = t.members.reduce((sum: number, m: any) => sum + (Number(m.achieved) || 0), 0);
                    const pct = goal > 0 ? Math.round((ach / goal) * 100) : 0;

                    return (
                      <div key={t._id} className="p-3.5 bg-black/50 border border-glass-border rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black font-mono border ${
                            idx === 0 ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-gray-800 text-gray-300 border-gray-700'
                          }`}>
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-white uppercase">Team {t.teamName}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{t.members.length} Members</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right font-mono">
                            <div className="text-xs font-black text-emerald-400">${ach.toLocaleString()}</div>
                            <div className="text-[10px] text-gray-500">/ ${goal.toLocaleString()}</div>
                          </div>
                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black font-mono">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Sub-Tab 3: Target Simulator */}
          {activeSubTab === 'simulator' && (
            <motion.div 
              key="simulator-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gray-900/90 border border-glass-border p-6 rounded-2xl shadow-xl space-y-6 w-full"
            >
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-400" /> Interactive Target Simulator
                </h3>
                <p className="text-xs text-gray-400">
                  Simulate target multiplier adjustments from 50% to 200% to project team milestones and required daily run-rates.
                </p>
              </div>

              {/* Slider Control */}
              <div className="p-5 bg-black/50 border border-glass-border rounded-xl space-y-4">
                <div className="flex justify-between items-center text-xs font-bold text-gray-300">
                  <span>Target Multiplier: <strong className="text-emerald-400 font-mono text-sm">{simulatorMultiplier}%</strong></span>
                  <div className="flex gap-2">
                    <button onClick={() => setSimulatorMultiplier(85)} className="px-2 py-1 bg-gray-800 text-xs rounded hover:bg-gray-700">85%</button>
                    <button onClick={() => setSimulatorMultiplier(100)} className="px-2 py-1 bg-emerald-600 text-xs text-white rounded">100% Reset</button>
                    <button onClick={() => setSimulatorMultiplier(120)} className="px-2 py-1 bg-gray-800 text-xs rounded hover:bg-gray-700">120%</button>
                    <button onClick={() => setSimulatorMultiplier(150)} className="px-2 py-1 bg-gray-800 text-xs rounded hover:bg-gray-700">150%</button>
                  </div>
                </div>

                <input 
                  type="range" 
                  min={50} 
                  max={200} 
                  step={5} 
                  value={simulatorMultiplier} 
                  onChange={(e) => setSimulatorMultiplier(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Projected Results Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-black/40 border border-glass-border rounded-xl">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Simulated Team Goal</span>
                  <span className="text-xl font-black text-white font-mono mt-1 block">
                    ${Math.round(totalTeamTargetVal * (simulatorMultiplier / 100)).toLocaleString()}
                  </span>
                </div>
                <div className="p-4 bg-black/40 border border-glass-border rounded-xl">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Simulated Coverage</span>
                  <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">
                    {Math.round(totalTeamTargetVal * (simulatorMultiplier / 100)) > 0 ? Math.round((totalAchievedVal / (totalTeamTargetVal * (simulatorMultiplier / 100))) * 100) : 0}%
                  </span>
                </div>
                <div className="p-4 bg-black/40 border border-glass-border rounded-xl">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Required Daily Run Rate</span>
                  <span className="text-xl font-black text-amber-300 font-mono mt-1 block">
                    ${timingInfo.daysLeft > 0 ? Math.round(Math.max(0, (totalTeamTargetVal * (simulatorMultiplier / 100)) - totalAchievedVal) / timingInfo.daysLeft).toLocaleString() : 0} / day
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Add Month Modal */}
      {isMonthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-emerald-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-left relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" /> Create Month Folder
              </h3>
              <button onClick={() => setIsMonthModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMonth} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-300 block">Month Folder Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. September 2026"
                  value={newMonthName}
                  onChange={(e) => setNewMonthName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-glass-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {uniqueMonths.length > 0 && (
                <div className="p-3 bg-black/40 border border-glass-border rounded-xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-300">
                    <input
                      type="checkbox"
                      checked={carryOverChecked}
                      onChange={(e) => setCarryOverChecked(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span>Carry Over Existing Team Configurations</span>
                  </label>
                  
                  {carryOverChecked && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-gray-400 font-bold block">Source Month to Clone:</span>
                      <select
                        value={sourceMonthSelect}
                        onChange={(e) => setSourceMonthSelect(e.target.value)}
                        className="w-full px-3 py-2 bg-black/60 border border-glass-border rounded-xl text-white focus:outline-none"
                      >
                        {uniqueMonths.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setIsMonthModalOpen(false)} className="px-4 py-2 bg-gray-800 text-gray-300 font-bold rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={isCreatingMonth} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-600/30">
                  {isCreatingMonth ? 'Creating...' : 'Create Month'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Team Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-emerald-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-left relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" /> Add Team to {selectedMonth}
              </h3>
              <button onClick={() => setIsTeamModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeamTarget} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-300 block">Team Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CC, DEV, MARKETING"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-glass-border rounded-xl text-white uppercase placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setIsTeamModalOpen(false)} className="px-4 py-2 bg-gray-800 text-gray-300 font-bold rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={isCreatingTeam} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-600/30">
                  {isCreatingTeam ? 'Adding...' : 'Add Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Targets Modal */}
      {isEditModalOpen && activeEditTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-emerald-500/40 rounded-2xl w-full max-w-4xl shadow-2xl p-6 space-y-4 text-left relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-400" /> Manage Team {activeEditTarget.teamName} ({activeEditTarget.monthName})
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedTarget} className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-300">Team Member Target Rows:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickPaste(!showQuickPaste)}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl font-bold cursor-pointer"
                  >
                    📋 Bulk Quick Paste
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMemberRow}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold cursor-pointer"
                  >
                    + Add Member Row
                  </button>
                </div>
              </div>

              {showQuickPaste && (
                <div className="p-4 bg-black/60 border border-blue-500/40 rounded-xl space-y-3">
                  <span className="font-bold text-blue-300 block">Paste TSV/CSV Columns: EmployeeID, Name, OfficialTarget, TeamTarget, Achieved</span>
                  <textarea
                    rows={4}
                    placeholder={`15789\tMd. Ibrahim Sardar\t1100\t1500\t40\n15790\tMd. Sajjad\t1100\t1500\t0`}
                    value={quickPasteText}
                    onChange={(e) => setQuickPasteText(e.target.value)}
                    className="w-full px-3 py-2 bg-black/80 border border-glass-border rounded-xl text-white font-mono text-xs focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowQuickPaste(false)} className="px-3 py-1 bg-gray-800 text-gray-300 rounded">Cancel</button>
                    <button type="button" onClick={handleApplyQuickPaste} className="px-4 py-1 bg-blue-600 text-white font-bold rounded">Apply Parsed Members</button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {activeEditTarget.members.map((m: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center p-3 bg-black/40 border border-glass-border rounded-xl">
                    <div className="col-span-2">
                      <span className="text-[9px] text-gray-500 font-bold block mb-0.5">Emp ID:</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 15789"
                        value={m.employeeId}
                        onChange={(e) => handleMemberFieldChange(idx, 'employeeId', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-glass-border rounded-lg text-white font-mono focus:outline-none"
                      />
                    </div>

                    <div className="col-span-3">
                      <span className="text-[9px] text-gray-500 font-bold block mb-0.5">Member Name:</span>
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={m.name}
                        onChange={(e) => handleMemberFieldChange(idx, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-glass-border rounded-lg text-white focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <span className="text-[9px] text-gray-500 font-bold block mb-0.5">Official Target:</span>
                      <input
                        type="number"
                        min="0"
                        value={m.officialTarget}
                        onChange={(e) => handleMemberFieldChange(idx, 'officialTarget', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-glass-border rounded-lg text-white font-mono focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <span className="text-[9px] text-gray-500 font-bold block mb-0.5">Team Target:</span>
                      <input
                        type="number"
                        min="0"
                        value={m.teamTarget}
                        onChange={(e) => handleMemberFieldChange(idx, 'teamTarget', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-glass-border rounded-lg text-white font-mono focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <span className="text-[9px] text-gray-500 font-bold block mb-0.5">Achieved:</span>
                      <input
                        type="number"
                        min="0"
                        value={m.achieved}
                        onChange={(e) => handleMemberFieldChange(idx, 'achieved', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-glass-border rounded-lg text-emerald-400 font-mono font-bold focus:outline-none"
                      />
                    </div>

                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveMemberRow(idx)}
                        className="p-1.5 text-gray-500 hover:text-red-400"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-800 text-gray-300 font-bold rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={isSavingTarget} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-600/30">
                  {isSavingTarget ? 'Saving...' : 'Save All Targets'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Target Adjustment Request Modal */}
      {isRequestModalOpen && activeRequestTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-purple-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-left relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> Submit Target Update Request
              </h3>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
              <div className="p-3 bg-black/40 border border-glass-border rounded-xl space-y-1">
                <div className="font-bold text-white text-sm">{activeRequestTarget.memberName} ({activeRequestTarget.employeeId})</div>
                <div className="text-[10px] text-gray-400 font-mono">Team {activeRequestTarget.teamName} • {activeRequestTarget.monthName}</div>
                <div className="text-xs text-emerald-400 font-bold font-mono">Current Achieved: ${activeRequestTarget.oldAchieved}</div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-gray-300 block">Adjustment Mode:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRequestType('add')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                      requestType === 'add' ? 'bg-purple-600 text-white border-purple-400' : 'bg-black/40 text-gray-400 border-glass-border'
                    }`}
                  >
                    + Add Incremental Score
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestType('override')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                      requestType === 'override' ? 'bg-purple-600 text-white border-purple-400' : 'bg-black/40 text-gray-400 border-glass-border'
                    }`}
                  >
                    Set Total Score
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300 block">
                  {requestType === 'add' ? 'Amount to Add ($ / Points):' : 'New Total Achieved ($ / Points):'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 50"
                  value={requestedAchieved}
                  onChange={(e) => setRequestedAchieved(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-glass-border rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setIsRequestModalOpen(false)} className="px-4 py-2 bg-gray-800 text-gray-300 font-bold rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingRequest} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl shadow-lg shadow-purple-600/30">
                  {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Approval Queue Modal */}
      {isApprovalQueueOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-blue-500/40 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4 text-left relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Inbox className="w-5 h-5 text-blue-400" /> Target Adjustment Approval Requests ({pendingChanges.length})
              </h3>
              <button onClick={() => setIsApprovalQueueOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {pendingChanges.length === 0 ? (
              <div className="py-12 text-center text-gray-500 italic">No pending target adjustment requests.</div>
            ) : (
              <div className="space-y-3">
                {pendingChanges.map((change) => (
                  <div key={change._id} className="p-4 bg-black/50 border border-glass-border rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-white text-sm">{change.data?.memberName} ({change.data?.memberEmployeeId})</div>
                        <div className="text-[10px] text-gray-400 font-mono">Submitted by: {change.submittedBy}</div>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[9px] font-bold">
                        {change.data?.monthName} • Team {change.data?.teamName}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-gray-500 text-[10px]">Previous:</span>
                        <span className="text-gray-300 font-bold block">${change.data?.oldAchieved}</span>
                      </div>
                      <div className="text-gray-500 font-bold">➔</div>
                      <div>
                        <span className="text-emerald-400 text-[10px]">Requested:</span>
                        <span className="text-emerald-400 font-black block">${change.data?.requestedAchieved}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleDecision(change._id, 'reject')}
                        disabled={isProcessingDecision === change._id}
                        className="px-3 py-1.5 bg-red-600/20 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-600/30"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleDecision(change._id, 'approve')}
                        disabled={isProcessingDecision === change._id}
                        className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-black shadow-md hover:bg-emerald-500"
                      >
                        Approve & Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
