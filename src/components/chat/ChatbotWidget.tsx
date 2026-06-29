'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp, getDocs } from 'firebase/firestore';
import { MessageCircle, X, Send, User, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '@/store/workspaceStore';

interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  receiverUid: string;
  text: string;
  timestamp: any;
  readStatus: boolean;
}

export default function ChatbotWidget() {
  const { user, dbUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChatUser, setActiveChatUser] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState<string>('');
  const [adminChats, setAdminChats] = useState<{uid: string, name: string, unread: number}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdminOrSuperAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';

  useEffect(() => {
    if (!user) return;

    if (isAdminOrSuperAdmin) {
      // Admin: Listen to all messages directed to 'admin' or sent by this admin
      const q = query(
        collection(db, 'chats'),
        orderBy('timestamp', 'asc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
        
        // Group by user for the admin list
        const chatMap = new Map<string, {uid: string, name: string, unread: number}>();
        msgs.forEach(m => {
          const isFromAdmin = m.senderUid === user.uid || m.senderUid === 'admin';
          const otherUid = isFromAdmin ? m.receiverUid : m.senderUid;
          const otherName = isFromAdmin ? 'User' : m.senderName; // simplified
          
          if (otherUid && otherUid !== 'admin') {
            const existing = chatMap.get(otherUid) || { uid: otherUid, name: otherName, unread: 0 };
            if (!m.readStatus && m.receiverUid === 'admin') {
              existing.unread += 1;
            }
            if (!isFromAdmin) existing.name = m.senderName; // keep latest name
            chatMap.set(otherUid, existing);
          }
        });
        
        setAdminChats(Array.from(chatMap.values()));
        setMessages(msgs);
      });
      return () => unsubscribe();
    } else {
      // Regular User: Listen to their own chat with 'admin'
      const q = query(
        collection(db, 'chats'),
        where('senderUid', 'in', [user.uid, 'admin']),
        orderBy('timestamp', 'asc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
        // Filter out messages not belonging to this user's thread
        msgs = msgs.filter(m => 
          (m.senderUid === user.uid && m.receiverUid === 'admin') || 
          (m.senderUid === 'admin' && m.receiverUid === user.uid)
        );
        setMessages(msgs);
      });
      return () => unsubscribe();
    }
  }, [user, isAdminOrSuperAdmin]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, activeChatUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    let receiver = 'admin';
    if (isAdminOrSuperAdmin) {
      if (!activeChatUser) return; // Admin must select a user
      receiver = activeChatUser;
    }

    try {
      await addDoc(collection(db, 'chats'), {
        senderUid: isAdminOrSuperAdmin ? 'admin' : user.uid, // Admin sends as 'admin' 
        senderName: isAdminOrSuperAdmin ? 'Support Team' : (dbUser?.name || user.email || 'User'),
        receiverUid: receiver,
        text: msgText,
        timestamp: serverTimestamp(),
        readStatus: false
      });
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  if (!user) return null;

  // Filter messages for the current view
  const displayMessages = isAdminOrSuperAdmin && activeChatUser
    ? messages.filter(m => m.senderUid === activeChatUser || m.receiverUid === activeChatUser)
    : messages;

  const totalUnread = isAdminOrSuperAdmin 
    ? adminChats.reduce((acc, c) => acc + c.unread, 0)
    : messages.filter(m => m.receiverUid === user.uid && !m.readStatus).length;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-gray-900 border border-glass-border shadow-2xl rounded-2xl w-[350px] h-[500px] mb-4 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-purple-600 p-4 flex items-center justify-between text-white shadow-md">
              <div className="flex items-center gap-2">
                {isAdminOrSuperAdmin && activeChatUser && (
                  <button onClick={() => setActiveChatUser(null)} className="p-1 hover:bg-purple-700 rounded transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <MessageCircle className="w-5 h-5" />
                <span className="font-bold">
                  {isAdminOrSuperAdmin ? (activeChatUser ? activeChatName : 'Active Chats') : 'Support Chat'}
                </span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white hover:bg-purple-700 p-1 rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-gray-950/50 p-4 flex flex-col gap-3">
              {isAdminOrSuperAdmin && !activeChatUser ? (
                // Admin User List
                <div className="flex flex-col gap-2">
                  {adminChats.length === 0 ? (
                    <p className="text-gray-500 text-center text-sm mt-10">No active chats.</p>
                  ) : (
                    adminChats.map(c => (
                      <button 
                        key={c.uid}
                        onClick={() => { setActiveChatUser(c.uid); setActiveChatName(c.name); }}
                        className="flex items-center justify-between p-3 rounded-xl border border-glass-border bg-gray-900 hover:bg-gray-800 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{c.name}</p>
                            <p className="text-gray-400 text-xs">Tap to reply</p>
                          </div>
                        </div>
                        {c.unread > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {c.unread}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              ) : (
                // Chat Thread
                <>
                  {displayMessages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm mt-10">
                      {isAdminOrSuperAdmin ? 'No messages yet.' : 'Send a message to our support team!'}
                    </div>
                  )}
                  {displayMessages.map((msg, i) => {
                    const isMe = isAdminOrSuperAdmin ? msg.senderUid === 'admin' : msg.senderUid === user.uid;
                    return (
                      <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          isMe 
                            ? 'bg-purple-600 text-white rounded-tr-sm' 
                            : 'bg-gray-800 text-gray-200 border border-glass-border rounded-tl-sm'
                        }`}>
                          <p className="text-sm">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 mx-1">
                          {isMe ? 'You' : msg.senderName}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Footer Input */}
            {(!isAdminOrSuperAdmin || (isAdminOrSuperAdmin && activeChatUser)) && (
              <form onSubmit={handleSendMessage} className="p-3 bg-gray-900 border-t border-glass-border flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors glow-purple flex items-center justify-center w-10 h-10"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-purple-600 hover:bg-purple-500 text-white rounded-full flex items-center justify-center shadow-lg glow-purple transition-transform hover:scale-105 relative"
      >
        <MessageCircle className="w-6 h-6" />
        {totalUnread > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
            {totalUnread}
          </span>
        )}
      </button>
    </div>
  );
}
