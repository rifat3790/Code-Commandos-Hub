'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, Lock, Link as LinkIcon, Database, CheckCircle2, User as UserIcon, 
  ExternalLink, RefreshCw, Calendar, ChevronLeft, Filter, DollarSign, Download, TrendingUp, 
  Hash, Award, PlayCircle, Clock, Check, Sparkles, Copy, AlertCircle, Layers, ArrowUpRight, 
  Flame, Search, CheckSquare, Users, RotateCcw, ArrowRightLeft, ShieldCheck, Save, Bookmark
} from 'lucide-react';
import Papa from 'papaparse';

interface ProjectMonth {
  _id: string;
  firebaseUid: string;
  month: string;
  createdAt: string;
}

interface Project {
  _id: string;
  firebaseUid: string;
  month: string;
  projectName: string;
  value: string;
  profileName: string;
  clientName: string;
  storeUrl: string;
  password?: string;
  status?: 'running' | 'delivered';
  progress?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  notes?: string;
  deliveredAt?: string;
  orderId?: string;
  originalOrderValue?: string;
  personCount?: number;
  isSyncedWithTracker?: boolean;
  createdAt: string;
}

interface TrackerOrder {
  id: string;
  orderId: string;
  projectName: string;
  clientName: string;
  value: string;
  profileName: string;
  storeUrl: string;
  password?: string;
  status: string;
  assignTeam?: string;
  serviceLine?: string;
  team?: string;
  person?: string;
  deliveryDate?: string;
}

interface DbUser {
  _id: string;
  firebaseUid: string;
  name: string;
  email: string;
}

const parseValue = (valStr: string) => {
  if (!valStr) return 0;
  const parsed = parseFloat(valStr.replace(/[^0-9.-]+/g, ""));
  return isNaN(parsed) ? 0 : parsed;
};

const formatCurrency = (amount: number) => {
  if (Number.isInteger(amount)) {
    return `$${amount.toLocaleString()}`;
  }
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getStatusBadge = (status?: string) => {
  if (status === 'running') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        ⚡ Running
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      Delivered
    </span>
  );
};

const getPriorityBadge = (priority?: string) => {
  switch (priority) {
    case 'urgent':
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
          <Flame className="w-3 h-3 text-red-400 animate-bounce" /> Urgent
        </span>
      );
    case 'high':
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
          High
        </span>
      );
    case 'low':
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-normal bg-blue-500/20 text-blue-300 border border-blue-500/30">
          Low
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
          Medium
        </span>
      );
  }
};

const getDeadlineBadge = (deadline?: string, status?: string) => {
  if (!deadline || status === 'delivered') return null;
  
  const due = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return (
      <span className="text-xs font-bold text-red-400 flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
        <AlertCircle className="w-3 h-3" /> Overdue by {Math.abs(diffDays)}d
      </span>
    );
  } else if (diffDays === 0) {
    return (
      <span className="text-xs font-bold text-orange-400 flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30">
        <Clock className="w-3 h-3" /> Due Today!
      </span>
    );
  } else {
    return (
      <span className="text-xs font-medium text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
        <Clock className="w-3 h-3 text-cyan-400" /> {diffDays}d left
      </span>
    );
  }
};

export default function PersonalProjectsPage() {
  const { user, dbUser } = useAuth();
  const isAdminOrSuperAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'my-projects'>(isAdminOrSuperAdmin ? 'dashboard' : 'my-projects');

  if (!user) return null;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-brand-green" />
            PERSONAL PROJECTS
          </h1>
          <p className="text-gray-400 mt-1">
            Auto-sync from Order Tracker, split values by person, track running workload & delivered projects.
          </p>
        </div>

        {isAdminOrSuperAdmin && (
          <div className="flex p-1 bg-gray-900/80 backdrop-blur-md rounded-xl border border-glass-border">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'dashboard' 
                  ? 'bg-brand-green text-black shadow-lg glow-green' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Master Dashboard
            </button>
            <button
              onClick={() => setActiveTab('my-projects')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'my-projects' 
                  ? 'bg-brand-green text-black shadow-lg glow-green' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              My Projects
            </button>
          </div>
        )}
      </div>

      {isAdminOrSuperAdmin && activeTab === 'dashboard' ? (
        <AdminDashboard userUid={user.uid} />
      ) : (
        <UserWorkflow userUid={user.uid} />
      )}
    </div>
  );
}

