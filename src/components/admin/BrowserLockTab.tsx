'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Lock, 
  Unlock, 
  ShieldAlert, 
  Globe, 
  KeyRound, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Laptop, 
  Copy, 
  Check, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Clock, 
  ShieldCheck, 
  ExternalLink, 
  Cpu, 
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface IDevice {
  _id: string;
  deviceId: string;
  deviceName: string;
  password: string;
  isLocked: boolean;
  ipAddress: string;
  userAgent?: string;
  lastSeen: string;
  status: 'online' | 'offline';
  failedAttempts: number;
  createdAt: string;
  updatedAt: string;
}

interface ILog {
  _id: string;
  deviceId: string;
  deviceName: string;
  eventType: string;
  performedBy: string;
  ipAddress: string;
  details: string;
  createdAt: string;
}

export default function BrowserLockTab({ currentUserEmail }: { currentUserEmail?: string }) {
  const [devices, setDevices] = useState<IDevice[]>([]);
  const [logs, setLogs] = useState<ILog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Password visibility map (deviceId -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  // Reset Password Modal State
  const [resetModalDevice, setResetModalDevice] = useState<IDevice | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Add Device Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDevicePin, setNewDevicePin] = useState('1234');
  const [isAdding, setIsAdding] = useState(false);

  // Guide Modal
  const [showGuideModal, setShowGuideModal] = useState(false);

  const fetchDevicesAndLogs = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [devRes, logRes] = await Promise.all([
        fetch('/api/browser-lock/devices'),
        fetch('/api/browser-lock/logs?limit=30')
      ]);

      if (devRes.ok) {
        const devData = await devRes.json();
        setDevices(devData.devices || []);
      }

      if (logRes.ok) {
        const logData = await logRes.json();
        setLogs(logData.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch browser lock data:', err);
      if (!isSilent) toast.error('Failed to load browser lock devices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDevicesAndLogs();
    const interval = setInterval(() => {
      fetchDevicesAndLogs(true);
    }, 5000); // 5s live polling
    return () => clearInterval(interval);
  }, [fetchDevicesAndLogs]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMap(prev => ({ ...prev, [key]: true }));
    toast.success('Copied to clipboard');
    setTimeout(() => {
      setCopiedMap(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const togglePasswordVisibility = (deviceId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [deviceId]: !prev[deviceId]
    }));
  };

  const handleToggleLock = async (device: IDevice) => {
    const nextLocked = !device.isLocked;
    const actionLabel = nextLocked ? 'Locking' : 'Unlocking';
    const toastId = toast.loading(`${actionLabel} ${device.deviceName}...`);

    try {
      const res = await fetch('/api/browser-lock/lock-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: device.deviceId,
          isLocked: nextLocked,
          performedBy: currentUserEmail || 'Admin'
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          nextLocked
            ? `🔒 ${device.deviceName} locked! Target browser will lock on next sync.`
            : `🔓 ${device.deviceName} unlocked remotely!`,
          { id: toastId }
        );
        fetchDevicesAndLogs(true);
      } else {
        toast.error(data.error || 'Operation failed', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error', { id: toastId });
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalDevice || !newPasswordInput.trim()) return;

    if (newPasswordInput.trim().length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }

    setIsResetting(true);
    const toastId = toast.loading('Resetting password...');

    try {
      const res = await fetch('/api/browser-lock/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: resetModalDevice.deviceId,
          newPassword: newPasswordInput.trim(),
          performedBy: currentUserEmail || 'Admin'
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Password updated for ${resetModalDevice.deviceName}!`, { id: toastId });
        setResetModalDevice(null);
        setNewPasswordInput('');
        fetchDevicesAndLogs(true);
      } else {
        toast.error(data.error || 'Failed to update password', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred', { id: toastId });
    } finally {
      setIsResetting(false);
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch('/api/browser-lock/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceName: newDeviceName.trim(),
          password: newDevicePin.trim() || '1234'
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('New device created! Use this Device ID in the extension.');
        setShowAddModal(false);
        setNewDeviceName('');
        setNewDevicePin('1234');
        fetchDevicesAndLogs(true);
      } else {
        toast.error(data.error || 'Failed to create device');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating device');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteDevice = async (deviceId: string, deviceName: string) => {
    if (!confirm(`Are you sure you want to delete "${deviceName}"?`)) return;

    try {
      const res = await fetch(`/api/browser-lock/devices?deviceId=${deviceId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Device removed');
        fetchDevicesAndLogs(true);
      } else {
        toast.error(data.error || 'Delete failed');
      }
    } catch (err: any) {
      toast.error('Network error');
    }
  };

  const totalCount = devices.length;
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const lockedCount = devices.filter(d => d.isLocked).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Metric Cards */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c121e] via-[#080d16] to-[#04070c] border border-cyan-500/20 p-6 md:p-8 shadow-[0_0_35px_rgba(6,182,212,0.08)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Code Commandos Central Security Hub
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Browser Lock & Remote Access Control
            </h2>
            <p className="text-gray-400 text-sm mt-1 max-w-2xl">
              Remotely lock and unlock browsers across any device, track real-time IP addresses, view master passwords, and manage instant resets directly from Code Commandos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowGuideModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <Info className="w-4 h-4 text-cyan-400" />
              How to Connect
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-600/20"
            >
              <Plus className="w-4 h-4" />
              Add Device
            </button>
            <button
              onClick={() => fetchDevicesAndLogs(false)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-gray-400 hover:text-white transition-all"
              title="Refresh Devices & Logs"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/[0.08]">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
            <span className="text-xs text-gray-400 font-medium">Total Registered</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white">{totalCount}</span>
              <span className="text-xs text-gray-500">browsers</span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Online Live</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400">{onlineCount}</span>
              <span className="text-xs text-emerald-500/70">active now</span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Currently Locked</span>
              {lockedCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black ${lockedCount > 0 ? 'text-red-400' : 'text-gray-300'}`}>
                {lockedCount}
              </span>
              <span className="text-xs text-gray-500">under lockdown</span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
            <span className="text-xs text-gray-400 font-medium">Audit Events</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-cyan-400">{logs.length}</span>
              <span className="text-xs text-gray-500">recorded</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Devices Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Laptop className="w-5 h-5 text-cyan-400" />
            Connected Devices & Workstations ({devices.length})
          </h3>
          <span className="text-xs text-gray-400 font-mono">
            Auto-sync: <span className="text-emerald-400 font-semibold">Active (5s)</span>
          </span>
        </div>

        {loading && devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
            <p className="text-gray-400 text-sm font-medium">Loading connected devices...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white/[0.02] border border-dashed border-white/[0.1] rounded-3xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white mb-1">No Browser Devices Registered Yet</h4>
            <p className="text-gray-400 text-sm max-w-md mb-6">
              Install the Code Commandos Browser Lock extension on your Chrome browser, or add a pre-configured device profile above.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg"
              >
                + Register First Device
              </button>
              <button
                onClick={() => setShowGuideModal(true)}
                className="px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 text-xs font-semibold transition-all border border-white/10"
              >
                Setup Extension Guide
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => {
              const isOnline = device.status === 'online';
              const isLocked = device.isLocked;
              const isPasswordRevealed = visiblePasswords[device.deviceId];
              const lastSeenText = new Date(device.lastSeen).toLocaleTimeString();

              return (
                <motion.div
                  key={device.deviceId}
                  layout
                  className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between border ${
                    isLocked
                      ? 'bg-gradient-to-b from-red-950/40 via-[#10070a] to-[#0a0507] border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.15)]'
                      : 'bg-gradient-to-b from-[#0b1320]/60 via-[#070b13] to-[#04070c] border-white/[0.08] hover:border-cyan-500/30 shadow-lg'
                  }`}
                >
                  {/* Glowing Status Accent Bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 ${
                      isLocked
                        ? 'bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 animate-pulse'
                        : isOnline
                        ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500'
                        : 'bg-gray-700'
                    }`}
                  />

                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-white truncate max-w-[190px]">
                            {device.deviceName}
                          </span>
                          {/* Live Online Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isOnline
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-gray-800 text-gray-400 border border-gray-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                              }`}
                            />
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        {/* Device ID */}
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500 font-mono">
                          <span>ID: {device.deviceId}</span>
                          <button
                            onClick={() => copyToClipboard(device.deviceId, `id-${device.deviceId}`)}
                            className="hover:text-gray-300 transition-colors"
                            title="Copy Device ID"
                          >
                            {copiedMap[`id-${device.deviceId}`] ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Lock Status Pill */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                          isLocked
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isLocked ? <Lock className="w-3.5 h-3.5 text-red-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
                        {isLocked ? 'Locked' : 'Unlocked'}
                      </span>
                    </div>

                    {/* Meta Information Cards */}
                    <div className="space-y-2.5 mb-5 text-xs">
                      {/* IP Address */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                          <Globe className="w-3.5 h-3.5 text-cyan-400" />
                          IP Address:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white font-semibold">
                            {device.ipAddress}
                          </span>
                          <button
                            onClick={() => copyToClipboard(device.ipAddress, `ip-${device.deviceId}`)}
                            className="p-1 rounded hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all"
                            title="Copy IP"
                          >
                            {copiedMap[`ip-${device.deviceId}`] ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          {device.ipAddress && device.ipAddress !== 'Unknown' && device.ipAddress !== '127.0.0.1' && (
                            <a
                              href={`https://ipinfo.io/${device.ipAddress}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded hover:bg-white/[0.08] text-gray-400 hover:text-cyan-300 transition-all"
                              title="Lookup Location / ISP"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Password Field with Eye Toggle & Reset Button */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                          Password:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-300 tracking-wider">
                            {isPasswordRevealed ? device.password : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(device.deviceId)}
                            className="p-1 rounded hover:bg-white/[0.08] text-gray-400 hover:text-amber-300 transition-all"
                            title={isPasswordRevealed ? 'Hide Password' : 'Show Password'}
                          >
                            {isPasswordRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(device.password, `pw-${device.deviceId}`)}
                            className="p-1 rounded hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all"
                            title="Copy Password"
                          >
                            {copiedMap[`pw-${device.deviceId}`] ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setResetModalDevice(device);
                              setNewPasswordInput('');
                            }}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 ml-1"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Last Seen & Failed Attempts */}
                      <div className="flex items-center justify-between px-1 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Last sync: {lastSeenText}
                        </span>
                        {device.failedAttempts > 0 && (
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {device.failedAttempts} failed attempts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Remote Action Buttons */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2">
                    <button
                      onClick={() => handleToggleLock(device)}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                        isLocked
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25'
                          : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/25'
                      }`}
                    >
                      {isLocked ? (
                        <>
                          <Unlock className="w-4 h-4" />
                          Unlock Remotely
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Lock Browser Now
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteDevice(device.deviceId, device.deviceName)}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-red-500/10 text-gray-500 hover:text-red-400 border border-white/[0.05] hover:border-red-500/20 transition-all"
                      title="Deregister Device"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security Audit Activity Feed */}
      <div className="rounded-3xl bg-white/[0.02] border border-white/[0.06] p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Real-Time Security Audit Logs
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Chronological log of remote locks, unlocks, IP recordings, and password resets
            </p>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            Showing latest {logs.length} events
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            No security events logged yet.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {logs.map((log) => {
              const isAlert = log.eventType === 'failed_unlock' || log.eventType === 'remote_lock';
              const isUnlock = log.eventType === 'remote_unlock' || log.eventType === 'local_unlock';
              const isReset = log.eventType === 'password_reset';

              return (
                <div
                  key={log._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.035] transition-all text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isAlert
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : isUnlock
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : isReset
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      {isAlert ? (
                        <Lock className="w-4 h-4" />
                      ) : isUnlock ? (
                        <Unlock className="w-4 h-4" />
                      ) : isReset ? (
                        <KeyRound className="w-4 h-4" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{log.deviceName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.05] text-gray-400 font-mono">
                          {log.eventType}
                        </span>
                      </div>
                      <p className="text-gray-400 mt-0.5">{log.details}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 text-gray-500 font-mono text-[11px] shrink-0 pl-11 sm:pl-0">
                    <span className="flex items-center gap-1 text-gray-400">
                      <Globe className="w-3 h-3 text-cyan-500" />
                      {log.ipAddress || '127.0.0.1'}
                    </span>
                    <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {resetModalDevice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b121e] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              <h3 className="text-xl font-black text-white flex items-center gap-2 mb-1">
                <KeyRound className="w-5 h-5 text-amber-400" />
                Reset Device Password
              </h3>
              <p className="text-xs text-gray-400 mb-6">
                Target device: <strong className="text-white">{resetModalDevice.deviceName}</strong> ({resetModalDevice.deviceId})
              </p>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Current Password
                  </label>
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] font-mono text-amber-400 text-sm">
                    {resetModalDevice.password}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <input
                    type="text"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new 4+ character password"
                    required
                    minLength={4}
                    className="w-full p-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder:text-gray-600"
                    autoFocus
                  />
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    This will sync to the device on its next heartbeat (within 5 seconds).
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setResetModalDevice(null)}
                    className="flex-1 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 font-semibold text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2"
                  >
                    {isResetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Device Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b121e] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              <h3 className="text-xl font-black text-white flex items-center gap-2 mb-1">
                <Plus className="w-5 h-5 text-cyan-400" />
                Register New Browser Device
              </h3>
              <p className="text-xs text-gray-400 mb-6">
                Create a profile for a browser or computer before or after installing the extension.
              </p>

              <form onSubmit={handleAddDevice} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Device Name / Label
                  </label>
                  <input
                    type="text"
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    placeholder="e.g., Office Laptop - Chrome, Workstation PC"
                    required
                    className="w-full p-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder:text-gray-600"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Initial Master Password / PIN
                  </label>
                  <input
                    type="text"
                    value={newDevicePin}
                    onChange={(e) => setNewDevicePin(e.target.value)}
                    placeholder="e.g., 1234 or securepass"
                    required
                    minLength={4}
                    className="w-full p-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder:text-gray-600"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 font-semibold text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2"
                  >
                    {isAdding ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Register Device'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* How to Connect Modal */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b121e] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative"
            >
              <h3 className="text-xl font-black text-white flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Browser Lock Extension Setup Guide
              </h3>
              <p className="text-xs text-gray-400 mb-6">
                Connect any Chrome browser to Code Commandos Hub for remote lock, IP tracking, and password control:
              </p>

              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h5 className="font-bold text-white mb-0.5">Open Chrome Extensions</h5>
                    <p className="text-gray-400">Navigate to <code className="text-cyan-300">chrome://extensions</code> in Chrome and enable <strong>Developer mode</strong> (top right toggle).</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h5 className="font-bold text-white mb-0.5">Load Unpacked</h5>
                    <p className="text-gray-400">Click <strong>Load unpacked</strong> and select the directory:</p>
                    <code className="block mt-1 p-2 rounded bg-black/50 text-cyan-300 font-mono text-[11px] break-all">
                      C:\Users\Rifat\rifat\Code commandos\Browser Lock
                    </code>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h5 className="font-bold text-white mb-0.5">Automatic Remote Pairing</h5>
                    <p className="text-gray-400">The extension will instantly establish a heartbeat with this Code Commandos server, register the browser, and report its IP address!</p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-lg"
                >
                  Got It, Close Guide
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
