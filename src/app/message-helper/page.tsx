'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Check, 
  Copy, 
  Trash2, 
  Sparkles, 
  History, 
  Save, 
  FileText,
  HelpCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';

// Helper to get a randomized obfuscated bypass term for words to avoid bot pattern matches
const getDynamicReplacement = (word: string): string => {
  const clean = word.toLowerCase();
  const variations: Record<string, string[]> = {
    payment: ['p-ayment', 'p_ayment'],
    payments: ['p-ayments', 'p_ayments'],
    pay: ['p-ay', 'p_ay'],
    contact: ['c-ontact', 'c_ontact'],
    fiverr: ['F-iverr', 'F_iverr'],
    whatsapp: ['w-hatsapp', 'w_hatsapp'],
    skype: ['s-kype', 's_kype'],
    zoom: ['z-oom', 'z_oom'],
    email: ['e-mail', 'e_mail'],
    gmail: ['g-mail', 'g_mail'],
    account: ['a-ccount', 'a_ccount'],
    address: ['a-ddress', 'a_ddress'],
    phone: ['p-hone', 'p_hone'],
    number: ['n-umber', 'n_umber'],
    bank: ['b-ank', 'b_ank'],
    paypal: ['p-aypal', 'p_aypal'],
    stripe: ['s-tripe', 's_tripe'],
    payout: ['p-ayout', 'p_ayout'],
    money: ['m-oney', 'm_oney'],
    dollar: ['d-ollar', 'd_ollar'],
    usd: ['u-sd', 'u_sd'],
    rating: ['r-ating', 'r_ating'],
    ratings: ['r-atings', 'r_atings'],
    review: ['r-eview', 'r_eview'],
    reviews: ['r-eviews', 'r_eviews']
  };

  const list = variations[clean];
  if (list && list.length > 0) {
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
  }
  
  // Dynamic fallback generator if no variations predefined
  if (word.length > 2) {
    const mid = Math.floor(word.length / 2);
    return word.slice(0, mid) + '-' + word.slice(mid);
  }
  return word;
};

// Helper for multi-level stealth bypass obfuscation modes
const getObfuscatedWord = (word: string, level: 'low' | 'medium' | 'high' | 'homoglyph'): string => {
  const clean = word.toLowerCase();
  
  const homoglyphs: Record<string, string> = {
    'a': 'а', // Cyrillic small letter a
    'c': 'с', // Cyrillic small letter es
    'e': 'е', // Cyrillic small letter ie
    'i': 'і', // Ukrainian/Belarusian i
    'o': 'о', // Cyrillic small letter o
    'p': 'р', // Cyrillic small letter er
    's': 'ѕ', // Macedonian dze
    'x': 'х', // Cyrillic small letter ha
    'y': 'у', // Cyrillic small letter u
  };

  if (level === 'homoglyph') {
    return word.split('').map(char => {
      const lowerChar = char.toLowerCase();
      if (homoglyphs[lowerChar]) {
        const repl = homoglyphs[lowerChar];
        return char === lowerChar ? repl : repl.toUpperCase();
      }
      return char;
    }).join('');
  }

  if (level === 'high') {
    // Zero-width space injection (\u200B)
    return word.split('').join('\u200B');
  }

  if (level === 'medium') {
    // Randomized symbols insertion
    const separators = ['_', '-', ' '];
    return word.split('').map((char, index) => {
      if (index < word.length - 1) {
        if (Math.random() < 0.45) {
          const sep = separators[Math.floor(Math.random() * separators.length)];
          return char + sep;
        }
      }
      return char;
    }).join('');
  }

  // Low/default level (uses standard preloaded variations)
  return getDynamicReplacement(word);
};