// ==========================================
// ADMIN DASHBOARD COMPONENT
// ==========================================
function AdminDashboard({ userUid }: { userUid: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    projectName: '',
    value: '',
    profileName: '',
    clientName: '',
    storeUrl: '',
    password: '',
    status: 'delivered' as 'running' | 'delivered',
    progress: 100,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    deadline: '',
    notes: '',
    orderId: '',
    originalOrderValue: '',
    personCount: 1,
    isSyncedWithTracker: false,
    firebaseUid: '',
    month: ''
  });

  // Filters
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterUser, setFilterUser] = useState<string>('All');
  const [filterProfile, setFilterProfile] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Infinite Scroll State
  const [displayLimit, setDisplayLimit] = useState(50);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const resProj = await fetch('/api/personal-projects');
      const dataProj = await resProj.json();
      if (dataProj.success) setProjects(dataProj.projects);

      const resUsers = await fetch('/api/users/roles');
      const dataUsers = await resUsers.json();
      if (dataUsers.success) setUsers(dataUsers.users);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (uid: string) => {
    const u = users.find(u => u.firebaseUid === uid);
    return u?.name || u?.email || uid;
  };

  const uniqueMonths = Array.from(new Set(projects.map(p => p.month))).sort();
  const uniqueProfiles = Array.from(new Set(projects.map(p => p.profileName))).sort();
  const uidsWithProjects = Array.from(new Set(projects.map(p => p.firebaseUid)));
  const usersWithProjects = uidsWithProjects.map(uid => ({ uid, name: getUserName(uid) }));

  let filteredProjects = projects;
  if (filterMonth !== 'All') filteredProjects = filteredProjects.filter(p => p.month === filterMonth);
  if (filterUser !== 'All') filteredProjects = filteredProjects.filter(p => p.firebaseUid === filterUser);
  if (filterProfile !== 'All') filteredProjects = filteredProjects.filter(p => p.profileName === filterProfile);
  if (filterStatus !== 'All') filteredProjects = filteredProjects.filter(p => (p.status || 'delivered') === filterStatus);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredProjects = filteredProjects.filter(p => 
      p.projectName.toLowerCase().includes(q) ||
      p.clientName.toLowerCase().includes(q) ||
      p.profileName.toLowerCase().includes(q) ||
      p.storeUrl.toLowerCase().includes(q) ||
      (p.orderId && p.orderId.toLowerCase().includes(q))
    );
  }

  // Stats Calculations
  const totalValue = filteredProjects.reduce((acc, p) => acc + parseValue(p.value), 0);
  const deliveredProjects = filteredProjects.filter(p => (p.status || 'delivered') === 'delivered');
  const runningProjects = filteredProjects.filter(p => p.status === 'running');
  
  const deliveredValue = deliveredProjects.reduce((acc, p) => acc + parseValue(p.value), 0);
  const runningValue = runningProjects.reduce((acc, p) => acc + parseValue(p.value), 0);
  const totalProjectsCount = filteredProjects.length;

  const exportCSV = () => {
    if (filteredProjects.length === 0) return alert('No data to export!');
    
    const csvData = filteredProjects.map(p => ({
      User: getUserName(p.firebaseUid),
      Month: p.month,
      'Order ID': p.orderId || 'N/A',
      'Project Name': p.projectName,
      Status: p.status || 'delivered',
      Priority: p.priority || 'medium',
      Persons: p.personCount || 1,
      'Calculated Value': p.value,
      'Original Order Value': p.originalOrderValue || p.value,
      Profile: p.profileName,
      Client: p.clientName,
      'Store URL': p.storeUrl,
      Deadline: p.deadline || 'N/A',
      'Created At': new Date(p.createdAt).toLocaleDateString()
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Projects_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMarkAsDelivered = async (project: Project) => {
    try {
      const res = await fetch('/api/personal-projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: project._id,
          status: 'delivered',
          progress: 100,
          deliveredAt: new Date()
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🎉 "${project.projectName}" marked as Delivered!`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopySpecs = (project: Project) => {
    const specs = `📌 Project: ${project.projectName}
🆔 Order ID: ${project.orderId || 'N/A'}
👤 Client: ${project.clientName}
🌐 Store: ${project.storeUrl}
🔑 Password: ${project.password || 'N/A'}
💰 Value: ${project.value} ${project.personCount && project.personCount > 1 ? `(${project.personCount} Persons Split)` : ''}
⚡ Status: ${(project.status || 'delivered').toUpperCase()}`;

    navigator.clipboard.writeText(specs);
    showToast(`📋 Copied "${project.projectName}" specs!`);
  };

  const handleOpenModal = (project: Project) => {
    setEditingId(project._id);
    setFormData({
      projectName: project.projectName,
      value: project.value,
      profileName: project.profileName,
      clientName: project.clientName,
      storeUrl: project.storeUrl,
      password: project.password || '',
      status: project.status || 'delivered',
      progress: project.progress !== undefined ? project.progress : (project.status === 'running' ? 50 : 100),
      priority: project.priority || 'medium',
      deadline: project.deadline || '',
      notes: project.notes || '',
      orderId: project.orderId || '',
      originalOrderValue: project.originalOrderValue || project.value,
      personCount: project.personCount || 1,
      isSyncedWithTracker: !!project.isSyncedWithTracker,
      firebaseUid: project.firebaseUid,
      month: project.month
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = '/api/personal-projects';
      const body = { ...formData, _id: editingId };

      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchData();
        showToast('Updated project details');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`/api/personal-projects?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Project deleted');
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Reset display limit on filter change
  useEffect(() => {
    setDisplayLimit(50);
  }, [filterMonth, filterUser, filterProfile, filterStatus, searchQuery]);

  // Infinite Scroll Observer logic
  const lastElementRef = useCallback((node: HTMLTableRowElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && displayLimit < filteredProjects.length) {
        setDisplayLimit(prev => prev + 50);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, displayLimit, filteredProjects.length]);

  const displayedProjects = filteredProjects.slice(0, displayLimit);

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-6 right-6 z-50 bg-emerald-500 text-black font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-300">
            <Sparkles className="w-5 h-5 text-black" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-glass-border flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-brand-green" /> Search
          </label>
          <input
            type="text"
            placeholder="Search project, order ID, client, URL..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full glass-input px-3 py-2 text-sm"
          />
        </div>

        <div className="w-[140px]">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" /> Status
          </label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full glass-input px-3 py-2 text-sm appearance-none cursor-pointer bg-gray-900">
            <option value="All">All Statuses</option>
            <option value="running">⚡ Running</option>
            <option value="delivered">✅ Delivered</option>
          </select>
        </div>

        <div className="w-[140px]">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Month
          </label>
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full glass-input px-3 py-2 text-sm appearance-none cursor-pointer bg-gray-900">
            <option value="All">All Months</option>
            {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="w-[150px]">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5" /> User
          </label>
          <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="w-full glass-input px-3 py-2 text-sm appearance-none cursor-pointer bg-gray-900">
            <option value="All">All Users</option>
            {usersWithProjects.map(u => <option key={u.uid} value={u.uid}>{u.name}</option>)}
          </select>
        </div>

        <div className="w-[140px]">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Profile
          </label>
          <select value={filterProfile} onChange={(e) => setFilterProfile(e.target.value)} className="w-full glass-input px-3 py-2 text-sm appearance-none cursor-pointer bg-gray-900">
            <option value="All">All Profiles</option>
            {uniqueProfiles.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2.5 rounded-xl border border-glass-border bg-gray-900/50 text-gray-400 hover:text-white transition-colors h-[38px] flex items-center justify-center">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCSV} className="px-4 py-2 rounded-xl border border-glass-border bg-gray-900/50 text-brand-green hover:text-black hover:bg-brand-green-hover transition-colors h-[38px] flex items-center justify-center gap-2 font-medium text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Analytics Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
          </div>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Delivered Value ({deliveredProjects.length})
          </p>
          <p className="text-3xl font-black text-white">${deliveredValue.toLocaleString()}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock className="w-16 h-16 text-amber-400" />
          </div>
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Running Pipeline ({runningProjects.length})
          </p>
          <p className="text-3xl font-black text-white">${runningValue.toLocaleString()}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-glass-border relative overflow-hidden">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-blue-400" /> Grand Total Value
          </p>
          <p className="text-3xl font-black text-white">${totalValue.toLocaleString()}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-glass-border relative overflow-hidden">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-cyan-400" /> Total Count
          </p>
          <p className="text-3xl font-black text-white">{totalProjectsCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel p-1 rounded-2xl border border-glass-border">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-green"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Month</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Name</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Profile</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Value</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Store URL</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {displayedProjects.map((p, index) => {
                  const isLast = index === displayedProjects.length - 1;
                  const isRunning = p.status === 'running';

                  return (
                    <tr 
                      key={p._id} 
                      ref={isLast ? lastElementRef : null} 
                      className={`hover:bg-gray-800/40 transition-colors ${isRunning ? 'bg-amber-500/5' : ''}`}
                    >
                      <td className="p-3 text-sm">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(p.status)}
                          {p.isSyncedWithTracker && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300 font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20" title={`Synced Order #${p.orderId}`}>
                              <RotateCcw className="w-2.5 h-2.5 text-cyan-400" /> {p.orderId || 'Synced'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-300 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <UserIcon className="w-3 h-3 text-blue-400" />
                          </div>
                          {getUserName(p.firebaseUid)}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-400">{p.month}</td>
                      <td className="p-3 text-sm font-medium text-white">
                        <div className="flex items-center gap-2">
                          {p.projectName}
                          {getPriorityBadge(p.priority)}
                          {getDeadlineBadge(p.deadline, p.status)}
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        <span className="bg-brand-green/20 text-brand-green px-2 py-1 rounded-md border border-brand-green/30">
                          {p.profileName}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-400">{p.clientName}</td>
                      <td className="p-3 text-sm font-bold text-green-400">
                        <div className="flex flex-col">
                          <span>{p.value}</span>
                          {p.personCount && p.personCount > 1 && (
                            <span className="text-[10px] text-purple-300 font-normal">
                              ({p.personCount} Persons Split)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        <a href={p.storeUrl.startsWith('http') ? p.storeUrl : `https://${p.storeUrl}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Link
                        </a>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          {isRunning && (
                            <button
                              onClick={() => handleMarkAsDelivered(p)}
                              className="px-2.5 py-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-all flex items-center gap-1 shadow-md glow-green cursor-pointer"
                              title="Click to move project to Delivered list"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Delivered
                            </button>
                          )}
                          <button onClick={() => handleCopySpecs(p)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors" title="Copy project specs">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleOpenModal(p)} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(p._id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-md transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      No projects found matching the filters.
                    </td>
                  </tr>
                )}
                {/* Infinite scroll loading indicator */}
                {displayLimit < filteredProjects.length && (
                  <tr>
                    <td colSpan={9} className="p-4 text-center">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-brand-green"></div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-gray-900 border border-glass-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-glass-border">
                <h2 className="text-xl font-bold text-white">Edit User Project (Admin)</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as 'running' | 'delivered'})}
                      className="w-full glass-input px-3 py-2 text-sm bg-gray-900"
                    >
                      <option value="running">⚡ Running (In Progress)</option>
                      <option value="delivered">✅ Delivered (Completed)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value as any})}
                      className="w-full glass-input px-3 py-2 text-sm bg-gray-900"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">🔥 Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Name</label>
                    <input required type="text" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} className="w-full glass-input px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Value</label>
                    <input required type="text" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full glass-input px-3 py-2 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Profile Name</label>
                    <input required type="text" value={formData.profileName} onChange={e => setFormData({...formData, profileName: e.target.value})} className="w-full glass-input px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Client Name</label>
                    <input required type="text" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} className="w-full glass-input px-3 py-2 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Store URL</label>
                    <input required type="text" value={formData.storeUrl} onChange={e => setFormData({...formData, storeUrl: e.target.value})} className="w-full glass-input px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Deadline Date</label>
                    <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full glass-input px-3 py-2 text-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password (Optional)</label>
                  <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full glass-input px-3 py-2 text-sm" />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium bg-brand-green hover:bg-brand-green-hover text-black rounded-lg transition-colors flex items-center gap-2">
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
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

// ==========================================
// USER WORKFLOW COMPONENT
// ==========================================
function UserWorkflow({ userUid }: { userUid: string }) {
  const [months, setMonths] = useState<ProjectMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [newMonthName, setNewMonthName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMonths();
  }, []);

  const fetchMonths = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/personal-projects/months?uid=${userUid}`);
      const data = await res.json();
      if (data.success) {
        setMonths(data.months);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonthName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/personal-projects/months', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: userUid, month: newMonthName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setIsMonthModalOpen(false);
        setNewMonthName('');
        fetchMonths();
      } else {
        alert(data.error || 'Failed to create month');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMonth = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this month? All projects inside it will be deleted!')) return;
    try {
      const res = await fetch(`/api/personal-projects/months?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchMonths();
    } catch (error) {
      console.error(error);
    }
  };

  if (selectedMonth) {
    return <UserProjectsView userUid={userUid} month={selectedMonth} onBack={() => setSelectedMonth(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-3">
        <button 
          onClick={fetchMonths}
          className="p-2.5 rounded-xl border border-glass-border bg-gray-900/50 text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button 
          onClick={() => setIsMonthModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-medium transition-colors glow-green"
        >
          <Plus className="w-5 h-5" />
          Create Month
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-green"></div>
        </div>
      ) : months.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-glass-border text-center">
          <Calendar className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Months Created</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">Create a month folder to start organizing your personal projects and tracking their values.</p>
          <button onClick={() => setIsMonthModalOpen(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-medium transition-colors glow-green">
            <Plus className="w-5 h-5" /> Create First Month
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {months.map(m => (
            <div 
              key={m._id} 
              onClick={() => setSelectedMonth(m.month)}
              className="glass-panel p-6 rounded-2xl border border-glass-border hover:border-brand-green/50 cursor-pointer transition-all hover:-translate-y-1 group relative overflow-hidden"
            >
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => handleDeleteMonth(m._id, e)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-md transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <Calendar className="w-8 h-8 text-brand-green mb-4 opacity-80" />
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand-green transition-colors">{m.month}</h3>
              <p className="text-xs text-gray-500">Click to view projects</p>
            </div>
          ))}
        </div>
      )}

      {/* Create Month Modal */}
      <AnimatePresence>
        {isMonthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMonthModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm bg-gray-900 border border-glass-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-glass-border">
                <h2 className="text-xl font-bold text-white">Create New Month</h2>
              </div>
              <form onSubmit={handleCreateMonth} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Month Name</label>
                  <input required autoFocus type="text" value={newMonthName} onChange={e => setNewMonthName(e.target.value)} placeholder="e.g. January 2026" className="w-full glass-input px-3 py-2 text-sm" />
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsMonthModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium bg-brand-green hover:bg-brand-green-hover text-black rounded-lg transition-colors flex items-center gap-2">
                    {isSubmitting ? 'Creating...' : 'Create Month'}
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

// ==========================================
// USER SPECIFIC MONTH PROJECTS VIEW
// ==========================================
function UserProjectsView({ userUid, month, onBack }: { userUid: string, month: string, onBack: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Tab & Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // Project Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    projectName: '',
    value: '',
    profileName: '',
    clientName: '',
    storeUrl: '',
    password: '',
    status: 'running' as 'running' | 'delivered',
    progress: 50,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    deadline: '',
    notes: '',
    orderId: '',
    originalOrderValue: '',
    personCount: 1,
    isSyncedWithTracker: false
  });

  // Order Tracker Picker Modal State
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [trackerOrders, setTrackerOrders] = useState<TrackerOrder[]>([]);
  const [loadingTracker, setLoadingTracker] = useState(false);
  const [trackerSearch, setTrackerSearch] = useState('');
  const [trackerStatusFilter, setTrackerStatusFilter] = useState<'all' | 'wip' | 'delivered'>('all');

  // Service Line, Team, and Person Filters (Default Service Line: Shopify, Team: CC)
  const [trackerServiceLineFilter, setTrackerServiceLineFilter] = useState<string>('Shopify');
  const [trackerTeamFilter, setTrackerTeamFilter] = useState<string>('CC');
  const [trackerPersonFilter, setTrackerPersonFilter] = useState<string>('All');

  useEffect(() => {
    fetchProjects();

    // Load saved filter preferences from localStorage if exists
    const savedPrefs = localStorage.getItem('cc_tracker_import_filters');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.serviceLine !== undefined) setTrackerServiceLineFilter(parsed.serviceLine);
        if (parsed.team !== undefined) setTrackerTeamFilter(parsed.team);
        if (parsed.person !== undefined) setTrackerPersonFilter(parsed.person);
      } catch (e) {
        console.error(e);
      }
    }
  }, [month]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveFilterPreferences = () => {
    const prefs = {
      serviceLine: trackerServiceLineFilter,
      team: trackerTeamFilter,
      person: trackerPersonFilter
    };
    localStorage.setItem('cc_tracker_import_filters', JSON.stringify(prefs));
    showToast('💾 Saved filter preferences!');
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/personal-projects?uid=${userUid}&month=${encodeURIComponent(month)}`);
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackerOrders = async () => {
    setLoadingTracker(true);
    try {
      const res = await fetch('/api/order-tracker/orders');
      const data = await res.json();
      if (data.success) {
        setTrackerOrders(data.orders);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingTracker(false);
    }
  };

  const handleOpenTrackerPicker = () => {
    setIsTrackerModalOpen(true);
    fetchTrackerOrders(); // Always fetch fresh data from API on open
  };

  const handleSelectTrackerOrder = (order: TrackerOrder) => {
    const rawVal = parseValue(order.value);
    const pCount = formData.personCount || 1;
    const splitVal = rawVal > 0 ? formatCurrency(rawVal / pCount) : order.value;

    const isDone = (order.status || '').toLowerCase().includes('done') || (order.status || '').toLowerCase().includes('delivered');

    const autoProjectName = `${order.clientName !== 'N/A' ? order.clientName : (order.projectName || 'Project')} || ${order.profileName} || #${order.orderId}`;

    setFormData(prev => ({
      ...prev,
      orderId: order.orderId,
      projectName: autoProjectName,
      clientName: order.clientName || prev.clientName,
      profileName: order.profileName || prev.profileName,
      storeUrl: order.storeUrl || prev.storeUrl,
      password: order.password || prev.password,
      originalOrderValue: order.value,
      value: splitVal,
      status: isDone ? 'delivered' : 'running',
      progress: isDone ? 100 : (prev.progress || 50),
      isSyncedWithTracker: true,
      deadline: order.deliveryDate ? order.deliveryDate.split('T')[0] : prev.deadline
    }));

    setIsTrackerModalOpen(false);
    showToast(`⚡ Auto-filled details from Order #${order.orderId}`);
  };

  const handlePersonCountChange = (newCount: number) => {
    const validCount = Math.max(1, newCount);
    
    // Auto calculate divided value if original value exists
    const origValStr = formData.originalOrderValue || formData.value;
    const numericOrig = parseValue(origValStr);

    let newDividedValStr = formData.value;
    if (numericOrig > 0) {
      newDividedValStr = formatCurrency(numericOrig / validCount);
    }

    setFormData(prev => ({
      ...prev,
      personCount: validCount,
      value: newDividedValStr
    }));
  };

  const handleMarkAsDelivered = async (project: Project) => {
    try {
      const res = await fetch('/api/personal-projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: project._id,
          status: 'delivered',
          progress: 100,
          deliveredAt: new Date()
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🎉 "${project.projectName}" moved to Delivered List!`);
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopySpecs = (project: Project) => {
    const specs = `📌 Project: ${project.projectName}
🆔 Order ID: ${project.orderId || 'N/A'}
👤 Client: ${project.clientName}
🌐 Store: ${project.storeUrl}
🔑 Password: ${project.password || 'N/A'}
💰 Value: ${project.value} ${project.personCount && project.personCount > 1 ? `(${project.personCount} Persons Split)` : ''}
⚡ Status: ${(project.status || 'delivered').toUpperCase()}`;

    navigator.clipboard.writeText(specs);
    showToast(`📋 Copied "${project.projectName}" specs!`);
  };

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingId(project._id);
      setFormData({
        projectName: project.projectName,
        value: project.value,
        profileName: project.profileName,
        clientName: project.clientName,
        storeUrl: project.storeUrl,
        password: project.password || '',
        status: project.status || 'delivered',
        progress: project.progress !== undefined ? project.progress : (project.status === 'running' ? 50 : 100),
        priority: project.priority || 'medium',
        deadline: project.deadline || '',
        notes: project.notes || '',
        orderId: project.orderId || '',
        originalOrderValue: project.originalOrderValue || project.value,
        personCount: project.personCount || 1,
        isSyncedWithTracker: !!project.isSyncedWithTracker
      });
    } else {
      setEditingId(null);
      setFormData({
        projectName: '',
        value: '',
        profileName: '',
        clientName: '',
        storeUrl: '',
        password: '',
        status: 'running',
        progress: 50,
        priority: 'medium',
        deadline: '',
        notes: '',
        orderId: '',
        originalOrderValue: '',
        personCount: 1,
        isSyncedWithTracker: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData, month, firebaseUid: userUid };
      const url = '/api/personal-projects';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...payload, _id: editingId } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchProjects();
        showToast(editingId ? 'Project updated!' : '⚡ New project created!');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`/api/personal-projects?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Project deleted');
        fetchProjects();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Calculations
  const deliveredProjects = projects.filter(p => (p.status || 'delivered') === 'delivered');
  const runningProjects = projects.filter(p => p.status === 'running');
  
  const totalDeliveredValue = deliveredProjects.reduce((acc, p) => acc + parseValue(p.value), 0);
  const totalRunningValue = runningProjects.reduce((acc, p) => acc + parseValue(p.value), 0);
  const totalMonthValue = projects.reduce((acc, p) => acc + parseValue(p.value), 0);

  // Filtered List
  let displayList = projects;
  if (statusFilter === 'running') displayList = runningProjects;
  if (statusFilter === 'delivered') displayList = deliveredProjects;
  
  if (priorityFilter !== 'all') {
    displayList = displayList.filter(p => (p.priority || 'medium') === priorityFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayList = displayList.filter(p => 
      p.projectName.toLowerCase().includes(q) ||
      p.clientName.toLowerCase().includes(q) ||
      p.profileName.toLowerCase().includes(q) ||
      p.storeUrl.toLowerCase().includes(q) ||
      (p.orderId && p.orderId.toLowerCase().includes(q))
    );
  }

  // Helper to parse Assign Team string (e.g. "Muhaimenul/CC" into teams: ["CC"], persons: ["Muhaimenul"])
  const parseAssignTeam = (str?: string) => {
    if (!str || typeof str !== 'string') return { teams: [], persons: [] };
    const parts = str.split('/').map(s => s.trim()).filter(Boolean);
    const teams: string[] = [];
    const persons: string[] = [];
    parts.forEach(p => {
      if (p.length <= 2) {
        teams.push(p.toUpperCase());
      } else {
        persons.push(p);
      }
    });
    return { teams, persons };
  };

  // 1. Service Lines Dropdown Options (Derived from ALL tracker orders)
  const availableServiceLines = React.useMemo(() => {
    const set = new Set<string>();
    trackerOrders.forEach(o => {
      if (o.serviceLine) set.add(o.serviceLine.trim());
    });
    const list = Array.from(set).sort();
    return ['All', ...list];
  }, [trackerOrders]);

  // 2. Teams Dropdown Options (Cascaded: Derived ONLY from orders matching selected Service Line)
  const availableTeams = React.useMemo(() => {
    let subset = trackerOrders;
    if (trackerServiceLineFilter !== 'All') {
      const slq = trackerServiceLineFilter.toLowerCase();
      subset = subset.filter(o => (o.serviceLine || '').toLowerCase() === slq);
    }
    const set = new Set<string>();
    subset.forEach(o => {
      const { teams } = parseAssignTeam(o.assignTeam);
      teams.forEach(t => set.add(t));
      if (o.team) set.add(o.team.toUpperCase());
    });
    const list = Array.from(set).sort();
    return ['All', ...list];
  }, [trackerOrders, trackerServiceLineFilter]);

  // 3. Persons Dropdown Options (Cascaded: Derived ONLY from orders matching selected Service Line AND selected Team)
  const availablePersons = React.useMemo(() => {
    let subset = trackerOrders;
    if (trackerServiceLineFilter !== 'All') {
      const slq = trackerServiceLineFilter.toLowerCase();
      subset = subset.filter(o => (o.serviceLine || '').toLowerCase() === slq);
    }
    if (trackerTeamFilter !== 'All') {
      const tq = trackerTeamFilter.toLowerCase();
      subset = subset.filter(o => {
        const { teams } = parseAssignTeam(o.assignTeam);
        return teams.some(t => t.toLowerCase() === tq) || (o.team || '').toLowerCase() === tq;
      });
    }
    const set = new Set<string>();
    subset.forEach(o => {
      const { persons } = parseAssignTeam(o.assignTeam);
      persons.forEach(p => set.add(p));
      if (o.person && o.person.length > 2) set.add(o.person);
    });
    const list = Array.from(set).sort();
    return ['All', ...list];
  }, [trackerOrders, trackerServiceLineFilter, trackerTeamFilter]);

  // Auto reset team filter if selected team is not present in newly cascaded availableTeams
  useEffect(() => {
    if (trackerTeamFilter !== 'All' && availableTeams.length > 0 && !availableTeams.includes(trackerTeamFilter)) {
      setTrackerTeamFilter('All');
    }
  }, [availableTeams, trackerTeamFilter]);

  // Auto reset person filter if selected person is not present in newly cascaded availablePersons
  useEffect(() => {
    if (trackerPersonFilter !== 'All' && availablePersons.length > 0 && !availablePersons.includes(trackerPersonFilter)) {
      setTrackerPersonFilter('All');
    }
  }, [availablePersons, trackerPersonFilter]);

  const isWIPStatus = (st?: string) => {
    const s = (st || '').trim().toLowerCase();
    if (s.includes('deliver') || s.includes('done') || s.includes('complete')) return false;
    return s === 'wip' || s.includes('progress');
  };

  const isDeliveredStatus = (st?: string) => {
    const s = (st || '').trim().toLowerCase();
    return s.includes('deliver') || s.includes('done') || s.includes('complete');
  };

  // Dynamic tab counts based on current Service Line, Team, Person filters
  const trackerCounts = React.useMemo(() => {
    let subset = trackerOrders;
    if (trackerServiceLineFilter !== 'All') {
      const slq = trackerServiceLineFilter.toLowerCase();
      subset = subset.filter(o => (o.serviceLine || '').toLowerCase() === slq);
    }
    if (trackerTeamFilter !== 'All') {
      const tq = trackerTeamFilter.toLowerCase();
      subset = subset.filter(o => {
        const { teams } = parseAssignTeam(o.assignTeam);
        return teams.some(t => t.toLowerCase() === tq) || (o.team || '').toLowerCase() === tq;
      });
    }
    if (trackerPersonFilter !== 'All') {
      const pq = trackerPersonFilter.toLowerCase();
      subset = subset.filter(o => {
        const { persons } = parseAssignTeam(o.assignTeam);
        return persons.some(p => p.toLowerCase() === pq) || (o.person || '').toLowerCase() === pq;
      });
    }

    let wip = 0;
    let delivered = 0;
    subset.forEach(o => {
      if (isWIPStatus(o.status)) wip++;
      else if (isDeliveredStatus(o.status)) delivered++;
    });
    return { all: subset.length, wip, delivered };
  }, [trackerOrders, trackerServiceLineFilter, trackerTeamFilter, trackerPersonFilter]);

  // Tracker Filtered List (Strict Cascading Filter)
  const filteredTrackerOrders = React.useMemo(() => {
    let result = trackerOrders;

    // 1. Strict Status Filter (WIP vs Delivered vs All)
    if (trackerStatusFilter === 'wip') {
      result = result.filter(o => isWIPStatus(o.status));
    } else if (trackerStatusFilter === 'delivered') {
      result = result.filter(o => isDeliveredStatus(o.status));
    }

    // 2. Service Line Filter
    if (trackerServiceLineFilter !== 'All') {
      const slq = trackerServiceLineFilter.toLowerCase();
      result = result.filter(o => (o.serviceLine || '').toLowerCase() === slq);
    }

    // 3. Team Filter
    if (trackerTeamFilter !== 'All') {
      const tq = trackerTeamFilter.toLowerCase();
      result = result.filter(o => {
        const { teams } = parseAssignTeam(o.assignTeam);
        return teams.some(t => t.toLowerCase() === tq) || (o.team || '').toLowerCase() === tq;
      });
    }

    // 4. Person Filter
    if (trackerPersonFilter !== 'All') {
      const pq = trackerPersonFilter.toLowerCase();
      result = result.filter(o => {
        const { persons } = parseAssignTeam(o.assignTeam);
        return persons.some(p => p.toLowerCase() === pq) || (o.person || '').toLowerCase() === pq;
      });
    }

    // 5. Search Filter
    if (trackerSearch.trim()) {
      const q = trackerSearch.toLowerCase();
      result = result.filter(o => 
        o.orderId.toLowerCase().includes(q) ||
        o.projectName.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q) ||
        o.profileName.toLowerCase().includes(q) ||
        (o.assignTeam && o.assignTeam.toLowerCase().includes(q))
      );
    }

    return result;
  }, [trackerOrders, trackerStatusFilter, trackerServiceLineFilter, trackerTeamFilter, trackerPersonFilter, trackerSearch]);

  return (
    <div className="space-y-6 relative">
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-6 right-6 z-50 bg-emerald-500 text-black font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-300">
            <Sparkles className="w-5 h-5 text-black" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            {month} Projects
          </h2>
          <p className="text-xs text-gray-400">Organize running workload, auto-sync from Order Tracker & split values</p>
        </div>
      </div>

      {/* Glowing Financial Pipeline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Delivered */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-15">
            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
          </div>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Delivered Value ({deliveredProjects.length})
          </p>
          <p className="text-3xl font-black text-white">${totalDeliveredValue.toLocaleString()}</p>
        </div>

        {/* Total Running */}
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-15">
            <Clock className="w-16 h-16 text-amber-400" />
          </div>
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Running Pipeline ({runningProjects.length})
          </p>
          <p className="text-3xl font-black text-white">${totalRunningValue.toLocaleString()}</p>
        </div>

        {/* Combined Month Total */}
        <div className="glass-panel p-5 rounded-2xl border border-glass-border relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <DollarSign className="w-16 h-16 text-brand-green" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-brand-green" /> Total Month Value ({projects.length})
          </p>
          <p className="text-3xl font-black text-white">${totalMonthValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs & Controls Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Status Filter Tabs */}
        <div className="flex p-1 bg-gray-900/90 rounded-xl border border-glass-border max-w-full overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-gray-800 text-white shadow-md border border-gray-700'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All ({projects.length})
          </button>
          
          <button
            onClick={() => setStatusFilter('running')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              statusFilter === 'running'
                ? 'bg-amber-500 text-black shadow-lg glow-amber'
                : 'text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Running ({runningProjects.length})
          </button>

          <button
            onClick={() => setStatusFilter('delivered')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              statusFilter === 'delivered'
                ? 'bg-emerald-500 text-black shadow-lg glow-green'
                : 'text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered ({deliveredProjects.length})
          </button>
        </div>

        {/* Right side controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full glass-input pl-9 pr-3 py-2 text-xs"
            />
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="glass-input px-3 py-2 text-xs bg-gray-900 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">🔥 Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button onClick={fetchProjects} className="p-2 rounded-xl border border-glass-border bg-gray-900/50 text-gray-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button onClick={() => handleOpenModal()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black text-xs font-bold transition-colors glow-green">
            <Plus className="w-4 h-4" /> Add Project
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="glass-panel p-1 rounded-2xl border border-glass-border">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-green"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Name</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Profile</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Value</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Store URL</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {displayList.map(p => {
                  const isRunning = p.status === 'running';

                  return (
                    <tr key={p._id} className={`hover:bg-gray-800/40 transition-colors ${isRunning ? 'bg-amber-500/5' : ''}`}>
                      <td className="p-3 text-sm">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(p.status)}
                          {p.isSyncedWithTracker && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300 font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20" title={`Synced Order #${p.orderId}`}>
                              <RotateCcw className="w-2.5 h-2.5 text-cyan-400" /> {p.orderId || 'Synced'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm font-medium text-white">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{p.projectName}</span>
                            {getPriorityBadge(p.priority)}
                            {getDeadlineBadge(p.deadline, p.status)}
                          </div>
                          {isRunning && p.progress !== undefined && (
                            <div className="w-36 bg-gray-800 h-1.5 rounded-full overflow-hidden flex items-center">
                              <div 
                                className="bg-amber-400 h-full rounded-full transition-all"
                                style={{ width: `${p.progress}%` }}
                              />
                              <span className="text-[10px] text-gray-400 ml-2 font-mono">{p.progress}%</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-300">
                        <span className="bg-brand-green/20 text-brand-green px-2 py-1 rounded-md border border-brand-green/30 text-xs font-medium">
                          {p.profileName}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-300">{p.clientName}</td>
                      <td className="p-3 text-sm font-bold text-green-400">
                        <div className="flex flex-col">
                          <span>{p.value}</span>
                          {p.personCount && p.personCount > 1 && (
                            <span className="text-[10px] text-purple-300 font-normal flex items-center gap-1">
                              <Users className="w-2.5 h-2.5 text-purple-400" />
                              Divided by {p.personCount} Persons
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        <a href={p.storeUrl.startsWith('http') ? p.storeUrl : `https://${p.storeUrl}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Link
                        </a>
                      </td>
                      <td className="p-3 text-sm text-gray-400 font-mono text-xs">{p.password || 'N/A'}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          {/* MARK AS DELIVERED BUTTON */}
                          {isRunning && (
                            <button
                              onClick={() => handleMarkAsDelivered(p)}
                              className="px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-all flex items-center gap-1.5 shadow-md glow-green cursor-pointer active:scale-95"
                              title="Click to mark project as Delivered and move to Delivered list"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Delivered
                            </button>
                          )}
                          <button onClick={() => handleCopySpecs(p)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors" title="Copy project specs">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleOpenModal(p)} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors" title="Edit project">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(p._id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-md transition-colors" title="Delete project">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {displayList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      No projects found matching current filter ({statusFilter.toUpperCase()}). Click "Add Project" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Project Add/Edit Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-gray-900 border border-glass-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-glass-border flex justify-between items-center bg-gray-900/80">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {editingId ? <Edit2 className="w-5 h-5 text-brand-green" /> : <Plus className="w-5 h-5 text-brand-green" />}
                    {editingId ? 'Edit Project' : 'Add New Project'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">{month}</p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenTrackerPicker}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500 hover:text-black font-bold text-xs transition-all flex items-center gap-1.5 shadow-md glow-cyan cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Import from Order Tracker
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Synced Info Alert if Order Tracker order is connected */}
                {formData.isSyncedWithTracker && (
                  <div className="bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-xl flex items-center justify-between text-xs text-cyan-300">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Synced from Order Tracker <strong>#{formData.orderId}</strong></span>
                    </div>
                    <button type="button" onClick={handleOpenTrackerPicker} className="underline text-cyan-300 hover:text-white font-medium">Change</button>
                  </div>
                )}

                {/* Status Toggle & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({
                        ...formData, 
                        status: e.target.value as 'running' | 'delivered',
                        progress: e.target.value === 'delivered' ? 100 : (formData.progress || 50)
                      })}
                      className="w-full glass-input px-3 py-2 text-sm bg-gray-900"
                    >
                      <option value="running">⚡ Running (In Progress)</option>
                      <option value="delivered">✅ Delivered (Completed)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value as any})}
                      className="w-full glass-input px-3 py-2 text-sm bg-gray-900"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">🔥 Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Progress bar slider if status is running */}
                {formData.status === 'running' && (
                  <div className="space-y-1.5 bg-gray-800/40 p-3 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center text-xs text-gray-300 font-medium">
                      <span>Completion Progress</span>
                      <span className="text-amber-400 font-bold">{formData.progress}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.progress}
                      onChange={e => setFormData({...formData, progress: parseInt(e.target.value)})}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>
                )}

                {/* Person Count & Value Auto-Division Section */}
                <div className="space-y-2 bg-purple-950/20 border border-purple-500/30 p-3.5 rounded-xl">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-400" /> Team Members (Persons)
                    </label>
                    <span className="text-xs font-semibold text-purple-200">
                      {formData.personCount} {formData.personCount === 1 ? 'Person' : 'Persons'}
                    </span>
                  </div>

                  {/* Quick Person Count Selector Buttons */}
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handlePersonCountChange(num)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          formData.personCount === num
                            ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                            : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800'
                        }`}
                      >
                        {num} {num === 1 ? 'Person' : 'Persons'}
                      </button>
                    ))}
                  </div>

                  {/* Calculation Info Banner */}
                  {formData.personCount > 1 && (
                    <div className="text-[11px] text-purple-300/90 bg-purple-500/10 p-2 rounded-lg border border-purple-500/20 flex items-center justify-between">
                      <span>Original Order: <strong>{formData.originalOrderValue || formData.value}</strong></span>
                      <ArrowRightLeft className="w-3 h-3 text-purple-400" />
                      <span>Divided: <strong>{formData.value} each</strong></span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Name</label>
                    <input required type="text" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} placeholder="Enter project name" className="w-full glass-input px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Share Value (Customizable)</label>
                    <input required type="text" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} placeholder="e.g. $200" className="w-full glass-input px-3 py-2 text-sm text-green-400 font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Profile Name</label>
                    <input required type="text" value={formData.profileName} onChange={e => setFormData({...formData, profileName: e.target.value})} placeholder="Fiverr / Upwork Profile" className="w-full glass-input px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Client Name</label>
                    <input required type="text" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} placeholder="Client Name" className="w-full glass-input px-3 py-2 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Store URL</label>
                    <input required type="text" value={formData.storeUrl} onChange={e => setFormData({...formData, storeUrl: e.target.value})} placeholder="myshopify.com URL" className="w-full glass-input px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Deadline Date (Optional)</label>
                    <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full glass-input px-3 py-2 text-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password (Optional)</label>
                  <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Store password if any" className="w-full glass-input px-3 py-2 text-sm" />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium bg-brand-green hover:bg-brand-green-hover text-black rounded-lg transition-colors flex items-center gap-2 font-bold glow-green">
                    {isSubmitting ? 'Saving...' : 'Save Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Tracker Picker Modal with Advanced Filters (Service Line, Team, Person & Saved Preferences) */}
      <AnimatePresence>
        {isTrackerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setIsTrackerModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-gray-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-glass-border flex justify-between items-center bg-gray-950/80">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-cyan-400" />
                    Select Order from Order Tracker
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Filter by Service Line, Team, Person & auto-fill specs instantly</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveFilterPreferences}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                    title="Save current filters as default preferences"
                  >
                    <Save className="w-3.5 h-3.5 text-cyan-400" />
                    Save Default Filters
                  </button>
                  <button onClick={() => setIsTrackerModalOpen(false)} className="text-gray-400 hover:text-white text-lg font-bold p-1">✕</button>
                </div>
              </div>

              {/* Filters Bar: Service Line, Team, Person, Status & Search */}
              <div className="p-4 border-b border-glass-border bg-gray-950/40 space-y-3">
                {/* Upper Filter Row: Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Service Line Dropdown */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 block flex items-center gap-1">
                      <Layers className="w-3 h-3 text-cyan-400" /> Service Line
                    </label>
                    <select
                      value={trackerServiceLineFilter}
                      onChange={e => setTrackerServiceLineFilter(e.target.value)}
                      className="w-full glass-input px-3 py-1.5 text-xs bg-gray-900 cursor-pointer font-medium"
                    >
                      {availableServiceLines.map(sl => (
                        <option key={sl} value={sl}>{sl === 'All' ? 'All Service Lines' : sl}</option>
                      ))}
                    </select>
                  </div>

                  {/* Team Dropdown */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 block flex items-center gap-1">
                      <Users className="w-3 h-3 text-purple-400" /> Team
                    </label>
                    <select
                      value={trackerTeamFilter}
                      onChange={e => setTrackerTeamFilter(e.target.value)}
                      className="w-full glass-input px-3 py-1.5 text-xs bg-gray-900 cursor-pointer font-medium"
                    >
                      {availableTeams.map(t => (
                        <option key={t} value={t}>{t === 'All' ? 'All Teams' : t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Person (Assignee) Dropdown */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 block flex items-center gap-1">
                      <UserIcon className="w-3 h-3 text-emerald-400" /> Person (Assignee)
                    </label>
                    <select
                      value={trackerPersonFilter}
                      onChange={e => setTrackerPersonFilter(e.target.value)}
                      className="w-full glass-input px-3 py-1.5 text-xs bg-gray-900 cursor-pointer font-medium"
                    >
                      {availablePersons.map(p => (
                        <option key={p} value={p}>{p === 'All' ? 'All Persons' : p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lower Filter Row: Search & Status Tabs */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-1">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search Order ID, Client, Title..."
                      value={trackerSearch}
                      onChange={e => setTrackerSearch(e.target.value)}
                      className="w-full glass-input pl-9 pr-3 py-1.5 text-xs"
                    />
                  </div>

                  <div className="flex p-1 bg-gray-950 rounded-xl border border-glass-border w-full sm:w-auto">
                    <button
                      onClick={() => setTrackerStatusFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        trackerStatusFilter === 'all' ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      All ({trackerCounts.all})
                    </button>
                    <button
                      onClick={() => setTrackerStatusFilter('wip')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        trackerStatusFilter === 'wip' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      ⚡ WIP / Running ({trackerCounts.wip})
                    </button>
                    <button
                      onClick={() => setTrackerStatusFilter('delivered')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        trackerStatusFilter === 'delivered' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      ✅ Delivered ({trackerCounts.delivered})
                    </button>
                  </div>
                </div>
              </div>

              {/* Orders List */}
              <div className="p-4 overflow-y-auto flex-1 space-y-2">
                {loadingTracker ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
                  </div>
                ) : filteredTrackerOrders.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <p className="text-gray-400 text-sm">
                      No matching orders found for selected filters (Service Line: <strong className="text-cyan-400">{trackerServiceLineFilter}</strong>, Team: <strong className="text-purple-400">{trackerTeamFilter}</strong>).
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTrackerServiceLineFilter('All');
                        setTrackerTeamFilter('All');
                        setTrackerPersonFilter('All');
                        setTrackerSearch('');
                        setTrackerStatusFilter('all');
                      }}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" /> Reset All Filters (Show All {trackerOrders.length} Orders)
                    </button>
                  </div>
                ) : (
                  filteredTrackerOrders.map(order => {
                    const isDone = (order.status || '').toLowerCase().includes('done') || (order.status || '').toLowerCase().includes('delivered');
                    return (
                      <div
                        key={order.id}
                        onClick={() => handleSelectTrackerOrder(order)}
                        className="p-4 rounded-xl border border-gray-800 bg-gray-950/60 hover:bg-cyan-950/20 hover:border-cyan-500/40 cursor-pointer transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                              #{order.orderId}
                            </span>
                            <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {order.projectName}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isDone ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
                            <span className="bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30 font-bold flex items-center gap-1">
                              👤 Client: {order.clientName}
                            </span>
                            <span className="bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30 font-semibold flex items-center gap-1">
                              🏷️ Profile: {order.profileName}
                            </span>
                            {order.serviceLine && <span className="text-gray-400 bg-gray-800/60 px-2 py-0.5 rounded-md border border-gray-700">🛠️ {order.serviceLine}</span>}
                            {(order.team || order.assignTeam) && <span className="text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">👥 Team: {order.team || order.assignTeam}</span>}
                            {order.person && <span className="text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">👨‍💻 {order.person}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span className="text-base font-black text-green-400 bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20">
                            {order.value}
                          </span>
                          <button className="px-3 py-1.5 rounded-lg bg-cyan-500 group-hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-md">
                            Select Order
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
    </div>
  );
}
