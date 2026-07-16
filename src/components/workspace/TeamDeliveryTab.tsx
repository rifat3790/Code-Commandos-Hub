'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import { 
  Truck, 
  Trophy, 
  Filter, 
  Search, 
  Award, 
  CheckCircle2, 
  ArrowUpRight, 
  BarChart3, 
  Users, 
  Layers, 
  Grid, 
  RotateCcw, 
  Sparkles, 
  Clock,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Briefcase,
  Layers3,
  Calendar,
  ShieldAlert,
  User,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Props {
  csvDataOrders: string;
}

interface MemberProject {
  orderId: string;
  clientName: string;
  serviceLine: string;
  profileName: string;
  value: number;
  date: string;
  status: string;
}

interface TeamStats {
  teamName: string;
  totalDeliveries: number;
  totalRevenue: number;
  serviceLineBreakdown: Record<string, number>;
  memberLeaderboard: Array<{ name: string; count: number; revenue: number; projects: MemberProject[] }>;
}

interface SavedPreset {
  id: string;
  name: string;
  serviceLine: string;
  team: string;
  member: string;
  query: string;
}

// Custom dropdown selector matching Code Commandos branding
function VaultDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder
}: {
  label: string;
  options: string[];
  selected: string;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="relative flex-1 min-w-[160px]" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-bold transition-all bg-[#080c14]/80 border-gray-800 text-gray-300 hover:bg-gray-800/40 hover:border-gray-700 ${
          selected ? 'border-brand-green/50 text-brand-green shadow-[0_0_10px_rgba(0,229,117,0.08)]' : ''
        }`}
      >
        <span className="truncate">{selected ? `${label}: ${selected}` : placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 mt-1.5 w-full bg-[#111625] border border-gray-800 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 overflow-hidden max-h-60 overflow-y-auto"
          >
            <div className="p-1.5 space-y-0.5">
              <div
                className="px-3 py-2 hover:bg-gray-800 hover:text-white text-xs text-gray-300 rounded-lg cursor-pointer transition-colors"
                onClick={() => { onChange(''); setIsOpen(false); }}
              >
                All (No Filter)
              </div>
              {options.map(opt => (
                <div
                  key={opt}
                  className={`px-3 py-2 hover:bg-gray-800 hover:text-white text-xs rounded-lg cursor-pointer transition-colors ${
                    selected === opt ? 'bg-brand-green/20 text-brand-green font-black shadow-[0_0_8px_rgba(0,229,117,0.1)]' : 'text-gray-200'
                  }`}
                  onClick={() => { onChange(opt); setIsOpen(false); }}
                >
                  {opt}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const formatMatrixValue = (val: number) => {
  if (val === 0) return '0';
  if (val >= 1000000) {
    return `$${(val / 1000000).toFixed(1)}M`;
  }
  if (val >= 1000) {
    return `$${(val / 1000).toFixed(1)}k`;
  }
  return `$${Math.round(val)}`;
};

export default function TeamDeliveryTab({ csvDataOrders }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active View toggle: 'board' (Portfolio Cards) or 'matrix' (Analytical Matrix)
  const [viewMode, setViewMode] = useState<'board' | 'matrix'>('board');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceLine, setSelectedServiceLine] = useState('Shopify');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('CC');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('');
  
  // Interactive cell selection from Matrix
  const [selectedMatrixCell, setSelectedMatrixCell] = useState<{ serviceLine: string; team: string } | null>({ serviceLine: 'Shopify', team: 'CC' });

  // Saved Presets States
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);

  const presetRef = useRef<HTMLDivElement>(null);

  // Load saved filters and presets from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('team_delivery_filters_v3');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setSearchQuery(parsed.searchQuery || '');
          setSelectedServiceLine(parsed.selectedServiceLine !== undefined ? parsed.selectedServiceLine : 'Shopify');
          setSelectedTeamFilter(parsed.selectedTeamFilter !== undefined ? parsed.selectedTeamFilter : 'CC');
          setSelectedMemberFilter(parsed.selectedMemberFilter || '');
          if (parsed.selectedMatrixCell) {
            setSelectedMatrixCell(parsed.selectedMatrixCell);
          }
          if (parsed.viewMode) {
            setViewMode(parsed.viewMode);
          }
        } catch (e) {
          console.error('Error loading filters from cache', e);
        }
      } else {
        // Fallback defaults
        setSelectedServiceLine('Shopify');
        setSelectedTeamFilter('CC');
        setSelectedMatrixCell({ serviceLine: 'Shopify', team: 'CC' });
      }

      const presets = localStorage.getItem('team_delivery_presets_v2');
      if (presets) {
        try {
          setSavedPresets(JSON.parse(presets));
        } catch (e) {
          console.error('Error loading presets', e);
        }
      }
    }
  }, []);

  // Save active filters to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const filters = {
        searchQuery,
        selectedServiceLine,
        selectedTeamFilter,
        selectedMemberFilter,
        selectedMatrixCell,
        viewMode
      };
      localStorage.setItem('team_delivery_filters_v3', JSON.stringify(filters));
    }
  }, [searchQuery, selectedServiceLine, selectedTeamFilter, selectedMemberFilter, selectedMatrixCell, viewMode]);

  // Click outside presets handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (presetRef.current && !presetRef.current.contains(event.target as Node)) {
        setShowPresetsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!csvDataOrders) return;
    
    setLoading(true);
    Papa.parse(csvDataOrders, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          const firstRow = results.data[0] as Record<string, any>;
          if (firstRow[' '] !== undefined && firstRow['Status'] === undefined) {
            results.data.forEach((row: any) => {
              row['Status'] = row[' '];
            });
          }
          results.data.forEach((row: any) => {
            if (row[''] !== undefined && (!row['Assign Team'] || row['Assign Team'].trim() === '')) {
              row['Assign Team'] = row[''];
            }
          });

          setData(results.data);
        }
        setLoading(false);
      }
    });
  }, [csvDataOrders]);

  // Helper to parse values to float safely
  const parseValueToNumber = (valStr: any) => {
    if (!valStr) return 0;
    const numStr = String(valStr).replace(/[^0-9.-]+/g, "");
    const value = parseFloat(numStr);
    return isNaN(value) ? 0 : value;
  };

  // Robust parser to extract teams and member names from a row
  const getRowTeamsAndNames = (row: any) => {
    const at = row['Assign Team'];
    let rowTeams: string[] = [];
    let rowNames: string[] = [];
    
    const isTeamString = (str: string) => {
      const s = str.trim().toLowerCase();
      return s === 'cc' || s === 'cw' || s === 'cm' || s === 'dm' || s === 'cs' || s === 'ls' || 
             s === 'ws' || s === 'wc' || s === 'wi' || s === 'wh' || s === 'aa' || s === 'sb' || 
             s === 'wp' || s === 'ui' || s === 'ms' || s === 'as' || s === 'we' || 
             s === 'cc team' || s === 'we team' || s === 'aurrora studio' || s === 'claystone' || 
             s === 'v&c' || s === 'team cc' || s === 'team cw';
    };

    const getNormalizedTeamName = (str: string) => {
      const s = str.trim().toUpperCase();
      if (s.includes('CC')) return 'CC';
      if (s.includes('CW')) return 'CW';
      if (s.includes('WE')) return 'WE';
      if (s.includes('CS')) return 'CS';
      if (s.includes('CLAYSTONE')) return 'CS';
      if (s.includes('AURRORA STUDIO')) return 'AS';
      return s;
    };

    const getNormalizedMemberName = (name: string) => {
      let n = name.trim();
      if (!n) return '';
      // Deduplicate Sajjad
      if (n.toLowerCase() === 'sajjad') {
        return 'Sajjad';
      }
      // Deduplicate Asfaq / Ashfak
      if (n.toLowerCase() === 'asfaq' || n.toLowerCase() === 'ashfak') {
        return 'Ashfak';
      }
      // Deduplicate Refayet / Refayert
      if (n.toLowerCase() === 'refayet' || n.toLowerCase() === 'refayert') {
        return 'Refayet';
      }
      return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
    };

    if (at && typeof at === 'string') {
      const parts = at.split('/').map(s => s.trim()).filter(Boolean);
      parts.forEach(part => {
        if (isTeamString(part)) {
          rowTeams.push(getNormalizedTeamName(part));
        } else {
          rowNames.push(getNormalizedMemberName(part));
        }
      });
    }
    
    if (rowTeams.length === 0) {
      const tName = String(row['Assign Team'] || '').trim();
      if (tName) {
        rowTeams = [getNormalizedTeamName(tName)];
      } else {
        rowTeams = ['CC']; // default fallback
      }
    }
    
    if (rowNames.length === 0) {
      rowNames = ['Unassigned'];
    }
    
    return { teams: rowTeams, names: rowNames };
  };

  // Filter out delivered/done orders
  const deliveredOrders = useMemo(() => {
    return data.filter(row => {
      const status = (row['Status'] || '').toLowerCase();
      return status.includes('deliver') || status.includes('done') || status.includes('complete');
    });
  }, [data]);

  // Extract all unique values from delivered orders (for overall calculations)
  const masterFilterOptions = useMemo(() => {
    const serviceLines = new Set<string>();
    const teams = new Set<string>();
    const members = new Set<string>();

    deliveredOrders.forEach(row => {
      const sl = row['Service Line']?.trim();
      if (sl) serviceLines.add(sl);

      const { teams: rowTeams, names: rowNames } = getRowTeamsAndNames(row);
      rowTeams.forEach(t => teams.add(t));
      rowNames.forEach(n => {
        if (n && n !== 'Unknown' && n !== 'Unassigned') members.add(n);
      });
    });

    return {
      allServiceLines: Array.from(serviceLines).sort(),
      allTeams: Array.from(teams).sort(),
      allMembers: Array.from(members).sort()
    };
  }, [deliveredOrders]);

  // CASCADING FILTERS LOGIC: Determine available options based on other active selections
  const cascadingFilterOptions = useMemo(() => {
    const availableServiceLines = new Set<string>();
    const availableTeams = new Set<string>();
    const availableMembers = new Set<string>();

    deliveredOrders.forEach(row => {
      const sl = row['Service Line']?.trim() || 'Unassigned';
      const { teams: rowTeams, names: rowNames } = getRowTeamsAndNames(row);

      // 1. Calculate available Teams for the selected Service Line
      const matchesSl = !selectedServiceLine || sl === selectedServiceLine;
      if (matchesSl) {
        rowTeams.forEach(t => availableTeams.add(t));
      }

      // 2. Calculate available Service Lines for the selected Team
      const matchesTeam = !selectedTeamFilter || rowTeams.includes(selectedTeamFilter);
      if (matchesTeam) {
        availableServiceLines.add(sl);
      }

      // 3. Calculate available Member Names matching BOTH active selections
      if (matchesSl && matchesTeam) {
        rowNames.forEach(n => {
          if (n && n !== 'Unknown' && n !== 'Unassigned') availableMembers.add(n);
        });
      }
    });

    return {
      teams: selectedServiceLine ? Array.from(availableTeams).sort() : masterFilterOptions.allTeams,
      serviceLines: selectedTeamFilter ? Array.from(availableServiceLines).sort() : masterFilterOptions.allServiceLines,
      members: Array.from(availableMembers).sort()
    };
  }, [deliveredOrders, selectedServiceLine, selectedTeamFilter, masterFilterOptions]);

  // Process and calculate team statistics
  const analyticsData = useMemo(() => {
    const teamStatsMap: Record<string, TeamStats> = {};
    const matrixMap: Record<string, Record<string, number>> = {};
    const memberMap: Record<string, { count: number; team: string; revenue: number; serviceLines: Set<string>; projects: MemberProject[] }> = {};
    const serviceLineMap: Record<string, number> = {};

    deliveredOrders.forEach(row => {
      const serviceLine = row['Service Line']?.trim() || 'Unassigned';
      const orderVal = parseValueToNumber(row['Value'] || row['Amount']);
      serviceLineMap[serviceLine] = (serviceLineMap[serviceLine] || 0) + orderVal;

      const orderId = row['Order ID'] || 'N/A';
      const clientName = row['Client name'] || row['Client Name'] || 'Direct Client';
      const profileName = row['Profile Name']?.trim() || 'N/A';
      const dateStr = row['Date'] || row['Created At'] || 'N/A';
      const statusStr = row['Status'] || 'Completed';

      const { teams, names } = getRowTeamsAndNames(row);

      // Loop through each developer in the row once
      names.forEach((name, nameIdx) => {
        if (name === 'Unknown' || !name) return;

        // Determine the single correct team for this developer
        let team = 'CC'; // default fallback
        if (name.toLowerCase().includes('refayet')) {
          team = 'CC';
        } else if (teams.length === 1) {
          team = teams[0];
        } else if (teams.length > 1) {
          if (teams[nameIdx]) {
            team = teams[nameIdx];
          } else {
            team = teams[teams.length - 1]; // fallback to last team
          }
        }

        // Update Matrix map
        if (!matrixMap[serviceLine]) {
          matrixMap[serviceLine] = {};
        }
        matrixMap[serviceLine][team] = (matrixMap[serviceLine][team] || 0) + orderVal;

        // Update Team Stats map
        if (!teamStatsMap[team]) {
          teamStatsMap[team] = {
            teamName: team,
            totalDeliveries: 0,
            totalRevenue: 0,
            serviceLineBreakdown: {},
            memberLeaderboard: []
          };
        }
        teamStatsMap[team].totalDeliveries++;
        teamStatsMap[team].totalRevenue += orderVal;
        teamStatsMap[team].serviceLineBreakdown[serviceLine] = (teamStatsMap[team].serviceLineBreakdown[serviceLine] || 0) + orderVal;

        // Update Member map
        if (!memberMap[name]) {
          memberMap[name] = {
            count: 0,
            team,
            revenue: 0,
            serviceLines: new Set(),
            projects: []
          };
        }

        // Force Refayet to CC team if needed
        if (name.toLowerCase().includes('refayet')) {
          memberMap[name].team = 'CC';
        }

        memberMap[name].count++;
        memberMap[name].revenue += orderVal;
        memberMap[name].serviceLines.add(serviceLine);
        memberMap[name].projects.push({
          orderId,
          clientName,
          serviceLine,
          profileName,
          value: orderVal,
          date: dateStr,
          status: statusStr
        });
      });
    });

    // Structure member list for each team
    Object.entries(memberMap).forEach(([name, stats]) => {
      if (teamStatsMap[stats.team]) {
        teamStatsMap[stats.team].memberLeaderboard.push({ 
          name, 
          count: stats.count,
          revenue: stats.revenue,
          projects: stats.projects.sort((a, b) => b.value - a.value)
        });
      }
    });

    // Sort member leaderboards by revenue, then by count
    Object.keys(teamStatsMap).forEach(team => {
      teamStatsMap[team].memberLeaderboard.sort((a, b) => b.revenue - a.revenue || b.count - a.count);
    });

    return {
      teamStats: Object.values(teamStatsMap).sort((a, b) => b.totalRevenue - a.totalRevenue),
      matrix: matrixMap,
      serviceLineCounts: serviceLineMap,
      totalDeliveries: deliveredOrders.length,
      totalRevenue: deliveredOrders.reduce((sum, row) => sum + parseValueToNumber(row['Value'] || row['Amount']), 0),
      memberMap
    };
  }, [deliveredOrders]);

  // Filtered members list based on filters
  const filteredMembers = useMemo(() => {
    const list: Array<{ name: string; team: string; count: number; revenue: number; serviceLines: string[]; projects: MemberProject[] }> = [];
    
    Object.entries(analyticsData.memberMap).forEach(([name, stats]) => {
      if (name === 'Unassigned' || name.toLowerCase() === 'unknown') return;
      // 1. Search Query filter (matches developer name, client name, or order ID in their projects)
      const query = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        name.toLowerCase().includes(query) || 
        stats.team.toLowerCase().includes(query) ||
        stats.projects.some(p => p.clientName.toLowerCase().includes(query) || p.orderId.toLowerCase().includes(query) || p.serviceLine.toLowerCase().includes(query));
      
      // 2. Team Group filter
      const matchesTeam = !selectedTeamFilter || stats.team === selectedTeamFilter;
      
      // 3. Service Line filter
      const sls = Array.from(stats.serviceLines);
      const matchesServiceLine = !selectedServiceLine || sls.includes(selectedServiceLine);

      // 4. Member Name filter
      const matchesMember = !selectedMemberFilter || name === selectedMemberFilter;

      if (matchesSearch && matchesTeam && matchesServiceLine && matchesMember) {
        list.push({
          name,
          team: stats.team,
          count: stats.count,
          revenue: stats.revenue,
          serviceLines: sls,
          projects: stats.projects
        });
      }
    });

    return list.sort((a, b) => b.revenue - a.revenue || b.count - a.count);
  }, [analyticsData, searchQuery, selectedTeamFilter, selectedServiceLine, selectedMemberFilter]);

  // DYNAMIC TOP PERFORMERS: Recalculate top performer and top profile based on active filters
  const dynamicStats = useMemo(() => {
    let topPerfName = 'N/A';
    let topPerfCount = 0;
    let topPerfRevenue = 0;

    let topProfileName = 'N/A';
    let topProfileCount = 0;
    let topProfileRevenue = 0;

    const profileStats: Record<string, { count: number; revenue: number }> = {};

    filteredMembers.forEach(mem => {
      // Find top performer
      if (mem.revenue > topPerfRevenue || (mem.revenue === topPerfRevenue && mem.count > topPerfCount)) {
        topPerfName = mem.name;
        topPerfCount = mem.count;
        topPerfRevenue = mem.revenue;
      }

      // Aggregate profile stats from this member's filtered projects
      mem.projects.forEach(p => {
        const prof = p.profileName;
        if (prof && prof !== 'N/A') {
          if (!profileStats[prof]) {
            profileStats[prof] = { count: 0, revenue: 0 };
          }
          profileStats[prof].count++;
          profileStats[prof].revenue += p.value;
        }
      });
    });

    // Find top profile by revenue
    Object.entries(profileStats).forEach(([prof, stats]) => {
      if (stats.revenue > topProfileRevenue) {
        topProfileName = prof;
        topProfileCount = stats.count;
        topProfileRevenue = stats.revenue;
      }
    });

    // Compute dynamic aggregate handover and total value
    const totalHandover = filteredMembers.reduce((sum, m) => sum + m.count, 0);
    const totalValue = filteredMembers.reduce((sum, m) => sum + m.revenue, 0);

    return { 
      topPerfName, 
      topPerfCount, 
      topPerfRevenue, 
      topProfileName, 
      topProfileCount, 
      topProfileRevenue,
      totalHandover,
      totalValue
    };
  }, [filteredMembers]);

  // Handle matrix cell click
  const handleMatrixCellClick = (serviceLine: string, team: string) => {
    if (selectedMatrixCell?.serviceLine === serviceLine && selectedMatrixCell?.team === team) {
      setSelectedMatrixCell(null); // toggle off
      setSelectedServiceLine('');
      setSelectedTeamFilter('');
    } else {
      setSelectedMatrixCell({ serviceLine, team });
      setSelectedServiceLine(serviceLine);
      setSelectedTeamFilter(team);
      setSelectedMemberFilter(''); // Clear member name filter
      toast.success(`Filter applied: ${serviceLine} + Team ${team}`);
    }
  };

  // Reset Filters
  const handleClearFilters = () => {
    setSelectedMatrixCell(null);
    setSelectedServiceLine('');
    setSelectedTeamFilter('');
    setSelectedMemberFilter('');
    setSearchQuery('');
    toast.success('Filters cleared');
  };

  // Save Current Filter Preset
  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    const presetName = newPresetName.trim();
    if (!presetName) return;

    const newPreset: SavedPreset = {
      id: Date.now().toString(),
      name: presetName,
      serviceLine: selectedServiceLine,
      team: selectedTeamFilter,
      member: selectedMemberFilter,
      query: searchQuery
    };

    const updatedPresets = [...savedPresets, newPreset];
    setSavedPresets(updatedPresets);
    localStorage.setItem('team_delivery_presets_v2', JSON.stringify(updatedPresets));
    
    setNewPresetName('');
    setIsSavingPreset(false);
    toast.success(`Preset "${presetName}" saved!`);
  };

  const handleApplyPreset = (preset: SavedPreset) => {
    setSelectedServiceLine(preset.serviceLine);
    setSelectedTeamFilter(preset.team);
    setSelectedMemberFilter(preset.member || '');
    setSearchQuery(preset.query);
    if (preset.serviceLine && preset.team) {
      setSelectedMatrixCell({ serviceLine: preset.serviceLine, team: preset.team });
    } else {
      setSelectedMatrixCell(null);
    }
    setShowPresetsMenu(false);
    toast.success(`Preset "${preset.name}" applied`);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem('team_delivery_presets_v2', JSON.stringify(updated));
    toast.success('Preset deleted');
  };

  const handleExportCSV = () => {
    if (filteredMembers.length === 0) {
      toast.error("No standings data to export.");
      return;
    }
    
    const headers = ["Rank", "Name", "Team", "Delivered Orders", "Revenue ($)", "Service Lines"];
    const rows = filteredMembers.map((m, idx) => [
      idx + 1,
      m.name,
      m.team,
      m.count,
      m.revenue,
      m.serviceLines.join("; ")
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Code_Commandos_Standings_${selectedServiceLine || 'All'}_Team_${selectedTeamFilter || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Standings report downloaded successfully!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* WARNING BANNER: Admin Access Only */}
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-24 h-full bg-red-500/5 -skew-x-12" />
        <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span>This Tab Only Admin Access</span>
        </div>
      </div>

      {/* View Mode Toggle: Board View vs Matrix View */}
      <div className="flex justify-between items-center gap-4 bg-[#080c14]/40 p-2 border border-glass-border rounded-2xl backdrop-blur-md">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">Display Layout Representation:</span>
        <div className="flex p-0.5 bg-black/50 border border-gray-850 rounded-xl">
          <button
            onClick={() => setViewMode('board')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'board' 
                ? 'bg-brand-green text-black font-extrabold shadow-[0_0_10px_rgba(0,229,117,0.3)]' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Portfolio Board
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'matrix' 
                ? 'bg-brand-green text-black font-extrabold shadow-[0_0_10px_rgba(0,229,117,0.3)]' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Matrix Analytics
          </button>
        </div>
      </div>

      {/* EXECUTIVE VAULT FILTER BAR (Styled exactly like the reference image) */}
      <div className="p-6 bg-[#080c14] border border-glass-border rounded-2xl shadow-2xl relative overflow-visible backdrop-blur-md space-y-4 z-30">
        {/* Vault Header Title */}
        <div className="flex items-center gap-2 border-b border-gray-850 pb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-green animate-pulse" />
          <h3 className="text-white font-extrabold text-[11px] uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-green" />
            Executive Vault Filter Console
          </h3>
        </div>

        {/* Dynamic Filters Layout */}
        <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 flex-1">
            {/* Service Line Dropdown */}
            <VaultDropdown
              label="Service Line"
              options={cascadingFilterOptions.serviceLines}
              selected={selectedServiceLine}
              onChange={(e) => {
                setSelectedServiceLine(e);
                setSelectedMatrixCell(null);
                setSelectedMemberFilter(''); // reset dependent member selection
              }}
              placeholder="Service Line"
            />

            {/* Team Group Dropdown */}
            <VaultDropdown
              label="Team Group"
              options={cascadingFilterOptions.teams}
              selected={selectedTeamFilter}
              onChange={(e) => {
                setSelectedTeamFilter(e);
                setSelectedMatrixCell(null);
                setSelectedMemberFilter(''); // reset dependent member selection
              }}
              placeholder="Team Group"
            />

            {/* Member Name Dropdown */}
            <VaultDropdown
              label="Member Name"
              options={cascadingFilterOptions.members}
              selected={selectedMemberFilter}
              onChange={setSelectedMemberFilter}
              placeholder="Member Name"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 xl:flex-initial">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search premium portfolio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 pr-4 py-2.5 bg-[#0a0d16]/90 border border-gray-800 focus:border-brand-green/40 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors w-full xl:w-64 font-medium"
              />
            </div>

            {/* Presets Button */}
            <div className="relative shrink-0" ref={presetRef}>
              <button
                type="button"
                onClick={() => setShowPresetsMenu(!showPresetsMenu)}
                className="flex items-center justify-center p-2.5 rounded-xl border border-gray-800 bg-gray-900/30 text-gray-300 hover:bg-gray-800/40 hover:text-white transition-all cursor-pointer"
                title="Filter presets"
              >
                <Save className="w-4 h-4 text-brand-green" />
              </button>

              <AnimatePresence>
                {showPresetsMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-64 bg-gray-900 border border-glass-border rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-glass-border bg-black/40">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block tracking-wider mb-2">Save Active Setup</span>
                      {isSavingPreset ? (
                        <form onSubmit={handleSavePreset} className="space-y-2">
                          <input
                            required
                            type="text"
                            placeholder="Preset Name..."
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            className="w-full glass-input text-xs px-2.5 py-1.5"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button type="button" onClick={() => setIsSavingPreset(false)} className="text-[10px] text-gray-400 px-2 py-1">Cancel</button>
                            <button type="submit" className="text-[10px] bg-brand-green text-black font-extrabold px-2 py-1 rounded">Save</button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => setIsSavingPreset(true)}
                          className="w-full py-1.5 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green border border-brand-green/30 text-xs font-bold rounded-lg transition-colors"
                        >
                          + Save Preset
                        </button>
                      )}
                    </div>

                    <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase block px-2 py-1">Load Preset</span>
                      {savedPresets.map(preset => (
                        <div
                          key={preset.id}
                          onClick={() => handleApplyPreset(preset)}
                          className="flex items-center justify-between px-2 py-2 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors group text-left"
                        >
                          <div className="truncate pr-2">
                            <span className="text-xs text-gray-300 font-semibold block truncate">{preset.name}</span>
                            <span className="text-[9px] text-gray-500 block truncate">
                              {preset.serviceLine || 'All SL'} / {preset.team ? `T-${preset.team}` : 'All Teams'}
                            </span>
                          </div>
                          <button
                            onClick={(e) => handleDeletePreset(preset.id, e)}
                            className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {savedPresets.length === 0 && (
                        <div className="px-3 py-4 text-center text-xs text-gray-500 font-medium">No filter presets saved.</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center p-2.5 rounded-xl border border-gray-800 bg-gray-900/30 text-gray-300 hover:bg-gray-800/40 hover:text-white transition-all cursor-pointer shadow-md"
              title="Export Active standing to CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 animate-pulse" />
            </button>
          </div>
        </div>
      </div>

      {/* TOP PERFORMER & TOP PROFILE CARDS (Dynamic Highlight Panel) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dynamic Top Performer Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c0d15] to-[#16121a] border border-amber-500/20 hover:border-amber-500/50 relative overflow-hidden group shadow-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] flex flex-col justify-between min-h-[185px]">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700">
            <Trophy className="w-36 h-36 text-amber-400" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <div>
            <div className="flex justify-between items-start">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase tracking-wider mb-4 shadow-sm shadow-amber-500/5">
                <Trophy className="w-3 h-3 text-amber-400" /> Top Performer
              </span>
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight leading-none bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{dynamicStats.topPerfName}</h3>
            <p className="text-[10px] text-amber-500/80 font-black mt-2 uppercase tracking-widest">{dynamicStats.topPerfCount} Elite Deliveries Handed Over</p>
          </div>
          <div className="mt-6 pt-3 border-t border-white/5 flex justify-between items-end">
            <div>
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Generated Revenue</span>
              <span className="text-2xl font-black text-amber-400 font-mono mt-0.5 block">${dynamicStats.topPerfRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 font-black uppercase tracking-widest font-mono">
              Tier: Elite
            </div>
          </div>
        </div>

        {/* Dynamic Top Profile Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c0d15] to-[#0f172a] border border-blue-500/20 hover:border-blue-500/50 relative overflow-hidden group shadow-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] flex flex-col justify-between min-h-[185px]">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700">
            <Award className="w-36 h-36 text-blue-400" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <div>
            <div className="flex justify-between items-start">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase tracking-wider mb-4 shadow-sm shadow-blue-500/5">
                <Award className="w-3 h-3 text-blue-400" /> Top Profile
              </span>
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight truncate pr-12 leading-none bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent" title={dynamicStats.topProfileName}>{dynamicStats.topProfileName}</h3>
            <p className="text-[10px] text-blue-400/80 font-black mt-2 uppercase tracking-widest">{dynamicStats.topProfileCount} Associated Projects</p>
          </div>
          <div className="mt-6 pt-3 border-t border-white/5 flex justify-between items-end">
            <div>
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Profile Revenue</span>
              <span className="text-2xl font-black text-blue-400 font-mono mt-0.5 block">${dynamicStats.topProfileRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[9px] text-blue-400 font-black uppercase tracking-widest font-mono">
              Share: High
            </div>
          </div>
        </div>
      </div>

      {/* PORTFOLIO BOARD REPRESENTATION */}
      {viewMode === 'board' ? (
        <div className="space-y-5">
          {/* Section title & aggregate headers */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-850">
            <div>
              <h3 className="text-white font-extrabold text-lg uppercase tracking-tight flex items-center gap-2">
                Individual Portfolios
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Detailed breakdown of all active members in this view</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="px-3 py-2 rounded-xl bg-gray-950/60 border border-gray-850 flex flex-col items-start min-w-[110px]">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Total Value</span>
                <span className="text-sm font-black text-brand-green mt-0.5 font-mono">${dynamicStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-gray-950/60 border border-gray-850 flex flex-col items-start min-w-[110px]">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Total Handover</span>
                <span className="text-sm font-black text-white mt-0.5 font-mono">{dynamicStats.totalHandover} Projects</span>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMembers.map((member) => {
              const isTop = member.name === dynamicStats.topPerfName;
              return (
                <div 
                  key={member.name}
                  className={`glass-panel p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[350px] relative overflow-hidden bg-gray-950/20 group hover:shadow-2xl hover:-translate-y-1.5 ${
                    isTop 
                      ? 'border-amber-500/35 bg-[#120f09]/60 shadow-[0_0_20px_rgba(245,158,11,0.08)] hover:border-amber-500/60' 
                      : 'border-glass-border hover:border-brand-green/40 hover:bg-[#0a0f1d]/50'
                  }`}
                >
                  {/* Decorative background glow */}
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl transition-opacity duration-300 opacity-30 group-hover:opacity-60 ${
                    isTop ? 'bg-amber-500/10' : 'bg-brand-green/10'
                  }`} />

                  {/* Card Header (Avatar + Name + Badge) */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold border shrink-0 ${
                      isTop 
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' 
                        : 'bg-brand-green/10 border-brand-green/20 text-brand-green'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <h4 className="font-extrabold text-white text-sm truncate leading-tight">{member.name}</h4>
                      <span className={`inline-block text-[8px] font-black uppercase tracking-wider mt-0.5 ${
                        isTop ? 'text-amber-500' : 'text-gray-500'
                      }`}>
                        {isTop ? 'TOP EARNER' : member.count >= 5 ? 'ELITE PARTNER' : 'ASSOCIATE'}
                      </span>
                    </div>
                  </div>

                  {/* Card Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 my-5 pt-3 pb-3 border-t border-b border-gray-850/60">
                    <div>
                      <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider">Revenue</span>
                      <span className={`text-lg font-black font-mono mt-0.5 ${
                        isTop ? 'text-amber-400' : 'text-brand-green'
                      }`}>
                        ${member.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider">Delivered</span>
                      <span className="text-lg font-black text-white font-mono mt-0.5">{member.count}</span>
                    </div>
                  </div>

                  {/* Project Portfolio Section */}
                  <div className="flex-1 flex flex-col justify-between">
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Project Portfolio</span>
                    
                    {/* List of projects with custom scroll */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 flex-1 scrollbar-thin">
                      {member.projects.map((proj, idx) => (
                        <div 
                          key={idx} 
                          className="bg-[#0b0f19] border border-gray-900/60 rounded-xl p-2.5 flex items-center justify-between gap-2 hover:border-gray-800 transition-colors"
                        >
                          <div className="truncate min-w-0">
                            <span className="text-[10px] font-extrabold text-gray-300 block truncate" title={proj.clientName}>{proj.clientName}</span>
                            <span className="text-[9px] text-gray-500 block truncate leading-tight font-medium" title={proj.profileName}>{proj.profileName}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                            isTop 
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                              : 'bg-brand-green/10 border-brand-green/20 text-brand-green'
                          }`}>
                            ${proj.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                      {member.projects.length === 0 && (
                        <div className="text-[10px] text-gray-500 text-center py-4 font-semibold">No projects assigned</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredMembers.length === 0 && (
              <div className="col-span-full py-16 text-center glass-panel border border-glass-border rounded-2xl">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-40" />
                <h4 className="text-white font-bold text-base">No Portfolios Found</h4>
                <p className="text-gray-500 text-xs mt-1">Try resetting the filters or modifying your search query.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MATRIX ANALYTICS VIEW */
        <div className="space-y-6">
          {/* Matrix and Bar Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Matrix */}
            <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-glass-border bg-[#0b0f19]/30 flex flex-col justify-between overflow-hidden">
              <div>
                <h3 className="text-sm font-extrabold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                  <Grid className="w-4 h-4" /> Team vs Service Line Matrix
                </h3>
                <p className="text-xs text-gray-500 mt-1">Cross-tabulated grid plotting revenue performance. Click a cell to isolate team and service line performance.</p>
              </div>

              <div className="overflow-x-auto mt-5 border border-gray-850 rounded-xl bg-black/10 max-w-full">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap min-w-[600px]">
                  <thead>
                    <tr className="bg-[#0b0f19] border-b border-gray-850 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">Service Line</th>
                      {masterFilterOptions.allTeams.map(team => (
                        <th key={team} className="px-4 py-3 text-center w-20">Team {team}</th>
                      ))}
                      <th className="px-4 py-3 text-center w-20 bg-purple-950/20 text-purple-300 font-black">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850/50">
                    {masterFilterOptions.allServiceLines.map(sl => {
                      const slTotal = analyticsData.serviceLineCounts[sl] || 0;
                      return (
                        <tr key={sl} className="hover:bg-gray-850/20 transition-colors">
                          <td className="px-4 py-3 font-semibold text-white">{sl}</td>
                          {masterFilterOptions.allTeams.map(team => {
                            const rev = analyticsData.matrix[sl]?.[team] || 0;
                            const isCellSelected = selectedMatrixCell?.serviceLine === sl && selectedMatrixCell?.team === team;
                            
                            // Dynamic heat coloring based on revenue
                            let cellBg = 'bg-transparent text-gray-500';
                            if (rev > 15000) {
                              cellBg = isCellSelected 
                                ? 'bg-brand-green text-black font-black shadow-[0_0_10px_rgba(0,229,117,0.4)]'
                                : 'bg-brand-green/30 border border-brand-green/20 text-brand-green font-bold hover:bg-brand-green/50';
                            } else if (rev > 5000) {
                              cellBg = isCellSelected
                                ? 'bg-indigo-500 border border-indigo-400 text-black font-black shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                                : 'bg-indigo-600/20 border border-indigo-500/10 text-indigo-300 font-bold hover:bg-indigo-600/40';
                            } else if (rev > 0) {
                              cellBg = isCellSelected
                                ? 'bg-blue-500 border border-blue-400 text-black font-black shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                                : 'bg-blue-600/10 border border-blue-500/5 text-blue-300 font-medium hover:bg-blue-600/30';
                            }

                            return (
                              <td key={team} className="px-3 py-2 text-center">
                                <button
                                  onClick={() => handleMatrixCellClick(sl, team)}
                                  className={`w-16 py-1 rounded-md text-[10px] font-mono transition-all uppercase cursor-pointer ${cellBg}`}
                                >
                                  {formatMatrixValue(rev)}
                                </button>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-center font-mono font-black text-purple-300 bg-purple-950/10">{formatMatrixValue(slTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#0b0f19]/80 border-t-2 border-gray-850 font-black text-white">
                      <td className="px-4 py-3 text-white font-extrabold uppercase">Team Total</td>
                      {masterFilterOptions.allTeams.map(team => {
                        const teamTotal = analyticsData.teamStats.find(t => t.teamName === team)?.totalRevenue || 0;
                        return (
                          <td key={team} className="px-4 py-3 text-center font-mono text-white">{formatMatrixValue(teamTotal)}</td>
                        );
                      })}
                      <td className="px-4 py-3 text-center font-mono bg-purple-950/30 border border-purple-500/25 text-purple-400 text-xs">{formatMatrixValue(analyticsData.totalRevenue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Bar Chart comparing Teams */}
            <div className="glass-panel p-5 rounded-2xl border border-glass-border bg-[#0b0f19]/30 flex flex-col justify-between overflow-hidden">
              <div>
                <h3 className="text-sm font-extrabold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Team Revenue Share
                </h3>
                <p className="text-xs text-gray-500 mt-1 font-medium">Revenue distribution comparison across team modules.</p>
              </div>

              <div className="flex items-end justify-around h-48 pt-6 pb-2 px-2 select-none border border-gray-850 rounded-xl bg-black/10 mt-5 overflow-x-auto min-h-[220px]">
                {analyticsData.teamStats.map((team, idx) => {
                  const maxVal = Math.max(...analyticsData.teamStats.map(t => t.totalRevenue), 1);
                  const barPercentage = Math.max(10, (team.totalRevenue / maxVal) * 100);
                  
                  const fillClass = idx === 0
                    ? 'bg-gradient-to-t from-brand-green/30 to-brand-green/80 shadow-[0_0_15px_rgba(0,229,117,0.35)]'
                    : idx === 1
                      ? 'bg-gradient-to-t from-indigo-600/30 to-indigo-500/80 shadow-[0_0_10px_rgba(99,102,241,0.25)]'
                      : 'bg-gradient-to-t from-blue-600/30 to-blue-500/80 shadow-[0_0_10px_rgba(59,130,246,0.2)]';

                  return (
                    <div key={team.teamName} className="flex flex-col items-center flex-1 mx-1 group min-w-[2.2rem]">
                      <div className="text-[10px] font-black text-white mb-2 font-mono group-hover:text-purple-400 transition-colors">
                        {formatMatrixValue(team.totalRevenue)}
                      </div>
                      <div className="w-8 relative rounded-t-lg overflow-hidden transition-all duration-500" style={{ height: `${barPercentage * 1.1}px` }}>
                        <div className={`w-full h-full rounded-t-lg ${fillClass}`} />
                      </div>
                      <div className="h-px w-full bg-glass-border mt-1" />
                      <div className="text-[9px] font-black text-gray-400 mt-2 uppercase tracking-wider group-hover:text-white transition-colors truncate w-full text-center">
                        {team.teamName}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dynamic Table for standalone view details */}
          <div className="glass-panel p-5 rounded-2xl border border-glass-border bg-[#0b0f19]/40 relative overflow-hidden backdrop-blur-md">
            <div className="flex justify-between items-center pb-3 border-b border-gray-850">
              <h3 className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                Team Member Details Standing List
              </h3>
            </div>
            <div className="overflow-x-auto mt-4 border border-gray-850 rounded-xl bg-black/15">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-[#0b0f19] border-b border-gray-850 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="px-5 py-3 w-16 text-center">Rank</th>
                    <th className="px-5 py-3">Team Member</th>
                    <th className="px-5 py-3">Team</th>
                    <th className="px-5 py-3 text-right">Revenue</th>
                    <th className="px-5 py-3 text-right">Orders</th>
                    <th className="px-5 py-3">Service Lines</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850/50">
                  {filteredMembers.map((member, idx) => (
                    <tr key={member.name} className="hover:bg-gray-800/10 transition-colors">
                      <td className="px-5 py-3.5 text-center">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-800 text-gray-400 mx-auto font-black">{idx + 1}</span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-white">{member.name}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-bold uppercase font-mono text-[9px]">
                          Team {member.team}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-green-400 font-mono">${member.revenue.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right font-black text-purple-300 font-mono">{member.count}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {member.serviceLines.map(sl => (
                            <span key={sl} className="px-1.5 py-0.5 bg-gray-900 border border-gray-850 text-gray-400 rounded text-[9px]">
                              {sl}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
