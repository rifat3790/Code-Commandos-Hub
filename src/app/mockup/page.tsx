'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Download, 
  Printer, 
  Upload, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  Star, 
  Check, 
  FileText,
  Sliders,
  Type,
  Calendar,
  DollarSign,
  Palette,
  FileCheck,
  CheckCircle2,
  Award,
  Grid,
  Sparkle
} from 'lucide-react';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { MockupStyle } from '@/types';

type LayoutStructure = 'banner' | 'fiverr_split' | 'split' | 'spotlight' | 'certificate' | 'sidebyside' | 'showcase' | 'bento' | 'dual_screen' | 'premium_award';
type PatternOverlay = 'none' | 'dots' | 'grid' | 'waves';

const LAYOUTS: { value: MockupStyle; label: string; desc: string }[] = [
  { value: 'green-award', label: 'Green Award', desc: 'Image 1 green banner design' },
  { value: 'blue-tech', label: 'Blue Tech', desc: 'Image 2 navy blue stripes' },
  { value: 'classic', label: 'Classic Grid', desc: 'Slate gray clean layout' },
  { value: 'elite', label: 'Elite Developer', desc: 'Deep violet glowing style' },
  { value: 'minimal', label: 'Minimalist', desc: 'Monochrome thin layout' },
  { value: 'luxury', label: 'Golden Luxury', desc: 'Black carbon and gold foil accents' },
  { value: 'dark-premium', label: 'Dark Premium', desc: 'Sleek dark gray with custom neon' },
  { value: 'soft-gradient', label: 'Soft Gradient', desc: 'Pastel colors mesh background' },
  { value: 'celebration', label: 'Celebration Stars', desc: 'Festive confetti background' },
  { value: 'glass', label: 'Frost Glassmorphism', desc: 'Ultra-modern translucent panel' }
];

const STRUCTURES: { value: LayoutStructure; label: string; desc: string }[] = [
  { value: 'banner', label: 'Classic Banner', desc: 'Avatar on top left, details on bottom' },
  { value: 'fiverr_split', label: 'Fiverr Congrats Card', desc: 'Reference image design (split green & white panels)' },
  { value: 'split', label: 'Split Dashboard', desc: 'Left profile panel, right details card' },
  { value: 'spotlight', label: 'Spotlight Strip', desc: '3-column horizontal showcase row' },
  { value: 'certificate', label: 'Centered Award', desc: 'Centered profile photo, quotes & signatures' },
  { value: 'sidebyside', label: 'Side-by-Side Cards', desc: 'Balanced Profile Card + Client Feedback Card' },
  { value: 'showcase', label: 'Premium Showcase', desc: 'Neon circle profile on left, review card on right' },
  { value: 'bento', label: 'Premium Bento Grid', desc: 'Grid block containing photo, screenshot & stats' },
  { value: 'dual_screen', label: 'Dual Glassmorphic Screen', desc: 'Two equal columns: Profile Card + Browser Mockup' },
  { value: 'premium_award', label: 'Luxury Platinum Award', desc: 'Prestige border, gold details, seal stamp' }
];

const DEFAULT_FIVERR_SCREENSHOT = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 450" width="700" height="450">
  <rect width="100%" height="100%" fill="#f7f7f7"/>
  <rect x="0" y="0" width="700" height="50" fill="#0d1b2a"/>
  <circle cx="25" cy="25" r="6" fill="#ff5f56"/>
  <circle cx="45" cy="25" r="6" fill="#ffbd2e"/>
  <circle cx="65" cy="25" r="6" fill="#27c93f"/>
  <text x="350" y="31" fill="#a0aec0" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">order-details-F0630A9658448.png</text>
  
  <rect x="20" y="70" width="660" height="60" rx="6" fill="#1dbf73" opacity="0.08"/>
  <rect x="20" y="70" width="4" height="60" fill="#1dbf73" rx="2"/>
  <text x="40" y="95" fill="#1dbf73" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="bold">Order Completed</text>
  <text x="40" y="115" fill="#4a5568" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Your delivery was accepted and reviewed by the client.</text>
  
  <rect x="20" y="145" width="420" height="280" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
  <text x="40" y="175" fill="#a0aec0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="extrabold" letter-spacing="1">CLIENT FEEDBACK</text>
  
  <circle cx="55" cy="215" r="18" fill="#1a365d"/>
  <text x="55" y="221" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" text-anchor="middle">R</text>
  <text x="85" y="213" fill="#2d3748" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="bold">robalbert438</text>
  <text x="85" y="228" fill="#718096" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10">@robalbert438 • United States</text>
  
  <text x="40" y="260" fill="#2d3748" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="bold">Client's message</text>
  <g transform="translate(135, 249)">
    <path d="M6 .29l1.834 3.716 4.102.596-2.969 2.893.7 4.085L6 9.448l-3.667 1.932.7-4.085L.064 4.602l4.102-.596z" fill="#ffb33e"/>
    <path d="M6 .29l1.834 3.716 4.102.596-2.969 2.893.7 4.085L6 9.448l-3.667 1.932.7-4.085L.064 4.602l4.102-.596z" fill="#ffb33e" transform="translate(14,0)"/>
    <path d="M6 .29l1.834 3.716 4.102.596-2.969 2.893.7 4.085L6 9.448l-3.667 1.932.7-4.085L.064 4.602l4.102-.596z" fill="#ffb33e" transform="translate(28,0)"/>
    <path d="M6 .29l1.834 3.716 4.102.596-2.969 2.893.7 4.085L6 9.448l-3.667 1.932.7-4.085L.064 4.602l4.102-.596z" fill="#ffb33e" transform="translate(42,0)"/>
    <path d="M6 .29l1.834 3.716 4.102.596-2.969 2.893.7 4.085L6 9.448l-3.667 1.932.7-4.085L.064 4.602l4.102-.596z" fill="#ffb33e" transform="translate(56,0)"/>
  </g>
  <text x="210" y="260" fill="#ffb33e" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="bold">5.0</text>
  
  <rect x="40" y="278" width="380" height="75" rx="6" fill="#f8fafc" stroke="#f1f5f9" stroke-width="1"/>
  <text x="50" y="298" fill="#334155" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-style="italic" font-weight="500">"unbelievably perfect execution on this project, better than we ever"</text>
  <text x="50" y="314" fill="#334155" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-style="italic" font-weight="500">"expected our Shopify could look. looking forward to many more"</text>
  <text x="50" y="330" fill="#334155" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-style="italic" font-weight="500">"projects together."</text>
  
  <line x1="40" y1="365" x2="420" y2="365" stroke="#edf2f7" stroke-width="1"/>
  <text x="40" y="385" fill="#718096" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="bold">COMMUNICATION</text>
  <text x="140" y="385" fill="#2d3748" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="bold">5.0 *</text>
  
  <text x="175" y="385" fill="#718096" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="bold">SERVICE ACCURACY</text>
  <text x="280" y="385" fill="#2d3748" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="bold">5.0 *</text>
  
  <text x="320" y="385" fill="#718096" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="bold">RECOMMEND</text>
  <text x="390" y="385" fill="#2d3748" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="bold">5.0 *</text>
  
  <rect x="460" y="145" width="220" height="280" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
  <text x="480" y="175" fill="#a0aec0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="extrabold" letter-spacing="1">ORDER DETAILS</text>
  
  <text x="480" y="205" fill="#718096" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="bold">ORDERED BY</text>
  <text x="660" y="205" fill="#2d3748" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="bold" text-anchor="end">robalbert438</text>
  
  <text x="480" y="235" fill="#718096" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="bold">DELIVERY DATE</text>
  <text x="660" y="235" fill="#2d3748" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="bold" text-anchor="end">Jun 19, 4:44 AM</text>
  
  <text x="480" y="265" fill="#718096" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="bold">TOTAL BUDGET</text>
  <text x="660" y="265" fill="#27c93f" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="black" text-anchor="end">$1,600 USD</text>
  
  <text x="480" y="295" fill="#718096" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="bold">ORDER ID</text>
  <text x="660" y="295" fill="#4a5568" font-family="monospace" font-size="9" font-weight="bold" text-anchor="end">#FO114E2113DC5</text>
  
  <line x1="480" y1="320" x2="660" y2="320" stroke="#edf2f7" stroke-width="1"/>
  
  <g transform="translate(480, 335)">
    <circle cx="8" cy="8" r="7" fill="#1dbf73"/>
    <path d="M5 8 l2 2 l4 -4" fill="none" stroke="#ffffff" stroke-width="1.5"/>
    <text x="22" y="11" fill="#2d3748" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="bold">Delivery approved</text>
  </g>
  <g transform="translate(480, 360)">
    <circle cx="8" cy="8" r="7" fill="#1dbf73"/>
    <path d="M5 8 l2 2 l4 -4" fill="none" stroke="#ffffff" stroke-width="1.5"/>
    <text x="22" y="11" fill="#2d3748" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="bold">Order completed</text>
  </g>
  <g transform="translate(480, 385)">
    <circle cx="8" cy="8" r="7" fill="#1dbf73"/>
    <path d="M5 8 l2 2 l4 -4" fill="none" stroke="#ffffff" stroke-width="1.5"/>
    <text x="22" y="11" fill="#2d3748" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="bold">5* feedback left</text>
  </g>
