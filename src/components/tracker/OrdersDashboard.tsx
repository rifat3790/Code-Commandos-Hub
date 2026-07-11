"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, CheckCircle2, FileSpreadsheet, ExternalLink, Filter, ChevronDown, Columns, DollarSign, Save, Download, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

function parseTimeline(timelineStr: string): number | null {
  if (!timelineStr) return null;
  const str = timelineStr.trim().toUpperCase();
  if (str.includes('DAY')) {
    const days = parseInt(str);
    if (!isNaN(days)) return days * 86400;
  }
  return null;
}

function formatTimeline(totalSeconds: number | null, originalStr: string): string {
  if (totalSeconds === null) return originalStr;
  if (totalSeconds <= 0) return "Order Late";
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}D`);
  if (h > 0 || d > 0) parts.push(`${h}H`);
  if (m > 0 || h > 0 || d > 0) parts.push(`${m}M`);
  parts.push(`${s}S`);
  return parts.join(' ');
}

// A reusable MultiSelect Dropdown Component
function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  icon: Icon,
  searchable = false
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (newSelected: string[]) => void;
  icon?: any;
  searchable?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const isAll = selected.length === 0;

  const filteredOptions = searchable && searchTerm.trim() !== ""
    ? options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${!isAll ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-gray-900/50 border-glass-border text-gray-300 hover:bg-gray-800'
          }`}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {label}
        {!isAll && <span className="bg-purple-500/30 text-purple-200 text-xs px-1.5 py-0.5 rounded-md ml-1">{selected.length}</span>}
        <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 w-64 bg-gray-900 border border-glass-border rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
          >
            {searchable && (
              <div className="p-2 border-b border-glass-border bg-gray-900/80 backdrop-blur">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder={`Search ${label}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full glass-input text-xs pl-8 pr-3 py-1.5"
                  />
                </div>
              </div>
            )}
            <div className="max-h-64 overflow-y-auto p-2 space-y-1">
              <div
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                onClick={() => onChange([])}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isAll ? 'bg-purple-500 border-purple-500 text-white' : 'border-gray-500'}`}>
                  {isAll && <CheckCircle2 className="w-3 h-3" />}
                </div>
                <span className="text-sm text-gray-300">All (No Filter)</span>
              </div>

              {filteredOptions.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  No matches found.
                </div>
              )}

              {filteredOptions.map(opt => {
                const isSelected = selected.includes(opt);
                return (
                  <div
                    key={opt}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                    onClick={() => toggleOption(opt)}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'border-gray-500'}`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <span className="text-sm text-gray-300">{opt}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) return <>{text}</>;
  const parts = String(text).split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() 
          ? <span key={i} className="bg-yellow-500/30 text-yellow-300 px-0.5 rounded font-black">{part}</span> 
          : part
      )}
    </>
  );
}

export default function OrdersDashboard({ csvData, activeLayout }: { csvData: string; activeLayout?: string }) {
  const { user, dbUser } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState(Date.now());
  const router = useRouter();
  const tableRef = useRef<HTMLDivElement>(null);

  // Filters State
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [serviceLineFilter, setServiceLineFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [teamFilter, setTeamFilter] = useState<string[]>([]);
  const [nameFilter, setNameFilter] = useState<string[]>([]);
  const [deliveryDateFilter, setDeliveryDateFilter] = useState<string[]>([]);

  const [isSavingFilter, setIsSavingFilter] = useState(false);

  // Layout Classes Map
  const layoutStyles = useMemo(() => {
    const layout = activeLayout || 'default';
    switch (layout) {
      case 'slate':
        return {
          container: "bg-gray-900 border border-gray-800 rounded-none shadow-none",
          headerBg: "bg-[#0b0f19] text-gray-300 font-bold uppercase tracking-widest text-[11px] border-b border-gray-800",
          headerCell: "px-5 py-3.5 text-gray-300 font-bold text-[11px] uppercase tracking-widest",
          rowClass: "hover:bg-gray-800/40 border-b border-gray-800/60 transition-colors group even:bg-gray-900/10 odd:bg-gray-950/5",
          cellText: "text-gray-300 font-normal",
          idBadge: "font-mono text-xs px-2 py-0.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-none",
          statusWip: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-none px-2 py-0.5",
          statusCancel: "bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-none px-2 py-0.5",
          statusDone: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-none px-2 py-0.5",
          statusDefault: "bg-gray-800 text-gray-400 border border-gray-700 rounded-none px-2 py-0.5",
          linkBtn: "inline-flex items-center gap-1 px-2.5 py-1 bg-gray-850 text-gray-300 border border-gray-700 hover:bg-gray-750 hover:text-white transition-all text-xs font-semibold rounded-none",
          timelineLate: "bg-rose-600 text-white border border-rose-500 px-2 py-0.5 rounded-none font-bold text-xs uppercase animate-pulse",
          timelineCancel: "text-gray-500 font-bold",
          timelineDone: "text-gray-400 font-bold",
          timelineS: "text-rose-500 font-bold",
          timelineS2: "text-amber-500 font-bold",
          timelineSafe: "text-emerald-500 font-medium",
          timelineDefault: "text-gray-400 font-medium",
          timelineHeaderCell: "px-5 py-3.5 text-gray-300 font-bold text-[11px] uppercase tracking-widest text-center sticky right-0 bg-[#0b0f19] z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.3)] border-l border-gray-800",
          timelineRowCell: "px-5 py-3 sticky right-0 bg-gray-900 group-hover:bg-[#1f2937]/50 z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.3)] border-l border-gray-800 transition-colors"
        };
      case 'aurora':
        return {
          container: "glass-panel overflow-hidden border border-indigo-500/20 rounded-3xl shadow-[0_8px_32px_rgba(99,102,241,0.15)]",
          headerBg: "bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 text-indigo-200 border-b border-indigo-500/20",
          headerCell: "px-5 py-4 text-indigo-300 font-semibold text-xs tracking-wider uppercase",
          rowClass: "hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-indigo-500/5 border-b border-indigo-500/10 transition-all duration-300 even:bg-indigo-950/5 odd:bg-purple-950/5",
          cellText: "text-gray-300 font-medium",
          idBadge: "font-mono text-xs px-2.5 py-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-xl",
          statusWip: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
          statusCancel: "bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(244,63,94,0.1)]",
          statusDone: "bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(168,85,247,0.1)]",
          statusDefault: "bg-gray-800/40 text-gray-400 border border-gray-700/30 rounded-full px-3 py-1",
          linkBtn: "inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500/60 rounded-xl transition-all duration-300 text-xs font-semibold hover:scale-[1.02] shadow-[0_2px_8px_rgba(99,102,241,0.1)]",
          timelineLate: "bg-gradient-to-r from-rose-500/20 to-pink-500/20 text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-full font-bold text-xs uppercase animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.2)]",
          timelineCancel: "text-gray-400 font-bold",
          timelineDone: "text-indigo-400 font-bold",
          timelineS: "text-rose-400 font-bold drop-shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-pulse",
          timelineS2: "text-amber-400 font-semibold drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]",
          timelineSafe: "text-emerald-400 font-medium drop-shadow-[0_0_8px_rgba(16,185,129,0.15)]",
          timelineDefault: "text-indigo-300/80 font-medium",
          timelineHeaderCell: "px-5 py-4 text-indigo-300 font-semibold text-xs tracking-wider uppercase text-center sticky right-0 bg-[#0f111a] z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.5)] border-l border-indigo-500/20",
          timelineRowCell: "px-5 py-3 sticky right-0 bg-[#121422] group-hover:bg-[#1a1e35] z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.4)] border-l border-indigo-500/20 transition-colors"
        };
      case 'cyber':
        return {
          container: "bg-[#05070a] border border-emerald-500/20 rounded-none shadow-[0_0_20px_rgba(16,185,129,0.05)]",
          headerBg: "bg-black text-emerald-400 font-mono tracking-widest text-xs uppercase border-b-2 border-emerald-500/30",
          headerCell: "px-5 py-4 text-emerald-400 font-mono tracking-wider text-xs uppercase",
          rowClass: "hover:bg-emerald-950/10 hover:shadow-[inset_4px_0_0_0_#10b981] border-b border-emerald-500/5 transition-all duration-200 font-mono text-gray-300",
          cellText: "text-gray-300 font-mono text-xs",
          idBadge: "font-mono text-xs px-2 py-0.5 bg-black border border-emerald-500/30 text-emerald-400",
          statusWip: "bg-emerald-950 text-emerald-400 border border-emerald-500/50 rounded-none px-2 py-0.5",
          statusCancel: "bg-red-950 text-red-400 border border-red-500/50 rounded-none px-2 py-0.5",
          statusDone: "bg-purple-950 text-purple-400 border border-purple-500/50 rounded-none px-2 py-0.5",
          statusDefault: "bg-gray-900 text-gray-400 border border-gray-700 rounded-none px-2 py-0.5",
          linkBtn: "inline-flex items-center gap-1.5 px-2.5 py-1 bg-black text-emerald-400 border border-emerald-500/30 hover:bg-emerald-950 hover:border-emerald-500 transition-colors text-xs font-mono",
          timelineLate: "bg-red-950 text-red-400 border border-red-500 px-3 py-1 font-bold text-xs uppercase animate-pulse",
          timelineCancel: "text-gray-500 font-bold",
          timelineDone: "text-emerald-450 font-bold",
          timelineS: "text-red-505 font-bold animate-pulse",
          timelineS2: "text-yellow-505 font-semibold",
          timelineSafe: "text-emerald-400 font-medium",
          timelineDefault: "text-gray-500 font-medium",
          timelineHeaderCell: "px-5 py-4 text-emerald-400 font-mono tracking-wider text-xs uppercase text-center sticky right-0 bg-black z-10 border-l border-emerald-500/20",
          timelineRowCell: "px-5 py-3 sticky right-0 bg-black group-hover:bg-emerald-950/20 z-10 border-l border-emerald-500/20 transition-colors"
        };
      case 'gold':
        return {
          container: "bg-[#0b0b0b] border border-amber-500/20 rounded-xl shadow-[0_8px_30px_rgba(217,119,6,0.05)]",
          headerBg: "bg-[#141414] text-amber-300 font-bold uppercase tracking-wider text-[11px] border-b border-amber-500/20",
          headerCell: "px-5 py-4.5 text-amber-300 font-bold text-[11px] uppercase tracking-wider",
          rowClass: "hover:bg-amber-500/5 hover:shadow-[inset_4px_0_0_0_#d97706] border-b border-amber-500/10 transition-all duration-300 even:bg-[#111111]/30 odd:bg-black/40",
          cellText: "text-gray-200 font-medium",
          idBadge: "font-mono text-xs px-2.5 py-1 bg-black border border-amber-500/30 text-amber-200 rounded-lg",
          statusWip: "bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md px-2.5 py-1",
          statusCancel: "bg-red-500/10 text-red-400 border border-red-500/30 rounded-md px-2.5 py-1",
          statusDone: "bg-[#d97706]/10 text-amber-200 border border-amber-600/30 rounded-md px-2.5 py-1",
          statusDefault: "bg-gray-800 text-gray-400 border border-gray-700 rounded-md px-2.5 py-1",
          linkBtn: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] text-amber-300 border border-amber-500/20 hover:border-amber-500 hover:bg-amber-500 hover:text-black rounded-lg transition-all duration-300 text-xs font-semibold shadow-sm",
          timelineLate: "bg-gradient-to-r from-red-600/20 to-amber-600/20 text-red-400 border border-red-500/40 px-3 py-1 rounded-full font-bold text-xs uppercase animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.15)]",
          timelineCancel: "text-gray-500 font-bold",
          timelineDone: "text-amber-200 font-bold",
          timelineS: "text-red-400 font-bold animate-pulse",
          timelineS2: "text-amber-400 font-semibold",
          timelineSafe: "text-amber-200/90 font-medium",
          timelineDefault: "text-gray-400 font-medium",
          timelineHeaderCell: "px-5 py-4.5 text-amber-300 font-bold text-[11px] uppercase tracking-wider text-center sticky right-0 bg-[#141414] z-10 border-l border-amber-500/20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.5)]",
          timelineRowCell: "px-5 py-3 sticky right-0 bg-[#0d0d0d] group-hover:bg-[#181818] z-10 border-l border-amber-500/20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.4)] transition-colors"
        };
      case 'obsidian':
        return {
          container: "bg-[#0c0d12] border border-[#1b1d26] rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.6)]",
          headerBg: "bg-[#07080a] text-gray-400 font-bold uppercase tracking-wider text-[11px] border-b border-[#1f222e]",
          headerCell: "px-5 py-4 text-gray-400 font-bold text-[11px] uppercase tracking-wider",
          rowClass: "hover:bg-[#141722] border-b border-[#141620] transition-colors group even:bg-[#0c0d12] odd:bg-[#0e1017]",
          cellText: "text-gray-300 font-normal",
          idBadge: "font-mono text-xs px-2 py-0.5 bg-[#171a26] border border-[#262b3d] text-gray-400 rounded",
          statusWip: "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 rounded-md px-2 py-0.5",
          statusCancel: "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 rounded-md px-2 py-0.5",
          statusDone: "bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20 rounded-md px-2 py-0.5",
          statusDefault: "bg-[#4b5563]/10 text-[#9ca3af] border border-[#4b5563]/20 rounded-md px-2 py-0.5",
          linkBtn: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171a26] text-gray-300 border border-[#2b3046] hover:bg-[#202436] hover:text-white rounded-lg transition-colors text-xs font-semibold",
          timelineLate: "bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40 px-3 py-1 rounded font-bold text-xs uppercase animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.1)]",
          timelineCancel: "text-gray-600 font-bold",
          timelineDone: "text-purple-400 font-bold",
          timelineS: "text-red-400 font-bold animate-pulse",
          timelineS2: "text-amber-505 font-semibold",
          timelineSafe: "text-emerald-505 font-medium",
          timelineDefault: "text-gray-400 font-medium",
          timelineHeaderCell: "px-5 py-4 text-gray-400 font-bold text-[11px] uppercase tracking-wider text-center sticky right-0 bg-[#07080a] z-10 border-l border-[#1f222e] shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.5)]",
          timelineRowCell: "px-5 py-3 sticky right-0 bg-[#0c0d12] group-hover:bg-[#141722] z-10 border-l border-[#141620] shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.4)] transition-colors"
        };
      case 'frost':
        return {
          container: "bg-slate-950/40 backdrop-blur-md border border-cyan-500/20 rounded-2xl shadow-[0_8px_32px_rgba(6,182,212,0.15)]",
          headerBg: "bg-[#0a141d]/60 text-cyan-300 font-semibold tracking-wide text-xs uppercase border-b border-cyan-500/20",
          headerCell: "px-5 py-4 text-cyan-300 font-semibold tracking-wide text-xs uppercase",
          rowClass: "hover:bg-cyan-500/10 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] border-b border-cyan-500/10 transition-all duration-300 even:bg-cyan-950/5 odd:bg-slate-900/5",
          cellText: "text-slate-200 font-medium",
          idBadge: "font-mono text-xs px-2.5 py-1 bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 rounded-lg",
          statusWip: "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(6,182,212,0.1)]",
          statusCancel: "bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(244,63,94,0.1)]",
          statusDone: "bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(168,85,247,0.1)]",
          statusDefault: "bg-slate-800/40 text-slate-400 border border-slate-700/30 rounded-full px-3 py-1",
          linkBtn: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/20 text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-cyan-500/60 rounded-xl transition-all duration-300 text-xs font-semibold",
          timelineLate: "bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-full font-bold text-xs uppercase animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.2)]",
          timelineCancel: "text-slate-400 font-bold",
          timelineDone: "text-purple-300 font-bold",
          timelineS: "text-rose-300 font-bold drop-shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-pulse",
          timelineS2: "text-amber-300 font-semibold drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]",
          timelineSafe: "text-cyan-300 font-medium drop-shadow-[0_0_8px_rgba(6,182,212,0.15)]",
          timelineDefault: "text-cyan-200/80 font-medium",
          timelineHeaderCell: "px-5 py-4 text-cyan-300 font-semibold tracking-wide text-xs uppercase text-center sticky right-0 bg-[#06101a] z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.5)] border-l border-cyan-500/20",
          timelineRowCell: "px-5 py-3 sticky right-0 bg-[#0e1c28] group-hover:bg-[#162a3c] z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.4)] border-l border-cyan-500/20 transition-colors"
        };
      case 'tokyo':
        return {
          container: "bg-[#090515] border border-pink-500/20 rounded-none shadow-[0_0_20px_rgba(236,72,153,0.1)]",
          headerBg: "bg-black text-pink-400 font-extrabold uppercase tracking-widest text-[11px] border-b-2 border-pink-500/50",
          headerCell: "px-5 py-4 text-pink-400 font-bold text-xs tracking-wider uppercase",
          rowClass: "hover:bg-pink-950/15 hover:shadow-[inset_4px_0_0_0_#ec4899] border-b border-pink-500/10 transition-all duration-200 even:bg-[#0c061d]/40 odd:bg-black/60",
          cellText: "text-gray-300 font-semibold",
          idBadge: "font-mono text-xs px-2.5 py-1 bg-black border border-cyan-500/30 text-cyan-400 rounded-none",
          statusWip: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/40 rounded-none px-3 py-1 shadow-[0_0_10px_rgba(6,182,212,0.2)] animate-pulse",
          statusCancel: "bg-pink-500/10 text-pink-400 border border-pink-500/40 rounded-none px-3 py-1",
          statusDone: "bg-purple-500/10 text-purple-400 border border-purple-500/40 rounded-none px-3 py-1 shadow-[0_0_10px_rgba(168,85,247,0.2)]",
          statusDefault: "bg-gray-900 text-gray-500 border border-gray-800 rounded-none px-3 py-1",
          linkBtn: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-pink-400 border border-pink-500/40 hover:bg-pink-950 hover:text-white rounded-none transition-all duration-200 text-xs font-mono",
          timelineLate: "bg-pink-950 text-pink-400 border border-pink-500 px-3 py-1 font-extrabold text-xs uppercase animate-pulse shadow-[0_0_12px_rgba(236,72,153,0.3)]",
          timelineCancel: "text-gray-600 font-bold",
          timelineDone: "text-cyan-400 font-bold",
          timelineS: "text-pink-505 font-bold animate-pulse",
          timelineS2: "text-purple-405 font-semibold",
          timelineSafe: "text-cyan-400 font-medium",
          timelineDefault: "text-gray-500 font-medium",
          timelineHeaderCell: "px-5 py-4 text-pink-400 font-bold text-xs tracking-wider uppercase text-center sticky right-0 bg-black z-10 border-l border-pink-500/20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.5)]",
          timelineRowCell: "px-5 py-3 sticky right-0 bg-black group-hover:bg-[#150a29] z-10 border-l border-pink-500/20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.4)] transition-colors"
        };
      case 'emerald':
        return {
          container: "bg-[#030d07] border border-emerald-500/20 rounded-xl shadow-[0_8px_30px_rgba(16,185,129,0.05)]",
          headerBg: "bg-[#05140b] text-emerald-300 font-bold uppercase tracking-wider text-[11px] border-b border-emerald-500/20",
          headerCell: "px-5 py-4.5 text-emerald-300 font-bold text-[11px] uppercase tracking-wider",
          rowClass: "hover:bg-emerald-950/20 hover:shadow-[inset_4px_0_0_0_#10b981] border-b border-emerald-500/10 transition-all duration-300 even:bg-[#041209]/30 odd:bg-black/50",
          cellText: "text-gray-300 font-medium",
          idBadge: "font-mono text-xs px-2.5 py-1 bg-black border border-emerald-500/30 text-emerald-300 rounded-md",
          statusWip: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md px-2.5 py-1 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
          statusCancel: "bg-red-500/10 text-red-400 border border-red-500/30 rounded-md px-2.5 py-1",
          statusDone: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-md px-2.5 py-1",
          statusDefault: "bg-gray-800 text-gray-400 border border-gray-700 rounded-md px-2.5 py-1",
          linkBtn: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#04140a] text-emerald-300 border border-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-500 hover:text-black rounded-lg transition-all duration-300 text-xs font-semibold",
          timelineLate: "bg-gradient-to-r from-red-600 to-orange-600 text-white border border-red-500 px-3 py-1 rounded font-bold text-xs uppercase animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.2)]",
          timelineCancel: "text-gray-600 font-bold",
          timelineDone: "text-emerald-300 font-bold",
          timelineS: "text-red-400 font-bold animate-pulse",
          timelineS2: "text-yellow-400 font-semibold",
          timelineSafe: "text-emerald-400 font-medium",
          timelineDefault: "text-gray-500 font-medium",
          timelineHeaderCell: "px-5 py-4.5 text-emerald-300 font-bold text-[11px] uppercase tracking-wider text-center sticky right-0 bg-[#05140b] z-10 border-l border-emerald-500/20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.5)]",
          timelineRowCell: "px-5 py-3 sticky right-0 bg-[#030d07] group-hover:bg-[#05170d] z-10 border-l border-emerald-500/20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.4)] transition-colors"
        };
      case 'cosmic':
        return {
          container: "bg-[#070514] border border-violet-500/20 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)]",
          headerBg: "bg-gradient-to-r from-violet-950/60 via-fuchsia-950/40 to-indigo-950/60 text-fuchsia-200 border-b border-fuchsia-500/20",
          headerCell: "px-5 py-4 text-fuchsia-200 font-semibold tracking-wide text-xs uppercase",
          rowClass: "hover:bg-gradient-to-r hover:from-violet-500/10 hover:to-fuchsia-500/10 border-b border-violet-500/10 transition-all duration-300 even:bg-[#0a071d]/40 odd:bg-black/60",
          cellText: "text-slate-200 font-medium",
          idBadge: "font-mono text-xs px-2.5 py-1 bg-violet-950/30 border border-violet-500/30 text-violet-300 rounded-xl",
          statusWip: "bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(217,70,239,0.15)] animate-pulse",
          statusCancel: "bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(244,63,94,0.15)]",
          statusDone: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(99,102,241,0.15)]",
          statusDefault: "bg-[#18182e]/50 text-slate-400 border border-slate-700/30 rounded-full px-3 py-1",
          linkBtn: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-950/20 text-violet-300 hover:text-white border border-violet-500/30 hover:border-violet-500/60 rounded-xl transition-all duration-300 text-xs font-semibold shadow-[0_2px_8px_rgba(139,92,246,0.1)]",
          timelineLate: "bg-gradient-to-r from-rose-500/20 to-pink-500/20 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-full font-bold text-xs uppercase animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.25)]",
          timelineCancel: "text-slate-500 font-bold",
          timelineDone: "text-indigo-400 font-bold",
          timelineS: "text-fuchsia-400 font-bold drop-shadow-[0_0_8px_rgba(217,70,239,0.3)] animate-pulse",
          timelineS2: "text-violet-400 font-semibold drop-shadow-[0_0_8px_rgba(139,92,246,0.2)]",
          timelineSafe: "text-indigo-300 font-medium drop-shadow-[0_0_8px_rgba(99,102,241,0.2)]",
          timelineDefault: "text-violet-300/80 font-medium",
          timelineHeaderCell: "px-5 py-4 text-fuchsia-200 font-semibold tracking-wide text-xs uppercase text-center sticky right-0 bg-[#070514] z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.5)] border-l border-violet-500/20",
          timelineRowCell: "px-5 py-3 sticky right-0 bg-[#0b0821] group-hover:bg-[#150f38] z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.4)] border-l border-violet-500/20 transition-colors"
        };
      default: // Neon Glassmorphic (Legacy-like but premium)
        return {
          container: "glass-panel overflow-hidden border border-glass-border rounded-xl",
          headerBg: "bg-gray-900/90 text-gray-300 font-medium border-b border-glass-border",
          headerCell: "px-5 py-4 tracking-wide text-gray-300 font-medium text-sm",
          rowClass: "hover:bg-gray-800/60 border-b border-glass-border/30 transition-colors group even:bg-gray-900/5 odd:bg-gray-950/5",
          cellText: "text-gray-300 font-normal",
          idBadge: "font-mono text-gray-400 text-xs px-1.5 py-0.5 bg-gray-900/50 rounded",
          statusWip: "bg-green-500/20 text-green-400 border border-green-500/30 rounded px-2 py-0.5",
          statusCancel: "bg-red-500/20 text-red-400 border border-red-500/30 rounded px-2 py-0.5",
          statusDone: "bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded px-2 py-0.5",
          statusDefault: "bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded px-2 py-0.5",
          linkBtn: "inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-md transition-colors border border-purple-500/20 text-xs font-semibold",
          timelineLate: "bg-red-600 text-white border border-red-500 shadow-lg shadow-red-600/30 px-3 py-1 rounded-lg font-bold tracking-wide text-xs uppercase animate-pulse",
          timelineCancel: "text-gray-400 font-bold",
          timelineDone: "text-gray-400 font-bold",
          timelineS: "text-red-500 font-extrabold",
          timelineS2: "text-yellow-400 font-bold",
          timelineSafe: "text-green-400 font-medium",
          timelineDefault: "text-gray-300 font-medium",
          timelineHeaderCell: "px-5 py-4 tracking-wide sticky right-0 bg-gray-900/90 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.3)] border-l border-glass-border text-purple-300 text-sm font-medium",
          timelineRowCell: "px-5 py-3 sticky right-0 bg-gray-900 group-hover:bg-gray-800 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.3)] border-l border-glass-border transition-colors"
        };
    }
  }, [activeLayout]);

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      router.refresh();
    }, 60000);
    return () => clearInterval(refreshInterval);
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        let extractedColumns: string[] = [];
        if (results.data.length > 0) {
          // The "Status" column in the sheet currently has a header of " " (single space).
          // We need to rename it to 'Status' so it works with the rest of the code.
          const firstRow = results.data[0] as Record<string, any>;
          if (firstRow[' '] !== undefined && firstRow['Status'] === undefined) {
            results.data.forEach((row: any) => {
              row['Status'] = row[' '];
              delete row[' '];
            });
          }
          // Similarly, sometimes it might just be an empty string depending on PapaParse settings.
          else if (firstRow[''] !== undefined && firstRow['Status'] === undefined && firstRow['Assign Team']) {
            // ensure we aren't picking the trailing empty column
            results.data.forEach((row: any) => {
              if (row['Assign Team']) { // Just a sanity check
                row['Status'] = row[''];
              }
            });
          }

          extractedColumns = Object.keys(results.data[0] as Record<string, unknown>).filter(k => k && k.trim() !== '' && !k.startsWith('_'));
          setAllColumns(extractedColumns);
        }

        const validData = results.data
          .filter((row: any) => row['Order ID'] && row['Order ID'].trim() !== '')
          .map((row: any) => {
            const deliveryDateStr = row['Delivery Date'];
            const originalTimeline = row['Deadline'] || "";
            let targetTime = null;

            if (deliveryDateStr) {
              let timestamp = Date.parse(deliveryDateStr);
              if (!isNaN(timestamp)) {
                if (!/\d{4}/.test(deliveryDateStr)) {
                  const d = new Date(timestamp);
                  d.setFullYear(new Date().getFullYear());
                  timestamp = d.getTime();
                }
                targetTime = timestamp;
              }
            }

            if (targetTime === null && originalTimeline.match(/\d+[DHMS]/)) {
              const str = originalTimeline.toUpperCase();
              const dMatch = str.match(/(\d+)D/);
              const hMatch = str.match(/(\d+)H/);
              const mMatch = str.match(/(\d+)M/);
              const sMatch = str.match(/(\d+)S/);
              let totalSeconds = 0;
              if (dMatch) totalSeconds += parseInt(dMatch[1]) * 86400;
              if (hMatch) totalSeconds += parseInt(hMatch[1]) * 3600;
              if (mMatch) totalSeconds += parseInt(mMatch[1]) * 60;
              if (sMatch) totalSeconds += parseInt(sMatch[1]);
              if (totalSeconds > 0) targetTime = Date.now() + totalSeconds * 1000;
            } else if (targetTime === null) {
              const fallbackSecs = parseTimeline(originalTimeline);
              if (fallbackSecs !== null) targetTime = Date.now() + fallbackSecs * 1000;
            }

            return {
              ...row,
              _targetTime: targetTime,
              _originalTimeline: originalTimeline
            };
          });

        setData(validData);

        const tf = dbUser?.trackerFilters || {};

        // Only set defaults on initial load (if visibleColumns is empty)
        setVisibleColumns(prev => {
          if (prev.length > 0) return prev;
          if (tf.visibleColumns) return tf.visibleColumns;
          // Default columns per user request
          const defaultCols = ['Assign Team', 'Profile Name', 'Client name', 'Order ID', 'Status', 'Value', 'Amount'];
          return extractedColumns.filter(c => defaultCols.includes(c));
        });

        // Set default filters only on initial mount
        setServiceLineFilter(prev => {
          if (prev.length > 0) return prev;
          if (tf.serviceLineFilter) return tf.serviceLineFilter;
          return ['Shopify'];
        });

        setStatusFilter(prev => {
          if (prev.length > 0) return prev;
          if (tf.statusFilter) return tf.statusFilter;
          return ['WIP'];
        });

        setTeamFilter(prev => {
          if (prev.length > 0) return prev;
          if (tf.teamFilter) return tf.teamFilter;
          return ['CC'];
        });

        setNameFilter(prev => {
          if (prev.length > 0) return prev;
          if (tf.nameFilter) return tf.nameFilter;
          return [];
        });

        setDeliveryDateFilter(prev => {
          if (prev.length > 0) return prev;
          if (tf.deliveryDateFilter) return tf.deliveryDateFilter;
          return [];
        });
      }
    });
  }, [csvData, dbUser]);

  const handleSaveFilters = async () => {
    if (!user) return;
    setIsSavingFilter(true);
    try {
      const trackerFilters = {
        visibleColumns,
        serviceLineFilter,
        statusFilter,
        teamFilter,
        nameFilter,
        deliveryDateFilter
      };

      const res = await fetch(`/api/users/me?uid=${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackerFilters })
      });

      if (res.ok) {
        toast.success("Your custom filters have been saved successfully!");
      } else {
        toast.error("Failed to save filters.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save filters.");
    } finally {
      setIsSavingFilter(false);
    }
  };

  const handleDownloadPNG = async () => {
    if (tableRef.current) {
      try {
        const dataUrl = await toPng(tableRef.current, { backgroundColor: '#111827' });
        const link = document.createElement('a');
        link.download = 'orders-tracker.png';
        link.href = dataUrl;
        link.click();
        toast.success("Downloaded as PNG");
      } catch (err) {
        console.error(err);
        toast.error("Failed to download image");
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (tableRef.current) {
      const toastId = toast.loading("Generating PDF...");
      try {
        const width = tableRef.current.scrollWidth;
        const height = tableRef.current.scrollHeight;

        const dataUrl = await toPng(tableRef.current, {
          backgroundColor: '#111827',
          width,
          height,
          style: {
            width: `${width}px`,
            height: `${height}px`,
            transform: 'none'
          }
        });

        const pdf = new jsPDF({
          orientation: width > height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [width, height]
        });

        pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
        pdf.save('orders-tracker.pdf');

        toast.dismiss(toastId);
        toast.success("Downloaded as PDF");
      } catch (err) {
        console.error(err);
        toast.dismiss(toastId);
        toast.error("Failed to download PDF");
      }
    }
  };

  // Extract unique filter options dynamically from data with cascading logic
  const filterOptions = useMemo(() => {
    // 1. Service Lines options (Always derived from all data)
    const serviceLines = new Set<string>();
    data.forEach(d => {
      if (d['Service Line']) serviceLines.add(d['Service Line'].trim());
    });

    // 2. Filter data by selected Service Line to derive Statuses, Teams, and Delivery Dates options
    let dataForOtherFilters = data;
    if (serviceLineFilter.length > 0) {
      dataForOtherFilters = dataForOtherFilters.filter(d => {
        const sl = (d['Service Line'] || '').trim().toLowerCase();
        return serviceLineFilter.some(f => sl === f.toLowerCase());
      });
    }

    const statuses = new Set<string>();
    const teams = new Set<string>();
    const deliveryDates = new Set<string>();
    deliveryDates.add('Today');

    dataForOtherFilters.forEach(d => {
      if (d['Status']) statuses.add(d['Status'].trim());
      if (d['Deli_Date']) deliveryDates.add(d['Deli_Date'].trim());
      const at = d['Assign Team'];
      if (at && typeof at === 'string') {
        const parts = at.split('/').map(s => s.trim()).filter(Boolean);
        parts.forEach(p => {
          if (p.length <= 2) {
            teams.add(p.toUpperCase());
          }
        });
      }
    });

    // 3. Filter data by selected Service Line AND selected Team to derive Names/Assignees options
    let dataForNamesFilter = dataForOtherFilters;
    if (teamFilter.length > 0) {
      dataForNamesFilter = dataForNamesFilter.filter(d => {
        const at = d['Assign Team'];
        if (!at || typeof at !== 'string') return false;
        const parts = at.split('/').map(s => s.trim().toLowerCase()).filter(Boolean);
        const rowTeams = parts.filter(p => p.length <= 2);
        return teamFilter.some(f => rowTeams.includes(f.toLowerCase()));
      });
    }

    const names = new Set<string>();
    dataForNamesFilter.forEach(d => {
      const at = d['Assign Team'];
      if (at && typeof at === 'string') {
        const parts = at.split('/').map(s => s.trim()).filter(Boolean);
        parts.forEach(p => {
          if (p.length > 2) {
            names.add(p);
          }
        });
      }
    });

    return {
      serviceLines: Array.from(serviceLines).sort(),
      statuses: Array.from(statuses).sort(),
      teams: Array.from(teams).sort(),
      names: Array.from(names).sort(),
      deliveryDates: Array.from(deliveryDates).sort((a, b) => {
        if (a === 'Today') return -1;
        if (b === 'Today') return 1;
        return a.localeCompare(b);
      })
    };
  }, [data, serviceLineFilter, teamFilter]);

  // Automatically reset stale child filters when parent filters change
  useEffect(() => {
    if (serviceLineFilter.length > 0) {
      const availableTeams = filterOptions.teams;
      setTeamFilter(prev => prev.filter(t => availableTeams.includes(t)));
      
      const availableStatuses = filterOptions.statuses;
      setStatusFilter(prev => prev.filter(s => availableStatuses.includes(s)));

      const availableDates = filterOptions.deliveryDates;
      setDeliveryDateFilter(prev => prev.filter(d => availableDates.includes(d)));
    }
  }, [serviceLineFilter, filterOptions.teams, filterOptions.statuses, filterOptions.deliveryDates]);

  useEffect(() => {
    if (teamFilter.length > 0) {
      const availableNames = filterOptions.names;
      setNameFilter(prev => prev.filter(n => availableNames.includes(n)));
    }
  }, [teamFilter, filterOptions.names]);

  // Apply filters
  const filteredData = useMemo(() => {
    let result = data;

    // Apply specific filters
    if (serviceLineFilter.length > 0) {
      result = result.filter(d => {
        const sl = (d['Service Line'] || '').trim().toLowerCase();
        return serviceLineFilter.some(f => sl === f.toLowerCase());
      });
    }

    if (statusFilter.length > 0) {
      result = result.filter(d => {
        const st = (d['Status'] || '').trim().toLowerCase();
        return statusFilter.some(f => st === f.toLowerCase());
      });
    }

    if (teamFilter.length > 0 || nameFilter.length > 0) {
      result = result.filter(d => {
        const at = d['Assign Team'];
        if (!at || typeof at !== 'string') return false;

        const parts = at.split('/').map(s => s.trim().toLowerCase()).filter(Boolean);
        if (parts.length === 0) return false;

        const rowTeams = parts.filter(p => p.length <= 2);
        const rowNames = parts.filter(p => p.length > 2);

        const teamMatch = teamFilter.length === 0 || teamFilter.some(f => rowTeams.includes(f.toLowerCase()));
        const nameMatch = nameFilter.length === 0 || nameFilter.some(f => rowNames.includes(f.toLowerCase()));

        return teamMatch && nameMatch;
      });
    }

    if (deliveryDateFilter.length > 0) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      result = result.filter(d => {
        const dd = (d['Deli_Date'] || '').trim().toLowerCase();

        return deliveryDateFilter.some(f => {
          if (f === 'Today') {
            if (d._targetTime) {
              return d._targetTime >= todayStart.getTime() && d._targetTime <= todayEnd.getTime();
            }
            return false;
          }
          return dd === f.toLowerCase();
        });
      });
    }

    // Apply global search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(row =>
        Object.keys(row).some(key => {
          if (key.startsWith('_')) return false;
          return String(row[key]).toLowerCase().includes(lowerQuery);
        })
      );
    }

    return result;
  }, [data, searchQuery, serviceLineFilter, statusFilter, teamFilter, nameFilter, deliveryDateFilter]);

  // Calculate Total Value based on filtered data
  const totalValue = useMemo(() => {
    return filteredData.reduce((sum, row) => {
      const valStr = row['Value'] || row['Amount'] || "0";
      const numStr = String(valStr).replace(/[^0-9.-]+/g, "");
      const num = parseFloat(numStr);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, [filteredData]);

  // Real-time Team Workload calculation
  const teamWorkload = useMemo(() => {
    const workload: Record<string, { count: number; value: number; members: Set<string> }> = {};
    
    data.forEach(d => {
      const status = (d['Status'] || '').toLowerCase();
      if (!status.includes('wip')) return;

      const valStr = d['Value'] || d['Amount'] || "0";
      const numStr = String(valStr).replace(/[^0-9.-]+/g, "");
      const value = parseFloat(numStr) || 0;

      const at = d['Assign Team'];
      if (at && typeof at === 'string') {
        const parts = at.split('/').map(s => s.trim()).filter(Boolean);
        const rowTeams = parts.filter(p => p.length <= 2).map(t => t.toUpperCase());
        const rowNames = parts.filter(p => p.length > 2);

        rowTeams.forEach(team => {
          if (!workload[team]) {
            workload[team] = { count: 0, value: 0, members: new Set() };
          }
          workload[team].count += 1;
          workload[team].value += value;
          rowNames.forEach(name => workload[team].members.add(name));
        });
      }
    });

    return Object.entries(workload).map(([team, stats]) => ({
      team,
      count: stats.count,
      value: stats.value,
      members: Array.from(stats.members).join(', ')
    })).sort((a, b) => b.count - a.count);
  }, [data]);

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes('wip')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (s.includes('cancel')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (s.includes('done') || s.includes('complete') || s.includes('delivered')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getTimelineStyle = (timeline: string) => {
    const t = (timeline || "").toLowerCase();
    if (t.includes('order late')) return 'bg-red-600 text-white border border-red-500 shadow-lg shadow-red-600/30 px-3 py-1 rounded-lg font-bold tracking-wide text-xs uppercase animate-pulse';
    if (t.includes('cancel') || t.includes('done') || t.includes('delivered')) return 'text-gray-400 font-bold';
    if (t.includes('s')) {
      const hasDays = t.includes('d');
      if (!hasDays || t.match(/^0d/)) return 'text-red-500 font-extrabold';
      const dMatch = t.match(/(\d+)d/);
      if (dMatch && parseInt(dMatch[1]) <= 2) return 'text-yellow-400 font-bold';
      return 'text-green-400 font-medium';
    }
    if (t.includes('day')) {
      const days = parseInt(t);
      if (days <= 2) return 'text-yellow-400 font-bold';
      return 'text-green-400 font-medium';
    }
    return 'text-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Stats & Search */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="flex flex-wrap gap-4">
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl glow-purple">
              <FileSpreadsheet className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Filtered Records</p>
              <p className="text-2xl font-bold text-white">{filteredData.length}</p>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl glow-green">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Active (WIP)</p>
              <p className="text-2xl font-bold text-white">
                {filteredData.filter(d => (d['Status'] || '').toLowerCase().includes('wip')).length}
              </p>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-xl">
              <DollarSign className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Total Value</p>
              <p className="text-2xl font-bold text-white">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search filtered records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input pl-11 pr-4 py-3"
          />
        </div>
      </div>

      {/* Team Workload Breakdown Card Panel - Premium and Interactive */}
      {teamWorkload.length > 0 && (
        <div className="glass-panel p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-glass-border pb-3">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>Team Workload & Active Assignment Metrics</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Real-time status of active WIP orders, workload load factor, and pipeline value distribution per team.</p>
            </div>
            <div className="px-3 py-1 bg-white/5 border border-glass-border rounded-xl text-[10px] text-gray-400 font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-green-400 animate-spin" />
              <span>Auto-Refresh Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamWorkload.map((tw) => {
              const maxWip = 8; // Max target WIP threshold
              const percentage = Math.min(100, (tw.count / maxWip) * 100);
              const isOverloaded = tw.count >= maxWip;

              return (
                <div key={tw.team} className="p-4 bg-white/5 border border-glass-border rounded-2xl hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[10px] font-black uppercase tracking-widest font-mono">
                        Team {tw.team}
                      </span>
                      <p className="text-xs text-gray-400 mt-2 truncate max-w-[180px]" title={tw.members}>
                        Members: <span className="text-gray-300 font-medium">{tw.members || 'None'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-white">{tw.count}</span>
                      <span className="text-gray-500 text-[10px] block">Active WIP</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400">
                      <span>Load Factor</span>
                      <span className={isOverloaded ? 'text-red-400' : percentage > 70 ? 'text-yellow-400' : 'text-green-400'}>
                        {Math.round(percentage)}% {isOverloaded ? '(Overloaded)' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          isOverloaded ? 'bg-red-500' : percentage > 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-green-500 to-emerald-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-semibold text-gray-500 pt-1">
                      <span>Active Pipeline Value</span>
                      <span className="text-yellow-400">${tw.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-2 text-gray-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-semibold uppercase tracking-wider">Filters:</span>
        </div>

        <MultiSelectDropdown
          label="Service Line"
          options={filterOptions.serviceLines}
          selected={serviceLineFilter}
          onChange={setServiceLineFilter}
        />

        <MultiSelectDropdown
          label="Status"
          options={filterOptions.statuses}
          selected={statusFilter}
          onChange={setStatusFilter}
        />

        <MultiSelectDropdown
          label="Team"
          options={filterOptions.teams}
          selected={teamFilter}
          onChange={setTeamFilter}
        />

        <MultiSelectDropdown
          label="Deli_Date"
          options={filterOptions.deliveryDates}
          selected={deliveryDateFilter}
          onChange={setDeliveryDateFilter}
          searchable={true}
        />

        <MultiSelectDropdown
          label="Names"
          options={filterOptions.names}
          selected={nameFilter}
          onChange={setNameFilter}
          searchable={true}
        />

        <div className="h-8 w-px bg-glass-border mx-2 hidden md:block"></div>

        <MultiSelectDropdown
          label="Columns"
          icon={Columns}
          options={allColumns}
          selected={visibleColumns}
          onChange={setVisibleColumns}
          searchable={true}
        />

        <div className="ml-auto flex gap-2">
          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-semibold transition-colors border border-glass-border"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors border border-purple-500/50 glow-purple"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={handleSaveFilters}
            disabled={isSavingFilter}
            className="flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-brand-green-hover text-black rounded-xl text-sm font-semibold transition-colors glow-green"
          >
            <Save className="w-4 h-4" />
            {isSavingFilter ? 'Saving...' : 'Save Filters'}
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div ref={tableRef} className={layoutStyles.container}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className={layoutStyles.headerBg}>
              <tr>
                {allColumns.filter(c => visibleColumns.includes(c)).map(col => (
                  <th key={col} className={layoutStyles.headerCell}>{col}</th>
                ))}
                <th className={layoutStyles.timelineHeaderCell}>Live Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border/30">
              <AnimatePresence>
                {filteredData.map((row, idx) => {
                  let displayTimeline = row['_originalTimeline'];

                  if (row._targetTime) {
                    const remainingSeconds = Math.max(0, Math.floor((row._targetTime - now) / 1000));

                    if (displayTimeline.toUpperCase().includes('CANCEL')) {
                      displayTimeline = row['_originalTimeline'];
                    } else if (displayTimeline.toUpperCase().includes('DONE') || displayTimeline.toUpperCase().includes('DELIVERED')) {
                      displayTimeline = row['_originalTimeline'];
                    } else {
                      displayTimeline = formatTimeline(remainingSeconds, row['_originalTimeline']);
                    }
                  }

                  return (
                    <motion.tr
                      key={row['Order ID'] + idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className={layoutStyles.rowClass}
                    >
                      {allColumns.filter(c => visibleColumns.includes(c)).map(col => {
                        const val = row[col];

                        if (col.toLowerCase().includes('link') || col.toLowerCase().includes('sheet') || String(val).startsWith('http')) {
                          return (
                            <td key={col} className="px-5 py-3">
                              {val && val !== '' ? (
                                <a href={String(val).startsWith('http') ? val : `https://${val}`} target="_blank" rel="noopener noreferrer" className={layoutStyles.linkBtn}>
                                  Link <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-gray-600">-</span>
                              )}
                            </td>
                          );
                        }

                        if (col.toLowerCase() === 'status') {
                          return (
                            <td key={col} className="px-5 py-3">
                              <span className={`inline-block font-semibold border ${
                                (val || '').toLowerCase().includes('wip') ? layoutStyles.statusWip :
                                (val || '').toLowerCase().includes('cancel') ? layoutStyles.statusCancel :
                                ((val || '').toLowerCase().includes('done') || (val || '').toLowerCase().includes('complete') || (val || '').toLowerCase().includes('delivered')) ? layoutStyles.statusDone :
                                layoutStyles.statusDefault
                              }`}>
                                {val || 'None'}
                              </span>
                            </td>
                          );
                        }

                        if (col.toLowerCase() === 'order id') {
                          return (
                            <td key={col} className="px-5 py-3">
                              <span className={layoutStyles.idBadge}>
                                {val}
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td key={col} className={`px-5 py-3 ${layoutStyles.cellText}`}>
                            <HighlightMatch text={String(val || '')} query={searchQuery} />
                          </td>
                        );
                      })}

                      <td className={layoutStyles.timelineRowCell}>
                        <div className="flex items-center gap-2">
                          {!displayTimeline?.toUpperCase().includes('ORDER LATE') && !displayTimeline?.toUpperCase().includes('CANCEL') && !displayTimeline?.toUpperCase().includes('DONE') && !displayTimeline?.toUpperCase().includes('DELIVERED') && (
                            <Clock className={`w-4 h-4 ${
                              displayTimeline?.toLowerCase().includes('order late') ? layoutStyles.timelineLate :
                              displayTimeline?.toLowerCase().includes('cancel') ? layoutStyles.timelineCancel :
                              (displayTimeline?.toLowerCase().includes('done') || displayTimeline?.toLowerCase().includes('delivered')) ? layoutStyles.timelineDone :
                              displayTimeline?.toLowerCase().includes('s') && (!displayTimeline?.toLowerCase().includes('d') || displayTimeline?.toLowerCase().match(/^0d/)) ? layoutStyles.timelineS :
                              displayTimeline?.toLowerCase().includes('s') && displayTimeline?.toLowerCase().match(/(\d+)d/) && parseInt(displayTimeline?.toLowerCase().match(/(\d+)d/)?.[1] || '0') <= 2 ? layoutStyles.timelineS2 :
                              displayTimeline?.toLowerCase().includes('day') && parseInt(displayTimeline?.toLowerCase() || '0') <= 2 ? layoutStyles.timelineS2 :
                              displayTimeline?.toLowerCase().includes('day') || displayTimeline?.toLowerCase().includes('s') ? layoutStyles.timelineSafe :
                              layoutStyles.timelineDefault
                            }`} />
                          )}
                          <span className={`${
                            displayTimeline?.toLowerCase().includes('order late') ? layoutStyles.timelineLate :
                            displayTimeline?.toLowerCase().includes('cancel') ? layoutStyles.timelineCancel :
                            (displayTimeline?.toLowerCase().includes('done') || displayTimeline?.toLowerCase().includes('delivered')) ? layoutStyles.timelineDone :
                            displayTimeline?.toLowerCase().includes('s') && (!displayTimeline?.toLowerCase().includes('d') || displayTimeline?.toLowerCase().match(/^0d/)) ? layoutStyles.timelineS :
                            displayTimeline?.toLowerCase().includes('s') && displayTimeline?.toLowerCase().match(/(\d+)d/) && parseInt(displayTimeline?.toLowerCase().match(/(\d+)d/)?.[1] || '0') <= 2 ? layoutStyles.timelineS2 :
                            displayTimeline?.toLowerCase().includes('day') && parseInt(displayTimeline?.toLowerCase() || '0') <= 2 ? layoutStyles.timelineS2 :
                            displayTimeline?.toLowerCase().includes('day') || displayTimeline?.toLowerCase().includes('s') ? layoutStyles.timelineSafe :
                            layoutStyles.timelineDefault
                          } tabular-nums tracking-tight ${displayTimeline?.toUpperCase().includes('ORDER LATE') ? 'inline-block text-center w-full' : ''}`}>
                            {displayTimeline}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="px-6 py-12 text-center text-gray-500">
                    No records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
