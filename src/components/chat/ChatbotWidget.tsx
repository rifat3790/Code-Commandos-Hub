'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, or, onSnapshot, addDoc, orderBy, serverTimestamp, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { MessageCircle, X, Send, User, ChevronLeft, Phone, Video, Bot, Sparkles, Trash2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useCall } from '@/context/CallContext';
import { useChat } from '@ai-sdk/react';
import toast from 'react-hot-toast';
import { soundSynth } from '@/lib/sounds';

interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  receiverUid: string;
  text: string;
  timestamp: any;
  readStatus: boolean;
  isGroup?: boolean;
}

const showDesktopNotification = (title: string, body: string) => {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico'
    });
  }
};

export default function ChatbotWidget() {
  const { user, dbUser } = useAuth();
  const { startCall, joinGroupCall, activeGroupCalls } = useCall();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChatUser, setActiveChatUser] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState<string>('');
  const [chatList, setChatList] = useState<{uid: string, name: string, unread: number, lastMessage?: string, lastTimestamp?: number}[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [threadSearchQuery, setThreadSearchQuery] = useState('');
  const [isThreadSearchOpen, setIsThreadSearchOpen] = useState(false);
  
  // Group & Meeting states
  const [groups, setGroups] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isScheduleMeetingOpen, setIsScheduleMeetingOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [groupMemberSearchQuery, setGroupMemberSearchQuery] = useState('');
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingDesc, setNewMeetingDesc] = useState('');
  const [newMeetingDateTime, setNewMeetingDateTime] = useState('');
  const [selectedMeetingInvitees, setSelectedMeetingInvitees] = useState<string[]>([]);

  const emojiRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Integrate AI Chat for the widget
  const { messages: aiMessages, sendMessage: appendAi, status: aiStatus } = useChat({
    api: '/api/chat',
    id: 'chatbot-widget-ai'
  } as any);

  const POPULAR_EMOJIS = ['😀', '😂', '❤️', '👍', '🔥', '😱', '💻', '🤔', '🎉', '🙌', '🚀', '⚠️', '✅', '❌', '👀', '💡', '💬', '📌', '⚡', '😎'];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setIsEmojiOpen(false);
      }
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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

  // Listen for real-time messages (entire collection to support group chats)
  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'chats'),
      orderBy('timestamp', 'asc')
    );
    
    let isFirstLoad = true;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      
      msgs.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeA - timeB;
      });

      // Notification Logic
      if (!isFirstLoad) {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.doc.data() as ChatMessage;
            const myId = isAdminOrSuperAdmin ? 'admin' : user.uid;
            if (data.senderUid !== myId && data.senderUid !== user.uid) {
              showDesktopNotification(data.senderName || 'New Message', data.text);
            }
          }
        });
      } else {
        isFirstLoad = false;
      }

      setMessages(msgs);
    });
    
    return () => unsubscribe();
  }, [user, isAdminOrSuperAdmin]);

  // Listen for Groups
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'groups'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allGroups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const myId = user.uid;
      const filtered = allGroups.filter(g => 
        g.members?.includes(myId) || 
        g.createdById === myId ||
        isAdminOrSuperAdmin
      );
      setGroups(filtered);
    });
    return () => unsubscribe();
  }, [user, isAdminOrSuperAdmin]);

  // Listen for Meetings
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'meetings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMeetings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const myId = user.uid;
      const filtered = allMeetings.filter(m => 
        m.invitees?.includes(myId) || 
        m.createdById === myId ||
        isAdminOrSuperAdmin
      );
      setMeetings(filtered);
    });
    return () => unsubscribe();
  }, [user, isAdminOrSuperAdmin]);

  const handleCreateGroup = async () => {
    if (!user) return;
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    try {
      const newGroupId = 'group_' + Math.random().toString(36).substring(2);
      await setDoc(doc(db, 'groups', newGroupId), {
        id: newGroupId,
        name: newGroupName,
        members: [...selectedGroupMembers, user.uid],
        createdById: user.uid,
        createdAt: new Date().getTime()
      });
      setNewGroupName('');
      setSelectedGroupMembers([]);
      setIsCreateGroupOpen(false);
      toast.success('Group created successfully!');
    } catch (err) {
      console.error('Error creating group:', err);
      toast.error('Failed to create group');
    }
  };

  const handleScheduleMeeting = async () => {
    if (!user) return;
    if (!newMeetingTitle.trim() || !newMeetingDateTime) {
      toast.error('Please enter a title and date/time');
      return;
    }
    try {
      const newMeetingId = 'meeting_' + Math.random().toString(36).substring(2);
      await setDoc(doc(db, 'meetings', newMeetingId), {
        id: newMeetingId,
        title: newMeetingTitle,
        description: newMeetingDesc,
        dateTime: newMeetingDateTime,
        invitees: [...selectedMeetingInvitees, user.uid],
        createdById: user.uid,
        createdAt: new Date().getTime()
      });
      setNewMeetingTitle('');
      setNewMeetingDesc('');
      setNewMeetingDateTime('');
      setSelectedMeetingInvitees([]);
      setIsScheduleMeetingOpen(false);
      toast.success('Meeting scheduled successfully!');
    } catch (err) {
      console.error('Error scheduling meeting:', err);
      toast.error('Failed to schedule meeting');
    }
  };

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
      if (m.isGroup || m.receiverUid?.startsWith('group_') || m.receiverUid?.startsWith('meeting_')) return;
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
        lastMessage: aiMessages.length > 0 ? (aiMessages[aiMessages.length - 1] as any).content || (aiMessages[aiMessages.length - 1] as any).parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '...' : 'Ask me anything! ✨', 
        lastTimestamp: Date.now() 
      },
      ...sortedChats
    ]);
  }, [messages, allUsers, user, isAdminOrSuperAdmin, aiMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiMessages, isOpen, activeChatUser]);

  useEffect(() => {
    setThreadSearchQuery('');
    setIsThreadSearchOpen(false);
  }, [activeChatUser]);

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
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);

    if (!activeChatUser) return;
    
    // Intercept AI Assistant messages
    if (activeChatUser === 'ai_assistant') {
      appendAi({ role: 'user', parts: [{ type: 'text', text: msgText }] });
      return;
    }

    let receiver = activeChatUser;

    const isGroup = activeChatUser.startsWith('group_') || activeChatUser.startsWith('meeting_');

    try {
      await addDoc(collection(db, 'chats'), {
        senderUid: (isAdminOrSuperAdmin && receiver !== 'admin' && !isGroup) ? 'admin' : user.uid, 
        senderName: (isAdminOrSuperAdmin && receiver !== 'admin' && !isGroup) ? 'Support Team' : (dbUser?.name || user.email || 'User'),
        receiverUid: receiver,
        text: msgText,
        timestamp: serverTimestamp(),
        readStatus: false,
        isGroup: isGroup
      });

      // AI Auto-reply for Support
      if (!isAdminOrSuperAdmin && receiver === 'admin') {
        const chatHistory = messages
          .filter(m => (m.senderUid === user.uid && m.receiverUid === 'admin') || (m.senderUid === 'admin' && m.receiverUid === user.uid))
          .sort((a, b) => ((a.timestamp as any)?.seconds || 0) - ((b.timestamp as any)?.seconds || 0))
          .slice(-5)
          .map(m => ({
             role: m.senderUid === user.uid ? 'user' : 'assistant',
             content: m.text
          }));
          
        chatHistory.push({ role: 'user', content: msgText });

        fetch('https://text.pollinations.ai/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: 'You are Code Commandos AI Support. Reply in Bengali or English based on the user\'s language. Be brief, helpful and professional. If you cannot solve it fully, mention that the human support team will follow up later.' },
              ...chatHistory
            ],
            model: 'openai'
          })
        }).then(res => res.text()).then(aiReply => {
           if(aiReply) {
             addDoc(collection(db, 'chats'), {
               senderUid: 'admin',
               senderName: 'Support Team (AI)',
               receiverUid: user.uid,
               text: aiReply,
               timestamp: serverTimestamp(),
               readStatus: false
             }).catch(e => console.error("Error saving AI reply: ", e));
           }
        }).catch(err => console.error("AI Support Reply Error:", err));
      }
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!msgId || msgId.startsWith('ai-')) return;
    try {
      await deleteDoc(doc(db, 'chats', msgId));
      toast.success("Message deleted successfully", {
        style: {
          background: '#0c0c0e',
          color: '#10B981',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          fontSize: '11px',
          fontWeight: 'bold',
        }
      });
    } catch (error) {
      console.error("Error deleting message: ", error);
      toast.error("Failed to delete message");
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, targetUid: string) => {
    e.stopPropagation();
    if (!targetUid || targetUid === 'ai_assistant') return;
    
    if (!window.confirm("Are you sure you want to delete the entire conversation? This action cannot be undone.")) return;

    try {
      const myId = isAdminOrSuperAdmin ? 'admin' : user?.uid;
      if (!myId) return;

      const msgsToDelete = messages.filter(m => {
        const amISender = m.senderUid === myId || m.senderUid === user?.uid;
        const amIReceiver = m.receiverUid === myId || m.receiverUid === user?.uid;
        const isOtherSender = m.senderUid === targetUid;
        const isOtherReceiver = m.receiverUid === targetUid;
        return (amISender && isOtherReceiver) || (amIReceiver && isOtherSender);
      });

      if (msgsToDelete.length === 0) {
        toast.error("No messages found to delete");
        return;
      }

      const deletePromises = msgsToDelete.map(msg => deleteDoc(doc(db, 'chats', msg.id)));
      await Promise.all(deletePromises);

      toast.success("Conversation deleted successfully", {
        style: {
          background: '#0c0c0e',
          color: '#10B981',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          fontSize: '11px',
          fontWeight: 'bold',
        }
      });
      
      if (activeChatUser === targetUid) {
        setActiveChatUser(null);
      }
    } catch (error) {
      console.error("Error deleting conversation: ", error);
      toast.error("Failed to delete conversation");
    }
  };

  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;
    const parts = text.split(new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === search.toLowerCase() 
        ? <mark key={i} className="bg-yellow-300 text-black px-0.5 rounded font-semibold">{part}</mark> 
        : part
    );
  };

  // Format AI messages to look like chat messages
  const aiDisplayMessages = useMemo(() => {
    return aiMessages.map((m: any, i) => ({
      id: `ai-${m.id || i}`,
      senderUid: m.role === 'user' ? (user?.uid || '') : 'ai_assistant',
      senderName: m.role === 'user' ? 'You' : 'AI Assistant',
      receiverUid: m.role === 'user' ? 'ai_assistant' : (user?.uid || ''),
      text: m.content || m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '',
      timestamp: { seconds: Date.now() / 1000 },
      readStatus: true
    }));
  }, [aiMessages, user?.uid]);

  const displayMessages = useMemo(() => {
    const threadMsgs = activeChatUser === 'ai_assistant'
      ? aiDisplayMessages
      : activeChatUser
        ? messages.filter(m => {
            if (activeChatUser.startsWith('group_') || activeChatUser.startsWith('meeting_')) {
              return m.receiverUid === activeChatUser;
            }
            const myId = isAdminOrSuperAdmin ? 'admin' : (user?.uid || '');
            const amISender = m.senderUid === myId || m.senderUid === user?.uid;
            const amIReceiver = m.receiverUid === myId || m.receiverUid === user?.uid;
            const isOtherSender = m.senderUid === activeChatUser;
            const isOtherReceiver = m.receiverUid === activeChatUser;
            return (amISender && isOtherReceiver) || (amIReceiver && isOtherSender);
          })
        : [];
    if (!threadSearchQuery.trim()) return threadMsgs;
    return threadMsgs.filter(m => 
      m.text.toLowerCase().includes(threadSearchQuery.toLowerCase())
    );
  }, [activeChatUser, aiDisplayMessages, messages, user, isAdminOrSuperAdmin, threadSearchQuery]);

  const totalUnread = chatList.reduce((acc, c) => acc + c.unread, 0);

  if (!user) return null;

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
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
                    {activeGroupCalls?.some((call: any) => call.id === activeChatUser) ? (
                      <button
                        onClick={() => {
                          joinGroupCall(activeChatUser, activeChatName);
                        }}
                        className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl uppercase tracking-wider glow-red cursor-pointer mr-1 animate-pulse"
                      >
                        Join Call
                      </button>
                    ) : (
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
                    <button
                      onClick={() => {
                        setIsThreadSearchOpen(!isThreadSearchOpen);
                        if (isThreadSearchOpen) setThreadSearchQuery('');
                      }}
                      className={`p-1 rounded transition-all hover:scale-105 ${isThreadSearchOpen ? 'bg-black/20 text-black font-extrabold scale-110' : 'text-black hover:bg-black/10'}`}
                      title="Search Chat History"
                    >
                      <Search className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(e, activeChatUser)}
                      className="p-1 hover:bg-red-500/20 hover:text-red-800 rounded transition-all hover:scale-105 text-black ml-0.5"
                      title="Delete Entire Conversation"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </>
                )}
                <button onClick={() => setIsOpen(false)} className="text-black/80 hover:text-black hover:bg-black/10 p-1 rounded transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Header Search Bar */}
            {isThreadSearchOpen && activeChatUser && (
              <div className="px-3 py-2 bg-gray-950 border-b border-glass-border flex items-center gap-2 shrink-0 text-left">
                <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search in conversation..."
                  value={threadSearchQuery}
                  onChange={(e) => setThreadSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none focus:ring-0 placeholder:text-gray-600 outline-none"
                  autoFocus
                />
                {threadSearchQuery && (
                  <button 
                    onClick={() => setThreadSearchQuery('')}
                    className="text-gray-500 hover:text-white text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto bg-gray-950/50 p-4 flex flex-col gap-3">
              {!activeChatUser ? (
                // User Directory (Categorized)
                <div className="flex flex-col gap-4">
                  {/* AI Assistant */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-gray-500 font-bold uppercase tracking-wider text-[10px] text-left">AI Assistant</h3>
                    {chatList.filter(c => c.uid === 'ai_assistant').map(c => (
                      <button 
                        key={c.uid}
                        onClick={() => { setActiveChatUser(c.uid); setActiveChatName(c.name); }}
                        className="flex items-center justify-between p-3 rounded-xl border border-glass-border transition-colors text-left bg-green-500/10 hover:bg-green-500/20 border-green-500/20 w-full"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500 text-black">
                            <Bot className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-green-400">{c.name}</p>
                            <p className="text-gray-400 text-xs truncate max-w-[180px]">
                              {c.lastMessage || 'Tap to reply'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Group Channels */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-gray-500 font-bold uppercase tracking-wider text-[10px] text-left">Group Channels</h3>
                      <button 
                        onClick={() => setIsCreateGroupOpen(true)}
                        className="text-[10px] text-brand-green hover:underline uppercase font-bold tracking-wider"
                      >
                        + Create
                      </button>
                    </div>
                    {groups.length === 0 ? (
                      <p className="text-gray-600 text-[11px] italic text-left px-1">No groups created yet.</p>
                    ) : (
                      groups.map(g => {
                        const isCallActive = activeGroupCalls?.some((call: any) => call.id === g.id);
                        return (
                          <div key={g.id} className="relative group flex items-center w-full">
                            <button 
                              onClick={() => { setActiveChatUser(g.id); setActiveChatName(g.name); }}
                              className="flex-1 flex items-center justify-between p-3 rounded-xl border border-glass-border bg-gray-900 hover:bg-gray-800 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-400 border border-purple-500/35 font-bold text-sm">
                                  G
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-sm text-white">{g.name}</p>
                                    {isCallActive && (
                                      <span className="w-2 h-2 rounded-full bg-red-550 animate-pulse" title="Active Call" />
                                    )}
                                  </div>
                                  <p className="text-gray-450 text-[11px] truncate max-w-[180px]">
                                    {g.members?.length || 0} members
                                  </p>
                                </div>
                              </div>
                              {isCallActive && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    joinGroupCall(g.id, g.name);
                                  }}
                                  className="bg-red-600 hover:bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider glow-red cursor-pointer z-10 shrink-0"
                                >
                                  Join Call
                                </button>
                              )}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Meetings Schedule */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-gray-500 font-bold uppercase tracking-wider text-[10px] text-left">Meetings Schedule</h3>
                      <button 
                        onClick={() => setIsScheduleMeetingOpen(true)}
                        className="text-[10px] text-brand-green hover:underline uppercase font-bold tracking-wider"
                      >
                        + Schedule
                      </button>
                    </div>
                    {meetings.length === 0 ? (
                      <p className="text-gray-600 text-[11px] italic text-left px-1">No meetings scheduled.</p>
                    ) : (
                      meetings.map(m => (
                        <div key={m.id} className="p-3 rounded-xl border border-purple-500/20 bg-purple-950/10 flex flex-col gap-2 text-left">
                          <div>
                            <p className="font-bold text-xs text-white uppercase tracking-wider">{m.title}</p>
                            <p className="text-gray-400 text-[11px] mt-0.5">{m.description || 'No description'}</p>
                            <p className="text-purple-400 text-[10px] font-mono mt-1">
                              {new Date(m.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              joinGroupCall(m.id, `Meeting: ${m.title}`);
                            }}
                            className="w-full bg-purple-600/25 border border-purple-500/35 text-purple-300 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Meeting Call</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Direct Messages */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-gray-500 font-bold uppercase tracking-wider text-[10px] text-left">Direct Messages</h3>
                    {chatList.filter(c => c.uid !== 'ai_assistant').length === 0 ? (
                      <p className="text-gray-650 text-xs italic text-left px-1">No chats yet.</p>
                    ) : (
                      chatList.filter(c => c.uid !== 'ai_assistant').map(c => (
                        <div key={c.uid} className="relative group flex items-center w-full">
                          <button 
                            onClick={() => { setActiveChatUser(c.uid); setActiveChatName(c.name); }}
                            className="flex-1 flex items-center justify-between p-3 rounded-xl border border-glass-border bg-gray-900 hover:bg-gray-800 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-brand-green/20 text-brand-green">
                                <User className="w-5 h-5 text-brand-green" />
                              </div>
                              <div>
                                <p className="font-medium text-sm text-white">{c.name}</p>
                                <p className="text-gray-400 text-xs truncate max-w-[180px]">
                                  {c.lastMessage || 'Tap to reply'}
                                </p>
                              </div>
                            </div>
                            {c.unread > 0 && (
                              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {c.unread}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={(e) => handleDeleteConversation(e, c.uid)}
                            className="absolute right-3 opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:scale-105 transition-all z-10"
                            title="Delete Entire Conversation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
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
                      <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group w-full`}>
                        <div className={`flex items-center gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse animate-fade-in-right' : 'flex-row animate-fade-in-left'}`}>
                          <div className={`rounded-2xl px-4 py-2 text-left ${
                            isMe 
                              ? 'bg-brand-green text-black rounded-tr-sm' 
                              : 'bg-gray-800 text-gray-200 border border-glass-border rounded-tl-sm'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{highlightText(msg.text, threadSearchQuery)}</p>
                          </div>
                          
                          {activeChatUser !== 'ai_assistant' && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:scale-105 transition-all duration-200 cursor-pointer shrink-0"
                              title="Delete Message from History"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
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
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      soundSynth.playClick();
                    }}
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
            {/* Create Group Modal */}
            {isCreateGroupOpen && (
              <div className="absolute inset-0 bg-gray-950/95 z-[60] flex flex-col p-4">
                <div className="flex items-center justify-between border-b border-glass-border pb-2.5 mb-4">
                  <h3 className="font-bold text-sm text-white">Create Group Channel</h3>
                  <button onClick={() => setIsCreateGroupOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Group Name</label>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      placeholder="e.g. Code commandos team"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-green"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Select Members</label>
                      <span className="text-[9px] text-purple-400 font-bold">{selectedGroupMembers.length} selected</span>
                    </div>
                    <input
                      type="text"
                      value={groupMemberSearchQuery}
                      onChange={e => { setGroupMemberSearchQuery(e.target.value); soundSynth.playClick(); }}
                      placeholder="Search member by name or email..."
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-brand-green mb-2"
                    />
                    <div className="space-y-2 max-h-[160px] overflow-y-auto border border-gray-900 p-2.5 rounded-xl bg-black/20">
                      {allUsers.filter(u => u.firebaseUid && u.firebaseUid !== user.uid).length === 0 ? (
                        <div className="text-center text-xs text-gray-500 italic py-4">No other members found.</div>
                      ) : (() => {
                        const filtered = allUsers.filter(u => 
                          u.firebaseUid && 
                          u.firebaseUid !== user.uid && 
                          (
                            (u.name || '').toLowerCase().includes(groupMemberSearchQuery.toLowerCase()) || 
                            (u.email || '').toLowerCase().includes(groupMemberSearchQuery.toLowerCase())
                          )
                        );
                        if (filtered.length === 0) {
                          return (
                            <div className="text-center text-xs text-gray-550 italic py-4">
                              No members matching "{groupMemberSearchQuery}"
                            </div>
                          );
                        }
                        return filtered.map(u => {
                          const isSelected = selectedGroupMembers.includes(u.firebaseUid);
                          return (
                            <label key={u.firebaseUid} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer text-xs text-gray-300 font-medium">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  soundSynth.playClick();
                                  if (isSelected) {
                                    setSelectedGroupMembers(prev => prev.filter(uid => uid !== u.firebaseUid));
                                  } else {
                                    setSelectedGroupMembers(prev => [...prev, u.firebaseUid]);
                                  }
                                }}
                                className="rounded border-gray-800 text-brand-green focus:ring-brand-green bg-gray-900"
                              />
                              <span className="truncate">{u.name || u.email}</span>
                            </label>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCreateGroup}
                  className="w-full mt-4 bg-brand-green hover:bg-brand-green-hover text-black py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Create Group
                </button>
              </div>
            )}

            {/* Schedule Meeting Modal */}
            {isScheduleMeetingOpen && (
              <div className="absolute inset-0 bg-gray-950/95 z-[60] flex flex-col p-4">
                <div className="flex items-center justify-between border-b border-glass-border pb-2.5 mb-4">
                  <h3 className="font-bold text-sm text-white">Schedule Meeting</h3>
                  <button onClick={() => setIsScheduleMeetingOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Meeting Title</label>
                    <input
                      type="text"
                      value={newMeetingTitle}
                      onChange={e => setNewMeetingTitle(e.target.value)}
                      placeholder="e.g. Daily Standup / Sync"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-green"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Description</label>
                    <textarea
                      value={newMeetingDesc}
                      onChange={e => setNewMeetingDesc(e.target.value)}
                      placeholder="Agenda, notes..."
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-green h-12 resize-none"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={newMeetingDateTime}
                      onChange={e => setNewMeetingDateTime(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-green"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Invite Members</label>
                    <div className="space-y-2 max-h-[100px] overflow-y-auto border border-gray-900 p-2 rounded-xl">
                      {allUsers.filter(u => u.firebaseUid !== user.uid).map(u => {
                        const isSelected = selectedMeetingInvitees.includes(u.firebaseUid);
                        return (
                          <label key={u.firebaseUid} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer text-xs text-gray-300">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedMeetingInvitees(prev => prev.filter(uid => uid !== u.firebaseUid));
                                } else {
                                  setSelectedMeetingInvitees(prev => [...prev, u.firebaseUid]);
                                }
                              }}
                              className="rounded border-gray-800 text-brand-green focus:ring-brand-green bg-gray-900"
                            />
                            <span>{u.name || u.email}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleScheduleMeeting}
                  className="w-full mt-4 bg-brand-green hover:bg-brand-green-hover text-black py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Schedule Meeting
                </button>
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