</svg>
`)}`;

export default function MockupPage() {
  const store = useWorkspaceStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Layout Themes & Structures
  const [style, setStyle] = useState<MockupStyle>('green-award');
  const [structure, setStructure] = useState<LayoutStructure>('fiverr_split');
  const [pattern, setPattern] = useState<PatternOverlay>('grid');

  // Form Inputs
  const [memberName, setMemberName] = useState('Refayet Hossen');
  const [role, setRole] = useState('Shopify Expert');
  const [memberPhoto, setMemberPhoto] = useState<string>('');
  
  // Custom Screenshots (Base64)
  const [reviewScreenshot, setReviewScreenshot] = useState<string>(DEFAULT_FIVERR_SCREENSHOT);
  const [useNativeLayout, setUseNativeLayout] = useState(false);

  // Specific Data fields for Native Fiverr Layout
  const [clientName, setClientName] = useState('robalbert438');
  const [reviewText, setReviewText] = useState('unbelievably perfect execution on this project, better than we ever expected our Shopify could look. looking forward to many more projects together.');
  const [ratingStars, setRatingStars] = useState(5);
  const [commRating, setCommRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [valueRating, setValueRating] = useState(5);

  const [orderPrice, setOrderPrice] = useState('1600');
  const [orderId, setOrderId] = useState('#FO114E2113DC5');
  const [projectName, setProjectName] = useState('Shopify Custom Section Builder');
  const [website, setWebsite] = useState('fitestore-2.myshopify.com');
  const [completionDate, setCompletionDate] = useState('2026-06-19'); // date input
  const [tipsAmount, setTipsAmount] = useState('50');
  
  // Customization
  const [customMessage, setCustomMessage] = useState('Keep achieving, Keep Shining.');
  const [themeColor, setThemeColor] = useState('#22c55e'); // custom color picker

  // Blocks toggles
  const [specialBlocks, setSpecialBlocks] = useState({
    congratulations: true,
    keepAchieving: true,
    starReview: true,
    tipsEarned: true,
    topPerformance: true,
    projectCompleted: true,
  });

  useEffect(() => {
    store.hydrate();
  }, []);

  // Hydrate local states from workspaceStore and clean role of any @ Code Commandos / Code Commandos Team suffixes
  useEffect(() => {
    if (store.isHydrated && store.memberProfile) {
      if (store.memberProfile.name) setMemberName(store.memberProfile.name);
      if (store.memberProfile.role) {
        const cleanedRole = store.memberProfile.role
          .replace(/\s*@\s*Code\s*Commandos/gi, '')
          .replace(/\s*Code\s*Commandos\s*Team/gi, '')
          .replace(/\s*Code\s*Commandos/gi, '')
          .trim();
        setRole(cleanedRole || 'Shopify Expert');
      }
      if (store.memberProfile.photo) setMemberPhoto(store.memberProfile.photo);
    }
  }, [store.isHydrated, store.memberProfile]);

  // Set default theme colors based on layout selection
  useEffect(() => {
    if (style === 'green-award') setThemeColor('#22c55e');
    else if (style === 'blue-tech') setThemeColor('#3b82f6');
    else if (style === 'elite') setThemeColor('#8b5cf6');
    else if (style === 'luxury') setThemeColor('#eab308');
  }, [style]);

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'photo' | 'review') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (target === 'photo') setMemberPhoto(base64);
      else if (target === 'review') setReviewScreenshot(base64);
    };
    reader.readAsDataURL(file);
  };

  // Export card as image
  const handleExport = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        quality: 1.0,
        pixelRatio: 2
      });
      
      const link = document.createElement('a');
      const filename = `achievement-${memberName.toLowerCase().replace(/\s+/g, '-')}-${style}.png`;
      link.download = filename;
      link.href = dataUrl;
      link.click();

      // Trigger Confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Log download into store
      store.addDownload({
        name: filename,
        type: 'mockup',
        url: dataUrl,
        size: '1.4 MB'
      });
      store.logActivity('Achievement Mockup Compiled', 'mockup', `Exported: ${style} card.`);
    } catch (error) {
      console.error('Oops, something went wrong with image compilation!', error);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Formatting date for layout output
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Helper to render premium background stars overlay
  const renderPremiumStars = () => {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30 z-0" xmlns="http://www.w3.org/2000/svg">
        {/* Glow halos */}
        <circle cx="280" cy="160" r="140" fill={themeColor} opacity="0.08" filter="blur(65px)" />
        <circle cx="560" cy="300" r="110" fill="#ffffff" opacity="0.05" filter="blur(55px)" />
        <circle cx="160" cy="360" r="90" fill={themeColor} opacity="0.07" filter="blur(40px)" />

        {/* Dynamic 4-Point Star Sparkles */}
        <path d="M 180 80 L 182 85 L 187 86 L 182 87 L 180 92 L 178 87 L 173 86 L 178 85 Z" fill="#ffffff" opacity="0.9" />
        <path d="M 640 100 L 642.5 105 L 647.5 106 L 642.5 107 L 640 112 L 637.5 107 L 632.5 106 L 637.5 105 Z" fill={themeColor} opacity="0.95" />
        <path d="M 460 60 L 461.5 64 L 465.5 65 L 461.5 66 L 460 70 L 458.5 66 L 454.5 65 L 458.5 64 Z" fill="#ffffff" opacity="0.7" />
        <path d="M 290 320 L 292.5 325 L 297.5 326 L 292.5 327 L 290 332 L 287.5 327 L 282.5 326 L 287.5 325 Z" fill={themeColor} opacity="0.8" />
        <path d="M 90 410 L 91.5 414 L 95.5 415 L 91.5 416 L 90 420 L 88.5 416 L 84.5 415 L 88.5 414 Z" fill="#ffffff" opacity="0.6" />
        <path d="M 610 380 L 612.5 385 L 617.5 386 L 612.5 387 L 610 392 L 607.5 387 L 602.5 386 L 607.5 385 Z" fill="#ffffff" opacity="0.8" />
        <path d="M 520 200 L 522 205 L 527 206 L 522 207 L 520 212 L 518 207 L 513 206 L 518 205 Z" fill={themeColor} opacity="0.85" />
        <path d="M 330 180 L 331.5 184 L 335.5 185 L 331.5 186 L 330 190 L 328.5 186 L 324.5 185 L 328.5 184 Z" fill="#ffffff" opacity="0.6" />

        {/* Tiny background grid stars */}
        <circle cx="100" cy="50" r="1" fill="#ffffff" opacity="0.35" />
        <circle cx="230" cy="110" r="1.5" fill="#ffffff" opacity="0.45" />
        <circle cx="390" cy="40" r="1" fill="#ffffff" opacity="0.25" />
        <circle cx="530" cy="80" r="1.5" fill="#ffffff" opacity="0.55" />
        <circle cx="680" cy="60" r="1.2" fill="#ffffff" opacity="0.35" />
        <circle cx="140" cy="270" r="1" fill="#ffffff" opacity="0.45" />
        <circle cx="210" cy="380" r="1.5" fill="#ffffff" opacity="0.55" />
        <circle cx="340" cy="290" r="1" fill="#ffffff" opacity="0.35" />
        <circle cx="470" cy="420" r="1.2" fill="#ffffff" opacity="0.45" />
        <circle cx="570" cy="300" r="1" fill="#ffffff" opacity="0.35" />
        <circle cx="700" cy="280" r="1.5" fill="#ffffff" opacity="0.45" />
        
        {/* Constellation lines */}
        <line x1="180" y1="86" x2="230" y2="110" stroke="#ffffff" strokeWidth="0.5" opacity="0.12" />
        <line x1="640" y1="106" x2="530" y2="80" stroke={themeColor} strokeWidth="0.5" opacity="0.18" />
        <line x1="290" y1="326" x2="340" y2="290" stroke={themeColor} strokeWidth="0.5" opacity="0.12" />
        <line x1="610" y1="386" x2="570" y2="300" stroke="#ffffff" strokeWidth="0.5" opacity="0.12" />
      </svg>
    );
  };

  // Helper to render star ratings dynamically
  const renderStars = (count: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`w-3.5 h-3.5 ${i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  // Render the native review block and sidebar (removed Fiverr branding references)
  const renderFiverrNative = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs select-none">
        
        {/* Left Side: Client Review block (7 cols) */}
        <div className="md:col-span-8 p-4 rounded-xl bg-white border border-gray-200 text-black space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Client Feedback</span>
              <span className="text-[10px] text-gray-500 font-mono">Order reference: {orderId}</span>
            </div>

            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-700 text-white font-extrabold flex items-center justify-center uppercase text-[10px]">
                  {clientName[0]}
                </div>
                <div>
                  <span className="font-bold text-gray-800">{clientName}</span>
                  <span className="text-gray-400 text-[10px] ml-1">@ {clientName}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 py-0.5">
                <span className="font-semibold text-gray-800 text-[11px]">{clientName}'s message</span>
                <div className="flex gap-0.5">{renderStars(ratingStars)}</div>
                <span className="font-bold text-gray-800 text-[11px] ml-1">{ratingStars}</span>
              </div>

              <p className="text-gray-700 text-xs italic bg-gray-50 p-2.5 rounded-lg border border-gray-100 leading-relaxed font-medium">
                "{reviewText}"
              </p>
            </div>
          </div>

          {/* Ratings stats */}
          <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
            <div>
              <span className="text-gray-500 text-[9px] block">Communication</span>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex gap-0.5">{renderStars(commRating)}</div>
                <span className="font-bold text-gray-800 text-[10px]">{commRating}</span>
              </div>
            </div>
            <div>
              <span className="text-gray-500 text-[9px] block">Quality</span>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex gap-0.5">{renderStars(qualityRating)}</div>
                <span className="font-bold text-gray-800 text-[10px]">{qualityRating}</span>
              </div>
            </div>
            <div>
              <span className="text-gray-500 text-[9px] block">Value</span>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex gap-0.5">{renderStars(valueRating)}</div>
                <span className="font-bold text-gray-800 text-[10px]">{valueRating}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Order Sidebar Details (4 cols) */}
        <div className="md:col-span-4 p-4 rounded-xl bg-white border border-gray-200 text-black space-y-3.5 shadow-sm text-left flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block border-b border-gray-100 pb-2">Order Details</span>
            
            <div className="space-y-2">
              <div>
                <span className="text-gray-400 text-[9px] block uppercase font-bold tracking-wide">Project Name</span>
                <span className="text-gray-800 font-extrabold text-xs line-clamp-1">{projectName}</span>
              </div>
              
              <div>
                <span className="text-gray-400 text-[9px] block uppercase font-bold tracking-wide">Store Domain</span>
                <span className="text-blue-600 font-semibold text-xs truncate block">{website}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400 text-[9px] block uppercase font-bold tracking-wide">Amount</span>
                  <span className="text-gray-800 font-black text-sm">${orderPrice} USD</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[9px] block uppercase font-bold tracking-wide">Delivery Date</span>
                  <span className="text-gray-800 font-bold text-xs">{formatDate(completionDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification checkmarks & Tips */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100 text-[10px] font-bold">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-600 text-white shrink-0" />
              <span>Delivery reviewed & approved</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-600 text-white shrink-0" />
              <span>Order completed</span>
            </div>
            {specialBlocks.tipsEarned && tipsAmount && (
              <div className="flex items-center gap-1.5 text-yellow-500 mt-2 p-1.5 bg-yellow-50 rounded-md border border-yellow-100">
                <Award className="w-4 h-4 fill-yellow-500 text-white shrink-0" />
                <span className="font-extrabold text-[11px]">Client tipped ${tipsAmount}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    );
  };

  // Helper to render the premium tips badge with a decorative pointing arrow
  const renderPremiumTipsBadge = (positionClass = "bottom-6 right-6") => {
    if (!specialBlocks.tipsEarned || !tipsAmount) return null;
    
    return (
      <div className={`absolute ${positionClass} flex items-end gap-1 z-30`}>
        {/* Decorative Pointing Arrow */}
        <div className="mb-4 mr-1 text-yellow-500/90 drop-shadow-[0_2px_8px_rgba(250,204,21,0.6)]">
          <svg width="55" height="55" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-12 -translate-y-2 translate-x-2">
            <path d="M 5 80 Q 40 10 85 45" />
            <polyline points="65 30 85 45 65 60" />
          </svg>
        </div>
        
        {/* Premium Tips Badge */}
        <div className="bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-black px-6 py-3 rounded-2xl shadow-[0_15px_35px_-5px_rgba(250,204,21,0.45)] flex items-center gap-3 border-[3px] border-white/80 transform rotate-[-3deg] backdrop-blur-md">
          <div className="bg-white/40 p-2 rounded-full shadow-inner border border-white/50">
            <Award className="w-7 h-7 fill-white text-yellow-600 drop-shadow-sm" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-[11px] uppercase tracking-widest text-black/70 leading-none mb-1">Tips</span>
            <span className="font-black text-3xl leading-none tracking-tighter text-black drop-shadow-sm">${tipsAmount}</span>
          </div>
        </div>
      </div>
    );
  };

  // Helper to render screenshot image inside a premium mock browser window
  const renderScreenshotBrowserFrame = (heightClass = "max-h-[260px]") => {
    if (reviewScreenshot) {
      return (
        <div className="rounded-xl overflow-hidden border border-gray-700/50 bg-black/60 shadow-2xl flex flex-col w-full text-left">
          {/* Browser Header controls */}
          <div className="bg-gray-950 px-3 py-2 border-b border-gray-850 flex items-center gap-2 select-none shrink-0">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <div className="bg-gray-900 rounded-md text-[9px] text-gray-500 px-3 py-0.5 text-center flex-1 truncate font-mono">
              order-details-{orderId.replace('#', '')}.png
            </div>
          </div>
          {/* Image content */}
          <div className={`overflow-hidden w-full bg-white flex items-center justify-center ${heightClass.replace('max-h-', 'h-')}`}>
            <img src={reviewScreenshot} className="w-full h-full object-contain" alt="Review details screenshot" />
          </div>
          
          {/* Overlay Tips Badge */}
          {renderPremiumTipsBadge("bottom-4 right-4")}
        </div>
      );
    }
    return null;
  };

  // Legacy fallback screenshot renderer
  const renderScreenshotOrFallback = () => {
    return renderScreenshotBrowserFrame("max-h-[300px]");
  };

  return (
    <div className="space-y-6 pb-12 select-none text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">CONGRATULATION STUDIO</h1>
          <p className="text-gray-400 text-sm font-medium">Build team milestone achievement cards. Save or export to Slack/Fiverr feeds.</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-gray-950 border border-glass-border hover:bg-glass-hover text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={handleExport}
            disabled={downloading}
            className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 glow-green"
          >
            {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{downloading ? 'Compiling...' : 'Export PNG'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Input Control Panel (xl:col-span-5) */}
        <div className="xl:col-span-5 space-y-6 max-h-[85vh] overflow-y-auto pr-1">
          
          {/* Style Selector */}
          <div className="p-4 rounded-xl border border-glass-border bg-gray-950/20 space-y-3">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-green-400" />
              <span>Layout Style Theme</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              {LAYOUTS.map((lay) => (
                <button
                  key={lay.value}
                  onClick={() => setStyle(lay.value)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    style === lay.value 
                      ? 'border-green-400 bg-green-500/10 text-green-400' 
                      : 'border-glass-border bg-gray-950/40 hover:bg-glass-hover text-gray-400 hover:text-white'
                  }`}
                >
                  <p className="text-xs font-bold">{lay.label}</p>
                  <p className="text-[9px] opacity-75 truncate">{lay.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Layout Structure Selector */}
          <div className="p-4 rounded-xl border border-glass-border bg-gray-950/20 space-y-3">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-green-400" />
              <span>Full Layout Arrangement</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              {STRUCTURES.map((str) => (
                <button
                  key={str.value}
                  onClick={() => setStructure(str.value)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    structure === str.value 
                      ? 'border-green-400 bg-green-500/10 text-green-400' 
                      : 'border-glass-border bg-gray-950/40 hover:bg-glass-hover text-gray-400 hover:text-white'
                  }`}
                >
                  <p className="text-xs font-bold">{str.label}</p>
                  <p className="text-[9px] opacity-75 truncate">{str.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Configurator Accents & Textures */}
          <div className="p-4 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block border-b border-glass-border pb-1">Visual Settings</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Custom theme color picker */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
                  <Palette className="w-4 h-4 text-green-400" />
                  <span>Theme Accent</span>
                </div>
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-8 h-8 rounded border border-glass-border bg-transparent cursor-pointer p-0.5"
                />
              </div>

              {/* Texture overlays */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
                  <Grid className="w-4 h-4 text-green-400" />
                  <span>Pattern Filter</span>
                </div>
                <select
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value as PatternOverlay)}
                  className="px-2 py-1 text-xs rounded glass-input cursor-pointer"
                >
                  <option value="none">None</option>
                  <option value="dots">Dot Grid</option>
                  <option value="grid">Tech Grid</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-glass-border">
              <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
                <FileText className="w-4 h-4 text-green-400" />
                <span>Fiverr Details Render Mode</span>
              </div>
              <button
                onClick={() => setUseNativeLayout(!useNativeLayout)}
                className="px-3 py-1.5 rounded bg-green-500/10 border border-green-500/25 text-green-400 font-bold text-xs uppercase tracking-wider"
              >
                {useNativeLayout ? 'HTML Native' : 'Image Screenshot'}
              </button>
            </div>
          </div>

          {/* Member Details */}
          <div className="p-4 rounded-xl border border-glass-border bg-gray-950/20 space-y-3">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-green-400" />
              <span>Member Details</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Member Name</label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Role / Team Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Custom Sub-caption Message</label>
                <input
                  type="text"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase text-yellow-400">Tips Amount ($)</label>
                <input
                  type="text"
                  value={tipsAmount}
                  onChange={(e) => setTipsAmount(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-xs font-mono border-yellow-500/30"
                  placeholder="e.g. 150"
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Member Photo</label>
              <div className="flex items-center gap-3">
                {memberPhoto && (
                  <img src={memberPhoto} className="w-10 h-10 rounded-full object-cover border border-glass-border" alt="Profile" />
                )}
                <div className="relative overflow-hidden flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'photo')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <button type="button" className="w-full py-1.5 rounded-lg bg-gray-900 border border-glass-border hover:bg-glass-hover text-white text-xs font-bold flex items-center justify-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>
                </div>
                {memberPhoto && (
                  <button onClick={() => setMemberPhoto('')} className="p-2 rounded bg-red-950/20 text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Fiverr Native Form Parameters */}
          {useNativeLayout ? (
            <div className="p-4 rounded-xl border border-glass-border bg-gray-950/20 space-y-4 text-left">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-green-400" />
                <span>Native Fiverr Parameters</span>
              </span>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Client Review Text</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">Client Username</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">Order Price ($)</label>
                  <input
                    type="text"
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg glass-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">Order Reference ID</label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg glass-input text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">Completion Date</label>
                  <input
                    type="date"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg glass-input text-xs cursor-pointer text-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">Website / Preview URL</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                  />
                </div>
              </div>

              {/* Star ratings sliders */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-glass-border">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase block">Review Rating ({ratingStars}★)</label>
                  <input
                    type="range" min="1" max="5"
                    value={ratingStars}
                    onChange={(e) => setRatingStars(Number(e.target.value))}
                    className="w-full accent-green-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase block">Communication ({commRating}★)</label>
                  <input
                    type="range" min="1" max="5"
                    value={commRating}
                    onChange={(e) => setCommRating(Number(e.target.value))}
                    className="w-full accent-green-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            // Upload screenshot block
            <div className="p-4 rounded-xl border border-glass-border bg-gray-950/20 space-y-3">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-green-400" />
                <span>Upload Screenshot Image</span>
              </span>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Fiverr Review Screenshot</label>
                <div className="flex items-center gap-3">
                  <div className="relative overflow-hidden flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'review')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <button type="button" className="w-full py-1.5 rounded-lg bg-gray-900 border border-glass-border hover:bg-glass-hover text-white text-xs font-bold flex items-center justify-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{reviewScreenshot ? 'Change Screenshot' : 'Upload Review Screenshot'}</span>
                    </button>
                  </div>
                  {reviewScreenshot ? (
                    <button onClick={() => setReviewScreenshot('')} className="p-2 rounded bg-red-950/20 text-red-400 hover:bg-red-500/10" title="Clear Screenshot">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => setReviewScreenshot(DEFAULT_FIVERR_SCREENSHOT)} className="px-3 py-1.5 rounded bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/25 hover:text-white font-bold text-xs uppercase tracking-wider transition-all" title="Load Demo Template">
                      Demo
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Block toggles */}
          <div className="p-4 rounded-xl border border-glass-border bg-gray-950/20 space-y-3">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Enable Special Blocks</span>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(specialBlocks).map((key) => {
                const active = specialBlocks[key as keyof typeof specialBlocks];
                return (
                  <button
                    key={key}
                    onClick={() => setSpecialBlocks({ ...specialBlocks, [key]: !active })}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs font-semibold ${
                      active ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-glass-border text-gray-500'
                    }`}
                  >
                    <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    {active && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* CENTER COLUMN: Real-Time visual Sandbox (xl:col-span-7) */}
        <div className="xl:col-span-7 space-y-4">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block text-left">Canvas Review Sandbox</span>
          
          <div className="overflow-x-auto p-4 border border-glass-border rounded-2xl bg-gray-900/50 flex justify-center">
            
            {/* Output Node canvas rendering target */}
            <div
              ref={cardRef}
              id="congrats-card-canvas"
              className={`w-[800px] min-h-[520px] relative overflow-hidden select-text text-left shrink-0 shadow-2xl flex flex-col justify-between ${
                structure === 'fiverr_split' ? 'p-0' : 'p-6'
              }`}
              style={{
                background: style === 'green-award' 
                  ? 'linear-gradient(135deg, #052e16 0%, #15803d 100%)' 
                  : style === 'blue-tech' 
                  ? 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #020617 100%)'
                  : style === 'luxury' 
                  ? 'linear-gradient(135deg, #0f0f12 0%, #1c1917 100%)'
                  : style === 'elite' 
                  ? 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)'
                  : style === 'glass' 
                  ? 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(31,41,55,0.95) 100%)'
                  : style === 'soft-gradient' 
                  ? 'linear-gradient(135deg, #2d1b4e 0%, #1e1b4b 50%, #111827 100%)'
                  : style === 'celebration' 
                  ? 'linear-gradient(135deg, #3b0764 0%, #111827 100%)'
                  : 'linear-gradient(135deg, #030712 0%, #111827 100%)',
                border: `3px solid ${style === 'luxury' ? '#eab308' : 'rgba(255, 255, 255, 0.08)'}`,
                boxShadow: `0 0 40px ${themeColor}15`
              }}
            >
              
              {/* Pattern filter graphic overlays */}
              {pattern === 'dots' && (
                <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '16px 16px' }} />
              )}
              {pattern === 'grid' && (
                <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              )}

              {/* Premium background stars overlay */}
              {renderPremiumStars()}

              {/* VERTICAL absolute right logo text ribbon (upright, zero-crop safety strip) */}
              {structure !== 'banner' && structure !== 'fiverr_split' && (
                <div 
                  className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center select-none z-10 border-l border-white/10 bg-black/25 backdrop-blur-[2px]"
                >
                  <span 
                    className="text-[9px] font-black tracking-[0.3em] uppercase font-mono text-center leading-none"
                    style={{ 
                      writingMode: 'vertical-rl',
                      textOrientation: 'upright',
                      color: themeColor,
                      textShadow: `0 0 10px ${themeColor}40`
                    }}
                  >
                    SOFTVENCE OMEGA PRIME
                  </span>
                </div>
              )}

              {/* STRUCTURE RENDERER 1: Classic Banner Structure ('banner') */}
              {structure === 'banner' && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  {/* Top Header Row */}
                  <div className="flex gap-6 items-center">
                    {/* Large Photo Frame */}
                    <div className="relative shrink-0 select-none">
                      <div 
                        className="w-36 h-36 rounded-2xl overflow-hidden bg-gray-800 flex items-center justify-center border-4"
                        style={{ borderColor: themeColor }}
                      >
                        {memberPhoto ? (
                           <img src={memberPhoto} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                          <Trophy className="w-14 h-14 text-gray-600" />
                        )}
                      </div>
                      {specialBlocks.keepAchieving && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/75 py-1 px-2 rounded-b-2xl text-[9px] text-center text-white font-bold uppercase tracking-wide">
                          {customMessage}
                        </div>
                      )}
                    </div>

                    {/* Member Details */}
                    <div className="flex-1 space-y-1.5 pr-32">
                      {specialBlocks.congratulations && (
                        <span 
                          className="text-2xl font-black tracking-widest font-mono uppercase bg-clip-text text-transparent block"
                          style={{ backgroundImage: `linear-gradient(to right, ${themeColor}, #ffffff)` }}
                        >
                          CONGRATULATIONS
                        </span>
                      )}
                      <h1 className="text-3xl font-extrabold text-white tracking-wide uppercase leading-none">{memberName}</h1>
                      <p className="text-sm font-semibold text-gray-300">
                        <span>{role}</span>
                      </p>
                    </div>
                  </div>

                  {/* Lower Row: Fiverr review snapshot or HTML native layout */}
                  <div className="flex-1 flex flex-col justify-end mt-4 pr-14">
                    {useNativeLayout ? renderFiverrNative() : (
                      <div className="w-full flex justify-center">
                        {renderScreenshotOrFallback()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STRUCTURE RENDERER 1B: Fiverr Split Congrats Structure ('fiverr_split') */}
              {structure === 'fiverr_split' && (
                <div className="flex-1 flex flex-col justify-between h-full w-full">
                  {/* Upper Banner (Green panel) */}
                  <div className="flex gap-6 items-center p-6 pr-20 relative h-[210px] shrink-0">
                    {/* Large Photo Frame */}
                    <div className="relative shrink-0 select-none">
                      <div 
                        className="w-[140px] h-[140px] rounded-3xl overflow-hidden bg-gray-800 flex items-center justify-center border-4 relative animate-none"
                        style={{ borderColor: '#a3e635' }}
                      >
                        {memberPhoto ? (
                           <img src={memberPhoto} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                          <Trophy className="w-14 h-14 text-gray-600" />
                        )}
                        {specialBlocks.keepAchieving && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent pt-4 pb-2.5 px-2 text-[9.5px] text-center text-white font-extrabold leading-normal font-sans tracking-wide">
                            {customMessage}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Member Details */}
                    <div className="flex-1 text-left space-y-1">
                      {specialBlocks.congratulations && (
                        <span className="font-serif italic font-extrabold text-3xl text-[#facc15] capitalize block tracking-wide select-none">
                          Congratulations!
                        </span>
                      )}
                      <h1 className="text-3xl font-extrabold text-white tracking-wider uppercase leading-none mt-1 select-text">
                        {memberName}
                      </h1>
                      <p className="text-xs font-semibold text-gray-250 mt-1 select-text">
                        {role}
                      </p>
                    </div>

                    {/* Vertical logo ribbon */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center select-none z-10 w-8">
                      <div 
                        className="flex flex-col items-center font-sans"
                        style={{
                          writingMode: 'vertical-lr',
                          transform: 'rotate(180deg)',
                        }}
                      >
                        <span className="text-[17px] font-black text-white uppercase tracking-widest leading-none">
                          sof<span className="text-green-400 font-extrabold">t</span>vence
                        </span>
                        <span className="text-[8.5px] text-gray-400 uppercase tracking-widest mt-1.5 block font-semibold">
                          Omega
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lower Row: Fiverr review white box layout */}
                  <div className="bg-white flex-1 flex flex-col text-black border-t border-gray-100 overflow-hidden rounded-b-[20px]">
                    {/* Review Content */}
                    <div className="flex-1 flex items-center justify-center p-0 overflow-hidden bg-white min-h-[250px] relative">
                      {useNativeLayout ? (
                        <div className="p-4 w-full h-full overflow-y-auto">
                          {renderFiverrNative()}
                        </div>
                      ) : reviewScreenshot ? (
                        <>
                          <img src={reviewScreenshot} className="w-full h-full object-contain" alt="Fiverr Review" />
                          {/* Overlay Tips Badge for fiverr_split */}
                          {renderPremiumTipsBadge("bottom-6 right-6")}
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {/* STRUCTURE RENDERER 2: Split Dashboard Structure ('split') */}
              {structure === 'split' && (
                <div className="flex gap-4 flex-1">
                  
                  {/* Left Solid Panel */}
                  <div 
                    className="w-[230px] shrink-0 rounded-xl p-4 flex flex-col justify-between items-center text-center space-y-4 border"
                    style={{ background: 'rgba(3, 7, 18, 0.4)', borderColor: `${themeColor}20` }}
                  >
                    <div className="w-full flex justify-between items-center shrink-0 border-b border-white/5 pb-2">
                      <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest font-mono">Milestone Status</span>
                    </div>

                    <div className="space-y-3">
                      <div 
                        className="w-28 h-28 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center border-4 mx-auto shadow-md"
                        style={{ borderColor: themeColor }}
                      >
                        {memberPhoto ? (
                          <img src={memberPhoto} className="w-full h-full object-cover" />
                        ) : (
                          <Trophy className="w-10 h-10 text-gray-600" />
                        )}
                      </div>

                      <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-wide leading-tight truncate">{memberName}</h2>
                        <p className="text-[9px] text-gray-400 mt-0.5 leading-none">{role}</p>
                      </div>
                    </div>

                    {specialBlocks.keepAchieving && (
                      <p className="text-[9px] text-gray-400 italic bg-white/5 p-2 rounded-lg border border-white/5 w-full leading-relaxed">
                        "{customMessage}"
                      </p>
                    )}
                  </div>

                  {/* Right Panel: Details Dashboard */}
                  <div className="flex-1 flex flex-col justify-between space-y-3 pr-32">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1 shrink-0">
                      <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                        <Sparkle className="w-4 h-4 text-yellow-400" />
                        <span>Performance Milestone Award</span>
                      </span>
                    </div>

                    {/* Horizontal stats summary row to fill empty space and look professional */}
                    <div className="grid grid-cols-4 gap-2 bg-white/[0.02] border border-white/5 p-2.5 rounded-lg shrink-0 text-left">
                      <div>
                        <span className="text-[8px] text-gray-500 uppercase block font-bold font-mono">Milestone Value</span>
                        <span className="text-white text-xs font-black">${orderPrice} USD</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-550 uppercase block font-bold font-mono">Fiverr Rating</span>
                        <span className="text-yellow-400 text-xs font-bold flex items-center gap-0.5">5.0 ★</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-550 uppercase block font-bold font-mono">Delivery Date</span>
                        <span className="text-white text-xs font-bold truncate block">{formatDate(completionDate)}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-550 uppercase block font-bold font-mono">Order Ref ID</span>
                        <span className="text-white text-xs font-mono truncate block">{orderId}</span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      {useNativeLayout ? renderFiverrNative() : (
                        <div className="w-full flex justify-center">
                          {renderScreenshotBrowserFrame("max-h-[280px]")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STRUCTURE RENDERER 3: Spotlight Horizontal Banner ('spotlight') */}
              {structure === 'spotlight' && (
                <div className="flex-1 flex flex-col justify-between space-y-4 pr-14">
                  {/* Top logo header */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 shrink-0 text-white">
                    <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider font-mono">Spotlight Strip</span>
                  </div>

                  {/* Single horizontal grid split */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 items-center">
                    
                    {/* Col 1: Profile Spotlight (3 cols) */}
                    <div className="md:col-span-3 text-center space-y-3 flex flex-col items-center justify-center">
                      <div 
                        className="w-28 h-28 rounded-2xl overflow-hidden bg-gray-800 flex items-center justify-center border-4 shadow-lg"
                        style={{ borderColor: themeColor }}
                      >
                        {memberPhoto ? (
                          <img src={memberPhoto} className="w-full h-full object-cover" />
                        ) : (
                          <Trophy className="w-10 h-10 text-gray-650" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-xs font-black text-white uppercase leading-tight truncate">{memberName}</h2>
                        <span className="text-[9px] text-gray-500 leading-none">{role}</span>
                      </div>
                    </div>

                    {/* Col 2: Review Quote Block or Screenshot (6 cols) */}
                    <div className="md:col-span-6 p-4 rounded-xl bg-white border border-gray-200 text-black space-y-3 shadow-sm h-full flex flex-col justify-between overflow-hidden">
                      {useNativeLayout ? (
                        <>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[8px] text-gray-400 font-bold uppercase border-b border-gray-50 pb-1.5">
                              <span>Feedback Quote</span>
                              <span>{clientName}</span>
                            </div>
                            <p className="text-[11px] text-gray-750 italic font-medium leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100 line-clamp-3">
                              "{reviewText}"
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 border-t border-gray-100 pt-2 shrink-0">
                            <div className="flex gap-0.5">{renderStars(ratingStars)}</div>
                            <span className="font-bold text-gray-800 text-[10px]">{ratingStars} ratings score</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {renderScreenshotBrowserFrame("max-h-[190px]")}
                        </div>
                      )}
                    </div>

                    {/* Col 3: Order Stats Sidecard (3 cols) */}
                    <div className="md:col-span-3 p-4 rounded-xl bg-gray-950 border border-white/5 space-y-3 shadow-sm h-full flex flex-col justify-between">
                      <div className="space-y-2 text-left">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block border-b border-white/5 pb-1 font-mono">Stats</span>
                        <div>
                          <span className="text-gray-500 text-[8px] block uppercase">Price</span>
                          <span className="text-white font-bold text-sm">${orderPrice} USD</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[8px] block uppercase font-bold">Domain</span>
                          <span className="text-blue-400 font-semibold text-[10px] truncate block">{website}</span>
                        </div>
                      </div>

                      <div className="text-[8px] font-bold space-y-1 pt-1 border-t border-white/5">
                        <div className="flex items-center gap-1 text-green-400">
                          <Check className="w-2.5 h-2.5" />
                          <span>Order approved</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* STRUCTURE RENDERER 4: Centered Award Certificate ('certificate') */}
              {structure === 'certificate' && (
                <div className="flex-1 flex flex-col justify-between items-center text-center space-y-6 pr-14">
                  {/* Decorative Frame */}
                  <div className="absolute inset-4 border border-dashed border-white/10 pointer-events-none rounded-lg" />
                  
                  {/* Top Avatar centered */}
                  <div className="space-y-3 flex flex-col items-center">
                    <div 
                      className="w-28 h-28 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center border-4 shadow-xl shadow-black/40"
                      style={{ borderColor: themeColor }}
                    >
                      {memberPhoto ? (
                        <img src={memberPhoto} className="w-full h-full object-cover" />
                      ) : (
                        <Trophy className="w-10 h-10 text-gray-650" />
                      )}
                    </div>
                  </div>

                  {/* Title & Name */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-widest uppercase text-yellow-400 block font-mono">Certificate of Shopify Delivery Excellence</span>
                    <h2 className="text-2xl font-black text-white uppercase tracking-wide">{memberName}</h2>
                    <p className="text-xs text-gray-300">{role}</p>
                  </div>

                  {/* Center Client review Quote or Screenshot */}
                  <div className="max-w-[550px] w-full p-3.5 rounded-xl bg-white/5 border border-white/15 backdrop-blur-md relative overflow-hidden flex justify-center">
                    {useNativeLayout ? (
                      <div>
                        <p className="text-xs text-gray-200 italic leading-relaxed">
                          "{reviewText}"
                        </p>
                        <div className="flex justify-center gap-0.5 mt-2">
                          {renderStars(ratingStars)}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full max-h-[190px] overflow-hidden flex items-center justify-center">
                        {renderScreenshotBrowserFrame("max-h-[160px]")}
                      </div>
                    )}
                  </div>

                  {/* Bottom details signature block */}
                  <div className="w-full grid grid-cols-2 gap-12 text-xs font-semibold px-12 pt-4 shrink-0">
                    <div className="border-t border-white/10 pt-2 text-left">
                      <span className="text-gray-500 text-[9px] block uppercase font-bold tracking-wide">Completion date</span>
                      <span className="text-white text-xs font-bold block mt-0.5">{formatDate(completionDate)}</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 text-right">
                      <span className="text-gray-500 text-[9px] block uppercase font-bold tracking-wide">Order reference ID</span>
                      <span className="text-white text-xs font-bold block mt-0.5 font-mono">{orderId}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STRUCTURE RENDERER 5: Side-by-Side balanced layout ('sidebyside') */}
              {structure === 'sidebyside' && (
                <div className="flex gap-5 flex-1 pr-24 items-stretch">
                  
                  {/* Left Side: Developer Profile Card (45% width) */}
                  <div 
                    className="w-[320px] rounded-xl p-5 border flex flex-col justify-between items-center text-center space-y-4"
                    style={{ background: 'rgba(3, 7, 18, 0.45)', borderColor: `${themeColor}20` }}
                  >
                    <div className="space-y-4 w-full flex flex-col items-center">
                      {/* Large Profile photo */}
                      <div 
                        className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-800 flex items-center justify-center border-4 mx-auto shadow-lg"
                        style={{ borderColor: themeColor }}
                      >
                        {memberPhoto ? (
                          <img src={memberPhoto} className="w-full h-full object-cover" />
                        ) : (
                          <Trophy className="w-12 h-12 text-gray-650" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-lg font-black text-white uppercase tracking-wide leading-tight">{memberName}</h2>
                        <p className="text-xs text-gray-400 font-semibold">{role}</p>
                      </div>

                      {/* Mini stats details table for space-fill */}
                      <div className="w-full grid grid-cols-2 gap-2 text-left bg-black/30 border border-white/5 p-2 rounded-lg text-[9px] mt-1 shrink-0">
                        <div>
                          <span className="text-gray-500 block uppercase font-bold">Completed</span>
                          <span className="text-white font-bold font-mono">100% On-time</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block uppercase font-bold">Milestone</span>
                          <span className="text-emerald-400 font-bold font-mono">${orderPrice} USD</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block uppercase font-bold">Stack</span>
                          <span className="text-white font-bold font-mono">Shopify Liquid</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block uppercase font-bold">Client Rating</span>
                          <span className="text-yellow-400 font-bold font-mono">5.0 ★</span>
                        </div>
                      </div>
                    </div>

                    {specialBlocks.keepAchieving && (
                      <div className="w-full pt-3 border-t border-white/5">
                        <p className="text-[10px] text-gray-400 italic leading-relaxed">
                          "{customMessage}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Screenshot / Native Card (55% width) */}
                  <div className="flex-1 flex flex-col justify-center">
                    {useNativeLayout ? renderFiverrNative() : (
                      <div className="w-full flex justify-center">
                        {renderScreenshotBrowserFrame("max-h-[280px]")}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* STRUCTURE RENDERER 6: Premium Tech Showcase layout ('showcase') */}
              {structure === 'showcase' && (
                <div className="flex gap-6 flex-1 pr-24 items-center">
                  
                  {/* Left Side Profile Column (30%) */}
                  <div className="w-[200px] shrink-0 text-center space-y-4 flex flex-col items-center">
                    <div 
                      className="w-32 h-32 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center border-4 shadow-xl"
                      style={{ 
                        borderColor: themeColor,
                        boxShadow: `0 0 25px ${themeColor}30`
                      }}
                    >
                      {memberPhoto ? (
                        <img src={memberPhoto} className="w-full h-full object-cover" />
                      ) : (
                        <Trophy className="w-12 h-12 text-gray-650" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wide leading-tight truncate">{memberName}</h3>
                      <p className="text-[9px] text-gray-400 font-bold tracking-wider uppercase mt-1">{role}</p>
                    </div>
                  </div>

                  {/* Right Side Card Column (70%) */}
                  <div className="flex-1 flex flex-col justify-center space-y-3">
                    {/* Header metrics card inside showcase layout to fill gap */}
                    <div className="flex items-center justify-between bg-black/40 border border-white/5 p-2 rounded-lg text-[10px] px-3 shrink-0">
                      <span className="text-white font-bold">Project Ref: <span className="font-mono text-gray-450">{orderId}</span></span>
                      <span className="text-yellow-400 font-bold">★ 5.0 Rating</span>
                      <span className="text-emerald-400 font-bold">${orderPrice} USD Budget</span>
                    </div>
                    {useNativeLayout ? renderFiverrNative() : (
                      <div className="w-full flex justify-center">
                        {renderScreenshotBrowserFrame("max-h-[280px]")}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* STRUCTURE RENDERER 7: Premium Bento Grid Layout ('bento') */}
              {structure === 'bento' && (
                <div className="grid grid-cols-12 gap-3.5 flex-1 items-stretch text-left pr-24">
                  {/* Box 1 (Top Left): Profile Box (col-span-8, row-span-1) */}
                  <div 
                    className="col-span-8 rounded-xl p-4 flex gap-4 items-center border"
                    style={{ background: 'rgba(3, 7, 18, 0.45)', borderColor: `${themeColor}20` }}
                  >
                    <div 
                      className="w-20 h-20 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center border-2 shrink-0 shadow-md"
                      style={{ borderColor: themeColor }}
                    >
                      {memberPhoto ? (
                        <img src={memberPhoto} className="w-full h-full object-cover" />
                      ) : (
                        <Trophy className="w-8 h-8 text-gray-650" />
                      )}
                    </div>
                    <div className="space-y-1.5 overflow-hidden">
                      <span className="inline-block px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[8px] font-black uppercase tracking-wider font-mono">
                        Developer Spotlight
                      </span>
                      <h2 className="text-xl font-black text-white uppercase tracking-wide leading-none truncate">{memberName}</h2>
                      <p className="text-[10px] text-gray-300 font-semibold truncate">{role}</p>
                    </div>
                  </div>

                  {/* Box 2 (Top Right): Order Price / Completion Box (col-span-4, row-span-1) */}
                  <div 
                    className="col-span-4 rounded-xl p-4 flex flex-col justify-between border"
                    style={{ background: 'rgba(3, 7, 18, 0.45)', borderColor: `${themeColor}20` }}
                  >
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider block border-b border-white/5 pb-1 font-mono">Milestone Value</span>
                    <div className="my-auto text-left">
                      <span className="text-2xl font-black text-white block mt-1">${orderPrice} USD</span>
                      <span className="text-[9px] text-gray-400 font-semibold">{formatDate(completionDate)}</span>
                    </div>
                  </div>

                  {/* Box 3 (Bottom Left): Client review or image (col-span-7, row-span-1) */}
                  <div 
                    className="col-span-7 rounded-xl p-4 flex flex-col justify-between border"
                    style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: `${themeColor}15` }}
                  >
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider block border-b border-white/5 pb-1 font-mono">Client Testimony</span>
                    
                    <div className="flex-1 flex flex-col justify-center my-2 overflow-hidden">
                      {useNativeLayout ? (
                        <div className="space-y-2 text-left">
                          <p className="text-[11px] text-gray-200 italic font-medium leading-relaxed">
                            "{reviewText}"
                          </p>
                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/5">
                            <div className="flex gap-0.5">{renderStars(ratingStars)}</div>
                            <span className="font-bold text-yellow-400 text-[10px]">{ratingStars}.0</span>
                            <span className="text-[9px] text-gray-400">by @{clientName}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full">
                          {renderScreenshotBrowserFrame("max-h-[120px]")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Box 4 (Bottom Right): Achievements & Custom Message (col-span-5, row-span-1) */}
                  <div 
                    className="col-span-5 rounded-xl p-4 flex flex-col justify-between border text-left"
                    style={{ background: 'rgba(3, 7, 18, 0.45)', borderColor: `${themeColor}20` }}
                  >
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider block border-b border-white/5 pb-1 font-mono">Performance Details</span>
                    <div className="space-y-2 my-auto">
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Preview URL</span>
                        <span className="text-blue-400 font-semibold text-[10px] truncate block">{website}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Order ID</span>
                        <span className="text-white font-mono text-[10px] truncate block">{orderId}</span>
                      </div>
                    </div>
                    {specialBlocks.keepAchieving && (
                      <p className="text-[9px] text-gray-400 border-t border-white/5 pt-1.5 italic truncate">
                        "{customMessage}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* STRUCTURE RENDERER 8: Dual Glassmorphic Screen ('dual_screen') */}
              {structure === 'dual_screen' && (
                <div className="flex gap-4 flex-1 pr-24 items-stretch h-full">
                  {/* Left Column: Premium Profile Card */}
                  <div 
                    className="w-[300px] shrink-0 rounded-xl p-5 border flex flex-col justify-between items-center text-center space-y-4"
                    style={{ background: 'rgba(3, 7, 18, 0.45)', borderColor: `${themeColor}20` }}
                  >
                    {/* Top Accent */}
                    <div className="w-full flex justify-between items-center border-b border-white/5 pb-2 shrink-0">
                      <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest font-mono">Active Developer</span>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Verified</span>
                      </div>
                    </div>

                    <div className="space-y-4 my-auto">
                      {/* Member Photo */}
                      <div 
                        className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center border-4 mx-auto shadow-xl"
                        style={{ borderColor: themeColor }}
                      >
                        {memberPhoto ? (
                          <img src={memberPhoto} className="w-full h-full object-cover" />
                        ) : (
                          <Trophy className="w-10 h-10 text-gray-600" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-lg font-black text-white uppercase tracking-wide leading-tight">{memberName}</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{role}</p>
                      </div>
                    </div>

                    {specialBlocks.keepAchieving ? (
                      <p className="text-[9px] text-gray-400 italic bg-white/5 p-2 rounded-lg border border-white/5 w-full leading-relaxed shrink-0">
                        "{customMessage}"
                      </p>
                    ) : (
                      <div className="h-4" />
                    )}
                  </div>

                  {/* Right Column: Sleek Browser Mockup for review / screenshot */}
                  <div 
                    className="flex-1 rounded-xl p-4 border flex flex-col justify-between"
                    style={{ background: 'rgba(3, 7, 18, 0.25)', borderColor: `${themeColor}10` }}
                  >
                    <div className="w-full flex justify-between items-center border-b border-white/5 pb-2 shrink-0">
                      <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest font-mono">Deliverable Details</span>
                      <span className="text-[8px] font-mono text-gray-400 font-bold">Valued at ${orderPrice}</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center my-3 overflow-hidden">
                      {useNativeLayout ? renderFiverrNative() : (
                        <div className="w-full">
                          {renderScreenshotBrowserFrame("max-h-[200px]")}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[9px] font-bold text-gray-400 shrink-0">
                      <span>Order Reference: {orderId}</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500/20 text-emerald-400" />
                        <span>Completed & Approved</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STRUCTURE RENDERER 9: Luxury Platinum Award ('premium_award') */}
              {structure === 'premium_award' && (
                <div className="flex-1 flex flex-col justify-between items-center text-center space-y-4 relative py-2 pr-14">
                  {/* Decorative Frame */}
                  <div 
                    className="absolute inset-2 border-2 rounded-xl pointer-events-none" 
                    style={{ borderColor: `${themeColor}25`, boxShadow: `inset 0 0 15px ${themeColor}10` }}
                  />
                  
                  {/* Certificate Top Section */}
                  <div className="space-y-1">
                    <span 
                      className="text-[9px] font-black tracking-widest uppercase block font-mono"
                      style={{ color: themeColor }}
                    >
                      PRESTIGE SHOPIFY DEVELOPMENT MILESTONE
                    </span>
                    <div className="w-12 h-0.5 bg-yellow-500 mx-auto mt-1" style={{ backgroundColor: themeColor }} />
                  </div>

                  {/* Main Row Content */}
                  <div className="grid grid-cols-12 gap-6 items-center flex-1 w-full px-6 z-10">
                    {/* Left side: Photo with prestige border */}
                    <div className="col-span-4 flex flex-col items-center space-y-2">
                      <div className="relative">
                        <div 
                          className="w-28 h-28 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center border-4 shadow-xl"
                          style={{ borderColor: themeColor, boxShadow: `0 0 20px ${themeColor}40` }}
                        >
                          {memberPhoto ? (
                            <img src={memberPhoto} className="w-full h-full object-cover" />
                          ) : (
                            <Trophy className="w-10 h-10 text-gray-650" />
                          )}
                        </div>
                        {/* Floating Seal badge */}
                        <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black p-1.5 rounded-full shadow-lg border border-black font-extrabold flex items-center justify-center glow-yellow">
                          <Award className="w-4.5 h-4.5" />
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">{memberName}</h3>
                        <p className="text-[9px] text-gray-400 font-semibold tracking-wide">{role}</p>
                      </div>
                    </div>

                    {/* Right side: Client review block or screenshot */}
                    <div className="col-span-8 h-full flex flex-col justify-center">
                      {useNativeLayout ? (
                        <div className="p-4 rounded-xl bg-white border border-gray-200 text-black space-y-3 shadow-md text-left flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 text-[9px] text-gray-400 font-bold uppercase">
                              <span>Client Testimony</span>
                              <span>@{clientName}</span>
                            </div>
                            <p className="text-[11px] text-gray-770 italic font-medium leading-relaxed bg-gray-50 p-2 py-1.5 rounded border border-gray-100 line-clamp-3">
                              "{reviewText}"
                            </p>
                          </div>
                          <div className="flex items-center justify-between border-t border-gray-100 pt-2 shrink-0">
                            <div className="flex gap-0.5">{renderStars(ratingStars)}</div>
                            <span className="font-extrabold text-[10px] text-emerald-600">${orderPrice} USD Verified Order</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full">
                          {renderScreenshotBrowserFrame("max-h-[190px]")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom details signature block */}
                  <div className="w-full grid grid-cols-3 gap-2 text-xs font-semibold px-8 pt-2 pb-1 shrink-0 border-t border-white/5 z-10">
                    <div className="text-left">
                      <span className="text-gray-500 text-[8px] block uppercase font-bold tracking-wide">Completion Date</span>
                      <span className="text-white text-[10px] font-bold block mt-0.5">{formatDate(completionDate)}</span>
                    </div>
                    <div className="text-center flex flex-col items-center justify-center">
                      {specialBlocks.keepAchieving && (
                        <span className="text-[9px] text-gray-400 italic font-medium leading-tight">
                          "{customMessage}"
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 text-[8px] block uppercase font-bold tracking-wide">Project Domain</span>
                      <span className="text-blue-400 text-[10px] font-bold block mt-0.5 truncate">{website}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
