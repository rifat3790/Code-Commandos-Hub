"use client";

import { useMemo, useState, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Search, 
  ExternalLink, 
  ShieldCheck, 
  Database,
  BarChart3,
  Layers,
  Sparkles,
  ClipboardList,
  Download,
  Activity,
  LineChart,
  BadgeAlert,
  Sliders,
  Play,
  RotateCcw,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function WorkloadMetricsTab({ 
  csvData 
}: { 
  csvData: string 
}) {
  const { dbUser } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'workload' | 'nra'>('workload');
  
  // NRA Filters State
  const [nraServiceLineFilter, setNraServiceLineFilter] = useState<string>('All');
  const [nraUrgencyFilter, setNraUrgencyFilter] = useState<string>('All');
  const [nraSearchQuery, setNraSearchQuery] = useState<string>('');

  // Simulation Sandbox State
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);
  const [simulatedAdjustments, setSimulatedAdjustments] = useState<Record<string, number>>({});

  useEffect(() => {
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          const firstRow = results.data[0] as Record<string, any>;
          if (firstRow[' '] !== undefined && firstRow['Status'] === undefined) {
            results.data.forEach((row: any) => {
              row['Status'] = row[' '];
              delete row[' '];
            });
          }
          else if (firstRow[''] !== undefined && firstRow['Status'] === undefined && firstRow['Assign Team']) {
            results.data.forEach((row: any) => {
              if (row['Assign Team']) {
                row['Status'] = row[''];
              }
            });
          }
        }
        setData(results.data);
      }
    });
  }, [csvData]);

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

  // Calculate simulated workload values
  const simulatedWorkload = useMemo(() => {
    return teamWorkload.map(tw => {
      const adjustment = simulatedAdjustments[tw.team] || 0;
      const count = Math.max(0, tw.count + adjustment);
      return {
        ...tw,
        count
      };
    }).sort((a, b) => b.count - a.count);
  }, [teamWorkload, simulatedAdjustments]);

  // Active workload context (simulated or real)
  const activeWorkloadData = isSimulationMode ? simulatedWorkload : teamWorkload;

  // Filter NRA Projects
  const nraProjects = useMemo(() => {
    return data.filter(d => {
      const status = (d['Status'] || '').trim().toUpperCase();
      return status === 'NRA';
    });
  }, [data]);

  // SLA Urgency calculation for NRA
  const nraUrgencyData = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let safe = 0;
    let undated = 0;

    nraProjects.forEach(d => {
      let daysLeft: number | null = null;
      const deadlineStr = d['Deadline'] || '';
      const parsedNum = parseInt(deadlineStr.replace(/[^0-9]/g, ''));
      
      if (!isNaN(parsedNum)) {
        daysLeft = parsedNum;
      } else {
        const deliDateStr = d['Deli_Date'] || '';
        if (deliDateStr) {
          const diff = new Date(deliDateStr).getTime() - Date.now();
          if (!isNaN(diff)) {
            daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
          }
        }
      }

      if (daysLeft === null) {
        undated++;
      } else if (daysLeft < 5) {
        critical++;
      } else if (daysLeft <= 10) {
        warning++;
      } else {
        safe++;
      }
    });

    return { critical, warning, safe, undated };
  }, [nraProjects]);

  // Extract unique Service Lines in NRA rows
  const nraServiceLines = useMemo(() => {
    const sls = new Set<string>();
    nraProjects.forEach(d => {
      const sl = d['Service Line']?.trim();
      sls.add(sl || 'Unassigned');
    });
    return ['All', ...Array.from(sls)];
  }, [nraProjects]);

  // Filter NRA by Service Line, Search query, and SLA Urgency
  const filteredNraProjects = useMemo(() => {
    return nraProjects.filter(d => {
      const sl = d['Service Line']?.trim() || 'Unassigned';
      const matchesServiceLine = nraServiceLineFilter === 'All' || sl === nraServiceLineFilter;

      // Urgency filter logic
      let daysLeft: number | null = null;
      const deadlineStr = d['Deadline'] || '';
      const parsedNum = parseInt(deadlineStr.replace(/[^0-9]/g, ''));
      if (!isNaN(parsedNum)) {
        daysLeft = parsedNum;
      } else {
        const deliDateStr = d['Deli_Date'] || '';
        if (deliDateStr) {
          const diff = new Date(deliDateStr).getTime() - Date.now();
          if (!isNaN(diff)) {
            daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
          }
        }
      }

      let matchesUrgency = true;
      if (nraUrgencyFilter === 'Critical') {
        matchesUrgency = daysLeft !== null && daysLeft < 5;
      } else if (nraUrgencyFilter === 'Warning') {
        matchesUrgency = daysLeft !== null && daysLeft >= 5 && daysLeft <= 10;
      } else if (nraUrgencyFilter === 'Safe') {
        matchesUrgency = daysLeft !== null && daysLeft > 10;
      } else if (nraUrgencyFilter === 'Undated') {
        matchesUrgency = daysLeft === null;
      }

      const empName = (d['Employee Name'] || '').toLowerCase();
      const clientName = (d['Client name'] || '').toLowerCase();
      const orderId = (d['Order ID'] || '').toLowerCase();
      const query = nraSearchQuery.toLowerCase();
      const matchesSearch = empName.includes(query) || clientName.includes(query) || orderId.includes(query);

      return matchesServiceLine && matchesUrgency && matchesSearch;
    });
  }, [nraProjects, nraServiceLineFilter, nraUrgencyFilter, nraSearchQuery]);

  const totalNraValue = useMemo(() => {
    return filteredNraProjects.reduce((sum, d) => {
      const valStr = d['Value'] || d['Amount'] || "0";
      const numStr = String(valStr).replace(/[^0-9.-]+/g, "");
      return sum + (parseFloat(numStr) || 0);
    }, 0);
  }, [filteredNraProjects]);

  const isOwner = dbUser?.email === 'refayethossenmd@gmail.com';

  // Exporter to CSV
  const handleExportWorkloadCSV = () => {
    const csvRows = [
      ['Team', 'Active WIP', 'Active Pipeline Value', 'Members'],
      ...teamWorkload.map(tw => [tw.team, tw.count, `$${tw.value}`, tw.members])
    ];
    const csvContent = "data:text/csv;charset=utf-8," 
      + csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Team_Workload_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // NRA Exporter
  const handleExportNraCSV = () => {
    const csvRows = [
      ['Order ID', 'Date', 'Employee Name', 'Sales Team', 'Client Name', 'Service Line', 'Value', 'Deadline', 'Remarks', 'Order Link'],
      ...filteredNraProjects.map(p => [
        p['Order ID'], p['Date'], p['Employee Name'], p['Sales Team'], p['Client name'], p['Service Line'], p['Value'] || p['Amount'], p['Deadline'], p['Remarks'] || p['Order Sheet'], p['Order Link']
      ])
    ];
    const csvContent = "data:text/csv;charset=utf-8," 
      + csvRows.map(e => e.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NRA_Projects_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Optimization insights calculations
  const workloadInsights = useMemo(() => {
    let overloaded = 0;
    let balanced = 0;
    let underloaded = 0;
    let highestValueTeam = { team: 'None', value: 0 };
    let highestLoadTeam = { team: 'None', count: 0 };
    let lowestLoadTeam = { team: 'None', count: 999 };

    activeWorkloadData.forEach(tw => {
      if (tw.count >= 8) overloaded++;
      else if (tw.count >= 4) balanced++;
      else underloaded++;

      if (tw.value > highestValueTeam.value) {
        highestValueTeam = { team: tw.team, value: tw.value };
      }
      if (tw.count > highestLoadTeam.count) {
        highestLoadTeam = { team: tw.team, count: tw.count };
      }
      if (tw.count < lowestLoadTeam.count) {
        lowestLoadTeam = { team: tw.team, count: tw.count };
      }
    });

    const recommendation = overloaded > 0 && lowestLoadTeam.team !== 'None'
      ? `Redistribute tasks from Team ${highestLoadTeam.team} (${highestLoadTeam.count} WIP) to Team ${lowestLoadTeam.team} (${lowestLoadTeam.count} WIP) to optimize throughput.`
      : "Workload distribution is balanced and stable. No critical transfers recommended.";

    return { overloaded, balanced, underloaded, highestValueTeam, highestLoadTeam, lowestLoadTeam, recommendation };
  }, [activeWorkloadData]);

  // NRA Analytics Calculations
  const nraInsights = useMemo(() => {
    const salesDistribution: Record<string, number> = {};
    let missingRemarks = 0;

    nraProjects.forEach(d => {
      const salesTeam = d['Sales Team'] || 'Direct/Unknown';
      salesDistribution[salesTeam] = (salesDistribution[salesTeam] || 0) + 1;
      if (!d['Remarks'] || d['Remarks'].trim() === '') {
        missingRemarks++;
      }
    });

    return { salesDistribution, missingRemarks };
  }, [nraProjects]);

  // Adjust simulation values
  const adjustSimCount = (team: string, amount: number) => {
    setSimulatedAdjustments(prev => ({
      ...prev,
      [team]: (prev[team] || 0) + amount
    }));
  };

  const resetSimulation = () => {
    setSimulatedAdjustments({});
  };

  // Custom premium SVG Bar Chart Data
  const chartHeight = 160;

  return (
    <div className="space-y-6 mt-6">
      {/* Unique Professional Header for Owner */}
      {isOwner && (
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-black border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.15)] animate-fade-in">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck className="w-40 h-40 text-purple-400" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                  Owner Portal
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] text-green-400 font-mono">Secure Connection Active</span>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Welcome back, Refayet Hossen</h2>
              <p className="text-xs text-gray-400">Directly managing team workloads, bottleneck alerts, and secure NRA project pipelines.</p>
            </div>
            
            <div className="flex gap-4 p-3 bg-black/40 border border-glass-border rounded-2xl">
              <div className="text-left border-r border-glass-border pr-4">
                <span className="text-[9px] text-gray-500 block uppercase font-bold">WIP Load</span>
                <span className="text-base font-extrabold text-white font-mono">{teamWorkload.reduce((sum, tw) => sum + tw.count, 0)} Tasks</span>
              </div>
              <div className="text-left pl-1">
                <span className="text-[9px] text-gray-500 block uppercase font-bold">NRA Pipeline</span>
                <span className="text-base font-extrabold text-purple-400 font-mono">{nraProjects.length} Projects</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab Navigation */}
      <div className="flex bg-gray-950/60 p-1.5 rounded-2xl w-fit border border-glass-border shadow-inner">
        <button
          onClick={() => setActiveSubTab('workload')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-semibold text-xs uppercase tracking-wider ${
            activeSubTab === 'workload' 
              ? 'bg-purple-600/90 text-white shadow-md shadow-purple-600/20' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Team Workload
        </button>
        <button
          onClick={() => setActiveSubTab('nra')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-semibold text-xs uppercase tracking-wider ${
            activeSubTab === 'nra' 
              ? 'bg-purple-600/90 text-white shadow-md shadow-purple-600/20' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          NRA Projects ({nraProjects.length})
        </button>
      </div>

      {activeSubTab === 'workload' ? (
        /* Team Workload view */
        <div className="glass-panel p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-glass-border pb-3 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Team Workload & Active Assignment Metrics</span>
                </h2>
                {isSimulationMode && (
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[9px] font-black uppercase tracking-widest animate-pulse">
                    Sandbox Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Real-time status of active WIP orders, workload load factor, and pipeline value distribution per team.</p>
            </div>
            
            {/* Action Bar */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {isOwner && (
                <button
                  onClick={() => setIsSimulationMode(!isSimulationMode)}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold uppercase transition-all flex items-center gap-2 shrink-0 ${
                    isSimulationMode 
                      ? 'bg-indigo-500/25 border-indigo-500/40 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                      : 'bg-white/5 border-glass-border text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  {isSimulationMode ? 'Exit Simulator' : 'Simulation Sandbox'}
                </button>
              )}
              
              <button
                onClick={handleExportWorkloadCSV}
                className="px-3.5 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-xs font-bold uppercase transition-all flex items-center gap-2 shrink-0 ml-auto sm:ml-0"
              >
                <Download className="w-3.5 h-3.5" />
                Export Report
              </button>
            </div>
          </div>

          <div className="space-y-6 pt-2">
            {/* Overload Warning Banner */}
            {activeWorkloadData.some(tw => tw.count >= 8) && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-xl gap-4">
                <div className="flex items-start sm:items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400 shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                  </span>
                  <div className="text-left">
                    <p className="font-extrabold text-red-400 uppercase tracking-wider">Pipeline Bottleneck Detected</p>
                    <p className="text-gray-400 mt-0.5 text-xs">
                      One or more teams have exceeded the target WIP threshold (8 orders). Workload redistribution is highly recommended to optimize turnaround time.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg font-bold text-[10px] uppercase font-mono tracking-wider flex items-center justify-center">
                    Action Required
                  </span>
                </div>
              </div>
            )}

            {/* Simulation Sandbox Control Panel */}
            {isSimulationMode && isOwner && (
              <div className="p-4 bg-indigo-950/20 border border-indigo-500/25 rounded-3xl space-y-4 shadow-[0_0_20px_rgba(99,102,241,0.05)] animate-fade-in">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-400 uppercase tracking-widest">
                    <Sliders className="w-4 h-4" />
                    <span>Resource Allocation Simulator</span>
                  </div>
                  <button 
                    onClick={resetSimulation}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-gray-400 font-bold uppercase transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Sandbox
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  Simulate team workload adjustments (e.g. assigning new projects or moving tasks) to view potential bottlenecks and optimizations in real-time.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {teamWorkload.map(tw => {
                    const adj = simulatedAdjustments[tw.team] || 0;
                    return (
                      <div key={tw.team} className="p-3 bg-black/40 border border-glass-border rounded-2xl flex flex-col justify-between items-center text-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Team {tw.team}</span>
                        <div className="my-2 flex items-center gap-1.5">
                          <button 
                            onClick={() => adjustSimCount(tw.team, -1)}
                            className="w-5 h-5 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center font-bold text-xs transition-all border border-white/5"
                          >
                            -
                          </button>
                          <span className={`text-base font-black font-mono ${adj > 0 ? 'text-green-400' : adj < 0 ? 'text-red-400' : 'text-white'}`}>
                            {tw.count + adj}
                          </span>
                          <button 
                            onClick={() => adjustSimCount(tw.team, 1)}
                            className="w-5 h-5 rounded-full bg-white/5 hover:bg-green-500/20 hover:text-green-400 flex items-center justify-center font-bold text-xs transition-all border border-white/5"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[9px] text-gray-500 font-bold uppercase">Adj: {adj > 0 ? `+${adj}` : adj}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Unique Premium Custom SVG Workload Chart */}
            <div className="p-4 bg-black/40 border border-glass-border rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-wider">
                <LineChart className="w-4 h-4 text-purple-400" />
                <span>Visual Team Workload Spread</span>
              </div>
              <div className="w-full flex items-end justify-between h-[180px] pt-4 px-2 select-none">
                {activeWorkloadData.map((tw) => {
                  const maxTarget = 8;
                  const ratio = Math.min(1.2, tw.count / maxTarget);
                  const barHeight = Math.max(12, ratio * (chartHeight - 40));
                  
                  // Color gradient
                  const fillClass = tw.count >= 8 
                    ? 'bg-gradient-to-t from-red-600/30 to-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                    : tw.count >= 5 
                      ? 'bg-gradient-to-t from-yellow-600/30 to-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                      : 'bg-gradient-to-t from-green-600/30 to-green-500/80 shadow-[0_0_10px_rgba(34,197,94,0.2)]';

                  return (
                    <div key={tw.team} className="flex flex-col items-center flex-1 mx-1.5 sm:mx-3 group">
                      <div className="text-[10px] font-black text-white mb-2 font-mono group-hover:text-purple-400 transition-colors">
                        {tw.count}
                      </div>
                      <div className="w-full relative rounded-t-lg overflow-hidden transition-all duration-500" style={{ height: `${barHeight}px` }}>
                        <div className={`w-full h-full rounded-t-lg ${fillClass}`} />
                      </div>
                      <div className="h-px w-full bg-glass-border mt-1" />
                      <div className="text-[9px] font-black text-gray-500 mt-2 uppercase tracking-wider group-hover:text-white transition-colors">
                        T-{tw.team}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Insights & Optimization Adviser for Refayet */}
            {isOwner && (
              <div className="p-4 bg-purple-950/20 border border-purple-500/10 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-purple-400 uppercase tracking-widest">
                  <LineChart className="w-4 h-4 text-purple-400" />
                  <span>Workload Optimization Advisor</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-black/40 rounded-xl border border-glass-border">
                    <span className="text-gray-500 block uppercase font-bold text-[9px] tracking-wider">Resource Allocation</span>
                    <p className="text-gray-300 mt-1 font-semibold">
                      <span className="text-red-400 font-extrabold">{workloadInsights.overloaded} Overloaded</span> /{' '}
                      <span className="text-yellow-400 font-extrabold">{workloadInsights.balanced} Balanced</span> /{' '}
                      <span className="text-green-400 font-extrabold">{workloadInsights.underloaded} Underloaded</span>
                    </p>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-glass-border">
                    <span className="text-gray-500 block uppercase font-bold text-[9px] tracking-wider">High Value Pipeline</span>
                    <p className="text-gray-300 mt-1 font-semibold">
                      Team <span className="text-green-400 font-black">{workloadInsights.highestValueTeam.team}</span> (${workloadInsights.highestValueTeam.value.toLocaleString()})
                    </p>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-glass-border">
                    <span className="text-gray-500 block uppercase font-bold text-[9px] tracking-wider">Optimization Suggestion</span>
                    <p className="text-gray-400 mt-1 text-[11px] leading-relaxed">
                      {workloadInsights.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Metrics Statistics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-black/40 border border-glass-border rounded-2xl text-left">
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Total WIP Tasks</span>
                <span className="text-lg font-extrabold text-white font-mono">
                  {activeWorkloadData.reduce((sum, tw) => sum + tw.count, 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Total Active Value</span>
                <span className="text-lg font-extrabold text-green-400 font-mono">
                  ${activeWorkloadData.reduce((sum, tw) => sum + tw.value, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Peak Team Load</span>
                <span className="text-sm font-extrabold text-purple-400 uppercase block truncate">
                  Team {activeWorkloadData.reduce((max, tw) => tw.count > max.count ? tw : max, { team: 'None', count: 0 }).team} ({activeWorkloadData.reduce((max, tw) => tw.count > max.count ? tw : max, { team: 'None', count: 0 }).count} WIP)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Target WIP Max</span>
                <span className="text-lg font-extrabold text-gray-400 font-mono">8 per Team</span>
              </div>
            </div>

            {/* Team Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeWorkloadData.map((tw) => {
                const maxWip = 8;
                const percentage = Math.min(100, (tw.count / maxWip) * 100);
                const isOverloaded = tw.count >= maxWip;

                return (
                  <div key={tw.team} className="p-4 bg-white/5 border border-glass-border rounded-2xl hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 group font-sans">
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
                          {percentage.toFixed(0)}%{isOverloaded && ' (Overloaded)'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${isOverloaded ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-glass-border flex justify-between items-center text-[10px]">
                      <span className="text-gray-500 font-bold uppercase tracking-wider">Active Pipeline Value</span>
                      <span className="text-yellow-400 font-extrabold font-mono">${tw.value.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* NRA Projects view */
        <div className="glass-panel p-5 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-glass-border pb-4 gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-green-400 uppercase tracking-widest flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                <span>NRA Projects Explorer</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Comprehensive view of projects currently marked with NRA Status.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={handleExportNraCSV}
                className="px-3.5 py-2 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 justify-center"
              >
                <Download className="w-3.5 h-3.5" />
                Export NRA List
              </button>
              
              {/* Search input */}
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Employee, Client, ID..."
                  value={nraSearchQuery}
                  onChange={(e) => setNraSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black/40 border border-glass-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Interactive SLA Urgency Heatmap Timeline */}
          {isOwner && (
            <div className="space-y-2">
              <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Interactive SLA Delivery Heatmap (Click to Filter):</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <button
                  onClick={() => setNraUrgencyFilter('All')}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                    nraUrgencyFilter === 'All'
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                      : 'bg-white/5 border-glass-border text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold tracking-wider">All Projects</span>
                  <span className="text-lg font-black mt-1.5 font-mono text-white">{nraProjects.length}</span>
                </button>
                
                <button
                  onClick={() => setNraUrgencyFilter('Critical')}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                    nraUrgencyFilter === 'Critical'
                      ? 'bg-red-500/15 border-red-500/40 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse'
                      : 'bg-white/5 border-glass-border text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-red-400 animate-spin" />
                    Critical (&lt; 5d)
                  </span>
                  <span className="text-lg font-black mt-1.5 font-mono text-red-400">{nraUrgencyData.critical}</span>
                </button>
                
                <button
                  onClick={() => setNraUrgencyFilter('Warning')}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                    nraUrgencyFilter === 'Warning'
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                      : 'bg-white/5 border-glass-border text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                    Warning (5-10d)
                  </span>
                  <span className="text-lg font-black mt-1.5 font-mono text-yellow-400">{nraUrgencyData.warning}</span>
                </button>
                
                <button
                  onClick={() => setNraUrgencyFilter('Safe')}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                    nraUrgencyFilter === 'Safe'
                      ? 'bg-green-500/10 border-green-500/30 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                      : 'bg-white/5 border-glass-border text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    Safe (11d+)
                  </span>
                  <span className="text-lg font-black mt-1.5 font-mono text-green-400">{nraUrgencyData.safe}</span>
                </button>
                
                <button
                  onClick={() => setNraUrgencyFilter('Undated')}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                    nraUrgencyFilter === 'Undated'
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                      : 'bg-white/5 border-glass-border text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    Backlog / Undated
                  </span>
                  <span className="text-lg font-black mt-1.5 font-mono text-blue-400">{nraUrgencyData.undated}</span>
                </button>
              </div>
            </div>
          )}

          {/* NRA Advanced Analytics */}
          {isOwner && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-black/40 border border-glass-border rounded-2xl">
                <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider mb-2">Sales Channel Distribution</span>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(nraInsights.salesDistribution).map(([team, count]) => (
                    <div key={team} className="px-3 py-1.5 bg-white/5 border border-glass-border rounded-xl flex items-center gap-2 text-xs">
                      <span className="font-bold text-gray-300">{team}</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-black/40 border border-glass-border rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Unassigned Remarks Alert</span>
                  <p className="text-xs text-gray-400 mt-1">NRA projects currently missing specific project execution notes or remarks.</p>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-black ${nraInsights.missingRemarks > 0 ? 'text-yellow-500' : 'text-green-400'} font-mono`}>
                    {nraInsights.missingRemarks}
                  </span>
                  <span className="text-[9px] text-gray-500 block uppercase font-bold mt-0.5">Missing Notes</span>
                </div>
              </div>
            </div>
          )}

          {/* Service Line Pill Filter */}
          <div className="space-y-2">
            <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Filter by Service Line:</span>
            <div className="flex flex-wrap gap-2">
              {nraServiceLines.map((line) => (
                <button
                  key={line}
                  onClick={() => setNraServiceLineFilter(line)}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    nraServiceLineFilter === line
                      ? 'bg-green-500/20 border-green-500/40 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]'
                      : 'bg-white/5 border-glass-border text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {line || 'Unassigned'}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Statistics Row for NRA */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-black/40 border border-glass-border rounded-2xl text-left">
            <div>
              <span className="text-[10px] text-gray-500 block uppercase font-bold">Filtered Count</span>
              <span className="text-lg font-extrabold text-white font-mono">
                {filteredNraProjects.length} Projects
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block uppercase font-bold">Total NRA Value</span>
              <span className="text-lg font-extrabold text-green-400 font-mono">
                ${totalNraValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] text-gray-500 block uppercase font-bold">Overall Count</span>
              <span className="text-lg font-extrabold text-purple-400 font-mono">
                {nraProjects.length}
              </span>
            </div>
          </div>

          {/* NRA Projects Table */}
          {filteredNraProjects.length === 0 ? (
            <div className="p-12 text-center text-gray-500 bg-black/20 border border-glass-border rounded-2xl">
              No NRA projects match the current search or filters.
            </div>
          ) : (
            <div className="overflow-x-auto border border-glass-border rounded-2xl bg-black/20">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-glass-border text-[10px] text-gray-400 uppercase font-black tracking-wider bg-white/5">
                    <th className="p-4">Order ID & Date</th>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Service Line</th>
                    <th className="p-4 text-right">Value</th>
                    <th className="p-4">Details & Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredNraProjects.map((project, i) => {
                    const rowVal = project['Value'] || project['Amount'] || '$0';
                    return (
                      <tr 
                        key={project['Order ID'] || i} 
                        className="hover:bg-white/5 transition-colors duration-150 group"
                      >
                        <td className="p-4">
                          <div className="font-extrabold text-white group-hover:text-purple-400 transition-colors font-mono">
                            {project['Order ID'] || 'N/A'}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{project['Date'] || 'N/A'}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-gray-200">{project['Employee Name']}</div>
                          <div className="text-[10px] text-gray-500">{project['Sales Team']}</div>
                        </td>
                        <td className="p-4 text-gray-300 font-mono">{project['Client name']}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            project['Service Line'] 
                              ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' 
                              : 'bg-gray-500/10 border border-gray-500/20 text-gray-400'
                          }`}>
                            {project['Service Line'] || 'Unassigned'}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-green-400 font-mono">{rowVal}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-400 max-w-[200px] truncate" title={project['Remarks'] || project['Order Sheet']}>
                              {project['Remarks'] || project['Order Sheet'] || 'No Remarks'}
                            </span>
                            {project['Order Link'] && (
                              <a
                                href={project['Order Link']}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-white/5 border border-glass-border text-gray-400 hover:bg-green-500/20 hover:text-green-400 transition-all shrink-0"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
