'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, or, onSnapshot, addDoc, orderBy, serverTimestamp, getDocs, doc, updateDoc } from 'firebase/firestore';
import { MessageCircle, X, Send, User, ChevronLeft, Phone, Video, Bot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useCall } from '@/context/CallContext';
import { useChat } from '@ai-sdk/react';

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
  const { startCall } = useCall();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChatUser, setActiveChatUser] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState<string>('');
  const [chatList, setChatList] = useState<{uid: string, name: string, unread: number, lastMessage?: string, lastTimestamp?: number}[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Integrate AI Chat for the widget
  const { messages: aiMessages, append: appendAi, status: aiStatus } = useChat({
    api: '/api/chat',
    id: 'chatbot-widget-ai'
  });

  const POPULAR_EMOJIS = ['ðŸ˜Š', 'ðŸ˜‚', 'â¤ï¸', 'ðŸ‘', 'ðŸ”¥', 'ðŸ˜', 'ðŸ’»', 'ðŸ¤”', 'ðŸŽ‰', 'ðŸ™Œ', 'ðŸš€', 'âš ï¸', 'âœ…', 'âŒ', 'ðŸ‘€', 'ðŸ’¡', 'ðŸ’¬', 'ðŸ“Œ', 'âš¡', 'ðŸ¤'];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setIsEmojiOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleOpenChat = (e: CustomEvent) => {
      if (e.detail && e.detail.uid) {
        setIsOpen(true);
        setActiveChatUser(e.detail.uid);
        if (e.detail.name) setActiveChatName(e.detail.name);
      }
    };
    window.addEventListener('open-chat' as any, handleOpenChat);
    return () => window.removeEventListener('open-chat' as any, handleOpenChat);
  }, []);

  const isAdminOrSuperAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';

  useEffect(() => {
    if (isOpen && allUsers.length === 0) {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          if (data.users) setAllUsers(data.users);
        })
        .catch(console.error);
    }
  }, [isOpen, allUsers.length]);

  useEffect(() => {
    if (!user) return;

    let q;
    if (isAdminOrSuperAdmin) {
      q = query(
        collection(db, 'chats'),
        orderBy('timestamp', 'asc')
      );
    } else {
      q = query(
        collection(db, 'chats'),
        or(
          where('senderUid', '==', user.uid),
          where('receiverUid', '==', user.uid)
        )
      );
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      
      if (!isAdminOrSuperAdmin) {
        msgs.sort((a, b) => {
          const timeA = a.timestamp?.seconds || 0;
          const timeB = b.timestamp?.seconds || 0;
          return timeA - timeB;
        });
      }
      setMessages(msgs);
    });
    
    return () => unsubscribe();
  }, [user, isAdminOrSuperAdmin]);

  useEffect(() => {
    if (!user) return;

    const listMap = new Map<string, {uid: string, name: string, unread: number, lastMessage?: string, lastTimestamp: number}>();
    
    listMap.set('admin', { uid: 'admin', name: 'Support Team', unread: 0, lastMessage: '', lastTimestamp: 0 });

    allUsers.forEach(u => {
      if (u.firebaseUid === user.uid) return;
      listMap.set(u.firebaseUid, { 
        uid: u.firebaseUid, 
        name: u.name || u.email || 'User', 
        unread: 0, 
        lastMessage: '', 
        lastTimestamp: 0 
      });
    });

    messages.forEach(m => {
      const myId = isAdminOrSuperAdmin ? 'admin' : user.uid;
      const amISender = m.senderUid === myId || m.senderUid === user.uid;
      const amIReceiver = m.receiverUid === myId || m.receiverUid === user.uid;
      
      if (!amISender && !amIReceiver) return;
      
      let otherId = amISender ? m.receiverUid : m.senderUid;
      if (otherId === user.uid) otherId = 'admin'; 
      
      if (!listMap.has(otherId)) {
        listMap.set(otherId, { uid: otherId, name: m.senderName || 'User', unread: 0, lastMessage: '', lastTimestamp: 0 });
      }
      
      const existing = listMap.get(otherId)!;
      
      if (!m.readStatus && amIReceiver && m.senderUid !== user.uid) {
        existing.unread += 1;
      }
      
      if (!amISender && m.senderName) {
        existing.name = m.senderName;
      }
      
      const msgTime = m.timestamp?.seconds || m.timestamp?.toMillis?.() || 0;
      if (msgTime > existing.lastTimestamp) {
        existing.lastTimestamp = msgTime;
        existing.lastMessage = m.text;
      }
    });

    if (isAdminOrSuperAdmin) {
      listMap.delete('admin');
    }

    const sortedChats = Array.from(listMap.values()).sort((a, b) => b.lastTimestamp - a.lastTimestamp);
    
    // Inject AI Assistant at the top
    setChatList([
      { 
        uid: 'ai_assistant', 
        name: 'AI Assistant', 
        unread: 0, 
        lastMessage: aiMessages.length > 0 ? aiMessages[aiMessages.length - 1].content : 'Ask me anything! âœ¨', 
        lastTimestamp: Date.now() 
      },
      ...sortedChats
    ]);
  }, [messages, allUsers, user, isAdminOrSuperAdmin, aiMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiMessages, isOpen, activeChatUser]);

  useEffect(() => {
    if (!user || !isOpen || !activeChatUser || activeChatUser === 'ai_assistant') return;

    const msgsToUpdate = messages.filter(m => {
      if (m.readStatus) return false;
      const amIReceiver = isAdminOrSuperAdmin ? (m.receiverUid === 'admin' || m.receiverUid === user.uid) : m.receiverUid === user.uid;
      const isFromActive = m.senderUid === activeChatUser;
      return amIReceiver && isFromActive;
    });

    if (msgsToUpdate.length > 0) {
      msgsToUpdate.forEach(async (msg) => {
        try {
          await updateDoc(doc(db, 'chats', msg.id), {
            readStatus: true
          });
        } catch (error) {
          console.error("Error updating message read status:", error);
        }
      });
    }
  }, [isOpen, activeChatUser, messages, user, isAdminOrSuperAdmin]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    if (!activeChatUser) return;
    
    // Intercept AI Assistant messages
    if (activeChatUser === 'ai_assistant') {
      appendAi({ role: 'user', content: msgText });
      return;
    }

    let receiver = activeChatUser;

    try {
      await addDoc(collection(db, 'chats'), {
        senderUid: (isAdminOrSuperAdmin && receiver !== 'admin') ? 'admin' : user.uid, 
        senderName: (isAdminOrSuperAdmin && receiver !== 'admin') ? 'Support Team' : (dbUser?.name || user.email || 'User'),
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

  // Format AI messages to look like chat messages
  const aiDisplayMessages = aiMessages.map((m: any, i) => ({
    id: `ai-${m.id || i}`,
    senderUid: m.role === 'user' ? user.uid : 'ai_assistant',
    senderName: m.role === 'user' ? 'You' : 'AI Assistant',
    receiverUid: m.role === 'user' ? 'ai_assistant' : user.uid,
    text: m.content || m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '',
    timestamp: { seconds: Date.now() / 1000 },
    readStatus: true
  }));

  const displayMessages = activeChatUser === 'ai_assistant'
    ? aiDisplayMessages
    : activeChatUser
      ? messages.filter(m => {
          const myId = isAdminOrSuperAdmin ? 'admin' : user.uid;
          const amISender = m.senderUid === myId || m.senderUid === user.uid;
          const amIReceiver = m.receiverUid === myId || m.receiverUid === user.uid;
          const isOtherSender = m.senderUid === activeChatUser;
          const isOtherReceiver = m.receiverUid === activeChatUser;
          return (amISender && isOtherReceiver) || (amIReceiver && isOtherSender);
        })
      : [];

  const totalUnread = chatList.reduce((acc, c) => acc + c.unread, 0);

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
            <div className={`p-4 flex items-center justify-between text-black shadow-md ${activeChatUser === 'ai_assistant' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-brand-green'}`}>
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                {activeChatUser && (
                  <button onClick={() => setActiveChatUser(null)} className="p-1 hover:bg-black/10 rounded transition-colors shrink-0">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {activeChatUser === 'ai_assistant' ? (
                  <Sparkles className="w-5 h-5 shrink-0" />
                ) : (
                  <MessageCircle className="w-5 h-5 shrink-0" />
                )}
                <span className="font-bold truncate">
                  {activeChatUser ? activeChatName : 'Directory'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {activeChatUser && activeChatUser !== 'ai_assistant' && (
                  <>
                    <button
                      onClick={() => {
                        startCall(activeChatUser, activeChatName, 'audio');
                      }}
                      className="p-1 hover:bg-black/10 rounded transition-all hover:scale-105 text-black"
                      title="Audio Call"
                    >
                      <Phone className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => {
                        startCall(activeChatUser, activeChatName, 'video');
                      }}
                      className="p-1 hover:bg-black/10 rounded transition-all hover:scale-105 text-black"
                      title="Video Call"
                    >
                      <Video className="w-4.5 h-4.5" />
                    </button>
                  </>
                )}
                <button onClick={() => setIsOpen(false)} className="text-black/80 hover:text-black hover:bg-black/10 p-1 rounded transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-gray-950/50 p-4 flex flex-col gap-3">
              {!activeChatUser ? (
                // User Directory
                <div className="flex flex-col gap-2">
                  {chatList.length === 0 ? (
                    <p className="text-gray-500 text-center text-sm mt-10">No users found.</p>
                  ) : (
                    chatList.map(c => (
                      <button 
                        key={c.uid}
                        onClick={() => { setActiveChatUser(c.uid); setActiveChatName(c.name); }}
                        className={`flex items-center justify-between p-3 rounded-xl border border-glass-border transition-colors text-left ${c.uid === 'ai_assistant' ? 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20' : 'bg-gray-900 hover:bg-gray-800'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${c.uid === 'ai_assistant' ? 'bg-green-500 text-black' : 'bg-brand-green/20'}`}>
                            {c.uid === 'ai_assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5 text-brand-green" />}
                          </div>
                          <div>
                            <p className={`font-medium text-sm ${c.uid === 'ai_assistant' ? 'text-green-400 font-bold' : 'text-white'}`}>{c.name}</p>
                            <p className="text-gray-400 text-xs truncate max-w-[180px]">
                              {c.lastMessage || 'Tap to reply'}
                            </p>
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
                      {activeChatUser === 'ai_assistant' ? 'Ask me to write code, generate images, or review text!' : 'No messages yet.'}
                    </div>
                  )}
                  {displayMessages.map((msg, i) => {
                    const myId = isAdminOrSuperAdmin ? 'admin' : user.uid;
                    const isMe = msg.senderUid === myId || msg.senderUid === user.uid;
                    return (
                      <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                          isMe 
                            ? 'bg-brand-green text-black rounded-tr-sm' 
                            : 'bg-gray-800 text-gray-200 border border-glass-border rounded-tl-sm'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 mx-1">
                          {isMe ? 'You' : msg.senderName}
                        </span>
                      </div>
                    );
                  })}
                  {activeChatUser === 'ai_assistant' && aiStatus === 'submitted' && (
                    <div className="flex flex-col items-start">
                      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-800 border border-glass-border rounded-tl-sm flex items-center gap-1.5 h-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1 mx-1">AI Assistant</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Footer Input */}
            {activeChatUser && (
              <div className="relative">
                {/* Emoji Picker Popover */}
                <AnimatePresence>
                  {isEmojiOpen && (
                    <motion.div
                      ref={emojiRef}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full right-3 mb-2 bg-gray-950 border border-glass-border p-2.5 rounded-xl shadow-[0_-5px_30px_rgba(0,0,0,0.5)] z-50 w-56 flex flex-wrap gap-1.5 justify-center max-h-[140px] overflow-y-auto"
                    >
                      {POPULAR_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setNewMessage(prev => prev + emoji);
                            setIsEmojiOpen(false);
                          }}
                          className="hover:bg-gray-800 p-1.5 rounded text-sm transition-colors duration-150"
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSendMessage} className="p-3 bg-gray-900 border-t border-glass-border flex gap-2 items-center">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={activeChatUser === 'ai_assistant' && aiStatus === 'submitted'}
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-green transition-colors disabled:opacity-50"
                  />
                  
                  {/* Emoji Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                    className={`p-2 rounded-xl border transition-all text-xs flex items-center justify-center w-10 h-10 shrink-0 ${isEmojiOpen ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'}`}
                    title="Insert Emoji"
                  >
                    ðŸ˜Š
                  </button>

                  <button
                    type="submit"
                    disabled={!newMessage.trim() || (activeChatUser === 'ai_assistant' && aiStatus === 'submitted')}
                    className="bg-brand-green hover:bg-brand-green-hover disabled:opacity-50 disabled:cursor-not-allowed text-black p-2 rounded-xl transition-colors glow-green flex items-center justify-center w-10 h-10 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-brand-green hover:bg-brand-green-hover text-black rounded-full flex items-center justify-center shadow-lg glow-green transition-transform hover:scale-105 relative"
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

