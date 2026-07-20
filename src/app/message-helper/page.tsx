'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  RefreshCw,
  Palette,
  Languages,
  Globe,
  Zap,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  Split,
  Smile,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuth } from '@/context/AuthContext';
import { soundSynth } from '@/lib/sounds';

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
  
  if (word.length > 2) {
    const mid = Math.floor(word.length / 2);
    return word.slice(0, mid) + '-' + word.slice(mid);
  }
  return word;
};

// Helper for obfuscation (Defaulted to Low Stealth)
const getObfuscatedWord = (word: string, level: 'low' | 'medium' | 'high' | 'homoglyph' = 'low'): string => {
  return getDynamicReplacement(word);
};

// Restricted words list and their professional replacement alternatives
const RESTRICTED_WORDS_MAP: { pattern: RegExp, word: string, getReplacement: () => string, professional: string }[] = [
  { pattern: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi, word: 'email address', getReplacement: () => 'c-ontact d-etails', professional: 'contact details' },
  { pattern: /\b\d{4,}\b/g, word: 'digits', getReplacement: () => 'n-umbers', professional: 'details' },
  { pattern: /\bpay\b/gi, word: 'pay', getReplacement: () => getDynamicReplacement('pay'), professional: 'order setups' },
  { pattern: /\bpayment\b/gi, word: 'payment', getReplacement: () => getDynamicReplacement('payment'), professional: 'order setups' },
  { pattern: /\bpayments\b/gi, word: 'payments', getReplacement: () => getDynamicReplacement('payments'), professional: 'order setups' },
  { pattern: /\bmoney\b/gi, word: 'money', getReplacement: () => getDynamicReplacement('money'), professional: 'order setups' },
  { pattern: /\bcash\b/gi, word: 'cash', getReplacement: () => getDynamicReplacement('cash'), professional: 'order setups' },
  { pattern: /\bbank\b/gi, word: 'bank', getReplacement: () => getDynamicReplacement('bank'), professional: 'order setups' },
  { pattern: /\bbank\s+transfer\b/gi, word: 'bank transfer', getReplacement: () => getDynamicReplacement('bank transfer'), professional: 'order setups' },
  { pattern: /\bwestern\s+union\b/gi, word: 'western union', getReplacement: () => getDynamicReplacement('western union'), professional: 'order setups' },
  { pattern: /\bwire\s+transfer\b/gi, word: 'wire transfer', getReplacement: () => getDynamicReplacement('wire transfer'), professional: 'order setups' },
  { pattern: /\bpaypal\b/gi, word: 'paypal', getReplacement: () => getDynamicReplacement('paypal'), professional: 'order setups' },
  { pattern: /\bpayoneer\b/gi, word: 'payoneer', getReplacement: () => getDynamicReplacement('payoneer'), professional: 'order setups' },
  { pattern: /\bcrypto\b/gi, word: 'crypto', getReplacement: () => getDynamicReplacement('crypto'), professional: 'order setups' },
  { pattern: /\bbitcoin\b/gi, word: 'bitcoin', getReplacement: () => getDynamicReplacement('bitcoin'), professional: 'order setups' },
  { pattern: /\busdt\b/gi, word: 'usdt', getReplacement: () => getDynamicReplacement('usdt'), professional: 'order setups' },
  { pattern: /\bwallet\b/gi, word: 'wallet', getReplacement: () => getDynamicReplacement('wallet'), professional: 'order setups' },
  { pattern: /\boutside\b/gi, word: 'outside', getReplacement: () => getDynamicReplacement('outside'), professional: 'order setups' },
  { pattern: /\boff-site\b/gi, word: 'off-site', getReplacement: () => getDynamicReplacement('off-site'), professional: 'order setups' },
  { pattern: /\bstripe\b/gi, word: 'stripe', getReplacement: () => getDynamicReplacement('stripe'), professional: 'order setups' },
  { pattern: /\bwise\b/gi, word: 'wise', getReplacement: () => getDynamicReplacement('wise'), professional: 'order setups' },
  { pattern: /\bpayout\b/gi, word: 'payout', getReplacement: () => getDynamicReplacement('payout'), professional: 'order setups' },
  { pattern: /\bdollar\b/gi, word: 'dollar', getReplacement: () => getDynamicReplacement('dollar'), professional: 'order setups' },
  { pattern: /\busd\b/gi, word: 'usd', getReplacement: () => getDynamicReplacement('usd'), professional: 'order setups' },
  { pattern: /\bsend\s+payment\b/gi, word: 'send payment', getReplacement: () => getDynamicReplacement('send payment'), professional: 'order setups' },
  { pattern: /\bdirect\s+payment\b/gi, word: 'direct payment', getReplacement: () => getDynamicReplacement('direct payment'), professional: 'order setups' },
  { pattern: /\boutside\s+payment\b/gi, word: 'outside payment', getReplacement: () => getDynamicReplacement('outside payment'), professional: 'order setups' },
  { pattern: /\bemails?\b/gi, word: 'email', getReplacement: () => getDynamicReplacement('email'), professional: 'communication' },
  { pattern: /\bmails?\b/gi, word: 'mail', getReplacement: () => getDynamicReplacement('mail'), professional: 'communication' },
  { pattern: /\bgmails?\b/gi, word: 'gmail', getReplacement: () => getDynamicReplacement('gmail'), professional: 'communication' },
  { pattern: /\bphones?\b/gi, word: 'phone', getReplacement: () => getDynamicReplacement('phone'), professional: 'communication' },
  { pattern: /\bnumbers?\b/gi, word: 'number', getReplacement: () => getDynamicReplacement('number'), professional: 'communication' },
  { pattern: /\bmobiles?\b/gi, word: 'mobile', getReplacement: () => getDynamicReplacement('mobile'), professional: 'communication' },
  { pattern: /\bwhatsapp\b/gi, word: 'whatsapp', getReplacement: () => getDynamicReplacement('whatsapp'), professional: 'communication' },
  { pattern: /\bimo\b/gi, word: 'imo', getReplacement: () => getDynamicReplacement('imo'), professional: 'communication' },
  { pattern: /\bskype\b/gi, word: 'skype', getReplacement: () => getDynamicReplacement('skype'), professional: 'communication' },
  { pattern: /\bzoom\b/gi, word: 'zoom', getReplacement: () => getDynamicReplacement('zoom'), professional: 'communication' },
  { pattern: /\btelegram\b/gi, word: 'telegram', getReplacement: () => getDynamicReplacement('telegram'), professional: 'communication' },
  { pattern: /\bdiscord\b/gi, word: 'discord', getReplacement: () => getDynamicReplacement('discord'), professional: 'communication' },
  { pattern: /\bfacebook\b/gi, word: 'facebook', getReplacement: () => getDynamicReplacement('facebook'), professional: 'communication' },
  { pattern: /\binsta\b/gi, word: 'insta', getReplacement: () => getDynamicReplacement('insta'), professional: 'communication' },
  { pattern: /\binstagram\b/gi, word: 'instagram', getReplacement: () => getDynamicReplacement('instagram'), professional: 'communication' },
  { pattern: /\blinkedin\b/gi, word: 'linkedin', getReplacement: () => getDynamicReplacement('linkedin'), professional: 'communication' },
  { pattern: /\bsocial\s+media\b/gi, word: 'social media', getReplacement: () => getDynamicReplacement('social media'), professional: 'communication' },
  { pattern: /\bcontact\s+me\s+directly\b/gi, word: 'contact me directly', getReplacement: () => getDynamicReplacement('contact me directly'), professional: 'communication' },
  { pattern: /\bcall\s+me\b/gi, word: 'call me', getReplacement: () => getDynamicReplacement('call me'), professional: 'communication' },
  { pattern: /\bmessage\s+me\s+outside\b/gi, word: 'message me outside', getReplacement: () => getDynamicReplacement('message me outside'), professional: 'communication' },
  { pattern: /\bcontact\b/gi, word: 'contact', getReplacement: () => getDynamicReplacement('contact'), professional: 'communication' },
  { pattern: /\baddress\b/gi, word: 'address', getReplacement: () => getDynamicReplacement('address'), professional: 'communication' },
  { pattern: /\breview\b/gi, word: 'review', getReplacement: () => getDynamicReplacement('review'), professional: 'feedback' },
  { pattern: /\breviews\b/gi, word: 'reviews', getReplacement: () => getDynamicReplacement('reviews'), professional: 'feedback' },
  { pattern: /\bfeedback\b/gi, word: 'feedback', getReplacement: () => getDynamicReplacement('feedback'), professional: 'feedback' },
  { pattern: /\b5\s+stars\b/gi, word: '5 stars', getReplacement: () => getDynamicReplacement('5 stars'), professional: 'feedback' },
  { pattern: /\b5\s+star\s+review\b/gi, word: '5 star review', getReplacement: () => getDynamicReplacement('5 star review'), professional: 'feedback' },
  { pattern: /\brating\b/gi, word: 'rating', getReplacement: () => getDynamicReplacement('rating'), professional: 'feedback' },
  { pattern: /\bratings\b/gi, word: 'ratings', getReplacement: () => getDynamicReplacement('ratings'), professional: 'feedback' },
  { pattern: /\bpositive\s+review\b/gi, word: 'positive review', getReplacement: () => getDynamicReplacement('positive review'), professional: 'feedback' },
  { pattern: /\bgood\s+rating\b/gi, word: 'good rating', getReplacement: () => getDynamicReplacement('good rating'), professional: 'feedback' },
  { pattern: /\bleave\s+a\s+review\b/gi, word: 'leave a review', getReplacement: () => getDynamicReplacement('leave a review'), professional: 'feedback' },
  { pattern: /\bincrease\s+my\s+rating\b/gi, word: 'increase my rating', getReplacement: () => getDynamicReplacement('increase my rating'), professional: 'feedback' },
  { pattern: /\btestimonials\b/gi, word: 'testimonials', getReplacement: () => getDynamicReplacement('testimonials'), professional: 'feedback' },
  { pattern: /\blogin\s+credentials\b/gi, word: 'login credentials', getReplacement: () => getDynamicReplacement('login credentials'), professional: 'profile credentials' },
  { pattern: /\bpassword\b/gi, word: 'password', getReplacement: () => getDynamicReplacement('password'), professional: 'profile credentials' },
  { pattern: /\badmin\s+access\b/gi, word: 'admin access', getReplacement: () => getDynamicReplacement('admin access'), professional: 'profile credentials' },
  { pattern: /\baccount\s+transfer\b/gi, word: 'account transfer', getReplacement: () => getDynamicReplacement('account transfer'), professional: 'profile credentials' },
  { pattern: /\bownership\s+transfer\b/gi, word: 'ownership transfer', getReplacement: () => getDynamicReplacement('ownership transfer'), professional: 'profile credentials' },
  { pattern: /\baccount\s+details\b/gi, word: 'account details', getReplacement: () => getDynamicReplacement('account details'), professional: 'profile credentials' },
  { pattern: /\baccount\b/gi, word: 'account', getReplacement: () => getDynamicReplacement('account'), professional: 'profile credentials' },
  { pattern: /\bgoogle\s+drive\s+link\b/gi, word: 'google drive link', getReplacement: () => getDynamicReplacement('google drive link'), professional: 'reference links' },
  { pattern: /\bdropbox\b/gi, word: 'dropbox', getReplacement: () => getDynamicReplacement('dropbox'), professional: 'reference links' },
  { pattern: /\bwetransfer\b/gi, word: 'wetransfer', getReplacement: () => getDynamicReplacement('wetransfer'), professional: 'reference links' },
  { pattern: /\bgithub\s+repository\b/gi, word: 'github repository', getReplacement: () => getDynamicReplacement('github repository'), professional: 'reference links' },
  { pattern: /\bexternal\s+link\b/gi, word: 'external link', getReplacement: () => getDynamicReplacement('external link'), professional: 'reference links' },
  { pattern: /\bwork\s+outside\s+the\s+platform\b/gi, word: 'work outside the platform', getReplacement: () => getDynamicReplacement('work outside the platform'), professional: 'internal order steps' },
  { pattern: /\bavoid\s+platform\s+fee\b/gi, word: 'avoid platform fee', getReplacement: () => getDynamicReplacement('avoid platform fee'), professional: 'internal order steps' },
  { pattern: /\bdirect\s+deal\b/gi, word: 'direct deal', getReplacement: () => getDynamicReplacement('direct deal'), professional: 'internal order steps' },
  { pattern: /\bcontinue\s+privately\b/gi, word: 'continue privately', getReplacement: () => getDynamicReplacement('continue privately'), professional: 'internal order steps' },
  { pattern: /\bhomework\b/gi, word: 'homework', getReplacement: () => getDynamicReplacement('homework'), professional: 'project criteria' },
  { pattern: /\bassignment\b/gi, word: 'assignment', getReplacement: () => getDynamicReplacement('assignment'), professional: 'project criteria' },
  { pattern: /\bexam\b/gi, word: 'exam', getReplacement: () => getDynamicReplacement('exam'), professional: 'project criteria' },
  { pattern: /\btest\b/gi, word: 'test', getReplacement: () => getDynamicReplacement('test'), professional: 'project criteria' },
  { pattern: /\bacademic\b/gi, word: 'academic', getReplacement: () => getDynamicReplacement('academic'), professional: 'project criteria' },
  { pattern: /\bessay\s+writing\b/gi, word: 'essay writing', getReplacement: () => getDynamicReplacement('essay writing'), professional: 'project criteria' },
  { pattern: /\bfake\b/gi, word: 'fake', getReplacement: () => getDynamicReplacement('fake'), professional: 'project criteria' },
  { pattern: /\bbot\b/gi, word: 'bot', getReplacement: () => getDynamicReplacement('bot'), professional: 'project criteria' },
  { pattern: /\bgenerate\b/gi, word: 'generate', getReplacement: () => getDynamicReplacement('generate'), professional: 'project criteria' },
  { pattern: /\bfiverr\b/gi, word: 'fiverr', getReplacement: () => getDynamicReplacement('fiverr'), professional: 'platform' }
];

