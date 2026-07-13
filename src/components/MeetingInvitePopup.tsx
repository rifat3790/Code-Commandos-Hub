'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Video, Check, X, Bell } from 'lucide-react';
import { soundSynth } from '@/lib/sounds';
import toast from 'react-hot-toast';

export default function MeetingInvitePopup() {
  const { user } = useAuth();
  const [activeInvite, setActiveInvite] = useState<any | null>(null);
  const [lastChimedId, setLastChimedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setActiveInvite(null);
      return;
    }

    const q = query(collection(db, 'meetings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meetings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Find an active meeting invitation where current user status is 'pending'
      // and meeting start time is not in the deep past (less than 2 hours ago)
      const now = Date.now();
      const invite = meetings.find(m => {
        const isInvited = m.invitees?.includes(user.uid);
        const isPending = m.responses?.[user.uid] === 'pending';
        const isRecent = new Date(m.dateTime).getTime() + 2 * 60 * 60 * 1000 > now;
        return isInvited && isPending && isRecent;
      });

      if (invite) {
        setActiveInvite(invite);
        if (lastChimedId !== invite.id) {
          soundSynth.playChime();
          setLastChimedId(invite.id);
        }
      } else {
        setActiveInvite(null);
      }
    });

    return () => unsubscribe();
  }, [user, lastChimedId]);

  const handleResponse = async (status: 'accepted' | 'declined') => {
    if (!user || !activeInvite) return;
    try {
      const meetingRef = doc(db, 'meetings', activeInvite.id);
      
      // Update response status inside Firebase document
      await updateDoc(meetingRef, {
        [`responses.${user.uid}`]: status
      });

      soundSynth.playSuccess();
      toast.success(status === 'accepted' ? 'Invitation accepted!' : 'Invitation declined.');
      setActiveInvite(null);
    } catch (err) {
      console.error('Error updating meeting response:', err);
      toast.error('Failed to send response');
    }
  };

  return (
    <AnimatePresence>
      {activeInvite && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed bottom-6 left-6 z-[200] max-w-[340px] w-full p-5 rounded-2xl glass-panel-heavy border border-purple-500/30 shadow-[0_8px_32px_rgba(168,85,247,0.25)] select-none text-left"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 animate-pulse">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest block">
                Meeting Invitation
              </span>
              <h4 className="text-white font-bold text-sm mt-0.5 truncate">
                {activeInvite.title}
              </h4>
              <p className="text-gray-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                {activeInvite.description || 'No description provided.'}
              </p>
              
              <div className="flex items-center gap-1.5 text-purple-300 text-[10px] font-semibold mt-2.5 bg-purple-500/10 border border-purple-500/15 py-1 px-2.5 rounded-lg w-fit">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date(activeInvite.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 mt-4">
            <button
              onClick={() => handleResponse('declined')}
              className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs hover:bg-red-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Decline
            </button>
            <button
              onClick={() => handleResponse('accepted')}
              className="flex-1 py-2 rounded-xl bg-brand-green/20 border border-brand-green/30 text-brand-green font-bold text-xs hover:bg-brand-green hover:text-black transition-all flex items-center justify-center gap-1.5 glow-green cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Accept
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
