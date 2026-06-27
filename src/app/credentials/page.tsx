'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Key, 
  ExternalLink, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Database,
  Filter,
  Eye,
  EyeOff,
  Briefcase,
  User,
  Tag,
  FileText,
  PlusCircle,
  FolderKey,
  ShieldCheck,
  Globe,
  Grid,
  List
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { presetStoreCredentials, StoreCredential } from '@/templates/storeCredentials';

export default function CredentialsPage() {
  const store = useWorkspaceStore();
  const [credentials, setCredentials] = useState<StoreCredential[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeProfile, setActiveProfile] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Show/Hide password toggle state
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New credential builder state
  const [modalOpen, setModalOpen] = useState(false);
  const [newLink, setNewLink] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCategory, setNewCategory] = useState('Fashion & Apparel');
  const [newSpecialNote, setNewSpecialNote] = useState('');
  const [newProfileName, setNewProfileName] = useState('');
  const [newClientName, setNewClientName] = useState('');

  // Hydrate store
  useEffect(() => {
    store.hydrate();
  }, []);

  // Update local state when store.credentials changes
  useEffect(() => {
    setCredentials([...store.credentials, ...presetStoreCredentials]);
  }, [store.credentials]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTogglePassword = (id: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.trim()) return;

    const newCred: StoreCredential = {
      id: 'custom-' + Math.random().toString(36).substring(2),
      link: newLink.trim().startsWith('http') ? newLink.trim() : 'https://' + newLink.trim(),
      password: newPassword.trim() || undefined,
      category: newCategory,
      specialNote: newSpecialNote.trim() || undefined,
      profileName: newProfileName.trim() || undefined,
      clientName: newClientName.trim() || undefined
    };

    await store.addCredential(newCred);
    
    // Reset inputs
    setNewLink('');
    setNewPassword('');
    setNewCategory('Fashion & Apparel');
    setNewSpecialNote('');
    setNewProfileName('');
    setNewClientName('');
    setModalOpen(false);
  };

  const handleDeleteCredential = async (id: string, link: string) => {
    await store.deleteCredential(id);
  };

  // Get distinct categories and profiles for filters
  const categories = useMemo(() => {
    const set = new Set<string>();
    credentials.forEach(c => {
      if (c.category) set.add(c.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [credentials]);

  const profiles = useMemo(() => {
    const set = new Set<string>();
    credentials.forEach(c => {
      if (c.profileName) set.add(c.profileName);
    });
    return ['All', ...Array.from(set).sort()];
  }, [credentials]);

  // Filter credentials
  const filteredCredentials = useMemo(() => {
    return credentials.filter(c => {
      const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
      const matchesProfile = activeProfile === 'All' || c.profileName === activeProfile;
      const matchesSearch = 
        c.link.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.password && c.password.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.specialNote && c.specialNote.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.profileName && c.profileName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.clientName && c.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCategory && matchesProfile && matchesSearch;
    });
  }, [credentials, activeCategory, activeProfile, searchQuery]);

  // Statistics counters
  const stats = useMemo(() => {
    const total = credentials.length;
    const withPass = credentials.filter(c => c.password).length;
    const custom = credentials.filter(c => c.id.startsWith('custom-')).length;
    return { total, withPass, custom };
  }, [credentials]);

  // Clean domain name for display
  const getDisplayDomain = (url: string) => {
    try {
      if (!url.startsWith('http')) {
        return url;
      }
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url.replace('https://', '').replace('http://', '').replace('/', '');
    }
  };

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white uppercase">Store Credentials & Client Directory</h1>
          <p className="text-gray-400 text-sm font-medium">
            Manage passwords, domains, special notes, client details, and assignee profiles for 290+ Shopify projects.
          </p>
        </div>
        
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 glow-green shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Credentials</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-glass-border bg-gray-950/20 flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-[10px] block uppercase font-bold tracking-wider">Total Active Domains</span>
            <span className="text-2xl font-black text-white mt-1 block">{stats.total}</span>
          </div>
          <div className="p-3 bg-green-500/10 text-green-400 rounded-lg">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-glass-border bg-gray-950/20 flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-[10px] block uppercase font-bold tracking-wider">Stores with Passwords</span>
            <span className="text-2xl font-black text-white mt-1 block">{stats.withPass}</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
            <Key className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-glass-border bg-gray-950/20 flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-[10px] block uppercase font-bold tracking-wider">Custom Credentials</span>
            <span className="text-2xl font-black text-white mt-1 block">{stats.custom}</span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
            <FolderKey className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control panel & filters */}
      <div className="p-4 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search stores, passwords, categories, notes, assignees or clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg glass-input text-xs"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-950/40 border border-glass-border rounded-lg p-0.5">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'}`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <span className="text-xs text-gray-500 whitespace-nowrap">
              Found <strong className="text-white">{filteredCredentials.length}</strong> items
            </span>
          </div>
        </div>

        {/* Filters dropdown row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-glass-border">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider whitespace-nowrap">Category:</span>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="px-2 py-1 text-xs rounded glass-input cursor-pointer w-full"
            >
              <option value="All">All Categories</option>
              {categories.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider whitespace-nowrap">Assignee Profile:</span>
            <select
              value={activeProfile}
              onChange={(e) => setActiveProfile(e.target.value)}
              className="px-2 py-1 text-xs rounded glass-input cursor-pointer w-full"
            >
              <option value="All">All Assignees</option>
              {profiles.filter(p => p !== 'All').map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid rendering mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCredentials.length > 0 ? (
            filteredCredentials.map((cred) => (
              <div 
                key={cred.id}
                className="p-5 rounded-xl border border-glass-border bg-gray-950/40 hover:bg-glass-hover/40 hover:border-green-500/20 transition-all flex flex-col justify-between relative group text-left space-y-4"
              >
                {/* Header domain & link */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[8px] font-black uppercase tracking-wider font-mono">
                      {cred.category || 'Shopify'}
                    </span>
                    {cred.id.startsWith('custom-') && (
                      <button 
                        onClick={() => handleDeleteCredential(cred.id, cred.link)}
                        className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <h3 className="font-extrabold text-white text-sm tracking-wide mt-1.5 truncate">
                    {getDisplayDomain(cred.link)}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <a 
                      href={cred.link.startsWith('http') ? cred.link : 'https://' + cred.link} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5 font-medium truncate"
                    >
                      <span className="truncate">{cred.link}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  </div>
                </div>

                {/* Password field if exists */}
                {cred.password ? (
                  <div className="p-2.5 rounded-lg bg-black/40 border border-glass-border flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Key className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                      <span className="text-gray-300 font-bold select-all truncate">
                        {showPasswords[cred.id] ? cred.password : '••••••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleTogglePassword(cred.id)}
                        className="p-1 text-gray-500 hover:text-white"
                        title={showPasswords[cred.id] ? "Hide Password" : "Show Password"}
                      >
                        {showPasswords[cred.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={() => handleCopy(cred.id, cred.password || '')}
                        className="p-1 text-gray-400 hover:text-green-400"
                        title="Copy Password"
                      >
                        {copiedId === cred.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-black/20 border border-dashed border-glass-border text-center text-[10px] text-gray-600 font-medium">
                    No Store Password Configured
                  </div>
                )}

                {/* Assignee / Client details footer */}
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-3 border-t border-white/5 mt-2">
                  <div>
                    <span className="text-gray-500 block uppercase font-bold tracking-wider text-[8px]">Assignee (Profile)</span>
                    <span className="text-gray-300 font-semibold truncate block mt-0.5">
                      {cred.profileName || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block uppercase font-bold tracking-wider text-[8px]">Client Username</span>
                    <span className="text-gray-300 font-semibold truncate block mt-0.5">
                      {cred.clientName ? `@${cred.clientName}` : '—'}
                    </span>
                  </div>
                </div>

                {/* Special notes */}
                {cred.specialNote && (
                  <div className="bg-white/[0.02] border border-white/5 p-2 rounded text-[10px] text-gray-400 leading-relaxed italic mt-1 font-medium">
                    Note: "{cred.specialNote}"
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center border border-dashed border-glass-border rounded-xl text-gray-500 text-xs">
              No store credentials found matching your criteria.
            </div>
          )}
        </div>
      ) : (
        /* List rendering view */
        <div className="border border-glass-border rounded-xl bg-gray-950/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="bg-gray-950/60 text-gray-400 border-b border-glass-border uppercase text-[10px] font-black tracking-wider">
                  <th className="p-3">Store Domain (Link)</th>
                  <th className="p-3">Password</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Special Note</th>
                  <th className="p-3">Assignee</th>
                  <th className="p-3">Client</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {filteredCredentials.length > 0 ? (
                  filteredCredentials.map((cred) => (
                    <tr key={cred.id} className="hover:bg-glass-hover/20 transition-colors">
                      <td className="p-3 max-w-[200px] truncate">
                        <a 
                          href={cred.link.startsWith('http') ? cred.link : 'https://' + cred.link}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-white hover:underline flex items-center gap-1"
                        >
                          <span className="truncate">{getDisplayDomain(cred.link)}</span>
                          <ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
                        </a>
                      </td>
                      <td className="p-3 font-mono">
                        {cred.password ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-300">
                              {showPasswords[cred.id] ? cred.password : '••••••••••••'}
                            </span>
                            <button 
                              onClick={() => handleTogglePassword(cred.id)}
                              className="text-gray-500 hover:text-white"
                            >
                              {showPasswords[cred.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            <button 
                              onClick={() => handleCopy(cred.id, cred.password || '')}
                              className="text-gray-500 hover:text-green-400"
                            >
                              {copiedId === cred.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-600 font-medium">None</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-bold">
                          {cred.category}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400 italic max-w-[200px] truncate">
                        {cred.specialNote || '—'}
                      </td>
                      <td className="p-3 text-gray-300 font-semibold">{cred.profileName || '—'}</td>
                      <td className="p-3 text-gray-300 font-semibold">
                        {cred.clientName ? `@${cred.clientName}` : '—'}
                      </td>
                      <td className="p-3 text-right">
                        {cred.id.startsWith('custom-') && (
                          <button 
                            onClick={() => handleDeleteCredential(cred.id, cred.link)}
                            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-white/5"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500 font-medium">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Custom Credentials Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setModalOpen(false)} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
            <div className="bg-gray-900 border border-glass-border p-6 rounded-xl w-full max-w-lg relative z-10 space-y-4 text-left shadow-2xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-green-400" />
                  <span>Add Store Credentials</span>
                </h3>
                <p className="text-xs text-gray-500">Record a new Shopify project deployment credentials block.</p>
              </div>

              <form onSubmit={handleCreateCredential} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Store Link / Domain URL (Required)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. custom-store-name.myshopify.com"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Store Password (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. password123!"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Store Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs cursor-pointer"
                    >
                      <option value="Fashion & Apparel">Fashion & Apparel</option>
                      <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                      <option value="Pet Products">Pet Products</option>
                      <option value="Beauty & Skincare">Beauty & Skincare</option>
                      <option value="Health & Wellness">Health & Wellness</option>
                      <option value="Kids & Baby Products">Kids & Baby Products</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Jewelry">Jewelry</option>
                      <option value="Sports">Sports</option>
                      <option value="Service">Service</option>
                      <option value="Food & Beverage">Food & Beverage</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Assignee Profile (Fiverr User)</label>
                    <input
                      type="text"
                      placeholder="e.g. Pro_wizards"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Client Username</label>
                    <input
                      type="text"
                      placeholder="e.g. listentolaila"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Special Description Note</label>
                  <textarea
                    placeholder="e.g. Compare functionality, single-product dropshipping layout..."
                    value={newSpecialNote}
                    onChange={(e) => setNewSpecialNote(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-gray-950 border border-glass-border hover:bg-glass-hover text-xs font-semibold text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-xs font-semibold text-black"
                  >
                    Record Credentials
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
