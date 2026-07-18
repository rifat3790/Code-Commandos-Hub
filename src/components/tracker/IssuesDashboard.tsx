"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle2, FileSpreadsheet, ExternalLink, Filter, ChevronDown, Columns, Save, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

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
                onClick={() => { onChange([]); setIsOpen(false); }}
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
                    onClick={() => {
                      if (isSelected) onChange(selected.filter(s => s !== opt));
                      else onChange([...selected, opt]);
                    }}
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

export default function IssuesDashboard({ csvData, activeLayout }: { csvData: string; activeLayout?: string }) {
  const { user, dbUser } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const tableRef = useRef<HTMLDivElement>(null);

  const [isSavingFilter, setIsSavingFilter] = useState(false);

  // Filters State
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [teamFilter, setTeamFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [assignTeamFilter, setAssignTeamFilter] = useState<string[]>([]);
  const [nameFilter, setNameFilter] = useState<string[]>([]);

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
          dateText: "font-mono text-xs text-gray-400",
          teamBadge: "px-2 py-0.5 bg-gray-800 border border-gray-700 text-gray-400 rounded-none text-xs",
          statusOpen: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-none px-2 py-0.5",
          statusClose: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-none px-2 py-0.5",
          statusIssue: "bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-none px-2 py-0.5",
          statusDefault: "bg-gray-800 text-gray-400 border border-gray-700 rounded-none px-2 py-0.5",
          urgencyHigh: "bg-rose-500/10 text-rose-455 border border-rose-500/20 px-2 py-0.5 rounded-none font-bold text-xs",
          urgencyMedium: "bg-amber-500/10 text-amber-455 border border-amber-500/20 px-2 py-0.5 rounded-none font-semibold text-xs",
          urgencyLow: "bg-blue-500/10 text-blue-455 border border-blue-500/20 px-2 py-0.5 rounded-none text-xs",
          linkBtn: "inline-flex items-center gap-1 px-2.5 py-1 bg-gray-850 text-gray-300 border border-gray-700 hover:bg-gray-750 hover:text-white transition-all text-xs font-semibold rounded-none"
        };
      case 'aurora':
        return {
          container: "glass-panel overflow-hidden border border-indigo-500/20 rounded-3xl shadow-[0_8px_32px_rgba(99,102,241,0.15)]",
          headerBg: "bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 text-indigo-200 border-b border-indigo-500/20",
          headerCell: "px-5 py-4 text-indigo-300 font-semibold text-xs tracking-wider uppercase",
          rowClass: "hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-indigo-500/5 border-b border-indigo-500/10 transition-all duration-300 even:bg-indigo-950/5 odd:bg-purple-950/5",
          cellText: "text-gray-300 font-medium",
          dateText: "font-mono text-xs text-indigo-300/75",
          teamBadge: "px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full text-xs",
          statusOpen: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
          statusClose: "bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(168,85,247,0.1)]",
          statusIssue: "bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(244,63,94,0.1)]",
          statusDefault: "bg-gray-850 text-gray-400 border border-gray-700/30 rounded-full px-3 py-1",
          urgencyHigh: "bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-full font-bold animate-pulse text-xs",
          urgencyMedium: "bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-semibold text-xs",
          urgencyLow: "bg-blue-500/10 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full text-xs",
          linkBtn: "inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500/60 rounded-xl transition-all duration-300 text-xs font-semibold hover:scale-[1.02] shadow-[0_2px_8px_rgba(99,102,241,0.1)]"
        };
      case 'cyber':
        return {
          container: "bg-[#05070a] border border-emerald-500/20 rounded-none shadow-[0_0_20px_rgba(16,185,129,0.05)]",
          headerBg: "bg-black text-emerald-400 font-mono tracking-widest text-xs uppercase border-b-2 border-emerald-500/30",
          headerCell: "px-5 py-4 text-emerald-400 font-mono tracking-wider text-xs uppercase",
          rowClass: "hover:bg-emerald-950/10 hover:shadow-[inset_4px_0_0_0_#10b981] border-b border-emerald-500/5 transition-all duration-200 font-mono text-gray-300",
          cellText: "text-gray-300 font-mono text-xs",
          dateText: "font-mono text-xs text-emerald-500/70",
          teamBadge: "px-2 py-0.5 bg-black border border-emerald-500/30 text-emerald-400 text-xs font-mono",
          statusOpen: "bg-emerald-950 text-emerald-400 border border-emerald-500/50 rounded-none px-2 py-0.5 font-mono",
          statusClose: "bg-purple-955 text-purple-400 border border-purple-500/50 rounded-none px-2 py-0.5 font-mono",
          statusIssue: "bg-red-955 text-red-400 border border-red-500/50 rounded-none px-2 py-0.5 font-mono animate-pulse",
          statusDefault: "bg-gray-900 text-gray-500 border border-gray-800 rounded-none px-2 py-0.5 font-mono",
          urgencyHigh: "bg-red-955 text-red-400 border border-red-500/50 px-2 py-0.5 rounded-none font-bold animate-pulse text-xs font-mono",
          urgencyMedium: "bg-yellow-955 text-yellow-400 border border-yellow-500/50 px-2 py-0.5 rounded-none font-semibold text-xs font-mono",
          urgencyLow: "bg-blue-955 text-blue-400 border border-blue-500/50 px-2 py-0.5 rounded-none text-xs font-mono",
          linkBtn: "inline-flex items-center gap-1.5 px-2.5 py-1 bg-black text-emerald-400 border border-emerald-500/30 hover:bg-emerald-950 hover:border-emerald-500 transition-colors text-xs font-mono"
        };
      case 'gold':
        return {
          container: "bg-[#0b0b0b] border border-amber-500/20 rounded-xl shadow-[0_8px_30px_rgba(217,119,6,0.05)]",
          headerBg: "bg-[#141414] text-amber-300 font-bold uppercase tracking-wider text-[11px] border-b border-amber-500/20",
          headerCell: "px-5 py-4.5 text-amber-300 font-bold text-[11px] uppercase tracking-wider",
          rowClass: "hover:bg-amber-500/5 hover:shadow-[inset_4px_0_0_0_#d97706] border-b border-amber-500/10 transition-all duration-300 even:bg-[#111111]/30 odd:bg-black/40",
          cellText: "text-gray-200 font-medium",
          dateText: "font-mono text-xs text-amber-500/70",
          teamBadge: "px-2.5 py-0.5 bg-black border border-amber-500/20 text-amber-200 rounded-md text-xs font-semibold",
          statusOpen: "bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md px-2.5 py-1 font-semibold",
          statusClose: "bg-[#d97706]/10 text-amber-200 border border-amber-600/30 rounded-md px-2.5 py-1 font-semibold",
          statusIssue: "bg-red-500/10 text-red-400 border border-red-500/30 rounded-md px-2.5 py-1 font-semibold animate-pulse",
          statusDefault: "bg-gray-800 text-gray-400 border border-gray-700 rounded-md px-2.5 py-1",
          urgencyHigh: "bg-red-500/10 text-red-450 border border-red-500/30 px-2.5 py-1 rounded-md font-bold text-xs",
          urgencyMedium: "bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md font-semibold text-xs",
          urgencyLow: "bg-gray-850 text-gray-300 border border-gray-700 px-2.5 py-1 rounded-md text-xs",
          linkBtn: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] text-amber-300 border border-amber-500/20 hover:border-amber-500 hover:bg-amber-500 hover:text-black rounded-lg transition-all duration-300 text-xs font-semibold shadow-sm"
        };
      case 'obsidian':
        return {
          container: "bg-[#0c0d12] border border-[#1b1d26] rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.6)]",
          headerBg: "bg-[#07080a] text-gray-400 font-bold uppercase tracking-wider text-[11px] border-b border-[#1f222e]",
          headerCell: "px-5 py-4 text-gray-400 font-bold text-[11px] uppercase tracking-wider",
          rowClass: "hover:bg-[#141722] border-b border-[#141620] transition-colors group even:bg-[#0c0d12] odd:bg-[#0e1017]",
          cellText: "text-gray-300 font-normal",
          dateText: "font-mono text-xs text-gray-400",
          teamBadge: "px-2 py-0.5 bg-[#171a26] border border-[#262b3d] text-gray-400 rounded text-xs",
          statusOpen: "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 rounded-md px-2 py-0.5",
          statusClose: "bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20 rounded-md px-2 py-0.5",
          statusIssue: "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 rounded-md px-2 py-0.5",
          statusDefault: "bg-[#4b5563]/10 text-[#9ca3af] border border-[#4b5563]/20 rounded-md px-2 py-0.5",
          urgencyHigh: "bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30 px-2 py-0.5 rounded-md font-bold text-xs animate-pulse",
          urgencyMedium: "bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 px-2 py-0.5 rounded-md font-semibold text-xs",
          urgencyLow: "bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/30 px-2 py-0.5 rounded-md text-xs",
          linkBtn: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171a26] text-gray-300 border border-[#2b3046] hover:bg-[#202436] hover:text-white rounded-lg transition-colors text-xs font-semibold"
        };
      case 'frost':
        return {
          container: "bg-slate-950/40 backdrop-blur-md border border-cyan-500/20 rounded-2xl shadow-[0_8px_32px_rgba(6,182,212,0.15)]",
          headerBg: "bg-[#0a141d]/60 text-cyan-300 font-semibold tracking-wide text-xs uppercase border-b border-cyan-500/20",
          headerCell: "px-5 py-4 text-cyan-300 font-semibold tracking-wide text-xs uppercase",
          rowClass: "hover:bg-cyan-500/10 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] border-b border-cyan-500/10 transition-all duration-300 even:bg-cyan-950/5 odd:bg-slate-900/5",
          cellText: "text-slate-200 font-medium",
          dateText: "font-mono text-xs text-cyan-300/75",
          teamBadge: "px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-full text-xs",
          statusOpen: "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(6,182,212,0.1)]",
          statusClose: "bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(168,85,247,0.1)]",
          statusIssue: "bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(244,63,94,0.1)] animate-pulse",
          statusDefault: "bg-slate-800/40 text-slate-400 border border-slate-700/30 rounded-full px-3 py-1",
          urgencyHigh: "bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-full font-bold animate-pulse text-xs",
          urgencyMedium: "bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-semibold text-xs",
          urgencyLow: "bg-blue-500/10 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full text-xs",
          linkBtn: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/20 text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-cyan-500/60 rounded-xl transition-all duration-300 text-xs font-semibold"
        };
      case 'tokyo':
        return {
          container: "bg-[#090515] border border-pink-500/20 rounded-none shadow-[0_0_20px_rgba(236,72,153,0.1)]",
          headerBg: "bg-black text-pink-400 font-extrabold uppercase tracking-widest text-[11px] border-b-2 border-pink-500/50",
          headerCell: "px-5 py-4 text-pink-400 font-bold text-xs tracking-wider uppercase",
          rowClass: "hover:bg-pink-950/15 hover:shadow-[inset_4px_0_0_0_#ec4899] border-b border-pink-500/10 transition-all duration-200 even:bg-[#0c061d]/40 odd:bg-black/60",
          cellText: "text-gray-300 font-semibold",
          dateText: "font-mono text-xs text-pink-400/80",
          teamBadge: "px-2 py-0.5 bg-black border border-cyan-500/30 text-cyan-400 text-xs font-mono rounded-none",
          statusOpen: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/40 rounded-none px-3 py-1 shadow-[0_0_10px_rgba(6,182,212,0.2)] animate-pulse font-mono",
          statusClose: "bg-purple-500/10 text-purple-400 border border-purple-500/40 rounded-none px-3 py-1 font-mono",
          statusIssue: "bg-pink-500/10 text-pink-400 border border-pink-500/40 rounded-none px-3 py-1 shadow-[0_0_10px_rgba(236,72,153,0.2)] animate-pulse font-mono",
          statusDefault: "bg-gray-900 text-gray-500 border border-gray-800 rounded-none px-3 py-1 font-mono",
          urgencyHigh: "bg-pink-500/10 text-pink-400 border border-pink-500/40 px-2 py-0.5 rounded-none font-bold animate-pulse text-xs font-mono",
          urgencyMedium: "bg-purple-500/10 text-purple-400 border border-purple-500/40 px-2 py-0.5 rounded-none font-semibold text-xs font-mono",
          urgencyLow: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/40 px-2 py-0.5 rounded-none text-xs font-mono",
          linkBtn: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-pink-400 border border-pink-500/40 hover:bg-pink-950 hover:text-white rounded-none transition-all duration-200 text-xs font-mono"
        };
      case 'emerald':
        return {
          container: "bg-[#030d07] border border-emerald-500/20 rounded-xl shadow-[0_8px_30px_rgba(16,185,129,0.05)]",
          headerBg: "bg-[#05140b] text-emerald-300 font-bold uppercase tracking-wider text-[11px] border-b border-emerald-500/20",
          headerCell: "px-5 py-4.5 text-emerald-300 font-bold text-[11px] uppercase tracking-wider",
          rowClass: "hover:bg-emerald-950/20 hover:shadow-[inset_4px_0_0_0_#10b981] border-b border-emerald-500/10 transition-all duration-300 even:bg-[#041209]/30 odd:bg-black/50",
          cellText: "text-gray-300 font-medium",
          dateText: "font-mono text-xs text-emerald-400/80",
          teamBadge: "px-2.5 py-0.5 bg-black border border-emerald-500/20 text-emerald-250 rounded-md text-xs font-semibold",
          statusOpen: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md px-2.5 py-1 font-semibold shadow-[0_0_10px_rgba(16,185,129,0.1)]",
          statusClose: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-md px-2.5 py-1 font-semibold",
          statusIssue: "bg-red-500/10 text-red-400 border border-red-500/30 rounded-md px-2.5 py-1 font-semibold animate-pulse",
          statusDefault: "bg-gray-800 text-gray-400 border border-gray-700 rounded-md px-2.5 py-1",
          urgencyHigh: "bg-red-500/10 text-red-450 border border-red-500/30 px-2.5 py-1 rounded-md font-bold text-xs animate-pulse",
          urgencyMedium: "bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md font-semibold text-xs",
          urgencyLow: "bg-gray-850 text-gray-300 border border-gray-700 px-2.5 py-1 rounded-md text-xs",
          linkBtn: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#04140a] text-emerald-300 border border-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-500 hover:text-black rounded-lg transition-all duration-300 text-xs font-semibold"
        };
      case 'cosmic':
        return {
          container: "bg-[#070514] border border-violet-500/20 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)]",
          headerBg: "bg-gradient-to-r from-violet-950/60 via-fuchsia-950/40 to-indigo-950/60 text-fuchsia-200 border-b border-fuchsia-500/20",
          headerCell: "px-5 py-4 text-fuchsia-200 font-semibold tracking-wide text-xs uppercase",
          rowClass: "hover:bg-gradient-to-r hover:from-violet-500/10 hover:to-fuchsia-500/10 border-b border-violet-500/10 transition-all duration-300 even:bg-[#0a071d]/40 odd:bg-black/60",
          cellText: "text-slate-200 font-medium",
          dateText: "font-mono text-xs text-violet-300/70",
          teamBadge: "px-2.5 py-0.5 bg-violet-950/30 border border-violet-500/30 text-violet-300 rounded-xl text-xs font-medium",
          statusOpen: "bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(217,70,239,0.15)] animate-pulse",
          statusClose: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(99,102,241,0.15)]",
          statusIssue: "bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(244,63,94,0.15)] animate-pulse",
          statusDefault: "bg-[#18182e]/50 text-slate-400 border border-slate-700/30 rounded-full px-3 py-1",
          urgencyHigh: "bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-full font-bold animate-pulse text-xs",
          urgencyMedium: "bg-violet-500/10 text-violet-300 border border-violet-500/30 px-2.5 py-1 rounded-full font-semibold text-xs",
          urgencyLow: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full text-xs",
          linkBtn: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-950/20 text-violet-300 hover:text-white border border-violet-500/30 hover:border-violet-500/60 rounded-xl transition-all duration-300 text-xs font-semibold shadow-[0_2px_8px_rgba(139,92,246,0.1)]"
        };
      default: // Neon Glassmorphic (Legacy-like but premium)
        return {
          container: "glass-panel overflow-hidden border border-glass-border rounded-xl",
          headerBg: "bg-gray-900/90 text-gray-300 font-medium border-b border-glass-border",
          headerCell: "px-5 py-4 tracking-wide text-gray-300 font-medium text-sm",
          rowClass: "hover:bg-gray-800/60 border-b border-glass-border/30 transition-colors group even:bg-gray-900/5 odd:bg-gray-950/5",
          cellText: "text-gray-300 font-normal",
          dateText: "font-mono text-xs text-gray-400",
          teamBadge: "px-2 py-0.5 bg-gray-900 border border-glass-border rounded text-xs text-gray-400",
          statusOpen: "bg-green-500/20 text-green-400 border border-green-500/30 rounded px-2 py-0.5",
          statusClose: "bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded px-2 py-0.5",
          statusIssue: "bg-red-500/20 text-red-400 border border-red-500/30 rounded px-2 py-0.5",
          statusDefault: "bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded px-2 py-0.5",
          urgencyHigh: "bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-xs",
          urgencyMedium: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded text-xs",
          urgencyLow: "bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-xs",
          linkBtn: "inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-md transition-colors border border-purple-500/20 text-xs font-semibold"
        };
    }
  }, [activeLayout]);

  useEffect(() => {
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Map empty key "" to "Assign Name" if it exists in parsed row objects
        results.data.forEach((row: any) => {
          if (row[''] !== undefined) {
            row['Assign Name'] = row[''];
            delete row[''];
          }
        });

        let extractedColumns: string[] = [];
        if (results.data.length > 0) {
          extractedColumns = Object.keys(results.data[0] as Record<string, unknown>).filter(k => k && k.trim() !== '' && !k.startsWith('_'));
          setAllColumns(extractedColumns);
        }

        const validData = results.data.filter((row: any) => Object.keys(row).length > 1 && row['Date']);
        setData(validData);

        const tf = dbUser?.issuesFilters || {};

        setVisibleColumns(prev => {
          if (prev.length > 0) return prev;
          if (tf.visibleColumns) return tf.visibleColumns;
          return extractedColumns; // By default show all columns for Issues
        });

        setAssignTeamFilter(prev => {
          if (prev.length > 0) return prev;
          if (tf.assignTeamFilter) return tf.assignTeamFilter;
          return ['CC'];
        });

        setTeamFilter(prev => {
          if (prev.length > 0) return prev;
          if (tf.teamFilter) return tf.teamFilter;
          return [];
        });

        setStatusFilter(prev => {
          if (prev.length > 0) return prev;
          if (tf.statusFilter) return tf.statusFilter;
          return [];
        });

        setNameFilter(prev => {
          if (prev.length > 0) return prev;
          if (tf.nameFilter) return tf.nameFilter;
          return [];
        });
      }
    });
  }, [csvData, dbUser]);

  // Extract unique filter options dynamically from data
  const filterOptions = useMemo(() => {
    const teams = new Set<string>();
    const statuses = new Set<string>();
    const assignTeams = new Set<string>();
    const names = new Set<string>();

    data.forEach(d => {
      if (d['Team']) teams.add(d['Team'].trim());
      if (d['Status']) statuses.add(d['Status'].trim());

      const at = d['Assign Name'];
      if (at && typeof at === 'string') {
        const parts = at.split('/').map(s => s.trim()).filter(Boolean);
        parts.forEach(p => {
          if (p.length <= 3 && p.toUpperCase() === p) {
            assignTeams.add(p);
          } else if (p.length <= 2) {
            assignTeams.add(p.toUpperCase());
          } else {
            names.add(p);
          }
        });
      }
    });

    return {
      teams: Array.from(teams).sort(),
      statuses: Array.from(statuses).sort(),
      assignTeams: Array.from(assignTeams).sort(),
      names: Array.from(names).sort()
    };
  }, [data]);

  // Apply filters
  const filteredData = useMemo(() => {
    let result = data;

    if (teamFilter.length > 0) {
      result = result.filter(d => {
        const t = (d['Team'] || '').trim().toLowerCase();
        return teamFilter.some(f => t === f.toLowerCase());
      });
    }

    if (statusFilter.length > 0) {
      result = result.filter(d => {
        const st = (d['Status'] || '').trim().toLowerCase();
        return statusFilter.some(f => st === f.toLowerCase());
      });
    }

    if (assignTeamFilter.length > 0 || nameFilter.length > 0) {
      result = result.filter(d => {
        const at = d['Assign Name'];
        if (!at || typeof at !== 'string') return false;

        const parts = at.split('/').map(s => s.trim()).filter(Boolean);
        if (parts.length === 0) return false;

        const rowTeams = parts
          .filter(p => (p.length <= 3 && p.toUpperCase() === p) || p.length <= 2)
          .map(p => p.toLowerCase());
        const rowNames = parts
          .filter(p => !((p.length <= 3 && p.toUpperCase() === p) || p.length <= 2))
          .map(p => p.toLowerCase());

        const teamMatch = assignTeamFilter.length === 0 || assignTeamFilter.some(f => rowTeams.includes(f.toLowerCase()));
        const nameMatch = nameFilter.length === 0 || nameFilter.some(f => rowNames.includes(f.toLowerCase()));

        return teamMatch && nameMatch;
      });
    }

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
  }, [data, searchQuery, teamFilter, statusFilter, assignTeamFilter, nameFilter]);

  const handleSaveFilters = async () => {
    if (!user) {
      toast.error("You must be logged in to save filters.");
      return;
    }

    setIsSavingFilter(true);
    try {
      const filtersToSave = {
        visibleColumns,
        teamFilter,
        statusFilter,
        assignTeamFilter,
        nameFilter
      };

      const res = await fetch(`/api/users/me?uid=${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issuesFilters: filtersToSave })
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
        link.download = 'issues-tracker.png';
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
        pdf.save('project-issues.pdf');

        toast.dismiss(toastId);
        toast.success("Downloaded as PDF");
      } catch (err) {
        console.error(err);
        toast.dismiss(toastId);
        toast.error("Failed to download PDF");
      }
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes('open')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (s.includes('close') || s.includes('done')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (s.includes('issue')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="flex flex-wrap gap-4">
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl glow-purple">
              <FileSpreadsheet className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Total Issues</p>
              <p className="text-2xl font-bold text-white">{filteredData.length}</p>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl glow-red">
              <CheckCircle2 className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Open Issues</p>
              <p className="text-2xl font-bold text-white">
                {filteredData.filter(d => (d['Status'] || '').toLowerCase().includes('open')).length}
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
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input pl-11 pr-4 py-3"
          />
        </div>
      </div>

      <div className="glass-panel p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-2 text-gray-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-semibold uppercase tracking-wider">Filters:</span>
        </div>

        <MultiSelectDropdown
          label="Team"
          options={filterOptions.teams}
          selected={teamFilter}
          onChange={setTeamFilter}
        />

        <MultiSelectDropdown
          label="Status"
          options={filterOptions.statuses}
          selected={statusFilter}
          onChange={setStatusFilter}
        />

        <MultiSelectDropdown
          label="Assign Team"
          options={filterOptions.assignTeams}
          selected={assignTeamFilter}
          onChange={setAssignTeamFilter}
        />

        <MultiSelectDropdown
          label="Assign Name"
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
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors border border-red-500/50 glow-red"
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

      <div ref={tableRef} className={layoutStyles.container}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className={layoutStyles.headerBg}>
              <tr>
                {allColumns.filter(c => visibleColumns.includes(c)).map(col => (
                  <th key={col} className={layoutStyles.headerCell}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border/30">
              <AnimatePresence>
                {filteredData.map((row, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className={layoutStyles.rowClass}
                  >
                    {allColumns.filter(c => visibleColumns.includes(c)).map(col => {
                      const val = row[col];

                      if (col.toLowerCase().includes('url') || col.toLowerCase().includes('link') || String(val).startsWith('http')) {
                        return (
                          <td key={col} className="px-5 py-3 text-gray-300">
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
                              (val || '').toLowerCase().includes('open') ? layoutStyles.statusOpen :
                              ((val || '').toLowerCase().includes('close') || (val || '').toLowerCase().includes('done')) ? layoutStyles.statusClose :
                              (val || '').toLowerCase().includes('issue') ? layoutStyles.statusIssue :
                              layoutStyles.statusDefault
                            }`}>
                              {val || 'None'}
                            </span>
                          </td>
                        );
                      }

                      if (col.toLowerCase() === 'date') {
                        return (
                          <td key={col} className="px-5 py-3">
                            <span className={layoutStyles.dateText}>
                              {val}
                            </span>
                          </td>
                        );
                      }

                      if (col.toLowerCase() === 'team') {
                        return (
                          <td key={col} className="px-5 py-3">
                            <span className={layoutStyles.teamBadge}>
                              {val}
                            </span>
                          </td>
                        );
                      }



                      if (col.toLowerCase() === 'urgency' || col.toLowerCase() === 'priority') {
                        const s = String(val).toLowerCase();
                        return (
                          <td key={col} className="px-5 py-3">
                            <span className={`inline-block font-semibold border ${
                              s.includes('high') || s.includes('critical') || s.includes('urgent') ? layoutStyles.urgencyHigh :
                              s.includes('medium') || s.includes('warn') ? layoutStyles.urgencyMedium :
                              s.includes('low') || s.includes('minor') ? layoutStyles.urgencyLow :
                              layoutStyles.statusDefault
                            }`}>
                              {val}
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td key={col} className={`px-5 py-3 ${layoutStyles.cellText}`}>
                          {val}
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-6 py-12 text-center text-gray-500">
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
