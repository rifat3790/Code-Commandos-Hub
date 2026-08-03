'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  User, 
  Briefcase, 
  Calendar, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Check,
  X,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

interface ITimeline {
  _id: string;
  clientName: string;
  memberName: string;
  projectTitle: string;
  orderId?: string;
  targetEndDate: string;
  status: 'running' | 'delivered';
  deliveredAt?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
}

function LiveCountdown({ targetEndDate }: { targetEndDate: string }) {
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
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isOverdue: true,
          totalHoursLeft: 0
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      const totalHoursLeft = Math.floor(difference / (1000 * 60 * 60));

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isOverdue: false,
        totalHoursLeft
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetEndDate]);

  if (timeLeft.isOverdue) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 font-black animate-pulse">
        <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
        <span className="text-xs uppercase tracking-wider">OVERDUE / TIME EXPIRED</span>
      </div>
    );
  }

  // Theme styling based on urgency
  let themeColor = 'from-purple-500/20 to-blue-500/20 border-purple-500/30 text-purple-300';
  let badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  
  if (timeLeft.totalHoursLeft <= 6) {
    themeColor = 'from-red-500/20 to-orange-500/20 border-red-500/40 text-red-300 animate-pulse';
    badgeColor = 'bg-red-500/20 text-red-400 border-red-500/40';
  } else if (timeLeft.totalHoursLeft <= 24) {
    themeColor = 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  }

  return (
    <div className={`grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-gradient-to-r border ${themeColor}`}>
      <div className="bg-black/40 border border-white/5 rounded-lg py-1.5 px-1">
        <div className="text-lg md:text-xl font-black font-mono leading-none">{String(timeLeft.days).padStart(2, '0')}</div>
        <div className="text-[9px] uppercase font-bold text-gray-400 mt-1">Days</div>
      </div>
      <div className="bg-black/40 border border-white/5 rounded-lg py-1.5 px-1">
        <div className="text-lg md:text-xl font-black font-mono leading-none">{String(timeLeft.hours).padStart(2, '0')}</div>
        <div className="text-[9px] uppercase font-bold text-gray-400 mt-1">Hours</div>
      </div>
      <div className="bg-black/40 border border-white/5 rounded-lg py-1.5 px-1">
        <div className="text-lg md:text-xl font-black font-mono leading-none">{String(timeLeft.minutes).padStart(2, '0')}</div>
        <div className="text-[9px] uppercase font-bold text-gray-400 mt-1">Mins</div>
      </div>
      <div className="bg-black/40 border border-white/5 rounded-lg py-1.5 px-1">
        <div className="text-lg md:text-xl font-black font-mono leading-none">{String(timeLeft.seconds).padStart(2, '0')}</div>
        <div className="text-[9px] uppercase font-bold text-gray-400 mt-1">Secs</div>
      </div>
    </div>
  );
}

