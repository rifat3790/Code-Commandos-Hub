'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Lock, Link as LinkIcon, Database, CheckCircle2, User, ExternalLink, RefreshCw } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';

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

export default function PersonalProjectsPage() {
  const { user, dbUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    month: '',
    projectName: '',
    value: '',
    profileName: '',
    clientName: '',
    storeUrl: '',
    password: ''
  });

  const isAdminOrSuperAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/personal-projects?uid=${user?.uid}`);
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
        month: project.month,
        projectName: project.projectName,
        value: project.value,
        profileName: project.profileName,
        clientName: project.clientName,
        storeUrl: project.storeUrl,
        password: project.password || ''
      });
    } else {
      setEditingId(null);
      setFormData({ month: '', projectName: '', value: '', profileName: '', clientName: '', storeUrl: '', password: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData, firebaseUid: user?.uid };
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
      if (res.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse whitespace-nowrap">
        <thead>
          <tr className="border-b border-glass-border">
            <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Month</th>
            <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Name</th>
            <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Profile</th>
            <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Client</th>
            <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Value</th>
            <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Store URL</th>
            <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</th>
            {isAdminOrSuperAdmin && <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">User UID</th>}
            <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-glass-border">
          {projects.map(p => (
            <tr key={p._id} className="hover:bg-gray-800/30 transition-colors">
              <td className="p-3 text-sm text-gray-300">{p.month}</td>
              <td className="p-3 text-sm font-medium text-white">{p.projectName}</td>
              <td className="p-3 text-sm text-gray-300">
                <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-md border border-purple-500/30">
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
              {isAdminOrSuperAdmin && <td className="p-3 text-xs text-gray-500 font-mono">{p.firebaseUid.substring(0, 8)}...</td>}
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
              <td colSpan={isAdminOrSuperAdmin ? 9 : 8} className="p-8 text-center text-gray-500">
                No personal projects found. Click "Add Project" to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-purple-500" />
            PERSONAL PROJECTS
          </h1>
          <p className="text-gray-400 mt-1">
            {isAdminOrSuperAdmin 
              ? "View and manage all users' personal projects." 
              : "Track your personal projects, values, and client details."}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchProjects}
            className="p-2.5 rounded-xl border border-glass-border bg-gray-900/50 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors glow-purple"
          >
            <Plus className="w-5 h-5" />
            Add Project
          </button>
        </div>
      </div>

      <div className="glass-panel p-1 rounded-2xl border border-glass-border">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          renderTable()
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-gray-900 border border-glass-border rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-glass-border">
                <h2 className="text-xl font-bold text-white">
                  {editingId ? 'Edit Project' : 'Add New Project'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Month</label>
                    <input required type="text" value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} placeholder="e.g. January 2026" className="w-full glass-input px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Value</label>
                    <input required type="text" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} placeholder="e.g. $500" className="w-full glass-input px-3 py-2 text-sm" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Name</label>
                  <input required type="text" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} placeholder="Enter project name" className="w-full glass-input px-3 py-2 text-sm" />
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
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-2">
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
