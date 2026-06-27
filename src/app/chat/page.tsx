'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Send, 
  User, 
  Trash2, 
  Pin, 
  Folder, 
  Search, 
  Plus, 
  Sparkles, 
  FileCode2, 
  ArrowRight,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { ChatSession, ChatMessage } from '@/types';

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

// Local rule-based Shopify expert reply mapper
const getMockResponse = (userMsg: string, category: string): string => {
  const msg = userMsg.toLowerCase();
  
  if (category === 'Shopify Coding Help' || msg.includes('liquid') || msg.includes('code') || msg.includes('schema')) {
    return `Here is a custom Shopify Liquid snippet and advice for your requirement:

### Liquid Code Snippet
\`\`\`liquid
{% comment %} Custom Shopify section rendering {% endcomment %}
<div class="custom-section-container" style="background-color: {{ section.settings.bg_color }};">
  {% if section.settings.show_title %}
    <h2 class="custom-title">{{ section.settings.title | escape }}</h2>
  {% endif %}
  
  <div class="products-grid">
    {% for product in collections[section.settings.collection].products limit: section.settings.limit %}
      {% render 'product-card-item', product: product %}
    {% else %}
      <p>Please select a collection containing products.</p>
    {% endfor %}
  </div>
</div>

{% schema %}
{
  "name": "Custom Collection Grid",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Section Title",
      "default": "Featured Products"
    },
    {
      "type": "checkbox",
      "id": "show_title",
      "label": "Show Title",
      "default": true
    },
    {
      "type": "collection",
      "id": "collection",
      "label": "Select Collection"
    },
    {
      "type": "range",
      "id": "limit",
      "min": 2,
      "max": 8,
      "step": 1,
      "label": "Product Limit",
      "default": 4
    },
    {
      "type": "color",
      "id": "bg_color",
      "label": "Background Color",
      "default": "#ffffff"
    }
  ],
  "presets": [
    {
      "name": "Custom Collection Grid",
      "category": "Products"
    }
  ]
}
{% endschema %}
\`\`\`

### Common Schema Errors Checklist:
1. Ensure all settings object keys are correct. Common mistakes include using "label" instead of "id" or missing comma separations.
2. In Liquid, verify you referenced the ID exactly matching schema e.g. \`section.settings.collection\`.
3. Check if standard render tags are present in theme snippets.`;
  }

  if (msg.includes('payment') || msg.includes('setup') || msg.includes('gateway')) {
    return `To handle shopify payment method setup questions professionally without violating policies, use this drafted outline:

1. **Information Required**: If they wish you to set up Shopify Payments, you need their Full Name, Address, DOB, SSN, Tax ID, and Bank Account.
2. **Alternative Action (Recommended)**: Give them manual instructions to avoid credentials sharing.
   - Go to Admin Panel > Settings > Payments.
   - Select credit card gateways or Paypal.
3. **Tutorial Video Reference**: Share this tutorial docs link: https://docs.google.com/document/d/1shb2g9yXsYfxwzl2-i8McwZfDZ9TcazvkKLsblHHxZk/edit

Let me know if you would like me to compile this into a template response for you.`;
  }

  if (msg.includes('revision') || msg.includes('fix') || msg.includes('change')) {
    return `Here is a polite response draft to handle client revisions:

"Hi there,\n\nThank you for sharing your feedback. I completely understand the modifications you want to implement.\n\nI have noted the details down regarding [changes] and I'm starting work on refining them right away. I will update you as soon as they are completed.\n\nThanks for your patience and support!"

Let me know what tone (friendly, formal, short) you would like to apply to this reply.`;
  }

  if (msg.includes('cancellation') || msg.includes('refund')) {
    return `When dealing with cancellation or refund requests, follow this protocol:
1. **Apologize Sincerely**: Validate their frustration.
2. **Propose Reconsideration**: Emphasize your Shopify experience and offer to make things right.
3. **Offer Zoom/Video Meeting**: Often, meeting to clarify issues resolves blockages.
4. **Partial Refund Offer**: If they persist and work was done, suggest a 60% partial refund through Fiverr (max allowed by system is 60%).

Let me know if you need to copy the cancellation resolution templates.`;
  }

  return `I have parsed your prompt: "${userMsg}". Here is a professional response template and guidance:

1. **Clarification**: Be specific about Shopify theme parameters (schema definitions vs liquid hooks).
2. **Fiverr Policy Check**: No restricted terms detected in your inquiry.
3. **Tone adjustment options**: You can use the "Rewrite Panel" below to convert this draft to Professional, Friendly, or Formal.

How can I help you adjust your Shopify developer workspace today?`;
};

