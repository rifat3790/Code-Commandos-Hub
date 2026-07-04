'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, setDoc, updateDoc, onSnapshot, query, where, limit } from 'firebase/firestore';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, ScreenShare, Volume2, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CallContextType {
  startCall: (receiverUid: string, receiverName: string, type: 'audio' | 'video') => Promise<void>;
  activeCall: any;
  callState: 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'declined';
  endCall: () => void;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  incomingCall: any;
  isMuted: boolean;
  toggleMute: () => void;
  isVideoMuted: boolean;
  toggleVideo: () => void;
  isScreenSharing: boolean;
  toggleScreenShare: () => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

class RingtonePlayer {
  audioCtx: AudioContext | null = null;
  interval: any = null;

  start() {
    if (typeof window === 'undefined') return;
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = this.audioCtx;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const playTone = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(480, ctx.currentTime + 0.2);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + 1);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);
    };

    playTone();
    this.interval = setInterval(playTone, 2000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

const ringtonePlayer = typeof window !== 'undefined' ? new RingtonePlayer() : null;

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user, dbUser } = useAuth();
  const [activeCall, setActiveCall] = useState<any>(null);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'declined'>('idle');
  const [incomingCall, setIncomingCall] = useState<any>(null);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const videoGridRef = useRef<HTMLDivElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const unsubscribeCallRef = useRef<(() => void) | null>(null);
  const unsubscribeIceRef = useRef<(() => void) | null>(null);
  const timerIntervalRef = useRef<any>(null);

  const isAdminOrSuperAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';

  // Computed layout state
  const showVideoLayout = activeCall?.type === 'video' || isScreenSharing || remoteHasVideo;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoGridRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode:`, err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Handle ringing side-effects (sound & notification)
  useEffect(() => {
    if (callState === 'ringing') {
      ringtonePlayer?.start();
      
      if (incomingCall && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(`Incoming ${incomingCall.type === 'video' ? 'Video' : 'Audio'} Call`, {
          body: `From: ${incomingCall.callerName}`,
          requireInteraction: true,
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    } else {
      ringtonePlayer?.stop();
    }
    
    return () => {
      ringtonePlayer?.stop();
    };
  }, [callState, incomingCall]);

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
      if (new Date().getTime() - docData.createdAt < 45000) {
        setIncomingCall(docData);
        setCallState('ringing');
      }
    });

    return () => unsubscribe();
  }, [user, isAdminOrSuperAdmin]);

  // 2. Timer ticking
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

  // 2.5 Caller auto-timeout
  useEffect(() => {
    let timeoutId: any;
    if (callState === 'calling') {
      timeoutId = setTimeout(() => {
        endCall();
      }, 45000);
    }
    return () => clearTimeout(timeoutId);
  }, [callState, activeCall]);

  // 3. Track remote video presence (vital for screen share auto-switch)
  useEffect(() => {
    if (remoteStream) {
      const checkVideo = () => {
        const videoTracks = remoteStream.getVideoTracks();
        const hasActiveVideo = videoTracks.length > 0 && videoTracks.some(t => t.enabled && !t.muted);
        setRemoteHasVideo(hasActiveVideo);
      };
      
      checkVideo();
      
      remoteStream.getVideoTracks().forEach(track => {
        track.onunmute = checkVideo;
        track.onmute = checkVideo;
        track.onended = checkVideo;
      });

      remoteStream.onaddtrack = (e) => {
        if (e.track.kind === 'video') {
          e.track.onunmute = checkVideo;
          e.track.onmute = checkVideo;
          e.track.onended = checkVideo;
        }
        checkVideo();
      };
      remoteStream.onremovetrack = checkVideo;
    } else {
      setRemoteHasVideo(false);
    }
  }, [remoteStream]);

  // 4. Bind streams to media elements
  useEffect(() => {
    if (callState === 'connected') {
      if (showVideoLayout) {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStreamRef.current || localStream;
        }
        if (remoteVideoRef.current && remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      } else {
        if (remoteAudioRef.current && remoteStream) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(err => console.error("Remote audio play fail:", err));
        }
      }
    }
  }, [callState, showVideoLayout, localStream, remoteStream, isScreenSharing]);

  const startCall = async (receiverUid: string, receiverName: string, type: 'audio' | 'video') => {
    if (!user) return;
    if (dbUser && dbUser.callingAllowed === false) {
      alert("Your calling and screen sharing permissions have been disabled by an administrator.");
      return;
    }
    setCallState('calling');
    setIsVideoMuted(type === 'audio');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: type === 'video' 
      });
      setLocalStream(stream);
    } catch (err) {
      console.warn("Media access failed, trying fallback:", err);
      if (type === 'video') {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          setLocalStream(stream);
          type = 'audio';
          setIsVideoMuted(true);
          alert("No camera device found or access denied. Falling back to audio-only call.");
        } catch (fallbackErr) {
          console.error("Audio fallback failed:", fallbackErr);
          setCallState('idle');
          alert("Microphone permission is required to make calls.");
          return;
        }
      } else {
        setCallState('idle');
        alert("Microphone permission is required to make calls.");
        return;
      }
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerConnectionRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Ensure a video transceiver is negotiated from the start for dynamic additions
    const videoTransceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'video');
    if (!videoTransceiver) {
      pc.addTransceiver('video', { direction: 'sendrecv' });
    }

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
      type,
      createdAt: new Date().getTime()
    };

    await setDoc(callRef, callData);
    setActiveCall(callData);

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
    setIncomingCall(null);
    setIsVideoMuted(incomingCall.type === 'audio');

    let stream: MediaStream;
    let callType = incomingCall.type;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: callType === 'video' 
      });
      setLocalStream(stream);
    } catch (err) {
      console.warn("Accept stream fetch failed, trying fallback:", err);
      if (callType === 'video') {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          setLocalStream(stream);
          callType = 'audio';
          setIsVideoMuted(true);
          alert("No camera device found or access denied. Falling back to audio-only call.");
        } catch (fallbackErr) {
          console.error("Accept audio fallback failed:", fallbackErr);
          await updateDoc(doc(db, 'calls', incomingCall.id), { status: 'declined' });
          setCallState('idle');
          return;
        }
      } else {
        await updateDoc(doc(db, 'calls', incomingCall.id), { status: 'declined' });
        setCallState('idle');
        return;
      }
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerConnectionRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const videoTransceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'video');
    if (!videoTransceiver) {
      pc.addTransceiver('video', { direction: 'sendrecv' });
    }

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

    const updatedCall = { ...incomingCall, type: callType };
    setActiveCall(updatedCall);

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

        const myUid = isAdminOrSuperAdmin ? 'admin' : user?.uid;
        if (callState === 'calling' && targetCall.callerUid === myUid) {
          await addDoc(collection(db, 'notifications'), {
            userId: targetCall.receiverUid,
            title: 'Missed Call',
            message: `You missed a call from ${targetCall.callerName}`,
            type: 'missed_call',
            read: false,
            createdAt: new Date().getTime(),
            actionData: {
              callerUid: targetCall.callerUid,
              callerName: targetCall.callerName,
            }
          });
        }
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

  const toggleVideo = async () => {
    if (!peerConnectionRef.current) return;

    const videoTrack = localStream?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoMuted(!videoTrack.enabled);
    } else {
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const cameraTrack = cameraStream.getVideoTracks()[0];
        
        if (localStream) {
          localStream.addTrack(cameraTrack);
        }

        const videoTransceiver = peerConnectionRef.current.getTransceivers().find(t => t.receiver.track.kind === 'video');
        if (videoTransceiver?.sender) {
          await videoTransceiver.sender.replaceTrack(cameraTrack);
        }

        setIsVideoMuted(false);
      } catch (err) {
        console.error("Camera access failed:", err);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return;
    if (dbUser && dbUser.callingAllowed === false) {
      alert("Your calling and screen sharing permissions have been disabled by an administrator.");
      return;
    }

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        const videoTransceiver = peerConnectionRef.current.getTransceivers().find(t => t.receiver.track.kind === 'video');
        const videoSender = videoTransceiver?.sender;

        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen share fail:", err);
      }
    } else {
      await stopScreenShare();
    }
  };

  const stopScreenShare = async () => {
    if (!peerConnectionRef.current) return;

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    const videoTransceiver = peerConnectionRef.current.getTransceivers().find(t => t.receiver.track.kind === 'video');
    const videoSender = videoTransceiver?.sender;

    if (videoSender) {
      const cameraTrack = localStream?.getVideoTracks()[0] || null;
      await videoSender.replaceTrack(cameraTrack);
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

    setIsScreenSharing(false);
  };

  const cleanupCall = (finalState: 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'declined') => {
    if (unsubscribeCallRef.current) unsubscribeCallRef.current();
    if (unsubscribeIceRef.current) unsubscribeIceRef.current();
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    setRemoteStream(null);
    setActiveCall(null);
    setCallState(finalState);
    setIsMuted(false);
    setIsVideoMuted(false);
    setIsScreenSharing(false);
    setRemoteHasVideo(false);
    
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
    <CallContext.Provider value={{ startCall, activeCall, callState, endCall, acceptCall, declineCall, incomingCall, isMuted, toggleMute, isVideoMuted, toggleVideo, isScreenSharing, toggleScreenShare }}>
      {children}
      <audio ref={remoteAudioRef} style={{ display: 'none' }} />

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
                {incomingCall.type === 'video' ? <Video className="w-7 h-7 text-white" /> : <Phone className="w-7 h-7 text-white" />}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest">
                Incoming {incomingCall.type === 'video' ? 'Video' : 'Audio'} Call
              </p>
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

        {/* 2. ACTIVE AUDIO CALL OVERLAY (Small Floating Card) */}
        {activeCall && callState !== 'idle' && !showVideoLayout && (
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

            <div className="flex gap-2 mt-2 w-full justify-between items-center">
              {callState === 'connected' && (
                <>
                  <button
                    onClick={toggleMute}
                    className={`p-2.5 rounded-xl border transition-all text-xs flex items-center justify-center flex-1 ${isMuted ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'}`}
                    title={isMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={toggleVideo}
                    className="p-2.5 rounded-xl border border-gray-800 bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-all flex items-center justify-center flex-1"
                    title="Enable Video Camera"
                  >
                    <Video className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleScreenShare}
                    className="p-2.5 rounded-xl border border-gray-800 bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-all flex items-center justify-center flex-1"
                    title="Share Screen"
                  >
                    <ScreenShare className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={endCall}
                className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all flex items-center justify-center flex-1"
                title="Hang Up"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* 3. ACTIVE VIDEO CALL OVERLAY (Zoom/Discord Style Center Screen) */}
        {activeCall && callState !== 'idle' && showVideoLayout && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6"
          >
            <div className="bg-gray-950 border border-purple-500/20 rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden relative shadow-[0_0_50px_rgba(168,85,247,0.25)]">
              {/* Top Banner Info */}
              <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl flex items-center gap-2 border border-glass-border">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-white">
                  {activeCall.callerUid === (isAdminOrSuperAdmin ? 'admin' : user?.uid) ? activeCall.receiverName : activeCall.callerName}
                </span>
                <span className="text-[10px] text-purple-400 font-mono pl-1.5 border-l border-white/20">
                  {formatDuration(callDuration)}
                </span>
              </div>

              {/* Video Grid Viewport */}
              <div ref={videoGridRef} className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                {/* Remote Video Stream (Main Feed) */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />

                {/* Local Video Stream (Floating PIP) */}
                <div className="absolute bottom-4 right-4 w-40 h-28 md:w-52 md:h-36 bg-gray-900 border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl z-10">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {isVideoMuted && (
                    <div className="absolute inset-0 bg-gray-950/80 flex flex-col items-center justify-center gap-1.5">
                      <VideoOff className="w-6 h-6 text-gray-500" />
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Cam Off</span>
                    </div>
                  )}
                </div>

                {isScreenSharing && (
                  <div className="absolute top-4 right-4 z-20 bg-purple-600/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse">
                    <ScreenShare className="w-3.5 h-3.5" />
                    <span>Screen Sharing Active</span>
                  </div>
                )}
              </div>

              {/* Bottom Controls Bar */}
              <div className="p-4 bg-gray-950 border-t border-glass-border flex justify-center gap-4 items-center shrink-0">
                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-center ${isMuted ? 'bg-red-500/10 border-red-500 text-red-400 animate-pulse' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'}`}
                  title={isMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-center ${isVideoMuted ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'}`}
                  title={isVideoMuted ? "Enable Camera" : "Disable Camera"}
                >
                  {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-center ${isScreenSharing ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'}`}
                  title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
                >
                  <ScreenShare className="w-5 h-5" />
                </button>

                <button
                  onClick={toggleFullscreen}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-center ${isFullscreen ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'}`}
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  <Maximize className="w-5 h-5" />
                </button>

                <button
                  onClick={endCall}
                  className="p-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                  title="Hang Up"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
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
