'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Upload, 
  Trash2, 
  Settings, 
  Database, 
  Palette, 
  Info, 
  Check, 
  FileJson,
  ShieldCheck
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function SettingsPage() {
  const store = useWorkspaceStore();
  const [accent, setAccent] = useState('green');
  const [storageUsage, setStorageUsage] = useState('0 KB');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    store.hydrate();
    calculateStorageUsage();
  }, []);

  const calculateStorageUsage = () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('code_commandos_store');
      if (stored) {
        const bytes = new Blob([stored]).size;
        setStorageUsage((bytes / 1024).toFixed(2) + ' KB');
      } else {
        setStorageUsage('0 KB');
      }
    } catch (e) {
      console.error(e);
      setStorageUsage('Unknown');
    }
  };

  const handleExportBackup = () => {
    const dataStr = store.exportBackup();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `code-commandos-backup-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    store.logActivity('Workspace Backup Exported', 'download', 'Backup configurations file compiled.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string || '';
      const success = store.importBackup(text);
      if (success) {
        setImportStatus('success');
        calculateStorageUsage();
        setTimeout(() => setImportStatus('idle'), 3000);
      } else {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllStorage = () => {
    localStorage.removeItem('code_commandos_store');
    localStorage.removeItem('cc_analyzer_history');
    window.location.reload();
  };

  const accents = [
    { name: 'green', color: 'bg-green-500', border: 'border-green-500/30' },
    { name: 'blue', color: 'bg-blue-500', border: 'border-blue-500/30' },
    { name: 'purple', color: 'bg-purple-500', border: 'border-purple-500/30' },
    { name: 'orange', color: 'bg-orange-500', border: 'border-orange-500/30' },
    { name: 'gray', color: 'bg-gray-400', border: 'border-gray-400/30' },
  ];

  return (
    <div className="space-y-6 pb-12 text-left max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">SYSTEM SETTINGS</h1>
        <p className="text-gray-400 text-sm">Configure developer hub accent templates, download system backups, and purge localStorage caches.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Backup and Database Purge */}
        <div className="space-y-6">
          
          {/* Backup Panel */}
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-green-400" />
              <span>Backup & Restore Data</span>
            </h3>
            
            <p className="text-xs text-gray-500 leading-relaxed">
              Code Commandos operates 100% locally. Download a backup of your profile details, custom templates, chat threads, sticky notes, and checklist workflows.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleExportBackup}
                className="px-4 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 glow-green w-full"
              >
                <Download className="w-4 h-4" />
                <span>Export Backup</span>
              </button>

              <div className="relative overflow-hidden w-full">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <button type="button" className="w-full px-4 py-2.5 rounded-lg bg-gray-900 border border-glass-border hover:bg-glass-hover text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Import Backup</span>
                </button>
              </div>
            </div>

            {/* Alert status indicators */}
            {importStatus === 'success' && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400 flex items-center gap-2 animate-pulse">
                <Check className="w-4 h-4" />
                <span>Data backup successfully restored! Workspace refreshed.</span>
              </div>
            )}
            {importStatus === 'error' && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>Failed to import backup file. Ensure file structure is correct JSON.</span>
              </div>
            )}
          </div>

          {/* Purge / Delete Storage Panel */}
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 text-red-400">
              <Trash2 className="w-4.5 h-4.5 text-red-400" />
              <span>System Wipe Out</span>
            </h3>
            
            <p className="text-xs text-gray-500 leading-relaxed">
              If your cache storage capacity limits are exceeded or you want to restart as a clean build, wipe out the local database cache. This action is irreversible.
            </p>

            <button
              onClick={handleClearAllStorage}
              className="w-full py-2.5 rounded-lg bg-red-950/20 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Purge Local Workspace</span>
            </button>
          </div>

        </div>

        {/* Right Column: Accent colors & Workspace Stats */}
        <div className="space-y-6">
          
          {/* Accent Color picker */}
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4.5 h-4.5 text-green-400" />
              <span>UI Accent Colors</span>
            </h3>
            
            <p className="text-xs text-gray-500 leading-relaxed">
              Modify UI highlights color themes (Note: System theme locks default dark backgrounds for glassmorphic layouts premium contrast).
            </p>

            <div className="flex gap-3 pt-2">
              {accents.map((acc) => (
                <button
                  key={acc.name}
                  onClick={() => setAccent(acc.name)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${acc.color} ${
                    accent === acc.name ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70'
                  }`}
                >
                  {accent === acc.name && <Check className="w-4 h-4 text-black stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Storage Capacity Monitor */}
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4.5 h-4.5 text-green-400" />
              <span>Storage Monitor</span>
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">LocalStorage Registry Space</span>
                  <span className="text-white font-bold">{storageUsage} / 5,000 KB</span>
                </div>
                {/* Visual meter bar */}
                <div className="h-1.5 w-full bg-gray-900 border border-glass-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-400 rounded-full" 
                    style={{ width: `${Math.min(100, (parseFloat(storageUsage) / 5000) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-gray-950/60 border border-glass-border flex items-start gap-2 text-[10px] text-gray-500 leading-relaxed">
                <ShieldCheck className="w-4.5 h-4.5 text-green-400 shrink-0 mt-0.5" />
                <p>
                  Your app configuration is fully sandboxed. No data packets leave this local computer. Your templates, images, and notes exist only in browser memory storage tables.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
