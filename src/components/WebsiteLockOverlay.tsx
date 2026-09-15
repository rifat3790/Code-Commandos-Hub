'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, Unlock, ShieldAlert, KeyRound, Globe, RefreshCw, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function WebsiteLockOverlay() {
  const { user, dbUser } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [enteredPass, setEnteredPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ipAddress, setIpAddress] = useState('127.0.0.1');
  const [isVerifying, setIsVerifying] = useState(false);

  // Generate or retrieve persistent local web device ID
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let storedId = localStorage.getItem('code_commandos_web_device_id');
    if (!storedId) {
      storedId = 'web_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4);
      localStorage.setItem('code_commandos_web_device_id', storedId);
    }
    setDeviceId(storedId);

    const localLocked = localStorage.getItem('code_commandos_website_is_locked') === 'true';
    setIsLocked(localLocked);
  }, []);

  // Recurring Heartbeat to check if Admin locked or unlocked this session remotely
  const checkLockState = useCallback(async () => {
    if (!deviceId && !user?.uid) return;

    try {
      const devId = deviceId || `web_${user?.uid || 'guest'}`;
      const devName = dbUser?.name || user?.displayName || user?.email || 'Web Session';
      const localLocked = localStorage.getItem('code_commandos_website_is_locked') === 'true';

      const res = await fetch('/api/browser-lock/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: devId,
          deviceName: `${devName} (Web)`,
          localIsLocked: localLocked,
          password: localStorage.getItem('code_commandos_device_password') || '1234'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ipAddress) setIpAddress(data.ipAddress);

        // Store server password locally for offline fallback
        if (data.password) {
          localStorage.setItem('code_commandos_device_password', data.password);
        }

        // Check remote lock toggle from Admin
        if (data.isLocked === true && !localLocked) {
          setIsLocked(true);
          localStorage.setItem('code_commandos_website_is_locked', 'true');
          toast.error('🔒 Website session locked remotely by Admin!', { id: 'remote-lock-toast' });
        } else if (data.isLocked === false && localLocked) {
          setIsLocked(false);
          localStorage.setItem('code_commandos_website_is_locked', 'false');
          toast.success('🔓 Website session unlocked remotely by Admin!', { id: 'remote-unlock-toast' });
        }
      }
    } catch (err) {
      // Network offline, rely on local state
    }
  }, [deviceId, user, dbUser]);

  useEffect(() => {
    checkLockState();
    const interval = setInterval(checkLockState, 3500); // 3.5s live polling
    return () => clearInterval(interval);
  }, [checkLockState]);

  // Listen for manual lock trigger events dispatched in-app
  useEffect(() => {
    const handleTriggerLock = () => {
      setIsLocked(true);
      localStorage.setItem('code_commandos_website_is_locked', 'true');
      checkLockState();
    };

    window.addEventListener('trigger-website-lock', handleTriggerLock);
    return () => window.removeEventListener('trigger-website-lock', handleTriggerLock);
  }, [checkLockState]);

  const handleLocalUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPass.trim()) return;

    setIsVerifying(true);
    setErrorMsg('');

    const savedPass = localStorage.getItem('code_commandos_device_password') || '1234';

    if (enteredPass.trim() === savedPass) {
      // Success
      setIsLocked(false);
      localStorage.setItem('code_commandos_website_is_locked', 'false');
      setEnteredPass('');

      // Report unlock event to Hub
      const devId = deviceId || `web_${user?.uid || 'guest'}`;
      fetch('/api/browser-lock/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: devId,
          deviceName: `${dbUser?.name || user?.email || 'Web Session'} (Web)`,
          localIsLocked: false,
          event: 'local_unlock',
          eventDetails: 'User entered valid password on website overlay'
        })
      }).catch(() => {});

      toast.success('Website unlocked!');
    } else {
      // Failed PIN
      setErrorMsg('Incorrect PIN / Password. Try again or request remote unlock from Admin.');
      
      // Report failed unlock event to Hub
      const devId = deviceId || `web_${user?.uid || 'guest'}`;
      fetch('/api/browser-lock/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: devId,
          deviceName: `${dbUser?.name || user?.email || 'Web Session'} (Web)`,
          localIsLocked: true,
          event: 'failed_unlock',
          eventDetails: `Failed attempt with password: ${enteredPass.trim()}`
        })
      }).catch(() => {});
    }

    setIsVerifying(false);
  };

  if (!isLocked) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-[#04070d] text-white overflow-hidden select-none"
      >
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.12),transparent_70%)] animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Container */}
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="relative z-10 w-full max-w-md bg-[#0b121e]/90 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl p-8 text-center shadow-[0_0_60px_rgba(6,182,212,0.15)]"
        >
          {/* Brand Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-black uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Code Commandos Security Lockdown
          </div>

          {/* Lock Icon */}
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-red-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)]">
            <Lock className="w-10 h-10 text-cyan-400" />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white mb-1">
            Website Access Locked
          </h2>
          <p className="text-xs text-gray-400 max-w-xs mx-auto mb-6">
            This website session is protected. Enter your security PIN or ask Admin to unlock remotely.
          </p>

          {/* IP & User info */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3.5 mb-6 text-xs text-left space-y-2 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1.5 font-sans">
                <Globe className="w-3.5 h-3.5 text-cyan-400" /> Tracked IP:
              </span>
              <span className="text-cyan-300 font-bold">{ipAddress}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-sans">User Session:</span>
              <span className="text-gray-300 truncate max-w-[170px]">{dbUser?.name || user?.email || 'Guest Session'}</span>
            </div>
          </div>

          {/* Unlock Form */}
          <form onSubmit={handleLocalUnlock} className="space-y-4">
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={enteredPass}
                onChange={(e) => setEnteredPass(e.target.value)}
                placeholder="Enter PIN / Password"
                required
                autoFocus
                className="w-full py-3.5 px-4 rounded-xl bg-black/50 border border-white/15 text-white text-center text-sm font-mono tracking-widest focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 flex items-center justify-center gap-1.5 font-medium bg-red-500/10 p-2.5 rounded-xl border border-red-500/20"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errorMsg}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  Unlock Website Access
                </>
              )}
            </button>
          </form>

          {/* Remote Admin Notice */}
          <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-center gap-2 text-[11px] text-gray-500">
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            <span>Remote Admin Control Active • Auto-unlocks when Admin approves</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
