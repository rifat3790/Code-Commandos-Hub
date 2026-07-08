'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Send, 
  User, 
  Trash2, 
  Pin, 
  Search, 
  Plus, 
  Sparkles, 
  FileCode2, 
  Check,
  FolderOpen,
  ImageIcon,
  Code,
  Download
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { ChatSession, ChatMessage as StoreChatMessage } from '@/types';
import { useChat } from '@ai-sdk/react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const CHAT_CATEGORIES = [
  'General Assistant',
  'Delivery Message',
  'Update Log',
  'Revision Feedback',
  'Extension Request',
  'Meeting Prep',
  'Shopify Coding Help',
  'Reply Generator',
  'Translate & Summarize',
  'Tone Adjuster',
  'Store Descriptions'
];

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Inline Markdown Parser
function parseInlineStyles(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 rounded bg-gray-900 text-green-400 font-mono text-[13px] border border-glass-border">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function ImageCard({ url, prompt, onShowToast }: { url: string; prompt: string; onShowToast?: (msg: string) => void }) {
  const [loaded, setLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  const handleDownload = async () => {
    if (!url) return;
    setDownloading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const cleanName = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 30);
      a.download = `ai_${cleanName || 'image'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      if (onShowToast) onShowToast("Image downloaded successfully!");
    } catch (err) {
      window.open(url, '_blank');
    } finally {
      setDownloading(false);
    }
  };
  
  return (
    <div className="bg-gray-900 border border-glass-border rounded-2xl overflow-hidden max-w-sm w-full shadow-lg mt-2 mb-2 text-left">
      <div className="px-4 py-3 border-b border-glass-border flex items-center justify-between bg-gray-900/50">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-green-400" />
          <span className="text-xs font-semibold text-gray-400">
            {loaded ? 'Generated Image' : 'Sketching Artwork'}
          </span>
        </div>
        {loaded ? (
          <button 
            onClick={handleDownload}
            disabled={downloading}
            className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? 'Saving...' : 'Download'}
          </button>
        ) : (
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
        )}
      </div>
      
      <div className="p-4 flex flex-col items-center justify-center bg-gray-950/20 min-h-[256px]">
        {!loaded && (
          <div className="text-xs text-gray-500 animate-pulse flex flex-col items-center">
            <Sparkles className="w-6 h-6 mb-2 text-green-400" />
            Generating Canvas...
          </div>
        )}
        <img 
          src={url} 
          alt={prompt} 
          onLoad={() => setLoaded(true)}
          className={cn(
            "rounded-xl shadow-lg w-full h-auto object-cover max-h-[350px] border border-glass-border transition-all duration-300",
            loaded ? "block" : "hidden"
          )}
        />
      </div>
      <div className="px-4 py-3 bg-gray-900/30 text-[11px] text-gray-500 italic border-t border-glass-border">
        "{prompt}"
      </div>
    </div>
  );
}

function parseTextAndImages(text: string, onShowToast?: (msg: string) => void) {
  const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = imgRegex.exec(text)) !== null) {
    const textPart = text.substring(lastIndex, match.index);
    if (textPart.trim()) {
      parts.push({ type: 'text', content: textPart });
    }
    parts.push({ type: 'image', alt: match[1], url: match[2] });
    lastIndex = imgRegex.lastIndex;
  }

  const remaining = text.substring(lastIndex);
  if (remaining.trim() || parts.length === 0) {
    parts.push({ type: 'text', content: remaining });
  }

  return (
    <span className="w-full block">
      {parts.map((p, idx) => {
        if (p.type === 'text') {
          return <span key={idx}>{parseInlineStyles(p.content || '')}</span>;
        } else {
          return <ImageCard key={idx} url={p.url || ''} prompt={p.alt || 'Generated Image'} onShowToast={onShowToast} />;
        }
      })}
    </span>
  );
}

function renderMarkdown(content: string, onShowToast?: (msg: string) => void) {
  if (!content) return null;
  const parts = content.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const language = match ? match[1] : '';
      const code = match ? match[2] : part.slice(3, -3);
      
      return (
        <div key={index} className="my-4 rounded-xl overflow-hidden border border-glass-border bg-gray-950 font-mono text-[13px] leading-relaxed shadow-lg text-left">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-glass-border bg-gray-900/60 text-xs text-gray-400">
            <span className="flex items-center gap-1.5 font-sans font-medium uppercase tracking-wider text-[10px]">
              <FileCode2 className="w-3.5 h-3.5 text-green-400" />
              {language || 'code'}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(code);
                if (onShowToast) onShowToast("Code copied!");
              }}
              className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors text-[10px] uppercase font-semibold tracking-wider hover:text-white"
            >
              Copy
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-gray-300"><code>{code}</code></pre>
        </div>
      );
    }
    
    const lines = part.split('\n');
    return (
      <div key={index} className="space-y-2.5">
        {lines.map((line, lineIdx) => {
          let trimmed = line.trim();
          if (!trimmed) return <div key={lineIdx} className="h-1.5" />;
          
          if (trimmed.startsWith('###')) {
            return <h3 key={lineIdx} className="text-sm font-bold text-gray-50 mt-4 mb-1 tracking-tight flex items-center gap-1.5">{parseTextAndImages(trimmed.slice(3).trim(), onShowToast)}</h3>;
          }
          if (trimmed.startsWith('##')) {
            return <h2 key={lineIdx} className="text-base font-bold text-gray-50 mt-5 mb-2 tracking-tight">{parseTextAndImages(trimmed.slice(2).trim(), onShowToast)}</h2>;
          }
          if (trimmed.startsWith('#')) {
            return <h1 key={lineIdx} className="text-lg font-extrabold text-white mt-6 mb-3 tracking-tight">{parseTextAndImages(trimmed.slice(1).trim(), onShowToast)}</h1>;
          }
          
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <li key={lineIdx} className="list-disc list-inside text-gray-300 pl-2 leading-relaxed text-[13px] text-left">
                {parseTextAndImages(trimmed.slice(2), onShowToast)}
              </li>
            );
          }

          const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            return (
              <li key={lineIdx} className="list-decimal list-inside text-gray-300 pl-2 leading-relaxed text-[13px] text-left">
                {parseTextAndImages(numMatch[2], onShowToast)}
              </li>
            );
          }

          return <p key={lineIdx} className="text-[13px] text-gray-300 leading-relaxed text-left">{parseTextAndImages(trimmed, onShowToast)}</p>;
        })}
      </div>
    );
  });
}

export default function ChatPage() {
  const store = useWorkspaceStore();
  const [searchSession, setSearchSession] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState('General Assistant');
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash-lite');
  const [input, setInput] = useState('');
  
  const [chatDraftText, setChatDraftText] = useState('');
  
  const threadEndRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { messages, setMessages, status, sendMessage } = useChat({
    api: '/api/chat',
    body: { selectedModel }
  } as any);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    store.hydrate();
  }, []);

  // Set first session as active or create default
  useEffect(() => {
    if (store.chatSessions.length > 0 && !activeSessionId) {
      setActiveSessionId(store.chatSessions[0].id);
    }
  }, [store.chatSessions, activeSessionId]);

  // Load messages from store when session changes
  useEffect(() => {
    const session = store.chatSessions.find(s => s.id === activeSessionId);
    if (session) {
      setMessages(session.messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content
      })) as any);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  // Sync useChat messages to store on changes
  useEffect(() => {
    if (activeSessionId && messages.length > 0) {
      const currentSession = store.chatSessions.find(s => s.id === activeSessionId);
      if (currentSession && JSON.stringify(currentSession.messages.map(m => m.content)) !== JSON.stringify(messages.map((m: any) => m.content || ''))) {
        store.updateChatSession(activeSessionId, {
          messages: messages.map((m: any) => ({
            id: m.id,
            role: m.role as any,
            content: m.content || '',
            timestamp: new Date().toISOString()
          }))
        });
      }
    }
  }, [messages, activeSessionId]);

  // Scroll to bottom
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const activeSession = useMemo(() => {
    return store.chatSessions.find(s => s.id === activeSessionId) || null;
  }, [activeSessionId, store.chatSessions]);

  const filteredSessions = useMemo(() => {
    return store.chatSessions.filter(s => 
      s.title.toLowerCase().includes(searchSession.toLowerCase()) ||
      s.category.toLowerCase().includes(searchSession.toLowerCase())
    );
  }, [store.chatSessions, searchSession]);

  const handleStartNewSession = () => {
    const newSession: ChatSession = {
      id: Math.random().toString(36).substring(2),
      title: `Session: ${activeCategory}`,
      category: activeCategory,
      messages: [],
      isPinned: false,
      updatedAt: new Date().toISOString()
    };
    store.addChatSession(newSession);
    setActiveSessionId(newSession.id);
  };

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let targetSessionId = activeSessionId;

    if (!activeSession) {
      const newSession: ChatSession = {
        id: Math.random().toString(36).substring(2),
        title: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
        category: activeCategory,
        messages: [],
        isPinned: false,
        updatedAt: new Date().toISOString()
      };
      store.addChatSession(newSession);
      targetSessionId = newSession.id;
      setActiveSessionId(newSession.id);
    } else if (activeSession.messages.length === 0) {
      store.updateChatSession(targetSessionId, {
        title: input.slice(0, 30) + (input.length > 30 ? '...' : '')
      });
    }

    sendMessage({ role: 'user', content: input } as any);
    setInput('');
  };

  const handlePinSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const session = store.chatSessions.find(s => s.id === id);
    if (!session) return;
    store.updateChatSession(id, { isPinned: !session.isPinned });
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    store.deleteChatSession(id);
    if (activeSessionId === id) {
      setActiveSessionId(store.chatSessions[0]?.id || '');
    }
  };

  // Chat Tools panel handlers
  const handleChatTool = (tool: 'rewrite' | 'expand' | 'shorten' | 'formal' | 'friendly' | 'professional') => {
    if (!chatDraftText.trim()) return;
    let prompt = `Rewrite the following text to be ${tool}:\n\n${chatDraftText}`;
    sendMessage({ role: 'user', content: prompt } as any);
    setChatDraftText('');
    store.logActivity('Draft Modified by AI', 'chat', `Applied tool: ${tool}`);
  };

  const handleCompareVersions = () => {
    if (!chatDraftText.trim()) return;
    const prompt = `Generate 3 versions of this reply (Formal, Friendly, Professional) for me to choose from:\n\n${chatDraftText}`;
    sendMessage({ role: 'user', content: prompt } as any);
    setChatDraftText('');
  };

  return (
    <div className="h-full flex flex-col space-y-6 pb-12 relative">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-1/2 translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 border border-glass-border text-gray-200 text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg"
          >
            <Check className="w-4 h-4 text-green-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            AI ASSISTANT
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </h1>
          <p className="text-gray-400 text-sm font-medium">Powered by Gemini & Code Commandos Intel</p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-2 rounded-lg glass-input text-xs cursor-pointer text-green-400 border-green-500/20"
          >
            <option value="gemini-2.0-flash-lite">Gemini Flash Lite</option>
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            <option value="openai">ChatGPT (GPT-4o)</option>
          </select>
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="px-3 py-2 rounded-lg glass-input text-xs cursor-pointer"
          >
            {CHAT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            onClick={handleStartNewSession}
            className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1 glow-green"
          >
            <Plus className="w-4 h-4" />
            <span>New Session</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 border border-glass-border rounded-2xl bg-gray-950/20 overflow-hidden min-h-[580px] h-[calc(100vh-180px)]">
        
        {/* Left Side: Sessions Directory */}
        <div className="border-r border-glass-border bg-gray-950/45 p-4 overflow-y-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchSession}
              onChange={(e) => setSearchSession(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg glass-input text-xs"
            />
          </div>

          <div className="space-y-3 text-left">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Recent Sessions</span>
            
            <div className="space-y-1">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => {
                  const isActive = activeSessionId === session.id;
                  return (
                    <div
                      key={session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between gap-3 text-xs ${
                        isActive ? 'bg-glass-hover text-green-400 border border-green-500/15' : 'text-gray-400 hover:text-white hover:bg-glass-hover/40'
                      }`}
                    >
                      <div className="overflow-hidden flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-gray-500 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold truncate">{session.title || 'New Chat'}</p>
                          <span className="text-[9px] text-gray-500">{session.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={(e) => handlePinSession(session.id, e)}
                          className="p-1 text-gray-500 hover:text-white"
                        >
                          <Pin className={`w-3 h-3 ${session.isPinned ? 'fill-white text-white' : ''}`} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="p-1 text-gray-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 text-center py-6">No chat sessions found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Center: Interactive Thread */}
        <div className="lg:col-span-2 flex flex-col h-full overflow-hidden bg-gray-950/15 relative">
          
          <div className="flex-1 p-4 overflow-y-auto space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-sm font-medium text-gray-300">How can I help you today?</p>
                <p className="text-xs max-w-xs text-center text-gray-500">
                  Ask me to generate images, write Shopify code, fix liquid bugs, or draft emails.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div 
                    key={msg.id || idx}
                    className={`flex gap-3 w-full ${isAssistant ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                      isAssistant ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-gray-950 border-white/10 text-white'
                    }`}>
                      {isAssistant ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4 h-4" />}
                    </div>
                    
                    <div className={`flex flex-col gap-2 max-w-[85%] ${isAssistant ? 'items-start' : 'items-end'}`}>
                      
                      {((msg as any).content || msg.parts?.some((p: any) => p.type === 'text')) && (
                        <div className={`p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                          isAssistant ? 'bg-gray-900 border border-glass-border text-gray-300 rounded-tl-sm' : 'bg-green-500 text-black font-semibold rounded-tr-sm text-left'
                        }`}>
                          {(msg as any).content 
                            ? renderMarkdown((msg as any).content, showToast) 
                            : renderMarkdown(msg.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '', showToast)}
                        </div>
                      )}

                      {(msg.parts?.filter((p: any) => p.type === 'tool-invocation').map((p: any) => p.toolInvocation))?.map((toolInvocation: any) => {
                        const toolCallId = toolInvocation.toolCallId;
                        if (toolInvocation.toolName === 'generateImage') {
                          return (
                            <ImageCard 
                              key={toolCallId}
                              url={toolInvocation.state === 'result' ? toolInvocation.result.url : ''} 
                              prompt={toolInvocation.args.prompt} 
                              onShowToast={showToast} 
                            />
                          );
                        }
                        return null;
                      })}

                    </div>
                  </div>
                );
              })
            )}

            {status === 'submitted' && (
              <div className="flex gap-3 w-full mr-auto text-left">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-green-500/10 border-green-500/20 text-green-400">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col gap-2 items-start">
                  <div className="px-4 py-3 rounded-2xl bg-gray-900 border border-glass-border rounded-tl-sm flex items-center gap-1.5 h-[42px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={threadEndRef} className="h-4" />
          </div>

          <form onSubmit={onFormSubmit} className="p-4 border-t border-glass-border bg-gray-950/20 shrink-0 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask liquid schemas, generate images, write code..."
              className="flex-1 px-4 py-2.5 rounded-lg glass-input text-xs font-medium focus:border-green-500/50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 glow-green"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>

        {/* Right Side: Quick Reply draft compiler tools */}
        <div className="border-l border-glass-border bg-gray-950/45 p-4 overflow-y-auto space-y-4 flex flex-col justify-between">
          <div className="space-y-4 text-left">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">AI Rewrite Helper</span>
            
            <textarea
              value={chatDraftText}
              onChange={(e) => setChatDraftText(e.target.value)}
              placeholder="Paste a message here, then click a tool below to have the AI process it..."
              rows={5}
              className="w-full p-3 rounded-lg glass-input text-xs leading-relaxed focus:border-green-500/50"
            />

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={() => handleChatTool('rewrite')} className="px-2 py-1.5 rounded border border-glass-border hover:border-green-500/50 bg-gray-950/60 hover:bg-glass-hover text-gray-300 text-[10px] font-bold uppercase tracking-wide transition-all">Rewrite</button>
              <button onClick={() => handleChatTool('expand')} className="px-2 py-1.5 rounded border border-glass-border hover:border-green-500/50 bg-gray-950/60 hover:bg-glass-hover text-gray-300 text-[10px] font-bold uppercase tracking-wide transition-all">Expand</button>
              <button onClick={() => handleChatTool('shorten')} className="px-2 py-1.5 rounded border border-glass-border hover:border-green-500/50 bg-gray-950/60 hover:bg-glass-hover text-gray-300 text-[10px] font-bold uppercase tracking-wide transition-all">Shorten</button>
              <button onClick={() => handleChatTool('formal')} className="px-2 py-1.5 rounded border border-glass-border hover:border-green-500/50 bg-gray-950/60 hover:bg-glass-hover text-gray-300 text-[10px] font-bold uppercase tracking-wide transition-all">Formal</button>
              <button onClick={() => handleChatTool('friendly')} className="px-2 py-1.5 rounded border border-glass-border hover:border-green-500/50 bg-gray-950/60 hover:bg-glass-hover text-gray-300 text-[10px] font-bold uppercase tracking-wide transition-all">Friendly</button>
              <button onClick={() => handleChatTool('professional')} className="px-2 py-1.5 rounded border border-glass-border hover:border-green-500/50 bg-gray-950/60 hover:bg-glass-hover text-gray-300 text-[10px] font-bold uppercase tracking-wide transition-all">Professional</button>
            </div>

            <button 
              onClick={handleCompareVersions}
              disabled={!chatDraftText.trim()}
              className="w-full mt-3 py-2 rounded-lg bg-gray-900 border border-glass-border text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 hover:border-green-500/50 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-green-400" />
              <span>Compare Replies by AI</span>
            </button>
          </div>

          <div className="p-3 rounded-lg border border-glass-border bg-gray-950/20 text-xs text-gray-500 text-left leading-relaxed mt-4">
            <span className="font-bold text-green-400 block mb-1">PRO-TIP:</span>
            The AI now handles image generation! Ask it to "Generate a logo" or "Draw a futuristic web design mockup" and it will render it instantly.
          </div>

        </div>

      </div>
    </div>
  );
}