// Restricted words list and their professional replacement alternatives
const RESTRICTED_WORDS_MAP: { pattern: RegExp, word: string, getReplacement: () => string, professional: string }[] = [
  { pattern: /\bpayments\b/gi, word: 'payments', getReplacement: () => getDynamicReplacement('payments'), professional: 'order setups' },
  { pattern: /\bpayment\b/gi, word: 'payment', getReplacement: () => getDynamicReplacement('payment'), professional: 'order setup' },
  { pattern: /\bpay\b/gi, word: 'pay', getReplacement: () => getDynamicReplacement('pay'), professional: 'process the order' },
  { pattern: /\bstripe\b/gi, word: 'stripe', getReplacement: () => getDynamicReplacement('stripe'), professional: 'gateway channel' },
  { pattern: /\bpaypal\b/gi, word: 'paypal', getReplacement: () => getDynamicReplacement('paypal'), professional: 'payment merchant' },
  { pattern: /\bpayout\b/gi, word: 'payout', getReplacement: () => getDynamicReplacement('payout'), professional: 'order completion' },
  { pattern: /\bmoney\b/gi, word: 'money', getReplacement: () => getDynamicReplacement('money'), professional: 'funds' },
  { pattern: /\bdollar\b/gi, word: 'dollar', getReplacement: () => getDynamicReplacement('dollar'), professional: 'budget' },
  { pattern: /\busd\b/gi, word: 'usd', getReplacement: () => getDynamicReplacement('usd'), professional: 'budget' },
  { pattern: /\bcontact\b/gi, word: 'contact', getReplacement: () => getDynamicReplacement('contact'), professional: 'communication' },
  { pattern: /\bfiverr\b/gi, word: 'fiverr', getReplacement: () => getDynamicReplacement('fiverr'), professional: 'platform' },
  { pattern: /\bwhatsapp\b/gi, word: 'whatsapp', getReplacement: () => getDynamicReplacement('whatsapp'), professional: 'inbox messaging' },
  { pattern: /\bskype\b/gi, word: 'skype', getReplacement: () => getDynamicReplacement('skype'), professional: 'meeting' },
  { pattern: /\bzoom\b/gi, word: 'zoom', getReplacement: () => getDynamicReplacement('zoom'), professional: 'discussion' },
  { pattern: /\bemail\b/gi, word: 'email', getReplacement: () => getDynamicReplacement('email'), professional: 'inbox details' },
  { pattern: /\bgmail\b/gi, word: 'gmail', getReplacement: () => getDynamicReplacement('gmail'), professional: 'inbox details' },
  { pattern: /\baccount\b/gi, word: 'account', getReplacement: () => getDynamicReplacement('account'), professional: 'profile credentials' },
  { pattern: /\baddress\b/gi, word: 'address', getReplacement: () => getDynamicReplacement('address'), professional: 'details' },
  { pattern: /\bphone\b/gi, word: 'phone', getReplacement: () => getDynamicReplacement('phone'), professional: 'contact details' },
  { pattern: /\bnumber\b/gi, word: 'number', getReplacement: () => getDynamicReplacement('number'), professional: 'reference details' },
  { pattern: /\bbank\b/gi, word: 'bank', getReplacement: () => getDynamicReplacement('bank'), professional: 'transaction details' },
  { pattern: /\bratings\b/gi, word: 'ratings', getReplacement: () => getDynamicReplacement('ratings'), professional: 'feedback reviews' },
  { pattern: /\brating\b/gi, word: 'rating', getReplacement: () => getDynamicReplacement('rating'), professional: 'feedback review' },
  { pattern: /\breviews\b/gi, word: 'reviews', getReplacement: () => getDynamicReplacement('reviews'), professional: 'feedback' },
  { pattern: /\breview\b/gi, word: 'review', getReplacement: () => getDynamicReplacement('review'), professional: 'feedback' }
];

