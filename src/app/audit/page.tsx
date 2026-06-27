'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Code
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
  const [activeTab, setActiveTab] = useState<'speed'>('speed');
  
  // Speed Audit states
  const [storeUrl, setStoreUrl] = useState('fitestore-2.myshopify.com');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    'app-purge': true,
    'img-scaling': true,
    'lazy-loading': false
  });
  const [copiedReport, setCopiedReport] = useState(false);

  useEffect(() => {
    store.hydrate();
  }, []);

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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
    if (score >= 70) return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10';
    return 'text-red-400 border-red-500/20 bg-red-500/10';
  };

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white uppercase">Shopify Audit Suite</h1>
        <p className="text-gray-400 text-sm font-medium">
          Generate PageSpeed performance delivery reports.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-glass-border">
        <button
          onClick={() => setActiveTab('speed')}
          className={`px-5 py-3 text-xs uppercase font-extrabold tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'speed' 
              ? 'border-green-500 text-green-400' 
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Shopify Speed Audit Planner</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
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
      </AnimatePresence>
    </div>
  );
}
