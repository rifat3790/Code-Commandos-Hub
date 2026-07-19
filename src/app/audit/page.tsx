'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gauge, 
  Search, 
  Sparkles, 
  Check, 
  Copy, 
  FileText, 
  ShieldCheck, 
  Flame, 
  Activity, 
  LineChart, 
  TrendingUp, 
  RefreshCw, 
  Zap, 
  Tag, 
  CheckCircle2, 
  Edit,
  Code,
  Globe,
  Loader2,
  Download,
  Terminal,
  Play,
  AlertCircle,
  FolderSync,
  Upload,
  AlertTriangle,
  Eye,
  ShieldAlert,
  Award,
  FileCode,
  FileSearch,
  CheckCircle,
  XCircle,
  Database,
  Grid
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuth } from '@/context/AuthContext';

interface AuditItem {
  id: string;
  name: string;
  weight: number; // impact on speed score
  category: 'assets' | 'apps' | 'dom' | 'scripts';
  description: string;
}

const AUDIT_CHECKLIST: AuditItem[] = [
  { id: 'app-purge', name: 'Uninstall Unused Shopify Apps & Leftover Scripts', weight: 20, category: 'apps', description: 'Removes unused theme app extensions and trailing JavaScript payloads.' },
  { id: 'img-scaling', name: 'Resize & Compress Banner & Hero Images (WebP)', weight: 15, category: 'assets', description: 'Converts JPG/PNG uploads to WebP/AVIF format with width/height attributes.' },
  { id: 'lazy-loading', name: 'Implement Native Lazy-Loading on Media Elements', weight: 12, category: 'assets', description: 'Adds loading="lazy" attributes to off-screen collection grid images.' },
  { id: 'js-defer', name: 'Defer Non-Critical JavaScript & Third-Party SDKs', weight: 15, category: 'scripts', description: 'Ensures chat widgets, analytics trackers, and review widgets load asynchronously.' },
  { id: 'font-preload', name: 'Preconnect Font Assets & Preload Hero Images', weight: 8, category: 'assets', description: 'Tells the browser to prioritize typography and hero banner assets early.' },
  { id: 'css-minify', name: 'Minify CSS Files & Remove Redundant Theme Styles', weight: 10, category: 'scripts', description: 'Combines and compresses styling stylesheets into smaller assets.' },
  { id: 'dom-reduce', name: 'Flatten DOM Structure & Simplify Section Containers', weight: 10, category: 'dom', description: 'Reduces heavy nested div containers created by page builder tools.' },
  { id: 'preload-routes', name: 'Add Instant Page Preloading Scripts', weight: 10, category: 'scripts', description: 'Speeds up hover transition links by pre-fetching document assets.' }
];