export default function MessageHelperPage() {
  const store = useWorkspaceStore();
  const [inputText, setInputText] = useState('');
  const [detectedWords, setDetectedWords] = useState<string[]>([]);
  const [stealthLevel, setStealthLevel] = useState<'low' | 'medium' | 'high' | 'homoglyph'>('low');
  const [activeTab, setActiveTab] = useState<'original' | 'professional' | 'short' | 'formal' | 'friendly' | 'grammar' | 'clean'>('clean');
  const [compareMode, setCompareMode] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [historyList, setHistoryList] = useState<{ id: string; text: string; date: string }[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    store.hydrate();
    // Load local analyzer history
    const stored = localStorage.getItem('cc_analyzer_history');
    if (stored) {
      setHistoryList(JSON.parse(stored));
    }
  }, []);

  // Run analyzer logic on input change
  useEffect(() => {
    const text = inputText.toLowerCase();
    const found: string[] = [];
    RESTRICTED_WORDS_MAP.forEach(item => {
      if (item.pattern.test(text)) {
        found.push(item.word);
      }
    });
    setDetectedWords(Array.from(new Set(found)));
  }, [inputText]);

  const handleCorrect = () => {
    if (!inputText) return;
    
    // Get corrected text based on current active tab, default to clean if original is selected
    const targetTab = activeTab === 'original' ? 'clean' : activeTab;
    const corrected = rewrites[targetTab as keyof typeof rewrites] || rewrites.clean;
    
    setInputText(corrected);
    setActiveTab(targetTab);
    
    // Save to local analyzer history
    const newHist = {
      id: Math.random().toString(36).substring(2),
      text: corrected.slice(0, 100) + (corrected.length > 100 ? '...' : ''),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedHist = [newHist, ...historyList.slice(0, 9)];
    setHistoryList(updatedHist);
    localStorage.setItem('cc_analyzer_history', JSON.stringify(updatedHist));
    store.logActivity('Message Corrected', 'chat', `Fiverr message corrected with stealth bypass (${stealthLevel}).`);
  };

  const handleClear = () => {
    setInputText('');
    setDetectedWords([]);
    setActiveTab('clean');
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    store.logActivity('Message Copied', 'chat', 'Copy to clipboard.');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tone Rewrite Generators (Static formulas matching requested templates style rules)
  const getRewrites = () => {
    if (!inputText) return { professional: '', short: '', formal: '', friendly: '', grammar: '', clean: '' };
    
    // Compute clean text on the fly matching current stealth level
    let cleanText = inputText;
    let profRewrite = inputText;

    // We build a single regex to prevent cascading replacements (e.g. 'payment' -> 'pay-ment' -> 'p_ay-ment')
    const combinedPattern = new RegExp(
      '\\b(' + RESTRICTED_WORDS_MAP.map(item => item.word).join('|') + ')\\b',
      'gi'
    );

    cleanText = cleanText.replace(combinedPattern, (match) => {
      const lowerMatch = match.toLowerCase();
      // Ensure we only add ONE symbol for medium level to prevent p_y-me-nt
      if (stealthLevel === 'medium' && match.length > 2) {
        const separators = ['_', '-', ' '];
        const sep = separators[Math.floor(Math.random() * separators.length)];
        const insertPos = 1; // Always insert exactly after the first character
        return match.slice(0, insertPos) + sep + match.slice(insertPos);
      }
      return getObfuscatedWord(lowerMatch, stealthLevel);
    });

    profRewrite = profRewrite.replace(combinedPattern, (match) => {
      const lowerMatch = match.toLowerCase();
      const rule = RESTRICTED_WORDS_MAP.find(item => item.word === lowerMatch);
      return rule ? rule.professional : match;
    });

    // Formal template
    const formalRewrite = `Dear Client,\n\nI hope this correspondence finds you well.\n\n${profRewrite}\n\nShould you require any further adjustments, please let me know. I look forward to working together.\n\nBest regards,\n${store.memberProfile.name}`;

    // Friendly template
    const friendlyRewrite = `Hi there! 😊\n\nHope you're having an awesome day.\n\nJust wanted to share: ${profRewrite.replace(/i am/gi, "I'm").replace(/would need/gi, "need")}\n\nLet me know what you think, and I'd be super happy to adjust anything if needed! Thanks a bunch!`;

    // Short version
    const shortRewrite = `${profRewrite.slice(0, 200)}${profRewrite.length > 200 ? '...' : ''}\n\nLet me know if this looks good. Thanks!`;

    // Grammar fix simulation (basic cleanup)
    const grammarRewrite = profRewrite
      .replace(/\bi\b/g, 'I')
      .replace(/\bshopify store main login\b/gi, 'Shopify store access details')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      professional: profRewrite,
      short: shortRewrite,
      formal: formalRewrite,
      friendly: friendlyRewrite,
      grammar: grammarRewrite,
      clean: cleanText
    };
  };

  const rewrites = getRewrites();

  const handleSaveAsTemplate = () => {
    if (!newTemplateTitle.trim()) return;
    const textToSave = activeTab === 'original' ? inputText : rewrites[activeTab as keyof typeof rewrites] || inputText;
    
    store.addTemplate({
      id: Math.random().toString(36).substring(2),
      title: newTemplateTitle,
      description: newTemplateDesc || 'Created from Message Analyzer',
      category: 'Custom',
      content: textToSave,
      variables: [],
      isFavorite: false,
      isCustom: true
    });

    setNewTemplateTitle('');
    setNewTemplateDesc('');
    setSaveModalOpen(false);
  };

  // Custom highlights renderer for visual check
  const renderHighlightedText = (text: string) => {
    if (!text) return <span className="text-gray-550 italic">Analysis visualization output will display here...</span>;
    
    // Split text by spaces and check matches
    const words = text.split(/(\s+)/);
    return words.map((chunk, idx) => {
      // Clean word check
      const cleanChunk = chunk.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
      const isRestricted = RESTRICTED_WORDS_MAP.some(item => item.word === cleanChunk);
      
      if (isRestricted) {
        return (
          <span key={idx} className="bg-red-500/20 text-red-350 border border-red-500/30 px-1 rounded font-semibold text-sm animate-pulse">
            {chunk}
          </span>
        );
      }
      
      // Check if it's an obfuscated word (contains zero-width spaces, homoglyphs, or symbols)
      const isZeroWidth = chunk.includes('\u200B');
      const isHomoglyph = /[\u0400-\u04FF]/.test(chunk);
      const hasDelimiters = /[-_]/.test(cleanChunk);
      
      const strippedDelimiter = cleanChunk.replace(/[-_]/g, '');
      const strippedZeroWidth = cleanChunk.replace(/\u200B/g, '');
      
      // Cyrillic mapping to Latin check
      const cyrillicToLatinMap: Record<string, string> = {
        'а': 'a', 'с': 'c', 'е': 'e', 'і': 'i', 'о': 'o', 'р': 'p', 'ѕ': 's', 'х': 'x', 'у': 'y',
        'А': 'A', 'С': 'C', 'Е': 'E', 'І': 'I', 'О': 'O', 'Р': 'P', 'Ѕ': 'S', 'Х': 'X', 'У': 'Y'
      };
      const latinizedChunk = cleanChunk.split('').map(c => cyrillicToLatinMap[c] || c).join('');
      
      const matchesRestrictedBase = RESTRICTED_WORDS_MAP.some(item => {
        const base = item.word;
        return base === strippedDelimiter || base === strippedZeroWidth || base === latinizedChunk;
      });

      const isObfuscated = (isZeroWidth || isHomoglyph || hasDelimiters) && matchesRestrictedBase;

      if (isObfuscated) {
        let visibleRepresentation = chunk;
        if (isZeroWidth) {
          visibleRepresentation = chunk.replace(/\u200B/g, '·');
        } else if (isHomoglyph) {
          visibleRepresentation = chunk + ' [AI]';
        }

        return (
          <span key={idx} className="bg-emerald-500/20 text-emerald-350 border border-emerald-500/30 px-1 rounded text-sm font-bold" title="Stealth bypass active">
            {visibleRepresentation}
          </span>
        );
      }

      return chunk;
    });
  };

  // Diff Compare Renderer (simple compare original with rewritten tab)
  const renderDiffCompare = () => {
    const originalWords = inputText.split(/\s+/);
    const targetWords = (rewrites[activeTab as keyof typeof rewrites] || '').split(/\s+/);
    
    return (
      <div className="p-4 rounded-xl bg-gray-950/60 border border-glass-border font-mono text-xs leading-relaxed space-y-4 max-h-[300px] overflow-y-auto">
        <div className="flex flex-wrap gap-1">
          {originalWords.map((w, idx) => {
            const hasChanged = !targetWords.includes(w);
            return (
              <span key={idx} className={hasChanged ? 'bg-red-500/20 text-red-400 line-through px-0.5 rounded' : 'text-gray-400'}>
                {w}
              </span>
            );
          })}
        </div>
        <div className="border-t border-glass-border pt-4 flex flex-wrap gap-1">
          {targetWords.map((w, idx) => {
            const isAdded = !originalWords.includes(w);
            return (
              <span key={idx} className={isAdded ? 'bg-green-500/20 text-green-300 font-semibold px-0.5 rounded' : 'text-gray-300'}>
                {w}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const activeText = activeTab === 'original' ? inputText : rewrites[activeTab as keyof typeof rewrites];

  const getRiskScore = () => {
    if (detectedWords.length === 0) {
      return { 
        level: 'SAFE', 
        color: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/10', 
        score: 0, 
        desc: 'Your message complies with standard Fiverr policy guidelines.' 
      };
    }
    
    const hasContact = detectedWords.some(w => ['whatsapp', 'skype', 'zoom', 'email', 'gmail', 'phone', 'number', 'address', 'contact', 'account'].includes(w));
    const hasPayment = detectedWords.some(w => ['payment', 'payments', 'pay', 'stripe', 'paypal', 'bank', 'payout', 'money', 'dollar', 'usd'].includes(w));
    const hasReview = detectedWords.some(w => ['rating', 'ratings', 'review', 'reviews'].includes(w));
    
    if (hasContact || hasPayment) {
      return { 
        level: 'SEVERE RISK', 
        color: 'text-red-400 border-red-500/35 bg-red-950/20', 
        score: 90, 
        desc: 'Direct payment references or external contact channels detected. High likelihood of automated bot flags if sent raw.' 
      };
    }
    if (hasReview) {
      return { 
        level: 'MODERATE RISK', 
        color: 'text-amber-400 border-amber-500/25 bg-amber-950/15', 
        score: 55, 
        desc: 'Review solicitation detected. Fiverr terms prohibit prompting clients for 5-star ratings or positive reviews directly.' 
      };
    }
    return { 
      level: 'LOW RISK', 
      color: 'text-blue-400 border-blue-500/20 bg-blue-950/15', 
      score: 25, 
      desc: 'Platform names or general system words found. Keep conversations within Fiverr.' 
    };
  };
  
  const risk = getRiskScore();

  return (
    <div className="space-y-6 pb-12 relative">
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-green-950/90 border border-green-500/30 text-green-400 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md"
          >
            <Check className="w-5 h-5" />
            <span className="text-sm font-bold tracking-wider uppercase">Copied to clipboard</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">MESSAGE HELPER</h1>
        <p className="text-gray-400 text-sm">Fiverr & Upwork communications advisor. Review word policies and adjust tone scales.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Core Editor Panel */}
        <div className="xl:col-span-3 space-y-6">
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">TASTE YOUR MESSAGE HERE IT AUTOMATICALLY CHECKS YOUR WORDS.</span>
              <span className="text-xs text-gray-400 font-medium">{inputText.length}/2500 Characters</span>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste or type your developer update draft here..."
              rows={8}
              className="w-full p-4 rounded-xl glass-input font-medium text-sm leading-relaxed"
            />

            {/* Premium Stealth Bypass Engine Control Panel */}
            <div className="p-4 rounded-xl border border-glass-border bg-gray-950/40 space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Stealth Bypass Engine Control</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/25 font-bold font-mono">Stealth Active</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'low', name: 'Low Stealth', desc: 'Standard replacements (e.g. p_ayment)' },
                  { id: 'medium', name: 'Medium Stealth', desc: 'Randomized delimiters (e.g. p_ay-ment)' },
                  { id: 'high', name: 'High Stealth', desc: 'Zero-Width spaces (100% invisible bypass)' },
                  { id: 'homoglyph', name: 'AI Homoglyph', desc: 'Cyrillic lookalikes (advanced AI bypass)' }
                ].map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setStealthLevel(level.id as any)}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                      stealthLevel === level.id
                        ? 'border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                        : 'border-glass-border bg-gray-950/20 text-gray-400 hover:text-white hover:bg-glass-hover'
                    }`}
                  >
                    <span className="text-xs font-extrabold">{level.name}</span>
                    <span className="text-[9px] leading-tight text-gray-500 mt-1">{level.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Restricted words panel status */}
            <div className="flex flex-wrap items-center gap-3">
              {detectedWords.length > 0 ? (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/20 border border-red-500/20 px-3 py-1.5 rounded-lg">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Restricted words/phrases found: <span className="font-bold font-mono">{detectedWords.join(', ')}</span></span>
                </div>
              ) : (
                inputText.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-500/25 px-3 py-1.5 rounded-lg">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>No restricted words or phrases detected!</span>
                  </div>
                )
              )}
            </div>

            {/* Visualizer output card */}
            {inputText && (
              <div className="p-4 rounded-xl bg-gray-950/60 border border-glass-border space-y-2 text-left">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Analysis Visualizer</span>
                <p className="text-sm text-gray-300 leading-relaxed font-medium">
                  {renderHighlightedText(activeText)}
                </p>
              </div>
            )}

            {/* Base Action deck */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleCorrect}
                disabled={!inputText}
                className="px-5 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 glow-green"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Correct Message</span>
              </button>

              <button
                onClick={() => handleCopy(activeText)}
                disabled={!activeText}
                className="px-4 py-2.5 rounded-lg bg-gray-900 border border-glass-border hover:bg-glass-hover text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                <span className={copied ? "text-green-400" : ""}>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => setSaveModalOpen(true)}
                disabled={!activeText}
                className="px-4 py-2.5 rounded-lg bg-gray-900 border border-glass-border hover:bg-glass-hover text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Template</span>
              </button>

              <button
                onClick={handleClear}
                disabled={!inputText}
                className="px-4 py-2.5 rounded-lg bg-gray-950 hover:bg-red-950/20 border border-red-500/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 font-bold text-xs uppercase tracking-wider transition-all ml-auto flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Tone Rewrite Deck (Only display when text exists) */}
          {inputText && (
            <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-glass-border pb-3 gap-3">
                <div className="flex flex-wrap gap-2">
                  {(['original', 'professional', 'short', 'formal', 'friendly', 'grammar', 'clean'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                        activeTab === tab 
                          ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                          : 'text-gray-400 hover:text-white hover:bg-glass-hover'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCompareMode(!compareMode)}
                  className={`px-3 py-1 text-xs rounded border transition-colors ${
                    compareMode 
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                      : 'border-glass-border text-gray-500 hover:text-white'
                  }`}
                >
                  Diff Compare
                </button>
              </div>

              {compareMode ? (
                renderDiffCompare()
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-gray-950/60 border border-glass-border font-mono text-xs leading-relaxed space-y-2 max-h-[300px] overflow-y-auto relative text-left">
                    <button 
                      onClick={() => handleCopy(activeText)}
                      className="absolute top-3 right-3 p-1.5 rounded hover:bg-glass-hover text-gray-400 hover:text-white transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-300 pr-8">{activeText}</pre>
                  </div>
                  {activeTab === 'clean' && (
                    <div className="text-[11px] text-green-400 bg-green-950/20 border border-green-500/20 px-3 py-2 rounded-lg flex items-center gap-2 select-none">
                      <Sparkles className="w-4 h-4 shrink-0 text-green-400 animate-pulse" />
                      <span>
                        {stealthLevel === 'high' ? 'High Stealth: Zero-width space bypasses are invisibly loaded. Ready to paste directly to Fiverr.' :
                         stealthLevel === 'homoglyph' ? 'Homoglyph: Lookalike letters have been swapped in to confuse automated AI regex.' :
                         'Low/Medium Stealth: Hyphens or underscores have been inserted to break bot keyword matching.'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Sidebar History Column */}
        <div className="space-y-6">
          
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4 text-left">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-green-400" />
              <span>Scan History</span>
            </h3>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {historyList.length > 0 ? (
                historyList.map((hist) => (
                  <button
                    key={hist.id}
                    onClick={() => setInputText(hist.text)}
                    className="w-full p-3 rounded-lg bg-gray-950/60 border border-glass-border hover:bg-glass-hover hover:border-white/10 transition-all text-left space-y-1 block"
                  >
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>Analyzed Code</span>
                      <span>{hist.date}</span>
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                      {hist.text}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-6">No scan history recorded.</p>
              )}
            </div>
          </div>

          {/* Interactive Policy Shield Heatmap */}
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4 text-left">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-green-455" />
                <span>Policy Shield Status</span>
              </span>
              {inputText.length > 0 && (
                <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-full ${risk.color}`}>
                  {risk.level}
                </span>
              )}
            </h3>

            {inputText.length > 0 ? (
              <div className="space-y-4.5">
                {/* Risk Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase font-mono">
                    <span>Threat Detection Level</span>
                    <span>{risk.score}%</span>
                  </div>
                  <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden border border-white/5">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        risk.level === 'SAFE' ? 'bg-emerald-500 glow-emerald' :
                        risk.level === 'LOW RISK' ? 'bg-blue-500' :
                        risk.level === 'MODERATE RISK' ? 'bg-amber-500' : 'bg-red-500 glow-red'
                      }`}
                      style={{ width: `${risk.score || 5}%` }}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed font-medium">{risk.desc}</p>
                
                {/* Detected policy details */}
                <div className="border-t border-glass-border pt-3.5 space-y-2 text-[11px]">
                  <span className="text-gray-500 uppercase tracking-wider block font-bold text-[9px]">Triggered Violations</span>
                  {detectedWords.map(word => {
                    const isPayment = ['payment', 'payments', 'pay', 'stripe', 'paypal', 'bank', 'payout', 'money', 'dollar', 'usd'].includes(word);
                    const isContact = ['whatsapp', 'skype', 'zoom', 'email', 'gmail', 'phone', 'number', 'address', 'contact', 'account'].includes(word);
                    return (
                      <div key={word} className="flex items-start gap-2 text-gray-300">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isPayment || isContact ? 'bg-red-550' : 'bg-amber-550'}`} />
                        <span className="leading-relaxed">
                          <strong className="text-white font-mono">{word}</strong>: {
                            isPayment ? 'Fiverr strictly bans payments outside their gateway channel. Use professional terms like "order setup" or "process the order".' :
                            isContact ? 'Sharing contact channels (email, phone, social messaging) is prohibited. Refer to communication inside the workspace instead.' :
                            'Soliciting ratings, reviews, or feedback is monitored closely by Fiverr algorithms. obfusticate review words.'
                          }
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-950 text-gray-600 border border-glass-border">
                  <Check className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-xs text-gray-500 font-medium">Enter a message draft to scan policy risk in real-time.</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Save Template Modal */}
      <AnimatePresence>
        {saveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSaveModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-glass-border p-6 rounded-xl w-full max-w-md relative z-10 space-y-4 text-left shadow-2xl"
            >
              <h3 className="text-base font-bold text-white">Save Message to Templates</h3>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Template Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Shopify Payment Setup Response"
                    value={newTemplateTitle}
                    onChange={(e) => setNewTemplateTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    placeholder="Brief description of when to use this"
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSaveModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-gray-950 border border-glass-border hover:bg-glass-hover text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAsTemplate}
                  disabled={!newTemplateTitle.trim()}
                  className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-black"
                >
                  Save Template
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
