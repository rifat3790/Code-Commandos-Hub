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
  FolderSync
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';

interface AuditItem {
  id: string;
  name: string;
  weight: number; // impact on speed score
  category: 'assets' | 'apps' | 'dom' | 'scripts';
  description: string;
}

const AUDIT_CHECKLIST: AuditItem[] = [
  { id: 'app-purge', name: 'Uninstall Unused Shopify Apps & Leftover Scripts', weight: 20, category: 'apps', description: 'Removes unused theme themeappextensions and trailing JavaScript payloads.' },
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
  const [activeTab, setActiveTab] = useState<'speed' | 'inspect'>('inspect');
  
  // Speed Audit states
  const [storeUrl, setStoreUrl] = useState('fitestore-2.myshopify.com');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    'app-purge': true,
    'img-scaling': true,
    'lazy-loading': false
  });
  const [copiedReport, setCopiedReport] = useState(false);

  // Tech & Product Inspector states
  const [inspectUrl, setInspectUrl] = useState('');
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
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isZippingImages, setIsZippingImages] = useState(false);
  const [techInfo, setTechInfo] = useState<{ technology: string; isShopify: boolean; domain: string; theme?: {name: string, id: string, role: string, originalName?: string}; apps?: string[]; pixels?: string[]; socials?: string[]; emails?: string[] } | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 });
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    store.hydrate();

    // Listen for extension installation
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

    // Listen for extension bridge events
    const handleProgress = (e: any) => setExtensionProgress({ percent: e.detail.percent, message: e.detail.message });
    const handleComplete = () => {
      setIsExportingTheme(false);
      setExtensionProgress(null);
      addLog('Theme downloaded successfully via Extension!', 'success');
      toast.success('Theme successfully exported via Extension');
    };
    const handleError = (e: any) => {
      setIsExportingTheme(false);
      setExtensionProgress(null);
      addLog('Extension Export Error: ' + e.detail.message, 'error');
      toast.error(e.detail.message || 'Extension export failed');
    };

    window.addEventListener('SHOPIFY_EXPORT_PROGRESS', handleProgress);
    window.addEventListener('SHOPIFY_EXPORT_COMPLETE', handleComplete);
    window.addEventListener('SHOPIFY_EXPORT_ERROR', handleError);

    return () => {
      window.removeEventListener('message', handleMessage);
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

  // Calculate dynamic PageSpeed score
  const speedScore = useMemo(() => {
    let score = 38; // base initial score
    AUDIT_CHECKLIST.forEach(item => {
      if (checkedItems[item.id]) {
        score += item.weight;
      }
    });
    return Math.min(99, score);
  }, [checkedItems]);

  const handleToggleAuditItem = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Compile final speed delivery report
  const speedReportText = useMemo(() => {
    const optimized = AUDIT_CHECKLIST.filter(item => checkedItems[item.id]);
    const remaining = AUDIT_CHECKLIST.filter(item => !checkedItems[item.id]);

    return `Shopify Store Speed Audit & Optimization Report
------------------------------------------------------
Store: ${storeUrl}
Simulated Mobile Performance Score: ${speedScore}/100

Optimizations Successfully Completed:
${optimized.map((o, idx) => `${idx + 1}. [Completed] ${o.name}\n   - Impact: ${o.description}`).join('\n')}

Pending Recommendations:
${remaining.map((r, idx) => `${idx + 1}. [Recommended] ${r.name}\n   - Impact: ${r.description}`).join('\n')}

Note: All audits were performed locally. These speed improvements reduce total blocking time, LCP (Largest Contentful Paint), and improve mobile responsiveness.

Report generated on Code Commandos Speed Audit Suite.`;
  }, [storeUrl, speedScore, checkedItems]);

  const handleCopyReport = () => {
    navigator.clipboard.writeText(speedReportText);
    setCopiedReport(true);
    store.logActivity('Speed Report Copied', 'template', `Generated speed report for ${storeUrl}`);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // LOGGING UTILITY
  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'success' ? '✔ [SUCCESS]' : type === 'error' ? '✖ [ERROR]' : 'ℹ [INFO]';
    setScanLogs(prev => [...prev, `[${timestamp}] ${prefix} ${message}`]);
  };

  // CRAWLER & INSPECTOR FLOW
  const handleStartScan = async () => {
    if (!inspectUrl.trim()) {
      setScanError('Please enter a valid URL or domain.');
      return;
    }

    setScanStatus('detecting');
    setScanError('');
    setTechInfo(null);
    setCollections([]);
    setAllProducts([]);
    setFetchProgress({ current: 0, total: 0 });
    
    const timestamp = new Date().toLocaleTimeString();
    setScanLogs([`[${timestamp}] ℹ [INFO] Starting store analysis for: ${inspectUrl}`]);

    try {
      addLog('Probing website technology and headers...');
      
      let apiUrl = `/api/analyze-site/detect?url=${encodeURIComponent(inspectUrl.trim())}`;
      if (storePassword) {
        apiUrl += `&storePassword=${encodeURIComponent(storePassword)}`;
        addLog('Attempting password bypass...', 'info');
      }

      const detectRes = await fetch(apiUrl);
      const detectData = await detectRes.json();

      if (!detectRes.ok || !detectData.success) {
        throw new Error(detectData.error || 'Failed to detect technology.');
      }

      if (detectData.isPasswordProtected) {
        setIsPasswordProtected(true);
        addLog('Store is password protected. Please enter the storefront password to continue scanning.', 'info');
        setScanStatus('idle');
        return;
      } else {
        setIsPasswordProtected(false);
      }

      setTechInfo({
        technology: detectData.technology,
        isShopify: detectData.isShopify,
        domain: detectData.domain,
        theme: detectData.theme,
        apps: detectData.apps,
        pixels: detectData.pixels,
        socials: detectData.socials,
        emails: detectData.emails
      });

      if (detectData.theme?.originalName) addLog(`Original Theme Match: ${detectData.theme.originalName}`, 'success');
      if (detectData.theme?.name) addLog(`Theme renamed to: ${detectData.theme.name}`, 'info');
      if (detectData.apps?.length > 0) addLog(`Detected ${detectData.apps.length} Shopify apps`, 'success');
      if (detectData.pixels?.length > 0) addLog(`Detected ${detectData.pixels.length} marketing pixels`, 'success');

      addLog(`Normalized domain: ${detectData.domain}`, 'success');
      addLog(`Technology detected: ${detectData.technology}`, 'success');

      store.logActivity('Website Scanned', 'note', `Scanned: ${detectData.domain} (${detectData.technology})`);

      if (!detectData.isShopify) {
        addLog('Non-Shopify website detected. Product inspection and CSV export are only available for Shopify stores.', 'info');
        setScanStatus('completed');
        return;
      }

      // Shopify detected! Load collections
      const initialCollections = detectData.collections || [];
      setCollections(initialCollections.map((c: any) => ({
        ...c,
        productCount: 0,
        products: [],
        isLoading: false
      })));
      addLog(`Loaded ${initialCollections.length} public collections from collections.json`, 'success');

      // Fetch all products page by page
      setScanStatus('fetching_products');
      addLog('Fetching store products (fetching 250 items per page)...');

      let page = 1;
      let hasMore = true;
      let tempAllProducts: any[] = [];

      while (hasMore) {
        addLog(`Scraping products page ${page}...`);
        const prodRes = await fetch(`/api/analyze-site/products?domain=${detectData.domain}&page=${page}&limit=250&storePassword=${encodeURIComponent(storePassword)}&sessionCookie=${encodeURIComponent(detectData.sessionCookie || '')}`);
        if (!prodRes.ok) {
          addLog(`Error fetching products page ${page}. Stopping.`, 'error');
          break;
        }

        const prodData = await prodRes.json();
        if (!prodData.success) {
          addLog(`Failed to fetch page ${page}: ${prodData.error}`, 'error');
          break;
        }

        const pageProducts = prodData.products || [];
        tempAllProducts = [...tempAllProducts, ...pageProducts];
        setAllProducts(tempAllProducts);
        setFetchProgress({ current: tempAllProducts.length, total: tempAllProducts.length });
        addLog(`Page ${page}: Fetched ${pageProducts.length} products. Cumulative total: ${tempAllProducts.length}`, 'success');

        if (pageProducts.length < 250) {
          hasMore = false;
        } else {
          page++;
        }
      }

      addLog(`Product crawling complete. Total products loaded: ${tempAllProducts.length}`, 'success');

      // Map products to collections
      if (initialCollections.length > 0) {
        setScanStatus('mapping_collections');
        addLog('Mapping products to collections...');

        for (const collection of initialCollections) {
          addLog(`Fetching products for collection: "${collection.title}" (${collection.handle})...`);
          
          // Mark collection loading in UI
          setCollections(prev => prev.map(c => c.handle === collection.handle ? { ...c, isLoading: true } : c));

          let collPage = 1;
          let collHasMore = true;
          let collProducts: any[] = [];

          while (collHasMore) {
            const collProdRes = await fetch(`/api/analyze-site/products?domain=${detectData.domain}&collection=${collection.handle}&page=${collPage}&limit=250&storePassword=${encodeURIComponent(storePassword)}&sessionCookie=${encodeURIComponent(detectData.sessionCookie || '')}`);
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

          addLog(`Mapped ${collProducts.length} products to collection "${collection.title}".`, 'success');
          
          const updatedColl = {
            ...collection,
            productCount: collProducts.length,
            products: collProducts,
            isLoading: false
          };

          // Update state in real-time
          setCollections(prev => prev.map(c => c.handle === collection.handle ? updatedColl : c));
        }
      }

      addLog('All store audits and crawlings completed successfully.', 'success');
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
        if (!isExtensionInstalled) {
           throw new Error("Theme Exporter Chrome Extension is not installed or active.");
        }
        window.dispatchEvent(new CustomEvent('START_SHOPIFY_EXPORT', { detail: { url: inspectUrl.trim() } }));
        return;
      }

      let exportUrl = `/api/analyze-site/export-theme?url=${encodeURIComponent(inspectUrl.trim())}`;
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
    if (!inspectUrl.trim()) {
      alert('Please enter a website URL first.');
      return;
    }
    setIsLoadingImages(true);
    setDetectedImages([]);
    addLog('Initiating media asset scraping from storefront HTML...', 'info');

    try {
      let apiUrl = `/api/analyze-site/images?url=${encodeURIComponent(inspectUrl.trim())}`;
      if (storePassword) {
        apiUrl += `&storePassword=${encodeURIComponent(storePassword)}`;
      }

      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to scrape images.');
      }

      setDetectedImages(data.images || []);
      addLog(`Media Scrape Complete! Discovered ${data.images?.length || 0} unique images.`, 'success');
    } catch (err: any) {
      addLog(`Image loading failed: ${err.message}`, 'error');
      alert(`Failed to load images: ${err.message}`);
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

  // EXPORT TO SHOPIFY CSV UTILITY
  const handleExportCSV = (products: any[], title: string) => {
    if (!products || products.length === 0) {
      alert('No products available for export.');
      return;
    }

    const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-shopify-products.csv`;
    
    // Shopify CSV columns schema
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

        row.push(handle); // Handle
        row.push(isFirstRow ? productTitle : ''); // Title
        row.push(isFirstRow ? bodyHtml : ''); // Body (HTML)
        row.push(isFirstRow ? vendor : ''); // Vendor
        row.push(''); // Product Category
        row.push(isFirstRow ? productType : ''); // Type
        row.push(isFirstRow ? tags : ''); // Tags
        row.push(isFirstRow ? published : ''); // Published

        row.push(isFirstRow ? option1Name : ''); // Option1 Name
        row.push(variant ? (variant.option1 || '') : ''); // Option1 Value
        row.push(isFirstRow ? option2Name : ''); // Option2 Name
        row.push(variant ? (variant.option2 || '') : ''); // Option2 Value
        row.push(isFirstRow ? option3Name : ''); // Option3 Name
        row.push(variant ? (variant.option3 || '') : ''); // Option3 Value

        row.push(variant?.sku || ''); // Variant SKU
        row.push(variant?.grams !== undefined ? String(variant.grams) : ''); // Variant Grams
        row.push(variant ? 'shopify' : ''); // Variant Inventory Tracker
        row.push(variant ? '1' : ''); // Variant Inventory Qty
        row.push(variant ? 'deny' : ''); // Variant Inventory Policy
        row.push(variant ? 'manual' : ''); // Variant Fulfillment Service
        row.push(variant?.price || ''); // Variant Price
        row.push(variant?.compare_at_price || ''); // Variant Compare At Price
        row.push(variant ? String(variant.requires_shipping ?? true) : ''); // Variant Requires Shipping
        row.push(variant ? String(variant.taxable ?? true) : ''); // Variant Taxable
        row.push(variant?.barcode || ''); // Variant Barcode

        row.push(image?.src || ''); // Image Src
        row.push(image?.position !== undefined ? String(image.position) : ''); // Image Position
        row.push(image?.alt || ''); // Image Alt Text

        row.push(isFirstRow ? 'false' : ''); // Gift Card
        row.push(''); // SEO Title
        row.push(''); // SEO Description

        // Google Shopping
        row.push(''); row.push(''); row.push(''); row.push(''); row.push('');
        row.push(''); row.push(''); row.push(''); row.push(''); row.push('');
        row.push(''); row.push(''); row.push(''); row.push('');

        row.push(variant?.featured_image?.src || ''); // Variant Image
        row.push(variant ? (variant.weight_unit || 'kg') : ''); // Variant Weight Unit
        row.push(''); // Variant Tax Code
        row.push(''); // Cost per item
        row.push(isFirstRow ? status : ''); // Status

        rows.push(row);
      }
    });

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
    <div className="space-y-6 pb-12 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white uppercase flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-green-400" />
          Store Intelligence & Audit Suite
        </h1>
        <p className="text-gray-400 text-sm font-medium mt-1">
          Generate PageSpeed performance reports, uncover store technology stacks, and export product catalogs in a flash.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-glass-border">
        <button
          onClick={() => setActiveTab('inspect')}
          className={`px-5 py-3 text-xs uppercase font-extrabold tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'inspect' 
              ? 'border-green-500 text-green-400 shadow-[0_4px_20px_-10px_rgba(34,197,94,0.4)]' 
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Store Intelligence Inspector</span>
        </button>
        <button
          onClick={() => setActiveTab('speed')}
          className={`px-5 py-3 text-xs uppercase font-extrabold tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'speed' 
              ? 'border-green-500 text-green-400 shadow-[0_4px_20px_-10px_rgba(34,197,94,0.4)]' 
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Shopify Speed Audit Planner</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'speed' ? (
          <motion.div 
            key="speed-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6"
          >
            {/* Optimization List */}
            <div className="xl:col-span-7 space-y-6">
              <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider block">Shopify Store URL</label>
                  <input
                    type="text"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                  />
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider block border-b border-glass-border pb-1">
                    Speed Optimizations Completed
                  </span>

                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {AUDIT_CHECKLIST.map((item) => {
                      const checked = checkedItems[item.id] || false;
                      return (
                        <div 
                          key={item.id}
                          onClick={() => handleToggleAuditItem(item.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 text-xs ${
                            checked 
                              ? 'bg-green-500/10 border-green-500/20 text-white' 
                              : 'bg-gray-950/40 border-glass-border text-gray-400 hover:text-white'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                            checked ? 'bg-green-500 border-green-500 text-black' : 'border-glass-border'
                          }`}>
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-bold">{item.name}</p>
                            <p className="text-[10px] text-gray-500">{item.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Speed Gauge & Generated Report */}
            <div className="xl:col-span-5 space-y-6">
              {/* Score Gauge */}
              <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 text-center flex flex-col items-center justify-center relative overflow-hidden h-[180px]">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
                <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">Simulated PageSpeed Score</span>
                
                <div className="mt-3 relative flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-4 border-dashed border-gray-800 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-black ${
                      speedScore >= 90 ? 'text-emerald-400' : speedScore >= 70 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {speedScore}
                    </span>
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold">Mobile</span>
                  </div>
                </div>
              </div>

              {/* Delivery Report Box */}
              <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
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

                <div className="bg-black/40 border border-glass-border p-3 rounded-lg text-[11px] font-mono text-gray-300 h-56 overflow-y-auto leading-relaxed whitespace-pre-wrap select-all">
                  {speedReportText}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="inspect-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6"
          >
            {/* Input & Scanner Log */}
            <div className="xl:col-span-7 space-y-6">
              <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider block">Website URL / Domain</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={inspectUrl}
                        onChange={(e) => setInspectUrl(e.target.value)}
                        placeholder="e.g. fashionstore.myshopify.com or brandname.com"
                        className="w-full pl-9 pr-3 py-2 rounded-lg glass-input text-xs"
                        disabled={scanStatus === 'detecting' || scanStatus === 'fetching_products' || scanStatus === 'mapping_collections'}
                      />
                    </div>
                    <button
                      onClick={handleStartScan}
                      disabled={scanStatus === 'detecting' || scanStatus === 'fetching_products' || scanStatus === 'mapping_collections'}
                      className="px-4 py-2 bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {scanStatus === 'detecting' || scanStatus === 'fetching_products' || scanStatus === 'mapping_collections' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 fill-black" />
                      )}
                      <span>Analyze</span>
                    </button>
                  </div>
                  {scanError && (
                    <p className="text-red-400 text-xs flex items-center gap-1.5 mt-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{scanError}</span>
                    </p>
                  )}

                  {isPasswordProtected && (
                    <div className="space-y-1 mt-3 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 blur-3xl rounded-full pointer-events-none" />
                      <label className="text-[10px] text-yellow-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Password Protected Store
                      </label>
                      <p className="text-[11px] text-yellow-500/80 mb-2 font-medium">Enter the storefront password to bypass the lock screen and extract hidden data.</p>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={storePassword}
                          onChange={(e) => setStorePassword(e.target.value)}
                          placeholder="Enter storefront password..."
                          className="w-full px-3 py-2 rounded-lg bg-black/40 text-xs border border-yellow-500/30 focus:border-yellow-400 focus:outline-none text-white placeholder-gray-600 transition-all"
                          onKeyDown={(e) => e.key === 'Enter' && handleStartScan()}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {(scanStatus === 'fetching_products' || scanStatus === 'mapping_collections') && (
                  <div className="space-y-1.5 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-yellow-400">
                      <span>Crawling Shopify Products</span>
                      <span>{fetchProgress.current} Items</span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-yellow-400 h-1.5 rounded-full transition-all duration-300 animate-pulse" 
                        style={{ width: `${Math.min(100, Math.max(10, (fetchProgress.current % 250) / 2.5))}%` }} 
                      />
                    </div>
                  </div>
                )}

                {/* Terminal Console */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-green-400" />
                    <span>Audit Scanner Console Output</span>
                  </span>
                  
                  <div className="bg-black/75 border border-glass-border p-4 rounded-xl text-xs font-mono text-green-400 h-[280px] overflow-y-auto space-y-1.5 flex flex-col scrollbar-thin">
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
              </div>

              {/* Media Asset Inspector */}
              {techInfo && (
                <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 relative overflow-hidden space-y-4">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500" />
                  
                  <div className="flex justify-between items-center border-b border-glass-border pb-2.5">
                    <span className="text-[10px] text-yellow-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                      <span>Media Asset Inspector</span>
                    </span>
                    {detectedImages.length > 0 && (
                      <span className="text-[10px] font-black text-yellow-400 font-mono bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded">
                        {detectedImages.length} IMAGES
                      </span>
                    )}
                  </div>

                  {detectedImages.length === 0 ? (
                    <button
                      onClick={handleLoadImages}
                      disabled={isLoadingImages}
                      className="w-full flex items-center justify-center gap-2 bg-yellow-500/5 hover:bg-yellow-500/10 text-yellow-400 font-extrabold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg border border-yellow-500/20 transition-all cursor-pointer shadow-[inset_0_0_15px_rgba(234,179,8,0.02)]"
                    >
                      {isLoadingImages ? (
                        <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                      ) : (
                        <FolderSync className="w-4 h-4 text-yellow-500" />
                      )}
                      <span>Load Store Images</span>
                    </button>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      {/* Controls */}
                      <div className="flex justify-between items-center gap-2">
                        <button
                          onClick={handleLoadImages}
                          disabled={isLoadingImages}
                          className="px-3.5 py-1.5 bg-white/5 border border-glass-border hover:bg-white/10 rounded-lg text-[10px] font-bold text-gray-300 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-yellow-500 ${isLoadingImages ? 'animate-spin' : ''}`} />
                          <span>Reload Gallery</span>
                        </button>
                        <button
                          onClick={handleDownloadAllImages}
                          disabled={isZippingImages}
                          className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-[10px] font-black text-black transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20"
                        >
                          {isZippingImages ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                          <span>Download All (ZIP)</span>
                        </button>
                      </div>

                      {/* Image Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                        {detectedImages.map((img, idx) => (
                          <div 
                            key={idx}
                            className="group relative aspect-square bg-black/60 rounded-xl overflow-hidden border border-glass-border hover:border-yellow-500/30 transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
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

            {/* Results Sidebar */}
            <div className="xl:col-span-5 space-y-6">
              {/* Technology details card */}
              <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 relative overflow-hidden space-y-4">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-green-500 to-emerald-500" />
                <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider block">Inspector Metrics</span>
                
                {techInfo ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-gray-400 font-semibold">Store Domain</span>
                      <h4 className="text-sm font-extrabold text-white font-mono mt-0.5">{techInfo.domain}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white/5 border border-glass-border rounded-lg text-center shadow-[inset_0_0_15px_rgba(255,255,255,0.02)]">
                        <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Technology</span>
                        <div className="mt-1 inline-flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded text-[11px] text-green-400 font-bold">
                          <Zap className="w-3 h-3 fill-green-400" />
                          <span>{techInfo.technology}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white/5 border border-glass-border rounded-lg text-center shadow-[inset_0_0_15px_rgba(255,255,255,0.02)]">
                        <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Total Products</span>
                        <span className="text-lg font-black text-white block mt-0.5">{allProducts.length}</span>
                      </div>
                    </div>

                    {techInfo.theme && (
                      <div className="p-4 bg-black/40 border border-glass-border rounded-lg flex flex-col relative overflow-hidden space-y-3">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-green/10 blur-3xl rounded-full pointer-events-none" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Code className="w-3 h-3 text-brand-green" /> Theme Architecture
                          </span>
                          
                          {/* Export Method Toggle */}
                          <div className="flex bg-black/40 border border-glass-border rounded p-0.5 text-[9px] font-bold">
                            <button
                              onClick={() => setExportMethod('public')}
                              className={`px-1.5 py-0.5 rounded transition-all ${exportMethod === 'public' ? 'bg-brand-green text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                              Public Clone
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
                              Extension (100% Org)
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-xs text-gray-400 block mb-0.5">Original Blueprint</span>
                            <span className="text-base font-black text-white">{techInfo.theme.originalName || 'Unknown'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-500 block mb-0.5">Active/Renamed As</span>
                            <span className="text-xs font-bold text-gray-300">{techInfo.theme.name}</span>
                          </div>
                        </div>

                        {exportMethod === 'admin' && (
                          <div className="space-y-2 p-3 rounded bg-yellow-500/5 border border-yellow-500/20 text-[10px] animate-in fade-in duration-200">
                            <label className="text-yellow-500 font-bold block">Shopify Admin API Token</label>
                            <input
                              type="password"
                              value={adminToken}
                              onChange={(e) => setAdminToken(e.target.value)}
                              placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                              className="w-full px-2 py-1.5 bg-black/40 border border-yellow-500/25 rounded text-[10px] text-white focus:outline-none focus:border-yellow-400 transition-all font-mono"
                            />
                            
                            <div className="pt-2 border-t border-yellow-500/10 space-y-1.5 text-[9px] text-gray-400 font-medium">
                              <span className="text-yellow-500 font-bold block">How to get a token in 30 seconds:</span>
                              <ol className="space-y-0.5 list-decimal pl-3 leading-relaxed">
                                <li>Go to Shopify Admin &rarr; <span className="text-white">Settings</span> &rarr; <span className="text-white">Apps and sales channels</span>.</li>
                                <li>Click <span className="text-white">Develop apps</span> &rarr; <span className="text-white">Create an app</span>.</li>
                                <li>Click <span className="text-yellow-500">Configure Admin API integration</span>.</li>
                                <li>Tick <span className="text-white font-mono">read_themes</span> / <span className="text-white font-mono">write_themes</span> scopes.</li>
                                <li>Click <span className="text-white">Install app</span> and copy the Access Token.</li>
                              </ol>
                              <p className="text-yellow-500/90 font-bold leading-normal mt-1">
                                💡 Required to fetch raw Liquid files, sections, and backend snippets. Public Clone only downloads public CSS, JS, and HTML.
                              </p>
                            </div>
                          </div>
                        )}

                        {exportMethod === 'extension' && (
                          <div className="space-y-2 p-3 rounded bg-purple-500/5 border border-purple-500/20 text-[10px] animate-in fade-in duration-200">
                            {isExtensionInstalled ? (
                              <>
                                <p className="text-purple-400 font-bold flex items-center gap-1.5">
                                  <ShieldCheck className="w-4 h-4 text-purple-400" /> Extension Connected Successfully
                                </p>
                                <p className="text-gray-400">Click Export and we will securely fetch the original files using your active Shopify browser session.</p>
                                
                                {extensionProgress && (
                                  <div className="mt-2 space-y-1.5 p-2 rounded bg-black/30 border border-purple-500/10">
                                    <div className="flex justify-between items-center text-[9px] uppercase font-bold text-purple-400">
                                      <span>{extensionProgress.message}</span>
                                      <span>{extensionProgress.percent}%</span>
                                    </div>
                                    <div className="w-full bg-gray-900 rounded-full h-1">
                                      <div 
                                        className="bg-purple-500 h-1 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(168,85,247,0.8)]" 
                                        style={{ width: `${extensionProgress.percent}%` }} 
                                      />
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <p className="text-red-400 font-bold flex items-center gap-1.5">
                                  <AlertCircle className="w-4 h-4 text-red-400" /> Extension Not Found
                                </p>
                                <p className="text-gray-400">Please install and enable the Theme Exporter Chrome Extension to use this feature.</p>
                              </>
                            )}
                          </div>
                        )}

                        <div className="pt-2 border-t border-glass-border/50 flex justify-between items-center text-[10px] text-gray-500 font-mono">
                          <div className="flex flex-col gap-0.5">
                            <span>ID: {techInfo.theme.id}</span>
                            <span>Role: {techInfo.theme.role}</span>
                          </div>
                          
                          <button
                            onClick={handleExportTheme}
                            disabled={isExportingTheme || (exportMethod === 'extension' && !isExtensionInstalled)}
                            className={`px-2.5 py-1 font-extrabold text-[10px] uppercase tracking-wider rounded transition-all flex items-center gap-1 disabled:opacity-50 ${exportMethod === 'admin' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : exportMethod === 'extension' ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-brand-green hover:bg-brand-green-hover text-black'}`}
                          >
                            {isExportingTheme ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>{exportMethod === 'admin' || exportMethod === 'extension' ? 'Export Original' : 'Export Clone'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {techInfo.apps && techInfo.apps.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider flex items-center gap-1">
                          <Zap className="w-3 h-3 text-brand-green" /> Detected App Stack
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {techInfo.apps.map(app => (
                            <span key={app} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-bold text-gray-300 hover:text-white hover:border-green-500/50 hover:bg-green-500/10 hover:shadow-[0_0_10px_rgba(34,197,94,0.2)] cursor-default transition-all">
                              {app}
                            </span>
                          ))}
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
                            <span key={px} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-bold text-blue-300 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/10 transition-all cursor-default">
                              {px}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {((techInfo.socials && techInfo.socials.length > 0) || (techInfo.emails && techInfo.emails.length > 0)) && (
                      <div className="space-y-3 pt-3 border-t border-glass-border mt-4">
                        <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider flex items-center gap-1">
                          <Globe className="w-3 h-3 text-purple-400" /> Brand Presence
                        </span>
                        <div className="flex flex-col gap-1.5 text-xs">
                          {techInfo.emails?.map(email => (
                            <a key={email} href={`mailto:${email}`} className="text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-2">
                              ✉️ {email}
                            </a>
                          ))}
                          {techInfo.socials?.map(social => (
                            <a key={social} href={social} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white hover:underline truncate max-w-full block">
                              🔗 {social.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {techInfo.isShopify && (
                      <div className="space-y-3 pt-2 border-t border-glass-border">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Public Collections</span>
                          <span className="font-bold text-white">{collections.length}</span>
                        </div>

                        {allProducts.length > 0 && (
                          <button
                            onClick={() => handleExportCSV(allProducts, `${techInfo.domain}-all-products`)}
                            className="w-full flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg transition-all shadow-lg glow-green"
                          >
                            <Download className="w-4 h-4 stroke-[3]" />
                            <span>Export All Products (CSV)</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-xs italic">
                    Scan a store to populate inspector details.
                  </div>
                )}
              </div>

              {/* Collections Breakdowns */}
              {techInfo?.isShopify && collections.length > 0 && (
                <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
                  <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider flex items-center justify-between border-b border-glass-border pb-1.5">
                    <span>Collections Breakdown</span>
                    <span className="text-green-400">{collections.length} items</span>
                  </span>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {collections.map((coll) => (
                      <div 
                        key={coll.id}
                        className="p-3 bg-black/40 border border-glass-border hover:border-glass-border/30 rounded-lg flex justify-between items-center text-xs"
                      >
                        <div className="space-y-0.5">
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
                            onClick={() => handleExportCSV(coll.products, `${techInfo.domain}-${coll.handle}`)}
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
        )}
      </AnimatePresence>
    </div>
  );
}