export default function TimelineDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<ITimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'running' | 'delivered'>('running');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ITimeline | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    clientName: '',
    memberName: '',
    projectTitle: '',
    orderId: '',
    targetEndDate: '',
    notes: ''
  });

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

  const handleOpenAddModal = () => {
    setEditingItem(null);

    // Default to tomorrow 6 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);

    const formattedDefaultDate = tomorrow.toISOString().slice(0, 16);

    setFormData({
      clientName: '',
      memberName: '',
      projectTitle: '',
      orderId: '',
      targetEndDate: formattedDefaultDate,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ITimeline) => {
    setEditingItem(item);
    const dateStr = new Date(item.targetEndDate).toISOString().slice(0, 16);
    setFormData({
      clientName: item.clientName,
      memberName: item.memberName,
      projectTitle: item.projectTitle,
      orderId: item.orderId || '',
      targetEndDate: dateStr,
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.memberName || !formData.projectTitle || !formData.targetEndDate) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        // Update
        const res = await fetch('/api/timeline', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingItem._id,
            ...formData
          })
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
        // Create
        const res = await fetch('/api/timeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            createdBy: user?.email || user?.displayName || 'User'
          })
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

  const filteredItems = items.filter(item => {
    const matchesTab = item.status === activeTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      item.clientName.toLowerCase().includes(q) ||
      item.memberName.toLowerCase().includes(q) ||
      item.projectTitle.toLowerCase().includes(q) ||
      (item.orderId && item.orderId.toLowerCase().includes(q));
    return matchesTab && matchesSearch;
  });

  const runningCount = items.filter(i => i.status === 'running').length;
  const deliveredCount = items.filter(i => i.status === 'delivered').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900 border border-glass-border p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white uppercase flex items-center gap-3">
            <Clock className="w-8 h-8 text-purple-400 glow-purple" />
            Project Timeline Tracker
          </h1>
          <p className="text-gray-400 text-xs md:text-sm font-medium mt-1">
            Real-time live countdown tracking for client projects & team member deliverables.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Timeline</span>
        </button>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {/* Status Tabs */}
        <div className="flex bg-gray-900 border border-glass-border p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('running')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'running' 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' 
                : 'text-gray-400 hover:text-white hover:bg-black/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Running ({runningCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('delivered')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'delivered' 
                ? 'bg-green-600 text-white shadow-md shadow-green-600/20' 
                : 'text-gray-400 hover:text-white hover:bg-black/30'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered ({deliveredCount})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by client, member, or project title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-glass-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Grid of Timeline Cards */}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const formattedEndDate = new Date(item.targetEndDate).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short'
            });

            return (
              <div 
                key={item._id}
                className={`bg-gray-900/90 border rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all hover:border-purple-500/40 relative overflow-hidden ${
                  item.status === 'delivered' ? 'border-green-500/30' : 'border-glass-border'
                }`}
              >
                {/* Background Ambient Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-3">
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider block">
                        {item.orderId ? `Order #${item.orderId}` : 'Project Timeline'}
                      </span>
                      <h3 className="text-base font-extrabold text-white leading-snug">{item.projectTitle}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-black/40 rounded-lg transition-colors cursor-pointer"
                        title="Edit Timeline"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item._id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Timeline"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Client & Member Badges */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-black/40 border border-glass-border rounded-xl space-y-0.5">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Client Name</span>
                      <span className="font-extrabold text-white truncate block">{item.clientName}</span>
                    </div>

                    <div className="p-2.5 bg-black/40 border border-glass-border rounded-xl space-y-0.5">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Assigned Member</span>
                      <span className="font-extrabold text-purple-300 truncate block">{item.memberName}</span>
                    </div>
                  </div>

                  {/* Notes if present */}
                  {item.notes && (
                    <div className="p-2.5 bg-black/20 border border-glass-border rounded-xl text-xs text-gray-300 italic">
                      "{item.notes}"
                    </div>
                  )}

                  {/* Ending Date info */}
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" /> Target Deadline:
                    </span>
                    <span className="font-bold text-white font-mono">{formattedEndDate}</span>
                  </div>

                  {/* Live Countdown Display (if Running) */}
                  {item.status === 'running' ? (
                    <LiveCountdown targetEndDate={item.targetEndDate} />
                  ) : (
                    <div className="p-3 bg-green-500/15 border border-green-500/30 rounded-xl text-center space-y-1">
                      <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-xs uppercase">
                        <CheckCircle2 className="w-4 h-4" /> Delivered & Completed
                      </div>
                      {item.deliveredAt && (
                        <p className="text-[10px] text-gray-400 font-mono">
                          Delivered at: {new Date(item.deliveredAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Action Button */}
                <div className="pt-2">
                  {item.status === 'running' ? (
                    <button
                      onClick={() => handleStatusChange(item, 'delivered')}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-green-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark as Delivered</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(item, 'running')}
                      className="w-full py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reopen / Move to Running</span>
                    </button>
                  )}
                </div>
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
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-black/30"
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
                    placeholder="e.g. John Doe"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-black/50 border border-glass-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-300">Assigned Member <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Refayet"
                    value={formData.memberName}
                    onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-black/50 border border-glass-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-300">Project Title <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shopify Payment Setup"
                    value={formData.projectTitle}
                    onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                    className="w-full px-3 py-2.5 bg-black/50 border border-glass-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-300">Order ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1024"
                    value={formData.orderId}
                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-black/50 border border-glass-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Ending Date & Time <span className="text-red-400">*</span></label>
                <input
                  type="datetime-local"
                  required
                  value={formData.targetEndDate}
                  onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-glass-border rounded-xl text-purple-300 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Special Notes (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Additional project notes or instructions..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black/50 border border-glass-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
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