export default function ChatPage() {
  const store = useWorkspaceStore();
  const [searchSession, setSearchSession] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState('General Assistant');
  
  const [inputText, setInputText] = useState('');
  const [chatDraftText, setChatDraftText] = useState('');
  const [compareReplies, setCompareReplies] = useState<Record<string, string> | null>(null);
  
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    store.hydrate();
  }, []);

  // Set first session as active or create default
  useEffect(() => {
    if (store.chatSessions.length > 0 && !activeSessionId) {
      setActiveSessionId(store.chatSessions[0].id);
    }
  }, [store.chatSessions, activeSessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSessionId, store.chatSessions]);

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
      messages: [
        {
          id: 'welcome-bot',
          role: 'assistant',
          content: `Hello! I am your Code Commandos Helper for category: **${activeCategory}**. Paste client concerns or Shopify liquid tasks below.`,
          timestamp: new Date().toISOString()
        }
      ],
      isPinned: false,
      updatedAt: new Date().toISOString()
    };
    store.addChatSession(newSession);
    setActiveSessionId(newSession.id);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    let targetSessionId = activeSessionId;

    // Create session if none active
    if (!activeSession) {
      const newSession: ChatSession = {
        id: Math.random().toString(36).substring(2),
        title: inputText.slice(0, 30) + (inputText.length > 30 ? '...' : ''),
        category: activeCategory,
        messages: [],
        isPinned: false,
        updatedAt: new Date().toISOString()
      };
      store.addChatSession(newSession);
      targetSessionId = newSession.id;
      setActiveSessionId(newSession.id);
    }

    // Add user message
    store.addChatMessage(targetSessionId, {
      role: 'user',
      content: inputText.trim()
    });

    const currentInput = inputText;
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      const botResponse = getMockResponse(currentInput, activeCategory);
      store.addChatMessage(targetSessionId, {
        role: 'assistant',
        content: botResponse
      });
    }, 1000);
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
    
    let result = '';
    const text = chatDraftText;
    
    if (tool === 'rewrite') {
      result = `Here is a custom rewrite of your text:\n\n${text.replace(/\bpayment\b/gi, 'gateway configuration')}`;
    } else if (tool === 'expand') {
      result = `Hello, hope you are doing well. I wanted to follow up and provide detailed feedback:\n\n${text}\n\nOur team is working diligently on all parameters of the Shopify integration to ensure a clean delivery. Let us know if you need anything.`;
    } else if (tool === 'shorten') {
      result = `${text.slice(0, 150)}...\n\nLet me know if this works.`;
    } else if (tool === 'formal') {
      result = `Dear Client,\n\nI am writing to provide an update. ${text}\n\nShould you have questions, please do not hesitate to contact me.\n\nBest regards,\nCode Commandos`;
    } else if (tool === 'friendly') {
      result = `Hey there! 😊 just wanted to let you know: ${text} Let me know if you need any adjustments! 🎉`;
    } else if (tool === 'professional') {
      result = `As per your specifications, I have processed the request. ${text} Please review and confirm the status.`;
    }

    setChatDraftText(result);
    store.logActivity('Draft Modified in Chat', 'chat', `Applied tool: ${tool}`);
  };

  const handleCompareVersions = () => {
    if (!chatDraftText.trim()) return;
    const text = chatDraftText;
    setCompareReplies({
      formal: `Dear Client,\n\nI trust this note finds you well. ${text}\n\nRespectfully,\nCode Commandos`,
      friendly: `Hey! Hope you are doing great! ${text} Let me know if you need anything! 😊`,
      professional: `Following up on the Shopify tasks: ${text} Review the URL and let me know.`,
    });
  };

  return (
    <div className="h-full flex flex-col space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">ASSISTANT CHAT</h1>
          <p className="text-gray-400 text-sm font-medium">Internal assistant for Shopify Liquid debugging, client messages drafts rewrites.</p>
        </div>
        
        <div className="flex gap-2">
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
                          <p className="font-bold truncate">{session.title}</p>
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
          
          {/* Thread messages container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {activeSession ? (
              activeSession.messages.map((msg) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div 
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] ${isAssistant ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                      isAssistant ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-gray-950 border-white/10 text-white'
                    }`}>
                      {isAssistant ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4 h-4" />}
                    </div>
                    
                    <div className="space-y-1">
                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isAssistant ? 'bg-gray-900 border border-glass-border text-gray-300' : 'bg-green-500 text-black font-semibold'
                      }`}>
                        <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed select-text">{msg.content}</pre>
                      </div>
                      <span className="text-[8px] text-gray-500 block px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                <Bot className="w-12 h-12 text-gray-600 stroke-[1.2]" />
                <p className="text-xs">No active chat session. Start a new session above.</p>
              </div>
            )}
            <div ref={threadEndRef} />
          </div>

          {/* User message input box */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-glass-border bg-gray-950/20 shrink-0 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask liquid schemas configs, revision templates, delivery tones..."
              className="flex-1 px-4 py-2.5 rounded-lg glass-input text-xs font-medium"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 glow-green"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>

        {/* Right Side: Quick Reply draft compiler tools */}
        <div className="border-l border-glass-border bg-gray-950/45 p-4 overflow-y-auto space-y-4 flex flex-col justify-between">
          <div className="space-y-4 text-left">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Draft Helper Box</span>
            
            <textarea
              value={chatDraftText}
              onChange={(e) => setChatDraftText(e.target.value)}
              placeholder="Paste user message reply here to run quick edit tools..."
              rows={5}
              className="w-full p-3 rounded-lg glass-input text-xs leading-relaxed"
            />

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={() => handleChatTool('rewrite')} className="px-2 py-1.5 rounded border border-glass-border hover:border-white/10 bg-gray-950/60 hover:bg-glass-hover text-gray-300 text-[10px] font-bold uppercase tracking-wide transition-all">Rewrite</button>
              <button onClick={() => handleChatTool('expand')} className="px-2 py-1.5 rounded border border-glass-border hover:border-white/10 bg-gray-950/60 hover:bg-glass-hover text-gray-300 text-[10px] font-bold uppercase tracking-wide transition-all">Expand</button>
              <button onClick={() => handleChatTool('shorten')} className="px-2 py-1.5 rounded border border-glass-border hover:border-white/10 bg-gray-950/60 hover:bg-glass-hover text-gray-300 text-[10px] font-bold uppercase tracking-wide transition-all">Shorten</button>
              <button onClick={() => handleChatTool('formal')} className="px-2 py-1.5 rounded border border-glass-border hover:border-white/10 bg-gray-950/60 hover:bg-glass-hover text-gray-300 text-[10px] font-bold uppercase tracking-wide transition-all">Formal</button>
              <button onClick={() => handleChatTool('friendly')} className="px-2 py-1.5 rounded border border-glass-border hover:border-white/10 bg-gray-950/60 hover:bg-glass-hover text-gray-300 text-[10px] font-bold uppercase tracking-wide transition-all">Friendly</button>
              <button onClick={() => handleChatTool('professional')} className="px-2 py-1.5 rounded border border-glass-border hover:border-white/10 bg-gray-950/60 hover:bg-glass-hover text-gray-300 text-[10px] font-bold uppercase tracking-wide transition-all">Professional</button>
            </div>

            <button 
              onClick={handleCompareVersions}
              disabled={!chatDraftText.trim()}
              className="w-full mt-3 py-2 rounded-lg bg-gray-900 border border-glass-border text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-glass-hover transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-green-400" />
              <span>Compare Replies side-by-side</span>
            </button>
          </div>

          {/* Compare replies panel results popup */}
          {compareReplies && (
            <div className="p-3 rounded-lg bg-gray-950 border border-glass-border text-left mt-4 space-y-3 max-h-[160px] overflow-y-auto">
              <div>
                <span className="text-[8px] text-gray-500 font-bold uppercase">Formal Option</span>
                <p className="text-[10px] text-gray-300 leading-relaxed font-mono truncate">{compareReplies.formal}</p>
              </div>
              <div className="pt-2 border-t border-white/5">
                <span className="text-[8px] text-gray-500 font-bold uppercase">Friendly Option</span>
                <p className="text-[10px] text-gray-300 leading-relaxed font-mono truncate">{compareReplies.friendly}</p>
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg border border-glass-border bg-gray-950/20 text-xs text-gray-500 text-left leading-relaxed">
            <span className="font-bold text-gray-400 block mb-1">PRO-TIP:</span>
            Insert preloaded templates into assistant chat by copying snippets directly from the Template center to test different rewrite outcomes!
          </div>

        </div>

      </div>
    </div>
  );
}
