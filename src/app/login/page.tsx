'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { auth } from '@/lib/firebase';


import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { Terminal, Lock, Mail, LogIn, CheckCircle, Clock, ShieldAlert, XCircle, RefreshCw, ShieldCheck, Sparkles, Activity, UserX, KeyRound, Eye, EyeOff, Check, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [statusNotice, setStatusNotice] = useState<'pending' | 'rejected' | 'suspended' | null>(null);
  
  // Multi-step OTP Password Reset State
  const [resetStep, setResetStep] = useState<'email' | 'code' | 'password' | 'success'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [verifiedCode, setVerifiedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(900);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const newOtp = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          newOtp[i] = pasted[i] || '';
        }
        setOtpDigits(newOtp);
        const nextIdx = Math.min(pasted.length, 5);
        const el = document.getElementById(`otp-input-${nextIdx}`);
        if (el) el.focus();
      }
      return;
    }

    const cleanVal = value.replace(/\D/g, '');
    const newOtp = [...otpDigits];
    newOtp[index] = cleanVal;
    setOtpDigits(newOtp);

    if (cleanVal && index < 5) {
      const el = document.getElementById(`otp-input-${index + 1}`);
      if (el) el.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const el = document.getElementById(`otp-input-${index - 1}`);
      if (el) el.focus();
    }
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err === 'pending_approval') setStatusNotice('pending');
      else if (err === 'account_rejected') setStatusNotice('rejected');
      else if (err === 'account_suspended') setStatusNotice('suspended');
    }
  }, []);

  const checkUserStatusAndProceed = async (firebaseUid: string) => {
    try {
      const res = await fetch(`/api/users/me?uid=${firebaseUid}`);
      const data = await res.json();
      if (data.success && data.user) {
        const userStatus = data.user.status || 'approved';
        if (data.user.role === 'banned') {
          await signOut(auth);
          setStatusNotice('suspended');
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', '/login?error=account_suspended');
          }
          return false;
        }
        if (userStatus === 'pending') {
          await signOut(auth);
          setStatusNotice('pending');
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', '/login?error=pending_approval');
          }
          return false;
        }
        if (userStatus === 'rejected') {
          await signOut(auth);
          setStatusNotice('rejected');
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', '/login?error=account_rejected');
          }
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error("Error verifying user approval status:", err);
      return true;
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!email.trim()) {
      setError('Please enter your email address first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMessage('A password reset link has been sent to your email. Please check your inbox and spam folder.');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      let uid = '';
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: uid,
            email: email,
            teamName: teamName,
            phoneNumber: phoneNumber
          })
        });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
      }

      const isApproved = await checkUserStatusAndProceed(uid);
      if (isApproved) {
        setShowSuccess(true);
        setTimeout(() => router.push('/'), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL
        })
      });
      
      const isApproved = await checkUserStatusAndProceed(userCredential.user.uid);
      if (isApproved) {
        setShowSuccess(true);
        setTimeout(() => router.push('/'), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center items-center p-4 sm:p-8 bg-[#030712] relative overflow-hidden">


      {/* Ambient background glow behind canvas */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.15 }}
        className={`w-full transition-all duration-300 ${statusNotice === 'pending' ? 'max-w-lg border-green-500/30 shadow-[0_0_60px_rgba(34,197,94,0.18)] bg-[#030712]/90' : statusNotice === 'rejected' || statusNotice === 'suspended' ? 'max-w-lg border-red-500/30 shadow-[0_0_60px_rgba(239,68,68,0.18)] bg-[#030712]/90' : 'max-w-md border-glass-border bg-gray-900/40'} backdrop-blur-3xl border rounded-3xl p-8 sm:p-10 relative z-10 shadow-2xl overflow-hidden`}
      >
        {statusNotice === 'pending' ? (
          <div className="flex flex-col items-center text-center relative z-10">
            {/* Ambient Background Glows inside Card */}
            <div className="absolute -top-16 -left-16 w-56 h-56 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Status Beacon Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-extrabold uppercase font-mono tracking-widest mb-6 shadow-[0_0_20px_rgba(34,197,94,0.25)]">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
              <span>Awaiting Administrator Clearance</span>
            </div>

            {/* Glowing Emblem with Orbital Ring Effect */}
            <div className="relative mb-6">
              <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 opacity-25 blur-xl animate-pulse" />
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-b from-gray-900 via-gray-950 to-black border border-green-500/40 flex items-center justify-center relative shadow-[0_0_35px_rgba(34,197,94,0.3)]">
                <Clock className="w-9 h-9 text-green-400 stroke-[1.75]" />
              </div>
            </div>

            {/* Luxury Headline & Subtitle */}
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-widest uppercase font-mono mb-1 bg-gradient-to-r from-green-200 via-green-400 to-emerald-400 bg-clip-text text-transparent">
              Verification Pending
            </h2>
            <p className="text-gray-400 text-xs tracking-widest uppercase font-mono mb-6 flex items-center gap-1.5 justify-center">
              <Sparkles className="w-3.5 h-3.5 text-green-400 animate-pulse" /> Code Commandos Security Clearance
            </p>

            {/* Premium Narrative Box */}
            <div className="w-full bg-black/60 border border-green-500/20 p-5 sm:p-6 rounded-2xl text-left space-y-3.5 mb-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-green-500 via-emerald-400 to-green-600" />
              
              <div className="flex items-center justify-between text-green-400 font-extrabold text-xs uppercase font-mono tracking-wider">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Account Under Review
                </span>
                <span className="text-[10px] text-gray-500 font-mono">STATUS: 202 IN QUEUE</span>
              </div>
              
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed font-sans font-medium">
                Welcome to <strong className="text-white font-semibold">Code Commandos Hub</strong>. Your account credentials have been successfully registered and queued for system administrator clearance.
              </p>
              
              <p className="text-gray-400 text-xs leading-relaxed font-sans">
                To preserve workspace integrity and protect sensitive operations, all new accounts require explicit clearance from an Administrator before system access is granted.
              </p>

              <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-[10px] font-mono">
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <span className="text-gray-500 block uppercase">Review Status</span>
                  <span className="text-green-400 font-bold text-xs flex items-center gap-1 mt-0.5">
                    <Activity className="w-3 h-3 animate-spin" /> Pending Approval
                  </span>
                </div>
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <span className="text-gray-500 block uppercase">Security Protocol</span>
                  <span className="text-green-400 font-bold text-xs block mt-0.5">Encrypted & Active</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-3">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') window.location.href = '/login';
                }}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-black rounded-xl py-3.5 text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(34,197,94,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer font-mono active:scale-[0.99]"
              >
                <RefreshCw className="w-4 h-4" /> Re-Check Clearance Status
              </button>
              <button
                type="button"
                onClick={() => setStatusNotice(null)}
                className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-glass-border rounded-xl py-2.5 text-xs font-semibold tracking-wide transition-all cursor-pointer font-mono"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        ) : statusNotice === 'rejected' ? (
          <div className="flex flex-col items-center text-center relative z-10">
            {/* Ambient Background Glows inside Card */}
            <div className="absolute -top-16 -left-16 w-56 h-56 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Status Beacon Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-extrabold uppercase font-mono tracking-widest mb-6 shadow-[0_0_20px_rgba(239,68,68,0.25)]">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>Registration Request Declined</span>
            </div>

            {/* Glowing Emblem with Orbital Ring Effect */}
            <div className="relative mb-6">
              <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-red-500 to-rose-500 opacity-25 blur-xl animate-pulse" />
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-b from-gray-900 via-gray-950 to-black border border-red-500/40 flex items-center justify-center relative shadow-[0_0_35px_rgba(239,68,68,0.3)]">
                <UserX className="w-9 h-9 text-red-500 stroke-[1.75]" />
              </div>
            </div>

            {/* Luxury Headline & Subtitle */}
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-widest uppercase font-mono mb-1 bg-gradient-to-r from-red-200 via-red-400 to-rose-500 bg-clip-text text-transparent">
              Access Declined
            </h2>
            <p className="text-gray-400 text-xs tracking-widest uppercase font-mono mb-6 flex items-center gap-1.5 justify-center">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Code Commandos Security Protocol
            </p>

            {/* Premium Narrative Box */}
            <div className="w-full bg-black/60 border border-red-500/20 p-5 sm:p-6 rounded-2xl text-left space-y-3.5 mb-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500 via-rose-400 to-red-600" />
              
              <div className="flex items-center justify-between text-red-400 font-extrabold text-xs uppercase font-mono tracking-wider">
                <span className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Registration Rejected
                </span>
                <span className="text-[10px] text-gray-500 font-mono">STATUS: 403 FORBIDDEN</span>
              </div>
              
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed font-sans font-medium">
                Your account registration request for <strong className="text-white font-semibold">Code Commandos Hub</strong> was reviewed and declined by a system Administrator.
              </p>
              
              <p className="text-gray-400 text-xs leading-relaxed font-sans">
                Access clearance to workspace modules and team tools has not been authorized. If you believe this decision was made in error or need assistance, please contact your team Lead or Administrator.
              </p>

              <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-[10px] font-mono">
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <span className="text-gray-500 block uppercase">Review Result</span>
                  <span className="text-red-400 font-bold text-xs block mt-0.5">Declined</span>
                </div>
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <span className="text-gray-500 block uppercase">Authorization</span>
                  <span className="text-red-400 font-bold text-xs block mt-0.5">Restricted Access</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-3">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') window.location.href = '/login';
                }}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black rounded-xl py-3.5 text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(239,68,68,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer font-mono active:scale-[0.99]"
              >
                <RefreshCw className="w-4 h-4" /> Re-Check Clearance Status
              </button>
              <button
                type="button"
                onClick={() => setStatusNotice(null)}
                className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-glass-border rounded-xl py-2.5 text-xs font-semibold tracking-wide transition-all cursor-pointer font-mono"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        ) : statusNotice === 'suspended' ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(239,68,68,0.2)]">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide uppercase font-mono mb-2">Account Suspended</h2>
            <p className="text-gray-300 text-xs leading-relaxed mb-6 bg-red-500/5 border border-red-500/20 p-4 rounded-xl">
              Your account has been suspended by an Administrator. Access to Code Commandos Hub has been restricted.
            </p>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl py-2.5 text-xs transition-all cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        ) : isForgotPassword ? (
          <div>
            {/* Step 1: Request Email */}
            {resetStep === 'email' && (
              <div>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(34,197,94,0.2)]">
                    <KeyRound className="w-8 h-8 text-green-400" />
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-widest uppercase font-mono">Reset Password</h1>
                  <p className="text-gray-400 text-xs mt-1.5 text-center font-mono">Generate a 6-digit verification code synced to your email & Admin Panel</p>
                </div>

                {error && (
                  <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center font-medium">
                    {error}
                  </div>
                )}

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setError('');
                  if (!email.trim()) {
                    setError('Please enter your registered email address.');
                    return;
                  }
                  setIsResetLoading(true);
                  try {
                    const res = await fetch('/api/auth/forgot-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: email.trim() })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setResetEmail(email.trim());
                      setResetStep('code');
                      setOtpTimer(900);
                      try { await sendPasswordResetEmail(auth, email.trim()); } catch(e){}
                    } else {
                      setError(data.message || 'Failed to generate reset code.');
                    }
                  } catch (err: any) {
                    setError('Network error. Please try again.');
                  } finally {
                    setIsResetLoading(false);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1.5 ml-1 uppercase">Account Email</label>
                    <div className="relative">
                      <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/60 border border-glass-border rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-green-500 font-mono text-sm placeholder:text-gray-600"
                        placeholder="your-email@domain.com"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isResetLoading}
                    className="w-full bg-green-500 hover:bg-green-400 text-black font-black rounded-xl py-3.5 text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(34,197,94,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer font-mono active:scale-[0.99]"
                  >
                    {isResetLoading ? (
                      <Activity className="w-4 h-4 animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                    <span>Generate 6-Digit Verification Code</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setResetStep('email');
                      setError('');
                    }}
                    className="w-full text-gray-400 hover:text-white text-xs font-mono py-2 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Return to Sign In
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: 6-Digit OTP Verification */}
            {resetStep === 'code' && (
              <div>
                <div className="flex flex-col items-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-extrabold uppercase font-mono tracking-widest mb-3 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                    <span>Live OTP Synced with Admin Panel</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase font-mono">Verification Code</h1>
                  <p className="text-gray-400 text-xs mt-1 text-center font-mono">
                    Enter the 6-digit code for <span className="text-green-400 font-bold">{resetEmail}</span>
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-6">
                  {/* 6 Individual Cyber OTP Boxes */}
                  <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-input-${index}`}
                        type="text"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-10 h-13 sm:w-12 sm:h-14 bg-black/70 border border-glass-border focus:border-green-500 focus:shadow-[0_0_15px_rgba(34,197,94,0.4)] rounded-xl text-center text-xl font-black font-mono text-green-400 focus:outline-none transition-all"
                      />
                    ))}
                  </div>

                  <div className="bg-black/50 border border-white/10 p-3.5 rounded-xl text-left space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-green-400" /> Code Expires In:
                      </span>
                      <span className="text-green-400 font-bold">14m 59s</span>
                    </div>
                    <p className="text-gray-500 text-[10px] leading-relaxed pt-1 border-t border-white/5">
                      💡 <strong>Can't access your email?</strong> You can ask your System Administrator to provide your 6-digit code directly from the Admin Panel.
                    </p>
                  </div>

                  <button 
                    type="button"
                    disabled={isResetLoading}
                    onClick={async () => {
                      const codeStr = otpDigits.join('');
                      setError('');
                      if (codeStr.length !== 6) {
                        setError('Please enter all 6 digits of your verification code.');
                        return;
                      }
                      setIsResetLoading(true);
                      try {
                        const res = await fetch('/api/auth/verify-reset-code', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: resetEmail, code: codeStr })
                        });
                        const data = await res.json();
                        if (data.success) {
                          setVerifiedCode(codeStr);
                          setResetStep('password');
                        } else {
                          setError(data.message || 'Invalid verification code.');
                        }
                      } catch (err) {
                        setError('Failed to verify code.');
                      } finally {
                        setIsResetLoading(false);
                      }
                    }}
                    className="w-full bg-green-500 hover:bg-green-400 text-black font-black rounded-xl py-3.5 text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(34,197,94,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer font-mono active:scale-[0.99]"
                  >
                    {isResetLoading ? <Activity className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>Verify Code & Continue</span>
                  </button>

                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <button
                      type="button"
                      onClick={() => setResetStep('email')}
                      className="text-gray-400 hover:text-white transition-all cursor-pointer"
                    >
                      ← Change Email
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setError('');
                        setIsResetLoading(true);
                        try {
                          await fetch('/api/auth/forgot-password', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: resetEmail })
                          });
                          setError('New 6-digit code generated and synced!');
                        } catch (e) {
                          setError('Error resending code.');
                        } finally {
                          setIsResetLoading(false);
                        }
                      }}
                      className="text-green-400 hover:underline cursor-pointer font-bold"
                    >
                      Resend Code
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Set New Password */}
            {resetStep === 'password' && (
              <div>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-3 glow-green">
                    <Lock className="w-7 h-7 text-green-400" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase font-mono">Set New Password</h1>
                  <p className="text-gray-400 text-xs mt-1 text-center font-mono">Verification confirmed for {resetEmail}</p>
                </div>

                {error && (
                  <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center font-medium">
                    {error}
                  </div>
                )}

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setError('');
                  if (newPassword.length < 6) {
                    setError('Password must be at least 6 characters long.');
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setError('Passwords do not match.');
                    return;
                  }
                  setIsResetLoading(true);
                  try {
                    const res = await fetch('/api/auth/reset-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: resetEmail,
                        code: verifiedCode,
                        newPassword: newPassword
                      })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setResetStep('success');
                    } else {
                      setError(data.message || 'Failed to update password.');
                    }
                  } catch (err) {
                    setError('Error updating password.');
                  } finally {
                    setIsResetLoading(false);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1.5 ml-1 uppercase">New Password</label>
                    <div className="relative">
                      <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-black/60 border border-glass-border rounded-xl py-3 pl-11 pr-11 text-white focus:outline-none focus:border-green-500 font-mono text-sm placeholder:text-gray-600"
                        placeholder="••••••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1.5 ml-1 uppercase">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-black/60 border border-glass-border rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-green-500 font-mono text-sm placeholder:text-gray-600"
                        placeholder="••••••••••••"
                        required
                      />
                    </div>
                    {confirmPassword && (
                      <p className={`text-[10px] font-mono mt-1 ml-1 font-bold ${newPassword === confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                        {newPassword === confirmPassword ? '✓ Passwords match verified' : '✕ Passwords do not match'}
                      </p>
                    )}
                  </div>

                  <button 
                    type="submit"
                    disabled={isResetLoading}
                    className="w-full bg-green-500 hover:bg-green-400 text-black font-black rounded-xl py-3.5 text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(34,197,94,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer font-mono active:scale-[0.99]"
                  >
                    {isResetLoading ? <Activity className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    <span>Update Password & Access Account</span>
                  </button>
                </form>
              </div>
            )}

            {/* Step 4: Success */}
            {resetStep === 'success' && (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-green-500/10 border border-green-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                  <CheckCircle className="w-9 h-9 text-green-400" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase font-mono">Password Updated</h2>
                <p className="text-gray-300 text-xs leading-relaxed font-mono bg-green-500/5 border border-green-500/20 p-4 rounded-xl">
                  Your account password authorization for <strong className="text-white">{resetEmail}</strong> has been updated successfully. You can now sign in with your new password.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetStep('email');
                    setEmail(resetEmail);
                    setError('');
                  }}
                  className="w-full bg-green-500 hover:bg-green-400 text-black font-black rounded-xl py-3.5 text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(34,197,94,0.35)] transition-all cursor-pointer font-mono"
                >
                  Proceed to Sign In
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4 glow-green">
                <Terminal className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-wide">CODE COMMANDOS</h1>
              <p className="text-gray-400 text-sm mt-2">Sign in to access your workspace</p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                {error}
              </div>
            )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Team Name</label>
                <div className="relative">
                  <div className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 font-bold text-xs">T</div>
                  <input 
                    type="text" 
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-gray-950/50 border border-glass-border rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-gray-600"
                    placeholder="Commandos"
                    required={isRegistering}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Phone Number</label>
                <div className="relative">
                  <div className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 font-bold text-xs">#</div>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-gray-950/50 border border-glass-border rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-gray-600"
                    placeholder="+8801..."
                    required={isRegistering}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-950/50 border border-glass-border rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-gray-600"
                placeholder="developer@example.com"
                required
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <label className="block text-xs font-medium text-gray-400">Password</label>
              {!isRegistering && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-xs text-green-500 hover:text-green-400 hover:underline font-medium bg-transparent border-none p-0 cursor-pointer"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-950/50 border border-glass-border rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-gray-600"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold rounded-xl py-2.5 mt-2 transition-all flex items-center justify-center gap-2"
          >
            {isRegistering ? 'Create Account' : 'Sign In'}
            <LogIn className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-glass-border"></div>
          <span className="text-xs text-gray-500 font-medium">OR CONTINUE WITH</span>
          <div className="flex-1 h-px bg-glass-border"></div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full mt-6 bg-white/5 hover:bg-white/10 border border-glass-border text-white rounded-xl py-2.5 transition-all flex items-center justify-center gap-3 font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <p className="text-center text-sm text-gray-400 mt-8">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-green-500 hover:text-green-400 hover:underline font-medium"
          >
            {isRegistering ? 'Sign In' : 'Create one'}
          </button>
        </p>
          </>
        )}
      </motion.div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-green-500/30 p-8 rounded-2xl flex flex-col items-center shadow-2xl glow-green animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
              <CheckCircle className="w-8 h-8 text-black" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
            <p className="text-gray-400">Loading your workspace...</p>
          </div>
        </div>
      )}
    </div>
  );
}
