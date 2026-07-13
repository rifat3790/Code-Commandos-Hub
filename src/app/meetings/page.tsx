'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCall } from '@/context/CallContext';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, setDoc, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  Calendar, 
  Plus, 
  Link2, 
  Copy, 
  ExternalLink, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Bell,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { soundSynth } from '@/lib/sounds';
import { getGoogleCalendarUrl } from '@/lib/calendar';

export default function MeetingsPage() {
  const { user, dbUser } = useAuth();
  const { startCall, joinGroupCall, activeGroupCalls } = useCall();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);
  const [activeAmbience, setActiveAmbience] = useState<'off' | 'rain' | 'space'>('off');
  
  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      soundSynth.stopAllAmbience();
    };
  }, []);
  
  // Tab states
  const [activePanel, setActivePanel] = useState<'list' | 'schedule'>('list');

  // Schedule Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom calendar picker states
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDaySelect = (day: number) => {
    const year = pickerDate.getFullYear();
    const month = pickerDate.getMonth();
    const formattedMonth = (month + 1).toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    
    const dateStr = `${year}-${formattedMonth}-${formattedDay}T${selectedHour}:${selectedMinute}`;
    setDateTime(dateStr);
    setIsCalendarOpen(false);
  };

  const handleTimeChange = (hour: string, minute: string) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    if (dateTime) {
      const baseDate = dateTime.split('T')[0];
      setDateTime(`${baseDate}T${hour}:${minute}`);
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const formattedMonth = (now.getMonth() + 1).toString().padStart(2, '0');
      const formattedDay = now.getDate().toString().padStart(2, '0');
      setDateTime(`${year}-${formattedMonth}-${formattedDay}T${hour}:${minute}`);
    }
  };

  const handlePrevMonth = () => {
    setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 1));
  };

  const daysInMonth = getDaysInMonth(pickerDate.getFullYear(), pickerDate.getMonth());
  const firstDay = getFirstDayOfMonth(pickerDate.getFullYear(), pickerDate.getMonth());
  const monthName = pickerDate.toLocaleString('default', { month: 'long' });
  
  // Join Manual ID state
  const [joinMeetingId, setJoinMeetingId] = useState('');

  // Load user directory for invitees list
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.users) setAllUsers(data.users);
      })
      .catch(console.error);
  }, []);

  // Listen for scheduled meetings
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'meetings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meetingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      const isAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';
      const filtered = meetingsData.filter(m => 
        m.invitees?.includes(user.uid) || 
        m.createdById === user.uid ||
        isAdmin
      );
      
      setMeetings(filtered);
    });

    return () => unsubscribe();
  }, [user, dbUser]);

  // Handle URL auto-joining parameter (e.g. ?join=meeting_xyz)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const joinId = urlParams.get('join');
    if (joinId && meetings.length > 0) {
      const meeting = meetings.find(m => m.id === joinId);
      const title = meeting ? meeting.title : 'Zoom Sync';
      // Auto join
      setTimeout(() => {
        joinGroupCall(joinId, `Meeting: ${title}`);
      }, 500);
      
      // Clean query string
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [meetings]);

  const handleStartInstantCall = async () => {
    if (!user) return;
    const meetingId = 'meeting_' + Math.random().toString(36).substring(2);
    soundSynth.playSuccess();
    toast.success('Starting instant meeting room...');
    await startCall(meetingId, 'Instant Sync Room', 'video');
  };

  const handleManualJoin = () => {
    if (!joinMeetingId.trim()) {
      toast.error('Please enter a valid Meeting ID');
      return;
    }
    const cleanId = joinMeetingId.trim();
    const meeting = meetings.find(m => m.id === cleanId);
    const topic = meeting ? meeting.title : 'External Sync';
    joinGroupCall(cleanId, `Meeting: ${topic}`);
    setJoinMeetingId('');
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !dateTime) {
      toast.error('Title and Date & Time are required');
      return;
    }

    try {
      const newMeetingId = 'meeting_' + Math.random().toString(36).substring(2);
      
      const responses: Record<string, string> = { [user.uid]: 'accepted' };
      selectedInvitees.forEach(uid => {
        if (uid !== user.uid) responses[uid] = 'pending';
      });

      await setDoc(doc(db, 'meetings', newMeetingId), {
        id: newMeetingId,
        title: title.trim(),
        description: description.trim(),
        dateTime,
        invitees: [...selectedInvitees, user.uid],
        responses,
        createdById: user.uid,
        creatorName: dbUser?.name || user.email || 'Developer',
        createdAt: new Date().getTime()
      });

      soundSynth.playSuccess();
      toast.success('Meeting scheduled successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setDateTime('');
      setSelectedInvitees([]);
      setActivePanel('list');
    } catch (err) {
      console.error(err);
      toast.error('Failed to schedule meeting');
    }
  };

  const handleCopyLink = (mId: string) => {
    if (typeof window === 'undefined') return;
    const joinUrl = `${window.location.origin}/meetings?join=${mId}`;
    navigator.clipboard.writeText(joinUrl);
    soundSynth.playSuccess();
    toast.success('Meeting link copied to clipboard!');
  };

  const pendingReceivedInvites = useMemo(() => {
    if (!user) return [];
    return meetings.filter(m => m.invitees?.includes(user.uid) && m.responses?.[user.uid] === 'pending');
  }, [meetings, user]);

  const handleResponse = async (meetingId: string, status: 'accepted' | 'declined') => {
    if (!user) return;
    try {
      const meetingRef = doc(db, 'meetings', meetingId);
      await updateDoc(meetingRef, {
        [`responses.${user.uid}`]: status
      });
      soundSynth.playSuccess();
      toast.success(status === 'accepted' ? 'Invitation accepted!' : 'Invitation declined.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update response');
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm("Are you sure you want to delete this meeting? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'meetings', meetingId));
      soundSynth.playSuccess();
      toast.success("Meeting removed successfully");
      if (selectedMeeting?.id === meetingId) {
        setSelectedMeeting(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete meeting");
    }
  };

  return (
    <div className="space-y-6 w-full select-none">
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-glass-border pb-5 md:pr-36">
        <div>
          <h1 className="text-2xl font-black text-white tracking-wider uppercase">Meetings & Collaboration</h1>
          <p className="text-gray-400 text-xs mt-1">Schedule, invite, sync, and launch real-time zoom-style developer sessions.</p>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-gray-900 border border-glass-border p-1 rounded-xl shrink-0">
          <button
            onClick={() => { setActivePanel('list'); soundSynth.playClick(); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activePanel === 'list' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => { setActivePanel('schedule'); soundSynth.playClick(); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activePanel === 'schedule' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Schedule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Quick Actions & List */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {activePanel === 'list' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Pending Received Invitations */}
                {pendingReceivedInvites.length > 0 && (
                  <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 shadow-[0_4px_25px_rgba(168,85,247,0.12)] text-left space-y-3.5">
                    <div className="flex items-center gap-2 text-purple-400">
                      <Bell className="w-4 h-4 animate-bounce" />
                      <h4 className="text-xs font-black uppercase tracking-wider">Pending Invitations ({pendingReceivedInvites.length})</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pendingReceivedInvites.map(m => (
                        <div key={m.id} className="flex justify-between items-center p-3 rounded-xl bg-black/40 border border-purple-500/20 gap-3">
                          <div className="min-w-0">
                            <h5 className="text-white font-bold text-xs truncate">{m.title}</h5>
                            <p className="text-[9px] text-gray-400 truncate mt-0.5">By {m.creatorName}</p>
                            <div className="flex items-center gap-1 text-[9px] text-purple-300 mt-1 font-semibold">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(m.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => { handleResponse(m.id, 'declined'); soundSynth.playClick(); }}
                              className="py-1 px-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-[9px] hover:bg-red-500/20 transition-all cursor-pointer"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => { handleResponse(m.id, 'accepted'); soundSynth.playClick(); }}
                              className="py-1 px-2.5 rounded-lg bg-brand-green/20 border border-brand-green/30 text-brand-green font-bold text-[9px] hover:bg-brand-green hover:text-black transition-all glow-green cursor-pointer"
                            >
                              Accept
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Action Zoom Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card 1: Start Instant */}
                  <button
                    onClick={handleStartInstantCall}
                    className="p-5 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-650/10 to-amber-600/10 text-left hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_25px_rgba(249,115,22,0.05)]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <Video className="w-6 h-6" />
                    </div>
                    <h3 className="text-white font-black text-sm mt-4 tracking-wide uppercase">New Meeting</h3>
                    <p className="text-gray-400 text-[11px] mt-1 leading-relaxed">Start an instant room call with audio, video, & screen sharing.</p>
                  </button>

                  {/* Card 2: Manual Join */}
                  <div className="p-5 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-650/10 to-indigo-600/10 text-left shadow-[0_4px_25px_rgba(59,130,246,0.05)] flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Link2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-white font-black text-sm mt-4 tracking-wide uppercase">Join Room</h3>
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                      <input
                        type="text"
                        value={joinMeetingId}
                        onChange={e => setJoinMeetingId(e.target.value)}
                        placeholder="Meeting ID"
                        className="w-full bg-black/60 border border-glass-border rounded-xl px-3 py-2 text-xs text-white placeholder-gray-550 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={handleManualJoin}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-2 rounded-xl uppercase tracking-wider cursor-pointer transition-colors shadow"
                      >
                        Join Room
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Switch to Schedule */}
                  <button
                    onClick={() => { setActivePanel('schedule'); soundSynth.playClick(); }}
                    className="p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-650/10 to-indigo-600/10 text-left hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_25px_rgba(168,85,247,0.05)]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <h3 className="text-white font-black text-sm mt-4 tracking-wide uppercase">Schedule Session</h3>
                    <p className="text-gray-400 text-[11px] mt-1 leading-relaxed">Book a collaborative sync room, invite developers, & connect calendar.</p>
                  </button>
                </div>

                {/* Scheduled Meetings List */}
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-sm tracking-wider uppercase">Scheduled Syncs ({meetings.length})</h3>
                  
                  {meetings.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-glass-border bg-gray-900/20 text-center">
                      <Calendar className="w-8 h-8 text-gray-600 mx-auto" />
                      <p className="text-gray-500 text-xs mt-2 italic">No meetings found. Create or schedule one above!</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {meetings.map(m => {
                        const isCallActive = activeGroupCalls?.some((call: any) => call.id === m.id);
                        return (
                          <div 
                            key={m.id} 
                            onClick={() => setSelectedMeeting(m)}
                            className={`p-5 rounded-2xl border transition-all text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer ${selectedMeeting?.id === m.id ? 'bg-purple-950/20 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'bg-gray-900/60 border-glass-border hover:bg-gray-800/40'}`}
                          >
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2.5">
                                <h4 className="text-white font-bold text-sm truncate">{m.title}</h4>
                                {isCallActive && (
                                  <span className="bg-red-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse glow-red shrink-0">
                                    Live Call
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-450 text-xs line-clamp-1">{m.description || 'No description'}</p>
                              
                              <div className="flex flex-wrap items-center gap-3 text-gray-500 text-[10px] font-semibold mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {new Date(m.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                                <span className="flex items-center gap-1 border-l border-white/10 pl-3">
                                  <Users className="w-3.5 h-3.5" />
                                  {m.invitees?.length || 0} participants
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyLink(m.id);
                                }}
                                className="p-2.5 rounded-xl border border-glass-border bg-gray-950 text-gray-400 hover:text-white hover:bg-gray-850 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                                title="Copy Invite Link"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <a
                                href={getGoogleCalendarUrl(m)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="p-2.5 rounded-xl border border-glass-border bg-gray-950 text-gray-400 hover:text-white hover:bg-gray-850 transition-all flex items-center justify-center shrink-0"
                                title="Add to Google Calendar"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              {(m.createdById === user?.uid || dbUser?.role === 'super_admin' || dbUser?.role === 'admin') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMeeting(m.id);
                                  }}
                                  className="p-2.5 rounded-xl border border-red-500/30 bg-gray-950 text-red-400 hover:text-white hover:bg-red-950/30 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                                  title="Delete Meeting"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  joinGroupCall(m.id, `Meeting: ${m.title}`);
                                }}
                                className="flex-1 sm:flex-initial bg-brand-green/20 border border-brand-green/30 text-brand-green hover:bg-brand-green hover:text-black py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 glow-green cursor-pointer"
                              >
                                <Video className="w-4 h-4" /> Join Room
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="p-6 rounded-2xl bg-gray-900/60 border border-glass-border text-left"
              >
                <h3 className="text-white font-bold text-base tracking-wide uppercase border-b border-glass-border pb-3.5 mb-4">Schedule Collaboration Sync</h3>
                <form onSubmit={handleScheduleMeeting} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Meeting Topic (Title)</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => { setTitle(e.target.value); soundSynth.playClick(); }}
                      placeholder="e.g. Frontend Sprint Planning / Standup"
                      className="w-full bg-gray-950 border border-gray-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 relative">
                      <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Date & Time</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCalendarOpen(!isCalendarOpen);
                          soundSynth.playClick();
                        }}
                        className="w-full bg-gray-950 border border-gray-850 rounded-xl px-4 py-2.5 text-xs text-left text-white focus:outline-none focus:border-brand-green flex items-center justify-between cursor-pointer"
                      >
                        <span>
                          {dateTime ? new Date(dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Select Date & Time'}
                        </span>
                        <Calendar className="w-4 h-4 text-purple-400" />
                      </button>

                      {/* Dropdown Calendar Picker */}
                      {isCalendarOpen && (
                        <div className="absolute top-full left-0 mt-2 p-4 bg-gray-950 border border-glass-border rounded-2xl shadow-2xl z-[90] w-64 space-y-3.5">
                          <div className="flex items-center justify-between border-b border-glass-border pb-2">
                            <button
                              type="button"
                              onClick={handlePrevMonth}
                              className="p-1.5 hover:bg-gray-850 rounded-lg text-gray-450 hover:text-white cursor-pointer"
                            >
                              &larr;
                            </button>
                            <span className="text-xs font-bold text-white uppercase tracking-wider">{monthName} {pickerDate.getFullYear()}</span>
                            <button
                              type="button"
                              onClick={handleNextMonth}
                              className="p-1.5 hover:bg-gray-850 rounded-lg text-gray-450 hover:text-white cursor-pointer"
                            >
                              &rarr;
                            </button>
                          </div>

                          {/* Calendar Grid */}
                          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-500 font-bold mb-1">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <span key={d}>{d}</span>)}
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {[...Array(firstDay)].map((_, i) => (
                              <div key={`empty-${i}`} className="h-6" />
                            ))}
                            {[...Array(daysInMonth)].map((_, i) => {
                              const dayNum = i + 1;
                              const year = pickerDate.getFullYear();
                              const month = pickerDate.getMonth();
                              const formattedMonth = (month + 1).toString().padStart(2, '0');
                              const formattedDay = dayNum.toString().padStart(2, '0');
                              const currentSelectDay = dateTime.split('T')[0];
                              const thisDateStr = `${year}-${formattedMonth}-${formattedDay}`;
                              const isSelected = currentSelectDay === thisDateStr;

                              return (
                                <button
                                  key={dayNum}
                                  type="button"
                                  onClick={() => {
                                    handleDaySelect(dayNum);
                                    soundSynth.playClick();
                                  }}
                                  className={`h-6 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${isSelected ? 'bg-purple-600 text-white shadow shadow-purple-500/30' : 'text-gray-300 hover:bg-gray-800'}`}
                                >
                                  {dayNum}
                                </button>
                              );
                            })}
                          </div>

                          {/* Time select slider or dropdown */}
                          <div className="flex gap-2 border-t border-glass-border pt-3.5 items-center justify-between">
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Start Time</span>
                            <div className="flex items-center gap-1">
                              <select
                                value={selectedHour}
                                onChange={e => {
                                  handleTimeChange(e.target.value, selectedMinute);
                                  soundSynth.playClick();
                                }}
                                className="bg-black border border-gray-850 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none"
                              >
                                {[...Array(24)].map((_, h) => {
                                  const hr = h.toString().padStart(2, '0');
                                  return <option key={hr} value={hr}>{hr}</option>;
                                })}
                              </select>
                              <span className="text-white text-xs">:</span>
                              <select
                                value={selectedMinute}
                                onChange={e => {
                                  handleTimeChange(selectedHour, e.target.value);
                                  soundSynth.playClick();
                                }}
                                className="bg-black border border-gray-850 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none"
                              >
                                {['00', '15', '30', '45'].map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Duration Preset</label>
                      <select
                        defaultValue="30"
                        className="w-full bg-gray-950 border border-gray-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green"
                      >
                        <option value="15">15 minutes (Standup)</option>
                        <option value="30">30 minutes (Standard)</option>
                        <option value="45">45 minutes (Sync)</option>
                        <option value="60">1 hour (Deep Dive)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Description & Agenda</label>
                    <textarea
                      value={description}
                      onChange={e => { setDescription(e.target.value); soundSynth.playClick(); }}
                      placeholder="Add notes, tasks, or preparation requirements..."
                      className="w-full bg-gray-950 border border-gray-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green h-24 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Invite Developers</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-gray-850 p-3 rounded-2xl max-h-[160px] overflow-y-auto">
                      {allUsers.filter(u => u.firebaseUid && u.firebaseUid !== user?.uid).length === 0 ? (
                        <div className="col-span-2 text-center text-xs text-gray-500 italic py-4">
                          No other developers found.
                        </div>
                      ) : (
                        allUsers.filter(u => u.firebaseUid && u.firebaseUid !== user?.uid).map(u => {
                          const isSelected = selectedInvitees.includes(u.firebaseUid);
                          return (
                            <label key={u.firebaseUid} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-950/60 transition-colors cursor-pointer text-xs text-gray-300">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  soundSynth.playClick();
                                  if (isSelected) {
                                    setSelectedInvitees(prev => prev.filter(uid => uid !== u.firebaseUid));
                                  } else {
                                    setSelectedInvitees(prev => [...prev, u.firebaseUid]);
                                  }
                                }}
                                className="rounded border-gray-800 text-brand-green focus:ring-brand-green bg-gray-950 animate-pulse-slow"
                              />
                              <span>{u.name || u.email}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-green hover:bg-brand-green-hover text-black py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors glow-green cursor-pointer mt-2"
                  >
                    Schedule and Notify Team
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column: Meeting Details / Zoom Sidebar */}
        <div className="lg:col-span-4">
          <div className="p-5 rounded-2xl bg-gray-900/60 border border-glass-border text-left h-full flex flex-col">
            <h3 className="text-white font-bold text-xs tracking-wider uppercase border-b border-glass-border pb-3 mb-4">Meeting Room Detail</h3>
            
            {selectedMeeting ? (
              <div className="space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] bg-purple-500/10 border border-purple-500/15 text-purple-400 font-extrabold uppercase px-2.5 py-1 rounded-lg tracking-wider">
                      Meeting Info
                    </span>
                    <h4 className="text-white font-extrabold text-base mt-2.5 leading-snug">{selectedMeeting.title}</h4>
                    <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">{selectedMeeting.description || 'No description provided.'}</p>
                  </div>

                  <div className="space-y-2.5 border-t border-glass-border pt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-450 font-medium">Scheduled Time:</span>
                      <span className="text-white font-bold font-mono">
                        {new Date(selectedMeeting.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-450 font-medium">Room Host:</span>
                      <span className="text-white font-bold">{selectedMeeting.creatorName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-450 font-medium">Meeting ID:</span>
                      <span className="text-purple-400 font-bold font-mono select-text">{selectedMeeting.id}</span>
                    </div>
                  </div>

                  {/* Invitations response tracker */}
                  <div className="space-y-2 border-t border-glass-border pt-4">
                    <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wider block">Participant Status</span>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto">
                      {(selectedMeeting.invitees || []).map((uid: string) => {
                        const participantUser = allUsers.find(u => u.firebaseUid === uid || u.uid === uid);
                        const name = participantUser?.name || participantUser?.email || 'Developer';
                        const status = selectedMeeting.responses?.[uid] || 'pending';
                        
                        return (
                          <div key={uid} className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-glass-border/30">
                            <span className="text-xs text-gray-300 font-medium truncate max-w-[150px]">{name}</span>
                            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                              {status === 'accepted' && (
                                <span className="text-green-400 flex items-center gap-1 bg-green-500/10 border border-green-500/15 py-0.5 px-2 rounded-lg">
                                  <CheckCircle className="w-3 h-3" /> Accepted
                                </span>
                              )}
                              {status === 'declined' && (
                                <span className="text-red-400 flex items-center gap-1 bg-red-500/10 border border-red-500/15 py-0.5 px-2 rounded-lg">
                                  <XCircle className="w-3 h-3" /> Declined
                                </span>
                              )}
                              {status === 'pending' && (
                                <span className="text-amber-400 flex items-center gap-1 bg-amber-500/10 border border-amber-500/15 py-0.5 px-2 rounded-lg">
                                  <AlertCircle className="w-3 h-3 animate-pulse" /> Pending
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-glass-border pt-4">
                  <button
                    onClick={() => joinGroupCall(selectedMeeting.id, `Meeting: ${selectedMeeting.title}`)}
                    className="w-full bg-brand-green hover:bg-brand-green-hover text-black py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors glow-green cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Video className="w-4 h-4" /> Start Meeting Room
                  </button>
                  <button
                    onClick={() => handleCopyLink(selectedMeeting.id)}
                    className="w-full bg-gray-950 border border-glass-border text-gray-300 hover:text-white py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-4 h-4" /> Copy Invite Link
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500 border border-dashed border-glass-border rounded-2xl bg-gray-900/10">
                <FileText className="w-8 h-8 text-gray-600 mb-2" />
                <p className="text-xs italic leading-relaxed">Select a meeting from the list to view attendee response statuses, meeting details, and room credentials.</p>
              </div>
            )}
          </div>

          {/* Soundtrack Card */}
          <div className="p-5 rounded-2xl bg-gray-900/60 border border-glass-border text-left flex flex-col gap-4">
            <div>
              <h3 className="text-white font-bold text-xs tracking-wider uppercase">Focus Ambient Soundscape</h3>
              <p className="text-[10px] text-gray-500 mt-1">Immersive synthesized audio atmospheres to block distractions.</p>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundSynth.stopAllAmbience();
                  setActiveAmbience('off');
                  soundSynth.playClick();
                }}
                className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${activeAmbience === 'off' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-gray-950 border-gray-850 text-gray-400 hover:text-white'}`}
              >
                <span>Off</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSynth.playRainAmbience();
                  setActiveAmbience('rain');
                  soundSynth.playClick();
                }}
                className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${activeAmbience === 'rain' ? 'bg-blue-500/10 border-blue-500 text-blue-400 glow-blue animate-pulse' : 'bg-gray-950 border-gray-850 text-gray-400 hover:text-white'}`}
              >
                <span>Cyber Rain</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSynth.playSynthAmbience();
                  setActiveAmbience('space');
                  soundSynth.playClick();
                }}
                className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${activeAmbience === 'space' ? 'bg-purple-500/10 border-purple-500 text-purple-400 glow-purple animate-pulse' : 'bg-gray-950 border-gray-850 text-gray-400 hover:text-white'}`}
              >
                <span>Space Drone</span>
              </button>
            </div>

            {/* Equalizer Simulator Visualization */}
            {activeAmbience !== 'off' && (
              <div className="flex items-center justify-center gap-1 h-6 bg-black/40 border border-glass-border/30 rounded-xl p-2.5">
                {[...Array(9)].map((_, i) => (
                  <span
                    key={i}
                    className="w-1 bg-purple-500 rounded-full animate-bounce"
                    style={{
                      height: '100%',
                      animationDuration: `${0.4 + (i % 3) * 0.15}s`,
                      animationDelay: `${i * 50}ms`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
