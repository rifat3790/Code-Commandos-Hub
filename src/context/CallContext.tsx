'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, setDoc, updateDoc, onSnapshot, query, where, limit } from 'firebase/firestore';
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CallContextType {
  startCall: (receiverUid: string, receiverName: string) => Promise<void>;
  activeCall: any;
  callState: 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'declined';
  endCall: () => void;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  incomingCall: any;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user, dbUser } = useAuth();
  const [activeCall, setActiveCall] = useState<any>(null);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'declined'>('idle');
  const [incomingCall, setIncomingCall] = useState<any>(null);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const unsubscribeCallRef = useRef<(() => void) | null>(null);
  const unsubscribeIceRef = useRef<(() => void) | null>(null);
  const timerIntervalRef = useRef<any>(null);

  const isAdminOrSuperAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';

  // 1. Listen for incoming calls
  useEffect(() => {
    if (!user) return;

    const myUid = isAdminOrSuperAdmin ? 'admin' : user.uid;

    const q = query(
      collection(db, 'calls'),
      where('receiverUid', '==', myUid),
      where('status', '==', 'ringing'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setIncomingCall(null);
        return;
      }
      const docData = snapshot.docs[0].data();
      // Ensure the call offer is fresh (created in the last 45 seconds)
      if (new Date().getTime() - docData.createdAt < 45000) {
        setIncomingCall(docData);
        setCallState('ringing');
      }
    });

    return () => unsubscribe();
  }, [user, isAdminOrSuperAdmin]);

  // 2. Audio timer ticking
  useEffect(() => {
    if (callState === 'connected') {
      timerIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [callState]);

  // 3. Bind remote stream to audio element
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(err => console.error("Remote audio play fail:", err));
    }
  }, [remoteStream]);

  const startCall = async (receiverUid: string, receiverName: string) => {
    if (!user) return;
    setCallState('calling');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
    } catch (err) {
      console.error("Mic access denied:", err);
      setCallState('idle');
      alert("Microphone permission is required to make calls.");
      return;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerConnectionRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    const callRef = doc(collection(db, 'calls'));
    const callId = callRef.id;

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await addDoc(collection(db, `calls/${callId}/iceCandidates`), {
          ...event.candidate.toJSON(),
          type: 'caller'
        });
      }
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type
    };

    const callData = {
      id: callId,
      callerUid: isAdminOrSuperAdmin ? 'admin' : user.uid,
      callerName: isAdminOrSuperAdmin ? 'Support Team' : (dbUser?.name || user.email || 'User'),
      receiverUid,
      receiverName,
      status: 'ringing',
      offer,
      createdAt: new Date().getTime()
    };

    await setDoc(callRef, callData);
    setActiveCall(callData);

    // Watch for status changes
    const unsubscribeCall = onSnapshot(callRef, async (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (data.status === 'accepted' && data.answer && pc.signalingState !== 'stable') {
        setCallState('connected');
        const answerDescription = new RTCSessionDescription(data.answer);
        await pc.setRemoteDescription(answerDescription);
      } else if (data.status === 'declined') {
        cleanupCall('declined');
      } else if (data.status === 'ended') {
        cleanupCall('ended');
      }
    });
    unsubscribeCallRef.current = unsubscribeCall;

    // Listen for receiver ICE candidates
    const iceQuery = query(
      collection(db, `calls/${callId}/iceCandidates`),
      where('type', '==', 'receiver')
    );
    const unsubscribeIce = onSnapshot(iceQuery, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          await pc.addIceCandidate(candidate).catch(e => console.warn("Failed to add receiver candidate", e));
        }
      });
    });
    unsubscribeIceRef.current = unsubscribeIce;
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    setCallState('connecting');
    setActiveCall(incomingCall);
    setIncomingCall(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
    } catch (err) {
      console.error("Local stream fetch failed:", err);
      await updateDoc(doc(db, 'calls', incomingCall.id), { status: 'declined' });
      setCallState('idle');
      return;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerConnectionRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await addDoc(collection(db, `calls/${incomingCall.id}/iceCandidates`), {
          ...event.candidate.toJSON(),
          type: 'receiver'
        });
      }
    };

    const offerDescription = new RTCSessionDescription(incomingCall.offer);
    await pc.setRemoteDescription(offerDescription);

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      sdp: answerDescription.sdp,
      type: answerDescription.type
    };

    await updateDoc(doc(db, 'calls', incomingCall.id), {
      status: 'accepted',
      answer
    });
    setCallState('connected');

    const iceQuery = query(
      collection(db, `calls/${incomingCall.id}/iceCandidates`),
      where('type', '==', 'caller')
    );
    const unsubscribeIce = onSnapshot(iceQuery, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          await pc.addIceCandidate(candidate).catch(e => console.warn("Failed to add caller candidate", e));
        }
      });
    });
    unsubscribeIceRef.current = unsubscribeIce;

    const unsubscribeCall = onSnapshot(doc(db, 'calls', incomingCall.id), (snapshot) => {
      const data = snapshot.data();
      if (data && data.status === 'ended') {
        cleanupCall('ended');
      }
    });
    unsubscribeCallRef.current = unsubscribeCall;
  };

  const declineCall = async () => {
    if (!incomingCall) return;
    try {
      await updateDoc(doc(db, 'calls', incomingCall.id), { status: 'declined' });
    } catch (err) {
      console.error(err);
    }
    setIncomingCall(null);
    setCallState('idle');
  };

  const endCall = async () => {
    const targetCall = activeCall || incomingCall;
    if (targetCall) {
      try {
        await updateDoc(doc(db, 'calls', targetCall.id), { status: 'ended' });
      } catch (err) {
        console.error(err);
      }
    }
    cleanupCall('ended');
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const cleanupCall = (finalState: 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'declined') => {
    if (unsubscribeCallRef.current) unsubscribeCallRef.current();
    if (unsubscribeIceRef.current) unsubscribeIceRef.current();
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    setRemoteStream(null);
    setActiveCall(null);
    setCallState(finalState);
    setIsMuted(false);
    
    // Automatically revert to idle after 3 seconds for call states like ended or declined
    if (finalState === 'ended' || finalState === 'declined') {
      setTimeout(() => {
        setCallState('idle');
      }, 3000);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <CallContext.Provider value={{ startCall, activeCall, callState, endCall, acceptCall, declineCall, incomingCall }}>
      {children}
      <audio ref={remoteAudioRef} style={{ display: 'none' }} />

      {/* Floating Calls UI Render overlays */}
      <AnimatePresence>
        {/* 1. INCOMING CALL OVERLAY */}
        {incomingCall && callState === 'ringing' && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[330px] p-5 bg-gray-950 border border-purple-500/30 rounded-2xl shadow-[0_0_35px_rgba(168,85,247,0.3)] flex flex-col items-center gap-4 text-center select-none"
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute inset-0 w-16 h-16 bg-purple-500/20 rounded-full animate-ping"></span>
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-800 border-2 border-purple-500 flex items-center justify-center">
                <Phone className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest">Incoming Audio Call</p>
              <h3 className="text-white font-bold mt-1 text-base">{incomingCall.callerName}</h3>
            </div>
            <div className="flex gap-4 w-full mt-1">
              <button
                onClick={declineCall}
                className="flex-1 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 font-bold text-xs hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                <PhoneOff className="w-4 h-4" /> Decline
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 py-2.5 rounded-xl border border-green-500/20 bg-green-500/10 text-green-400 font-bold text-xs hover:bg-green-500/20 transition-all flex items-center justify-center gap-2 glow-green"
              >
                <Phone className="w-4 h-4" /> Accept
              </button>
            </div>
          </motion.div>
        )}

        {/* 2. ACTIVE CALL & OUTGOING DIALING FLOATING OVERLAY */}
        {activeCall && callState !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-6 left-6 z-[100] w-[280px] p-4 bg-gray-950 border border-purple-500/20 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex flex-col items-center gap-3 text-center select-none"
          >
            <div className="flex items-center justify-between w-full border-b border-glass-border pb-2.5 mb-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${callState === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-400 animate-ping'}`}></div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {callState === 'calling' ? 'Calling...' : callState === 'connecting' ? 'Connecting...' : callState === 'connected' ? 'Connected' : callState}
                </span>
              </div>
              {callState === 'connected' && (
                <span className="text-xs font-mono text-purple-400 font-semibold">
                  {formatDuration(callDuration)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 self-start text-left w-full px-1">
              <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {(activeCall.callerUid === (isAdminOrSuperAdmin ? 'admin' : user?.uid) ? activeCall.receiverName : activeCall.callerName).split(' ').map((n: any) => n[0]).join('').substring(0,2).toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1">
                <h4 className="text-sm font-bold text-white truncate">
                  {activeCall.callerUid === (isAdminOrSuperAdmin ? 'admin' : user?.uid) ? activeCall.receiverName : activeCall.callerName}
                </h4>
                <p className="text-[10px] text-gray-500 truncate">Audio Call</p>
              </div>
            </div>

            <div className="flex gap-3 mt-2 w-full">
              {callState === 'connected' && (
                <button
                  onClick={toggleMute}
                  className={`p-2.5 rounded-xl border transition-all text-xs flex items-center justify-center flex-1 gap-1.5 ${isMuted ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'}`}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isMuted ? 'Muted' : 'Mute'}</span>
                </button>
              )}
              <button
                onClick={endCall}
                className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all flex items-center justify-center flex-1 gap-1.5"
              >
                <PhoneOff className="w-4 h-4" /> Hang Up
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
