'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  FileCode, 
  Trophy, 
  ShieldAlert, 
  Download, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles,
  ArrowUpRight,
  Pin
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { StickyNote } from '@/types';

export default function WorkspacePage() {
  const store = useWorkspaceStore();
  const [newStickyText, setNewStickyText] = useState('');
  const [stickyColor, setStickyColor] = useState<StickyNote['color']>('yellow');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [quickSearch, setQuickSearch] = useState('');

  // Freelance Calculator state variables
  const [grossAmount, setGrossAmount] = useState<number>(1000);
  const [platformFeePercent, setPlatformFeePercent] = useState<number>(20);
  const [withdrawalFeePercent, setWithdrawalFeePercent] = useState<number>(2);
  const [conversionRate, setConversionRate] = useState<number>(115);
  const [currencySymbol, setCurrencySymbol] = useState<string>('৳');
  
  useEffect(() => {
    store.hydrate();
  }, []);

  const handleAddSticky = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStickyText.trim()) return;
    store.addStickyNote(newStickyText.trim(), stickyColor);
    setNewStickyText('');
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    store.logActivity('Template Copied', 'template', `Quick Delivery item copied.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick delivery presets filter
  const deliveryTemplates = store.templates.filter(
    t => (t.category === 'Delivery' || t.category === 'Followup') && 
         t.title.toLowerCase().includes(quickSearch.toLowerCase())
  ).slice(0, 4);

  const colors: { value: StickyNote['color']; border: string; bg: string; text: string }[] = [
    { value: 'yellow', border: 'border-yellow-500/30', bg: 'bg-yellow-950/20', text: 'text-yellow-200' },
    { value: 'pink', border: 'border-pink-500/30', bg: 'bg-pink-950/20', text: 'text-pink-200' },
    { value: 'blue', border: 'border-blue-500/30', bg: 'bg-blue-950/20', text: 'text-blue-200' },
    { value: 'green', border: 'border-green-500/30', bg: 'bg-green-950/20', text: 'text-green-200' },
    { value: 'purple', border: 'border-purple-500/30', bg: 'bg-purple-950/20', text: 'text-purple-200' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">WORKSPACE BOARD</h1>
          <p className="text-gray-400 text-sm">All operations deck. Sticky notes, quick template exports, and tool launchers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT & CENTER: Core Launcher Grid & Sticky Notes */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Quick Launcher Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Open Message Helper */}
            <div className="p-5 rounded-xl border border-glass-border bg-gray-950/40 hover:border-green-500/30 hover:bg-glass-hover transition-all group relative">
              <Link href="/message-helper" className="absolute inset-0 z-10" />
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-green-500/10 text-green-400 rounded-lg">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-bold text-white group-hover:text-green-400 transition-colors">Fiverr Message Checker</h3>
                <p className="text-xs text-gray-400 mt-1">Review drafts for flagged words (e.g. payment, contact) and correct them.</p>
              </div>
            </div>

            {/* Open Templates */}
            <div className="p-5 rounded-xl border border-glass-border bg-gray-950/40 hover:border-purple-500/30 hover:bg-glass-hover transition-all group relative">
              <Link href="/templates" className="absolute inset-0 z-10" />
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg">
                  <FileCode className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">Team Template Hub</h3>
                <p className="text-xs text-gray-400 mt-1">Access over 20+ preset updates, delivery followups, and billing queries.</p>
              </div>
            </div>

            {/* Generate Mockup */}
            <div className="p-5 rounded-xl border border-glass-border bg-gray-950/40 hover:border-blue-500/30 hover:bg-glass-hover transition-all group relative">
              <Link href="/mockup" className="absolute inset-0 z-10" />
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Trophy className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Congratulations Studio</h3>
                <p className="text-xs text-gray-400 mt-1">Render high-end congratulatory review blocks to PNG images.</p>
              </div>
            </div>

            {/* Open Chat */}
            <div className="p-5 rounded-xl border border-glass-border bg-gray-950/40 hover:border-amber-500/30 hover:bg-glass-hover transition-all group relative">
              <Link href="/chat" className="absolute inset-0 z-10" />
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">Chat Assistant</h3>
                <p className="text-xs text-gray-400 mt-1">Write, simplify, or fix tone locally for client revisions.</p>
              </div>
            </div>

          </div>

          {/* Sticky Notes Canvas */}
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Pin className="w-4.5 h-4.5 text-green-400" />
                <span>Sticky Board</span>
              </h2>
              <form onSubmit={handleAddSticky} className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Sticky note..."
                  value={newStickyText}
                  onChange={(e) => setNewStickyText(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg glass-input w-full sm:w-60"
                />
                <select
                  value={stickyColor}
                  onChange={(e) => setStickyColor(e.target.value as StickyNote['color'])}
                  className="px-2 py-1.5 text-xs rounded-lg glass-input cursor-pointer"
                >
                  <option value="yellow">Yellow</option>
                  <option value="pink">Pink</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                </select>
                <button type="submit" className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-black">
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {store.stickyNotes.length > 0 ? (
                store.stickyNotes.map((note) => {
                  const style = colors.find(c => c.value === note.color) || colors[0];
                  return (
                    <motion.div 
                      key={note.id}
                      layout
                      className={`p-4 rounded-xl border flex flex-col justify-between h-36 ${style.border} ${style.bg}`}
                    >
                      <p className={`text-xs ${style.text} overflow-y-auto leading-relaxed h-full pr-1 font-medium`}>
                        {note.content}
                      </p>
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5">
                        <span className="text-[9px] text-gray-500">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                        <button 
                          onClick={() => store.deleteStickyNote(note.id)}
                          className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8 border border-dashed border-glass-border rounded-xl text-gray-500 text-xs">
                  Sticky board is empty. Create a post-it note above.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Quick Delivery & Recent Downloads */}
        <div className="space-y-6">
          
          {/* Quick Delivery Template copy widget */}
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-green-400" />
                <span>Quick Delivery</span>
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5">Quick copy presets for delivery & followups.</p>
            </div>

            <input
              type="text"
              placeholder="Search delivery presets..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg glass-input"
            />

            <div className="space-y-3.5">
              {deliveryTemplates.map((tpl) => (
                <div key={tpl.id} className="p-3 rounded-lg bg-gray-950/60 border border-glass-border space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[170px]">{tpl.title}</span>
                    <button
                      onClick={() => handleCopyText(tpl.id, tpl.content)}
                      className="p-1 rounded bg-glass-hover hover:bg-green-500/10 text-gray-400 hover:text-green-400 transition-all"
                    >
                      {copiedId === tpl.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-3 bg-gray-900/50 p-1.5 rounded leading-relaxed">
                    {tpl.content}
                  </p>
                </div>
              ))}
              {deliveryTemplates.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No matching presets.</p>
              )}
            </div>
          </div>

          {/* Recent Downloads */}
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Download className="w-4.5 h-4.5 text-green-400" />
                <span>Recent Downloads</span>
              </h2>
              <Link href="/downloads" className="text-xs text-green-400 hover:underline">All files</Link>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {store.downloads.length > 0 ? (
                store.downloads.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-950/40 border border-glass-border text-left">
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                      <p className="text-[9px] text-gray-500">{item.size} • {item.date}</p>
                    </div>
                    <a 
                      href={item.url} 
                      download={item.name} 
                      className="p-1.5 rounded hover:bg-glass-hover text-green-400 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-6">No files downloaded yet.</p>
              )}
            </div>
          </div>

          {/* Freelance Earnings & Fee Calculator */}
          {(() => {
            const platformFeeUSD = grossAmount * (platformFeePercent / 100);
            const withdrawalFeeUSD = (grossAmount - platformFeeUSD) * (withdrawalFeePercent / 100);
            const netEarningsUSD = grossAmount - platformFeeUSD - withdrawalFeeUSD;
            const netEarningsLocal = netEarningsUSD * conversionRate;

            return (
              <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-green-400" />
                    <span>Freelance Fee Calculator</span>
                  </h2>
                  <p className="text-[10px] text-gray-500 mt-0.5">Calculate platform fees, conversion rates, and net earnings.</p>
                </div>

                <div className="space-y-3 text-left">
                  {/* Gross Amount Input */}
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-bold text-gray-400 uppercase">Order Budget (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold font-sans text-xs">$</span>
                      <input
                        type="number"
                        value={grossAmount || ''}
                        onChange={(e) => setGrossAmount(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg glass-input font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Platform Fee Percent Input */}
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-gray-400 uppercase">Platform Fee (%)</label>
                      <input
                        type="number"
                        value={platformFeePercent || ''}
                        onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg glass-input font-semibold"
                      />
                    </div>
                    {/* Withdrawal Fee Percent Input */}
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-gray-400 uppercase">Transfer Fee (%)</label>
                      <input
                        type="number"
                        value={withdrawalFeePercent || ''}
                        onChange={(e) => setWithdrawalFeePercent(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg glass-input font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Exchange Rate */}
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-gray-400 uppercase">Exchange Rate</label>
                      <input
                        type="number"
                        value={conversionRate || ''}
                        onChange={(e) => setConversionRate(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg glass-input font-semibold"
                      />
                    </div>
                    {/* Currency Code */}
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-gray-400 uppercase">Currency Symbol</label>
                      <input
                        type="text"
                        value={currencySymbol}
                        onChange={(e) => setCurrencySymbol(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg glass-input font-semibold text-center"
                      />
                    </div>
                  </div>

                  {/* Earnings Breakdown */}
                  <div className="border-t border-glass-border pt-3 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-gray-400">
                      <span>Gross Budget:</span>
                      <span className="text-white font-mono">${(grossAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-400 text-[11px]">
                      <span>Platform Fee ({platformFeePercent}%):</span>
                      <span className="font-mono">-${platformFeeUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-400 text-[11px]">
                      <span>Transfer/Withdraw Fee ({withdrawalFeePercent}%):</span>
                      <span className="font-mono">-${withdrawalFeeUSD.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-dashed border-white/5 pt-2 flex justify-between font-extrabold text-sm text-green-400">
                      <span>Net Earnings (USD):</span>
                      <span className="font-mono">${netEarningsUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-xs text-emerald-400 font-mono">
                      <span>Local Currency ({currencySymbol}):</span>
                      <span>{currencySymbol}{netEarningsLocal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
