'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Check, X, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function AdminDashboard() {
  const { user, dbUser, loading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'menus' | 'storage'>('pending');
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
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
      if (!dbUser || (dbUser.role !== 'super_admin' && dbUser.role !== 'admin')) {
        router.push('/');
      } else {
        fetchPending();
        if (dbUser.role === 'super_admin') {
          fetchUsers();
        }
      }
    }
  }, [loading, dbUser, router]);

  const fetchPending = async () => {
    const res = await fetch('/api/pending');
    const data = await res.json();
    if (data.success) setPendingChanges(data.changes);
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

  const fetchUsers = async () => {
    const res = await fetch('/api/users/roles');
    const data = await res.json();
    if (data.success) setAllUsers(data.users);
  };

  const handleApproveReject = async (id: string, decision: 'approve' | 'reject') => {
    await fetch('/api/pending/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changeId: id, firebaseUid: user?.uid, decision })
    });
    fetchPending();
  };

  const handlePromote = async (userId: string, newRole: string) => {
    await fetch('/api/users/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promoterUid: user?.uid, targetUserId: userId, newRole })
    });
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

  const allAvailableMenus = [
    'Home', 'Workspace', 'Order Tracker', 'Personal Projects', 'Message Helper', 'Templates', 'Schema Builder',
    'Audit Suite', 'Projects', 'Mockup Studio', 'AI Assistant', 
    'Team Notes', 'Downloads', 'Member Profile', 'Shopify Codes', 'Settings'
  ];

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
        {dbUser.role === 'super_admin' && (
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
              onClick={() => setActiveTab('storage')}
              className={`px-5 py-3 text-xs uppercase font-extrabold ${activeTab === 'storage' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-500 hover:text-white'}`}
            >
              Storage Stats
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
      ) : null}
    </div>
  );
}
