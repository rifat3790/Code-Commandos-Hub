'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Bell, PhoneMissed, MessageSquare, Check, X, Phone, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppNotification } from '@/models/Notification';
import { useCall } from '@/context/CallContext';

export default function NotificationBell() {
  const { user, dbUser } = useAuth();
  const { startCall } = useCall();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const myUid = dbUser?.role === 'admin' || dbUser?.role === 'super_admin' ? 'admin' : user.uid;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', myUid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: AppNotification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as AppNotification);
      });
      // Sort client-side to avoid composite index requirement
      notifs.sort((a, b) => b.createdAt - a.createdAt);
      // Keep only top 30
      setNotifications(notifs.slice(0, 30));
    });

    return () => unsubscribe();
  }, [user, dbUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        if (n.id) {
          const ref = doc(db, 'notifications', n.id);
          batch.update(ref, { read: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  };

  const removeNotification = async (id: string) => {
    try {
      // For simplicity, mark as read, or actually delete. Let's just delete or hide.
      // Usually users want to delete notifications, but here we can just update a "deleted" flag or delete doc.
      // Let's delete the doc for cleanup.
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCallBack = (callerUid: string, callerName: string, type: 'audio' | 'video') => {
    setIsOpen(false);
    startCall(callerUid, callerName, type);
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-gray-900 border border-glass-border text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.5)] border-2 border-gray-950 animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-3 w-[340px] bg-gray-950 border border-glass-border rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden flex flex-col"
          >
            <div className="p-3 border-b border-glass-border flex items-center justify-between bg-gray-900/50">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[11px] text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto overflow-x-hidden custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-center opacity-50">
                  <Bell className="w-8 h-8 text-gray-500 mb-3" />
                  <p className="text-sm text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`relative p-3.5 border-b border-glass-border/50 transition-colors group ${!notif.read ? 'bg-purple-900/10 hover:bg-purple-900/20' : 'hover:bg-glass-hover'} flex gap-3`}
                      onMouseEnter={() => {
                        if (!notif.read && notif.id) markAsRead(notif.id);
                      }}
                    >
                      <div className="shrink-0 pt-0.5">
                        {notif.type === 'missed_call' ? (
                          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <PhoneMissed className="w-4 h-4 text-red-500" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <MessageSquare className="w-4 h-4 text-blue-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex justify-between items-start mb-0.5">
                          <h4 className={`text-sm font-semibold truncate ${!notif.read ? 'text-white' : 'text-gray-300'}`}>
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-gray-500 shrink-0 ml-2 mt-0.5">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed mb-2">
                          {notif.message}
                        </p>
                        
                        {notif.type === 'missed_call' && notif.actionData && (
                          <div className="flex gap-2 mt-2">
                            <button 
                              onClick={() => handleCallBack(notif.actionData!.callerUid!, notif.actionData!.callerName!, 'audio')}
                              className="px-2.5 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                            >
                              <Phone className="w-3 h-3" /> Call Back
                            </button>
                            <button 
                              onClick={() => handleCallBack(notif.actionData!.callerUid!, notif.actionData!.callerName!, 'video')}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                            >
                              <Video className="w-3 h-3" /> Video
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (notif.id) removeNotification(notif.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-md text-gray-500 hover:bg-red-500/10 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
