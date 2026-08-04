'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Clock, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  User, 
  Calendar, 
  RefreshCw, 
  LayoutGrid,
  Table as TableIcon,
  Download,
  RotateCcw,
  X,
  Zap,
  Flame,
  Check,
  Bookmark,
  Save,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { toPng } from 'html-to-image';
import { useAuth } from '@/context/AuthContext';

interface ITimeline {
  _id: string;
  clientName: string;
  memberName: string;
  projectTitle?: string;
  targetEndDate: string;
  status: 'running' | 'delivered';
  deliveredAt?: string;
  notes?: string;
  notified72h?: boolean;
  notified48h?: boolean;
  createdBy?: string;
  createdAt: string;
}

interface ISavedFilterPreset {
  id: string;
  name: string;
  filterStatus: string;
  filterMember: string;
  filterTimeframe: string;
  searchQuery: string;
  sortBy: string;
}

function LiveCountdownText({ targetEndDate }: { targetEndDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
    totalHoursLeft: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false, totalHoursLeft: 999 });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(targetEndDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true, totalHoursLeft: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      const totalHoursLeft = Math.floor(difference / (1000 * 60 * 60));

      setTimeLeft({ days, hours, minutes, seconds, isOverdue: false, totalHoursLeft });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetEndDate]);

  if (timeLeft.isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-lg text-xs font-black animate-pulse shadow-sm shadow-red-500/20">
        <AlertCircle className="w-3.5 h-3.5" /> Order Late
      </span>
    );
  }

  let badgeStyle = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
  if (timeLeft.totalHoursLeft <= 24) {
    badgeStyle = 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse font-black shadow-sm shadow-red-500/20';
  } else if (timeLeft.totalHoursLeft <= 48) {
    badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold shadow-sm shadow-amber-500/20';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl font-mono text-xs ${badgeStyle}`}>
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span>
        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
        {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
      </span>
    </span>
  );
}

