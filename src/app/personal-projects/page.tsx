'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Lock, Link as LinkIcon, Database, CheckCircle2, User as UserIcon, ExternalLink, RefreshCw, Calendar, ChevronLeft, Filter, DollarSign } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';

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
  createdAt: string;
}

interface DbUser {
  _id: string;
  firebaseUid: string;
  name: string;
  email: string;
}

// Utility to parse value string to number for summing (e.g. "$500" -> 500)
const parseValue = (valStr: string) => {
  const parsed = parseFloat(valStr.replace(/[^0-9.-]+/g, ""));
  return isNaN(parsed) ? 0 : parsed;
};

export default function PersonalProjectsPage() {
  const { user, dbUser } = useAuth();
  const isAdminOrSuperAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-brand-green" />
            PERSONAL PROJECTS
          </h1>
          <p className="text-gray-400 mt-1">
            {isAdminOrSuperAdmin 
              ? "View and manage all users' personal projects." 
              : "Organize your projects by month and track your total value."}
          </p>
        </div>
      </div>

      {isAdminOrSuperAdmin ? (
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

  // Filters
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterUser, setFilterUser] = useState<string>('All');
  const [filterProfile, setFilterProfile] = useState<string>('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all projects
      const resProj = await fetch('/api/personal-projects');
      const dataProj = await resProj.json();
      if (dataProj.success) setProjects(dataProj.projects);

      // Fetch all users to map UIDs to Names
      const resUsers = await fetch('/api/users/roles');
      const dataUsers = await resUsers.json();
      if (dataUsers.success) setUsers(dataUsers.users);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Unique values for dropdowns
  const uniqueMonths = Array.from(new Set(projects.map(p => p.month))).sort();
  const uniqueProfiles = Array.from(new Set(projects.map(p => p.profileName))).sort();
  // Map users who actually have projects
  const uidsWithProjects = Array.from(new Set(projects.map(p => p.firebaseUid)));
  const usersWithProjects = uidsWithProjects.map(uid => {
    const u = users.find(u => u.firebaseUid === uid);
    return { uid, name: u?.name || u?.email || uid };
  });

  // Apply Filters
  let filteredProjects = projects;
  if (filterMonth !== 'All') filteredProjects = filteredProjects.filter(p => p.month === filterMonth);
  if (filterUser !== 'All') filteredProjects = filteredProjects.filter(p => p.firebaseUid === filterUser);
  if (filterProfile !== 'All') filteredProjects = filteredProjects.filter(p => p.profileName === filterProfile);

  // Calculate Sum
  const totalValue = filteredProjects.reduce((acc, p) => acc + parseValue(p.value), 0);

  const getUserName = (uid: string) => {
    const u = users.find(u => u.firebaseUid === uid);
    return u?.name || u?.email || uid;
  };

  return (
    <div className="space-y-6">
      {/* Filters and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-6 rounded-2xl border border-glass-border flex flex-col justify-center items-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <DollarSign className="w-8 h-8 text-green-400 mb-2 opacity-80" />
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Total Value</p>
          <p className="text-4xl font-black text-white">${totalValue.toLocaleString()}</p>
        </div>
        
        <div className="md:col-span-3 glass-panel p-4 rounded-2xl border border-glass-border flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Month
            </label>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full glass-input px-3 py-2 text-sm appearance-none cursor-pointer">
              <option value="All">All Months</option>
              {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
              <UserIcon className="w-3 h-3" /> User
            </label>
            <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="w-full glass-input px-3 py-2 text-sm appearance-none cursor-pointer">
              <option value="All">All Users</option>
              {usersWithProjects.map(u => <option key={u.uid} value={u.uid}>{u.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
              <Filter className="w-3 h-3" /> Profile Name
            </label>
            <select value={filterProfile} onChange={(e) => setFilterProfile(e.target.value)} className="w-full glass-input px-3 py-2 text-sm appearance-none cursor-pointer">
              <option value="All">All Profiles</option>
              {uniqueProfiles.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button onClick={fetchData} className="p-2.5 rounded-xl border border-glass-border bg-gray-900/50 text-gray-400 hover:text-white transition-colors h-[38px] flex items-center justify-center">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
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
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Month</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Name</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Profile</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Value</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Store URL</th>
                  <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {filteredProjects.map(p => (
                  <tr key={p._id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-3 text-sm text-gray-300 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <UserIcon className="w-3 h-3 text-blue-400" />
                        </div>
                        {getUserName(p.firebaseUid)}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-400">{p.month}</td>
                    <td className="p-3 text-sm font-medium text-white">{p.projectName}</td>
                    <td className="p-3 text-sm">
                      <span className="bg-brand-green/20 text-brand-green px-2 py-1 rounded-md border border-brand-green/30">
                        {p.profileName}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-400">{p.clientName}</td>
                    <td className="p-3 text-sm font-bold text-green-400">{p.value}</td>
                    <td className="p-3 text-sm">
                      <a href={p.storeUrl.startsWith('http') ? p.storeUrl : `https://${p.storeUrl}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Link
                      </a>
                    </td>
                    <td className="p-3 text-sm text-gray-500 font-mono">{p.password || 'N/A'}</td>
                  </tr>
                ))}
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      No projects found matching the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
  
  // Create Month Modal
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

  // If a month is selected, show projects for that month
  if (selectedMonth) {
    return <UserProjectsView userUid={userUid} month={selectedMonth} onBack={() => setSelectedMonth(null)} />;
  }

  // Otherwise, show the Month Grid
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
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white font-medium transition-colors glow-green"
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
          <button onClick={() => setIsMonthModalOpen(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white font-medium transition-colors glow-green">
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
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium bg-brand-green hover:bg-brand-green-hover text-white rounded-lg transition-colors flex items-center gap-2">
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
  
  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    projectName: '',
    value: '',
    profileName: '',
    clientName: '',
    storeUrl: '',
    password: ''
  });

  useEffect(() => {
    fetchProjects();
  }, [month]);

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

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingId(project._id);
      setFormData({
        projectName: project.projectName,
        value: project.value,
        profileName: project.profileName,
        clientName: project.clientName,
        storeUrl: project.storeUrl,
        password: project.password || ''
      });
    } else {
      setEditingId(null);
      setFormData({ projectName: '', value: '', profileName: '', clientName: '', storeUrl: '', password: '' });
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
      if (res.ok) fetchProjects();
    } catch (error) {
      console.error(error);
    }
  };

  const totalValue = projects.reduce((acc, p) => acc + parseValue(p.value), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-white">{month} Projects</h2>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Glowing Sum Card */}
        <div className="glass-panel px-6 py-4 rounded-2xl border border-glass-border flex items-center gap-4 relative overflow-hidden group min-w-[250px]">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/10 opacity-50" />
          <div className="p-3 bg-green-500/20 rounded-xl">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Total Month Value</p>
            <p className="text-2xl font-black text-white">${totalValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={fetchProjects} className="p-2.5 rounded-xl border border-glass-border bg-gray-900/50 text-gray-400 hover:text-white transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white font-medium transition-colors glow-green">
            <Plus className="w-5 h-5" /> Add Project
          </button>
        </div>
      </div>

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
                {projects.map(p => (
                  <tr key={p._id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-3 text-sm font-medium text-white">{p.projectName}</td>
                    <td className="p-3 text-sm text-gray-300">
                      <span className="bg-brand-green/20 text-brand-green px-2 py-1 rounded-md border border-brand-green/30">
                        {p.profileName}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-300">{p.clientName}</td>
                    <td className="p-3 text-sm font-bold text-green-400">{p.value}</td>
                    <td className="p-3 text-sm">
                      <a href={p.storeUrl.startsWith('http') ? p.storeUrl : `https://${p.storeUrl}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Link
                      </a>
                    </td>
                    <td className="p-3 text-sm text-gray-400">{p.password || 'N/A'}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenModal(p)} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p._id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-md transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No projects added for {month} yet. Click "Add Project" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Project Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-gray-900 border border-glass-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-glass-border">
                <h2 className="text-xl font-bold text-white">
                  {editingId ? 'Edit Project' : 'Add New Project'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Name</label>
                    <input required type="text" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} placeholder="Enter project name" className="w-full glass-input px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Value</label>
                    <input required type="text" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} placeholder="e.g. $500" className="w-full glass-input px-3 py-2 text-sm" />
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

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Store URL</label>
                  <input required type="text" value={formData.storeUrl} onChange={e => setFormData({...formData, storeUrl: e.target.value})} placeholder="myshopify.com URL" className="w-full glass-input px-3 py-2 text-sm" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password (Optional)</label>
                  <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Store password if any" className="w-full glass-input px-3 py-2 text-sm" />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium bg-brand-green hover:bg-brand-green-hover text-white rounded-lg transition-colors flex items-center gap-2">
                    {isSubmitting ? 'Saving...' : 'Save Project'}
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

