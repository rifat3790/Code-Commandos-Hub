'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, setDoc, updateDoc, onSnapshot, query, where, limit, getDoc, deleteDoc } from 'firebase/firestore';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, ScreenShare, Volume2, Maximize, Minimize2, Crown, UserMinus, Laptop, Users } from 'lucide-react';
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
  screenSharerUid: string | null;
  activeGroupCalls: any[];
  joinGroupCall: (groupId: string, groupName: string) => Promise<void>;
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

const createDummyVideoTrack = () => {
  if (typeof window === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#10B981';
    ctx.font = '16px monospace';
    ctx.fillText('CAMERA OFF', 260, 240);
  }
  const stream = canvas.captureStream(5);
  const track = stream.getVideoTracks()[0];
  if (track) {
    (track as any).isDummy = true;
  }
  return track;
};

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
  const [screenSharerUid, setScreenSharerUid] = useState<string | null>(null);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [activeGroupCalls, setActiveGroupCalls] = useState<any[]>([]);
  const [groupCallParticipants, setGroupCallParticipants] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    async function fetchUsers() {
      try {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          setAllUsers(data.users || []);
        }
      } catch (err) {
        console.error('Error fetching users in call context:', err);
      }
    }
    fetchUsers();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'groupCalls'),
      where('status', '==', 'active')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const calls = snapshot.docs.map(doc => doc.data());
      setActiveGroupCalls(calls);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!activeCall?.isGroupCall) {
      setGroupCallParticipants([]);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, 'groupCalls', activeCall.id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setGroupCallParticipants(data.activeParticipants || []);
      }
    });
    return () => unsubscribe();
  }, [activeCall]);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const videoGridRef = useRef<HTMLDivElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const unsubscribeCallRef = useRef<(() => void) | null>(null);
  const unsubscribeIceRef = useRef<(() => void) | null>(null);
  const timerIntervalRef = useRef<any>(null);

  const [meshRemoteStreams, setMeshRemoteStreams] = useState<Record<string, MediaStream>>({});
  const meshConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});

  const [localVideoEl, setLocalVideoEl] = useState<HTMLVideoElement | null>(null);
  const [remoteVideoEl, setRemoteVideoEl] = useState<HTMLVideoElement | null>(null);
  const [activeMeetingParticipants, setActiveMeetingParticipants] = useState<any[]>([]);
  const [meetingHostUid, setMeetingHostUid] = useState<string | null>(null);
  const [showParticipantsPanel, setShowParticipantsPanel] = useState(false);
  const [allowScreenShare, setAllowScreenShare] = useState(true);

  useEffect(() => {
    if (!user || !activeCall?.isGroupCall) {
      // Clean up all mesh connections
      Object.keys(meshConnectionsRef.current).forEach(peerUid => {
        try {
          meshConnectionsRef.current[peerUid].close();
        } catch (e) {}
      });
      meshConnectionsRef.current = {};
      setMeshRemoteStreams({});
      // Clean up all DOM audio elements
      document.querySelectorAll('[id^="audio_play_"]').forEach(el => el.remove());
      return;
    }

    if (!localStream) return;

    const groupId = activeCall.id;
    const myPresenceRef = doc(db, 'groupCalls', groupId, 'participants', user.uid);
    
    setDoc(myPresenceRef, {
      uid: user.uid,
      name: dbUser?.name || user.email || 'Developer',
      joinedAt: new Date().getTime()
    }).catch(err => console.error("Error setting presence:", err));

    const participantsRef = collection(db, 'groupCalls', groupId, 'participants');
    const unsubscribeParticipants = onSnapshot(participantsRef, async (snapshot) => {
      const participantsList = snapshot.docs.map(doc => doc.data().uid).filter(uid => uid !== user.uid);
      
      // Clean up connections for left participants
      Object.keys(meshConnectionsRef.current).forEach(peerUid => {
        if (!participantsList.includes(peerUid)) {
          try {
            meshConnectionsRef.current[peerUid].close();
          } catch (e) {}
          delete meshConnectionsRef.current[peerUid];
          setMeshRemoteStreams(prev => {
            const copy = { ...prev };
            delete copy[peerUid];
            return copy;
          });
          const audioEl = document.getElementById(`audio_play_${peerUid}`);
          if (audioEl) {
            audioEl.remove();
          }
        }
      });

      // Connect with new participants
      for (const peerUid of participantsList) {
        if (meshConnectionsRef.current[peerUid]) continue;

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        });
        meshConnectionsRef.current[peerUid] = pc;

        if (localStream) {
          localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        }

        const candidateQueue: any[] = [];

        const flushCandidates = async () => {
          while (candidateQueue.length > 0) {
            const cand = candidateQueue.shift();
            if (cand) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {}
            }
          }
        };

        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            const remoteStream = event.streams[0];
            setMeshRemoteStreams(prev => ({
              ...prev,
              [peerUid]: remoteStream
            }));

            // Play remote audio programmatically in a dedicated hidden audio tag
            const audioElId = `audio_play_${peerUid}`;
            let audioEl = document.getElementById(audioElId) as HTMLAudioElement;
            if (!audioEl) {
              audioEl = document.createElement('audio');
              audioEl.id = audioElId;
              audioEl.style.display = 'none';
              document.body.appendChild(audioEl);
            }
            audioEl.srcObject = remoteStream;
            audioEl.play().catch(err => {
              console.warn("Autoplay audio failed or was blocked:", err);
            });
          }
        };

        const connId = user.uid > peerUid 
          ? `${user.uid}_to_${peerUid}` 
          : `${peerUid}_to_${user.uid}`;
        
        const connectionDocRef = doc(db, 'groupCalls', groupId, 'connections', connId);

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candRef = doc(collection(db, 'groupCalls', groupId, 'connections', connId, 'candidates'));
            setDoc(candRef, {
              ...event.candidate.toJSON(),
              senderUid: user.uid
            }).catch(console.error);
          }
        };

        // Listen for remote ICE candidates
        const unsubscribeIce = onSnapshot(collection(db, 'groupCalls', groupId, 'connections', connId, 'candidates'), (iceSnap) => {
          iceSnap.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              if (data.senderUid !== user.uid) {
                if (pc.remoteDescription) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(data));
                  } catch (err) {}
                } else {
                  candidateQueue.push(data);
                }
              }
            }
          });
        });

        if (user.uid > peerUid) {
          const offerDescription = await pc.createOffer();
          await pc.setLocalDescription(offerDescription);

          await setDoc(connectionDocRef, {
            offer: {
              sdp: offerDescription.sdp,
              type: offerDescription.type
            },
            callerUid: user.uid,
            receiverUid: peerUid
          });

          // Listen for answer
          const unsubscribeConn = onSnapshot(connectionDocRef, async (connSnap) => {
            if (connSnap.exists()) {
              const data = connSnap.data();
              if (data.answer && !pc.currentRemoteDescription) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                await flushCandidates();
              }
            }
          });
        } else {
          // Listen for offer
          const unsubscribeConn = onSnapshot(connectionDocRef, async (connSnap) => {
            if (connSnap.exists()) {
              const data = connSnap.data();
              if (data.offer && !pc.currentRemoteDescription) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                await flushCandidates();
                const answerDescription = await pc.createAnswer();
                await pc.setLocalDescription(answerDescription);
                await updateDoc(connectionDocRef, {
                  answer: {
                    sdp: answerDescription.sdp,
                    type: answerDescription.type
                  }
                });
              }
            }
          });
        }
      }
    });

    return () => {
      unsubscribeParticipants();
      deleteDoc(myPresenceRef).catch(console.error);
      document.querySelectorAll('[id^="audio_play_"]').forEach(el => el.remove());
    };
  }, [activeCall, user, localStream]);

  // 1. Bind localVideoEl and remoteVideoEl
  useEffect(() => {
    if (localVideoEl) {
      localVideoEl.srcObject = screenStreamRef.current || localStream;
    }
  }, [localVideoEl, localStream, isScreenSharing]);

  useEffect(() => {
    if (remoteVideoEl && remoteStream) {
      remoteVideoEl.srcObject = remoteStream;
    }
  }, [remoteVideoEl, remoteStream]);

  // 2. Sync mic/video mute states to presence
  useEffect(() => {
    if (activeCall?.isGroupCall && user) {
      updateDoc(doc(db, 'groupCalls', activeCall.id, 'participants', user.uid), {
        isMuted: isMuted,
        isVideoMuted: isVideoMuted
      }).catch(console.error);
    }
  }, [isMuted, isVideoMuted, activeCall, user]);

  // 3. Listen to group call details (hostUid, active participants list)
  useEffect(() => {
    if (!activeCall?.isGroupCall) {
      setActiveMeetingParticipants([]);
      setMeetingHostUid(null);
      setShowParticipantsPanel(false);
      return;
    }
    const callDocRef = doc(db, 'groupCalls', activeCall.id);
    const unsubscribeCallDoc = onSnapshot(callDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setMeetingHostUid(snapshot.data().hostUid || null);
      }
    });

    const participantsCollRef = collection(db, 'groupCalls', activeCall.id, 'participants');
    const unsubscribeParticipantsColl = onSnapshot(participantsCollRef, (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setActiveMeetingParticipants(list);
    });

    return () => {
      unsubscribeCallDoc();
      unsubscribeParticipantsColl();
    };
  }, [activeCall]);

  // 4. Listen to host commands
  useEffect(() => {
    if (!activeCall?.isGroupCall || !user) return;

    const cmdRef = doc(db, 'groupCalls', activeCall.id, 'commands', user.uid);
    const unsubscribeCmd = onSnapshot(cmdRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.command === 'mute' && !isMuted) {
          if (localStream) {
            localStream.getAudioTracks().forEach(track => {
              track.enabled = false;
            });
          }
          setIsMuted(true);
          import('react-hot-toast').then(m => m.default.success("You have been muted by the host"));
          deleteDoc(cmdRef).catch(console.error);
        } else if (data.command === 'kick') {
          import('react-hot-toast').then(m => m.default.error("You have been kicked from the meeting by the host"));
          endCall();
          deleteDoc(cmdRef).catch(console.error);
        } else if (data.command === 'request_control') {
          import('react-hot-toast').then(m => m.default.success(`Host ${data.hostName} is collaborating on your screen`));
          deleteDoc(cmdRef).catch(console.error);
        }
      }
    });

    return () => unsubscribeCmd();
  }, [activeCall, user, localStream, isMuted]);

  // 5. Listen to personal screen share permission status
  useEffect(() => {
    if (!activeCall?.isGroupCall || !user) return;
    const unsubscribePresence = onSnapshot(doc(db, 'groupCalls', activeCall.id, 'participants', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setAllowScreenShare(data.allowScreenShare !== false);
      }
    });
    return () => unsubscribePresence();
  }, [activeCall, user]);

  const isAdminOrSuperAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';

  // Computed layout state
  const showVideoLayout = activeCall?.type === 'video' || !!screenSharerUid;

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
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(`Incoming Call from ${docData.callerName}`, {
            body: `Answer the call to start sharing screen or video.`,
            icon: '/favicon.ico',
            requireInteraction: true
          });
        }
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
        if (localVideoEl) {
          localVideoEl.srcObject = screenStreamRef.current || localStream;
        }
        if (remoteVideoEl && remoteStream) {
          remoteVideoEl.srcObject = remoteStream;
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

    const isGroupCall = receiverUid.startsWith('group_') || receiverUid.startsWith('meeting_');
    if (isGroupCall) {
      setCallState('connected');
      setIsVideoMuted(type === 'audio');
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: type === 'video' 
        });
        setLocalStream(stream);
      } catch (err) {
        console.warn("Media access failed:", err);
      }

      const session = {
        id: receiverUid,
        callerUid: user.uid,
        callerName: dbUser?.name || 'Developer',
        receiverUid: receiverUid,
        receiverName: receiverName,
        type: type,
        isGroupCall: true,
        createdAt: new Date().getTime()
      };
      setActiveCall(session);

      try {
        await setDoc(doc(db, 'groupCalls', receiverUid), {
          id: receiverUid,
          name: receiverName,
          activeParticipants: [user.uid],
          createdAt: new Date().getTime(),
          status: 'active'
        });
      } catch (err) {
        console.error("Error creating group call doc:", err);
      }
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
      if (type === 'audio') {
        const dummyTrack = createDummyVideoTrack();
        if (dummyTrack) {
          stream.addTrack(dummyTrack);
        }
      }
      setLocalStream(stream);
    } catch (err) {
      console.warn("Media access failed, trying fallback:", err);
      if (type === 'video') {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          const dummyTrack = createDummyVideoTrack();
          if (dummyTrack) {
            stream.addTrack(dummyTrack);
          }
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
      screenSharerUid: null,
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

      setScreenSharerUid(data.screenSharerUid || null);

      if (data.type === 'video') {
        setActiveCall((prev: any) => prev ? { ...prev, type: 'video' } : data);
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
      if (callType === 'audio') {
        const dummyTrack = createDummyVideoTrack();
        if (dummyTrack) {
          stream.addTrack(dummyTrack);
        }
      }
      setLocalStream(stream);
    } catch (err) {
      console.warn("Accept stream fetch failed, trying fallback:", err);
      if (callType === 'video') {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          const dummyTrack = createDummyVideoTrack();
          if (dummyTrack) {
            stream.addTrack(dummyTrack);
          }
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
      if (data) {
        if (data.status === 'ended') {
          cleanupCall('ended');
        }
        
        setScreenSharerUid(data.screenSharerUid || null);

        if (data.type === 'video') {
          setActiveCall((prev: any) => prev ? { ...prev, type: 'video' } : data);
        }
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
      if (targetCall.isGroupCall) {
        try {
          const callRef = doc(db, 'groupCalls', targetCall.id);
          const docSnap = await getDoc(callRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const currentParts = data.activeParticipants || [];
            const updatedParts = currentParts.filter((uid: string) => uid !== user?.uid);
            if (updatedParts.length === 0) {
              await updateDoc(callRef, { activeParticipants: [], status: 'ended' });
            } else {
              await updateDoc(callRef, { activeParticipants: updatedParts });
            }
          }
        } catch (err) {
          console.error("Error leaving group call:", err);
        }
      } else {
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
    }
    cleanupCall('ended');
  };

  const joinGroupCall = async (groupId: string, groupName: string) => {
    if (!user) return;
    setCallState('connected');
    setIsVideoMuted(false);
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      setLocalStream(stream);
    } catch (err) {
      console.warn("Video + Audio media access failed, trying audio only:", err);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: false 
        });
        setLocalStream(stream);
        setIsVideoMuted(true);
      } catch (err2) {
        console.warn("Audio only access failed, trying video only:", err2);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: false, 
            video: true 
          });
          setLocalStream(stream);
        } catch (err3) {
          console.error("All media devices access failed:", err3);
        }
      }
    }

    const session = {
      id: groupId,
      callerUid: 'group',
      callerName: 'Group Call',
      receiverUid: groupId,
      receiverName: groupName,
      type: 'video',
      isGroupCall: true,
      createdAt: new Date().getTime()
    };
    setActiveCall(session);

    try {
      const callRef = doc(db, 'groupCalls', groupId);
      const docSnap = await getDoc(callRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const currentParts = data.activeParticipants || [];
        if (!currentParts.includes(user.uid)) {
          await updateDoc(callRef, {
            activeParticipants: [...currentParts, user.uid]
          });
        }
      }
    } catch (err) {
      console.error("Error joining group call:", err);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const replaceTrackInMesh = async (kind: 'audio' | 'video', newTrack: MediaStreamTrack | null) => {
    for (const peerUid of Object.keys(meshConnectionsRef.current)) {
      const pc = meshConnectionsRef.current[peerUid];
      try {
        const transceivers = pc.getTransceivers();
        const transceiver = transceivers.find(t => t.receiver.track.kind === kind);
        const sender = transceiver?.sender;
        if (sender && newTrack) {
          await sender.replaceTrack(newTrack);
        }
      } catch (err) {
        console.error(`Error replacing ${kind} track for peer ${peerUid}:`, err);
      }
    }
  };

  const toggleVideo = async () => {
    if (!localStream || !activeCall) return;
    const isGroup = activeCall.isGroupCall;
    const pc = isGroup ? null : peerConnectionRef.current;

    const videoTrack = localStream.getVideoTracks()[0];
    const isDummy = videoTrack && (videoTrack as any).isDummy;

    if (videoTrack && !isDummy) {
      // Camera is on, turn off and switch back to dummy track
      videoTrack.stop();
      localStream.removeTrack(videoTrack);

      const dummyTrack = createDummyVideoTrack();
      if (dummyTrack) {
        localStream.addTrack(dummyTrack);
        if (isGroup) {
          await replaceTrackInMesh('video', dummyTrack);
        } else if (pc) {
          const videoTransceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'video');
          if (videoTransceiver?.sender) {
            await videoTransceiver.sender.replaceTrack(dummyTrack);
          }
        }
      }
      setIsVideoMuted(true);
    } else {
      // Camera is off, turn it on
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const cameraTrack = cameraStream.getVideoTracks()[0];

        if (videoTrack) {
          videoTrack.stop();
          localStream.removeTrack(videoTrack);
        }

        localStream.addTrack(cameraTrack);
        if (isGroup) {
          await replaceTrackInMesh('video', cameraTrack);
        } else if (pc) {
          const videoTransceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'video');
          if (videoTransceiver?.sender) {
            await videoTransceiver.sender.replaceTrack(cameraTrack);
          }
        }
        setIsVideoMuted(false);

        // Upgrade call to video call in Firestore
        if (!isGroup) {
          await updateDoc(doc(db, 'calls', activeCall.id), { type: 'video' });
        }
      } catch (err) {
        console.error("Camera access failed:", err);
        alert("Failed to access camera device.");
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!activeCall) return;
    const isGroup = activeCall.isGroupCall;
    const pc = isGroup ? null : peerConnectionRef.current;

    if (dbUser && dbUser.callingAllowed === false) {
      alert("Your calling and screen sharing permissions have been disabled by an administrator.");
      return;
    }

    if (!allowScreenShare) {
      alert("The host has disabled screen sharing permissions for you.");
      return;
    }

    if (!isScreenSharing) {
      if (screenSharerUid) {
        alert("Someone else is already sharing their screen.");
        return;
      }
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        if (isGroup) {
          await replaceTrackInMesh('video', screenTrack);
        } else if (pc) {
          const videoTransceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'video');
          const videoSender = videoTransceiver?.sender;
          if (videoSender) {
            await videoSender.replaceTrack(screenTrack);
          }
        }

        if (localVideoEl) {
          localVideoEl.srcObject = screenStream;
        }

        // Update Firestore screenSharerUid
        const myUid = isAdminOrSuperAdmin ? 'admin' : user?.uid;
        if (isGroup) {
          await updateDoc(doc(db, 'groupCalls', activeCall.id), {
            screenSharerUid: myUid
          });
        } else {
          await updateDoc(doc(db, 'calls', activeCall.id), {
            screenSharerUid: myUid
          });
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
    if (!activeCall) return;
    const isGroup = activeCall.isGroupCall;
    const pc = isGroup ? null : peerConnectionRef.current;

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    const fallbackTrack = localStream?.getVideoTracks()[0] || null;

    if (isGroup) {
      await replaceTrackInMesh('video', fallbackTrack);
      await updateDoc(doc(db, 'groupCalls', activeCall.id), {
        screenSharerUid: null
      });
    } else if (pc) {
      const videoTransceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'video');
      const videoSender = videoTransceiver?.sender;
      if (videoSender && fallbackTrack) {
        await videoSender.replaceTrack(fallbackTrack);
      }
      await updateDoc(doc(db, 'calls', activeCall.id), {
        screenSharerUid: null
      });
    }

    if (localVideoEl && localStream) {
      localVideoEl.srcObject = localStream;
    }

    setIsScreenSharing(false);
  };

  const cleanupCall = (finalState: 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'declined') => {
    const isGroup = activeCall?.isGroupCall;
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
    setCallState(isGroup ? 'idle' : finalState);
    setIsMuted(false);
    setIsVideoMuted(false);
    setIsScreenSharing(false);
    setRemoteHasVideo(false);
    setScreenSharerUid(null);
    setIsCallMinimized(false);
    
    if (!isGroup && (finalState === 'ended' || finalState === 'declined')) {
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
    <CallContext.Provider value={{ startCall, activeCall, callState, endCall, acceptCall, declineCall, incomingCall, isMuted, toggleMute, isVideoMuted, toggleVideo, isScreenSharing, toggleScreenShare, screenSharerUid, activeGroupCalls, joinGroupCall }}>
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
            className={isCallMinimized 
              ? "fixed bottom-6 right-6 z-[100] w-[340px] h-[260px] pointer-events-none" 
              : "fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6"
            }
          >
            <div className={isCallMinimized
              ? "bg-gray-950 border border-purple-500/30 rounded-2xl w-full h-full flex flex-col overflow-hidden relative shadow-2xl pointer-events-auto"
              : "bg-gray-950 border border-purple-500/20 rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden relative shadow-[0_0_50px_rgba(168,85,247,0.25)]"
            }>
              {/* Top Banner Info */}
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl flex items-center gap-2 border border-glass-border pointer-events-auto">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-white">
                    {activeCall.callerUid === (isAdminOrSuperAdmin ? 'admin' : user?.uid) ? activeCall.receiverName : activeCall.callerName}
                  </span>
                  <span className="text-[10px] text-purple-400 font-mono pl-1.5 border-l border-white/20">
                    {formatDuration(callDuration)}
                  </span>
                </div>
                
                {/* Minimize/Maximize button */}
                <button
                  onClick={() => setIsCallMinimized(!isCallMinimized)}
                  className="bg-black/60 backdrop-blur-md p-2 rounded-xl border border-glass-border text-white hover:bg-purple-600/30 hover:border-purple-500/50 transition-all pointer-events-auto flex items-center justify-center"
                  title={isCallMinimized ? "Maximize Call" : "Minimize Call"}
                >
                  {isCallMinimized ? <Maximize className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Video Grid Viewport */}
              <div ref={videoGridRef} className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                {activeCall?.isGroupCall ? (
                  <div className="flex w-full h-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 h-full p-4 bg-gray-950 overflow-y-auto pointer-events-auto">
                      {/* Local Video Stream */}
                      <div className="relative bg-gray-900 border border-purple-500/20 rounded-2xl overflow-hidden shadow-xl aspect-video flex items-center justify-center">
                        <video
                          ref={setLocalVideoEl}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full object-cover ${isScreenSharing ? '' : 'scale-x-[-1]'}`}
                        />
                        {isVideoMuted && (
                          <div className="absolute inset-0 bg-gray-950 flex flex-col items-center justify-center gap-1.5 z-10">
                            <VideoOff className="w-8 h-8 text-gray-600 animate-pulse" />
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Camera Disabled</span>
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-glass-border">
                          <span className="text-[10px] font-bold text-white">You (Local)</span>
                        </div>
                      </div>

                      {/* Other group participants */}
                      {groupCallParticipants.filter(uid => uid !== user?.uid).map(uid => {
                        const participantDoc = activeMeetingParticipants.find(p => p.uid === uid);
                        const name = participantDoc?.name || 'Developer';
                        const stream = meshRemoteStreams[uid];
                        return (
                          <div key={uid} className="relative bg-gray-900 border border-glass-border rounded-2xl overflow-hidden shadow-xl aspect-video flex items-center justify-center">
                            {stream ? (
                              <video
                                ref={el => {
                                  if (el) el.srcObject = stream;
                                }}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-3">
                                <div className="w-16 h-16 rounded-full bg-purple-500/10 border-2 border-purple-500/50 flex items-center justify-center text-purple-400 font-bold text-xl animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                  {name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs font-bold text-gray-300">{name}</span>
                              </div>
                            )}
                            
                            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-glass-border z-20">
                              <span className="text-[10px] font-bold text-green-400">Connected</span>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* If alone in the call, show waiting placeholder */}
                      {groupCallParticipants.length <= 1 && (
                        <div className="relative bg-gray-900 border border-glass-border rounded-2xl overflow-hidden shadow-xl aspect-video flex items-center justify-center border-dashed">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span className="text-xs text-gray-500 italic">Waiting for others to join...</span>
                            <span className="text-[10px] text-purple-400 font-mono">Room ID: {activeCall.id}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right-Side Participants Management Panel */}
                    {showParticipantsPanel && (
                      <div className="w-[320px] bg-gray-950 border-l border-glass-border flex flex-col h-full z-30 pointer-events-auto">
                        <div className="p-4 border-b border-glass-border flex justify-between items-center bg-gray-900 shrink-0">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Room Participants ({activeMeetingParticipants.length})</h4>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                          {activeMeetingParticipants.map(p => {
                            const isHost = meetingHostUid === p.uid;
                            const isMe = p.uid === user?.uid;
                            const name = p.name || 'Developer';
                            
                            return (
                              <div key={p.uid} className="flex items-center justify-between bg-gray-900/60 p-2.5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="relative shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-[10px] font-bold text-purple-400">
                                      {name.charAt(0).toUpperCase()}
                                    </div>
                                    {isHost && (
                                      <div className="absolute -top-1 -right-1 bg-yellow-500 text-black p-0.5 rounded-full" title="Host">
                                        <Crown className="w-2.5 h-2.5" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate max-w-[100px]">{name}</p>
                                    <p className="text-[9px] text-gray-500 truncate max-w-[100px]">
                                      {isMe ? 'You' : p.isMuted ? 'Muted' : 'Speaking'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {meetingHostUid === user?.uid && !isMe && (
                                    <>
                                      {/* Mute Button */}
                                      <button
                                        onClick={() => {
                                          setDoc(doc(db, 'groupCalls', activeCall.id, 'commands', p.uid), { command: 'mute' });
                                          import('react-hot-toast').then(m => m.default.success(`Mute request sent to ${name}`));
                                        }}
                                        className="p-1.5 rounded-lg bg-gray-950 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 cursor-pointer"
                                        title="Mute participant"
                                      >
                                        <MicOff className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Kick Button */}
                                      <button
                                        onClick={() => {
                                          if(confirm(`Kick ${name} from the meeting?`)) {
                                            setDoc(doc(db, 'groupCalls', activeCall.id, 'commands', p.uid), { command: 'kick' });
                                          }
                                        }}
                                        className="p-1.5 rounded-lg bg-gray-950 text-gray-400 hover:text-red-500 border border-white/5 hover:border-red-500/20 cursor-pointer"
                                        title="Kick participant"
                                      >
                                        <UserMinus className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Toggle Screen Share Permission */}
                                      <button
                                        onClick={() => {
                                          updateDoc(doc(db, 'groupCalls', activeCall.id, 'participants', p.uid), {
                                            allowScreenShare: p.allowScreenShare === false
                                          });
                                          import('react-hot-toast').then(m => m.default.success(`Screen share permission toggled for ${name}`));
                                        }}
                                        className={`p-1.5 rounded-lg border border-white/5 cursor-pointer ${p.allowScreenShare === false ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-gray-950 text-gray-400 hover:text-purple-400'}`}
                                        title={p.allowScreenShare === false ? "Enable screen share permission" : "Disable screen share permission"}
                                      >
                                        <ScreenShare className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Collaboration Control Control */}
                                      <button
                                        onClick={() => {
                                          setDoc(doc(db, 'groupCalls', activeCall.id, 'commands', p.uid), {
                                            command: 'request_control',
                                            hostName: dbUser?.name || 'Host'
                                          });
                                          import('react-hot-toast').then(m => m.default.success(`Control collaboration request sent to ${name}`));
                                        }}
                                        className="p-1.5 rounded-lg bg-gray-950 text-gray-400 hover:text-yellow-400 border border-white/5 hover:border-yellow-500/20 cursor-pointer"
                                        title="Request workspace collaboration"
                                      >
                                        <Laptop className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Remote Video Stream (Main Feed) */}
                    <video
                      ref={setRemoteVideoEl}
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />

                    {/* Local Video Stream (Floating PIP) */}
                    {!isCallMinimized && (
                      <div className="absolute bottom-4 right-4 w-40 h-28 md:w-52 md:h-36 bg-gray-900 border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl z-10">
                        <video
                          ref={setLocalVideoEl}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full object-cover ${isScreenSharing ? '' : 'scale-x-[-1]'}`}
                        />
                        {isVideoMuted && (
                          <div className="absolute inset-0 bg-gray-950/80 flex flex-col items-center justify-center gap-1.5">
                            <VideoOff className="w-6 h-6 text-gray-500" />
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Cam Off</span>
                          </div>
                        )}
                      </div>
                    )}

                    {isScreenSharing && !isCallMinimized && (
                      <div className="absolute top-4 right-4 z-20 bg-purple-600/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse">
                        <ScreenShare className="w-3.5 h-3.5" />
                        <span>Screen Sharing Active</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Bottom Controls Bar */}
              <div className={`${isCallMinimized ? 'p-2.5 gap-2' : 'p-4 gap-4'} bg-gray-950 border-t border-glass-border flex justify-center items-center shrink-0`}>
                <button
                  onClick={toggleMute}
                  className={`${isCallMinimized ? 'p-2 rounded-xl' : 'p-3 rounded-2xl'} border transition-all flex items-center justify-center ${isMuted ? 'bg-red-500/10 border-red-500 text-red-400 animate-pulse' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'}`}
                  title={isMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isMuted ? <MicOff className={isCallMinimized ? "w-4 h-4" : "w-5 h-5"} /> : <Mic className={isCallMinimized ? "w-4 h-4" : "w-5 h-5"} />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`${isCallMinimized ? 'p-2 rounded-xl' : 'p-3 rounded-2xl'} border transition-all flex items-center justify-center ${isVideoMuted ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'}`}
                  title={isVideoMuted ? "Enable Camera" : "Disable Camera"}
                >
                  {isVideoMuted ? <VideoOff className={isCallMinimized ? "w-4 h-4" : "w-5 h-5"} /> : <Video className={isCallMinimized ? "w-4 h-4" : "w-5 h-5"} />}
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`${isCallMinimized ? 'p-2 rounded-xl' : 'p-3 rounded-2xl'} border transition-all flex items-center justify-center ${isScreenSharing ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'}`}
                  title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
                >
                  <ScreenShare className={isCallMinimized ? "w-4 h-4" : "w-5 h-5"} />
                </button>

                {!isCallMinimized && (
                  <button
                    onClick={toggleFullscreen}
                    className="p-3 rounded-2xl border border-gray-800 bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-all flex items-center justify-center"
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
                )}

                {activeCall?.isGroupCall && (
                  <button
                    onClick={() => setShowParticipantsPanel(!showParticipantsPanel)}
                    className={`${isCallMinimized ? 'p-2 rounded-xl' : 'p-3 rounded-2xl'} border transition-all flex items-center justify-center gap-1.5 relative ${showParticipantsPanel ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    title="Participants List"
                  >
                    <Users className={isCallMinimized ? "w-4 h-4" : "w-5 h-5"} />
                    {!isCallMinimized && <span className="text-xs font-bold">{activeMeetingParticipants.length}</span>}
                  </button>
                )}

                <button
                  onClick={endCall}
                  className={`${isCallMinimized ? 'p-2 rounded-xl' : 'p-3 rounded-2xl'} bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.25)]`}
                  title="Hang Up"
                >
                  <PhoneOff className={isCallMinimized ? "w-4 h-4" : "w-5 h-5"} />
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
