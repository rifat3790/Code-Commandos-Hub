'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { auth } from '@/lib/firebase';


import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { Terminal, Lock, Mail, LogIn, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

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
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: userCredential.user.uid,
            email: email,
            teamName: teamName,
            phoneNumber: phoneNumber
          })
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowSuccess(true);
      setTimeout(() => router.push('/'), 1500);
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
      
      setShowSuccess(true);
      setTimeout(() => router.push('/'), 1500);
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
        className="w-full max-w-md bg-gray-900/40 backdrop-blur-2xl border border-glass-border rounded-2xl p-8 relative z-10 shadow-2xl"
      >
        {isForgotPassword ? (
          <div>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4 glow-green">
                <Terminal className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-wide">RESET PASSWORD</h1>
              <p className="text-gray-400 text-sm mt-2 text-center">Receive a password recovery email</p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg text-center font-medium">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
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

              <button 
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold rounded-xl py-2.5 mt-2 transition-all flex items-center justify-center gap-2"
              >
                Send Recovery Email
              </button>

              <button 
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setSuccessMessage('');
                }}
                className="w-full bg-transparent text-gray-400 hover:text-white text-xs font-semibold py-2 transition-all block text-center"
              >
                Back to Sign In
              </button>
            </form>
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
