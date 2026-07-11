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

export default function IssuesDashboard({ csvData }: { csvData: string }) {
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

  useEffect(() => {
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
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
        
        const parts = at.split('/').map(s => s.trim().toLowerCase()).filter(Boolean);
        if (parts.length === 0) return false;
        
        const rowTeams = parts.filter(p => p.length <= 3 && p.toUpperCase() === p || p.length <= 2);
        const rowNames = parts.filter(p => !(p.length <= 3 && p.toUpperCase() === p || p.length <= 2));

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

  const renderIssueStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    let colorClasses = "bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20";
    let dotColor = "bg-gray-400";
    
    if (s.includes('open')) {
      colorClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)] hover:bg-emerald-500/20";
      dotColor = "bg-emerald-400 animate-pulse";
    } else if (s.includes('close') || s.includes('done')) {
      colorClasses = "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.1)] hover:bg-purple-500/20";
      dotColor = "bg-purple-400";
    } else if (s.includes('issue')) {
      colorClasses = "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.1)] hover:bg-rose-500/20";
      dotColor = "bg-rose-400 animate-pulse";
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

      <div ref={tableRef} className="glass-panel-heavy overflow-hidden border border-glass-border rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gradient-to-r from-gray-950 via-gray-900/60 to-gray-950 text-gray-400 font-semibold tracking-wider text-xs uppercase border-b border-glass-border">
              <tr>
                {allColumns.filter(c => visibleColumns.includes(c)).map(col => (
                  <th key={col} className="px-6 py-4.5 tracking-wide text-gray-400 font-semibold text-xs uppercase">{col}</th>
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
                    className="hover:bg-red-950/10 hover:shadow-[inset_4px_0_0_0_#ef4444] border-b border-glass-border/30 transition-all duration-300 group even:bg-gray-900/10 odd:bg-gray-950/5"
                  >
                    {allColumns.filter(c => visibleColumns.includes(c)).map(col => {
                      const val = row[col];
                      
                      if (col.toLowerCase().includes('url') || col.toLowerCase().includes('link') || String(val).startsWith('http')) {
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
                            {renderIssueStatusBadge(val)}
                          </td>
                        );
                      }

                      if (col.toLowerCase() === 'date') {
                        return (
                          <td key={col} className="px-6 py-3.5">
                            <span className="font-mono text-xs text-gray-400">
                              {val}
                            </span>
                          </td>
                        );
                      }

                      if (col.toLowerCase() === 'team') {
                        return (
                          <td key={col} className="px-6 py-3.5">
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs font-medium">
                              {val}
                            </span>
                          </td>
                        );
                      }

                      if (col.toLowerCase() === 'assign name') {
                        return (
                          <td key={col} className="px-6 py-3.5">
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {String(val).split('/').map((part, pIdx) => {
                                const trimmed = part.trim();
                                if (!trimmed) return null;
                                const isTeam = (trimmed.length <= 3 && trimmed === trimmed.toUpperCase()) || trimmed.length <= 2;
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

                      if (col.toLowerCase() === 'urgency' || col.toLowerCase() === 'priority') {
                        const s = String(val).toLowerCase();
                        let badgeStyle = "bg-gray-500/10 text-gray-400 border-gray-500/20";
                        if (s.includes('high') || s.includes('critical') || s.includes('urgent')) {
                          badgeStyle = "bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.1)]";
                        } else if (s.includes('medium') || s.includes('warn')) {
                          badgeStyle = "bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold shadow-[0_0_10px_rgba(245,158,11,0.05)]";
                        } else if (s.includes('low') || s.includes('minor')) {
                          badgeStyle = "bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.05)]";
                        }
                        return (
                          <td key={col} className="px-6 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}>
                              {val}
                            </span>
                          </td>
                        );
                      }

                      if (col.toLowerCase().includes('description') || col.toLowerCase().includes('remarks') || col.toLowerCase().includes('detail')) {
                        return (
                          <td key={col} className="px-6 py-3.5 max-w-xs md:max-w-md truncate text-gray-300 font-medium group-hover:text-white transition-colors duration-200">
                            {val}
                          </td>
                        );
                      }

                      return (
                        <td key={col} className="px-6 py-3.5 text-gray-300">
                          <span className="group-hover:text-white transition-colors duration-200">{val}</span>
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
