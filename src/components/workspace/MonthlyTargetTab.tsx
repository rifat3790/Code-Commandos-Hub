'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Loader2, Plus, Save, Calendar, ChevronLeft, Trash2, Edit2, 
  UserPlus, Target, TrendingUp, X, DollarSign, Award, Percent, 
  Sliders, Info, Sparkles, AlertCircle, RefreshCw, Trophy, Star, 
  Zap, TrendingDown, ChevronDown, ChevronUp, Copy, CheckCircle2,
  FileSpreadsheet, ClipboardList, Inbox, ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// Circular Progress Component for Premium Visualizations
const ProgressRing = ({ percentage, size = 110, strokeWidth = 8, colorClass = "text-brand-green", glowColor = "rgba(0, 201, 80, 0.3)" }: any) => {
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
            filter: `drop-shadow(0 0 5px ${glowColor})`
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-black text-white">{percentage}%</span>
        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Achieved</span>
      </div>
    </div>
  );
};

export default function MonthlyTargetTab() {
  const { user, dbUser, loading: authLoading } = useAuth();
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active navigation states
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  
  // Custom sub-tabs within Month Details
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'simulator' | 'ledger'>('ledger');
  
  // Target Multiplier Slider for simulator
  const [simulatorMultiplier, setSimulatorMultiplier] = useState<number>(100);

  // Accordions for Team cards in the Ledger Tab
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

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
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const isAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';
  const activeUid = user?.uid || dbUser?.firebaseUid;
  const lastFetchedUid = React.useRef<string | null>(null);

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
    console.log("[MonthlyTargetTab Debug] activeUid evaluated:", activeUid, "user:", user?.uid, "dbUser:", dbUser?.firebaseUid);
    if (activeUid) {
      if (activeUid !== lastFetchedUid.current) {
        console.log("[MonthlyTargetTab Debug] Triggering fetchTargets for UID:", activeUid);
        lastFetchedUid.current = activeUid;
        fetchTargets(activeUid);
        if (isAdmin) {
          fetchPendingChanges();
        }
      } else {
        console.log("[MonthlyTargetTab Debug] Skipped fetchTargets: UID matches last fetched.");
      }
    } else {
      console.log("[MonthlyTargetTab Debug] activeUid is empty. AuthLoading state is:", authLoading);
      if (!authLoading) {
        console.log("[MonthlyTargetTab Debug] Auth completed and no UID found. Setting loading to false.");
        setLoading(false);
      }
    }
  }, [activeUid, authLoading, isAdmin]);

  // Set first team expanded by default when selectedMonth changes
  useEffect(() => {
    if (selectedMonth) {
      const activeMonthTargets = targets.filter((t: any) => t.monthName === selectedMonth);
      if (activeMonthTargets.length > 0) {
        setExpandedTeams({ [activeMonthTargets[0]._id]: true });
      }
      // Reset simulator multiplier on month change
      setSimulatorMultiplier(100);
      setActiveSubTab('ledger');
    }
  }, [selectedMonth, targets]);

  const fetchTargets = async (uidToFetch?: string) => {
    const fetchUid = uidToFetch || activeUid;
    console.log("[MonthlyTargetTab Debug] fetchTargets initiated with UID:", fetchUid);
    if (!fetchUid) {
      console.log("[MonthlyTargetTab Debug] fetchTargets aborted: fetchUid is falsy.");
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("[MonthlyTargetTab Debug] Fetch targets API connection timed out. Aborting request.");
      controller.abort();
    }, 7000);

    try {
      setLoading(true);
      console.log("[MonthlyTargetTab Debug] Fetching targets from API...");
      const res = await fetch(`/api/workspace/targets?uid=${fetchUid}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      console.log("[MonthlyTargetTab Debug] API response received. Status:", res.status);
      const data = await res.json();
      console.log("[MonthlyTargetTab Debug] API data parsed successfully:", data);
      if (data.success) {
        setTargets(data.targets);
      } else {
        console.error("[MonthlyTargetTab Debug] Target loading failed on server:", data.error);
        toast.error(`Error: ${data.error}`);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("[MonthlyTargetTab Debug] Exception in fetchTargets:", err);
      if (err.name === 'AbortError') {
        toast.error('Database connection timed out. Showing cached state or empty workspace.');
      } else {
        toast.error('Failed to load targets');
      }
    } finally {
      console.log("[MonthlyTargetTab Debug] fetchTargets finished. Setting loading to false.");
      setLoading(false);
    }
  };

  const handleDecision = async (changeId: string, decision: 'approve' | 'reject') => {
    setIsProcessingDecision(changeId);
    try {
      const res = await fetch('/api/pending/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changeId,
          firebaseUid: activeUid,
          decision
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(decision === 'approve' ? 'Request approved and applied!' : 'Request rejected.');
        fetchTargets(activeUid);
        fetchPendingChanges();
      } else {
        toast.error(data.error || 'Failed to process decision');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to communicate with server');
    } finally {
      setIsProcessingDecision(null);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequestTarget || !activeUid) return;
    const newVal = Number(requestedAchieved);
    if (isNaN(newVal) || newVal < 0) {
      toast.error('Please enter a valid achieved score');
      return;
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
      console.error(err);
      toast.error('Failed to submit request');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Helper: Celebrate with confetti
  const triggerConfetti = (e?: React.MouseEvent) => {
    if (typeof window === 'undefined') return;
    
    let origin: any = { y: 0.6 };
    if (e) {
      const { clientX, clientY } = e;
      origin = {
        x: clientX / window.innerWidth,
        y: clientY / window.innerHeight
      };
    }
    
    confetti({
      particleCount: 140,
      spread: 75,
      origin,
      colors: ['#00C950', '#00F5A0', '#ffd700', '#3b82f6', '#a855f7']
    });
  };

  // Helper: Date arithmetic for target simulations
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

  // Extract unique months from targets
  const uniqueMonths = Array.from(new Set(targets.map(t => t.monthName))).sort((a, b) => {
    return b.localeCompare(a); // Sort descending
  });

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
      const data = await res.json();
      if (data.success) {
        toast.success(`Month folder "${formattedMonth}" created`);
        setNewMonthName('');
        setIsMonthModalOpen(false);
        await fetchTargets();
        setSelectedMonth(formattedMonth); 
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
      toast.error('Error saving targets');
    } finally {
      setIsSavingTarget(false);
    }
  };

  // Quick Paste Data Parser
  const handleParseQuickPaste = () => {
    if (!quickPasteText.trim() || !activeEditTarget) return;
    
    const lines = quickPasteText.split('\n');
    const newMembers = [...activeEditTarget.members];
    let successCount = 0;
    
    lines.forEach(line => {
      if (!line.trim()) return;
      
      // Split by tab, then fall back to comma
      let parts = line.split('\t');
      if (parts.length < 2) {
        parts = line.split(',');
      }
      
      const cleanParts = parts.map(p => p.trim());
      if (cleanParts.length >= 2) {
        const empId = cleanParts[0];
        const name = cleanParts[1];
        // Parse targets and achievements, cleaning out dollar signs/commas
        const officialTarget = cleanParts[2] ? Math.max(0, Number(cleanParts[2].replace(/[^0-9.]/g, ''))) : 0;
        const teamTarget = cleanParts[3] ? Math.max(0, Number(cleanParts[3].replace(/[^0-9.]/g, ''))) : officialTarget;
        const achieved = cleanParts[4] ? Math.max(0, Number(cleanParts[4].replace(/[^0-9.]/g, ''))) : 0;
        
        if (empId && name) {
          // Check if employee already exists in local list, update it. Else append.
          const existingIdx = newMembers.findIndex(m => m.employeeId.toUpperCase() === empId.toUpperCase());
          if (existingIdx !== -1) {
            newMembers[existingIdx] = {
              ...newMembers[existingIdx],
              name,
              officialTarget,
              teamTarget,
              achieved
            };
          } else {
            newMembers.push({
              employeeId: empId,
              name,
              officialTarget,
              teamTarget,
              achieved
            });
          }
          successCount++;
        }
      }
    });
    
    setActiveEditTarget({
      ...activeEditTarget,
      members: newMembers
    });
    
    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} member(s)!`);
      setQuickPasteText('');
      setShowQuickPaste(false);
    } else {
      toast.error('Unable to parse data. Ensure format is: EmployeeID, Name, [OfficialTarget], [TeamTarget], [Achieved]');
    }
  };

  const toggleAccordion = (teamId: string) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  // Global loading blocker removed to support local inline loaders

  // Filter targets for active selected month
  const activeMonthTargets = targets.filter((t: any) => t.monthName === selectedMonth);

  // Computations for active Month
  const totalTargetVal = activeMonthTargets.reduce((acc: number, t: any) => acc + t.members.reduce((sum: number, mem: any) => sum + (mem.teamTarget || 0), 0), 0);
  const totalOfficialTargetVal = activeMonthTargets.reduce((acc: number, t: any) => acc + t.members.reduce((sum: number, mem: any) => sum + (mem.officialTarget || 0), 0), 0);
  const totalAchievedVal = activeMonthTargets.reduce((acc: number, t: any) => acc + t.members.reduce((sum: number, mem: any) => sum + (mem.achieved || 0), 0), 0);
  const overallAchievementPercent = totalTargetVal > 0 ? Math.round((totalAchievedVal / totalTargetVal) * 100) : 0;
  const overallGapVal = Math.max(0, totalTargetVal - totalAchievedVal);

  // Flattened members for stats
  const allMembers = activeMonthTargets.flatMap((t: any) => t.members.map((m: any) => ({ ...m, teamName: t.teamName })));
  
  // Performance tiers calculation
  const eliteAchievers = allMembers.filter((m: any) => m.teamTarget > 0 && m.achieved >= m.teamTarget);
  const onTrackAchievers = allMembers.filter((m: any) => m.teamTarget > 0 && m.achieved >= m.teamTarget * 0.7 && m.achieved < m.teamTarget);
  const supportRequired = allMembers.filter((m: any) => m.teamTarget > 0 && m.achieved < m.teamTarget * 0.7);

  // Team rankings sorted by percentage
  const teamRankings = activeMonthTargets.map((t: any) => {
    const tTarget = t.members.reduce((sum: number, m: any) => sum + (m.teamTarget || 0), 0);
    const tAchieved = t.members.reduce((sum: number, m: any) => sum + (m.achieved || 0), 0);
    const percent = tTarget > 0 ? Math.round((tAchieved / tTarget) * 100) : 0;
    return {
      id: t._id,
      teamName: t.teamName,
      target: tTarget,
      achieved: tAchieved,
      percent
    };
  }).sort((a: any, b: any) => b.percent - a.percent);

  // Remaining days helper calculations
  const timingInfo = getDaysRemainingInMonth(selectedMonth || '');

  return (
    <div className="space-y-6">
      {/* Month Selection View */}
      {!selectedMonth ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-gradient-to-br from-[#0c101d] to-[#0f172a] border border-white/5 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-52 h-52 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-white font-extrabold text-2xl flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-white/5 shadow-inner">
                  <Calendar className="w-6 h-6 text-brand-green" />
                </div>
                Workspace Targets Ledger
              </h2>
              <p className="text-xs text-gray-400 mt-2 font-medium">Select a month container to manage performance targets, view simulators, and check leaderboard status.</p>
            </div>
            
            {isAdmin && (
              <button 
                onClick={() => setIsMonthModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg glow-green cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
                Create Month Folder
              </button>
            )}
          </div>

          {loading ? (
            <div className="glass-panel p-20 rounded-2xl border border-glass-border flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-brand-green animate-spin" />
              <span className="text-gray-400 text-xs font-black tracking-widest uppercase animate-pulse">Loading Target Frameworks...</span>
            </div>
          ) : uniqueMonths.length === 0 ? (
            <div className="glass-panel p-16 rounded-2xl border border-glass-border text-center flex flex-col items-center">
              <Calendar className="w-16 h-16 text-gray-700 mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">No Performance Records</h3>
              <p className="text-gray-400 mb-6 max-w-sm text-sm">Initialize a monthly tracking workspace to start registering team targets and employee achievements.</p>
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
                    className="glass-panel p-6 rounded-2xl border border-glass-border hover:border-brand-green/40 cursor-pointer transition-all hover:-translate-y-1.5 group relative overflow-hidden flex flex-col justify-between min-h-[190px] bg-[#0c101d]/60 hover:bg-[#0f1527]/80"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors" />
                    
                    {isAdmin && (
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all z-20">
                        <button 
                          onClick={(e) => handleDeleteMonthFolder(m, e)} 
                          className="p-2 text-red-400 hover:text-red-300 bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 rounded-xl transition-all cursor-pointer"
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
                      <p className="text-xs text-gray-500 font-bold mt-1.5 uppercase tracking-wider">{monthTeams.length} {monthTeams.length === 1 ? 'Team' : 'Teams'} Active</p>
                    </div>

                    <div className="mt-6 pt-3 border-t border-glass-border space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-gray-400">
                        <span>Overall Achieved</span>
                        <span className={achievementPercent >= 100 ? 'text-green-400' : achievementPercent > 60 ? 'text-yellow-400' : 'text-gray-400'}>
                          {achievementPercent}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${achievementPercent >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : achievementPercent > 60 ? 'bg-yellow-500' : 'bg-brand-green'}`}
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
          {/* Header Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0a0e17]/80 p-5 rounded-2xl border border-white/5 shadow-xl">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedMonth(null)}
                className="p-3 bg-gray-950 border border-white/10 hover:bg-gray-900 text-gray-400 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-md"
                title="Back to Month List"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-white tracking-tight uppercase">{selectedMonth} TARGETS</h2>
                  <span className="px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-[9px] text-brand-green font-extrabold uppercase font-mono tracking-widest">
                    {timingInfo.isPast ? 'Concluded' : 'Running'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Workspace Performance Engine & Analytics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto self-stretch lg:self-auto">
              {/* Tab Selector pills */}
              <div className="flex p-1 bg-black/40 border border-white/5 rounded-xl flex-1 lg:flex-initial">
                <button
                  onClick={() => setActiveSubTab('ledger')}
                  className={`flex-1 lg:flex-initial px-4 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'ledger'
                      ? 'bg-brand-green text-black shadow-md font-extrabold shadow-green-500/15'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" /> Ledger
                </button>
                <button
                  onClick={() => setActiveSubTab('overview')}
                  className={`flex-1 lg:flex-initial px-4 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'overview'
                      ? 'bg-brand-green text-black shadow-md font-extrabold shadow-green-500/15'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" /> Overview
                </button>
                <button
                  onClick={() => setActiveSubTab('simulator')}
                  className={`flex-1 lg:flex-initial px-4 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'simulator'
                      ? 'bg-brand-green text-black shadow-md font-extrabold shadow-green-500/15'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" /> Simulator
                </button>
              </div>

              <button 
                onClick={() => {
                  fetchTargets();
                  if (isAdmin) fetchPendingChanges();
                }}
                className="p-3 bg-gray-950 border border-white/10 hover:bg-gray-900 text-gray-400 hover:text-white rounded-xl transition-all shrink-0 cursor-pointer shadow-md"
                title="Refresh Database"
              >
                <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    fetchPendingChanges();
                    setIsApprovalQueueOpen(true);
                  }}
                  className="relative p-3 bg-gray-950 border border-white/10 hover:bg-gray-900 text-gray-400 hover:text-white rounded-xl transition-all shrink-0 cursor-pointer shadow-md"
                  title="Target Approval Requests"
                >
                  <Inbox className="w-4 h-4" />
                  {pendingChanges.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white animate-bounce">
                      {pendingChanges.length}
                    </span>
                  )}
                </button>
              )}
              {isAdmin && (
                <button 
                  onClick={() => setIsTeamModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-black text-[10px] uppercase tracking-widest transition-all shadow-md glow-green cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                  Add Team
                </button>
              )}
            </div>
          </div>

          {/* Sub-tab Rendering */}
          {loading ? (
            <div className="glass-panel p-20 rounded-2xl border border-glass-border flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-brand-green animate-spin" />
              <span className="text-gray-400 text-xs font-black tracking-widest uppercase animate-pulse">Syncing performance ledger...</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeSubTab === 'overview' && (
              <motion.div 
                key="overview-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Main Gauge and Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Progress Ring Ring */}
                  <div className="lg:col-span-2 glass-panel p-6 rounded-2xl bg-gradient-to-br from-[#0b0f19] to-[#0d1323] border border-white/5 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-xl">
                    <div className="absolute top-0 right-0 w-44 h-44 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <ProgressRing 
                      percentage={overallAchievementPercent} 
                      size={130} 
                      strokeWidth={10} 
                      colorClass={overallAchievementPercent >= 100 ? "text-emerald-400" : overallAchievementPercent >= 70 ? "text-brand-green" : "text-yellow-400"}
                      glowColor={overallAchievementPercent >= 100 ? "rgba(16,185,129,0.3)" : "rgba(0,201,80,0.2)"}
                    />

                    <div className="flex-1 space-y-4 text-center md:text-left">
                      <div>
                        <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-brand-green px-2 py-0.5 rounded font-black tracking-widest uppercase font-mono">Company Performance Status</span>
                        <h3 className="text-2xl font-black text-white tracking-tight mt-2">
                          {overallAchievementPercent >= 100 
                            ? 'Excellent Work! Targets Conquered.' 
                            : overallAchievementPercent >= 80 
                            ? 'Almost there! Push for the finish line.' 
                            : 'Performance trajectory is active.'
                          }
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
                        <div>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Company Target</p>
                          <p className="text-lg font-black text-white mt-0.5 font-mono">${totalTargetVal.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Gross Achieved</p>
                          <p className="text-lg font-black text-brand-green mt-0.5 font-mono">${totalAchievedVal.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Remaining Gap</p>
                          <p className="text-lg font-black text-yellow-400 mt-0.5 font-mono">${overallGapVal.toLocaleString()}</p>
                        </div>
                      </div>

                      {overallGapVal > 0 ? (
                        <p className="text-xs text-gray-400 font-medium">
                          💡 The workspace requires <span className="text-white font-bold">${overallGapVal.toLocaleString()}</span> in achievements to hit 100% company target.
                        </p>
                      ) : (
                        <p className="text-xs text-brand-green font-bold flex items-center justify-center md:justify-start gap-1">
                          <CheckCircle2 className="w-4 h-4 shrink-0" /> Target completed successfully. Reward milestones activated!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Performance Tiers breakdown */}
                  <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#0b0f19]/40 flex flex-col justify-between shadow-xl">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 mb-4">Performance Distribution</h4>
                    
                    <div className="space-y-4">
                      {/* Elite */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-all">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_6px_#a855f7]" />
                          <div>
                            <p className="text-[10px] text-white font-black uppercase">Elite Achievers</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase">100% or more achieved</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-purple-400 font-mono">{eliteAchievers.length} member(s)</span>
                      </div>

                      {/* On Track */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-green-500/5 border border-green-500/10 hover:bg-green-500/10 transition-all">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-brand-green shadow-[0_0_6px_#00c950]" />
                          <div>
                            <p className="text-[10px] text-white font-black uppercase">On Track</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase">70% to 99% achieved</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-brand-green font-mono">{onTrackAchievers.length} member(s)</span>
                      </div>

                      {/* Support Needed */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10 transition-all">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_6px_#f97316]" />
                          <div>
                            <p className="text-[10px] text-white font-black uppercase">Needs Attention</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase">Below 70% achieved</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-orange-400 font-mono">{supportRequired.length} member(s)</span>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 mt-4 text-[10px] text-gray-500 font-bold text-center uppercase tracking-widest">
                      Total Workforce: {allMembers.length} member(s)
                    </div>
                  </div>
                </div>

                {/* Team Leaderboard Rankings & Star Performers Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Team Rankings (Left) */}
                  <div className="xl:col-span-1 glass-panel p-5 rounded-2xl border border-white/5 shadow-xl flex flex-col">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-400" /> Team Rankings
                    </h3>
                    
                    {teamRankings.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-10 font-bold">No active teams to rank.</p>
                    ) : (
                      <div className="divide-y divide-white/5 flex-1 flex flex-col justify-center">
                        {teamRankings.map((rank, index) => {
                          const badgeColors = index === 0 ? "bg-amber-500/25 border-amber-500/40 text-amber-300" :
                                              index === 1 ? "bg-slate-300/20 border-slate-300/30 text-slate-300" :
                                              index === 2 ? "bg-amber-700/20 border-amber-700/30 text-amber-600" :
                                              "bg-gray-800/40 border-gray-700 text-gray-400";
                          
                          return (
                            <div key={rank.id} className="py-3.5 flex items-center justify-between group hover:bg-white/[0.01] transition-all px-1.5 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-md border text-[10px] font-black flex items-center justify-center font-mono ${badgeColors}`}>
                                  #{index + 1}
                                </span>
                                <div>
                                  <span className="text-sm font-black text-white group-hover:text-brand-green transition-colors uppercase">Team {rank.teamName}</span>
                                  <p className="text-[9px] text-gray-500 font-semibold uppercase mt-0.5">Target: ${rank.target.toLocaleString()}</p>
                                </div>
                              </div>
                              
                              <div className="text-right space-y-1.5">
                                <span className={`text-xs font-black font-mono ${rank.percent >= 100 ? 'text-green-400' : rank.percent >= 70 ? 'text-brand-green' : 'text-yellow-500'}`}>
                                  {rank.percent}%
                                </span>
                                <div className="w-20 h-1 bg-gray-900 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-700 ${rank.percent >= 100 ? 'bg-green-500' : 'bg-brand-green'}`} 
                                    style={{ width: `${Math.min(100, rank.percent)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Star Performers Showcase (Right) */}
                  <div className="xl:col-span-2 glass-panel p-5 rounded-2xl border border-white/5 shadow-xl flex flex-col">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} /> Star Performers Showcase
                    </h3>

                    {eliteAchievers.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                        <Award className="w-10 h-10 text-gray-700 mb-2 opacity-50" />
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">No target heroes yet</h4>
                        <p className="text-xs text-gray-500 max-w-xs mt-1">Once team members cross 100% of their target goals, their achievements will shine here!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 mt-4 overflow-y-auto max-h-[380px] pr-1">
                        {eliteAchievers.map((star, idx) => {
                          const starProgress = star.teamTarget > 0 ? Math.round((star.achieved / star.teamTarget) * 100) : 0;
                          return (
                            <div 
                              key={idx}
                              className="relative overflow-hidden p-4 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent hover:border-purple-500/40 transition-all flex flex-col justify-between gap-3 group hover:shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                            >
                              {/* Glowing corner decoration */}
                              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all" />
                              
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-xs font-black text-purple-400">
                                    {star.name.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-extrabold text-white tracking-tight">{star.name}</h4>
                                    <span className="text-[9px] font-bold font-mono text-gray-400 uppercase">{star.employeeId} • Team {star.teamName}</span>
                                  </div>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-[9px] font-black font-mono text-purple-300 border border-purple-500/30">
                                  {starProgress}%
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-2.5 font-mono">
                                <div>
                                  <p className="text-[9px] text-gray-500 font-semibold uppercase">Goal Target</p>
                                  <p className="text-gray-300 font-bold">${star.teamTarget?.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-gray-500 font-semibold uppercase">Achieved</p>
                                  <p className="text-purple-400 font-black">${star.achieved?.toLocaleString()}</p>
                                </div>
                              </div>

                              <button 
                                onClick={(e) => triggerConfetti(e)}
                                className="w-full mt-1.5 py-2 rounded-lg bg-purple-500/15 hover:bg-purple-500 text-purple-300 hover:text-white border border-purple-500/30 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                              >
                                <Sparkles className="w-3.5 h-3.5" /> Celebrate 🎉
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSubTab === 'simulator' && (
              <motion.div 
                key="simulator-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Simulator Controls & Presets */}
                <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-[#0c101d] to-[#0f172a] border border-white/5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500/15 border border-blue-500/25 rounded-2xl text-blue-400">
                      <Sliders className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-white uppercase tracking-wider">What-If Target Multiplier</h3>
                      <p className="text-xs text-gray-400 leading-normal">
                        Simulate organizational target shifts dynamically. Slide the multiplier to preview required run rates, achievement ratios, and capacity projections.
                      </p>
                    </div>
                  </div>

                  {/* Multiplier Slider Box */}
                  <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8 items-center border-t border-white/5 pt-6">
                    <div className="lg:col-span-3 space-y-4">
                      <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                        <span className="uppercase tracking-widest">Multiplier Scale</span>
                        <span className="text-lg font-black text-blue-400 font-mono bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/25">
                          {simulatorMultiplier}% {simulatorMultiplier === 100 ? '(Baseline)' : simulatorMultiplier > 100 ? `(+${simulatorMultiplier - 100}% Stretch)` : `(-${100 - simulatorMultiplier}% Lower)`}
                        </span>
                      </div>
                      
                      <input 
                        type="range" 
                        min="50" 
                        max="200" 
                        step="5"
                        value={simulatorMultiplier}
                        onChange={(e) => setSimulatorMultiplier(Number(e.target.value))}
                        className="w-full h-2.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-brand-green border border-white/5"
                      />
                      
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold font-mono">
                        <span>50% (MIN)</span>
                        <span>100% (BASELINE)</span>
                        <span>150% (STRETCH)</span>
                        <span>200% (MAX SIM)</span>
                      </div>
                    </div>

                    <div className="lg:col-span-1 space-y-2">
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest block">Quick Presets</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setSimulatorMultiplier(85)}
                          className="px-2.5 py-2 text-[10px] font-bold border border-white/5 bg-black/40 hover:bg-black text-gray-300 rounded-lg uppercase transition-all cursor-pointer"
                        >
                          85% Conservative
                        </button>
                        <button 
                          onClick={() => setSimulatorMultiplier(100)}
                          className="px-2.5 py-2 text-[10px] font-bold border border-white/5 bg-black/40 hover:bg-black text-gray-300 rounded-lg uppercase transition-all cursor-pointer"
                        >
                          100% Reset
                        </button>
                        <button 
                          onClick={() => setSimulatorMultiplier(115)}
                          className="px-2.5 py-2 text-[10px] font-bold border border-white/5 bg-black/40 hover:bg-black text-gray-300 rounded-lg uppercase transition-all cursor-pointer"
                        >
                          115% Growth
                        </button>
                        <button 
                          onClick={() => setSimulatorMultiplier(130)}
                          className="px-2.5 py-2 text-[10px] font-bold border border-white/5 bg-black/40 hover:bg-black text-gray-300 rounded-lg uppercase transition-all cursor-pointer"
                        >
                          130% Stretch
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Outcome Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1: New Simulated Target */}
                  <div className="glass-panel p-5 rounded-2xl border border-white/5 shadow-lg bg-[#0b0f19]/40 flex flex-col justify-between min-h-[140px]">
                    <div>
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block">Simulated Company Target</span>
                      <p className="text-2xl font-black text-white mt-1.5 font-mono">
                        ${Math.round(totalTargetVal * (simulatorMultiplier / 100)).toLocaleString()}
                      </p>
                    </div>
                    <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[10px] text-gray-400">
                      <span>Original: ${totalTargetVal.toLocaleString()}</span>
                      <span className={simulatorMultiplier >= 100 ? 'text-green-400 font-mono' : 'text-red-400 font-mono'}>
                        {simulatorMultiplier >= 100 ? '+' : ''}{simulatorMultiplier - 100}%
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Simulated Achievement Rate */}
                  {(() => {
                    const simTarget = totalTargetVal * (simulatorMultiplier / 100);
                    const simPercent = simTarget > 0 ? Math.round((totalAchievedVal / simTarget) * 100) : 0;
                    return (
                      <div className="glass-panel p-5 rounded-2xl border border-white/5 shadow-lg bg-[#0b0f19]/40 flex flex-col justify-between min-h-[140px]">
                        <div>
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block">Simulated Achievement Rate</span>
                          <p className={`text-2xl font-black mt-1.5 font-mono ${simPercent >= 100 ? 'text-green-400' : simPercent >= 70 ? 'text-brand-green' : 'text-yellow-500'}`}>
                            {simPercent}%
                          </p>
                        </div>
                        <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[10px] text-gray-400">
                          <span>Original Rate: {overallAchievementPercent}%</span>
                          <span className="font-mono text-gray-500">Achieved remains constant</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Card 3: Required Run-rates */}
                  {(() => {
                    const simTarget = totalTargetVal * (simulatorMultiplier / 100);
                    const simGap = Math.max(0, simTarget - totalAchievedVal);
                    
                    let label = "Monthly Run Rate Needed";
                    let content = `$${simGap.toLocaleString()}`;
                    let footerText = "Month concluded";

                    if (timingInfo.isPast) {
                      footerText = "Ledger month is concluded";
                    } else if (timingInfo.isCurrentMonth) {
                      label = "Daily Run Rate Needed";
                      content = `$${Math.round(simGap / timingInfo.daysLeft).toLocaleString()} / day`;
                      footerText = `Next ${timingInfo.daysLeft} days remaining`;
                    } else if (timingInfo.isFuture) {
                      label = "Daily Target Run Rate";
                      content = `$${Math.round(simTarget / timingInfo.totalDays).toLocaleString()} / day`;
                      footerText = `Computed over ${timingInfo.totalDays} days`;
                    }

                    return (
                      <div className="glass-panel p-5 rounded-2xl border border-white/5 shadow-lg bg-[#0b0f19]/40 flex flex-col justify-between min-h-[140px]">
                        <div>
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block">{label}</span>
                          <p className="text-xl font-black text-yellow-400 mt-2 font-mono">
                            {content}
                          </p>
                        </div>
                        <div className="border-t border-white/5 pt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-blue-400" /> {footerText}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Card 4: Employee Target Success Ratio */}
                  {(() => {
                    const thresholdMultiplier = simulatorMultiplier / 100;
                    const simSuccesses = allMembers.filter(m => {
                      const simEmpTarget = m.teamTarget * thresholdMultiplier;
                      return simEmpTarget > 0 && m.achieved >= simEmpTarget;
                    });
                    
                    const successPercent = allMembers.length > 0 ? Math.round((simSuccesses.length / allMembers.length) * 100) : 0;
                    
                    return (
                      <div className="glass-panel p-5 rounded-2xl border border-white/5 shadow-lg bg-[#0b0f19]/40 flex flex-col justify-between min-h-[140px]">
                        <div>
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block">Simulated Employee Success</span>
                          <p className="text-2xl font-black text-white mt-1.5 font-mono">
                            {simSuccesses.length} / {allMembers.length}
                          </p>
                        </div>
                        <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[10px] text-gray-400">
                          <span>Success Ratio: {successPercent}%</span>
                          <span>Original: {eliteAchievers.length}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}

            {activeSubTab === 'ledger' && (
              <motion.div 
                key="ledger-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Executive Ledger Overview Dashboard */}
                {(() => {
                  let grandTotalOfficialTarget = 0;
                  let grandTotalTeamTarget = 0;
                  let grandTotalAchieved = 0;
                  
                  const officialTargetFilledMembers: { name: string; team: string; achieved: number; target: number }[] = [];
                  const teamTargetFilledMembers: { name: string; team: string; achieved: number; target: number }[] = [];
                  const dangerZoneMembers: { name: string; team: string; achieved: number; expected: number; target: number; percent: number; neededPercent: number; totalRemainingPercent: number }[] = [];
                  let totalMembersCount = 0;

                  const isCurrent = timingInfo.isCurrentMonth;
                  const isPast = timingInfo.isPast;
                  
                  let expectedProgressRatio = 0;
                  if (isPast) {
                    expectedProgressRatio = 1.0;
                  } else if (isCurrent) {
                    const daysPassed = Math.max(0, timingInfo.totalDays - timingInfo.daysLeft);
                    expectedProgressRatio = timingInfo.totalDays > 0 ? (daysPassed / timingInfo.totalDays) : 0;
                  }

                  activeMonthTargets.forEach(target => {
                    target.members.forEach((m: any) => {
                      totalMembersCount++;
                      const offT = Number(m.officialTarget) || 0;
                      const teamT = Number(m.teamTarget) || 0;
                      const ach = Number(m.achieved) || 0;
                      
                      grandTotalOfficialTarget += offT;
                      grandTotalTeamTarget += teamT;
                      grandTotalAchieved += ach;

                      if (ach >= offT && offT > 0) {
                        officialTargetFilledMembers.push({ name: m.name, team: target.teamName, achieved: ach, target: offT });
                      }
                      if (ach >= teamT && teamT > 0) {
                        teamTargetFilledMembers.push({ name: m.name, team: target.teamName, achieved: ach, target: teamT });
                      }

                      // Prorated danger zone check based on expected date progress
                      if (expectedProgressRatio > 0 && offT > 0) {
                        const expectedVal = offT * expectedProgressRatio;
                        // Flag if below 75% of prorated expected value
                        if (ach < expectedVal * 0.75) {
                          const currentPct = Math.round((ach / offT) * 100);
                          const expectedPct = Math.round(expectedProgressRatio * 100);
                          const neededPct = Math.max(0, expectedPct - currentPct);
                          const remainingPct = Math.max(0, 100 - currentPct);

                          dangerZoneMembers.push({
                            name: m.name,
                            team: target.teamName,
                            achieved: ach,
                            expected: Math.round(expectedVal),
                            target: offT,
                            percent: currentPct,
                            neededPercent: neededPct,
                            totalRemainingPercent: remainingPct
                          });
                        }
                      }
                    });
                  });

                  const officialAchievementRate = grandTotalOfficialTarget > 0 ? Math.round((grandTotalAchieved / grandTotalOfficialTarget) * 100) : 0;
                  const teamAchievementRate = grandTotalTeamTarget > 0 ? Math.round((grandTotalAchieved / grandTotalTeamTarget) * 100) : 0;

                  return (
                    <>
                      {/* Premium Summary Cards */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Card 1: Official Target Progress */}
                        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#0c101d]/50 shadow-xl flex items-center justify-between gap-6 relative overflow-hidden group hover:border-brand-green/30 transition-all duration-300">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-green/5 rounded-full blur-2xl group-hover:bg-brand-green/10 transition-colors" />
                          <div className="space-y-2">
                            <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest block">Official Target Progress</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-black text-white font-mono">${grandTotalAchieved.toLocaleString()}</span>
                              <span className="text-xs text-gray-500 font-medium">/ ${grandTotalOfficialTarget.toLocaleString()}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Overall performance ledger coverage</p>
                          </div>
                          
                          {/* Circle Progress */}
                          <div className="relative w-20 h-20 shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path className="text-gray-900" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              <path className="text-brand-green transition-all duration-1000" strokeDasharray={`${Math.min(100, officialAchievementRate)}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-black text-white font-mono">{officialAchievementRate}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Card 2: Team Target Progress */}
                        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#0c101d]/50 shadow-xl flex items-center justify-between gap-6 relative overflow-hidden group hover:border-yellow-500/20 transition-all duration-300">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-colors" />
                          <div className="space-y-2">
                            <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest block">Team Target Progress</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-black text-white font-mono">${grandTotalAchieved.toLocaleString()}</span>
                              <span className="text-xs text-gray-500 font-medium">/ ${grandTotalTeamTarget.toLocaleString()}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Overall team target coverage</p>
                          </div>
                          
                          {/* Circle Progress */}
                          <div className="relative w-20 h-20 shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path className="text-gray-900" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              <path className="text-yellow-500 transition-all duration-1000" strokeDasharray={`${Math.min(100, teamAchievementRate)}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-black text-white font-mono">{teamAchievementRate}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Card 3: Elite Milestone Tracker */}
                        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#0c101d]/50 shadow-xl flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-blue-500/20 transition-all duration-300">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest block">Elite Milestone Tracker</span>
                              <span className="text-xs font-medium text-gray-400">Target Completion Standing</span>
                            </div>
                            <Award className="w-5 h-5 text-blue-400 animate-pulse" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 divide-x divide-white/5">
                            <div>
                              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Official Targets Met</span>
                              <span className="text-xl font-black text-brand-green font-mono">{officialTargetFilledMembers.length} <span className="text-xs text-gray-500 font-medium">/ {totalMembersCount}</span></span>
                            </div>
                            <div className="pl-4">
                              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Team Targets Met</span>
                              <span className="text-xl font-black text-yellow-400 font-mono">{teamTargetFilledMembers.length} <span className="text-xs text-gray-500 font-medium">/ {totalMembersCount}</span></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Target Achievers & Danger Zone Roster Wall */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#080c14]/40 p-5 rounded-2xl border border-white/5">
                        {/* Roster 1: Official Target Achievers */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-brand-green" /> Official Target Achievers ({officialTargetFilledMembers.length})
                          </h4>
                          <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                            {officialTargetFilledMembers.length === 0 ? (
                              <p className="text-[11px] text-gray-500 italic py-2">No members have reached their official target yet.</p>
                            ) : (
                              officialTargetFilledMembers.map((m, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 bg-black/40 border border-white/5 rounded-xl hover:border-brand-green/20 transition-all">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-[9px] font-black text-brand-green">{m.name.charAt(0)}</div>
                                    <span className="text-xs font-bold text-white">{m.name}</span>
                                    <span className="text-[9px] text-gray-500 uppercase font-mono">({m.team})</span>
                                  </div>
                                  <span className="text-[11px] font-bold text-brand-green font-mono">${m.achieved.toLocaleString()} / ${m.target.toLocaleString()}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Roster 2: Team Target Achievers */}
                        <div className="space-y-3 border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6">
                          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-500" /> Team Target Achievers ({teamTargetFilledMembers.length})
                          </h4>
                          <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                            {teamTargetFilledMembers.length === 0 ? (
                              <p className="text-[11px] text-gray-500 italic py-2">No members have reached their team target yet.</p>
                            ) : (
                              teamTargetFilledMembers.map((m, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 bg-black/40 border border-white/5 rounded-xl hover:border-yellow-500/10 transition-all">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-[9px] font-black text-yellow-500">{m.name.charAt(0)}</div>
                                    <span className="text-xs font-bold text-white">{m.name}</span>
                                    <span className="text-[9px] text-gray-500 uppercase font-mono">({m.team})</span>
                                  </div>
                                  <span className="text-[11px] font-bold text-yellow-500 font-mono">${m.achieved.toLocaleString()} / ${m.target.toLocaleString()}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Roster 3: Danger Zone Watchlist */}
                        <div className="space-y-3 border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6">
                          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" /> Danger Zone ({dangerZoneMembers.length})
                          </h4>
                          <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-2.5">
                            {dangerZoneMembers.length === 0 ? (
                              <p className="text-[11px] text-gray-500 italic py-2">
                                {expectedProgressRatio === 0 
                                  ? 'Target month has not started yet.' 
                                  : 'All members are on track! No risk data.'}
                              </p>
                            ) : (
                              dangerZoneMembers.map((m, idx) => (
                                <div key={idx} className="flex flex-col p-3 bg-black/40 border border-white/5 rounded-xl hover:border-red-500/30 hover:bg-red-500/[0.01] transition-all gap-2 relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/[0.01] rounded-full blur-xl group-hover:bg-red-500/[0.03] transition-colors" />
                                  <div className="flex items-center justify-between gap-2 min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-5.5 h-5.5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[9px] font-black text-red-400 shrink-0">{m.name.charAt(0)}</div>
                                      <div className="truncate min-w-0">
                                        <span className="text-xs font-bold text-white truncate block">{m.name}</span>
                                        <span className="text-[8px] text-gray-500 font-extrabold uppercase tracking-wider block font-mono">Team {m.team}</span>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-[10px] font-extrabold text-red-450 font-mono block">${m.achieved.toLocaleString()} <span className="text-[9px] text-gray-500 font-medium">/ ${m.target.toLocaleString()}</span></span>
                                    </div>
                                  </div>

                                  {/* Custom timeline track */}
                                  <div className="space-y-1">
                                    <div className="w-full bg-gray-950 rounded-full h-1.5 overflow-hidden flex border border-white/5">
                                      {/* Achieved segment */}
                                      <div 
                                        style={{ width: `${m.percent}%` }} 
                                        className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-l-full" 
                                      />
                                      {/* Needed prorated segment */}
                                      <div 
                                        style={{ width: `${m.neededPercent}%` }} 
                                        className="h-full bg-red-500 animate-pulse border-l border-white/20" 
                                      />
                                    </div>
                                    <div className="flex justify-between items-center text-[8px] font-mono tracking-widest uppercase font-bold text-gray-500">
                                      <span className="text-amber-500">Done: {m.percent}%</span>
                                      <span className="text-red-400">Prorated Gap: +{m.neededPercent}%</span>
                                      <span>Rem: {m.totalRemainingPercent}%</span>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Active Teams Target Cards Accordion Layout */}
                <div className="space-y-4">
                  {activeMonthTargets.map(target => {
                    const totalOfficialTarget = target.members.reduce((sum: number, m: any) => sum + (Number(m.officialTarget) || 0), 0);
                    const totalTeamTarget = target.members.reduce((sum: number, m: any) => sum + (Number(m.teamTarget) || 0), 0);
                    const totalAchieved = target.members.reduce((sum: number, m: any) => sum + (Number(m.achieved) || 0), 0);
                    const teamAchievement = totalTeamTarget > 0 ? Math.round((totalAchieved / totalTeamTarget) * 100) : 0;
                    const isExpanded = !!expandedTeams[target._id];

                    return (
                      <div 
                        key={target._id} 
                        className="bg-[#0b0f19]/60 border border-white/5 hover:border-brand-green/30 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,201,80,0.03)]"
                      >
                        {/* Accordion Trigger Header */}
                        <div 
                          onClick={() => toggleAccordion(target._id)}
                          className="p-4 bg-[#0a0f19] hover:bg-[#0f1629] cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative p-2.5 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl text-brand-green shadow-inner">
                              <Target className="w-4.5 h-4.5" />
                              <div className="absolute inset-0 rounded-xl bg-brand-green/10 animate-pulse pointer-events-none" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2.5">
                                <h3 className="text-base font-black text-white tracking-tight uppercase">Team {target.teamName}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase font-mono tracking-widest ${
                                  teamAchievement >= 100 ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                  teamAchievement > 60 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                  'bg-gray-500/10 border-gray-500/30 text-gray-400'
                                }`}>
                                  {teamAchievement}% Achieved
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-500 font-semibold uppercase mt-0.5">
                                Configured for {target.members.length} {target.members.length === 1 ? 'member' : 'members'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                            {/* Summary bar for easy reference when collapsed */}
                            <div className="flex items-center gap-4 text-xs font-mono">
                              <div>
                                <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider">Goal</span>
                                <span className="text-gray-300 font-bold">${totalTeamTarget.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider font-sans">Achieved</span>
                                <span className="text-brand-green font-extrabold">${totalAchieved.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5" onClick={e => e.stopPropagation()}>
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleOpenEditModal(target)}
                                    className="px-3.5 py-2 border border-blue-500/35 hover:border-blue-500/70 bg-blue-500/10 hover:bg-blue-500/25 text-blue-400 text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                                  >
                                    <Edit2 className="w-3 h-3" /> Manage
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTeamTarget(target._id, target.teamName)}
                                    className="p-2 border border-red-500/30 hover:border-red-500/60 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all cursor-pointer"
                                    title="Delete Team targets"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              
                              {/* Accordion chevron toggle */}
                              <div className="p-2 bg-gray-900 border border-white/5 rounded-xl hover:bg-gray-800 transition-colors text-gray-400">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Collapsible content with animation */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-white/5 overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                  <thead className="bg-[#080b12] text-[10px] text-gray-400 font-bold uppercase tracking-wider border-b border-white/5">
                                    <tr>
                                      <th className="px-6 py-4">Employee ID</th>
                                      <th className="px-6 py-4">Member Name</th>
                                      <th className="px-6 py-4 text-right">Official Target</th>
                                      <th className="px-6 py-4 text-right">Team Target</th>
                                      <th className="px-6 py-4 text-right">Achieved</th>
                                      <th className="px-6 py-4 text-right w-56">Achievement Progress</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5 bg-black/10">
                                    {target.members.map((m: any, idx: number) => {
                                      const itemProgress = m.teamTarget > 0 ? Math.round((m.achieved / m.teamTarget) * 100) : 0;
                                      return (
                                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                          <td className="px-6 py-4 text-xs font-mono font-bold text-gray-400">{m.employeeId}</td>
                                          <td className="px-6 py-4">
                                            <div className="flex items-center gap-2.5">
                                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center text-xs font-extrabold text-brand-green">
                                                {m.name.charAt(0)}
                                              </div>
                                              <span className="text-white text-sm font-medium">{m.name}</span>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 text-right font-mono text-gray-400 text-sm font-medium">${m.officialTarget?.toLocaleString()}</td>
                                          <td className="px-6 py-4 text-right font-mono text-gray-300 text-sm font-semibold">${m.teamTarget?.toLocaleString()}</td>
                                          <td className="px-6 py-4 text-right font-mono text-brand-green text-sm font-black">${m.achieved?.toLocaleString()}</td>
                                          <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3.5">
                                              {!isAdmin && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveRequestTarget({
                                                      targetId: target._id,
                                                      teamName: target.teamName,
                                                      monthName: target.monthName,
                                                      memberName: m.name,
                                                      employeeId: m.employeeId,
                                                      oldAchieved: m.achieved
                                                    });
                                                    setRequestedAchieved(String(m.achieved));
                                                    setIsRequestModalOpen(true);
                                                  }}
                                                  className="px-2.5 py-1.5 rounded-lg border border-brand-green/25 hover:border-brand-green/50 bg-brand-green/5 hover:bg-brand-green/15 text-brand-green text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-sm shadow-green-500/5 hover:shadow-green-500/15"
                                                  title="Request to update achievement score"
                                                >
                                                  <ArrowUpRight className="w-3 h-3" /> Request
                                                </button>
                                              )}
                                              <span className={`text-xs font-black w-8 text-right ${itemProgress >= 100 ? 'text-green-400 font-mono' : itemProgress >= 70 ? 'text-brand-green font-mono' : 'text-gray-400 font-mono'}`}>{itemProgress}%</span>
                                              <div className="w-24 h-1.5 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                                                <div 
                                                  className={`h-full rounded-full transition-all duration-700 ${itemProgress >= 100 ? 'bg-green-500' : 'bg-brand-green'}`} 
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
                                        <td colSpan={6} className="px-6 py-10 text-center text-gray-500 text-sm">
                                          No targets configured for this team. {isAdmin ? 'Click "Manage" to insert members.' : ''}
                                        </td>
                                      </tr>
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          )}
        </div>
      )}

      {/* CREATE MONTH MODAL */}
      <AnimatePresence>
        {isMonthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsMonthModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm bg-gray-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10">
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/40">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-green" /> Create Month Folder
                </h3>
                <button onClick={() => setIsMonthModalOpen(false)} className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer">
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
                  <p className="text-[10px] text-gray-500 font-medium">Provide Month and Year to distinguish target collections.</p>
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsMonthModalOpen(false)} className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={isCreatingMonth} className="px-5 py-2.5 text-xs font-black bg-brand-green hover:bg-brand-green-hover text-black rounded-xl uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg glow-green cursor-pointer">
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
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm bg-gray-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10">
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/40">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-brand-green" /> Add Team Target
                </h3>
                <button onClick={() => setIsTeamModalOpen(false)} className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer">
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
                  <p className="text-[10px] text-gray-500 font-medium">Provide team code (normally 2 letters like CC, CM) for {selectedMonth}.</p>
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsTeamModalOpen(false)} className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={isCreatingTeam} className="px-5 py-2.5 text-xs font-black bg-brand-green hover:bg-brand-green-hover text-black rounded-xl uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg glow-green cursor-pointer">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.96, y: 15 }} 
              className="relative w-full max-w-4xl bg-gradient-to-b from-[#0d111c] to-[#080a10] border border-brand-green/20 rounded-2xl shadow-[0_0_50px_rgba(0,201,80,0.08)] overflow-hidden z-10 flex flex-col max-h-[85vh] transition-all duration-300"
            >
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/60 backdrop-blur-md">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2 uppercase tracking-wide">
                    <div className="p-1.5 bg-brand-green/10 border border-brand-green/25 rounded-lg text-brand-green">
                      <Edit2 className="w-4 h-4" />
                    </div>
                    Manage Team {activeEditTarget.teamName} Targets
                  </h3>
                  <p className="text-[10px] text-brand-green uppercase tracking-widest mt-1 font-bold font-mono">Performance Month: {activeEditTarget.monthName}</p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/5">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedTarget} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Configure Member Entry List</span>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowQuickPaste(!showQuickPaste)}
                        className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        {showQuickPaste ? "Hide Excel Paste" : "Quick Excel Paste"}
                      </button>

                      <button
                        type="button"
                        onClick={handleAddMemberRow}
                        className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ml-auto sm:ml-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Add Member Row
                      </button>
                    </div>
                  </div>

                  {/* Excel Quick Paste Section */}
                  <AnimatePresence>
                    {showQuickPaste && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-black/40 border border-emerald-500/15 rounded-xl space-y-3">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                              <ClipboardList className="w-4 h-4" /> Bulk Spreadsheet Data Import
                            </h4>
                            <span className="text-[8px] bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-300 font-extrabold uppercase">Copy-Paste Tool</span>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-normal">
                            Copy rows directly from Excel/Google Sheets and paste in the input box below. Fields must be ordered:
                            <code className="bg-emerald-500/10 text-emerald-400 mx-1 px-1 rounded font-mono font-bold">Employee ID | Name | Official Target | Team Target | Achieved</code>
                            (separated by Tabs or Commas). Existing IDs will be overwritten; new IDs will append.
                          </p>
                          <textarea
                            rows={4}
                            value={quickPasteText}
                            onChange={e => setQuickPasteText(e.target.value)}
                            placeholder="EMP-101&#9;John Doe&#9;5000&#9;5000&#9;4800&#10;EMP-102&#9;Jane Smith&#9;6000&#9;6000&#9;6000"
                            className="w-full bg-black border border-white/10 p-2.5 rounded-lg text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                          />
                          <div className="flex justify-end gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setQuickPasteText('');
                                setShowQuickPaste(false);
                              }}
                              className="px-3 py-1.5 text-[10px] font-bold text-gray-400 hover:text-white uppercase transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleParseQuickPaste}
                              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase rounded-lg transition-all cursor-pointer shadow-md"
                            >
                              Parse & Import Rows
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="overflow-x-auto border border-white/5 rounded-xl">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#0b0f19] text-gray-400 font-bold uppercase tracking-wider border-b border-white/5">
                        <tr>
                          <th className="px-4 py-3">Employee ID</th>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3 text-right">Official Target ($)</th>
                          <th className="px-4 py-3 text-right">Team Target ($)</th>
                          <th className="px-4 py-3 text-right">Achieved ($)</th>
                          <th className="px-4 py-3 text-center w-16">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-black/20">
                        {activeEditTarget.members.map((m: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-3 py-2">
                              <input 
                                required
                                type="text" 
                                value={m.employeeId} 
                                onChange={e => handleMemberFieldChange(idx, 'employeeId', e.target.value)} 
                                placeholder="ID (e.g. EMP-101)" 
                                className="w-28 bg-black/40 border border-white/10 px-2.5 py-1.5 rounded-lg text-white font-mono focus:border-brand-green/40 focus:ring-1 focus:ring-brand-green/20 focus:outline-none transition-all" 
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input 
                                required
                                type="text" 
                                value={m.name} 
                                onChange={e => handleMemberFieldChange(idx, 'name', e.target.value)} 
                                placeholder="Employee Name" 
                                className="w-44 bg-black/40 border border-white/10 px-2.5 py-1.5 rounded-lg text-white font-semibold focus:border-brand-green/40 focus:ring-1 focus:ring-brand-green/20 focus:outline-none transition-all" 
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input 
                                type="number" 
                                value={m.officialTarget} 
                                onChange={e => handleMemberFieldChange(idx, 'officialTarget', Math.max(0, Number(e.target.value)))} 
                                className="w-24 bg-black/40 border border-white/10 px-2.5 py-1.5 rounded-lg text-white text-right font-mono focus:border-brand-green/40 focus:ring-1 focus:ring-brand-green/20 focus:outline-none transition-all" 
                                min="0"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input 
                                type="number" 
                                value={m.teamTarget} 
                                onChange={e => handleMemberFieldChange(idx, 'teamTarget', Math.max(0, Number(e.target.value)))} 
                                className="w-24 bg-black/40 border border-white/10 px-2.5 py-1.5 rounded-lg text-white text-right font-semibold font-mono focus:border-brand-green/40 focus:ring-1 focus:ring-brand-green/20 focus:outline-none transition-all" 
                                min="0"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                <input 
                                  type="number" 
                                  value={m.achieved} 
                                  onChange={e => handleMemberFieldChange(idx, 'achieved', Math.max(0, Number(e.target.value)))} 
                                  className="w-20 bg-black/40 border border-green-500/20 px-2 py-1.5 rounded-lg text-brand-green text-right font-bold font-mono focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 focus:outline-none transition-all text-xs" 
                                  min="0"
                                  title="Directly edit total achieved"
                                />
                                <div className="flex items-center border border-blue-500/25 bg-blue-950/20 rounded-lg overflow-hidden shrink-0">
                                  <input 
                                    type="number" 
                                    placeholder="+ Add"
                                    id={`add-val-${idx}`}
                                    className="w-12 bg-transparent px-1.5 py-1 text-blue-400 text-right font-semibold font-mono focus:outline-none text-[10px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                    min="0"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const val = Number((e.target as HTMLInputElement).value) || 0;
                                        if (val > 0) {
                                          handleMemberFieldChange(idx, 'achieved', m.achieved + val);
                                          (e.target as HTMLInputElement).value = '';
                                          toast.success(`Added $${val} to total achieved!`);
                                        }
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const inputEl = document.getElementById(`add-val-${idx}`) as HTMLInputElement;
                                      if (inputEl) {
                                        const val = Number(inputEl.value) || 0;
                                        if (val > 0) {
                                          handleMemberFieldChange(idx, 'achieved', m.achieved + val);
                                          inputEl.value = '';
                                          toast.success(`Added $${val} to total achieved!`);
                                        }
                                      }
                                    }}
                                    className="px-1.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-l border-blue-500/20 transition-colors text-[10px] font-black cursor-pointer"
                                    title="Add to total"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
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
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500 font-bold uppercase tracking-wider">No team members added. Add row or paste from Excel.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsEditModalOpen(false)} 
                    className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSavingTarget} 
                    className="px-5 py-2.5 text-xs font-black bg-brand-green hover:bg-brand-green-hover text-black rounded-xl transition-colors flex items-center gap-2 shadow-lg glow-green cursor-pointer uppercase tracking-wider"
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

      {/* TARGET UPDATES APPROVAL QUEUE MODAL */}
      <AnimatePresence>
        {isApprovalQueueOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsApprovalQueueOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-2xl bg-gray-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]"
            >
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/40">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2 uppercase tracking-wide">
                    <Inbox className="w-5 h-5 text-brand-green" /> Target Approval Requests
                  </h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5 font-bold">Review and merge team member achievement updates</p>
                </div>
                <button onClick={() => setIsApprovalQueueOpen(false)} className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {pendingChanges.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 font-bold uppercase tracking-wider text-xs">No pending requests found.</div>
                ) : (
                  pendingChanges.map((change) => {
                    const { targetId, teamName, monthName, memberName, memberEmployeeId, oldAchieved, requestedAchieved } = change.data;
                    const isProcessing = isProcessingDecision === change._id;
                    return (
                      <div key={change._id} className="p-4 bg-[#0a0f19] border border-white/5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors hover:border-white/10">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-brand-green/10 text-brand-green text-[9px] font-black rounded uppercase tracking-wider">Team {teamName}</span>
                            <span className="text-[10px] text-gray-500 font-bold">{monthName}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{memberName} <span className="text-xs font-mono text-gray-500">({memberEmployeeId})</span></h4>
                          <p className="text-[10px] text-gray-400 font-medium">Submitted by: {change.authorEmail}</p>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs text-gray-500 line-through">${oldAchieved}</span>
                            <span className="text-xs text-gray-500">➔</span>
                            <span className="text-xs font-black text-brand-green font-mono">${requestedAchieved}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                          <button
                            disabled={isProcessing}
                            onClick={() => handleDecision(change._id, 'reject')}
                            className="px-3.5 py-2 border border-red-500/20 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/15 text-red-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            disabled={isProcessing}
                            onClick={() => handleDecision(change._id, 'approve')}
                            className="px-4 py-2 bg-brand-green hover:bg-brand-green-hover text-black text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md glow-green cursor-pointer flex items-center gap-1"
                          >
                            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Approve'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MEMBER SUBMIT ACHIEVEMENT REQUEST MODAL */}
      <AnimatePresence>
        {isRequestModalOpen && activeRequestTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsRequestModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-sm bg-gray-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/40">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-brand-green" /> Request Achievement update
                </h3>
                <button onClick={() => setIsRequestModalOpen(false)} className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmitRequest} className="p-5 space-y-4">
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                    <span>Member</span>
                    <span>Employee ID</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-white">
                    <span>{activeRequestTarget.memberName}</span>
                    <span className="font-mono text-gray-300">{activeRequestTarget.employeeId}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase pt-2">
                    <span>Team / Month</span>
                    <span>Current Score</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-white">
                    <span>Team {activeRequestTarget.teamName} ({activeRequestTarget.monthName})</span>
                    <span className="font-mono text-brand-green">${activeRequestTarget.oldAchieved}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">New Achieved Score ($)</label>
                  <input 
                    required 
                    autoFocus 
                    type="number" 
                    placeholder="Enter new achieved value" 
                    value={requestedAchieved} 
                    onChange={e => setRequestedAchieved(e.target.value)} 
                    className="w-full glass-input px-3.5 py-2.5 text-sm bg-black/50 border border-gray-800 rounded-xl focus:border-green-500 focus:outline-none text-white transition-colors" 
                  />
                  <p className="text-[10px] text-gray-500 font-medium">Input your updated achievement figures. Admin approval is required to update the ledger.</p>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsRequestModalOpen(false)} className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={isSubmittingRequest} className="px-5 py-2.5 text-xs font-black bg-brand-green hover:bg-brand-green-hover text-black rounded-xl uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg glow-green cursor-pointer">
                    {isSubmittingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
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
