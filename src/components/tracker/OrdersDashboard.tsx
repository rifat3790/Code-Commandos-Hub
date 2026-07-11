"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, CheckCircle2, FileSpreadsheet, ExternalLink, Filter, ChevronDown, Columns, DollarSign, Save, Download } from 'lucide-react';
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
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
          !isAll ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-gray-900/50 border-glass-border text-gray-300 hover:bg-gray-800'
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

export default function OrdersDashboard({ csvData }: { csvData: string }) {
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

  // Extract unique filter options dynamically from data
  const filterOptions = useMemo(() => {
    const serviceLines = new Set<string>();
    const statuses = new Set<string>();
    const teams = new Set<string>();
    const names = new Set<string>();
    const deliveryDates = new Set<string>();
    deliveryDates.add('Today');

    data.forEach(d => {
      if (d['Service Line']) serviceLines.add(d['Service Line'].trim());
      if (d['Status']) statuses.add(d['Status'].trim());
      if (d['Deli_Date']) deliveryDates.add(d['Deli_Date'].trim());
      
      const at = d['Assign Team'];
      if (at && typeof at === 'string') {
        const parts = at.split('/').map(s => s.trim()).filter(Boolean);
        parts.forEach(p => {
          if (p.length <= 2) {
            teams.add(p.toUpperCase());
          } else {
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
  }, [data]);

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

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes('wip')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (s.includes('cancel')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (s.includes('done') || s.includes('complete') || s.includes('delivered')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getTimelineStyle = (timeline: string) => {
    const t = (timeline || "").toLowerCase();
    if (t.includes('order late')) {
      return 'bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full font-bold tracking-wider text-[11px] uppercase animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.2)]';
    }
    if (t.includes('cancel')) {
      return 'bg-gray-800/50 text-gray-500 border border-gray-700/30 px-3 py-1 rounded-full font-medium text-xs';
    }
    if (t.includes('done') || t.includes('complete') || t.includes('delivered')) {
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full font-semibold text-xs shadow-[0_0_10px_rgba(168,85,247,0.1)]';
    }
    
    // Active timer countdowns
    if (t.includes('s')) {
      const hasDays = t.includes('d');
      if (!hasDays || t.match(/^0d/)) {
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full font-bold text-xs animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.1)]';
      }
      const dMatch = t.match(/(\d+)d/);
      if (dMatch && parseInt(dMatch[1]) <= 2) {
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-semibold text-xs shadow-[0_0_10px_rgba(245,158,11,0.1)]';
      }
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-medium text-xs shadow-[0_0_10px_rgba(16,185,129,0.1)]';
    }
    
    if (t.includes('day')) {
      const days = parseInt(t);
      if (days <= 2) {
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-semibold text-xs';
      }
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-medium text-xs';
    }
    
    return 'bg-gray-800/40 text-gray-300 border border-gray-700/20 px-3 py-1 rounded-full font-medium text-xs';
  };

  const renderStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    let colorClasses = "bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20";
    let dotColor = "bg-gray-400";
    
    if (s.includes('wip')) {
      colorClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)] hover:bg-emerald-500/20";
      dotColor = "bg-emerald-400 animate-pulse";
    } else if (s.includes('cancel')) {
      colorClasses = "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.1)] hover:bg-rose-500/20";
      dotColor = "bg-rose-400";
    } else if (s.includes('done') || s.includes('complete') || s.includes('delivered')) {
      colorClasses = "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.1)] hover:bg-purple-500/20";
      dotColor = "bg-purple-400";
    }

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${colorClasses} transition-all duration-300`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span>{status || 'None'}</span>
      </div>
    );
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
      <div ref={tableRef} className="glass-panel-heavy overflow-hidden border border-glass-border rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gradient-to-r from-gray-950 via-gray-900/60 to-gray-950 text-gray-400 font-semibold tracking-wider text-xs uppercase border-b border-glass-border">
              <tr>
                {allColumns.filter(c => visibleColumns.includes(c)).map(col => (
                  <th key={col} className="px-6 py-4.5 tracking-wide text-gray-400 font-semibold text-xs uppercase">{col}</th>
                ))}
                <th className="px-6 py-4.5 tracking-wide sticky right-0 bg-gray-950/95 z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.5)] border-l border-glass-border text-purple-400 text-xs uppercase font-semibold text-center">Live Timeline</th>
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
                      className="hover:bg-purple-950/10 hover:shadow-[inset_4px_0_0_0_#a855f7] border-b border-glass-border/30 transition-all duration-300 group even:bg-gray-900/10 odd:bg-gray-950/5"
                    >
                      {allColumns.filter(c => visibleColumns.includes(c)).map(col => {
                        const val = row[col];
                        
                        if (col.toLowerCase().includes('link') || col.toLowerCase().includes('sheet') || String(val).startsWith('http')) {
                          return (
                            <td key={col} className="px-6 py-3.5 text-gray-300">
                               {val && val !== '' ? (
                                  <a 
                                    href={String(val).startsWith('http') ? val : `https://${val}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 text-purple-300 hover:text-purple-200 rounded-lg transition-all duration-300 border border-purple-500/20 hover:border-purple-500/40 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                                  >
                                    <span className="text-xs font-semibold">Open</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                               ) : (
                                  <span className="text-gray-600">-</span>
                                )}
                            </td>
                          );
                        }

                        if (col.toLowerCase() === 'status') {
                          return (
                            <td key={col} className="px-6 py-3.5">
                              {renderStatusBadge(val)}
                            </td>
                          );
                        }

                        if (col.toLowerCase() === 'order id') {
                           return (
                             <td key={col} className="px-6 py-3.5">
                               <span className="font-mono text-xs px-2.5 py-1 bg-gray-900/90 border border-glass-border hover:border-purple-500/30 text-purple-300 font-semibold rounded-lg shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] transition-colors">
                                 {val}
                               </span>
                             </td>
                           );
                        }

                        if (col.toLowerCase() === 'value' || col.toLowerCase() === 'amount' || col.toLowerCase() === 'price') {
                           return (
                             <td key={col} className="px-6 py-3.5">
                               <span className="font-bold text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.15)] tabular-nums text-sm">
                                 {val}
                               </span>
                             </td>
                           );
                        }

                        if (col.toLowerCase() === 'assign team') {
                           return (
                             <td key={col} className="px-6 py-3.5">
                               <div className="flex flex-wrap gap-1.5 items-center">
                                 {String(val).split('/').map((part, pIdx) => {
                                   const trimmed = part.trim();
                                   if (!trimmed) return null;
                                   const isTeam = trimmed.length <= 3 && trimmed === trimmed.toUpperCase();
                                   return (
                                     <span 
                                       key={pIdx} 
                                       className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                         isTeam 
                                           ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.05)]' 
                                           : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.05)]'
                                       }`}
                                     >
                                       {trimmed}
                                     </span>
                                   );
                                 })}
                               </div>
                             </td>
                           );
                        }

                        if (col.toLowerCase() === 'client name' || col.toLowerCase() === 'profile name') {
                           return (
                             <td key={col} className="px-6 py-3.5">
                               <span className="font-medium text-white group-hover:text-purple-200 transition-colors duration-200">
                                 {val}
                               </span>
                             </td>
                           );
                        }

                        return (
                          <td key={col} className="px-6 py-3.5 text-gray-300">
                            <span className="group-hover:text-white transition-colors duration-200">{val}</span>
                          </td>
                        );
                      })}
                      
                      <td className="px-6 py-3.5 sticky right-0 bg-gray-905 group-hover:bg-[#12182b] z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.5)] border-l border-glass-border transition-colors">
                        <div className="flex items-center justify-center">
                          <div className={`flex items-center gap-1.5 ${getTimelineStyle(displayTimeline)}`}>
                            {!displayTimeline?.toUpperCase().includes('ORDER LATE') && !displayTimeline?.toUpperCase().includes('CANCEL') && !displayTimeline?.toUpperCase().includes('DONE') && !displayTimeline?.toUpperCase().includes('DELIVERED') && (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            <span className="tabular-nums tracking-tight font-mono">
                              {displayTimeline}
                            </span>
                          </div>
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
