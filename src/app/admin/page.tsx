'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Check, X, Database, Phone, Video, Palette, Type, Square, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useCall } from '@/context/CallContext';
import { motion, AnimatePresence } from 'framer-motion';

const allAvailableMenus = [
  'Home', 'Workspace', 'Meetings', 'Order Tracker', 'Personal Projects', 'Message Helper', 'Templates', 'Schema Builder',
  'Audit Suite', 'Projects', 'Mockup Studio', 'Focus Studio', 'AI Assistant', 
  'Team Notes', 'Downloads', 'Member Profile', 'Shopify Codes', 'Settings'
];

export default function AdminDashboard() {
  const { user, dbUser, loading } = useAuth();
  const { startCall } = useCall();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'pending' | 'shopify' | 'users' | 'menus' | 'storage' | 'active-users' | 'styles' | 'usage'>('pending');
  const [selectedUserUsage, setSelectedUserUsage] = useState<any>(null);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  
  const [activeVisitors, setActiveVisitors] = useState<{count: number, list: any[]}>({ count: 0, list: [] });
  const [loadingActive, setLoadingActive] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const [pendingShopify, setPendingShopify] = useState<any[]>([]);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  
  const [newUserEmail, setNewUserEmail] = useState('');
  const storeSettings = useWorkspaceStore((state) => state.settings);
  const updateSettings = useWorkspaceStore((state) => state.updateSettings);

  const [newUserPass, setNewUserPass] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [adminEnabledMenus, setAdminEnabledMenus] = useState<string[]>([]);
  const [userEnabledMenus, setUserEnabledMenus] = useState<string[]>([]);

  const [editingUserPermissionsId, setEditingUserPermissionsId] = useState<string | null>(null);
  const [editingUserMenus, setEditingUserMenus] = useState<string[]>([]);

  useEffect(() => {
    if (storeSettings) {
      if (storeSettings.adminEnabledMenus && storeSettings.adminEnabledMenus.length > 0) {
        setAdminEnabledMenus(storeSettings.adminEnabledMenus);
      } else if (storeSettings.enabledMenus) {
        setAdminEnabledMenus(storeSettings.enabledMenus);
      }
      
      if (storeSettings.userEnabledMenus && storeSettings.userEnabledMenus.length > 0) {
        setUserEnabledMenus(storeSettings.userEnabledMenus);
      } else if (storeSettings.enabledMenus) {
        setUserEnabledMenus(storeSettings.enabledMenus);
      }
    }
  }, [storeSettings]);

  useEffect(() => {
    if (!loading) {
      if (!dbUser || (dbUser.role !== 'super_admin' && dbUser.role !== 'admin' && dbUser.email !== 'refayethossenmd@gmail.com')) {
        router.push('/');
      } else {
        fetchPending();
        fetchPendingShopify();
        if (dbUser.role === 'super_admin' || dbUser.email === 'refayethossenmd@gmail.com') {
          fetchUsers();
        }
      }
    }
  }, [loading, dbUser, router]);

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/pending');
      const data = await res.json();
      if (data.success) setPendingChanges(data.changes);
    } catch (e) {
      console.error("Error fetching pending:", e);
    }
  };

  const fetchPendingShopify = async () => {
    try {
      const res = await fetch('/api/admin/shopify-snippets');
      const data = await res.json();
      if (data.success) setPendingShopify(data.snippets);
    } catch (e) {
      console.error("Error fetching shopify snippets:", e);
    }
  };

  const fetchStorageStats = async () => {
    if (!user) return;
    setLoadingStorage(true);
    try {
      const res = await fetch(`/api/admin/storage?uid=${user.uid}`);
      const data = await res.json();
      if (data.success) {
        setStorageStats(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStorage(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'storage' && !storageStats) {
      fetchStorageStats();
    }
  }, [activeTab]);

  const fetchActiveVisitors = async () => {
    if (!user) return;
    setLoadingActive(true);
    try {
      const res = await fetch(`/api/users/active?uid=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setActiveVisitors({ count: data.count, list: data.activeUsers || [] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActive(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'active-users') {
      fetchActiveVisitors();
      const interval = setInterval(fetchActiveVisitors, 10000);
      return () => clearInterval(interval);
    }
    if (activeTab === 'usage' || activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, user]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users/roles');
      const data = await res.json();
      if (data.success) setAllUsers(data.users);
    } catch (e) {
      console.error("Error fetching users:", e);
    }
  };

  const handleApproveReject = async (id: string, decision: 'approve' | 'reject') => {
    await fetch('/api/pending/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changeId: id, firebaseUid: user?.uid, decision })
    });
    fetchPending();
  };

  const handleApproveRejectShopify = async (id: string, decision: 'approved' | 'rejected') => {
    await fetch(`/api/admin/shopify-snippets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: decision })
    });
    fetchPendingShopify();
  };

  const handlePromote = async (userId: string, newRole: string) => {
    await fetch('/api/users/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promoterUid: user?.uid, targetUserId: userId, newRole })
    });
    fetchUsers();
  };

  const handleToggleCallingPermission = async (userId: string, currentAllowed: boolean) => {
    await fetch('/api/users/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promoterUid: user?.uid, targetUserId: userId, callingAllowed: !currentAllowed })
    });
    fetchUsers();
  };

  const handleToggleWorkloadPermission = async (userId: string, currentAllowed: boolean) => {
    await fetch('/api/users/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promoterUid: user?.uid, targetUserId: userId, showWorkloadMetrics: !currentAllowed })
    });
    fetchUsers();
  };

  const handleSaveUserPermissions = async (userId: string, menus: string[] | null) => {
    await fetch('/api/users/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promoterUid: user?.uid, targetUserId: userId, allowedMenus: menus })
    });
    setEditingUserPermissionsId(null);
    fetchUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPass) return;
    setIsCreatingUser(true);
    
    try {
      const { initializeApp, getApps } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
      const { firebaseConfig } = await import('@/lib/firebase');
      
      let secondaryApp;
      if (!getApps().find(app => app.name === 'Secondary')) {
         secondaryApp = initializeApp(firebaseConfig, 'Secondary');
      } else {
         secondaryApp = getApps().find(app => app.name === 'Secondary')!;
      }
      
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUserEmail, newUserPass);
      const newFirebaseUser = userCredential.user;

      // Immediately sync the new user to MongoDB so they appear in the list
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: newFirebaseUser.uid,
          email: newFirebaseUser.email,
          name: '',
          photoURL: ''
        })
      });

      await signOut(secondaryAuth); // Sign out of the secondary app
      
      setNewUserEmail('');
      setNewUserPass('');
      fetchUsers(); // Refresh the list
      alert('User created successfully and added to the User Roles list.');
    } catch(err: any) {
      alert(err.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleToggleMenu = async (menuName: string, roleType: 'admin' | 'user') => {
    let newMenus;
    if (roleType === 'admin') {
      if (adminEnabledMenus.includes(menuName)) {
        newMenus = adminEnabledMenus.filter(m => m !== menuName);
      } else {
        newMenus = [...adminEnabledMenus, menuName];
      }
      setAdminEnabledMenus(newMenus);
      await updateSettings({ adminEnabledMenus: newMenus });
    } else {
      if (userEnabledMenus.includes(menuName)) {
        newMenus = userEnabledMenus.filter(m => m !== menuName);
      } else {
        newMenus = [...userEnabledMenus, menuName];
      }
      setUserEnabledMenus(newMenus);
      await updateSettings({ userEnabledMenus: newMenus });
    }
  };

  if (loading || !dbUser) return null;

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase flex items-center gap-2">
        <ShieldAlert className="w-6 h-6 text-red-500" /> Admin Dashboard
      </h1>

      <div className="flex border-b border-glass-border">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-3 text-xs uppercase font-extrabold ${activeTab === 'pending' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-500 hover:text-white'}`}
        >
          Pending Changes
        </button>
        <button
          onClick={() => setActiveTab('shopify')}
          className={`px-5 py-3 text-xs uppercase font-extrabold ${activeTab === 'shopify' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-500 hover:text-white'}`}
        >
          Shopify Approvals
        </button>
        <button
          onClick={() => setActiveTab('active-users')}
          className={`px-5 py-3 text-xs uppercase font-extrabold ${activeTab === 'active-users' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-500 hover:text-white'}`}
        >
          Active Visitors
        </button>
        {(dbUser.role === 'super_admin' || dbUser.email === 'refayethossenmd@gmail.com') && (
          <>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-5 py-3 text-xs uppercase font-extrabold ${activeTab === 'users' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-500 hover:text-white'}`}
            >
              User Roles
            </button>
            <button
              onClick={() => setActiveTab('menus')}
              className={`px-5 py-3 text-xs uppercase font-extrabold ${activeTab === 'menus' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-500 hover:text-white'}`}
            >
              Menu Settings
            </button>
            <button
              onClick={() => setActiveTab('styles')}
              className={`px-5 py-3 text-xs uppercase font-extrabold ${activeTab === 'styles' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-500 hover:text-white'}`}
            >
              Global Styles
            </button>
            <button
              onClick={() => setActiveTab('storage')}
              className={`px-5 py-3 text-xs uppercase font-extrabold ${activeTab === 'storage' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-500 hover:text-white'}`}
            >
              Storage Stats
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`px-5 py-3 text-xs uppercase font-extrabold ${activeTab === 'usage' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-500 hover:text-white'}`}
            >
              Usage History
            </button>
          </>
        )}
      </div>

      {activeTab === 'pending' ? (
        <div className="space-y-4">
          {pendingChanges.length === 0 ? (
            <p className="text-gray-500 text-sm">No pending changes awaiting approval.</p>
          ) : (
            pendingChanges.map((change) => (
              <div key={change._id} className="p-4 bg-gray-900 border border-glass-border rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider text-xs">Action: <span className="text-yellow-400">{change.action}</span></h3>
                    <p className="text-xs text-gray-400">Collection: {change.collectionName}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Requested by: {change.authorEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveReject(change._id, 'approve')} className="p-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-all"><Check className="w-4 h-4" /></button>
                    <button onClick={() => handleApproveReject(change._id, 'reject')} className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-all"><X className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="bg-black/50 p-3 rounded-lg text-xs font-mono text-gray-400 overflow-x-auto border border-glass-border max-h-48 overflow-y-auto">
                  <pre>{JSON.stringify(change.data, null, 2)}</pre>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'shopify' ? (
        <div className="space-y-4">
          {pendingShopify.length === 0 ? (
            <p className="text-gray-500 text-sm">No pending Shopify codes awaiting approval.</p>
          ) : (
            pendingShopify.map((snippet) => (
              <div key={snippet._id} className="p-4 bg-gray-900 border border-glass-border rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider text-xs">Title: <span className="text-blue-400">{snippet.title}</span></h3>
                    <p className="text-[10px] text-gray-500 mt-1">Requested by: {snippet.createdBy}</p>
                    <p className="text-[10px] text-gray-500">Submitted at: {new Date(snippet.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveRejectShopify(snippet._id, 'approved')} className="p-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-all" title="Approve"><Check className="w-4 h-4" /></button>
                    <button onClick={() => handleApproveRejectShopify(snippet._id, 'rejected')} className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-all" title="Reject"><X className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="bg-black/50 p-3 rounded-lg text-xs font-mono text-gray-400 overflow-x-auto border border-glass-border max-h-48 overflow-y-auto">
                  <pre>{snippet.code}</pre>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'users' ? (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-glass-border p-4 rounded-xl space-y-4">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Create New User</h2>
            <form onSubmit={handleCreateUser} className="flex flex-col md:flex-row gap-3">
              <input
                type="email"
                placeholder="User Email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="flex-1 px-4 py-2 bg-black/50 border border-glass-border rounded-lg text-sm text-white focus:outline-none focus:border-green-500"
                required
              />
              <input
                type="text"
                placeholder="Temporary Password"
                value={newUserPass}
                onChange={(e) => setNewUserPass(e.target.value)}
                className="flex-1 px-4 py-2 bg-black/50 border border-glass-border rounded-lg text-sm text-white focus:outline-none focus:border-green-500"
                required
              />
              <button 
                type="submit" 
                disabled={isCreatingUser}
                className="px-6 py-2 bg-green-500 text-black font-bold rounded-lg text-sm hover:bg-green-400 disabled:opacity-50 transition-colors"
              >
                {isCreatingUser ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>

          <div className="relative w-full md:w-1/2">
            <input
              type="text"
              placeholder="Search users by email, name or team..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-glass-border rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allUsers
              .filter(u => 
                u.email?.toLowerCase().includes(userSearch.toLowerCase()) || 
                u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.teamName?.toLowerCase().includes(userSearch.toLowerCase())
              )
              .map((u) => (
              <div key={u._id} className="p-4 bg-gray-900 border border-glass-border rounded-xl flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-white text-sm">{u.email}</h3>
                  <p className="text-xs text-gray-400 mt-1">Role: <span className="text-green-400 font-bold uppercase">{u.role}</span></p>
                  {u.name && <p className="text-xs text-gray-500">Name: {u.name}</p>}
                  {u.teamName && <p className="text-xs text-gray-500">Team: {u.teamName}</p>}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-white/5">
                    <span>Call/Share Screen:</span>
                    <button
                      onClick={() => handleToggleCallingPermission(u._id, u.callingAllowed !== false)}
                      className={`px-2 py-0.5 rounded font-extrabold uppercase text-[9px] border transition-colors ${u.callingAllowed !== false ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'}`}
                    >
                      {u.callingAllowed !== false ? 'Allowed' : 'Blocked'}
                    </button>
                  </div>
                  {dbUser?.email === 'refayethossenmd@gmail.com' && (
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-white/5">
                      <span>Workload Metrics:</span>
                      <button
                        onClick={() => handleToggleWorkloadPermission(u._id, u.showWorkloadMetrics === true)}
                        className={`px-2 py-0.5 rounded font-extrabold uppercase text-[9px] border transition-colors ${u.showWorkloadMetrics === true ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'}`}
                      >
                        {u.showWorkloadMetrics === true ? 'Allowed' : 'Blocked'}
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-white/5">
                    <span>Page Permissions:</span>
                    <button
                      onClick={() => {
                        if (editingUserPermissionsId === u._id) {
                          setEditingUserPermissionsId(null);
                        } else {
                          setEditingUserPermissionsId(u._id);
                          setEditingUserMenus(u.allowedMenus || []);
                        }
                      }}
                      className="px-2 py-0.5 rounded font-extrabold text-[9px] border bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors uppercase"
                    >
                      {u.allowedMenus ? 'Custom' : 'Global'}
                    </button>
                  </div>
                  
                  {editingUserPermissionsId === u._id && (
                    <div className="mt-3 p-3 bg-black/50 border border-blue-500/20 rounded-lg space-y-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-blue-400 uppercase">Specific Pages</span>
                        <button 
                          onClick={() => handleSaveUserPermissions(u._id, null)}
                          className="text-[10px] px-2 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors"
                        >
                          Reset to Global
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {allAvailableMenus.map(menu => (
                          <label key={`user-${u._id}-${menu}`} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="w-3 h-3 text-blue-500 bg-gray-800 border-gray-600 rounded"
                              checked={editingUserMenus.includes(menu)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditingUserMenus([...editingUserMenus, menu]);
                                } else {
                                  setEditingUserMenus(editingUserMenus.filter(m => m !== menu));
                                }
                              }}
                            />
                            <span className="text-[10px] text-gray-300 truncate">{menu}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                        <button 
                          onClick={() => setEditingUserPermissionsId(null)}
                          className="px-3 py-1 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleSaveUserPermissions(u._id, editingUserMenus)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white font-bold rounded hover:bg-blue-500"
                        >
                          Save Override
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {u.role !== 'super_admin' && (
                  <div className="flex gap-2 flex-wrap">
                    {u.role !== 'banned' ? (
                      <>
                        {u.role === 'user' && (
                          <button onClick={() => handlePromote(u._id, 'admin')} className="text-xs px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded font-bold hover:bg-yellow-500/20 transition-all">Promote to Admin</button>
                        )}
                        {u.role === 'admin' && (
                          <button onClick={() => handlePromote(u._id, 'user')} className="text-xs px-3 py-1.5 bg-gray-500/10 border border-gray-500/20 text-gray-400 rounded font-bold hover:bg-gray-500/20 transition-all">Demote to User</button>
                        )}
                        <button onClick={() => handlePromote(u._id, 'banned')} className="text-xs px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded font-bold hover:bg-red-500/20 transition-all">Remove User</button>
                      </>
                    ) : (
                      <button onClick={() => handlePromote(u._id, 'user')} className="text-xs px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded font-bold hover:bg-green-500/20 transition-all">Restore User</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'menus' ? (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-glass-border p-6 rounded-xl space-y-4">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider text-green-400">Configure Admin Dashboard Menus</h2>
            <p className="text-xs text-gray-400 pb-2">Select which menus should be visible to Admins in their dashboard sidebar.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-glass-border">
              {allAvailableMenus.map(menu => (
                <label key={`admin-${menu}`} className="flex items-center gap-3 p-3 bg-black/30 border border-glass-border rounded-lg cursor-pointer hover:bg-black/50 transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-green-500 bg-gray-800 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                    checked={adminEnabledMenus.includes(menu)}
                    onChange={() => handleToggleMenu(menu, 'admin')}
                  />
                  <span className="text-sm text-white">{menu}</span>
                </label>
              ))}
            </div>

            <h2 className="text-white font-bold text-sm uppercase tracking-wider text-blue-400 pt-4">Configure User Dashboard Menus</h2>
            <p className="text-xs text-gray-400 pb-2">Select which menus should be visible to Normal Users in their dashboard sidebar.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allAvailableMenus.map(menu => (
                <label key={`user-${menu}`} className="flex items-center gap-3 p-3 bg-black/30 border border-glass-border rounded-lg cursor-pointer hover:bg-black/50 transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    checked={userEnabledMenus.includes(menu)}
                    onChange={() => handleToggleMenu(menu, 'user')}
                  />
                  <span className="text-sm text-white">{menu}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'storage' ? (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-glass-border p-6 rounded-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-sm uppercase tracking-wider text-green-400 flex items-center gap-2">
                  <Database className="w-4 h-4" /> System Storage Stats
                </h2>
                <p className="text-xs text-gray-400 mt-1">Real-time database allocation & free space (Super Admin only)</p>
              </div>
              <button 
                onClick={fetchStorageStats} 
                disabled={loadingStorage}
                className="px-4 py-2 bg-gray-800 border border-glass-border rounded-lg text-xs font-bold hover:bg-gray-700 disabled:opacity-50"
              >
                {loadingStorage ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {loadingStorage && !storageStats ? (
              <div className="text-center py-8 text-gray-500 text-sm">Loading storage statistics...</div>
            ) : storageStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* MongoDB Card */}
                <div className="bg-black/50 border border-glass-border p-5 rounded-lg space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white font-extrabold uppercase tracking-wide text-xs">MongoDB Database</h3>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[9px] font-bold">Mongoose</span>
                  </div>
                  
                  {storageStats.mongodb ? (
                    <>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-gray-400">Used Space</span>
                          <span className="text-white">{(storageStats.mongodb.dataSize / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-gray-400">Allocated Total</span>
                          <span className="text-white">{(storageStats.mongodb.totalAllocated / (1024 * 1024)).toFixed(0)} MB</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-gray-400">Free Space</span>
                          <span className="text-green-400 font-bold">{((storageStats.mongodb.totalAllocated - storageStats.mongodb.dataSize) / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                      </div>
                      
                      <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full" 
                          style={{ width: `${Math.min(100, (storageStats.mongodb.dataSize / storageStats.mongodb.totalAllocated) * 100)}%` }} 
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 text-right">
                        {`${((storageStats.mongodb.dataSize / storageStats.mongodb.totalAllocated) * 100).toFixed(1)}% Used`}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-red-400">Unable to fetch MongoDB stats</p>
                  )}
                </div>

                {/* Firebase Card */}
                <div className="bg-black/50 border border-glass-border p-5 rounded-lg space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white font-extrabold uppercase tracking-wide text-xs">Firebase Backend</h3>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-[9px] font-bold">Realtime / Auth</span>
                  </div>
                  
                  {storageStats.firebase ? (
                    <>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-gray-400">Used Space (Est)</span>
                          <span className="text-white">{(storageStats.firebase.usedSpace / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-gray-400">Allocated Total</span>
                          <span className="text-white">{(storageStats.firebase.totalAllocated / (1024 * 1024)).toFixed(0)} MB</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-gray-400">Free Space</span>
                          <span className="text-blue-400 font-bold">{((storageStats.firebase.totalAllocated - storageStats.firebase.usedSpace) / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                      </div>
                      
                      <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" 
                          style={{ width: `${Math.min(100, (storageStats.firebase.usedSpace / storageStats.firebase.totalAllocated) * 100)}%` }} 
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 text-right">
                        {`${((storageStats.firebase.usedSpace / storageStats.firebase.totalAllocated) * 100).toFixed(1)}% Used`}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-red-400">Unable to fetch Firebase stats</p>
                  )}
                </div>

              </div>
            ) : null}
          </div>
        </div>
      ) : activeTab === 'active-users' ? (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-glass-border p-6 rounded-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-sm uppercase tracking-wider text-green-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
                  Active Visitors ({activeVisitors.count})
                </h2>
                <p className="text-xs text-gray-400 mt-1">Users actively browsing the dashboard right now (active within the last 2 minutes)</p>
              </div>
              <button 
                onClick={fetchActiveVisitors} 
                disabled={loadingActive}
                className="px-4 py-2 bg-gray-800 border border-glass-border rounded-lg text-xs font-bold hover:bg-gray-700 disabled:opacity-50"
              >
                {loadingActive ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {loadingActive && activeVisitors.list.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm font-semibold">Loading active visitors...</div>
            ) : activeVisitors.list.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm font-semibold">No active visitors online.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeVisitors.list.map((u, i) => (
                  <div key={i} className="p-4 bg-black/40 border border-glass-border rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-emerald-800 flex items-center justify-center font-bold text-sm text-white border border-green-500/30 overflow-hidden shrink-0">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.name || u.email} className="w-full h-full object-cover" />
                      ) : (
                        (u.name || u.email).split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase()
                      )}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="text-sm font-semibold text-white truncate">{u.name || u.email.split('@')[0]}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                        {u.role}
                      </span>
                    </div>
                    {u.firebaseUid !== user?.uid && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => startCall(u.firebaseUid, u.name || u.email.split('@')[0], 'audio')}
                          className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-xl transition-all hover:scale-105"
                          title="Audio Call"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startCall(u.firebaseUid, u.name || u.email.split('@')[0], 'video')}
                          className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-xl transition-all hover:scale-105"
                          title="Video Call"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'styles' ? (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-glass-border p-6 rounded-xl space-y-6">
            <div>
              <h2 className="text-white font-bold text-sm uppercase tracking-wider text-green-400 flex items-center gap-2">
                <Palette className="w-5 h-5" /> Global Brand Styles (Super Admin Only)
              </h2>
              <p className="text-xs text-gray-400 mt-1">Configure the layout themes, font family and card border radius across all pages. Changes will apply to all team members instantly.</p>
            </div>

            {/* Global Layout Theme Selection */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-green-400" /> Global Dashboard Layout Theme
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { id: 'default', name: 'Layout 1: Neon Glassmorphic', desc: 'Futuristic glass-blur panels with neon green glow effects.' },
                  { id: 'slate', name: 'Layout 2: Clean Slate & Platinum', desc: 'Minimalist corporate look. Solid flat panels and steel headers.' },
                  { id: 'aurora', name: 'Layout 3: Aurora Gradient', desc: 'Soft purple-indigo aurora lighting with curved glass pannels.' },
                  { id: 'cyber', name: 'Layout 4: Cyberpunk Matrix', desc: 'Deep hacker terminal console with green monospace syntax.' },
                  { id: 'gold', name: 'Layout 5: Royal Gold & Onyx', desc: 'Premium gold gradient highlights on onyx black panels.' }
                ].map((l) => {
                  const isSelected = (storeSettings?.globalLayout || 'default') === l.id;
                  return (
                    <div
                      key={l.id}
                      onClick={() => updateSettings({ globalLayout: l.id })}
                      className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2 flex flex-col justify-between ${
                        isSelected 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-glass-border bg-black/40 hover:border-gray-600'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{l.name}</span>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-green-400" />}
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed">{l.desc}</p>
                      </div>
                      
                      <div className="pt-2 border-t border-glass-border/30 flex justify-between items-center text-[9px] uppercase tracking-wider">
                        <span className="text-gray-500">Status</span>
                        <span className={isSelected ? 'text-green-400 font-bold' : 'text-gray-550 font-semibold'}>
                          {isSelected ? 'Active' : 'Select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Font Family Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-4 h-4 text-green-400" /> Font Family
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'sans', name: 'Inter (Clean Sans)', fontClass: 'font-sans', desc: 'Modern high-readability sans-serif font.' },
                  { id: 'roboto', name: 'Roboto (Neo Sans)', fontClass: 'font-sans', desc: 'Sleek standard typeface for clean visuals.' },
                  { id: 'outfit', name: 'Outfit (Premium Tech)', fontClass: 'font-sans', desc: 'Elegant geometric font with a tech feeling.' },
                  { id: 'montserrat', name: 'Montserrat (Modern Bold)', fontClass: 'font-sans', desc: 'Wide geometric sans-serif for strong layouts.' },
                  { id: 'playfair', name: 'Playfair Display (Luxury)', fontClass: 'font-serif', desc: 'Classical serif typeface for luxury layouts.' },
                  { id: 'lora', name: 'Lora (Classic Book)', fontClass: 'font-serif', desc: 'Contemporary elegant serif with curves.' },
                  { id: 'fira-code', name: 'Fira Code (Hacker Mono)', fontClass: 'font-mono', desc: 'Clean monospace coding font with ligatures.' }
                ].map((f) => {
                  const isSelected = (storeSettings?.fontFamily || 'sans') === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => updateSettings({ fontFamily: f.id })}
                      className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2 ${
                        isSelected 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-glass-border bg-black/40 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{f.name}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-green-400" />}
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed">{f.desc}</p>
                      <div className="pt-1.5 border-t border-glass-border/40">
                        <span className="text-xs text-green-300/80 font-medium block">Preview:</span>
                        <span className="text-[11px] text-gray-300 mt-1 block line-clamp-1 leading-none font-bold">AaBbCc 123 - The quick brown fox</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Border Radius Selection */}
            <div className="space-y-3 pt-4 border-t border-glass-border">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Square className="w-4 h-4 text-green-400" /> Card Border Radius
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {[
                  { id: 'none', name: 'None (0px)', rClass: 'rounded-none' },
                  { id: 'sm', name: 'Small (4px)', rClass: 'rounded-sm' },
                  { id: 'md', name: 'Medium (8px)', rClass: 'rounded-md' },
                  { id: 'lg', name: 'Large (12px)', rClass: 'rounded-lg' },
                  { id: 'xl', name: 'Extra Large (16px)', rClass: 'rounded-xl' },
                  { id: '2xl', name: 'Double XL (24px)', rClass: 'rounded-2xl' },
                  { id: '3xl', name: 'Triple XL (32px)', rClass: 'rounded-3xl' }
                ].map((r) => {
                  const isSelected = (storeSettings?.borderRadius || 'xl') === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => updateSettings({ borderRadius: r.id })}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-center space-y-3 flex flex-col items-center justify-between ${
                        isSelected 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-glass-border bg-black/40 hover:border-gray-600'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-white block leading-tight">{r.name}</span>
                      
                      {/* Mini visual live card preview of the border radius level */}
                      <div className="w-12 h-12 bg-gray-800 border border-glass-border flex items-center justify-center overflow-hidden" style={{ borderRadius: 
                        r.id === 'none' ? '0px' :
                        r.id === 'sm' ? '4px' :
                        r.id === 'md' ? '8px' :
                        r.id === 'lg' ? '12px' :
                        r.id === 'xl' ? '16px' :
                        r.id === '2xl' ? '24px' : '32px'
                      }}>
                        <div className="w-6 h-6 bg-green-500/20 border border-green-500/30" style={{ borderRadius: 
                          r.id === 'none' ? '0px' :
                          r.id === 'sm' ? '2px' :
                          r.id === 'md' ? '4px' :
                          r.id === 'lg' ? '6px' :
                          r.id === 'xl' ? '8px' :
                          r.id === '2xl' ? '12px' : '16px'
                        }} />
                      </div>

                      {isSelected && <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest block">Active</span>}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      ) : activeTab === 'usage' ? (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-glass-border p-4 rounded-xl space-y-4">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">User Usage History</h2>
            <p className="text-xs text-gray-400">View what pages users have visited by date.</p>
          </div>
          <div className="relative w-full md:w-1/2 mb-4">
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-glass-border rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allUsers
              .filter(u => 
                u.email?.toLowerCase().includes(userSearch.toLowerCase()) || 
                u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.teamName?.toLowerCase().includes(userSearch.toLowerCase())
              )
              .map((u) => (
              <div key={u._id} className="p-4 bg-gray-900 border border-glass-border rounded-xl flex flex-col justify-between space-y-4 hover:border-brand-green transition-colors">
                <div>
                  <h3 className="font-bold text-white text-sm truncate">{u.name || u.email}</h3>
                  <p className="text-xs text-gray-400 mt-1">{u.email}</p>
                  {u.teamName && <p className="text-[10px] text-gray-500 mt-1 uppercase">Team: {u.teamName}</p>}
                </div>
                <button
                  onClick={() => { setSelectedUserUsage(u); setIsUsageModalOpen(true); }}
                  className="w-full py-2 bg-brand-green/10 text-brand-green text-xs font-bold rounded hover:bg-brand-green/20 transition-colors uppercase border border-brand-green/20"
                >
                  View History
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Usage History Modal */}
      <AnimatePresence>
        {isUsageModalOpen && selectedUserUsage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-gray-900 border border-glass-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-glass-border bg-gray-950">
                <h3 className="font-bold text-white uppercase text-sm">
                  Usage History: <span className="text-brand-green">{selectedUserUsage.name || selectedUserUsage.email}</span>
                </h3>
                <button onClick={() => setIsUsageModalOpen(false)} className="p-1 hover:bg-white/10 rounded transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 space-y-4">
                {(!selectedUserUsage.usageHistory || selectedUserUsage.usageHistory.length === 0) ? (
                  <p className="text-gray-500 text-sm text-center py-8">No usage history recorded yet.</p>
                ) : (
                  [...selectedUserUsage.usageHistory].reverse().map((record: any, i: number) => (
                    <div key={i} className="bg-black/40 border border-glass-border rounded-xl p-4 transition-all hover:bg-black/60">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-brand-green" /> {record.date}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {record.pages && record.pages.length > 0 ? record.pages.map((page: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 font-medium">
                            {page}
                          </span>
                        )) : (
                          <span className="text-xs text-gray-500 italic">No specific pages logged for this day.</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