export default function TimelineDashboard() {
  const { user, dbUser } = useAuth();
  const isAdmin = Boolean(dbUser?.role === 'super_admin' || dbUser?.role === 'admin' || (user?.email && user.email.toLowerCase().includes('admin')));
  const tableRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<ITimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Multi-Filter & Search States
  const [filterStatus, setFilterStatus] = useState<'all' | 'running' | 'urgent' | 'overdue' | 'delivered'>('running');
  const [filterMember, setFilterMember] = useState<string>('all');
  const [filterTimeframe, setFilterTimeframe] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('targetEndDate_asc');

  // Saved Presets
  const [savedPresets, setSavedPresets] = useState<ISavedFilterPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ITimeline | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Date/Time Selector State
  const [formClientName, setFormClientName] = useState('');
  const [formMemberName, setFormMemberName] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formHour, setFormHour] = useState('06');
  const [formMinute, setFormMinute] = useState('00');
  const [formAmpm, setFormAmpm] = useState<'PM' | 'AM'>('PM');
  const [formNotes, setFormNotes] = useState('');

  const currentUserName = useMemo(() => {
    return dbUser?.name || user?.displayName || (user?.email ? user.email.split('@')[0] : '') || '';
  }, [dbUser, user]);

  const storageKey = useMemo(() => {
    return `timeline_dashboard_filters_${(user?.email || 'default').toLowerCase()}`;
  }, [user]);

  const presetsStorageKey = useMemo(() => {
    return `timeline_filter_presets_${(user?.email || 'default').toLowerCase()}`;
  }, [user]);

  // Load Saved Filters and Presets from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedFilters = localStorage.getItem(storageKey);
        if (savedFilters) {
          const parsed = JSON.parse(savedFilters);
          if (parsed.filterStatus) setFilterStatus(parsed.filterStatus);
          if (parsed.filterMember) setFilterMember(parsed.filterMember);
          if (parsed.filterTimeframe) setFilterTimeframe(parsed.filterTimeframe);
          if (parsed.searchQuery !== undefined) setSearchQuery(parsed.searchQuery);
          if (parsed.sortBy) setSortBy(parsed.sortBy);
        }

        const presetsData = localStorage.getItem(presetsStorageKey);
        if (presetsData) {
          setSavedPresets(JSON.parse(presetsData));
        }
      } catch (err) {
        console.error('Failed to load filter preferences from localStorage:', err);
      }
    }
  }, [storageKey, presetsStorageKey]);

  // Save current active filter choices to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const currentFilterState = {
          filterStatus,
          filterMember,
          filterTimeframe,
          searchQuery,
          sortBy
        };
        localStorage.setItem(storageKey, JSON.stringify(currentFilterState));
      } catch (err) {
        console.error('Failed to save filters to localStorage:', err);
      }
    }
  }, [filterStatus, filterMember, filterTimeframe, searchQuery, sortBy, storageKey]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/timeline');
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      } else {
        toast.error(data.error || 'Failed to fetch timeline items');
      }
    } catch (err: any) {
      toast.error('Network error loading timelines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Calculate unique list of members for dropdown filter and autocomplete
  const uniqueMembers = useMemo(() => {
    const set = new Set<string>();
    if (currentUserName) set.add(currentUserName);
    items.forEach(item => {
      if (item.memberName) set.add(item.memberName);
      if (item.createdBy) {
        const creatorName = item.createdBy.includes('@') ? item.createdBy.split('@')[0] : item.createdBy;
        if (creatorName) set.add(creatorName);
      }
    });
    return Array.from(set).sort();
  }, [items, currentUserName]);

  const applyPresetDays = (daysAdd: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysAdd);
    target.setHours(18, 0, 0, 0); // 6:00 PM default

    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');

    setFormDate(`${yyyy}-${mm}-${dd}`);
    setFormHour('06');
    setFormMinute('00');
    setFormAmpm('PM');
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormClientName('');
    // Requirement 2: Auto-fill assigned member with logged-in user name by default
    setFormMemberName(currentUserName);
    setFormNotes('');
    applyPresetDays(2); // Default 2 days (+48h)
    setIsModalOpen(true);
  };

  const canUserEditItem = (item: ITimeline): boolean => {
    if (isAdmin) return true;

    const currentUserEmail = (user?.email || '').toLowerCase().trim();
    const cName = (dbUser?.name || user?.displayName || '').toLowerCase().trim();
    const itemCreator = (item.createdBy || '').toLowerCase().trim();
    const itemMember = (item.memberName || '').toLowerCase().trim();

    if (currentUserEmail && itemCreator && itemCreator === currentUserEmail) return true;
    if (cName && itemCreator && (itemCreator.includes(cName) || cName.includes(itemCreator))) return true;
    if (cName && itemMember && (itemMember.includes(cName) || cName.includes(itemMember))) return true;

    return false;
  };

  const handleOpenEditModal = (item: ITimeline) => {
    if (!canUserEditItem(item)) {
      toast.error('🔒 Access Denied: You can only edit projects created by or assigned to you.');
      return;
    }
    setEditingItem(item);
    setFormClientName(item.clientName);
    setFormMemberName(item.memberName || item.createdBy || currentUserName);
    setFormNotes(item.notes || '');

    const dateObj = new Date(item.targetEndDate);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    setFormDate(`${yyyy}-${mm}-${dd}`);

    let hours = dateObj.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    setFormHour(String(hours).padStart(2, '0'));
    setFormMinute(String(dateObj.getMinutes()).padStart(2, '0'));
    setFormAmpm(ampm);

    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientName || !formMemberName || !formDate) {
      toast.error('Project Name, Assigned Member, and End Date are required.');
      return;
    }

    let parsedHour = parseInt(formHour, 10);
    if (formAmpm === 'PM' && parsedHour < 12) parsedHour += 12;
    if (formAmpm === 'AM' && parsedHour === 12) parsedHour = 0;

    const [yyyy, mm, dd] = formDate.split('-').map(Number);
    const targetDateObj = new Date(yyyy, mm - 1, dd, parsedHour, parseInt(formMinute, 10), 0);

    setIsSubmitting(true);
    try {
      const payload = {
        clientName: formClientName,
        memberName: formMemberName,
        targetEndDate: targetDateObj.toISOString(),
        notes: formNotes
      };

      if (editingItem) {
        const res = await fetch('/api/timeline', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem._id, ...payload })
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Project Timeline updated successfully!');
          setIsModalOpen(false);
          fetchItems();
        } else {
          toast.error(data.error || 'Failed to update timeline');
        }
      } else {
        const res = await fetch('/api/timeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, createdBy: user?.email || currentUserName || 'User' })
        });
        const data = await res.json();
        if (data.success) {
          toast.success('New Project Timeline added successfully!');
          setIsModalOpen(false);
          fetchItems();
        } else {
          toast.error(data.error || 'Failed to create timeline');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving timeline');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (item: ITimeline, newStatus: 'running' | 'delivered') => {
    if (!canUserEditItem(item)) {
      toast.error('🔒 Access Denied: You can only change status for projects created by or assigned to you.');
      return;
    }
    if (newStatus === 'running' && item.status === 'delivered' && !isAdmin) {
      toast.error('🔒 Access Denied: Only Admins can reopen delivered projects.');
      return;
    }
    try {
      const res = await fetch('/api/timeline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item._id, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        if (newStatus === 'delivered') {
          toast.success(`🎉 ${item.clientName}'s project marked as Delivered!`);
        } else {
          toast.success(`Reopened ${item.clientName}'s project back to Running.`);
        }
        fetchItems();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (err: any) {
      toast.error('Failed to change status');
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/timeline?id=${deletingId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Timeline deleted successfully');
        setDeletingId(null);
        fetchItems();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (err: any) {
      toast.error('Failed to delete timeline');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteItem = (item: ITimeline) => {
    if (!canUserEditItem(item)) {
      toast.error('🔒 Access Denied: You can only delete projects created by or assigned to you.');
      return;
    }
    setDeletingId(item._id);
  };

  const handleDownloadPNG = async () => {
    if (tableRef.current) {
      try {
        const dataUrl = await toPng(tableRef.current, { backgroundColor: '#111827' });
        const link = document.createElement('a');
        link.download = 'project-timeline-tracker.png';
        link.href = dataUrl;
        link.click();
        toast.success("Exported Timeline Table PNG");
      } catch (err) {
        toast.error("Failed to download image");
      }
    }
  };

  // Requirement 5: Save & Manage Filter Presets
  const handleSaveFilterPreset = () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a name for your filter preset.');
      return;
    }
    const newPreset: ISavedFilterPreset = {
      id: `preset_${Date.now()}`,
      name: newPresetName.trim(),
      filterStatus,
      filterMember,
      filterTimeframe,
      searchQuery,
      sortBy
    };
    const updatedPresets = [...savedPresets, newPreset];
    setSavedPresets(updatedPresets);
    setActivePresetId(newPreset.id);
    localStorage.setItem(presetsStorageKey, JSON.stringify(updatedPresets));
    setNewPresetName('');
    setIsSavePresetModalOpen(false);
    toast.success(`Filter Preset "${newPreset.name}" saved!`);
  };

  const handleApplyPreset = (preset: ISavedFilterPreset) => {
    setFilterStatus(preset.filterStatus as any);
    setFilterMember(preset.filterMember);
    setFilterTimeframe(preset.filterTimeframe);
    setSearchQuery(preset.searchQuery);
    setSortBy(preset.sortBy);
    setActivePresetId(preset.id);
    toast.success(`Applied preset: ${preset.name}`);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    if (activePresetId === id) setActivePresetId(null);
    localStorage.setItem(presetsStorageKey, JSON.stringify(updated));
    toast.success('Preset deleted');
  };

  const handleResetFilters = () => {
    setFilterStatus('all');
    setFilterMember('all');
    setFilterTimeframe('all');
    setSearchQuery('');
    setSortBy('targetEndDate_asc');
    setActivePresetId(null);
    toast.success('Filters reset to default');
  };

  // Compute filtered & sorted items
  const nowMs = new Date().getTime();

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const target = new Date(item.targetEndDate).getTime();
      const diffHours = (target - nowMs) / (1000 * 60 * 60);

      // Status filter
      if (filterStatus === 'running' && item.status !== 'running') return false;
      if (filterStatus === 'delivered' && item.status !== 'delivered') return false;
      if (filterStatus === 'urgent' && (item.status !== 'running' || diffHours > 48 || diffHours < 0)) return false;
      if (filterStatus === 'overdue' && (item.status !== 'running' || diffHours >= 0)) return false;

      // Assigned Member filter
      const itemMemberName = (item.memberName || item.createdBy || '').toLowerCase();
      if (filterMember === 'my_assigned') {
        const cName = (currentUserName || user?.email || '').toLowerCase();
        if (!cName || (!itemMemberName.includes(cName) && !cName.includes(itemMemberName))) return false;
      } else if (filterMember !== 'all') {
        if (itemMemberName !== filterMember.toLowerCase()) return false;
      }

      // Timeframe filter
      if (filterTimeframe === 'overdue') {
        if (item.status !== 'running' || diffHours >= 0) return false;
      } else if (filterTimeframe === 'today') {
        const itemDate = new Date(item.targetEndDate);
        const todayDate = new Date();
        if (itemDate.toDateString() !== todayDate.toDateString()) return false;
      } else if (filterTimeframe === 'next48h') {
        if (diffHours < 0 || diffHours > 48) return false;
      } else if (filterTimeframe === 'thisWeek') {
        const itemDate = new Date(item.targetEndDate);
        const todayDate = new Date();
        const nextWeek = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (itemDate < todayDate || itemDate > nextWeek) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.clientName?.toLowerCase().includes(q) || item.projectTitle?.toLowerCase().includes(q);
        const matchesMember = item.memberName?.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        const matchesCreator = item.createdBy?.toLowerCase().includes(q);
        if (!matchesName && !matchesMember && !matchesNotes && !matchesCreator) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'targetEndDate_asc') {
        return new Date(a.targetEndDate).getTime() - new Date(b.targetEndDate).getTime();
      } else if (sortBy === 'targetEndDate_desc') {
        return new Date(b.targetEndDate).getTime() - new Date(a.targetEndDate).getTime();
      } else if (sortBy === 'createdAt_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'clientName_asc') {
        return a.clientName.localeCompare(b.clientName);
      }
      return 0;
    });
  }, [items, filterStatus, filterMember, filterTimeframe, searchQuery, sortBy, currentUserName, user, nowMs]);

  // Counts for KPI Bar
  const runningItems = items.filter(i => i.status === 'running');
  const deliveredItems = items.filter(i => i.status === 'delivered');
  const urgentCount = runningItems.filter(i => {
    const target = new Date(i.targetEndDate).getTime();
    const diff = (target - nowMs) / (1000 * 60 * 60);
    return diff >= 0 && diff <= 48;
  }).length;
  const overdueCount = runningItems.filter(i => {
    const target = new Date(i.targetEndDate).getTime();
    return (target - nowMs) <= 0;
  }).length;

  const isFilterActive = filterStatus !== 'all' || filterMember !== 'all' || filterTimeframe !== 'all' || searchQuery !== '' || sortBy !== 'targetEndDate_asc';

  return (
    <div className="space-y-6 pb-12 text-gray-100">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-gray-900 via-gray-900/90 to-purple-950/40 border border-glass-border p-6 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
            <Clock className="w-8 h-8 text-purple-400 glow-purple shrink-0" />
            Project Timeline Tracker
          </h1>
          <p className="text-gray-400 text-xs md:text-sm font-medium mt-1 flex items-center gap-2">
            <span>Real-time countdown dashboard for project deliverables & assigned team milestones.</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-purple-300 font-bold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3 text-purple-400" /> Auto-Save Active
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={handleDownloadPNG}
            className="px-4 py-2.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-glass-border rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md hover:shadow-purple-500/10"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Export Table PNG</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Project</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar (Interactive Clickable Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div 
          onClick={() => setFilterStatus('all')}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
            filterStatus === 'all' 
              ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-500/10' 
              : 'bg-gray-900/80 border-glass-border hover:border-gray-700'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{items.length}</div>
            <div className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">Total Timelines</div>
          </div>
        </div>

        <div 
          onClick={() => setFilterStatus('running')}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
            filterStatus === 'running' 
              ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-500/10' 
              : 'bg-gray-900/80 border-glass-border hover:border-gray-700'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-blue-400">{runningItems.length}</div>
            <div className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">Running</div>
          </div>
        </div>

        <div 
          onClick={() => setFilterStatus('urgent')}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
            filterStatus === 'urgent' 
              ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-500/10' 
              : 'bg-gray-900/80 border-glass-border hover:border-gray-700'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-amber-400">{urgentCount}</div>
            <div className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">Urgent (&lt;=48h)</div>
          </div>
        </div>

        <div 
          onClick={() => setFilterStatus('overdue')}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
            filterStatus === 'overdue' 
              ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-500/10' 
              : 'bg-gray-900/80 border-glass-border hover:border-gray-700'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-red-400">{overdueCount}</div>
            <div className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">Overdue</div>
          </div>
        </div>

        <div 
          onClick={() => setFilterStatus('delivered')}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
            filterStatus === 'delivered' 
              ? 'bg-green-950/40 border-green-500/60 shadow-lg shadow-green-500/10' 
              : 'bg-gray-900/80 border-glass-border hover:border-gray-700'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-green-400">{deliveredItems.length}</div>
            <div className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">Delivered</div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Toolbar & Saved Presets */}
      <div className="bg-gray-900/90 border border-glass-border p-4 rounded-2xl space-y-4 shadow-xl">
        {/* Top Control Bar: Status Tabs, Search, View Switcher */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap bg-black/50 border border-glass-border p-1 rounded-xl">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'all' 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilterStatus('running')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'running' 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Running ({runningItems.length})</span>
            </button>
            <button
              onClick={() => setFilterStatus('urgent')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'urgent' 
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' 
                  : 'text-gray-400 hover:text-amber-300'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Urgent ({urgentCount})</span>
            </button>
            <button
              onClick={() => setFilterStatus('overdue')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'overdue' 
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
                  : 'text-gray-400 hover:text-red-300'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Overdue ({overdueCount})</span>
            </button>
            <button
              onClick={() => setFilterStatus('delivered')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'delivered' 
                  ? 'bg-green-600 text-white shadow-md shadow-green-600/30' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Delivered ({deliveredItems.length})</span>
            </button>
          </div>

          {/* Search & View Mode Switcher */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search project name, member, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-black/60 border border-glass-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex bg-black/50 border border-glass-border p-1 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'card' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Filter Controls: Member Dropdown, Timeframe, Sort, Save Preset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 border-t border-white/5 pt-3">
          {/* Member Filter Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
              <User className="w-3 h-3 text-purple-400" /> Assigned Member:
            </label>
            <select
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
              className="w-full px-3 py-1.5 bg-black/60 border border-glass-border rounded-xl text-xs text-purple-300 font-medium focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="all">All Members</option>
              {currentUserName && <option value="my_assigned">👤 My Assigned Projects</option>}
              {uniqueMembers.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Timeframe Filter Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-400" /> Deadline Timeframe:
            </label>
            <select
              value={filterTimeframe}
              onChange={(e) => setFilterTimeframe(e.target.value)}
              className="w-full px-3 py-1.5 bg-black/60 border border-glass-border rounded-xl text-xs text-blue-300 font-medium focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="all">All Timeframes</option>
              <option value="overdue">⚠️ Overdue Only</option>
              <option value="today">📅 Ending Today</option>
              <option value="next48h">🔥 Next 48 Hours</option>
              <option value="thisWeek">📆 Next 7 Days</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-amber-400" /> Sort By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-1.5 bg-black/60 border border-glass-border rounded-xl text-xs text-amber-300 font-medium focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="targetEndDate_asc">Ending Date: Soonest First</option>
              <option value="targetEndDate_desc">Ending Date: Latest First</option>
              <option value="createdAt_desc">Date Created: Newest First</option>
              <option value="clientName_asc">Project Name: A to Z</option>
            </select>
          </div>

          {/* Save Filter & Reset Actions */}
          <div className="space-y-1 flex flex-col justify-end">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSavePresetModalOpen(true)}
                className="flex-1 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Save current active filter settings as a preset"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save Preset</span>
              </button>

              {isFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-glass-border rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Reset all filters to default"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Saved Filter Presets Chips */}
        {savedPresets.length > 0 && (
          <div className="flex items-center gap-2 border-t border-white/5 pt-3 overflow-x-auto pb-1">
            <span className="text-[10px] font-bold uppercase text-gray-400 shrink-0 flex items-center gap-1">
              <Bookmark className="w-3 h-3 text-purple-400" /> Saved Presets:
            </span>
            {savedPresets.map(preset => {
              const isActive = activePresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                    isActive 
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30' 
                      : 'bg-black/40 text-gray-300 border-glass-border hover:border-purple-500/40 hover:text-white'
                  }`}
                >
                  <span>{preset.name}</span>
                  <button
                    onClick={(e) => handleDeletePreset(preset.id, e)}
                    className="text-gray-400 hover:text-red-400 p-0.5 rounded"
                    title="Delete preset"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-16 text-center text-gray-400 flex items-center justify-center gap-3 bg-gray-900/60 border border-glass-border rounded-2xl">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
          <span className="font-semibold text-sm">Loading project timelines...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 text-center bg-gray-900/80 border border-glass-border rounded-2xl space-y-4 shadow-xl">
          <Clock className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-black text-white uppercase tracking-wider">No matching project timelines found</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            {isFilterActive 
              ? 'Try adjusting or resetting your active filter options above.' 
              : 'Click "Add New Project" to create your first project deadline timeline.'}
          </p>
          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Order Tracker-Style Table View */
        <div ref={tableRef} className="bg-gray-900 border border-glass-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300 border-collapse">
              <thead>
                <tr className="bg-black/60 border-b border-glass-border text-gray-400 font-black uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Project Name</th>
                  <th className="py-3.5 px-4">Assigned Member</th>
                  <th className="py-3.5 px-4">Target Ending Date & Time</th>
                  <th className="py-3.5 px-4">Live Countdown Timer</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filteredItems.map((item) => {
                  const endDateObj = new Date(item.targetEndDate);
                  const formattedEndDate = endDateObj.toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  });

                  const diffHours = (endDateObj.getTime() - nowMs) / (1000 * 60 * 60);

                  // Row background styling based on urgency
                  let rowBg = 'hover:bg-black/20';
                  if (item.status === 'running') {
                    if (diffHours <= 0) {
                      rowBg = 'bg-red-500/10 hover:bg-red-500/15 border-l-4 border-l-red-500';
                    } else if (diffHours <= 24) {
                      rowBg = 'bg-red-500/5 hover:bg-red-500/10 border-l-4 border-l-red-400';
                    } else if (diffHours <= 48) {
                      rowBg = 'bg-amber-500/5 hover:bg-amber-500/10 border-l-4 border-l-amber-500';
                    }
                  }

                  // Requirement 3: Fallback display for Assigned Member
                  const displayMember = item.memberName || (item.createdBy ? (item.createdBy.includes('@') ? item.createdBy.split('@')[0] : item.createdBy) : 'Team Member');

                  return (
                    <tr key={item._id} className={`transition-colors ${rowBg}`}>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.status === 'running' ? (
                          <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            Running
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit">
                            <Check className="w-3 h-3" /> Delivered
                          </span>
                        )}
                      </td>

                      {/* Requirement 1: Project Name display */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-black text-white text-sm">
                        {item.clientName}
                      </td>

                      {/* Requirement 3: Display Assigned Member clearly */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/50 border border-glass-border rounded-xl font-bold text-purple-300 shadow-inner">
                          <User className="w-3.5 h-3.5 text-purple-400" />
                          {displayMember}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-gray-300">
                        {formattedEndDate}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.status === 'running' ? (
                          <LiveCountdownText targetEndDate={item.targetEndDate} />
                        ) : (
                          <span className="text-[11px] text-gray-400 font-mono italic">
                            Completed at {item.deliveredAt ? new Date(item.deliveredAt).toLocaleTimeString() : 'N/A'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-gray-400 italic">
                        {item.notes || '—'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-2">
                        {item.status === 'running' ? (
                          canUserEditItem(item) ? (
                            <button
                              onClick={() => handleStatusChange(item, 'delivered')}
                              className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-sm shadow-green-600/20"
                            >
                              Mark Delivered
                            </button>
                          ) : (
                            <span
                              onClick={() => toast.error('🔒 Access Denied: You can only mark delivered projects created by or assigned to you.')}
                              className="px-2.5 py-1 bg-gray-800 text-gray-500 rounded-lg text-[10px] font-bold cursor-not-allowed border border-white/5 inline-block"
                              title="Only creator, assignee or admin can mark delivered"
                            >
                              🔒 Mark Delivered
                            </span>
                          )
                        ) : isAdmin ? (
                          <button
                            onClick={() => handleStatusChange(item, 'running')}
                            className="px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-[11px] font-bold rounded-lg border border-purple-500/40 transition-colors cursor-pointer"
                          >
                            Reopen
                          </button>
                        ) : (
                          <span
                            onClick={() => toast.error('🔒 Only Admins can reopen delivered projects.')}
                            className="px-2.5 py-1 bg-gray-800 text-gray-500 rounded-lg text-[10px] font-bold cursor-not-allowed border border-white/5 inline-block"
                            title="Only Admins can reopen delivered projects"
                          >
                            🔒 Reopen (Admin Only)
                          </span>
                        )}

                        {canUserEditItem(item) ? (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-black/40 rounded-lg transition-colors cursor-pointer"
                              title="Edit Timeline"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Delete Timeline"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="p-1 text-gray-600 text-[11px] cursor-not-allowed" title="🔒 Only creator or admin can edit/delete">
                            🔒 Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const formattedEndDate = new Date(item.targetEndDate).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short'
            });

            const displayMember = item.memberName || (item.createdBy ? (item.createdBy.includes('@') ? item.createdBy.split('@')[0] : item.createdBy) : 'Team Member');

            return (
              <div 
                key={item._id}
                className={`bg-gray-900 border rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden transition-all hover:border-purple-500/40 ${
                  item.status === 'delivered' ? 'border-green-500/30' : 'border-glass-border'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h3 className="text-base font-extrabold text-white">{item.clientName}</h3>
                    <div className="flex items-center gap-1">
                      {canUserEditItem(item) ? (
                        <>
                          <button onClick={() => handleOpenEditModal(item)} className="p-1 text-gray-400 hover:text-white" title="Edit Timeline"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteItem(item)} className="p-1 text-gray-400 hover:text-red-400" title="Delete Timeline"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-600 cursor-not-allowed" title="🔒 Only creator or admin can edit/delete">🔒 Locked</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-black/40 border border-glass-border rounded-xl">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Assigned Member</span>
                      <span className="font-black text-purple-300 block truncate">{displayMember}</span>
                    </div>
                    <div className="p-2 bg-black/40 border border-glass-border rounded-xl">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Status</span>
                      <span className={`font-bold block ${item.status === 'running' ? 'text-purple-400' : 'text-green-400'}`}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {item.notes && <div className="p-2.5 bg-black/20 text-xs text-gray-400 italic rounded-xl border border-white/5">"{item.notes}"</div>}

                  <div className="text-[11px] text-gray-400 font-mono">Target: {formattedEndDate}</div>

                  {item.status === 'running' ? (
                    <LiveCountdownText targetEndDate={item.targetEndDate} />
                  ) : (
                    <div className="p-2 bg-green-500/15 text-green-400 text-xs font-bold rounded-xl text-center border border-green-500/20">
                      Completed & Delivered
                    </div>
                  )}
                </div>

                {item.status === 'running' ? (
                  canUserEditItem(item) ? (
                    <button
                      onClick={() => handleStatusChange(item, 'delivered')}
                      className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs uppercase rounded-xl cursor-pointer shadow-md shadow-green-600/20"
                    >
                      Mark Delivered
                    </button>
                  ) : (
                    <button
                      onClick={() => toast.error('🔒 Access Denied: You can only mark delivered projects created by or assigned to you.')}
                      className="w-full py-2 bg-gray-800 text-gray-500 font-bold text-xs uppercase rounded-xl border border-white/5 cursor-not-allowed"
                      title="Only creator, assignee or admin can mark delivered"
                    >
                      🔒 Mark Delivered
                    </button>
                  )
                ) : isAdmin ? (
                  <button
                    onClick={() => handleStatusChange(item, 'running')}
                    className="w-full py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 font-bold text-xs uppercase rounded-xl border border-purple-500/40 cursor-pointer"
                  >
                    Reopen
                  </button>
                ) : (
                  <button
                    onClick={() => toast.error('🔒 Only Admins can reopen delivered projects.')}
                    className="w-full py-2 bg-gray-800 text-gray-500 font-bold text-xs uppercase rounded-xl border border-white/5 cursor-not-allowed"
                    title="Only Admins can reopen delivered projects"
                  >
                    🔒 Reopen (Admin Only)
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Requirement 1 & 2: Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-purple-500/40 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                {editingItem ? 'Edit Project Timeline' : 'Add New Project Timeline'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-black/30 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Requirement 1: Label changed from 'Client Name' to 'Project Name' with new placeholder */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-300 block">
                    Project Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. E-Commerce Redesign (apas01)"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-glass-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Requirement 2: Assigned Member with Auto-Filled Name & Dropdown Suggestions */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-300 block">
                    Assigned Member <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="member-suggestions"
                    placeholder="Enter member name..."
                    value={formMemberName}
                    onChange={(e) => setFormMemberName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-glass-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                  <datalist id="member-suggestions">
                    {uniqueMembers.map(name => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                  <p className="text-[10px] text-gray-400 italic mt-0.5">
                    Auto-filled with your name ({currentUserName || 'User'}). You can choose or type another name.
                  </p>
                </div>
              </div>

              {/* Quick Preset Deadlines */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-300">Quick Deadline Presets:</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => applyPresetDays(1)} className="px-2.5 py-1 bg-black/40 hover:bg-purple-600/30 border border-glass-border text-gray-300 hover:text-purple-300 rounded-lg transition-colors cursor-pointer">+1 Day</button>
                  <button type="button" onClick={() => applyPresetDays(2)} className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg transition-colors cursor-pointer">+2 Days (48h)</button>
                  <button type="button" onClick={() => applyPresetDays(3)} className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg transition-colors cursor-pointer">+3 Days (72h)</button>
                  <button type="button" onClick={() => applyPresetDays(5)} className="px-2.5 py-1 bg-black/40 hover:bg-purple-600/30 border border-glass-border text-gray-300 hover:text-purple-300 rounded-lg transition-colors cursor-pointer">+5 Days</button>
                  <button type="button" onClick={() => applyPresetDays(7)} className="px-2.5 py-1 bg-black/40 hover:bg-purple-600/30 border border-glass-border text-gray-300 hover:text-purple-300 rounded-lg transition-colors cursor-pointer">+7 Days</button>
                  <button type="button" onClick={() => applyPresetDays(14)} className="px-2.5 py-1 bg-black/40 hover:bg-purple-600/30 border border-glass-border text-gray-300 hover:text-purple-300 rounded-lg transition-colors cursor-pointer">+14 Days</button>
                </div>
              </div>

              {/* Ending Date & Time Selector */}
              <div className="p-3.5 bg-black/40 border border-glass-border rounded-xl space-y-3">
                <label className="font-bold text-gray-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-400" /> Ending Date & Time Selection <span className="text-red-400">*</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block mb-1">Calendar Date (Click to Open):</span>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onClick={(e) => { try { (e.target as any).showPicker?.(); } catch (err) {} }}
                      onFocus={(e) => { try { (e.target as any).showPicker?.(); } catch (err) {} }}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 bg-black/60 border border-glass-border rounded-xl text-purple-300 font-mono focus:outline-none focus:border-purple-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block mb-1">Time (Hour : Minute AM/PM):</span>
                    <div className="flex gap-1.5 items-center">
                      <select
                        value={formHour}
                        onChange={(e) => setFormHour(e.target.value)}
                        className="px-2.5 py-2 bg-black/60 border border-glass-border rounded-xl text-white font-mono focus:outline-none"
                      >
                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span className="text-gray-400 font-bold">:</span>
                      <select
                        value={formMinute}
                        onChange={(e) => setFormMinute(e.target.value)}
                        className="px-2.5 py-2 bg-black/60 border border-glass-border rounded-xl text-white font-mono focus:outline-none"
                      >
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setFormAmpm(formAmpm === 'AM' ? 'PM' : 'AM')}
                        className="px-3 py-2 bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold rounded-xl hover:bg-purple-600/50 cursor-pointer"
                      >
                        {formAmpm}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300 block">Special Notes / Instructions (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional instructions or notes..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-black/60 border border-glass-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 hover:text-white rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Timeline' : 'Create Timeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Filter Preset Modal */}
      {isSavePresetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-purple-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-left relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-purple-400" /> Save Active Filter Preset
              </h3>
              <button 
                onClick={() => setIsSavePresetModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-black/30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Save your active filter parameters (Status, Member, Timeframe, Sort Order, Search Query) for 1-click loading.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 block">Preset Name:</label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. My Urgent Projects, Delivered This Week..."
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFilterPreset(); }}
                className="w-full px-3.5 py-2.5 bg-black/60 border border-glass-border rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsSavePresetModalOpen(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFilterPreset}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Preset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 text-center relative">
            <button
              onClick={() => setDeletingId(null)}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-black/30 absolute right-4 top-4 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-red-500/20 border border-red-500/40 text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Confirm Delete Timeline</h3>
              <p className="text-xs text-gray-400">
                Are you sure you want to delete this project timeline? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