export default function MessageHelperPage() {
  const store = useWorkspaceStore();
  const { dbUser } = useAuth();
  const [inputText, setInputText] = useState('');
  const [detectedWords, setDetectedWords] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'original' | 'professional' | 'short' | 'formal' | 'friendly' | 'grammar' | 'clean'>('clean');
  const [compareMode, setCompareMode] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [historyList, setHistoryList] = useState<{ id: string; text: string; date: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [dualView, setDualView] = useState(true);

  // Dynamic AI Translation State
  const [banglaTranslation, setBanglaTranslation] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  const activeMessageHelperLayout = store.settings?.globalLayout || 'default';

  const helperStyles = useMemo(() => {
    switch(activeMessageHelperLayout) {
      case 'slate':
        return {
          wrapper: "space-y-6 pb-12 relative font-sans",
          headerTitle: "text-2xl lg:text-3xl font-bold tracking-tight text-white",
          headerDesc: "text-gray-400 text-sm",
          editorCard: "p-5 rounded-none border border-gray-800 bg-gray-900 space-y-4",
          textarea: "w-full p-4 rounded-none bg-gray-950 border border-gray-800 text-white font-medium text-sm leading-relaxed focus:border-gray-600 outline-none",
          actionBtnCorrect: "px-5 py-2.5 rounded-none bg-white hover:bg-gray-250 text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5",
          actionBtnSec: "px-4 py-2.5 rounded-none bg-gray-900 border border-gray-800 hover:bg-gray-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5",
          actionBtnClear: "px-4 py-2.5 rounded-none bg-gray-955 hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-all ml-auto flex items-center gap-1.5",
          toneWrapper: "p-5 rounded-none border border-gray-800 bg-gray-900 space-y-4",
          toneBtnActive: "px-3 py-1.5 rounded-none bg-gray-800 border border-gray-700 text-white text-xs font-semibold uppercase tracking-wider transition-all",
          toneBtnInactive: "px-3 py-1.5 rounded-none text-gray-400 hover:text-white hover:bg-gray-800 text-xs font-semibold uppercase tracking-wider transition-all",
          sidebarCard: "p-5 rounded-none border border-gray-800 bg-gray-900 space-y-4 text-left",
          sidebarBtn: "w-full p-3 rounded-none bg-gray-955 border border-gray-850 hover:bg-gray-850 hover:border-gray-650 transition-all text-left space-y-1 block",
          outputPreBox: "p-4 rounded-none bg-gray-955 border border-gray-850 font-mono text-xs leading-relaxed space-y-2 max-h-[350px] overflow-y-auto relative text-left"
        };
      case 'aurora':
        return {
          wrapper: "space-y-6 pb-12 relative font-sans",
          headerTitle: "text-2xl lg:text-3xl font-extrabold tracking-tight text-white",
          headerDesc: "text-indigo-200/80 text-sm",
          editorCard: "p-5 rounded-2xl border border-indigo-500/10 bg-indigo-950/5 space-y-4 shadow-[0_8px_32px_rgba(99,102,241,0.05)]",
          textarea: "w-full p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-white font-medium text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500/50 outline-none",
          actionBtnCorrect: "px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-md",
          actionBtnSec: "px-4 py-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 hover:bg-indigo-900/60 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5",
          actionBtnClear: "px-4 py-2.5 rounded-xl bg-transparent hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-red-300 font-bold text-xs uppercase tracking-wider transition-all ml-auto flex items-center gap-1.5",
          toneWrapper: "p-5 rounded-2xl border border-indigo-500/10 bg-indigo-950/5 space-y-4",
          toneBtnActive: "px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider transition-all",
          toneBtnInactive: "px-3 py-1.5 rounded-xl text-indigo-200/50 hover:text-white hover:bg-indigo-950/40 text-xs font-semibold uppercase tracking-wider transition-all",
          sidebarCard: "p-5 rounded-2xl border border-indigo-500/10 bg-indigo-950/5 space-y-4 text-left shadow-[0_8px_32px_rgba(99,102,241,0.05)]",
          sidebarBtn: "w-full p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/10 hover:bg-indigo-950/40 hover:border-indigo-500/30 transition-all text-left space-y-1 block",
          outputPreBox: "p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/10 font-mono text-xs leading-relaxed space-y-2 max-h-[350px] overflow-y-auto relative text-left"
        };
      case 'cyber':
        return {
          wrapper: "space-y-6 pb-12 relative font-mono",
          headerTitle: "text-2xl lg:text-3xl font-black tracking-tight text-white uppercase",
          headerDesc: "text-emerald-500/80 text-xs",
          editorCard: "p-5 rounded-none border border-emerald-500/30 bg-black space-y-4 shadow-[0_0_15px_rgba(16,185,129,0.05)]",
          textarea: "w-full p-4 rounded-none bg-black border border-emerald-500/40 text-emerald-450 font-medium text-sm leading-relaxed focus:border-emerald-500 outline-none",
          actionBtnCorrect: "px-5 py-2.5 rounded-none bg-black border-2 border-dashed border-emerald-500 hover:bg-emerald-950/30 text-emerald-400 font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5",
          actionBtnSec: "px-4 py-2.5 rounded-none bg-black border border-emerald-500/35 hover:bg-emerald-950/20 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5",
          actionBtnClear: "px-4 py-2.5 rounded-none bg-black border border-red-500/30 hover:bg-red-950/20 text-red-400 font-bold text-xs uppercase tracking-wider transition-all ml-auto flex items-center gap-1.5",
          toneWrapper: "p-5 rounded-none border border-emerald-500/30 bg-black space-y-4",
          toneBtnActive: "px-3 py-1.5 rounded-none bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 text-xs font-semibold uppercase tracking-wider transition-all",
          toneBtnInactive: "px-3 py-1.5 rounded-none text-emerald-600 hover:text-emerald-400 hover:bg-emerald-950/20 text-xs font-semibold uppercase tracking-wider transition-all",
          sidebarCard: "p-5 rounded-none border border-emerald-500/30 bg-black space-y-4 text-left",
          sidebarBtn: "w-full p-3 rounded-none bg-black border border-emerald-500/20 hover:bg-emerald-950/10 hover:border-emerald-500/40 transition-all text-left space-y-1 block",
          outputPreBox: "p-4 rounded-none bg-black border border-emerald-500/20 font-mono text-xs leading-relaxed space-y-2 max-h-[350px] overflow-y-auto relative text-left"
        };
      case 'gold':
        return {
          wrapper: "space-y-6 pb-12 relative font-sans",
          headerTitle: "text-2xl lg:text-3xl font-black tracking-tight text-white uppercase tracking-wider",
          headerDesc: "text-amber-250/70 text-sm",
          editorCard: "p-5 rounded-2xl border border-amber-500/25 bg-[#0b0b0b] space-y-4 shadow-lg",
          textarea: "w-full p-4 rounded-2xl bg-black border border-amber-500/20 text-white font-medium text-sm leading-relaxed focus:ring-1 focus:ring-amber-500/40 outline-none",
          actionBtnCorrect: "px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm",
          actionBtnSec: "px-4 py-2.5 rounded-xl bg-[#121212] border border-amber-500/20 hover:bg-[#1a1a1a] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5",
          actionBtnClear: "px-4 py-2.5 rounded-xl bg-transparent hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/40 text-red-400 font-bold text-xs uppercase tracking-wider transition-all ml-auto flex items-center gap-1.5",
          toneWrapper: "p-5 rounded-2xl border border-amber-500/25 bg-[#0b0b0b] space-y-4",
          toneBtnActive: "px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider transition-all",
          toneBtnInactive: "px-3 py-1.5 rounded-xl text-amber-200/50 hover:text-white hover:bg-[#151515] text-xs font-semibold uppercase tracking-wider transition-all",
          sidebarCard: "p-5 rounded-2xl border border-amber-500/25 bg-[#0b0b0b] space-y-4 text-left shadow-md",
          sidebarBtn: "w-full p-3 rounded-xl bg-black border border-amber-500/15 hover:bg-[#121212] hover:border-amber-500/35 transition-all text-left space-y-1 block",
          outputPreBox: "p-4 rounded-2xl bg-black border border-amber-500/15 font-mono text-xs leading-relaxed space-y-2 max-h-[350px] overflow-y-auto relative text-left"
        };
      default:
        return {
          wrapper: "space-y-6 pb-12 relative",
          headerTitle: "text-2xl lg:text-3xl font-extrabold tracking-tight text-white",
          headerDesc: "text-gray-400 text-sm",
          editorCard: "p-5 rounded-xl border border-glass-border bg-gray-955/20 space-y-4",
          textarea: "w-full p-4 rounded-xl glass-input font-medium text-sm leading-relaxed",
          actionBtnCorrect: "px-5 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 glow-green",
          actionBtnSec: "px-4 py-2.5 rounded-lg bg-gray-900 border border-glass-border hover:bg-glass-hover text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5",
          actionBtnClear: "px-4 py-2.5 rounded-lg bg-gray-955 hover:bg-red-950/20 border border-red-500/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 font-bold text-xs uppercase tracking-wider transition-all ml-auto flex items-center gap-1.5",
          toneWrapper: "p-5 rounded-xl border border-glass-border bg-gray-955/20 space-y-4",
          toneBtnActive: "px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all bg-green-500/10 border border-green-500/20 text-green-400",
          toneBtnInactive: "px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all text-gray-400 hover:text-white hover:bg-glass-hover",
          sidebarCard: "p-5 rounded-xl border border-glass-border bg-gray-955/20 space-y-4 text-left",
          sidebarBtn: "w-full p-3 rounded-lg bg-gray-955/60 border border-glass-border hover:bg-glass-hover hover:border-white/10 transition-all text-left space-y-1 block",
          outputPreBox: "p-4 rounded-xl bg-gray-955/60 border border-glass-border font-mono text-xs leading-relaxed space-y-2 max-h-[350px] overflow-y-auto relative text-left"
        };
    }
  }, [activeMessageHelperLayout]);

  useEffect(() => {
    store.hydrate();
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
      item.pattern.lastIndex = 0;
      if (item.pattern.test(text)) {
        found.push(item.word);
      }
    });
    setDetectedWords(Array.from(new Set(found)));
  }, [inputText]);

  const handleCorrect = () => {
    if (!inputText) return;
    const targetTab = activeTab === 'original' ? 'clean' : activeTab;
    const corrected = rewrites[targetTab as keyof typeof rewrites] || rewrites.clean;
    
    setInputText(corrected);
    setActiveTab(targetTab);
    
    const newHist = {
      id: Math.random().toString(36).substring(2),
      text: corrected.slice(0, 100) + (corrected.length > 100 ? '...' : ''),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedHist = [newHist, ...historyList.slice(0, 9)];
    setHistoryList(updatedHist);
    localStorage.setItem('cc_analyzer_history', JSON.stringify(updatedHist));
    store.logActivity('Message Corrected', 'chat', 'Fiverr message corrected with stealth bypass (low).');
  };

  const handleClear = () => {
    setInputText('');
    setDetectedWords([]);
    setActiveTab('clean');
    setBanglaTranslation('');
  };

  const handleCopy = (text: string, type: string = 'english') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    store.logActivity('Message Copied', 'chat', `Copy ${type} to clipboard.`);
    setCopiedType(type);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setCopiedType(null);
    }, 2000);
  };

  const handleCopyBoth = (enText: string, bnText: string) => {
    if (!enText) return;
    const combined = `--- ENGLISH MESSAGE ---\n${enText}\n\n--- বাংলা অনুবাদ (BANGLA TRANSLATION) ---\n${bnText}`;
    navigator.clipboard.writeText(combined);
    store.logActivity('Message Copied', 'chat', 'Copy English and Bangla to clipboard.');
    setCopiedType('both');
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setCopiedType(null);
    }, 2000);
  };

  // Tone Rewrite Generators
  const getRewrites = () => {
    if (!inputText) return { professional: '', short: '', formal: '', friendly: '', grammar: '', clean: '' };
    
    let cleanText = inputText;
    let profRewrite = inputText;

    RESTRICTED_WORDS_MAP.forEach(item => {
      item.pattern.lastIndex = 0;
      cleanText = cleanText.replace(item.pattern, (match) => {
        return getObfuscatedWord(match, 'low');
      });

      item.pattern.lastIndex = 0;
      profRewrite = profRewrite.replace(item.pattern, (match) => {
        return item.professional;
      });
    });

    const formalRewrite = `Dear Client,\n\nI hope this correspondence finds you well.\n\n${profRewrite}\n\nShould you require any further adjustments, please let me know. I look forward to working together.\n\nBest regards,\n${store.memberProfile.name}`;
    const friendlyRewrite = `Hi there! 😊\n\nHope you're having an awesome day.\n\nJust wanted to share: ${profRewrite.replace(/i am/gi, "I'm").replace(/would need/gi, "need")}\n\nLet me know what you think, and I'd be super happy to adjust anything if needed! Thanks a bunch!`;
    const shortRewrite = `${profRewrite.slice(0, 200)}${profRewrite.length > 200 ? '...' : ''}\n\nLet me know if this looks good. Thanks!`;
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
  const activeText = activeTab === 'original' ? inputText : rewrites[activeTab as keyof typeof rewrites];

  // Dynamic Real-time AI Translation API hook
  useEffect(() => {
    if (!activeText || !activeText.trim()) {
      setBanglaTranslation('');
      setIsTranslating(false);
      return;
    }

    setIsTranslating(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: activeText, targetLang: 'bn' })
        });
        const data = await res.json();
        if (data && data.translation) {
          setBanglaTranslation(data.translation);
        } else {
          setBanglaTranslation(activeText);
        }
      } catch (err) {
        console.error('Translation fetch error:', err);
      } finally {
        setIsTranslating(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [activeText]);

  // Contextual intent & policy tips
  const banglaInfo = useMemo(() => {
    if (!activeText || !activeText.trim()) return { meaning: '', tips: '' };
    const lower = activeText.toLowerCase();

    let meaning = "সাধারণ ক্লায়েন্ট বার্তা (General Client Communication)";
    let tips = "বার্তাটিতে কোনো ক্ষতিকর ফাইবার পলিসি ভায়োলেশন পাওয়া যায়নি।";

    if (lower.includes('pay') || lower.includes('bank') || lower.includes('paypal') || lower.includes('stripe') || lower.includes('charge') || lower.includes('cost')) {
      meaning = "পেমেন্ট গেটওয়ে, বাজেট বা অতিরিক্ত মূল্য পরিশোধ সংক্রান্ত বার্তা";
      tips = "সতর্কতা: ফাইভারে সরাসরি পেমেন্ট শব্দ লিখলে ডাইরেক্ট অটো বটের নজরে পড়তে পারেন। অল্টারনেটিভ শব্দ (order setups) বা বাইপাস টেক্সট ব্যবহার করুন।";
    } else if (lower.includes('login') || lower.includes('password') || lower.includes('access') || lower.includes('credential')) {
      meaning = "স্টোর অ্যাডমিন প্যানেল বা লগইন অ্যাক্সেস চাওয়া সংক্রান্ত বার্তা";
      tips = "পাসওয়ার্ডের চেয়ে কাস্টমার সাপোর্ট/অফিসিয়াল স্টাফ অ্যাক্সেস ইনভাইটেশন পাঠানো নিরাপদ।";
    } else if (lower.includes('contact') || lower.includes('email') || lower.includes('whatsapp') || lower.includes('phone') || lower.includes('skype') || lower.includes('zoom')) {
      meaning = "বাহ্যিক যোগাযোগের তথ্য বা আউটসাইড চ্যানেল সংক্রান্ত আলোচনা";
      tips = "ফাইবার আউটসাইড কন্টাক্ট শেয়ার করা সম্পূর্ণ নিষিদ্ধ। অর্ডারের সকল আলোচনা ফাইবারেই রাখুন।";
    } else if (lower.includes('review') || lower.includes('rating') || lower.includes('feedback') || lower.includes('5 star')) {
      meaning = "ফিডব্যাক, রেটিং বা রিভিউ চাওয়া সম্পর্কিত কথা";
      tips = "ফাইভারে ৫-স্টার রিভিউ চাওয়া পলিসি লঙ্ঘন। সবসময় 'share your honest experience' বা 'feedback' ব্যবহার করুন।";
    } else if (lower.includes('deliver') || lower.includes('complete') || lower.includes('revision') || lower.includes('finish') || lower.includes('solution') || lower.includes('button') || lower.includes('magsafe')) {
      meaning = "প্রজেক্টের ফিচার, ডেভেলপমেন্ট কাজ বা কাস্টম সমাধানের প্রস্তাবনা";
      tips = "অতিরিক্ত কাজের বাজেট আলোচনার সময় কাস্টম অফার পাঠানোর প্রস্তাব দিন।";
    }

    return { meaning, tips };
  }, [activeText]);

  const stats = useMemo(() => {
    const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
    const charCount = inputText.length;
    const readingTimeSec = Math.max(1, Math.ceil(wordCount / 3.5));
    
    let politenessScore = 100;
    if (detectedWords.length > 0) politenessScore -= Math.min(40, detectedWords.length * 10);
    if (inputText.toLowerCase().includes('must') || inputText.toLowerCase().includes('urgent')) politenessScore -= 5;
    if (inputText.toLowerCase().includes('please') || inputText.toLowerCase().includes('thank')) politenessScore += 5;
    politenessScore = Math.max(50, Math.min(100, politenessScore));

    return {
      wordCount,
      charCount,
      readingTimeSec,
      politenessScore
    };
  }, [inputText, detectedWords]);

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
    
    const words = text.split(/(\s+)/);
    return words.map((chunk, idx) => {
      if (/^\s+$/.test(chunk)) return chunk;

      const cleanChunk = chunk.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
      
      const isRestricted = RESTRICTED_WORDS_MAP.some(item => {
        item.pattern.lastIndex = 0;
        return item.pattern.test(cleanChunk);
      });
      
      if (isRestricted) {
        return (
          <span key={idx} className="bg-red-500/20 text-red-350 border border-red-500/30 px-1 rounded font-semibold text-sm animate-pulse">
            {chunk}
          </span>
        );
      }
      
      const hasDelimiters = /[-_]/.test(cleanChunk);
      const strippedDelimiter = cleanChunk.replace(/[-_]/g, '');
      
      const matchesRestrictedBase = RESTRICTED_WORDS_MAP.some(item => {
        item.pattern.lastIndex = 0;
        return item.pattern.test(strippedDelimiter);
      });

      const isObfuscated = hasDelimiters && matchesRestrictedBase;

      if (isObfuscated) {
        return (
          <span key={idx} className="bg-emerald-500/20 text-emerald-350 border border-emerald-500/30 px-1 rounded text-sm font-bold" title="Stealth bypass active">
            {chunk}
          </span>
        );
      }

      return chunk;
    });
  };

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

  const getRiskScore = () => {
    if (detectedWords.length === 0) {
      return { 
        level: 'SAFE', 
        color: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/10', 
        score: 0, 
        desc: 'Your message complies with standard Fiverr policy guidelines.' 
      };
    }
    
    const hasContact = detectedWords.some(w => ["email","mail","gmail","phone","number","mobile","whatsapp","imo","skype","zoom","telegram","discord","facebook","insta","instagram","linkedin","social media","contact me directly","call me","message me outside","contact","address"].includes(w));
    const hasPayment = detectedWords.some(w => ["pay","payment","payments","money","cash","bank","bank transfer","western union","wire transfer","paypal","payoneer","crypto","bitcoin","usdt","wallet","outside","off-site","stripe","wise","payout","dollar","usd","send payment","direct payment","outside payment"].includes(w));
    const hasReview = detectedWords.some(w => ["review","reviews","feedback","5 stars","5 star review","rating","ratings","positive review","good rating","leave a review","increase my rating","testimonials"].includes(w));
    const hasAccount = detectedWords.some(w => ["login credentials","password","admin access","account transfer","ownership transfer","account details","account"].includes(w));
    const hasFile = detectedWords.some(w => ["google drive link","dropbox","wetransfer","github repository","external link"].includes(w));
    const hasOffPlatform = detectedWords.some(w => ["work outside the platform","avoid platform fee","direct deal","continue privately"].includes(w));
    const hasAcademic = detectedWords.some(w => ["homework","assignment","exam","test","academic","essay writing","fake","bot","generate"].includes(w));
    
    if (hasContact || hasPayment || hasOffPlatform || hasAcademic) {
      return { 
        level: 'SEVERE RISK', 
        color: 'text-red-400 border-red-500/35 bg-red-950/20', 
        score: 90, 
        desc: 'Direct payment references, off-platform deals, academic/fake work, or external contact channels detected. High likelihood of automated bot flags if sent raw.' 
      };
    }
    if (hasReview || hasAccount || hasFile) {
      return { 
        level: 'MODERATE RISK', 
        color: 'text-amber-400 border-amber-500/25 bg-amber-950/15', 
        score: 60, 
        desc: 'Review solicitation, credential sharing, or external links detected. Fiverr terms prohibit or closely monitor these interactions.' 
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
    <div className={helperStyles.wrapper}>
      {/* Toast Notification */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-emerald-950/90 border border-emerald-500/30 text-emerald-400 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md font-sans"
          >
            <Check className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold tracking-wider uppercase">
              {copiedType === 'bangla' ? 'বাংলা অনুবাদ অনুলিপি করা হয়েছে!' : 
               copiedType === 'both' ? 'ইংরেজি + বাংলা অনুবাদ অনুলিপি করা হয়েছে!' : 
               'Copied to clipboard'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className={helperStyles.headerTitle}>MESSAGE HELPER</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wide uppercase flex items-center gap-1">
              <Languages className="w-3 h-3 text-emerald-400" />
              <span>Real-time AI Translator</span>
            </span>
          </div>
          <p className={helperStyles.headerDesc}>Fiverr & Upwork communications advisor with instant AI English-to-Bangla translation & policy advisor.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Core Editor Panel */}
        <div className="xl:col-span-3 space-y-6">
          <div className={helperStyles.editorCard}>
            
            {/* Input Header Stats */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
              <span className="text-xs text-gray-400 font-mono tracking-wide uppercase">Paste or type your client message draft:</span>
              <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">Stealth Policy Active</span>
                <span>•</span>
                <span>{stats.wordCount} Words</span>
                <span>•</span>
                <span>{inputText.length}/2500 Chars</span>
                {stats.wordCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {stats.readingTimeSec}s read
                    </span>
                  </>
                )}
              </div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                soundSynth.playClick();
              }}
              placeholder="Paste or type your client message draft here..."
              rows={8}
              className={helperStyles.textarea}
            />

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
                    <span>No restricted words or phrases detected! Safe for platform policy.</span>
                  </div>
                )
              )}
            </div>

            {/* Visualizer output card */}
            {inputText && (
              <div className={helperStyles.visualizerBox}>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Analysis Visualizer</span>
                <p className="text-sm text-gray-300 leading-relaxed font-medium">
                  {renderHighlightedText(activeText)}
                </p>
              </div>
            )}

            {/* Base Action deck */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                onClick={handleCorrect}
                disabled={!inputText}
                className={helperStyles.actionBtnCorrect}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Correct Message</span>
              </button>

              <button
                onClick={() => handleCopy(activeText, 'english')}
                disabled={!activeText}
                className={helperStyles.actionBtnSec}
              >
                {copied && copiedType === 'english' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
                <span className={copied && copiedType === 'english' ? "text-green-400" : ""}>Copy English</span>
              </button>

              <button
                onClick={() => handleCopy(banglaTranslation, 'bangla')}
                disabled={!banglaTranslation || isTranslating}
                className={helperStyles.actionBtnSec}
              >
                {copied && copiedType === 'bangla' ? <Check className="w-4 h-4 text-green-400" /> : <Languages className="w-4 h-4 text-blue-400" />}
                <span className={copied && copiedType === 'bangla' ? "text-green-400" : ""}>বাংলা কপি</span>
              </button>

              <button
                onClick={() => handleCopyBoth(activeText, banglaTranslation)}
                disabled={!activeText || isTranslating}
                className={helperStyles.actionBtnSec}
              >
                {copied && copiedType === 'both' ? <Check className="w-4 h-4 text-green-400" /> : <Split className="w-4 h-4 text-amber-400" />}
                <span className={copied && copiedType === 'both' ? "text-green-400" : ""}>Copy Both (EN+BN)</span>
              </button>

              <button
                onClick={() => setSaveModalOpen(true)}
                disabled={!activeText}
                className={helperStyles.actionBtnSec}
              >
                <Save className="w-4 h-4" />
                <span>Save Template</span>
              </button>

              <button
                onClick={handleClear}
                disabled={!inputText}
                className={helperStyles.actionBtnClear}
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Tone Rewrite & Bangla Translation Output Deck */}
          {inputText && (
            <div className={helperStyles.toneWrapper}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-glass-border pb-3 gap-3">
                <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none flex-nowrap shrink-0 max-w-full pb-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider pr-1">Tone Scale:</span>
                  {(['original', 'professional', 'short', 'formal', 'friendly', 'grammar', 'clean'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`shrink-0 ${activeTab === tab ? helperStyles.toneBtnActive : helperStyles.toneBtnInactive}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDualView(!dualView)}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors flex items-center gap-1.5 font-medium ${
                      dualView 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'border-glass-border text-gray-400 hover:text-white'
                    }`}
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span>Dual View (EN + BN)</span>
                  </button>

                  <button
                    onClick={() => setCompareMode(!compareMode)}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                      compareMode 
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                        : 'border-glass-border text-gray-500 hover:text-white'
                    }`}
                  >
                    Diff Compare
                  </button>
                </div>
              </div>

              {compareMode ? (
                renderDiffCompare()
              ) : dualView ? (
                /* Dual View Side-by-Side (English Output + Dynamic Bangla AI Translation Card) */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                  
                  {/* English Output Box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        <span>ENGLISH MESSAGE ({activeTab.toUpperCase()})</span>
                      </span>
                      <button 
                        onClick={() => handleCopy(activeText, 'english')}
                        className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all"
                      >
                        <Copy className="w-3 h-3 text-emerald-400" />
                        <span>Copy EN</span>
                      </button>
                    </div>
                    <div className={helperStyles.outputPreBox}>
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-200">{activeText}</pre>
                    </div>
                  </div>

                  {/* Bangla Translation & Explanation Box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-blue-400" />
                        <span>বাংলা অনুবাদ ও তাৎপর্য (REAL-TIME AI TRANSLATION)</span>
                      </span>
                      <div className="flex items-center gap-2">
                        {isTranslating && (
                          <span className="text-[10px] text-blue-400 flex items-center gap-1 font-medium animate-pulse font-mono">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>অনুবাদ হচ্ছে...</span>
                          </span>
                        )}
                        <button 
                          onClick={() => handleCopy(banglaTranslation, 'bangla')}
                          disabled={!banglaTranslation || isTranslating}
                          className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all disabled:opacity-50"
                        >
                          <Copy className="w-3 h-3 text-blue-400" />
                          <span>বাংলা কপি</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-950/70 border border-blue-500/20 font-sans text-xs leading-relaxed space-y-3 max-h-[350px] overflow-y-auto relative text-left">
                      {/* Context summary */}
                      <div className="bg-blue-950/30 border border-blue-500/20 rounded-lg p-2.5 space-y-1">
                        <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider block">মূল তাৎপর্য (Context Intent):</span>
                        <p className="text-xs font-semibold text-gray-200">{banglaInfo.meaning}</p>
                      </div>

                      {/* Bangla Translated Message */}
                      <div className="space-y-1 pt-1">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">বাংলা অনুবাদ:</span>
                        {isTranslating && !banglaTranslation ? (
                          <div className="py-6 text-center text-xs text-blue-400 flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                            <span>অনুবাদ তৈরি হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</span>
                          </div>
                        ) : (
                          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-200 leading-relaxed">{banglaTranslation || 'অনুবাদ প্রক্রিয়াজাতকরণ সম্পূর্ণ হতে পারেনি।'}</pre>
                        )}
                      </div>

                      {/* Policy Guidance Tip in Bangla */}
                      {banglaInfo.tips && (
                        <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-amber-300">
                          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                          <span>{banglaInfo.tips}</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                /* Single Output Box */
                <div className="space-y-3">
                  <div className={helperStyles.outputPreBox}>
                    <button 
                      onClick={() => handleCopy(activeText, 'english')}
                      className="absolute top-3 right-3 p-1.5 rounded hover:bg-glass-hover text-gray-400 hover:text-white transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-300 pr-8">{activeText}</pre>
                  </div>
                  
                  {/* Bangla Translation Drawer Card for Single Mode */}
                  <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5" />
                        <span>বাংলা অনুবাদ (Bangla Translation)</span>
                      </span>
                      <button 
                        onClick={() => handleCopy(banglaTranslation, 'bangla')}
                        disabled={!banglaTranslation || isTranslating}
                        className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        <Copy className="w-3 h-3" />
                        <span>কপি করুন</span>
                      </button>
                    </div>
                    {isTranslating && !banglaTranslation ? (
                      <div className="py-3 text-center text-xs text-blue-400 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                        <span>অনুবাদ তৈরি হচ্ছে...</span>
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-xs text-gray-300 leading-relaxed">{banglaTranslation}</pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          
          {/* Bangla Helper & Tone Analytics Card */}
          <div className={helperStyles.sidebarCard}>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Languages className="w-4 h-4 text-blue-400" />
              <span>বাংলা অনুবাদক (Real-time AI Translator)</span>
            </h3>
            
            <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
              <div className="p-3 rounded-lg bg-gray-950/50 border border-glass-border space-y-2">
                <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase font-mono">
                  <span>সৌজন্যতা মিটার (Politeness)</span>
                  <span className="font-bold text-emerald-400">{stats.politenessScore}%</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${stats.politenessScore}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 text-[11px] text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>যেকোনো কাস্টম ইংরেজি মেসেজ দিলে তা গুগল এআই ট্রান্সলেশনের মাধ্যমে অবিকল নিখুঁত বাংলায় অনুবাদ হবে।</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>"বাংলা কপি" দিয়ে সহজেই ক্লায়েন্ট মেসেজের বাংলা অনুবাদ অনুলিপি করতে পারবেন।</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>ফাইবার পলিসি ভায়োলেশন শব্দসমূহ অটোমেটিক বাইপাস টেক্সটে পরিণত হবে।</span>
                </div>
              </div>
            </div>
          </div>

          {/* History Sidebar */}
          <div className={helperStyles.sidebarCard}>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-green-400" />
              <span>Scan History</span>
            </h3>
            
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {historyList.length > 0 ? (
                historyList.map((hist) => (
                  <button
                    key={hist.id}
                    onClick={() => setInputText(hist.text)}
                    className={helperStyles.sidebarBtn}
                  >
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
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
          <div className={helperStyles.sidebarCard}>
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
                    const isPayment = ["pay","payment","payments","money","cash","bank","bank transfer","western union","wire transfer","paypal","payoneer","crypto","bitcoin","usdt","wallet","outside","off-site","stripe","wise","payout","dollar","usd","send payment","direct payment","outside payment"].includes(word);
                    const isContact = ["email","mail","gmail","phone","number","mobile","whatsapp","imo","skype","zoom","telegram","discord","facebook","insta","instagram","linkedin","social media","contact me directly","call me","message me outside","contact","address"].includes(word);
                    const isOffPlatform = ["work outside the platform","avoid platform fee","direct deal","continue privately"].includes(word);
                    const isAccount = ["login credentials","password","admin access","account transfer","ownership transfer","account details","account"].includes(word);
                    const isReview = ["review","reviews","feedback","5 stars","5 star review","rating","ratings","positive review","good rating","leave a review","increase my rating","testimonials"].includes(word);
                    const isFile = ["google drive link","dropbox","wetransfer","github repository","external link"].includes(word);
                    const isAcademic = ["homework","assignment","exam","test","academic","essay writing","fake","bot","generate"].includes(word);
                    
                    const isSevere = isPayment || isContact || isOffPlatform || isAcademic;
                    
                    return (
                      <div key={word} className="flex items-start gap-2 text-gray-300">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isSevere ? 'bg-red-500' : 'bg-amber-500'}`} />
                        <span className="leading-relaxed">
                          <strong className="text-white font-mono">{word}</strong>: {
                            isPayment ? 'Fiverr strictly bans payments outside their gateway channel. Use professional terms like "order setup".' :
                            isContact ? 'Sharing contact channels is prohibited. Refer to communication inside the workspace instead.' :
                            isOffPlatform ? 'Off-platform work references will trigger immediate bot flags.' :
                            isAcademic ? 'Academic work, exams, generating fake reviews or bots is strictly banned on Fiverr.' :
                            isAccount ? 'Sharing or requesting credentials can trigger security warnings.' :
                            isFile ? 'External file sharing links are monitored. Keep files in Fiverr order page if possible.' :
                            'Soliciting ratings, reviews, or feedback is monitored closely by Fiverr algorithms. Obfuscate these words.'
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
                  className="px-3.5 py-2 rounded-lg bg-gray-955 border border-glass-border hover:bg-glass-hover text-xs font-semibold text-gray-400 hover:text-white"
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
