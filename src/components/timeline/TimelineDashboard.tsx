'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Check
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-lg text-xs font-black animate-pulse">
        <AlertCircle className="w-3.5 h-3.5" /> OVERDUE
      </span>
    );
  }

  // Color Status based on user rules:
  // > 48h: Soft Cyan / Purple theme
  // <= 48h (2 days): Yellow / Amber
  // <= 24h: Red / Danger
  let badgeStyle = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
  if (timeLeft.totalHoursLeft <= 24) {
    badgeStyle = 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse font-black';
  } else if (timeLeft.totalHoursLeft <= 48) {
    badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
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
  const [activeTab, setActiveTab] = useState<'running' | 'delivered'>('running');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchQuery, setSearchQuery] = useState('');

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
    setFormMemberName('');
    setFormNotes('');
    applyPresetDays(2); // Default 2 days (+48h)
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ITimeline) => {
    setEditingItem(item);
    setFormClientName(item.clientName);
    setFormMemberName(item.memberName);
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
      toast.error('Client Name, Assigned Member, and End Date are required.');
      return;
    }

    // Construct full target ISO Date
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
          toast.success('Timeline updated successfully!');
          setIsModalOpen(false);
          fetchItems();
        } else {
          toast.error(data.error || 'Failed to update timeline');
        }
      } else {
        const res = await fetch('/api/timeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, createdBy: user?.email || 'User' })
        });
        const data = await res.json();
        if (data.success) {
          toast.success('New timeline added successfully!');
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

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this timeline item?')) return;
    try {
      const res = await fetch(`/api/timeline?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Timeline deleted');
        fetchItems();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (err: any) {
      toast.error('Failed to delete timeline');
    }
  };

  const handleDownloadPNG = async () => {
    if (tableRef.current) {
      try {
        const dataUrl = await toPng(tableRef.current, { backgroundColor: '#111827' });
        const link = document.createElement('a');
        link.download = 'timeline-tracker.png';
        link.href = dataUrl;
        link.click();
        toast.success("Downloaded Table PNG");
      } catch (err) {
        toast.error("Failed to download image");
      }
    }
  };

  const filteredItems = items.filter(item => {
    const matchesTab = item.status === activeTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      item.clientName.toLowerCase().includes(q) ||
      item.memberName.toLowerCase().includes(q) ||
      (item.notes && item.notes.toLowerCase().includes(q));
    return matchesTab && matchesSearch;
  });

  const runningItems = items.filter(i => i.status === 'running');
  const deliveredItems = items.filter(i => i.status === 'delivered');

  const nowMs = new Date().getTime();
  const urgentCount = runningItems.filter(i => {
    const target = new Date(i.targetEndDate).getTime();
    return (target - nowMs) / (1000 * 60 * 60) <= 48;
  }).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900 border border-glass-border p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white uppercase flex items-center gap-3">
            <Clock className="w-8 h-8 text-purple-400 glow-purple" />
            Project Timeline Tracker
          </h1>
          <p className="text-gray-400 text-xs md:text-sm font-medium mt-1">
            Order Tracker-style live countdown table for client deadlines & team member deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPNG}
            className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-glass-border rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Table PNG</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Timeline</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-glass-border p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{runningItems.length}</div>
            <div className="text-[11px] text-gray-400 uppercase font-bold">Running Timelines</div>
          </div>
        </div>

        <div className="bg-gray-900 border border-glass-border p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-amber-400">{urgentCount}</div>
            <div className="text-[11px] text-gray-400 uppercase font-bold">Urgent (&lt;= 48h)</div>
          </div>
        </div>

        <div className="bg-gray-900 border border-glass-border p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-green-400">{deliveredItems.length}</div>
            <div className="text-[11px] text-gray-400 uppercase font-bold">Delivered Projects</div>
          </div>
        </div>

        <div className="bg-gray-900 border border-glass-border p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-blue-400">
              {items.length > 0 ? `${Math.round((deliveredItems.length / items.length) * 100)}%` : '100%'}
            </div>
            <div className="text-[11px] text-gray-400 uppercase font-bold">Completion Rate</div>
          </div>
        </div>
      </div>

      {/* Tabs, Search & View Mode Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {/* Status Tabs */}
        <div className="flex bg-gray-900 border border-glass-border p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('running')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'running' 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' 
                : 'text-gray-400 hover:text-white hover:bg-black/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Running ({runningItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('delivered')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'delivered' 
                ? 'bg-green-600 text-white shadow-md shadow-green-600/20' 
                : 'text-gray-400 hover:text-white hover:bg-black/30'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered ({deliveredItems.length})</span>
          </button>
        </div>

        {/* View Mode Switcher & Search */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by client or member name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-glass-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex bg-gray-900 border border-glass-border p-1 rounded-xl shrink-0">
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

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 flex items-center justify-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
          <span>Loading project timelines...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-gray-900 border border-glass-border rounded-2xl space-y-3">
          <Clock className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No {activeTab} timelines found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {activeTab === 'running' 
              ? 'Click "Add New Timeline" to start tracking live project countdowns.' 
              : 'Delivered projects will appear here once marked as delivered.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Order Tracker-Style Table View */
        <div ref={tableRef} className="bg-gray-900 border border-glass-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300 border-collapse">
              <thead>
                <tr className="bg-black/50 border-b border-glass-border text-gray-400 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Assigned Member</th>
                  <th className="py-3 px-4">Target Ending Date & Time</th>
                  <th className="py-3 px-4">Live Countdown Timer</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
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
                    if (diffHours <= 0 || diffHours <= 24) {
                      rowBg = 'bg-red-500/5 hover:bg-red-500/10 border-l-2 border-l-red-500';
                    } else if (diffHours <= 48) {
                      rowBg = 'bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-l-amber-500';
                    }
                  }

                  return (
                    <tr key={item._id} className={`transition-colors ${rowBg}`}>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.status === 'running' ? (
                          <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            Running
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                            <Check className="w-3 h-3" /> Delivered
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-extrabold text-white">
                        {item.clientName}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/40 border border-glass-border rounded-lg font-bold text-purple-300">
                          <User className="w-3 h-3 text-purple-400" />
                          {item.memberName}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-gray-300">
                        {formattedEndDate}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.status === 'running' ? (
                          <LiveCountdownText targetEndDate={item.targetEndDate} />
                        ) : (
                          <span className="text-[11px] text-gray-400 font-mono italic">
                            Completed at {item.deliveredAt ? new Date(item.deliveredAt).toLocaleTimeString() : 'N/A'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-gray-400 italic">
                        {item.notes || '—'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right space-x-2">
                        {item.status === 'running' ? (
                          <button
                            onClick={() => handleStatusChange(item, 'delivered')}
                            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Mark Delivered
                          </button>
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

                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-black/40 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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

            return (
              <div 
                key={item._id}
                className={`bg-gray-900 border rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden ${
                  item.status === 'delivered' ? 'border-green-500/30' : 'border-glass-border'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h3 className="text-base font-extrabold text-white">{item.clientName}</h3>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleOpenEditModal(item)} className="p-1 text-gray-400 hover:text-white"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteItem(item._id)} className="p-1 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-black/40 border border-glass-border rounded-xl">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Assigned Member</span>
                      <span className="font-extrabold text-purple-300 block">{item.memberName}</span>
                    </div>
                    <div className="p-2 bg-black/40 border border-glass-border rounded-xl">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Status</span>
                      <span className={`font-bold block ${item.status === 'running' ? 'text-purple-400' : 'text-green-400'}`}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {item.notes && <div className="p-2.5 bg-black/20 text-xs text-gray-400 italic rounded-xl">"{item.notes}"</div>}

                  <div className="text-[11px] text-gray-400 font-mono">Target: {formattedEndDate}</div>

                  {item.status === 'running' ? (
                    <LiveCountdownText targetEndDate={item.targetEndDate} />
                  ) : (
                    <div className="p-2 bg-green-500/15 text-green-400 text-xs font-bold rounded-xl text-center">
                      Completed & Delivered
                    </div>
                  )}
                </div>

                {item.status === 'running' ? (
                  <button
                    onClick={() => handleStatusChange(item, 'delivered')}
                    className="w-full py-2 bg-green-600 text-white font-bold text-xs uppercase rounded-xl cursor-pointer"
                  >
                    Mark Delivered
                  </button>
                ) : isAdmin ? (
                  <button
                    onClick={() => handleStatusChange(item, 'running')}
                    className="w-full py-2 bg-purple-600/30 text-purple-300 font-bold text-xs uppercase rounded-xl border border-purple-500/40 cursor-pointer"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-purple-500/30 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-300">Client Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. apas01"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-glass-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-300">Assigned Member <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Refayet"
                    value={formMemberName}
                    onChange={(e) => setFormMemberName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-glass-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                  />
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
                <label className="font-bold text-gray-300">Special Notes / Instructions (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional instructions or notes..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-black/50 border border-glass-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
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
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Timeline' : 'Create Timeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