export default function AuditSuitePage() {
  const store = useWorkspaceStore();
  const { dbUser } = useAuth();
  
  // Shared URL input across tabs
  const [targetUrl, setTargetUrl] = useState('fitestore-2.myshopify.com');
  const [activeTab, setActiveTab] = useState<'inspect' | 'speed' | 'seo' | 'transfer'>('inspect');

  // Migration Tab State
  const [migrationSourceUrl, setMigrationSourceUrl] = useState('');
  const [fetchedWpProducts, setFetchedWpProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Record<string, boolean>>({});
  const [isFetchingWp, setIsFetchingWp] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationLogs, setMigrationLogs] = useState<string[]>([]);
  const [downloadedCSV, setDownloadedCSV] = useState(false);

  const handleDownloadShopifyCSV = () => {
    const selectedList = fetchedWpProducts.filter(p => selectedProductIds[p.id]);
    if (selectedList.length === 0) {
      alert('Please select at least one product to export.');
      return;
    }

    const headers = [
      'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published',
      'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value', 'Option3 Name', 'Option3 Value',
      'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty', 'Variant Inventory Policy',
      'Variant Fulfillment Service', 'Variant Price', 'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable',
      'Variant Barcode', 'Image Src', 'Image Position', 'Image Alt Text', 'Gift Card', 'SEO Title', 'SEO Description',
      'Google Shopping / Google Product Category', 'Google Shopping / Gender', 'Google Shopping / Age Group', 'Google Shopping / MPN',
      'Google Shopping / AdWords Grouping', 'Google Shopping / AdWords Labels', 'Google Shopping / Condition', 'Google Shopping / Custom Product',
      'Google Shopping / Custom Label 0', 'Google Shopping / Custom Label 1', 'Google Shopping / Custom Label 2', 'Google Shopping / Custom Label 3',
      'Google Shopping / Custom Label 4', 'Variant Image', 'Variant Weight Unit', 'Variant Tax Code', 'Cost per item', 'Status', 'Collection'
    ];

    const escapeCSVCell = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvRows: string[] = [];
    csvRows.push(headers.join(','));

    selectedList.forEach(p => {
      // Create clean handle
      const handle = p.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const variants = p.variants || [];
      const images = p.images || [];
      const maxRows = Math.max(variants.length, images.length, 1);

      const option1Name = p.options?.[0]?.name || (variants.length > 1 ? 'Title' : '');
      const option2Name = p.options?.[1]?.name || '';
      const option3Name = p.options?.[2]?.name || '';

      const collectionName = p.categories && p.categories.length > 0
        ? p.categories.join(', ')
        : (p.product_type || 'General');

      for (let i = 0; i < maxRows; i++) {
        const rowData: Record<string, string> = {};

        // Group rows under same handle
        rowData['Handle'] = handle;

        if (i === 0) {
          rowData['Title'] = p.title;
          rowData['Body (HTML)'] = p.body_html || '';
          rowData['Vendor'] = p.vendor || 'WooCommerce Import';
          rowData['Type'] = p.product_type || 'General';
          rowData['Tags'] = p.tags || '';
          rowData['Published'] = 'TRUE';
          rowData['Status'] = 'active';
          rowData['Gift Card'] = 'FALSE';
          rowData['Option1 Name'] = option1Name;
          rowData['Option2 Name'] = option2Name;
          rowData['Option3 Name'] = option3Name;
          rowData['Collection'] = collectionName;
        }

        if (i < variants.length) {
          const v = variants[i];
          rowData['Option1 Value'] = v.option1 || (variants.length > 1 ? v.title : 'Default Title');
          rowData['Option2 Value'] = v.option2 || '';
          rowData['Option3 Value'] = v.option3 || '';
          rowData['Variant SKU'] = v.sku || '';
          rowData['Variant Price'] = v.price || '0.00';
          rowData['Variant Compare At Price'] = v.compare_at_price || '';
          rowData['Variant Grams'] = '0';
          rowData['Variant Inventory Tracker'] = 'shopify';
          rowData['Variant Inventory Qty'] = '100';
          rowData['Variant Inventory Policy'] = 'deny';
          rowData['Variant Fulfillment Service'] = 'manual';
          rowData['Variant Requires Shipping'] = 'TRUE';
          rowData['Variant Taxable'] = 'TRUE';
          rowData['Variant Weight Unit'] = 'g';
        }

        if (i < images.length) {
          rowData['Image Src'] = images[i].src || '';
          rowData['Image Position'] = String(i + 1);
          rowData['Image Alt Text'] = images[i].alt || p.title;
        }

        const row = headers.map(h => escapeCSVCell(rowData[h] || ''));
        csvRows.push(row.join(','));
      }
    });

    // Create a blob and download it
    const csvContent = "\ufeff" + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `shopify_import_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadedCSV(true);
    setTimeout(() => setDownloadedCSV(false), 2000);
    addMigrationLog(`Successfully compiled and downloaded Shopify CSV with ${selectedList.length} products!`, 'success');
  };

  const addMigrationLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'success' ? '✔ [SUCCESS]' : type === 'error' ? '✖ [ERROR]' : 'ℹ [INFO]';
    setMigrationLogs(prev => [...prev, `[${timestamp}] ${prefix} ${message}`]);
  };

  const handleFetchWpProducts = async () => {
    if (!migrationSourceUrl.trim()) {
      alert('Please enter a WooCommerce website URL.');
      return;
    }
    setIsFetchingWp(true);
    setFetchedWpProducts([]);
    setSelectedProductIds({});
    
    const timestamp = new Date().toLocaleTimeString();
    setMigrationLogs([`[${timestamp}] ℹ [INFO] Connecting to WooCommerce Store: ${migrationSourceUrl}`]);
    
    try {
      addMigrationLog('Querying store API for products catalog...');
      const cleanUrl = migrationSourceUrl.trim();
      const res = await fetch(`/api/analyze-site/products?domain=${encodeURIComponent(cleanUrl)}&page=1&limit=100&platform=WooCommerce`);
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch catalog.');
      }
      
      const products = data.products || [];
      setFetchedWpProducts(products);
      
      // Auto select all products
      const initialSelected: Record<string, boolean> = {};
      products.forEach((p: any) => {
        initialSelected[p.id] = true;
      });
      setSelectedProductIds(initialSelected);
      
      addMigrationLog(`Success! Discovered ${products.length} products with variation models. Ready for direct Shopify transfer.`, 'success');
    } catch (err: any) {
      addMigrationLog(`Failed: ${err.message}`, 'error');
    } finally {
      setIsFetchingWp(false);
    }
  };


  
  // Global Layout Styling Hook
  const activeLayout = store.settings?.globalLayout || 'default';
  
  // Speed Audit checklist state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    'app-purge': true,
    'img-scaling': true,
    'lazy-loading': false,
    'js-defer': false,
    'font-preload': false,
    'css-minify': false,
    'dom-reduce': false,
    'preload-routes': false
  });
  const [copiedReport, setCopiedReport] = useState(false);

  // Inspector & Scanner State
  const [scanStatus, setScanStatus] = useState<'idle' | 'detecting' | 'fetching_products' | 'mapping_collections' | 'completed' | 'error'>('idle');
  const [scanError, setScanError] = useState('');
  const [storePassword, setStorePassword] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [isExportingTheme, setIsExportingTheme] = useState(false);
  const [exportMethod, setExportMethod] = useState<'public' | 'admin' | 'extension'>('public');
  const [adminToken, setAdminToken] = useState('');
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
  const [extensionProgress, setExtensionProgress] = useState<{percent: number, message: string} | null>(null);
  const [detectedImages, setDetectedImages] = useState<string[]>([]);
  const [detectedVideos, setDetectedVideos] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [lighthouseMetrics, setLighthouseMetrics] = useState<{
    score: number;
    fcp: number;
    lcp: number;
    tbt: number;
    cls: number;
    speedIndex: number;
  } | null>(null);
  const [isLoadingLighthouse, setIsLoadingLighthouse] = useState(false);
  const [isZippingImages, setIsZippingImages] = useState(false);
  const [techInfo, setTechInfo] = useState<{ 
    technology: string; 
    isShopify: boolean; 
    domain: string; 
    theme?: {name: string, id: string, role: string, originalName?: string}; 
    apps?: { name: string; link?: string }[]; 
    pixels?: string[]; 
    socials?: string[]; 
    emails?: string[];
    speedMetrics?: {
      pageSizeKb: number;
      scriptCount: number;
      styleCount: number;
      imageCount: number;
      lazyImageCount: number;
      preloadCount: number;
    };
    seoMetrics?: {
      seoTitle: string;
      seoDescription: string;
      h1Count: number;
      h2Count: number;
      ogTitle: string;
      ogDescription: string;
      ogImage: string;
      schemas: string[];
      imagesWithoutAlt: number;
    };
  } | null>(null);
  
  const [collections, setCollections] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 });
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Load store configuration and extension listener
  useEffect(() => {
    store.hydrate();

    const checkExtension = () => {
      const extMeta = document.querySelector('meta[name="shopify-theme-exporter"]');
      if (extMeta && extMeta.getAttribute('content') === 'installed') {
        setIsExtensionInstalled(true);
      }
    };
    checkExtension();

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'EXTENSION_INSTALLED') {
        setIsExtensionInstalled(true);
      }
    };
    window.addEventListener('message', handleMessage);

    const pingInterval = setInterval(() => {
      if (!isExtensionInstalled) {
        checkExtension();
        window.postMessage({ type: 'PING_EXTENSION' }, '*');
      }
    }, 1000);

    const handleStarted = () => {
       if ((window as any).extensionTimeout) {
         clearTimeout((window as any).extensionTimeout);
       }
       addLog('Extension connected. Starting theme export...', 'success');
    };
    const handleProgress = (e: any) => setExtensionProgress({ percent: e.detail.percent, message: e.detail.message });
    const handleComplete = () => {
      setIsExportingTheme(false);
      setExtensionProgress(null);
      addLog('Theme downloaded successfully via Extension!', 'success');
    };
    const handleError = (e: any) => {
      setIsExportingTheme(false);
      setExtensionProgress(null);
      addLog('Extension Export Error: ' + e.detail.message, 'error');
    };

    window.addEventListener('SHOPIFY_EXPORT_STARTED', handleStarted);
    window.addEventListener('SHOPIFY_EXPORT_PROGRESS', handleProgress);
    window.addEventListener('SHOPIFY_EXPORT_COMPLETE', handleComplete);
    window.addEventListener('SHOPIFY_EXPORT_ERROR', handleError);

    return () => {
      clearInterval(pingInterval);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('SHOPIFY_EXPORT_STARTED', handleStarted);
      window.removeEventListener('SHOPIFY_EXPORT_PROGRESS', handleProgress);
      window.removeEventListener('SHOPIFY_EXPORT_COMPLETE', handleComplete);
      window.removeEventListener('SHOPIFY_EXPORT_ERROR', handleError);
    };
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scanLogs]);

  // Layout Theme Mapping Hook
  const auditStyles = useMemo(() => {
    switch(activeLayout) {
      case 'slate': // Layout 2: Clean Slate & Platinum
        return {
          wrapper: "space-y-6 pb-12 font-sans",
          headerTitle: "text-2xl lg:text-3xl font-bold tracking-tight text-white uppercase",
          headerDesc: "text-gray-400 text-sm",
          cardContainer: "p-6 rounded-none border border-gray-800 bg-gray-900 space-y-4",
          badge: "px-2 py-0.5 rounded-none bg-gray-800 text-gray-300 border border-gray-700 text-[10px] font-bold uppercase",
          inputField: "w-full px-3 py-2 bg-gray-950 border border-gray-800 text-white rounded-none text-xs focus:border-gray-600 outline-none",
          btnPrimary: "px-4 py-2 bg-white hover:bg-gray-200 text-black font-bold text-xs uppercase tracking-wider rounded-none transition-colors",
          btnSecondary: "px-4 py-2 bg-gray-950 border border-gray-800 hover:bg-gray-900 text-white font-bold text-xs uppercase tracking-wider rounded-none transition-all",
          tabBtnActive: "px-5 py-3 text-xs uppercase font-bold tracking-wider border-b-2 border-white text-white transition-all",
          tabBtnInactive: "px-5 py-3 text-xs uppercase font-bold tracking-wider border-transparent text-gray-500 hover:text-white transition-all",
          consoleBox: "bg-gray-950 border border-gray-800 p-4 rounded-none text-xs font-mono text-gray-300 h-[280px] overflow-y-auto space-y-1.5",
          gaugeBg: "w-24 h-24 rounded-none border-4 border-dashed border-gray-800 flex flex-col items-center justify-center bg-gray-900",
          accentText: "text-white font-bold",
          borderStyle: "border-gray-800",
          cardHover: "hover:border-gray-600 transition-colors"
        };
      case 'aurora': // Layout 3: Aurora Gradient & Mesh Flow
        return {
          wrapper: "space-y-6 pb-12 font-sans",
          headerTitle: "text-2xl lg:text-3xl font-extrabold tracking-tight text-white",
          headerDesc: "text-indigo-200/80 text-sm",
          cardContainer: "p-6 rounded-2xl border border-indigo-500/10 bg-indigo-950/10 space-y-4 shadow-[0_8px_32px_rgba(99,102,241,0.05)]",
          badge: "px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold uppercase",
          inputField: "w-full px-3 py-2 bg-indigo-950/40 border border-indigo-500/20 text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none",
          btnPrimary: "px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md",
          btnSecondary: "px-4 py-2 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all",
          tabBtnActive: "px-5 py-3 text-xs uppercase font-bold tracking-wider border-b-2 border-indigo-500 text-indigo-300 shadow-[0_4px_20px_-10px_rgba(99,102,241,0.4)] transition-all",
          tabBtnInactive: "px-5 py-3 text-xs uppercase font-bold tracking-wider border-transparent text-gray-500 hover:text-white transition-all",
          consoleBox: "bg-indigo-950/40 border border-indigo-500/15 p-4 rounded-xl text-xs font-mono text-indigo-300 h-[280px] overflow-y-auto space-y-1.5",
          gaugeBg: "w-24 h-24 rounded-full border-4 border-dashed border-indigo-500/30 flex flex-col items-center justify-center bg-indigo-950/50 shadow-inner",
          accentText: "text-indigo-400 font-bold",
          borderStyle: "border-indigo-500/10",
          cardHover: "hover:border-indigo-550/30 transition-all duration-300"
        };
      case 'cyber': // Layout 4: Cyberpunk Matrix Tech
        return {
          wrapper: "space-y-6 pb-12 font-mono",
          headerTitle: "text-2xl lg:text-3xl font-black tracking-tight text-white uppercase",
          headerDesc: "text-emerald-500/80 text-xs",
          cardContainer: "p-6 rounded-none border border-emerald-500/30 bg-black space-y-4 shadow-[0_0_15px_rgba(16,185,129,0.05)]",
          badge: "px-2 py-0.5 rounded-none bg-emerald-950/50 text-emerald-450 border border-emerald-500/30 text-[10px] font-bold uppercase",
          inputField: "w-full px-3 py-2 bg-black border border-emerald-500/40 text-emerald-400 rounded-none text-xs focus:border-emerald-500 outline-none font-mono",
          btnPrimary: "px-4 py-2 bg-black border-2 border-dashed border-emerald-500 text-emerald-400 hover:bg-emerald-950/30 font-bold text-xs uppercase tracking-wider rounded-none transition-colors",
          btnSecondary: "px-4 py-2 bg-black border border-gray-850 hover:border-emerald-500/30 text-gray-400 hover:text-emerald-400 font-bold text-xs uppercase tracking-wider rounded-none transition-all",
          tabBtnActive: "px-5 py-3 text-xs uppercase font-black tracking-wider border-b-2 border-emerald-500 text-emerald-400 transition-all",
          tabBtnInactive: "px-5 py-3 text-xs uppercase font-black tracking-wider border-transparent text-gray-600 hover:text-white transition-all",
          consoleBox: "bg-black border border-emerald-500/20 p-4 rounded-none text-xs font-mono text-emerald-400 h-[280px] overflow-y-auto space-y-1.5",
          gaugeBg: "w-24 h-24 rounded-none border-4 border-dashed border-emerald-500/40 flex flex-col items-center justify-center bg-black",
          accentText: "text-emerald-400 font-bold",
          borderStyle: "border-emerald-500/20",
          cardHover: "hover:border-emerald-500/45 transition-colors duration-200"
        };
      case 'gold': // Layout 5: Royal Gold & Onyx
        return {
          wrapper: "space-y-6 pb-12 font-sans",
          headerTitle: "text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight uppercase",
          headerDesc: "text-amber-250/70 text-sm",
          cardContainer: "p-6 rounded-2xl border border-amber-500/20 bg-[#0d0d0d] space-y-4 shadow-[0_8px_30px_rgba(217,119,6,0.05)]",
          badge: "px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase",
          inputField: "w-full px-3 py-2 bg-black border border-amber-500/20 text-white rounded-xl text-xs focus:border-amber-400 outline-none",
          btnPrimary: "px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md",
          btnSecondary: "px-4 py-2 bg-[#121212] hover:bg-[#1a1a1a] border border-amber-500/20 text-amber-250 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors",
          tabBtnActive: "px-5 py-3 text-xs uppercase font-bold tracking-wider border-b-2 border-amber-500 text-amber-300 transition-all",
          tabBtnInactive: "px-5 py-3 text-xs uppercase font-bold tracking-wider border-transparent text-gray-500 hover:text-white transition-all",
          consoleBox: "bg-black border border-amber-500/15 p-4 rounded-xl text-xs font-mono text-amber-400 h-[280px] overflow-y-auto space-y-1.5",
          gaugeBg: "w-24 h-24 rounded-full border-4 border-dashed border-amber-500/25 flex flex-col items-center justify-center bg-black",
          accentText: "text-amber-400 font-bold",
          borderStyle: "border-amber-500/10",
          cardHover: "hover:border-amber-500/30 transition-colors duration-300"
        };
      default: // Neon Glassmorphic (Default)
        return {
          wrapper: "space-y-6 pb-12 text-left relative z-10",
          headerTitle: "text-2xl lg:text-3xl font-extrabold tracking-tight text-white uppercase flex items-center gap-3",
          headerDesc: "text-gray-400 text-sm font-medium mt-1",
          cardContainer: "p-6 rounded-2xl border border-glass-border bg-gray-955/40 space-y-4 backdrop-blur-md",
          badge: "px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold uppercase",
          inputField: "w-full px-3 py-2 rounded-lg glass-input text-xs focus:ring-2 focus:ring-green-500/50 outline-none",
          btnPrimary: "px-4 py-2 bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all glow-green",
          btnSecondary: "px-4 py-2 bg-gray-950 border border-glass-border hover:bg-glass-hover text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all",
          tabBtnActive: "px-5 py-3 text-xs uppercase font-extrabold tracking-wider border-b-2 border-green-500 text-green-400 shadow-[0_4px_20px_-10px_rgba(34,197,94,0.4)] transition-all",
          tabBtnInactive: "px-5 py-3 text-xs uppercase font-extrabold tracking-wider border-transparent text-gray-500 hover:text-white transition-all",
          consoleBox: "bg-black/75 border border-glass-border p-4 rounded-xl text-xs font-mono text-green-400 h-[280px] overflow-y-auto space-y-1.5",
          gaugeBg: "w-24 h-24 rounded-full border-4 border-dashed border-gray-800 flex flex-col items-center justify-center",
          accentText: "text-green-400 font-bold",
          borderStyle: "border-glass-border",
          cardHover: "hover:border-white/10 transition-colors duration-300"
        };
    }
  }, [activeLayout]);

  // Speed Score Calculation based on scan results and toggled optimizations
  const baseSpeedScore = useMemo(() => {
    if (!techInfo?.speedMetrics) return 38; // Default mockup base score

    const metrics = techInfo.speedMetrics;
    let score = 98;

    // Deduct based on Page Size
    if (metrics.pageSizeKb > 500) score -= 15;
    else if (metrics.pageSizeKb > 250) score -= 8;
    else if (metrics.pageSizeKb > 100) score -= 4;

    // Deduct based on Scripts quantity
    score -= Math.min(25, metrics.scriptCount * 0.6);

    // Deduct based on Styles quantity
    score -= Math.min(15, metrics.styleCount * 0.4);

    // Deduct based on images without lazy load
    const nonLazy = Math.max(0, metrics.imageCount - metrics.lazyImageCount);
    score -= Math.min(20, nonLazy * 1.5);

    // Deduct based on third party apps
    const appCount = techInfo.apps?.length || 0;
    score -= Math.min(20, appCount * 2.5);

    return Math.max(15, Math.round(score));
  }, [techInfo]);

  const activeBaseScore = useMemo(() => {
    if (lighthouseMetrics) return lighthouseMetrics.score;
    return baseSpeedScore;
  }, [lighthouseMetrics, baseSpeedScore]);

  const speedScore = useMemo(() => {
    let score = activeBaseScore;
    AUDIT_CHECKLIST.forEach(item => {
      if (checkedItems[item.id]) {
        // Ticking items adds back performance weight, simulating optimization impact
        score += Math.round(item.weight * 0.7); 
      }
    });
    return Math.min(99, score);
  }, [activeBaseScore, checkedItems]);

  const handleToggleAuditItem = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Compile PageSpeed Client Audit Delivery Report text
  const speedReportText = useMemo(() => {
    const optimized = AUDIT_CHECKLIST.filter(item => checkedItems[item.id]);
    const remaining = AUDIT_CHECKLIST.filter(item => !checkedItems[item.id]);

    return `Shopify Store Speed Audit & Optimization Report
------------------------------------------------------
Target URL: ${targetUrl}
Calculated Speed Score: ${speedScore}/100

Optimizations Successfully Completed:
${optimized.length > 0 ? optimized.map((o, idx) => `${idx + 1}. [Completed] ${o.name}\n   - Impact: ${o.description}`).join('\n') : '- None'}

Pending Speed Recommendations:
${remaining.length > 0 ? remaining.map((r, idx) => `${idx + 1}. [Recommended] ${r.name}\n   - Impact: ${r.description}`).join('\n') : '- None'}

Note: Speed analysis performed dynamically by Code Commandos Site Intelligence. These speed suggestions reduce Total Blocking Time, CLS (Cumulative Layout Shift) and enhance Core Web Vitals on mobile browsers.

Report generated on Code Commandos Speed Audit Suite.`;
  }, [targetUrl, speedScore, checkedItems]);

  const handleCopyReport = () => {
    navigator.clipboard.writeText(speedReportText);
    setCopiedReport(true);
    store.logActivity('Speed Report Copied', 'template', `Generated speed report for ${targetUrl}`);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // Console Log Utility
  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'success' ? '✔ [SUCCESS]' : type === 'error' ? '✖ [ERROR]' : 'ℹ [INFO]';
    setScanLogs(prev => [...prev, `[${timestamp}] ${prefix} ${message}`]);
  };

  // Shared Scan Handler for both Inspector, Speed, and SEO tabs
  const handleStartScan = async () => {
    if (!targetUrl.trim()) {
      setScanError('Please enter a valid store URL or domain.');
      return;
    }

    setScanStatus('detecting');
    setScanError('');
    setTechInfo(null);
    setCollections([]);
    setAllProducts([]);
    setDetectedImages([]);
    setDetectedVideos([]);
    setLighthouseMetrics(null);
    setFetchProgress({ current: 0, total: 0 });
    
    const timestamp = new Date().toLocaleTimeString();
    setScanLogs([`[${timestamp}] ℹ [INFO] Initializing store intelligence probe for: ${targetUrl}`]);

    try {
      addLog('Resolving domain and extracting page headers...');
      
      let apiUrl = `/api/analyze-site/detect?url=${encodeURIComponent(targetUrl.trim())}`;
      if (storePassword) {
        apiUrl += `&storePassword=${encodeURIComponent(storePassword)}`;
        addLog('Applying bypass storefront authentication token...', 'info');
      }

      const detectRes = await fetch(apiUrl);
      const detectData = await detectRes.json();

      if (!detectRes.ok || !detectData.success) {
        throw new Error(detectData.error || 'Failed to analyze store tech stack.');
      }

      if (detectData.isPasswordProtected) {
        setIsPasswordProtected(true);
        addLog('Shopify storefront is protected. Please enter the password at the prompt to continue analysis.', 'info');
        setScanStatus('idle');
        return;
      } else {
        setIsPasswordProtected(false);
      }

      setTechInfo(detectData);

      // Populate speed checklist automatically based on detected metrics!
      if (detectData.speedMetrics) {
        const metrics = detectData.speedMetrics;
        setCheckedItems({
          'app-purge': (detectData.apps?.length || 0) < 5,
          'img-scaling': metrics.pageSizeKb < 400,
          'lazy-loading': metrics.lazyImageCount > 0 && (metrics.lazyImageCount / metrics.imageCount) > 0.4,
          'js-defer': metrics.scriptCount < 20,
          'font-preload': metrics.preloadCount > 1,
          'css-minify': metrics.styleCount < 10,
          'dom-reduce': metrics.pageSizeKb < 250,
          'preload-routes': false // Always manual
        });
      }

      // Trigger Google Lighthouse Performance Audit asynchronously
      setIsLoadingLighthouse(true);
      setLighthouseMetrics(null);
      
      const cleanUrlForPageSpeed = targetUrl.trim();
      const pageSpeedUrl = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(cleanUrlForPageSpeed)}&category=performance`;
      
      addLog('Launching Google Lighthouse remote performance engine...', 'info');
      
      fetch(pageSpeedUrl)
        .then(res => res.json())
        .then(data => {
          if (data && data.lighthouseResult) {
            const result = data.lighthouseResult;
            const perfScore = Math.round((result.categories.performance?.score || 0) * 100);
            
            const fcp = result.audits['first-contentful-paint']?.numericValue || 0;
            const lcp = result.audits['largest-contentful-paint']?.numericValue || 0;
            const tbt = result.audits['total-blocking-time']?.numericValue || 0;
            const cls = result.audits['cumulative-layout-shift']?.numericValue || 0;
            const speedIndex = result.audits['speed-index']?.numericValue || 0;

            setLighthouseMetrics({
              score: perfScore,
              fcp: Math.round(fcp),
              lcp: Math.round(lcp),
              tbt: Math.round(tbt),
              cls: Number(cls.toFixed(3)),
              speedIndex: Math.round(speedIndex)
            });
            
            addLog(`Google Lighthouse Mobile Score: ${perfScore}/100`, 'success');
          } else {
            addLog('Lighthouse API returned unexpected format. Falling back to synthetic estimation.', 'error');
          }
        })
        .catch(err => {
          addLog(`Lighthouse engine connection failed: ${err.message}. Using synthetic estimation.`, 'error');
        })
        .finally(() => {
          setIsLoadingLighthouse(false);
        });

      if (detectData.theme?.originalName) addLog(`Original Theme/Template: ${detectData.theme.originalName}`, 'success');
      if (detectData.theme?.name && detectData.theme.name !== detectData.theme.originalName) addLog(`Theme/Template name in settings: ${detectData.theme.name}`, 'info');
      if (detectData.apps?.length > 0) {
        const platformLabel = detectData.isShopify ? 'Shopify apps' : 'active apps & integrations';
        addLog(`Detected ${detectData.apps.length} ${platformLabel}`, 'success');
      }
      if (detectData.pixels?.length > 0) addLog(`Detected ${detectData.pixels.length} marketing pixels/trackers`, 'success');

      addLog(`Resolved domain: ${detectData.domain}`, 'success');
      addLog(`Platform detected: ${detectData.technology}`, 'success');

      store.logActivity('Website Scanned', 'note', `Scanned: ${detectData.domain} (${detectData.technology})`);

      const initialCollections = detectData.isShopify ? (detectData.collections || []) : [];
      if (detectData.isShopify) {
        // Load collections
        setCollections(initialCollections.map((c: any) => ({
          ...c,
          productCount: 0,
          products: [],
          isLoading: false
        })));
        addLog(`Discovered ${initialCollections.length} public collections from collection manifests`, 'success');
      } else {
        addLog(`Non-Shopify site (${detectData.technology}) detected. Launching catalog product scanner...`, 'info');
      }

      // Fetch products
      setScanStatus('fetching_products');
      addLog('Crawling products (250 products per request)...');

      let page = 1;
      let hasMore = true;
      let tempAllProducts: any[] = [];

      while (hasMore) {
        addLog(`Scraping products manifest page ${page}...`);
        const prodRes = await fetch(`/api/analyze-site/products?domain=${detectData.domain}&page=${page}&limit=250&storePassword=${encodeURIComponent(storePassword)}&sessionCookie=${encodeURIComponent(detectData.sessionCookie || '')}&platform=${encodeURIComponent(detectData.technology)}`);
        if (!prodRes.ok) {
          addLog(`Error fetching products page ${page}. Stopping crawl.`, 'error');
          break;
        }

        const prodData = await prodRes.json();
        if (!prodData.success) {
          addLog(`Failed crawler page ${page}: ${prodData.error}`, 'error');
          break;
        }

        const pageProducts = prodData.products || [];
        tempAllProducts = [...tempAllProducts, ...pageProducts];
        setAllProducts(tempAllProducts);
        setFetchProgress({ current: tempAllProducts.length, total: tempAllProducts.length });
        addLog(`Page ${page}: Fetched ${pageProducts.length} items. Total: ${tempAllProducts.length}`, 'success');

        if (pageProducts.length < 250) {
          hasMore = false;
        } else {
          page++;
        }
      }

      addLog(`Product crawl complete. Total products loaded: ${tempAllProducts.length}`, 'success');

      // Map products to collections
      if (initialCollections.length > 0) {
        setScanStatus('mapping_collections');
        addLog('Mapping catalog to collection categories...');

        for (const collection of initialCollections) {
          addLog(`Extracting products for collection: "${collection.title}"...`);
          
          setCollections(prev => prev.map(c => c.handle === collection.handle ? { ...c, isLoading: true } : c));

          let collPage = 1;
          let collHasMore = true;
          let collProducts: any[] = [];

          while (collHasMore) {
            const collProdRes = await fetch(`/api/analyze-site/products?domain=${detectData.domain}&collection=${collection.handle}&page=${collPage}&limit=250&storePassword=${encodeURIComponent(storePassword)}&sessionCookie=${encodeURIComponent(detectData.sessionCookie || '')}&platform=${encodeURIComponent(detectData.technology)}`);
            if (!collProdRes.ok) {
              addLog(`Error fetching products for collection "${collection.title}".`, 'error');
              break;
            }

            const collProdData = await collProdRes.json();
            if (!collProdData.success) {
              addLog(`Failed collection fetch: ${collProdData.error}`, 'error');
              break;
            }

            const pageCollProducts = collProdData.products || [];
            collProducts = [...collProducts, ...pageCollProducts];

            if (pageCollProducts.length < 250) {
              collHasMore = false;
            } else {
              collPage++;
            }
          }

          addLog(`Mapped ${collProducts.length} products to "${collection.title}".`, 'success');
          
          const updatedColl = {
            ...collection,
            productCount: collProducts.length,
            products: collProducts,
            isLoading: false
          };

          setCollections(prev => prev.map(c => c.handle === collection.handle ? updatedColl : c));
        }
      }

      addLog('All scans and static audits completed successfully.', 'success');
      setScanStatus('completed');

    } catch (err: any) {
      addLog(`Scan failed: ${err.message}`, 'error');
      setScanStatus('error');
      setScanError(err.message || 'Scan failed.');
    }
  };

  // EXPORT THEME ASSETS UTILITY
  const handleExportTheme = async () => {
    if (!techInfo || !techInfo.domain) return;
    setIsExportingTheme(true);
    addLog(`Initiating theme asset compilation for ${techInfo.domain}...`, 'info');
    
    try {
      if (exportMethod === 'extension') {
        window.dispatchEvent(new CustomEvent('START_SHOPIFY_EXPORT', { detail: { url: targetUrl.trim() } }));
        (window as any).extensionTimeout = setTimeout(() => {
           setIsExportingTheme((prev) => {
             if (prev) {
               addLog("Extension didn't respond. Please ensure it is updated and reloaded in chrome://extensions.", "error");
               return false;
             }
             return prev;
           });
        }, 5000);
        return;
      }

      let exportUrl = `/api/analyze-site/export-theme?url=${encodeURIComponent(targetUrl.trim())}`;
      if (exportMethod === 'admin') {
        if (!adminToken.trim()) {
           throw new Error('Please enter a valid Admin Access Token.');
        }
        exportUrl += `&adminToken=${encodeURIComponent(adminToken.trim())}`;
      } else if (storePassword) {
        exportUrl += `&storePassword=${encodeURIComponent(storePassword)}`;
      }
      
      const response = await fetch(exportUrl);
      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({ error: 'Theme asset export failed.' }));
        throw new Error(errorJson.error || 'Theme asset export failed.');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const cleanDomain = techInfo.domain.replace(/[^a-zA-Z0-9]/g, '_');
      const filePrefix = exportMethod === 'admin' ? 'original_theme_' : 'theme_export_';
      link.setAttribute('download', `${filePrefix}${cleanDomain}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      addLog('Theme assets exported and downloaded successfully!', 'success');
    } catch (error: any) {
      addLog(`Failed to export theme assets: ${error.message}`, 'error');
      alert(`Export Failed: ${error.message}`);
    } finally {
      setIsExportingTheme(false);
    }
  };

  // LOAD IMAGES UTILITY
  const handleLoadImages = async () => {
    if (!targetUrl.trim()) {
      alert('Please enter a website URL first.');
      return;
    }
    setIsLoadingImages(true);
    setDetectedImages([]);
    setDetectedVideos([]);
    addLog('Scraping theme and media assets from storefront HTML...', 'info');

    try {
      let apiUrl = `/api/analyze-site/images?url=${encodeURIComponent(targetUrl.trim())}`;
      if (storePassword) {
        apiUrl += `&storePassword=${encodeURIComponent(storePassword)}`;
      }

      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to scrape media assets.');
      }

      setDetectedImages(data.images || []);
      setDetectedVideos(data.videos || []);
      addLog(`Media Scrape Complete! Discovered ${data.images?.length || 0} images and ${data.videos?.length || 0} videos.`, 'success');
    } catch (err: any) {
      addLog(`Media loading failed: ${err.message}`, 'error');
      alert(`Failed to load media assets: ${err.message}`);
    } finally {
      setIsLoadingImages(false);
    }
  };

  // DOWNLOAD SINGLE IMAGE UTILITY
  const handleDownloadSingleImage = async (imgUrl: string) => {
    try {
      const res = await fetch(imgUrl);
      if (!res.ok) throw new Error('Network error');
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const filename = imgUrl.split('/').pop()?.split('?')[0] || 'image.png';
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      window.open(imgUrl, '_blank');
    }
  };

  // DOWNLOAD ALL IMAGES (ZIP) UTILITY
  const handleDownloadAllImages = async () => {
    if (detectedImages.length === 0) return;
    setIsZippingImages(true);
    addLog(`Compiling batch ZIP archive for ${detectedImages.length} images...`, 'info');
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const imagesToZip = detectedImages.slice(0, 80);
      
      await Promise.all(imagesToZip.map(async (url, idx) => {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const blob = await res.blob();
            let filename = url.split('/').pop()?.split('?')[0] || `image_${idx}.png`;
            if (!filename.includes('.')) filename += '.png';
            zip.file(filename, blob);
          }
        } catch (e) {
          console.warn('CORS or fetch issue skipping zip index: ', url);
        }
      }));
      
      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const cleanDomain = techInfo?.domain || 'store';
      link.setAttribute('download', `images_export_${cleanDomain}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      addLog('Image archive compiled and downloaded successfully!', 'success');
    } catch (error: any) {
      addLog(`ZIP compilation failed: ${error.message}`, 'error');
      alert(`Failed to compile ZIP: ${error.message}`);
    } finally {
      setIsZippingImages(false);
    }
  };

  // EXPORT TO SHOPIFY STANDARD CSV UTILITY - FIXED COLUMN SHIFT & LENGTH ERROR
  const handleExportCSV = (products: any[], title: string) => {
    if (!products || !Array.isArray(products) || products.length === 0) {
      alert('No products available for export.');
      return;
    }

    const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-shopify-products.csv`;
    
    // Shopify CSV columns schema (Exactly 49 headers)
    const headers = [
      'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags', 'Published',
      'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value', 'Option3 Name', 'Option3 Value',
      'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
      'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price', 'Variant Compare At Price',
      'Variant Requires Shipping', 'Variant Taxable', 'Variant Barcode', 'Image Src', 'Image Position',
      'Image Alt Text', 'Gift Card', 'SEO Title', 'SEO Description', 'Google Shopping / Google Product Category',
      'Google Shopping / Gender', 'Google Shopping / Age Group', 'Google Shopping / MPN',
      'Google Shopping / AdWords Grouping', 'Google Shopping / AdWords Labels', 'Google Shopping / Condition',
      'Google Shopping / Custom Product', 'Google Shopping / Custom Label 0', 'Google Shopping / Custom Label 1',
      'Google Shopping / Custom Label 2', 'Google Shopping / Custom Label 3', 'Google Shopping / Custom Label 4',
      'Variant Image', 'Variant Weight Unit', 'Variant Tax Code', 'Cost per item', 'Status'
    ];

    const rows: string[][] = [headers];

    products.forEach(product => {
      if (!product) return;
      const handle = product.handle || '';
      const productTitle = product.title || '';
      const bodyHtml = product.body_html || '';
      const vendor = product.vendor || '';
      const productType = product.product_type || '';
      const tags = Array.isArray(product.tags)
        ? product.tags.join(', ')
        : typeof product.tags === 'string'
          ? product.tags
          : '';
      const published = product.published_at ? 'true' : 'false';
      const status = 'active';

      const options = product.options || [];
      const option1Name = options[0]?.name || '';
      const option2Name = options[1]?.name || '';
      const option3Name = options[2]?.name || '';

      const variants = product.variants || [];
      const images = product.images || [];

      // Loop over the maximum of variants or images
      const numRows = Math.max(variants.length, images.length, 1);

      for (let i = 0; i < numRows; i++) {
        const isFirstRow = i === 0;
        const variant = variants[i];
        const image = images[i];

        const row: string[] = [];

        row.push(handle); // 1. Handle
        row.push(isFirstRow ? productTitle : ''); // 2. Title
        row.push(isFirstRow ? bodyHtml : ''); // 3. Body (HTML)
        row.push(isFirstRow ? vendor : ''); // 4. Vendor
        row.push(''); // 5. Product Category
        row.push(isFirstRow ? productType : ''); // 6. Type
        row.push(isFirstRow ? tags : ''); // 7. Tags
        row.push(isFirstRow ? published : ''); // 8. Published

        row.push(isFirstRow ? option1Name : ''); // 9. Option1 Name
        row.push(variant ? (variant.option1 || '') : ''); // 10. Option1 Value
        row.push(isFirstRow ? option2Name : ''); // 11. Option2 Name
        row.push(variant ? (variant.option2 || '') : ''); // 12. Option2 Value
        row.push(isFirstRow ? option3Name : ''); // 13. Option3 Name
        row.push(variant ? (variant.option3 || '') : ''); // 14. Option3 Value

        row.push(variant?.sku || ''); // 15. Variant SKU
        row.push(variant?.grams !== undefined ? String(variant.grams) : ''); // 16. Variant Grams
        row.push(variant ? 'shopify' : ''); // 17. Variant Inventory Tracker
        row.push(variant ? '1' : ''); // 18. Variant Inventory Qty
        row.push(variant ? 'deny' : ''); // 19. Variant Inventory Policy
        row.push(variant ? 'manual' : ''); // 20. Variant Fulfillment Service
        row.push(variant?.price || ''); // 21. Variant Price
        row.push(variant?.compare_at_price || ''); // 22. Variant Compare At Price
        row.push(variant ? String(variant.requires_shipping ?? true) : ''); // 23. Variant Requires Shipping
        row.push(variant ? String(variant.taxable ?? true) : ''); // 24. Variant Taxable
        row.push(variant?.barcode || ''); // 25. Variant Barcode

        row.push(image?.src || ''); // 26. Image Src
        row.push(image?.position !== undefined ? String(image.position) : ''); // 27. Image Position
        row.push(image?.alt || ''); // 28. Image Alt Text

        row.push(isFirstRow ? 'false' : ''); // 29. Gift Card
        row.push(''); // 30. SEO Title
        row.push(''); // 31. SEO Description

        // 31 to 44: Google Shopping (Exactly 13 columns pushed)
        row.push(''); // 32. Google Shopping / Google Product Category
        row.push(''); // 33. Google Shopping / Gender
        row.push(''); // 34. Google Shopping / Age Group
        row.push(''); // 35. Google Shopping / MPN
        row.push(''); // 36. Google Shopping / AdWords Grouping
        row.push(''); // 37. Google Shopping / AdWords Labels
        row.push(''); // 38. Google Shopping / Condition
        row.push(''); // 39. Google Shopping / Custom Product
        row.push(''); // 40. Google Shopping / Custom Label 0
        row.push(''); // 41. Google Shopping / Custom Label 1
        row.push(''); // 42. Google Shopping / Custom Label 2
        row.push(''); // 43. Google Shopping / Custom Label 3
        row.push(''); // 44. Google Shopping / Custom Label 4

        row.push(variant?.featured_image?.src || ''); // 45. Variant Image
        row.push(variant ? (variant.weight_unit || 'kg') : ''); // 46. Variant Weight Unit
        row.push(''); // 47. Variant Tax Code
        row.push(''); // 48. Cost per item
        row.push(isFirstRow ? status : ''); // 49. Status

        rows.push(row);
      }
    });

    // Generate CSV contents with standard string escaping
    const csvContent = rows
      .map(r => r.map(val => {
        let cleanVal = val == null ? '' : String(val);
        if (cleanVal === 'undefined') cleanVal = '';
        if (cleanVal.includes('"') || cleanVal.includes(',') || cleanVal.includes('\n') || cleanVal.includes('\r')) {
          cleanVal = '"' + cleanVal.replace(/"/g, '""') + '"';
        }
        return cleanVal;
      }).join(','))
      .join('\n');

    try {
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      store.logActivity('Products Exported', 'download', `Exported ${products.length} products to CSV: ${filename}`);
    } catch (err) {
      console.error('Download error:', err);
      alert('Error generating CSV download. Please check console.');
    }
  };

  return (
    <div className={auditStyles.wrapper}>
      {/* Page Title */}
      <div>
        <h1 className={auditStyles.headerTitle + " flex items-center gap-3"}>
          <Sparkles className="w-6 h-6 text-green-400" />
          Store Intelligence & Audit Suite
        </h1>
        <p className={auditStyles.headerDesc}>
          Generate Shopify speed optimization metrics, inspect active application tech stacks, parse HTML search schemas, and export product catalogs instantly.
        </p>
      </div>

      {/* URL Input Bar - Shared Top level for better UX */}
      <div className={auditStyles.cardContainer}>
        <div className="space-y-2">
          <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Target Store Website URL</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="e.g. storename.myshopify.com or brandname.com"
                className={auditStyles.inputField + " pl-10 h-10"}
                disabled={scanStatus === 'detecting' || scanStatus === 'fetching_products' || scanStatus === 'mapping_collections'}
              />
            </div>
            
            <button
              onClick={handleStartScan}
              disabled={scanStatus === 'detecting' || scanStatus === 'fetching_products' || scanStatus === 'mapping_collections'}
              className={auditStyles.btnPrimary + " h-10 px-6 flex items-center justify-center gap-2 shrink-0"}
            >
              {scanStatus === 'detecting' || scanStatus === 'fetching_products' || scanStatus === 'mapping_collections' ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <svg 
                  className="w-4 h-4 text-black" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ animation: 'spin 3s linear infinite' }}
                >
                  <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9-9a9 9 0 0 0-9 9m9 9a9 9 0 0 1-9-9m9 9V3" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" className="animate-pulse" />
                </svg>
              )}
              <span>Analyze Site</span>
            </button>
          </div>

          {scanError && (
            <p className="text-red-400 text-xs flex items-center gap-1.5 mt-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{scanError}</span>
            </p>
          )}

          {isPasswordProtected && (
            <div className="space-y-1.5 mt-3 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 blur-3xl rounded-full pointer-events-none" />
              <label className="text-[10px] text-yellow-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Password Protected Store
              </label>
              <p className="text-[11px] text-yellow-500/80 mb-2 font-medium">Enter storefront password to bypass storefront protection.</p>
              <input
                type="password"
                value={storePassword}
                onChange={(e) => setStorePassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full max-w-sm px-3 py-2 rounded-lg bg-black/40 text-xs border border-yellow-500/30 focus:border-yellow-400 focus:outline-none text-white placeholder-gray-600 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleStartScan()}
              />
            </div>
          )}
        </div>

        {/* Progress manifest indicator */}
        {(scanStatus === 'fetching_products' || scanStatus === 'mapping_collections') && (
          <div className="space-y-1.5 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 mt-3">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-yellow-400">
              <span>Crawling store catalog...</span>
              <span>{fetchProgress.current} products fetched</span>
            </div>
            <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-yellow-450 h-1.5 rounded-full transition-all duration-300 animate-pulse" 
                style={{ width: `${Math.min(100, Math.max(10, (fetchProgress.current % 250) / 2.5))}%` }} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs Selector Navigation - Premium Glassy Pills UI */}
      <div className="bg-[#0b0b0d]/75 border border-white/5 p-1.5 rounded-2xl flex flex-wrap sm:flex-nowrap gap-1.5 backdrop-blur-xl relative z-10 w-fit">
        {[
          { id: 'inspect', name: 'Intelligence Inspector', icon: Globe },
          { id: 'speed', name: 'Speed Optimizer', icon: Gauge },
          { id: 'seo', name: 'SEO & Schema Auditor', icon: FileSearch },
          { id: 'transfer', name: 'WordPress to Shopify Transfer', icon: FolderSync }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative px-5 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all duration-300 select-none cursor-pointer z-10 ${
                isActive 
                  ? 'text-green-400 bg-green-500/10 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.15)] font-black' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-green-400 animate-pulse' : 'text-gray-500'}`} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeTab === 'inspect' ? (
          <motion.div
            key="inspect-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6"
          >
            {/* Console and Media assets left column */}
            <div className="xl:col-span-7 space-y-6">
              {/* Scan Console */}
              <div className={auditStyles.cardContainer}>
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-green-400" />
                  <span>Audit Scanner Console Output</span>
                </span>
                
                <div className={auditStyles.consoleBox}>
                  {scanLogs.length === 0 ? (
                    <span className="text-gray-500 italic select-none">Console idle. Enter URL above and click Analyze.</span>
                  ) : (
                    scanLogs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed whitespace-pre-wrap border-l-2 border-green-500/20 pl-2">
                        {log}
                      </div>
                    ))
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>

              {/* Media Asset Inspector */}
              {techInfo && (
                <div className={auditStyles.cardContainer}>
                  <div className="flex justify-between items-center border-b border-glass-border pb-2.5">
                    <span className="text-[10px] text-yellow-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                      <span>Media Asset Inspector</span>
                    </span>
                    <div className="flex gap-2">
                      {detectedImages.length > 0 && (
                        <span className={auditStyles.badge}>
                          {detectedImages.length} IMAGES
                        </span>
                      )}
                      {detectedVideos.length > 0 && (
                        <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] font-bold uppercase">
                          {detectedVideos.length} VIDEOS
                        </span>
                      )}
                    </div>
                  </div>

                  {detectedImages.length === 0 && detectedVideos.length === 0 ? (
                    <button
                      onClick={handleLoadImages}
                      disabled={isLoadingImages}
                      className="w-full flex items-center justify-center gap-2 bg-yellow-500/5 hover:bg-yellow-500/10 text-yellow-400 font-extrabold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg border border-yellow-500/20 transition-all cursor-pointer"
                    >
                      {isLoadingImages ? (
                        <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                      ) : (
                        <FolderSync className="w-4 h-4 text-yellow-500" />
                      )}
                      <span>Load Store Media Assets</span>
                    </button>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center gap-2">
                        <button
                          onClick={handleLoadImages}
                          disabled={isLoadingImages}
                          className="px-3 py-1.5 bg-white/5 border border-glass-border hover:bg-white/10 rounded-lg text-[10px] font-bold text-gray-300 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-yellow-500 ${isLoadingImages ? 'animate-spin' : ''}`} />
                          <span>Reload Gallery</span>
                        </button>
                        <button
                          onClick={handleDownloadAllImages}
                          disabled={isZippingImages}
                          className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-[10px] font-black text-black transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-yellow-500/10"
                        >
                          {isZippingImages ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                          <span>Download Images (ZIP)</span>
                        </button>
                      </div>

                      {/* Media assets grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[350px] overflow-y-auto pr-1">
                        {/* Videos */}
                        {detectedVideos.map((vid, idx) => (
                          <div 
                            key={`vid-${idx}`}
                            className="group relative aspect-square bg-black/60 rounded-xl overflow-hidden border border-glass-border hover:border-yellow-500/30 transition-all"
                          >
                            {vid.includes('youtube.com') || vid.includes('youtu.be') || vid.includes('vimeo.com') ? (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950 border border-white/5 p-2">
                                <Play className="w-8 h-8 text-red-500 fill-current animate-pulse" />
                                <span className="text-[9px] text-gray-400 font-bold uppercase mt-1 text-center truncate w-full">Embed Video</span>
                              </div>
                            ) : (
                              <video 
                                src={vid}
                                className="w-full h-full object-cover"
                                muted
                                loop
                                playsInline
                                onMouseOver={e => e.currentTarget.play()}
                                onMouseOut={e => e.currentTarget.pause()}
                              />
                            )}
                            <div className="absolute top-2 left-2 z-10 px-1.5 py-0.2 bg-black/85 border border-yellow-500/35 rounded text-[8px] font-black text-yellow-400 uppercase tracking-widest">
                              VIDEO
                            </div>
                            <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                              <button
                                onClick={() => handleDownloadSingleImage(vid)}
                                className="p-2 bg-yellow-500 rounded-lg text-black hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-lg shadow-yellow-500/25"
                                title="Download video"
                              >
                                <Download className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Images */}
                        {detectedImages.map((img, idx) => (
                          <div 
                            key={`img-${idx}`}
                            className="group relative aspect-square bg-black/60 rounded-xl overflow-hidden border border-glass-border hover:border-yellow-500/30 transition-all"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={img} 
                              alt="Store asset" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                              <button
                                onClick={() => handleDownloadSingleImage(img)}
                                className="p-2 bg-yellow-500 rounded-lg text-black hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-lg shadow-yellow-500/25"
                                title="Download image"
                              >
                                <Download className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Scan report and metrics right column */}
            <div className="xl:col-span-5 space-y-6">
              {/* Tech details card */}
              <div className={auditStyles.cardContainer}>
                <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider block">Inspector Metrics</span>
                
                {techInfo ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-gray-400 font-semibold">Store Domain</span>
                      <h4 className="text-sm font-extrabold text-white font-mono mt-0.5">{techInfo.domain}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white/5 border border-glass-border rounded-lg text-center">
                        <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Technology</span>
                        <div className="mt-1 inline-flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded text-[11px] text-green-400 font-bold">
                          <Zap className="w-3 h-3 fill-green-400" />
                          <span>{techInfo.technology}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white/5 border border-glass-border rounded-lg text-center">
                        <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Total Products</span>
                        <span className="text-lg font-black text-white block mt-0.5">{allProducts.length}</span>
                      </div>
                    </div>

                    {techInfo.theme && (
                      <div className="p-4 bg-black/40 border border-glass-border rounded-lg flex flex-col relative overflow-hidden space-y-3 text-left">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-green/10 blur-3xl rounded-full pointer-events-none" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Code className="w-3 h-3 text-brand-green" /> {techInfo.isShopify ? 'Theme Architecture' : 'Template/Layout'}
                          </span>
                          
                          {techInfo.isShopify && (
                            <div className="flex bg-black/45 border border-glass-border rounded p-0.5 text-[9px] font-bold">
                              <button
                                onClick={() => setExportMethod('public')}
                                className={`px-1.5 py-0.5 rounded transition-all ${exportMethod === 'public' ? 'bg-brand-green text-black' : 'text-gray-400 hover:text-white'}`}
                              >
                                Clone
                              </button>
                              <button
                                onClick={() => setExportMethod('admin')}
                                className={`px-1.5 py-0.5 rounded transition-all ${exportMethod === 'admin' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}
                              >
                                API Token
                              </button>
                              <button
                                onClick={() => setExportMethod('extension')}
                                className={`px-1.5 py-0.5 rounded transition-all ${exportMethod === 'extension' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}
                              >
                                Ext
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-xs text-gray-400 block mb-0.5">{techInfo.isShopify ? 'Original Theme' : 'Original Template'}</span>
                            <span className="text-base font-black text-white">{techInfo.theme.originalName || 'Unknown'}</span>
                          </div>
                          {techInfo.theme.name !== techInfo.theme.originalName && (
                            <div className="text-right">
                              <span className="text-[10px] text-gray-500 block mb-0.5">Active/Renamed As</span>
                              <span className="text-xs font-bold text-gray-300">{techInfo.theme.name}</span>
                            </div>
                          )}
                        </div>

                        {techInfo.isShopify && exportMethod === 'admin' && (
                          <div className="space-y-2 p-3 rounded bg-yellow-500/5 border border-yellow-500/20 text-[10px]">
                            <label className="text-yellow-500 font-bold block">Shopify Admin API Token</label>
                            <input
                              type="password"
                              value={adminToken}
                              onChange={(e) => setAdminToken(e.target.value)}
                              placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                              className="w-full px-2 py-1.5 bg-black/40 border border-yellow-500/25 rounded text-[10px] text-white focus:outline-none focus:border-yellow-400 transition-all font-mono"
                            />
                          </div>
                        )}

                        {techInfo.isShopify && exportMethod === 'extension' && (
                          <div className="space-y-2 p-3 rounded bg-purple-500/5 border border-purple-500/20 text-[10px]">
                            {isExtensionInstalled ? (
                              <>
                                <p className="text-purple-400 font-bold flex items-center gap-1.5">
                                  <ShieldCheck className="w-4 h-4 text-purple-400" /> Extension Connected
                                </p>
                                {extensionProgress && (
                                  <div className="mt-2 space-y-1.5 p-2 rounded bg-black/30 border border-purple-500/10">
                                    <div className="flex justify-between items-center text-[9px] uppercase font-bold text-purple-400">
                                      <span>{extensionProgress.message}</span>
                                      <span>{extensionProgress.percent}%</span>
                                    </div>
                                    <div className="w-full bg-gray-900 rounded-full h-1">
                                      <div 
                                        className="bg-purple-500 h-1 rounded-full transition-all duration-300" 
                                        style={{ width: `${extensionProgress.percent}%` }} 
                                      />
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="text-yellow-400 font-bold flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-yellow-400" /> Extension Not Detected
                              </p>
                            )}
                          </div>
                        )}

                        <div className="pt-2 border-t border-glass-border/50 flex justify-between items-center text-[10px] text-gray-500 font-mono">
                          <div className="flex flex-col gap-0.5">
                            <span>ID: {techInfo.theme.id}</span>
                            {techInfo.theme.role && <span>Role: {techInfo.theme.role}</span>}
                          </div>
                          
                          {techInfo.isShopify && (
                            <button
                              onClick={handleExportTheme}
                              disabled={isExportingTheme}
                              className={`px-2.5 py-1 font-extrabold text-[10px] uppercase tracking-wider rounded transition-all flex items-center gap-1 disabled:opacity-50 ${exportMethod === 'admin' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : exportMethod === 'extension' ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-brand-green hover:bg-brand-green-hover text-black'}`}
                            >
                              {isExportingTheme ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span>{exportMethod === 'admin' || exportMethod === 'extension' ? 'Export Original' : 'Export Clone'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {techInfo.apps && techInfo.apps.length > 0 && (
                      <div className="space-y-2 pt-1 animate-in fade-in duration-500">
                        <span className="text-[10px] text-gray-550 font-extrabold block uppercase tracking-wider flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-brand-green animate-pulse" /> 
                          <span>Detected App & Plugin Stack</span>
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {techInfo.apps.map(app => {
                            const name = typeof app === 'string' ? app : app.name;
                            const link = typeof app === 'string' ? '' : app.link;
                            return link ? (
                              <a
                                key={name}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-green-500/5 border border-green-500/20 hover:border-green-400 hover:bg-green-500/10 rounded text-[10px] font-extrabold text-green-400 hover:text-green-300 transition-all duration-300 flex items-center gap-1 shadow-[0_0_8px_rgba(34,197,94,0.02)] hover:shadow-[0_0_12px_rgba(34,197,94,0.15)] transform hover:-translate-y-0.5"
                              >
                                <span>{name}</span>
                                <svg className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                              </a>
                            ) : (
                              <span key={name} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-bold text-gray-300 transition-all duration-300">
                                {name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {techInfo.pixels && techInfo.pixels.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider flex items-center gap-1">
                          <Activity className="w-3 h-3 text-blue-400" /> Marketing & Analytics Pixels
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {techInfo.pixels.map(px => (
                            <span key={px} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-bold text-blue-300 transition-all">
                              {px}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {allProducts.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-glass-border">
                        {techInfo.isShopify && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">Public Collections</span>
                            <span className="font-bold text-white">{collections.length}</span>
                          </div>
                        )}

                        <button
                          onClick={() => handleExportCSV(allProducts, `${techInfo.domain}-all-products`)}
                          className="w-full flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg transition-all shadow-lg glow-green cursor-pointer"
                        >
                          <Download className="w-4 h-4 stroke-[3]" />
                          <span>Export All Products (CSV)</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-xs italic">
                    Enter target URL above and analyze site to inspect tech stacks.
                  </div>
                )}
              </div>

              {/* Collections Breakdowns */}
              {collections.length > 0 && (
                <div className={auditStyles.cardContainer}>
                  <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider flex items-center justify-between border-b border-glass-border pb-1.5">
                    <span>{techInfo?.isShopify ? 'Collections Breakdown' : 'Product Categories'}</span>
                    <span className="text-green-400">{collections.length} items</span>
                  </span>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {collections.map((coll) => (
                      <div 
                        key={coll.id}
                        className="p-3 bg-black/40 border border-glass-border hover:border-glass-border/30 rounded-lg flex justify-between items-center text-xs"
                      >
                        <div className="space-y-0.5 text-left">
                          <span className="font-bold text-white block">{coll.title}</span>
                          <span className="text-[10px] text-gray-500 font-mono block">handle: {coll.handle}</span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {coll.isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                          ) : (
                            <span className="font-bold text-green-400 px-2 py-0.5 bg-green-500/10 border border-green-500/10 rounded">
                              {coll.productCount} Products
                            </span>
                          )}

                          <button
                            onClick={() => handleExportCSV(coll.products, `${techInfo?.domain || 'store'}-${coll.handle}`)}
                            disabled={coll.isLoading || !coll.products || coll.products.length === 0}
                            className="p-1.5 rounded bg-glass-hover text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                            title={`Export collection: ${coll.title}`}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : activeTab === 'speed' ? (
          <motion.div
            key="speed-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6"
          >
            {/* Speed Optimizations checklist */}
            <div className="xl:col-span-7 space-y-6">
              {/* Real-time speed stats card */}
              {techInfo?.speedMetrics && (
                <div className={auditStyles.cardContainer}>
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block border-b border-glass-border pb-1">
                    Detected Site Speed Metrics
                  </span>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                    <div className="p-3 bg-black/40 border border-glass-border rounded-xl">
                      <span className="text-[9px] text-gray-500 block uppercase font-bold">Raw Page Size</span>
                      <span className="text-sm font-bold text-white">{techInfo.speedMetrics.pageSizeKb} KB</span>
                    </div>
                    <div className="p-3 bg-black/40 border border-glass-border rounded-xl">
                      <span className="text-[9px] text-gray-500 block uppercase font-bold">JavaScript Tags</span>
                      <span className="text-sm font-bold text-white">{techInfo.speedMetrics.scriptCount} files</span>
                    </div>
                    <div className="p-3 bg-black/40 border border-glass-border rounded-xl">
                      <span className="text-[9px] text-gray-500 block uppercase font-bold">CSS Stylesheets</span>
                      <span className="text-sm font-bold text-white">{techInfo.speedMetrics.styleCount} stylesheets</span>
                    </div>
                    <div className="p-3 bg-black/40 border border-glass-border rounded-xl">
                      <span className="text-[9px] text-gray-500 block uppercase font-bold">Image Elements</span>
                      <span className="text-sm font-bold text-white">{techInfo.speedMetrics.imageCount} images</span>
                    </div>
                    <div className="p-3 bg-black/40 border border-glass-border rounded-xl">
                      <span className="text-[9px] text-gray-500 block uppercase font-bold">Lazy Loaded Images</span>
                      <span className="text-sm font-bold text-green-400">{techInfo.speedMetrics.lazyImageCount} of {techInfo.speedMetrics.imageCount}</span>
                    </div>
                    <div className="p-3 bg-black/40 border border-glass-border rounded-xl">
                      <span className="text-[9px] text-gray-500 block uppercase font-bold">Asset Preloads</span>
                      <span className="text-sm font-bold text-blue-400">{techInfo.speedMetrics.preloadCount} assets</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Real Google Lighthouse Audit Results Card */}
              {(isLoadingLighthouse || lighthouseMetrics) && (
                <div className={auditStyles.cardContainer}>
                  <div className="flex justify-between items-center border-b border-glass-border pb-1">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">
                      Google Lighthouse Core Web Vitals
                    </span>
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-[9px] font-black tracking-widest uppercase">
                      Official API
                    </span>
                  </div>

                  {isLoadingLighthouse ? (
                    <div className="py-8 flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                      <div className="text-center">
                        <p className="text-xs font-extrabold text-green-400 uppercase tracking-widest animate-pulse">Lighthouse Audit in Progress...</p>
                        <p className="text-[10px] text-gray-500 mt-1">Google PageSpeed Server is running performance audits on the target domain.</p>
                      </div>
                    </div>
                  ) : lighthouseMetrics ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                      <div className="p-3 bg-black/40 border border-glass-border rounded-xl">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">First Contentful Paint</span>
                        <span className="text-sm font-bold text-white font-mono">{(lighthouseMetrics.fcp / 1000).toFixed(2)}s</span>
                        <span className="text-[9px] text-green-400 block mt-0.5">FCP</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-glass-border rounded-xl">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Largest Contentful Paint</span>
                        <span className="text-sm font-bold text-white font-mono">{(lighthouseMetrics.lcp / 1000).toFixed(2)}s</span>
                        <span className="text-[9px] text-green-400 block mt-0.5">LCP</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-glass-border rounded-xl">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Total Blocking Time</span>
                        <span className="text-sm font-bold text-white font-mono">{lighthouseMetrics.tbt} ms</span>
                        <span className="text-[9px] text-green-400 block mt-0.5">TBT</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-glass-border rounded-xl">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Cumulative Layout Shift</span>
                        <span className="text-sm font-bold text-white font-mono">{lighthouseMetrics.cls}</span>
                        <span className="text-[9px] text-green-400 block mt-0.5">CLS</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-glass-border rounded-xl">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Speed Index</span>
                        <span className="text-sm font-bold text-white font-mono">{(lighthouseMetrics.speedIndex / 1000).toFixed(2)}s</span>
                        <span className="text-[9px] text-green-400 block mt-0.5">SI</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-glass-border rounded-xl">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Lighthouse Score</span>
                        <span className={`text-sm font-black font-mono ${lighthouseMetrics.score >= 90 ? 'text-green-400' : lighthouseMetrics.score >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>{lighthouseMetrics.score}/100</span>
                        <span className="text-[9px] text-gray-500 block mt-0.5">Performance</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              <div className={auditStyles.cardContainer}>
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block border-b border-glass-border pb-1">
                  Speed Optimizations Planner Checklist
                </span>

                <p className="text-xs text-gray-400">
                  Select the items completed/recommended to calculate the target mobile speed score and update the client delivery report.
                </p>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 text-left">
                  {AUDIT_CHECKLIST.map((item) => {
                    const checked = checkedItems[item.id] || false;
                    return (
                      <div 
                        key={item.id}
                        onClick={() => handleToggleAuditItem(item.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 text-xs ${
                          checked 
                            ? 'bg-green-500/10 border-green-500/30 text-white' 
                            : 'bg-gray-950/40 border-glass-border text-gray-400 hover:text-white'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                          checked ? 'bg-green-500 border-green-500 text-black' : 'border-glass-border'
                        }`}>
                          {checked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="space-y-0.5 text-left">
                          <p className="font-bold">{item.name}</p>
                          <p className="text-[10px] text-gray-500">{item.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Score gauge and delivery report */}
            <div className="xl:col-span-5 space-y-6">
              {/* Simulated score gauge */}
              <div className={auditStyles.cardContainer + " text-center flex flex-col items-center justify-center relative overflow-hidden h-[200px]"}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">PageSpeed Mobile Performance Score</span>
                
                <div className="mt-3 relative flex items-center justify-center">
                  <div className={auditStyles.gaugeBg}>
                    <span className={`text-4xl font-black ${
                      speedScore >= 90 ? 'text-emerald-400' : speedScore >= 70 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {speedScore}
                    </span>
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold">Mobile Score</span>
                  </div>
                </div>
              </div>

              {/* Speed Report Box */}
              <div className={auditStyles.cardContainer}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-green-400" />
                    <span>Client Delivery Speed Report</span>
                  </span>
                  <button
                    onClick={handleCopyReport}
                    className="p-1 rounded bg-glass-hover hover:bg-green-500/10 text-gray-400 hover:text-green-400 transition-all"
                  >
                    {copiedReport ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="bg-black/40 border border-glass-border p-3 rounded-lg text-[11px] font-mono text-gray-300 h-56 overflow-y-auto leading-relaxed whitespace-pre-wrap select-all text-left">
                  {speedReportText}
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'seo' ? (
          <motion.div
            key="seo-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6"
          >
            {/* SEO audits and checklists */}
            <div className="xl:col-span-7 space-y-6">
              {techInfo?.seoMetrics ? (
                <div className={auditStyles.cardContainer}>
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block border-b border-glass-border pb-1.5">
                    On-Page SEO Tags Audit
                  </span>

                  <div className="space-y-4 pt-1">
                    {/* Page Title */}
                    <div className="space-y-1 text-left">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold">HTML title Tag</span>
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                          techInfo.seoMetrics.seoTitle.length >= 30 && techInfo.seoMetrics.seoTitle.length <= 60 
                            ? 'bg-green-500/15 text-green-400 border border-green-500/20' 
                            : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {techInfo.seoMetrics.seoTitle.length} characters
                        </span>
                      </div>
                      <p className="text-xs text-white bg-black/35 p-2.5 rounded-lg border border-glass-border leading-relaxed font-mono">
                        {techInfo.seoMetrics.seoTitle || <span className="text-red-400 italic">No Title tag detected!</span>}
                      </p>
                      <p className="text-[10px] text-gray-500 leading-normal">
                        💡 Best practice title length is between 30 and 60 characters. Keep it brand-focused and readable.
                      </p>
                    </div>

                    {/* Meta Description */}
                    <div className="space-y-1 text-left">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold">HTML Meta Description</span>
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                          techInfo.seoMetrics.seoDescription.length >= 120 && techInfo.seoMetrics.seoDescription.length <= 160 
                            ? 'bg-green-500/15 text-green-400 border border-green-500/20' 
                            : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {techInfo.seoMetrics.seoDescription.length} characters
                        </span>
                      </div>
                      <p className="text-xs text-white bg-black/35 p-2.5 rounded-lg border border-glass-border leading-relaxed font-mono">
                        {techInfo.seoMetrics.seoDescription || <span className="text-red-400 italic">No Meta Description detected!</span>}
                      </p>
                      <p className="text-[10px] text-gray-500 leading-normal">
                        💡 Ideal description length is between 120 and 160 characters. Write clear calls to action.
                      </p>
                    </div>

                    {/* H1 and H2 counts */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3.5 bg-black/35 border border-glass-border rounded-xl text-left space-y-1">
                        <span className="text-[10px] text-gray-500 block uppercase font-bold">H1 Header Tags</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-white">{techInfo.seoMetrics.h1Count} tags</span>
                          {techInfo.seoMetrics.h1Count === 1 ? (
                            <span className="text-[9px] bg-green-500/15 border border-green-500/20 text-green-400 px-1.5 py-0.2 rounded font-bold uppercase">Optimal</span>
                          ) : (
                            <span className="text-[9px] bg-yellow-500/15 border border-yellow-500/20 text-yellow-400 px-1.5 py-0.2 rounded font-bold uppercase">Fix Required</span>
                          )}
                        </div>
                        <p className="text-[9px] text-gray-500 leading-normal">
                          ⚠️ Page should contain exactly one H1 tag representing the primary heading.
                        </p>
                      </div>

                      <div className="p-3.5 bg-black/35 border border-glass-border rounded-xl text-left space-y-1">
                        <span className="text-[10px] text-gray-500 block uppercase font-bold">H2 Subheading Tags</span>
                        <span className="text-lg font-black text-white block">{techInfo.seoMetrics.h2Count} tags</span>
                        <p className="text-[9px] text-gray-500 leading-normal">
                          Allows search crawlers to scan the hierarchical layout structure.
                        </p>
                      </div>
                    </div>

                    {/* Image ALT Tags check */}
                    <div className="p-4 bg-black/35 border border-glass-border rounded-xl text-left flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-300">Images Missing ALT Text</span>
                        <p className="text-[10px] text-gray-500">Search crawlers use ALT descriptions to index product media files.</p>
                      </div>

                      <span className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
                        techInfo.seoMetrics.imagesWithoutAlt === 0 
                          ? 'bg-green-500/15 text-green-400 border border-green-500/25' 
                          : 'bg-red-500/15 text-red-400 border border-red-500/25'
                      }`}>
                        {techInfo.seoMetrics.imagesWithoutAlt} issues detected
                      </span>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 text-xs italic bg-gray-950/20 border border-glass-border rounded-xl">
                  No SEO metrics loaded. Enter storefront URL above and analyze to parse SEO tags.
                </div>
              )}
            </div>

            {/* Structured Schema and social previews right column */}
            <div className="xl:col-span-5 space-y-6 text-left">
              {/* Open Graph Card preview mockup */}
              {techInfo?.seoMetrics && (
                <div className={auditStyles.cardContainer}>
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">
                    Google Search Snippet Preview
                  </span>

                  <div className="bg-[#1a1a1a] border border-glass-border p-4 rounded-xl space-y-1 text-left select-none">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5 font-sans leading-none">
                      https://{techInfo.domain}
                    </span>
                    <a href={`https://${techInfo.domain}`} target="_blank" rel="noreferrer" className="text-blue-450 hover:underline text-[15px] font-medium block leading-snug">
                      {techInfo.seoMetrics.seoTitle || techInfo.domain}
                    </a>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans line-clamp-2">
                      {techInfo.seoMetrics.seoDescription || 'No description meta tag provided for search engine indexing.'}
                    </p>
                  </div>
                </div>
              )}

              {/* JSON-LD Schema manifest */}
              {techInfo?.seoMetrics && (
                <div className={auditStyles.cardContainer}>
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block border-b border-glass-border pb-1">
                    Structured Schema Markup (JSON-LD)
                  </span>

                  {techInfo.seoMetrics.schemas.length > 0 ? (
                    <div className="space-y-2.5 pt-1">
                      <p className="text-xs text-gray-400">
                        Discovered {techInfo.seoMetrics.schemas.length} structured schemas. Click a schema card to verify compliance.
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {techInfo.seoMetrics.schemas.map(schema => (
                          <span key={schema} className="px-2.5 py-1 bg-green-500/10 border border-green-500/25 rounded-lg text-xs font-bold text-green-400 flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5" />
                            {schema}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-yellow-500/90 italic flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span>No structured JSON-LD schemas detected in storefront HTML source.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          // Migration/Transfer tab panel
          <motion.div
            key="transfer-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 text-left"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Settings */}
              <div className="lg:col-span-5 space-y-6">
                {/* WooCommerce Source */}
                <div className={auditStyles.cardContainer}>
                  <h3 className="text-xs uppercase font-extrabold text-white tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-400" />
                    1. WooCommerce Source Store
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Enter the WooCommerce shop URL to fetch products catalog from public REST APIs.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={migrationSourceUrl}
                      onChange={(e) => setMigrationSourceUrl(e.target.value)}
                      placeholder="https://woocommerce-store.com"
                      className={auditStyles.inputField}
                    />
                    <button
                      onClick={handleFetchWpProducts}
                      disabled={isFetchingWp || isMigrating}
                      className={auditStyles.btnPrimary + " shrink-0 flex items-center gap-1.5 cursor-pointer"}
                    >
                      {isFetchingWp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>Fetch</span>
                    </button>
                  </div>
                </div>

                <div className={auditStyles.cardContainer}>
                  <h3 className="text-xs uppercase font-extrabold text-white tracking-wider flex items-center gap-2">
                    <Download className="w-4 h-4 text-green-400" />
                    2. Shopify Product CSV Export
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Selected products will be formatted to match Shopify's official product migration CSV format.
                  </p>

                  <div className="space-y-4 pt-1">
                    <div className="p-3 bg-black/40 border border-glass-border rounded-xl flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-bold">Selected Products</span>
                      <span className="font-extrabold text-green-400 font-mono">
                        {fetchedWpProducts.filter(p => selectedProductIds[p.id]).length} / {fetchedWpProducts.length}
                      </span>
                    </div>

                    <button
                      onClick={handleDownloadShopifyCSV}
                      disabled={isFetchingWp || fetchedWpProducts.filter(p => selectedProductIds[p.id]).length === 0}
                      className={`w-full flex items-center justify-center gap-2 font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all shadow-lg cursor-pointer ${
                        downloadedCSV
                          ? 'bg-green-500/30 text-green-300 border border-green-400 scale-102 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                          : 'bg-brand-green hover:bg-brand-green-hover text-black glow-green disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {downloadedCSV ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3] animate-pulse" />
                          <span>Shopify CSV Downloaded!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 stroke-[3]" />
                          <span>Download Shopify CSV</span>
                        </>
                      )}
                    </button>

                    <div className="text-[11px] text-gray-400 space-y-2 border-t border-glass-border/30 pt-3 text-left leading-relaxed">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">Importing into Shopify:</span>
                      <div className="flex gap-2">
                        <span className="text-green-400 font-bold">Step 1:</span>
                        <span>Open your target Shopify Admin dashboard (e.g. <code>https://admin.shopify.com/</code>).</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-green-400 font-bold">Step 2:</span>
                        <span>Navigate to <strong>Products</strong> on the left navigation.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-green-400 font-bold">Step 3:</span>
                        <span>Click the <strong>Import</strong> button at the top right.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-green-400 font-bold">Step 4:</span>
                        <span>Upload the downloaded CSV and click **Upload and preview**.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className={auditStyles.cardContainer}>
                  <div className="flex justify-between items-center border-b border-glass-border pb-2">
                    <h3 className="text-xs uppercase font-extrabold text-white tracking-wider flex items-center gap-2">
                      <Database className="w-4 h-4 text-green-400" />
                      Fetched Catalog ({fetchedWpProducts.length} Items)
                    </h3>
                    {fetchedWpProducts.length > 0 && (
                      <button
                        onClick={() => {
                          const allSelected = fetchedWpProducts.every(p => selectedProductIds[p.id]);
                          const updated: Record<string, boolean> = {};
                          fetchedWpProducts.forEach(p => {
                            updated[p.id] = !allSelected;
                          });
                          setSelectedProductIds(updated);
                        }}
                        className="text-[10px] text-green-400 hover:text-green-300 font-bold uppercase cursor-pointer"
                      >
                        {fetchedWpProducts.every(p => selectedProductIds[p.id]) ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  <div className="max-h-[350px] overflow-y-auto space-y-2.5 pr-1">
                    {fetchedWpProducts.length > 0 ? (
                      fetchedWpProducts.map((prod) => {
                        const isChecked = !!selectedProductIds[prod.id];
                        return (
                          <div 
                            key={prod.id}
                            className="p-3 bg-black/40 border border-glass-border hover:border-glass-border/30 rounded-lg flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {
                                  setSelectedProductIds(prev => ({
                                    ...prev,
                                    [prod.id]: !prev[prod.id]
                                  }));
                                }}
                                className="w-4 h-4 accent-green-500 rounded border-glass-border bg-black cursor-pointer"
                              />
                              {prod.images?.[0]?.src ? (
                                <img src={prod.images[0].src} alt="" className="w-10 h-10 object-cover rounded-lg border border-glass-border" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg border border-glass-border bg-white/5 flex items-center justify-center text-[9px] text-gray-600">No Image</div>
                              )}
                              <div className="space-y-0.5 text-left">
                                <span className="font-bold text-white block line-clamp-1">{prod.title}</span>
                                <span className="text-[10px] text-gray-500 block">{prod.product_type} • {prod.variants?.length || 1} Variant(s)</span>
                              </div>
                            </div>
                            <div className="text-right font-mono font-bold text-green-400">
                              ${prod.variants?.[0]?.price || '0.00'}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-gray-500 text-xs italic">
                        No products fetched yet. Enter a WooCommerce URL on the left and fetch products.
                      </div>
                    )}
                  </div>
                </div>

                {/* Console Log */}
                <div className={auditStyles.cardContainer}>
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-green-400" />
                    Migration Console output
                  </span>
                  <div className={auditStyles.consoleBox + " h-[160px]"}>
                    {migrationLogs.length > 0 ? (
                      migrationLogs.map((log, idx) => (
                        <div key={idx} className="leading-normal">{log}</div>
                      ))
                    ) : (
                      <div className="text-gray-600 italic">Logs will appear here once migration begins...</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
