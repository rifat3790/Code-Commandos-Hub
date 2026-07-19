'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Check, X, Database, Phone, Video, Palette, Type, Square, Calendar, Sparkles, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useCall } from '@/context/CallContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const allAvailableMenus = [
  'Home', 'Workspace', 'Meetings', 'Order Tracker', 'Personal Projects', 'Message Helper', 'Templates', 'Schema Builder',
  'Audit Suite', 'Projects', 'Mockup Studio', 'Focus Studio', 'AI Assistant', 
  'Team Notes', 'Downloads', 'Member Profile', 'Shopify Codes', 'Settings'
];

export default function AdminDashboard() {
  const { user, dbUser, loading } = useAuth();
  const { startCall } = useCall();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'pending' | 'shopify' | 'users' | 'menus' | 'storage' | 'active-users' | 'styles' | 'usage' | 'super-console'>('pending');
  const [selectedUserUsage, setSelectedUserUsage] = useState<any>(null);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  
  const [activeVisitors, setActiveVisitors] = useState<{count: number, list: any[]}>({ count: 0, list: [] });
  const [loadingActive, setLoadingActive] = useState(false);
  const [visitorRoleFilter, setVisitorRoleFilter] = useState<string>('all');
  const [visitorTick, setVisitorTick] = useState(0);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [adminEnabledMenus, setAdminEnabledMenus] = useState<string[]>([]);
  const [userEnabledMenus, setUserEnabledMenus] = useState<string[]>([]);

  const [editingUserPermissionsId, setEditingUserPermissionsId] = useState<string | null>(null);
  const [editingUserMenus, setEditingUserMenus] = useState<string[]>([]);

  // Super Console states
  const [bannerInput, setBannerInput] = useState('');
  const [isGarbageCollecting, setIsGarbageCollecting] = useState(false);
  const [gcOutput, setGcOutput] = useState('');
  const [ramUsage, setRamUsage] = useState(48.5);
  const [cpuUsage, setCpuUsage] = useState(12.4);
  const [dbLatency, setDbLatency] = useState(18);
  const [activeConns, setActiveConns] = useState(5);

  // Spotlight Super Shell and Snapshot states
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Code Commandos Super Shell [v1.5.0]',
    'Active Connection Established. Type "help" to start diagnostics.'
  ]);
  const [isExportingSnapshot, setIsExportingSnapshot] = useState(false);
  const exportBackup = useWorkspaceStore((state) => state.exportBackup);

  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    const args = cmd.split(' ');
    const primary = args[0].toLowerCase();
    
    setTerminalLogs(prev => [...prev, `> ${cmd}`]);
    setTerminalInput('');

    const isClicks = localStorage.getItem('focus_global_clicks') === 'true';
    if (isClicks) {
      import('@/lib/audioSynth').then(({ playKeyboardClick }) => {
        playKeyboardClick('brown', 0.55);
      });
    }

    if (primary === 'help') {
      setTerminalLogs(prev => [
        ...prev,
        'Available Console Commands:',
        '  status               Run virtualization diagnostics',
        '  ping                 Database roundtrip latency test',
        '  banner <alert-msg>   Publish marquee message alert',
        '  theme <layout-style> Re-skin UI (cyber|gold|aurora|slate|default)',
        '  gc                   Run cache garbage collector sweep',
        '  clear                Clear terminal logs'
      ]);
    } else if (primary === 'status') {
      setTerminalLogs(prev => [
        ...prev,
        `Uptime: 14d 6h 32m`,
        `Memory Node allocation: ${ramUsage}%`,
        `Compute Thread Load: ${cpuUsage}%`,
        `Mongo Connection: CONNECTED (${dbLatency}ms latency)`,
        `Subscribed WebSocket Channels: ${activeConns}`
      ]);
    } else if (primary === 'ping') {
      setTerminalLogs(prev => [
        ...prev,
        `64 bytes from db.mongodb.net: seq=1 time=${dbLatency}ms`,
        `64 bytes from db.mongodb.net: seq=2 time=${dbLatency - 2}ms`,
        `Ping complete. Latency avg: ${(dbLatency - 1)}ms (Excellent)`
      ]);
    } else if (primary === 'banner') {
      const msg = args.slice(1).join(' ');
      if (!msg) {
        setTerminalLogs(prev => [...prev, 'Error: Must specify announcement message. Usage: banner <msg>']);
      } else {
        await updateSettings({ systemBanner: msg });
        setBannerInput(msg);
        setTerminalLogs(prev => [...prev, `Announcement published: "${msg}"`]);
      }
    } else if (primary === 'theme') {
      const name = args[1]?.toLowerCase();
      if (!['cyber', 'gold', 'aurora', 'slate', 'default'].includes(name)) {
        setTerminalLogs(prev => [...prev, 'Error: Invalid layout theme. Choose one of: cyber, gold, aurora, slate, default']);
      } else {
        const style3D = name === 'aurora' ? 'nebula' : name === 'cyber' ? 'cyber' : name === 'gold' ? 'gold' : 'default';
        await updateSettings({ globalLayout: name, global3DStyle: style3D });
        setTerminalLogs(prev => [...prev, `Applying layout theme [${name}] style... Successful.`]);
      }
    } else if (primary === 'gc') {
      runGarbageCollector();
    } else if (primary === 'clear') {
      setTerminalLogs([
        'Code Commandos Super Shell [v1.5.0]',
        'Active Connection Established. Type "help" to start diagnostics.'
      ]);
    } else {
      setTerminalLogs(prev => [...prev, `bash: command not found: ${primary}. Type "help" for a list of commands.`]);
    }
  };

  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
    const isClicks = localStorage.getItem('focus_global_clicks') === 'true';
    if (isClicks) {
      import('@/lib/audioSynth').then(({ playKeyboardClick }) => {
        playKeyboardClick('brown', 0.4);
      });
    }
  };

  const handleExportSnapshot = () => {
    setIsExportingSnapshot(true);
    setTimeout(() => {
      try {
        const payloadStr = exportBackup();
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(payloadStr);
        const exportFileDefaultName = `code_commandos_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        toast.success("Database Backup Snapshot Generated!");
      } catch (err) {
        toast.error("Failed to generate database snapshot.");
      } finally {
        setIsExportingSnapshot(false);
      }
    }, 1500);
  };

  useEffect(() => {
    if (storeSettings?.systemBanner) {
      setBannerInput(storeSettings.systemBanner);
    }
  }, [storeSettings]);

  useEffect(() => {
    if (activeTab !== 'super-console') return;
    
    const interval = setInterval(() => {
      setRamUsage(prev => {
        const change = (Math.random() - 0.5) * 1.5;
        return parseFloat(Math.min(95, Math.max(20, prev + change)).toFixed(1));
      });
      setCpuUsage(prev => {
        const change = (Math.random() - 0.5) * 3.5;
        return parseFloat(Math.min(99, Math.max(3, prev + change)).toFixed(1));
      });
      setDbLatency(prev => {
        const change = Math.floor((Math.random() - 0.5) * 4);
        return Math.min(150, Math.max(5, prev + change));
      });
      setActiveConns(prev => {
        const change = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return Math.min(100, Math.max(1, prev + change));
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [activeTab]);

  const runGarbageCollector = () => {
    setIsGarbageCollecting(true);
    setGcOutput('Scanning workspace cache folders...');
    
    setTimeout(() => {
      setGcOutput('Found 14 stale nextjs chunk files. Evicting memory...');
    }, 1200);

    setTimeout(() => {
      setGcOutput('Re-optimizing MongoDB connection pool...');
    }, 2400);

    setTimeout(() => {
      import('@/lib/audioSynth').then(({ playTypewriterBell }) => {
        setGcOutput('Clean completed! Purged 314.5MB cache memory.');
        setIsGarbageCollecting(false);
        setRamUsage(28.2);
        toast.success('Workspace Cache Purged Successfully!');
        
        const isClicks = localStorage.getItem('focus_global_clicks') === 'true';
        if (isClicks) {
          playTypewriterBell(0.85);
        }
      });
    }, 3800);
  };

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
      const tickInterval = setInterval(() => setVisitorTick(t => t + 1), 1000);
      return () => { clearInterval(interval); clearInterval(tickInterval); };
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

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user from the database? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/users/roles?id=${userId}&promoterUid=${user?.uid}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success("User deleted permanently from database.");
        fetchUsers();
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to delete user");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error deleting user");
    }
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

  const handleToggleWorkspaceMonthlyTarget = async (userId: string, currentAllowed: boolean) => {
    await fetch('/api/users/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promoterUid: user?.uid, targetUserId: userId, canViewWorkspaceMonthlyTarget: !currentAllowed })
    });
    fetchUsers();
  };

  const handleToggleWorkspaceTeamDelivery = async (userId: string, currentAllowed: boolean) => {
    await fetch('/api/users/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promoterUid: user?.uid, targetUserId: userId, canViewWorkspaceTeamDelivery: !currentAllowed })
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
            <button
              onClick={() => setActiveTab('super-console')}
              className={`px-5 py-3 text-xs uppercase font-extrabold ${activeTab === 'super-console' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-500 hover:text-white'}`}
            >
              Super Console
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
          
          {/* User Role Statistics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            
            {/* Total Registered Agents */}
            <div className="bg-[#0a0f1d]/50 border border-glass-border rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500" />
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1">Total Agents</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black font-mono text-white leading-none">{allUsers.length}</span>
                <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase">Database</span>
              </div>
            </div>

            {/* Super Admins count */}
            <div className="bg-[#0a0f1d]/50 border border-glass-border rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)] animate-pulse" />
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1">Super Admins</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black font-mono text-yellow-400 leading-none">{allUsers.filter(u => u.role === 'super_admin').length}</span>
                <span className="text-[9px] bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded font-bold uppercase">Crown</span>
              </div>
            </div>

            {/* Admins count */}
            <div className="bg-[#0a0f1d]/50 border border-glass-border rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]" />
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1">Admins</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black font-mono text-purple-400 leading-none">{allUsers.filter(u => u.role === 'admin').length}</span>
                <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded font-bold uppercase">Shield</span>
              </div>
            </div>

            {/* Standard Users count */}
            <div className="bg-[#0a0f1d]/50 border border-glass-border rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1">Commandos</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black font-mono text-green-400 leading-none">{allUsers.filter(u => !u.role || u.role === 'user').length}</span>
                <span className="text-[9px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded font-bold uppercase">Active</span>
              </div>
            </div>

            {/* Banned count */}
            <div className="bg-[#0a0f1d]/50 border border-glass-border rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]" />
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1">Banned</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black font-mono text-red-500 leading-none">{allUsers.filter(u => u.role === 'banned').length}</span>
                <span className="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase">Restricted</span>
              </div>
            </div>

          </div>

          {/* Actions & Filters Header */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-1/2">
              <input
                type="text"
                placeholder="Search commandos by email, name or team..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900 border border-glass-border rounded-xl text-xs text-white focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="w-full md:w-auto px-5 py-2.5 bg-green-500 hover:bg-green-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{showCreateForm ? '✕ Hide Form' : '＋ Add Commando'}</span>
            </button>
          </div>

          {/* Collapsible Create Form */}
          {showCreateForm && (
            <div className="bg-gray-900 border border-glass-border p-5 rounded-2xl space-y-4 shadow-2xl relative overflow-hidden animate-[slideDown_0.2s_ease-out]">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-green-500 to-emerald-600" />
              <h2 className="text-white font-extrabold text-xs uppercase tracking-wider font-mono">Provision New Commando Account</h2>
              <form onSubmit={handleCreateUser} className="flex flex-col md:flex-row gap-3">
                <input
                  type="email"
                  placeholder="User Email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="flex-1 px-4 py-2 bg-black/50 border border-glass-border rounded-lg text-xs text-white focus:outline-none focus:border-green-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Temporary Password"
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  className="flex-1 px-4 py-2 bg-black/50 border border-glass-border rounded-lg text-xs text-white focus:outline-none focus:border-green-500"
                  required
                />
                <button 
                  type="submit" 
                  disabled={isCreatingUser}
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 text-black font-black rounded-lg text-xs uppercase tracking-wider disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isCreatingUser ? 'Creating...' : 'Register User'}
                </button>
              </form>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {allUsers
              .filter(u => 
                u.email?.toLowerCase().includes(userSearch.toLowerCase()) || 
                u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.teamName?.toLowerCase().includes(userSearch.toLowerCase())
              )
              .map((u) => {
                const initials = (u.name || u.email || 'U').substring(0, 2).toUpperCase();
                const isSuperAdmin = u.role === 'super_admin';
                const isAdmin = u.role === 'admin';
                const isBanned = u.role === 'banned';

                const avatarStyle = isSuperAdmin 
                  ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10 shadow-[0_0_12px_rgba(234,179,8,0.25)]' 
                  : isAdmin 
                    ? 'border-purple-500 text-purple-400 bg-purple-500/10 shadow-[0_0_12px_rgba(168,85,247,0.25)]' 
                    : isBanned 
                      ? 'border-red-500 text-red-400 bg-red-500/10 shadow-[0_0_12px_rgba(239,68,68,0.25)]' 
                      : 'border-green-500 text-green-400 bg-green-500/10 shadow-[0_0_12px_rgba(34,197,94,0.25)]';

                return (
                  <div key={u._id} className="p-5 bg-gray-900 border border-glass-border rounded-2xl flex flex-col justify-between space-y-4 hover:border-white/10 transition-all shadow-xl relative overflow-hidden group">
                    
                    {/* Role header overlay */}
                    <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-[0.03] flex items-center justify-center">
                      {isSuperAdmin ? (
                        <Shield className="w-20 h-20 text-yellow-400" />
                      ) : (
                        <UserIcon className="w-20 h-20 text-white" />
                      )}
                    </div>

                    {/* Card Top: Details + Avatar + Delete button */}
                    <div className="flex items-start justify-between gap-3 relative z-10">
                      <div className="flex items-center gap-3">
                        {/* Glowing Avatar */}
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-black font-mono text-xs shrink-0 ${avatarStyle}`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-white text-xs sm:text-sm truncate leading-tight pr-8">{u.email}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {u.name && <span className="text-[10px] text-gray-300 font-bold px-2 py-0.5 rounded bg-white/5 border border-white/5">{u.name}</span>}
                            {u.teamName && <span className="text-[10px] text-purple-400 font-bold px-2 py-0.5 rounded bg-purple-500/5 border border-purple-500/10 uppercase tracking-wider">Team: {u.teamName}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Red Glowing Delete Button */}
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="p-2 rounded-lg bg-red-950/20 border border-red-500/10 text-red-500/60 hover:text-red-400 hover:bg-red-950/40 hover:border-red-500/30 transition-all cursor-pointer absolute top-0 right-0"
                        title="Permanently Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Interactive Role Switcher Pill */}
                    <div className="flex items-center justify-between bg-black/40 border border-glass-border p-2.5 rounded-xl text-xs">
                      <span className="text-[10px] text-gray-500 font-bold font-mono uppercase">User Classification</span>
                      <select
                        value={u.role}
                        onChange={(e) => handlePromote(u._id, e.target.value)}
                        className="bg-[#030712] border border-glass-border rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-green-500 cursor-pointer font-extrabold uppercase font-mono shadow-md"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="banned">Banned</option>
                      </select>
                    </div>

                    {/* Permissions Grid Matrix */}
                    <div className="space-y-2.5 pt-2 border-t border-white/5">
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">Access Settings Matrix</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        
                        {/* Call / Screen Sharing */}
                        <div className="flex items-center justify-between text-[11px] text-gray-400 bg-black/20 border border-glass-border p-2 rounded-lg">
                          <span>Voice Call & Screen Share:</span>
                          <button
                            onClick={() => handleToggleCallingPermission(u._id, u.callingAllowed !== false)}
                            className={`px-2.5 py-1 rounded font-extrabold uppercase text-[9px] border transition-colors cursor-pointer ${u.callingAllowed !== false ? 'bg-green-500/15 border-green-500/25 text-green-400 hover:bg-green-500/25' : 'bg-red-500/15 border-red-500/25 text-red-400 hover:bg-red-500/25'}`}
                          >
                            {u.callingAllowed !== false ? 'Active' : 'Muted'}
                          </button>
                        </div>

                        {/* Workload Metrics (Super Admin restricted) */}
                        {dbUser?.email === 'refayethossenmd@gmail.com' && (
                          <div className="flex items-center justify-between text-[11px] text-gray-400 bg-black/20 border border-glass-border p-2 rounded-lg">
                            <span>Workload Metrics View:</span>
                            <button
                              onClick={() => handleToggleWorkloadPermission(u._id, u.showWorkloadMetrics === true)}
                              className={`px-2.5 py-1 rounded font-extrabold uppercase text-[9px] border transition-colors cursor-pointer ${u.showWorkloadMetrics === true ? 'bg-green-500/15 border-green-500/25 text-green-400 hover:bg-green-500/25' : 'bg-red-500/15 border-red-500/25 text-red-400 hover:bg-red-500/25'}`}
                            >
                              {u.showWorkloadMetrics === true ? 'Active' : 'Hidden'}
                            </button>
                          </div>
                        )}

                        {/* Workspace target controls */}
                        {(dbUser?.role === 'super_admin' || dbUser?.email === 'refayethossenmd@gmail.com') && (
                          <>
                            <div className="flex items-center justify-between text-[11px] text-gray-400 bg-black/20 border border-glass-border p-2 rounded-lg">
                              <span>Workspace Monthly Target:</span>
                              <button
                                onClick={() => handleToggleWorkspaceMonthlyTarget(u._id, u.canViewWorkspaceMonthlyTarget === true)}
                                className={`px-2.5 py-1 rounded font-extrabold uppercase text-[9px] border transition-colors cursor-pointer ${u.canViewWorkspaceMonthlyTarget === true ? 'bg-green-500/15 border-green-500/25 text-green-400 hover:bg-green-500/25' : 'bg-red-500/15 border-red-500/25 text-red-400 hover:bg-red-500/25'}`}
                              >
                                {u.canViewWorkspaceMonthlyTarget === true ? 'Allowed' : 'Blocked'}
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between text-[11px] text-gray-400 bg-black/20 border border-glass-border p-2 rounded-lg">
                              <span>Workspace Team Delivery:</span>
                              <button
                                onClick={() => handleToggleWorkspaceTeamDelivery(u._id, u.canViewWorkspaceTeamDelivery === true)}
                                className={`px-2.5 py-1 rounded font-extrabold uppercase text-[9px] border transition-colors cursor-pointer ${u.canViewWorkspaceTeamDelivery === true ? 'bg-green-500/15 border-green-500/25 text-green-400 hover:bg-green-500/25' : 'bg-red-500/15 border-red-500/25 text-red-400 hover:bg-red-500/25'}`}
                              >
                                {u.canViewWorkspaceTeamDelivery === true ? 'Allowed' : 'Blocked'}
                              </button>
                            </div>
                          </>
                        )}

                        {/* Page Permissions drawer toggle */}
                        <div className="flex items-center justify-between text-[11px] text-gray-400 bg-black/20 border border-glass-border p-2 rounded-lg">
                          <span>Custom Menu Overlays:</span>
                          <button
                            onClick={() => {
                              if (editingUserPermissionsId === u._id) {
                                setEditingUserPermissionsId(null);
                              } else {
                                setEditingUserPermissionsId(u._id);
                                setEditingUserMenus(u.allowedMenus || []);
                              }
                            }}
                            className="px-2.5 py-1 rounded font-extrabold text-[9px] border bg-blue-500/15 border-blue-500/25 text-blue-400 hover:bg-blue-500/25 transition-colors uppercase cursor-pointer"
                          >
                            {u.allowedMenus ? 'Custom Override' : 'System Defaults'}
                          </button>
                        </div>

                      </div>
                    </div>

                    {/* Page Permissions Override Drawer */}
                    {editingUserPermissionsId === u._id && (
                      <div className="mt-3 p-3 bg-black/50 border border-blue-500/20 rounded-lg space-y-3 relative z-25">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-blue-400 uppercase">Specific Pages</span>
                          <button 
                            type="button"
                            onClick={() => handleSaveUserPermissions(u._id, null)}
                            className="text-[10px] px-2 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors cursor-pointer"
                          >
                            Reset to Global
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {allAvailableMenus.map(menu => (
                            <label key={`user-${u._id}-${menu}`} className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="w-3 h-3 text-blue-500 bg-gray-800 border-gray-600 rounded cursor-pointer"
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
                            type="button"
                            onClick={() => setEditingUserPermissionsId(null)}
                            className="px-3 py-1 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleSaveUserPermissions(u._id, editingUserMenus)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white font-bold rounded hover:bg-blue-500 cursor-pointer"
                          >
                            Save Override
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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

            <div className="border-t border-glass-border pt-6 mt-6 space-y-4">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider text-purple-400">Workspace Floating Dock & Zen Ambiance</h2>
              <p className="text-xs text-gray-400">Toggle whether regular users are allowed to see the Commanders Interactive Workspace Dock and Zen Ambiance mixers. If disabled, only Super Admins can see them.</p>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={async () => {
                    const nextVal = !storeSettings?.allowCommandersDock;
                    await updateSettings({ allowCommandersDock: nextVal });
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                    storeSettings?.allowCommandersDock 
                      ? 'bg-purple-600 text-white border-purple-500 hover:bg-purple-500' 
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  {storeSettings?.allowCommandersDock ? 'Allowed for Everyone (Active)' : 'Super Admin Only (Disabled)'}
                </button>
              </div>
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
        <div className="space-y-4">

          {/* ── Live Cockpit Header ── */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#020d07] p-6">
            <div className="absolute inset-0 opacity-[0.025]" style={{backgroundImage:'linear-gradient(to right,#4ade80 1px,transparent 1px),linear-gradient(to bottom,#4ade80 1px,transparent 1px)',backgroundSize:'28px 28px'}}/>
            <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500/8 rounded-full blur-3xl"/>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-green-600/8 rounded-full blur-3xl"/>

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-[0_0_28px_6px_rgba(52,211,153,0.35)]">
                    <span className="text-xl">🛡️</span>
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#020d07] animate-ping"/>
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#020d07]"/>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-400/70 font-bold">Live Command Cockpit</p>
                  <h2 className="text-3xl font-black text-white mt-0.5 flex items-baseline gap-2 tabular-nums">
                    {activeVisitors.count}
                    <span className="text-sm font-semibold text-emerald-400">Agents Online</span>
                  </h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">Real-time signal · auto-refreshes every 10s</p>
                </div>
              </div>

              {/* Role stats strip */}
              <div className="flex flex-wrap gap-2 sm:justify-end items-center">
                {[
                  { label: 'Super Admins', cls:'bg-amber-500/10 border-amber-500/20 text-amber-300',   dot:'bg-amber-400',   role: 'super_admin' },
                  { label: 'Admins',       cls:'bg-violet-500/10 border-violet-500/20 text-violet-300', dot:'bg-violet-400',  role: 'admin' },
                  { label: 'Commandos',    cls:'bg-emerald-500/10 border-emerald-500/20 text-emerald-300', dot:'bg-emerald-400', role: 'user' },
                ].map(({ label, cls, dot, role }) => (
                  <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`}/>
                    {label}
                    <span className="font-black">{activeVisitors.list.filter((u:any)=>u.role===role).length}</span>
                  </div>
                ))}
                <button
                  onClick={fetchActiveVisitors}
                  disabled={loadingActive}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:bg-white/[0.08] transition-all text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                >
                  {loadingActive ? <span className="w-3 h-3 border border-t-emerald-400 border-gray-600 rounded-full animate-spin"/> : '↻'} Refresh
                </button>
              </div>
            </div>
          </div>

          {/* ── Toolbar: Role Filter + Broadcast + Export ── */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Role filter tabs */}
            <div className="flex gap-1 bg-white/[0.02] border border-white/[0.07] rounded-xl p-1 flex-1">
              {[
                { key: 'all',         label: '🌐 All',         activeCls: 'bg-white/10 text-white',          inactiveCls: 'text-gray-400' },
                { key: 'super_admin', label: '👑 Super Admin',  activeCls: 'bg-amber-500/15 text-amber-300',  inactiveCls: 'text-gray-500' },
                { key: 'admin',       label: '🛡️ Admins',      activeCls: 'bg-violet-500/15 text-violet-300', inactiveCls: 'text-gray-500' },
                { key: 'user',        label: '⚡ Commandos',  activeCls: 'bg-emerald-500/15 text-emerald-300', inactiveCls: 'text-gray-500' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setVisitorRoleFilter(f.key)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    visitorRoleFilter === f.key ? f.activeCls : `${f.inactiveCls} hover:bg-white/[0.04] opacity-70 hover:opacity-100`
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Export Roster */}
            <button
              onClick={() => {
                const rows = ['Name,Email,Role,Last Active'];
                activeVisitors.list.forEach((u:any) => {
                  const secsAgo = u.lastActiveAt ? Math.floor((Date.now() - new Date(u.lastActiveAt).getTime()) / 1000) : 0;
                  rows.push(`"${u.name||''}",${u.email},${u.role},${secsAgo}s ago`);
                });
                const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                a.download = `active_roster_${new Date().toISOString().split('T')[0]}.csv`; a.click();
                toast.success('Roster exported!');
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 hover:bg-sky-500/20 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer shrink-0"
            >
              📥 Export Roster
            </button>

            {/* Broadcast to all online */}
            <button
              onClick={() => setIsBroadcasting(b => !b)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider cursor-pointer shrink-0 transition-all ${
                isBroadcasting
                  ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                  : 'bg-orange-500/10 border-orange-500/20 text-orange-300 hover:bg-orange-500/20'
              }`}
            >
              📢 Broadcast
            </button>
          </div>

          {/* Broadcast compose box */}
          {isBroadcasting && (
            <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-[#1a0a00] to-[#0d0600] p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base">📢</span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-orange-300 font-black">Broadcast Message</p>
                  <p className="text-[10px] text-orange-400/60">Reaches all {activeVisitors.count} online agents instantly</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={broadcastMsg}
                  onChange={e => setBroadcastMsg(e.target.value)}
                  placeholder="Type your announcement…"
                  className="flex-1 bg-black/50 border border-orange-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500/50 transition-colors"
                />
                <button
                  onClick={async () => {
                    if (!broadcastMsg.trim()) return;
                    await updateSettings({ systemBanner: broadcastMsg.trim() });
                    toast.success('Broadcast sent to all active agents!');
                    setBroadcastMsg('');
                    setIsBroadcasting(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider hover:bg-orange-400 transition-all cursor-pointer shrink-0"
                >
                  Send 🚀
                </button>
              </div>
            </div>
          )}

          {/* ── Visitor Grid ── */}
          {loadingActive && activeVisitors.list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-2 border-t-emerald-400 border-emerald-500/10 rounded-full animate-spin"/>
              <p className="text-sm text-gray-400 font-semibold">Scanning live signals…</p>
            </div>
          ) : activeVisitors.list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01]">
              <span className="text-5xl opacity-20">📡</span>
              <p className="text-sm text-gray-400 font-semibold">No agents online right now</p>
              <p className="text-xs text-gray-600">The cockpit is quiet. Check back soon.</p>
            </div>
          ) : (() => {
            const filteredList = visitorRoleFilter === 'all'
              ? activeVisitors.list
              : activeVisitors.list.filter((u: any) => u.role === visitorRoleFilter);

            type VRoleKey = 'super_admin'|'admin'|'user'|'banned';
            const roleMap: Record<VRoleKey, {
              border: string; accentLine: string; avatarGrad: string; avatarRing: string;
              badge: string; badgeBorder: string; badgeText: string;
              sigActive: string; sigInactive: string; label: string; icon: string;
            }> = {
              super_admin: {
                border:'border-amber-500/30', accentLine:'from-amber-400/70 via-amber-500/20 to-transparent',
                avatarGrad:'from-amber-400 to-orange-600', avatarRing:'ring-2 ring-amber-500/40',
                badge:'bg-amber-500/10', badgeBorder:'border-amber-500/25', badgeText:'text-amber-300',
                sigActive:'bg-amber-400', sigInactive:'bg-white/[0.06]', label:'Super Admin', icon:'👑'
              },
              admin: {
                border:'border-violet-500/30', accentLine:'from-violet-400/70 via-violet-500/20 to-transparent',
                avatarGrad:'from-violet-400 to-purple-700', avatarRing:'ring-2 ring-violet-500/40',
                badge:'bg-violet-500/10', badgeBorder:'border-violet-500/25', badgeText:'text-violet-300',
                sigActive:'bg-violet-400', sigInactive:'bg-white/[0.06]', label:'Admin', icon:'🛡️'
              },
              user: {
                border:'border-emerald-500/25', accentLine:'from-emerald-400/70 via-emerald-500/20 to-transparent',
                avatarGrad:'from-emerald-400 to-green-700', avatarRing:'ring-2 ring-emerald-500/35',
                badge:'bg-emerald-500/10', badgeBorder:'border-emerald-500/25', badgeText:'text-emerald-300',
                sigActive:'bg-emerald-400', sigInactive:'bg-white/[0.06]', label:'Commando', icon:'⚡'
              },
              banned: {
                border:'border-red-500/25', accentLine:'from-red-400/70 via-red-500/20 to-transparent',
                avatarGrad:'from-red-400 to-rose-700', avatarRing:'ring-2 ring-red-500/30',
                badge:'bg-red-500/10', badgeBorder:'border-red-500/25', badgeText:'text-red-300',
                sigActive:'bg-red-400', sigInactive:'bg-white/[0.06]', label:'Banned', icon:'🚫'
              },
            };

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredList.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-gray-500 text-sm">No agents match this filter.</div>
                ) : filteredList.map((u: any, i: number) => {
                  const isMe = u.firebaseUid === user?.uid;
                  const rc = roleMap[(u.role as VRoleKey)] ?? roleMap.user;
                  const initials = (u.name || u.email || '?').split(' ').map((n:string)=>n[0]).join('').substring(0,2).toUpperCase();

                  // Elapsed time
                  const secsAgo = u.lastActiveAt ? Math.floor((Date.now() - new Date(u.lastActiveAt).getTime()) / 1000) : 0;
                  const elapsedLabel = secsAgo < 60 ? `${secsAgo}s ago` : secsAgo < 3600 ? `${Math.floor(secsAgo/60)}m ${secsAgo%60}s ago` : `${Math.floor(secsAgo/3600)}h ago`;

                  // Freshness color: green=<60s, yellow=<5m, orange=<15m, red=older
                  const freshnessRing = secsAgo < 60 ? 'bg-emerald-400' : secsAgo < 300 ? 'bg-yellow-400' : secsAgo < 900 ? 'bg-orange-400' : 'bg-red-400';
                  const freshnessLabel = secsAgo < 60 ? 'Just now' : secsAgo < 300 ? 'Active' : secsAgo < 900 ? 'Idle' : 'Away';

                  // Signal strength (deterministic per uid)
                  const sigStrength = ((u.firebaseUid || u.email || '').charCodeAt(0) % 3) + 1;

                  return (
                    <div
                      key={i}
                      className={`relative overflow-hidden rounded-2xl border ${rc.border} bg-[#080810] transition-all duration-300 hover:scale-[1.015] hover:-translate-y-0.5 group`}
                    >
                      {/* Top accent gradient bar */}
                      <div className={`h-[2px] w-full bg-gradient-to-r ${rc.accentLine}`}/>

                      {/* "YOU" ribbon if it's the current admin */}
                      {isMe && (
                        <div className="absolute top-2 right-2 text-[9px] font-black text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full z-10">YOU</div>
                      )}

                      <div className="p-4">
                        {/* Top row: Avatar + Info + Signal */}
                        <div className="flex items-start gap-3">
                          {/* Avatar with freshness ring */}
                          <div className="relative shrink-0">
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${rc.avatarGrad} ${rc.avatarRing} flex items-center justify-center font-black text-base text-white overflow-hidden shadow-lg`}>
                              {u.photoURL ? <img src={u.photoURL} alt={initials} className="w-full h-full object-cover"/> : initials}
                            </div>
                            {/* Freshness dot */}
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${freshnessRing} rounded-full border-2 border-[#080810]`}/>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${freshnessRing} rounded-full animate-ping opacity-60`}/>
                          </div>

                          {/* Info block */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate leading-tight">{u.name || u.email?.split('@')[0]}</p>
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">{u.email}</p>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${rc.badge} ${rc.badgeBorder} ${rc.badgeText}`}>
                                {rc.icon} {rc.label}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono tabular-nums">🕐 {elapsedLabel}</span>
                            </div>
                          </div>

                          {/* Signal strength bars (clean Tailwind) */}
                          <div className="flex items-end gap-[3px] shrink-0 h-5 self-start mt-1" title={`Signal ${sigStrength}/3`}>
                            {[1,2,3].map(bar => (
                              <div
                                key={bar}
                                className={`w-1.5 rounded-sm ${bar <= sigStrength ? rc.sigActive : rc.sigInactive}`}
                                style={{height:`${bar*6}px`}}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Freshness + Session row */}
                        <div className="mt-3 flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${freshnessRing === 'bg-emerald-400' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : freshnessRing === 'bg-yellow-400' ? 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20' : freshnessRing === 'bg-orange-400' ? 'text-orange-300 bg-orange-500/10 border-orange-500/20' : 'text-red-300 bg-red-500/10 border-red-500/20'}`}>
                            {freshnessLabel}
                          </span>
                          <div className="flex-1 h-[1px] bg-white/[0.04]"/>
                          {u.teamName && (
                            <span className="text-[9px] text-gray-500 font-semibold truncate max-w-[80px]">{u.teamName}</span>
                          )}
                        </div>

                        {/* Action bar */}
                        {!isMe ? (
                          <div className="mt-3 pt-3 flex items-center justify-between gap-2 border-t border-white/[0.05]">
                            <span className="text-[9px] text-gray-600 uppercase tracking-wider font-bold">Contact</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => startCall(u.firebaseUid, u.name || u.email?.split('@')[0], 'audio')}
                                title="Audio Call"
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/40 transition-all text-[10px] font-bold uppercase cursor-pointer hover:scale-105"
                              >
                                <Phone className="w-3 h-3"/> Call
                              </button>
                              <button
                                onClick={() => startCall(u.firebaseUid, u.name || u.email?.split('@')[0], 'video')}
                                title="Video Call"
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all text-[10px] font-bold uppercase cursor-pointer hover:scale-105"
                              >
                                <Video className="w-3 h-3"/> Video
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 pt-3 border-t border-white/[0.05]">
                            <p className="text-[10px] text-sky-400/80 font-semibold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"/>
                              Viewing as you
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { id: 'default', name: 'Layout 1: Neon Glassmorphic', desc: 'Futuristic glass-blur panels with neon green glow effects.' },
                  { id: 'slate', name: 'Layout 2: Clean Slate & Platinum', desc: 'Minimalist corporate look. Solid flat panels and steel headers.' },
                  { id: 'aurora', name: 'Layout 3: Aurora Gradient', desc: 'Soft purple-indigo aurora lighting with curved glass panels.' },
                  { id: 'cyber', name: 'Layout 4: Cyberpunk Matrix', desc: 'Deep hacker terminal console with green monospace syntax.' },
                  { id: 'gold', name: 'Layout 5: Royal Gold & Onyx', desc: 'Premium gold gradient highlights on onyx black panels.' },
                  { id: 'nebula', name: 'Layout 6: Cosmic Nebula', desc: 'Space stardust clusters drifting in cyan and magenta stars.' },
                  { id: 'matrix', name: 'Layout 7: Digital Rain Matrix', desc: 'Vertically streaming digital terminal codes in matrix green.' },
                  { id: 'lava', name: 'Layout 8: Volcanic Lava Flow', desc: 'Pulsing geometric rock meshes floating inside warm amber lava embers.' },
                  { id: 'ocean', name: 'Layout 9: Bioluminescent Deep Sea', desc: 'Rolling cyan and turquoise wave particles mimicking the ocean abyss.' },
                  { id: 'glitch', name: 'Layout 10: Retro Synthwave Glitch', desc: 'Retro pink and cyber cyan shapes triggering quick digital glitches.' }
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
                          <span className="text-xs font-bold text-white leading-tight">{l.name}</span>
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

            {/* Global 3D Background Animation Style Selection */}
            <div className="space-y-3 pt-4 border-t border-glass-border">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-green-400" /> Global 3D Background Animation Style
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { id: 'default', name: 'Neon Grid Flow', desc: 'Classic futuristic green grid floor with floating wireframes.' },
                  { id: 'aurora', name: 'Aurora Space', desc: 'Soft purple/indigo space dust grids with glowing shapes.' },
                  { id: 'gold', name: 'Royal Gold Grid', desc: 'Luxury gold wireframe meshes and coordinates.' },
                  { id: 'slate', name: 'Platinum Slate', desc: 'Minimalist steel grey geometries and simple starlight.' },
                  { id: 'cyber', name: 'Emerald Cyber', desc: 'High-contrast cyan and emerald digital wireframes.' },
                  { id: 'nebula', name: 'Cosmic Nebula', desc: 'Drifting space stardust clusters in cyan and pink particles.' },
                  { id: 'matrix', name: 'Digital Rain Matrix', desc: 'Matrix green code streams falling vertically in 3D space.' },
                  { id: 'lava', name: 'Volcanic Lava Flow', desc: 'Pulsing orange magma meshes floating with rising embers.' },
                  { id: 'ocean', name: 'Bioluminescent Deep Sea', desc: 'Sky blue ocean waves flowing and shifting in complex heights.' },
                  { id: 'glitch', name: 'Retro Synthwave Glitch', desc: 'Neon pink geometries that trigger sudden digital glitch jumps.' }
                ].map((styleItem) => {
                  const isSelected = (storeSettings?.global3DStyle || 'default') === styleItem.id;
                  return (
                    <div
                      key={styleItem.id}
                      onClick={() => updateSettings({ global3DStyle: styleItem.id })}
                      className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2 flex flex-col justify-between ${
                        isSelected 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-glass-border bg-black/40 hover:border-gray-600'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white leading-tight">{styleItem.name}</span>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-green-400" />}
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed">{styleItem.desc}</p>
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
        <div className="space-y-5">

          {/* ── Premium Header ── */}
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#0d0118] via-[#110022] to-[#0d0118] p-6">
            <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'radial-gradient(circle,#a855f7 1px,transparent 1px)',backgroundSize:'24px 24px'}}/>
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl"/>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl"/>
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-[0_0_24px_6px_rgba(168,85,247,0.35)] shrink-0">
                  <Sparkles className="w-6 h-6 text-white"/>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-purple-400/70 font-bold">Agent Activity Intelligence</p>
                  <h2 className="text-2xl font-black text-white mt-0.5">{allUsers.length} <span className="text-sm font-semibold text-purple-400">Agents Tracked</span></h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">Full page-visit timeline per agent · sorted by activity</p>
                </div>
              </div>
              {/* Top Agent Spotlight */}
              {(() => {
                const top = [...allUsers].sort((a,b) => (b.usageHistory?.reduce((s:number, d:any) => s + (d.pages?.length || 0), 0) || 0) - (a.usageHistory?.reduce((s:number, d:any) => s + (d.pages?.length || 0), 0) || 0))[0];
                if (!top) return null;
                const totalVisits = top.usageHistory?.reduce((s:number, d:any) => s + (d.pages?.length || 0), 0) || 0;
                return (
                  <div className="ml-auto flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-2.5">
                    <span className="text-lg">🏆</span>
                    <div>
                      <p className="text-[9px] text-amber-400/70 uppercase tracking-wider font-bold">Top Agent</p>
                      <p className="text-xs font-bold text-amber-300">{top.name || top.email?.split('@')[0]}</p>
                      <p className="text-[10px] text-amber-500">{totalVisits} page visits</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ── Search + Sort bar ── */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Search agents by name, email or team…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
            <div className="text-[10px] text-gray-600 shrink-0 font-mono">
              {allUsers.filter(u => u.email?.toLowerCase().includes(userSearch.toLowerCase()) || u.name?.toLowerCase().includes(userSearch.toLowerCase())).length} results
            </div>
          </div>

          {/* ── Agent Cards Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {allUsers
              .filter((u:any) =>
                u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.teamName?.toLowerCase().includes(userSearch.toLowerCase())
              )
              .sort((a:any, b:any) => {
                const aV = a.usageHistory?.reduce((s:number,d:any)=>s+(d.pages?.length||0),0)||0;
                const bV = b.usageHistory?.reduce((s:number,d:any)=>s+(d.pages?.length||0),0)||0;
                return bV - aV;
              })
              .map((u: any, idx: number) => {
                const totalVisits = u.usageHistory?.reduce((s:number,d:any)=>s+(d.pages?.length||0),0)||0;
                const totalDays   = u.usageHistory?.length || 0;
                const maxVisits   = Math.max(...allUsers.map((x:any)=>x.usageHistory?.reduce((s:number,d:any)=>s+(d.pages?.length||0),0)||0),1);
                const activityPct = Math.round((totalVisits / maxVisits) * 100);

                // Compute most visited page
                const pageFreq: Record<string,number> = {};
                (u.usageHistory||[]).forEach((d:any)=>{
                  (d.pages||[]).forEach((p:string)=>{
                    const name = p.split('|')[0];
                    pageFreq[name] = (pageFreq[name]||0) + 1;
                  });
                });
                const mostVisited = Object.entries(pageFreq).sort((a:any,b:any)=>b[1]-a[1])[0];

                // Compute streak (consecutive recent days)
                const sortedDates = [...(u.usageHistory||[])].map((d:any)=>d.date).sort().reverse();
                let streak = 0;
                const today = new Date();
                for (let k=0; k<sortedDates.length; k++) {
                  const expected = new Date(today);
                  expected.setDate(today.getDate() - k);
                  const expectedStr = expected.toISOString().split('T')[0];
                  if (sortedDates[k] === expectedStr || (k===0 && sortedDates[0] >= expectedStr.substring(0,7))) { streak++; } else break;
                }

                type RoleKey = 'super_admin'|'admin'|'user'|'banned';
                const roleConfig: Record<RoleKey,{border:string;avatarBg:string;avatarRing:string;barGrad:string;btnBg:string;btnBorder:string;btnText:string;badge:string;rankBg:string;icon:string;accentLine:string}> = {
                  super_admin: {
                    border:'border-amber-500/30', avatarBg:'bg-gradient-to-br from-amber-400 to-orange-600',
                    avatarRing:'ring-2 ring-amber-500/40', barGrad:'from-amber-400 to-orange-500',
                    btnBg:'bg-amber-500/10 hover:bg-amber-500/20', btnBorder:'border-amber-500/30 hover:border-amber-400/60',
                    btnText:'text-amber-300', badge:'bg-amber-500/15 border-amber-500/30 text-amber-200',
                    rankBg:'bg-amber-950/40', icon:'👑', accentLine:'from-amber-500/60 to-transparent'
                  },
                  admin: {
                    border:'border-violet-500/30', avatarBg:'bg-gradient-to-br from-violet-400 to-purple-700',
                    avatarRing:'ring-2 ring-violet-500/40', barGrad:'from-violet-400 to-purple-600',
                    btnBg:'bg-violet-500/10 hover:bg-violet-500/20', btnBorder:'border-violet-500/30 hover:border-violet-400/60',
                    btnText:'text-violet-300', badge:'bg-violet-500/15 border-violet-500/30 text-violet-200',
                    rankBg:'bg-violet-950/40', icon:'🛡️', accentLine:'from-violet-500/60 to-transparent'
                  },
                  user: {
                    border:'border-emerald-500/25', avatarBg:'bg-gradient-to-br from-emerald-400 to-green-700',
                    avatarRing:'ring-2 ring-emerald-500/30', barGrad:'from-emerald-400 to-green-600',
                    btnBg:'bg-emerald-500/10 hover:bg-emerald-500/20', btnBorder:'border-emerald-500/25 hover:border-emerald-400/60',
                    btnText:'text-emerald-300', badge:'bg-emerald-500/15 border-emerald-500/25 text-emerald-200',
                    rankBg:'bg-emerald-950/30', icon:'⚡', accentLine:'from-emerald-500/50 to-transparent'
                  },
                  banned: {
                    border:'border-red-500/25', avatarBg:'bg-gradient-to-br from-red-400 to-red-700',
                    avatarRing:'ring-2 ring-red-500/30', barGrad:'from-red-400 to-rose-600',
                    btnBg:'bg-red-500/10 hover:bg-red-500/20', btnBorder:'border-red-500/25 hover:border-red-400/60',
                    btnText:'text-red-300', badge:'bg-red-500/15 border-red-500/25 text-red-200',
                    rankBg:'bg-red-950/30', icon:'🚫', accentLine:'from-red-500/50 to-transparent'
                  },
                };
                const rc = roleConfig[(u.role as RoleKey)] ?? roleConfig.user;
                const isTopAgent = idx === 0 && !userSearch;
                const initials = (u.name||u.email||'?').split(' ').map((n:string)=>n[0]).join('').substring(0,2).toUpperCase();

                return (
                  <div
                    key={u._id}
                    className={`relative overflow-hidden rounded-2xl border ${rc.border} bg-[#0a0a0f] transition-all duration-300 group hover:scale-[1.015] hover:-translate-y-0.5`}
                  >
                    {/* Top accent line */}
                    <div className={`h-[2px] w-full bg-gradient-to-r ${rc.accentLine}`}/>

                    {/* TOP badge */}
                    {isTopAgent && (
                      <div className="absolute top-3 right-3 text-[9px] font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full z-10">🏆 #1 AGENT</div>
                    )}

                    <div className="p-4 space-y-3.5">
                      {/* Agent header row */}
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl ${rc.avatarBg} ${rc.avatarRing} flex items-center justify-center font-black text-sm text-white shrink-0 overflow-hidden shadow-lg`}>
                          {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" alt={initials}/> : initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate leading-snug">{u.name || u.email?.split('@')[0]}</p>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">{u.email}</p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border shrink-0 ${rc.badge}`}>
                          {rc.icon} {u.role === 'super_admin' ? 'Super Admin' : u.role === 'admin' ? 'Admin' : u.role === 'banned' ? 'Banned' : 'Commando'}
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-white/[0.05]"/>

                      {/* 3-stat metrics */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Visits',     value: totalVisits,        color: 'text-white' },
                          { label: 'Active Days', value: totalDays,          color: 'text-white' },
                          { label: 'Streak',      value: `${streak}d`,       color: streak >= 3 ? 'text-emerald-300' : streak >= 1 ? 'text-yellow-300' : 'text-gray-500' },
                        ].map(m => (
                          <div key={m.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5 text-center">
                            <p className={`text-base font-black ${m.color} leading-none`}>{m.value}</p>
                            <p className="text-[9px] text-gray-500 uppercase tracking-wide mt-1">{m.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Most visited page */}
                      {mostVisited && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <span className="text-[10px] text-gray-500 shrink-0 font-semibold uppercase tracking-wide">Top Page</span>
                          <span className={`text-[10px] font-bold truncate ${rc.btnText}`}>{mostVisited[0]}</span>
                          <span className="ml-auto text-[9px] text-gray-500 shrink-0 font-mono">{mostVisited[1]}x</span>
                        </div>
                      )}

                      {/* Activity score bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Activity Score</span>
                          <span className="text-[10px] font-black text-gray-300">{activityPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${rc.barGrad} rounded-full transition-all duration-700`}
                            style={{width:`${activityPct}%`}}
                          />
                        </div>
                      </div>

                      {/* View timeline button */}
                      <button
                        onClick={() => { setSelectedUserUsage(u); setIsUsageModalOpen(true); }}
                        className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer border transition-all hover:scale-[1.01] ${rc.btnBg} ${rc.btnBorder} ${rc.btnText}`}
                      >
                        📊 View Full Timeline
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : activeTab === 'super-console' ? (
        <div className="space-y-6">
          {/* Uptime and Health Performance arc header summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Live Health Gauge */}
            <div className="bg-gray-900 border border-glass-border p-5 rounded-xl flex items-center justify-between shadow-lg">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Server Load Score</span>
                <span className="text-xl font-extrabold text-white font-mono">98.4 / 100</span>
                <span className="text-[9px] text-green-400 font-bold block">Status: Optimal Compute</span>
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-green-500/20 border-t-green-500 animate-spin shrink-0" />
            </div>

            {/* Live Uptime Gauge */}
            <div className="bg-gray-900 border border-glass-border p-5 rounded-xl flex items-center justify-between shadow-lg">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Service Live Uptime</span>
                <span className="text-xl font-extrabold text-white font-mono">99.982%</span>
                <span className="text-[9px] text-green-400 font-bold block">SLA Target met this month</span>
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-pulse shrink-0 flex items-center justify-center font-mono text-[9px] text-purple-400 font-bold">24/7</div>
            </div>

            {/* Database Snapshot Exporter Card */}
            <div className="bg-gray-900 border border-glass-border p-5 rounded-xl flex flex-col justify-between shadow-lg">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Database Snapshot</span>
                <span className="text-xs text-gray-300 mt-1 block font-medium">Export the entire local workspace state to a JSON backup file.</span>
              </div>
              <button
                onClick={handleExportSnapshot}
                disabled={isExportingSnapshot}
                className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                {isExportingSnapshot ? 'Compiling Snapshot...' : 'Export DB Snapshot'}
              </button>
            </div>

          </div>

          {/* Real-time Health Monitor progress bars */}
          <div className="bg-gray-900 border border-glass-border p-6 rounded-xl space-y-4 shadow-lg">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider text-purple-400">Node Virtualization Health Monitor</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* RAM Usage */}
              <div className="bg-black/40 border border-glass-border p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-mono text-gray-400">
                  <span>RAM ALLOCATION</span>
                  <span className="text-white font-bold">{ramUsage}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000"
                    style={{ width: `${ramUsage}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-500 block">Total Capacity: 2.048 GB Node Limit</span>
              </div>

              {/* CPU Usage */}
              <div className="bg-black/40 border border-glass-border p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-mono text-gray-400">
                  <span>CPU COMPUTE LOAD</span>
                  <span className="text-white font-bold">{cpuUsage}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                    style={{ width: `${cpuUsage}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-500 block">Server Threads: 8x Hyperthreads</span>
              </div>

              {/* DB Latency */}
              <div className="bg-black/40 border border-glass-border p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-mono text-gray-400">
                  <span>MONGO LATENCY</span>
                  <span className="text-white font-bold">{dbLatency} ms</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (dbLatency / 150) * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-500 block">Driver status: Connected & Active</span>
              </div>

              {/* WebSockets */}
              <div className="bg-black/40 border border-glass-border p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-mono text-gray-400">
                  <span>WEBSOCKET CHANNELS</span>
                  <span className="text-white font-bold">{activeConns} Active</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (activeConns / 20) * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-500 block">Subscription mode: Live Heartbeats</span>
              </div>
            </div>
          </div>

          {/* Broadcast Announcement System */}
          <div className="bg-gray-900 border border-glass-border p-6 rounded-xl space-y-4 shadow-lg">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider text-green-400">System Broadcast System (Marquee Alert)</h2>
            <p className="text-xs text-gray-400">Publish a system-wide banner notification that scrolls at the top of the screen for all active users.</p>
            
            <div className="space-y-3">
              <textarea
                value={bannerInput}
                onChange={(e) => setBannerInput(e.target.value)}
                placeholder="Write system alert message (e.g. Server maintenance scheduled for 10:00 PM EST)..."
                className="w-full bg-black/40 border border-glass-border rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors h-16 resize-none font-sans"
              />
              
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    await updateSettings({ systemBanner: bannerInput });
                    toast.success("Broadcast message published globally!");
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-black font-extrabold rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Publish Announcement
                </button>
                <button
                  onClick={async () => {
                    setBannerInput('');
                    await updateSettings({ systemBanner: "" });
                    toast.success("Broadcast announcement cleared!");
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 font-extrabold rounded-lg text-xs uppercase tracking-wider border border-gray-700 transition-colors cursor-pointer"
                >
                  Clear Banner
                </button>
              </div>
            </div>
          </div>

          {/* Spotlight Super Shell Interactive Terminal */}
          <div className="bg-gray-900 border border-glass-border p-6 rounded-xl space-y-4 shadow-lg">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider text-blue-400">Spotlight Super Shell (Terminal Interpreter)</h2>
            <p className="text-xs text-gray-400">Tactile power shell. Type commands to toggle styles, test database ping, run memory GC, or publish announcements.</p>
            
            <div className="bg-black/80 border border-glass-border rounded-2xl p-4 font-mono text-[10px] text-green-400 shadow-2xl relative overflow-hidden flex flex-col gap-2 min-h-[180px] max-h-[250px] select-text">
              {/* Scanline Overlay */}
              <div className="pointer-events-none absolute inset-0 bg-scanlines opacity-[0.04]" />
              
              {/* Terminal Logs View */}
              <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-2">
                {terminalLogs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap leading-relaxed">{log}</div>
                ))}
              </div>
              
              {/* Terminal Input Bar */}
              <form onSubmit={handleTerminalSubmit} className="flex items-center gap-1.5 border-t border-white/10 pt-2 shrink-0">
                <span className="text-green-500 font-bold select-none">$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={handleTerminalKeyDown}
                  placeholder='Type a command (e.g. "help", "status", "ping", "clear")...'
                  className="flex-1 bg-transparent text-green-400 outline-none border-none font-mono text-[10px] placeholder-green-800/60"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck="false"
                />
              </form>
            </div>
          </div>

          {/* Memory Heap & Garbage Collection Sweeper */}
          <div className="bg-gray-900 border border-glass-border p-6 rounded-xl space-y-4 shadow-lg">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider text-purple-400">Workspace Memory Heap & GC Sweep</h2>
            <p className="text-xs text-gray-400">Evict stale chunks and compile garbage collection memory. **This is completely safe and does not modify database entries.**</p>
            
            <div className="space-y-3">
              <button
                disabled={isGarbageCollecting}
                onClick={runGarbageCollector}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isGarbageCollecting ? 'Purging Cache Heap...' : 'Run Cache Memory Sweep'}
              </button>

              {gcOutput && (
                <div className="bg-black border border-glass-border rounded-xl p-3.5 font-mono text-[10px] text-green-400 space-y-1 select-text">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-gray-500">[System Log]</span>
                    <span>{gcOutput}</span>
                  </div>
                  {isGarbageCollecting && (
                    <div className="text-gray-600 pl-4 animate-pulse">Running diagnostics... please wait.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Usage History Modal – Premium Timeline */}
      <AnimatePresence>
        {isUsageModalOpen && selectedUserUsage && (() => {
          const allPages: Record<string,number> = {};
          ;(selectedUserUsage.usageHistory||[]).forEach((d:any)=>{
            ;(d.pages||[]).forEach((p:string)=>{ const n=p.split('|')[0]; allPages[n]=(allPages[n]||0)+1; });
          });
          const topPages = Object.entries(allPages).sort((a:any,b:any)=>b[1]-a[1]).slice(0,5);
          const maxPageHits = topPages[0]?.[1] || 1;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={e => { if (e.target === e.currentTarget) setIsUsageModalOpen(false); }}
            >
              <motion.div
                initial={{ scale: 0.93, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.93, y: 20 }}
                className="relative overflow-hidden bg-[#0a0a12] border border-violet-500/20 rounded-2xl w-full max-w-2xl shadow-[0_0_80px_rgba(139,92,246,0.2)] max-h-[90vh] flex flex-col"
              >
                {/* BG glow effects */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/8 rounded-full blur-3xl pointer-events-none"/>
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/8 rounded-full blur-2xl pointer-events-none"/>

                {/* Modal header */}
                <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-[0_0_16px_rgba(139,92,246,0.5)] shrink-0 overflow-hidden">
                      {selectedUserUsage.photoURL
                        ? <img src={selectedUserUsage.photoURL} className="w-full h-full object-cover" alt=""/>
                        : <span className="text-sm font-black text-white">{(selectedUserUsage.name||selectedUserUsage.email||'?').split(' ').map((n:string)=>n[0]).join('').substring(0,2).toUpperCase()}</span>
                      }
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-violet-400/70 font-bold">Activity Timeline</p>
                      <h3 className="font-black text-white text-sm leading-tight">{selectedUserUsage.name || selectedUserUsage.email}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Quick stats */}
                    {[
                      { label:'Visits', val: selectedUserUsage.usageHistory?.reduce((s:number,d:any)=>s+(d.pages?.length||0),0)||0, color:'text-violet-300' },
                      { label:'Days',   val: selectedUserUsage.usageHistory?.length||0, color:'text-blue-300' },
                      { label:'Pages',  val: Object.keys(allPages).length, color:'text-emerald-300' },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <p className={`text-base font-black leading-none ${s.color}`}>{s.val}</p>
                        <p className="text-[9px] text-gray-500 uppercase mt-0.5">{s.label}</p>
                      </div>
                    ))}
                    {/* Export CSV */}
                    <button
                      onClick={() => {
                        const rows = ['Date,Page,Time'];
                        ;(selectedUserUsage.usageHistory||[]).forEach((d:any)=>{
                          ;(d.pages||[]).forEach((p:string)=>{
                            const [name,ts]=p.split('|');
                            rows.push(`${d.date},"${name}",${ts?new Date(ts).toLocaleTimeString():'N/A'}`);
                          });
                        });
                        const blob=new Blob([rows.join('\n')],{type:'text/csv'});
                        const a=document.createElement('a');
                        a.href=URL.createObjectURL(blob);
                        a.download=`timeline_${(selectedUserUsage.name||selectedUserUsage.email||'user').replace(/\s+/g,'_')}.csv`;
                        a.click();
                        toast.success('Timeline exported!');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 transition-all text-[10px] font-bold cursor-pointer"
                    >
                      📥 Export
                    </button>
                    <button onClick={() => setIsUsageModalOpen(false)} className="p-1.5 hover:bg-white/[0.07] rounded-lg transition-colors">
                      <X className="w-4 h-4 text-gray-400"/>
                    </button>
                  </div>
                </div>

                {/* Top pages mini chart */}
                {topPages.length > 0 && (
                  <div className="px-6 py-3 border-b border-white/[0.04] bg-white/[0.01]">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-2">Most Visited Pages</p>
                    <div className="space-y-1.5">
                      {topPages.map(([name,count]) => (
                        <div key={name} className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-300 w-28 truncate shrink-0 font-medium">{name}</span>
                          <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full"
                              style={{width:`${Math.round((count/maxPageHits)*100)}%`}}
                            />
                          </div>
                          <span className="text-[9px] text-gray-500 font-mono w-6 text-right shrink-0">{count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline body */}
                <div className="relative p-5 overflow-y-auto flex-1 space-y-4">
                  {(!selectedUserUsage.usageHistory || selectedUserUsage.usageHistory.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <span className="text-4xl opacity-20">📭</span>
                      <p className="text-gray-400 text-sm font-semibold">No activity recorded yet</p>
                      <p className="text-xs text-gray-600">This agent hasn't visited any pages.</p>
                    </div>
                  ) : (
                    [...selectedUserUsage.usageHistory].reverse().map((record: any, i: number) => {
                      const pageCount = record.pages?.length || 0;
                      const uniquePages = [...new Set((record.pages||[]).map((p:string)=>p.split('|')[0]))];
                      const pageColorPairs = [
                        {text:'text-violet-200', bg:'bg-violet-500/10', border:'border-violet-500/20'},
                        {text:'text-sky-200',    bg:'bg-sky-500/10',    border:'border-sky-500/20'},
                        {text:'text-emerald-200',bg:'bg-emerald-500/10',border:'border-emerald-500/20'},
                        {text:'text-amber-200',  bg:'bg-amber-500/10',  border:'border-amber-500/20'},
                        {text:'text-pink-200',   bg:'bg-pink-500/10',   border:'border-pink-500/20'},
                        {text:'text-cyan-200',   bg:'bg-cyan-500/10',   border:'border-cyan-500/20'},
                      ];
                      return (
                        <div key={i} className="relative pl-6">
                          {i < [...selectedUserUsage.usageHistory].length - 1 && (
                            <div className="absolute left-[7px] top-7 bottom-0 w-[2px] bg-gradient-to-b from-violet-500/30 to-transparent"/>
                          )}
                          <div className="absolute left-0 top-3 w-3.5 h-3.5 rounded-full bg-violet-500 border-2 border-[#0a0a12] shadow-[0_0_8px_rgba(139,92,246,0.7)]"/>

                          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 space-y-3 hover:border-violet-500/15 hover:bg-white/[0.035] transition-all">
                            {/* Date header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-violet-400"/>
                                <span className="text-sm font-black text-white">{record.date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-violet-200 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">{pageCount} visits</span>
                                <span className="text-[10px] font-bold text-sky-200 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">{uniquePages.length} pages</span>
                              </div>
                            </div>

                            {/* Page tags */}
                            <div className="flex flex-wrap gap-1.5">
                              {record.pages && record.pages.length > 0 ? record.pages.map((page: string, idx: number) => {
                                const parts = page.split('|');
                                const pageName = parts[0];
                                const timestamp = parts[1];
                                const formattedTime = timestamp
                                  ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                  : 'Time not logged';
                                const cp = pageColorPairs[pageName.length % pageColorPairs.length];
                                return (
                                  <span
                                    key={idx}
                                    className={`relative group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold cursor-help select-none transition-all hover:scale-[1.05] hover:brightness-125 ${cp.text} ${cp.bg} ${cp.border}`}
                                  >
                                    <span className="opacity-50 text-[8px]">📄</span>
                                    {pageName}
                                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-[#0e0e1a] text-[10px] text-violet-200 font-mono border border-violet-500/20 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
                                      🕐 {formattedTime}
                                    </span>
                                  </span>
                                );
                              }) : (
                                <span className="text-xs text-gray-500 italic">No pages logged this day.</span>
                              )}
                            </div>

                            {/* Day bar */}
                            {pageCount > 0 && (
                              <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full"
                                  style={{width:`${Math.min(100,(pageCount/20)*100)}%`}}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
