"use client";

import { useMemo, useState, useEffect } from 'react';
import Papa from 'papaparse';
import { AlertTriangle, TrendingUp, Users } from 'lucide-react';

export default function WorkloadMetricsTab({ 
  csvData 
}: { 
  csvData: string 
}) {
  const [data, setData] = useState<any[]>([]);

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

  if (teamWorkload.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-black/40 border border-glass-border rounded-2xl">
        No active WIP data found for teams.
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 space-y-4 mt-6">
      <div className="flex justify-between items-center border-b border-glass-border pb-3">
        <div>
          <h2 className="text-sm font-extrabold text-purple-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>Team Workload & Active Assignment Metrics</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Real-time status of active WIP orders, workload load factor, and pipeline value distribution per team.</p>
        </div>
      </div>

      <div className="space-y-6 pt-2">
        {/* Overload Warning Banner */}
        {teamWorkload.some(tw => tw.count >= 8) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-xl gap-4">
            <div className="flex items-start sm:items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400 shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-400" />
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

        {/* Quick Metrics Statistics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-black/40 border border-glass-border rounded-2xl text-left">
          <div>
            <span className="text-[10px] text-gray-500 block uppercase font-bold">Total WIP Tasks</span>
            <span className="text-lg font-extrabold text-white font-mono">
              {teamWorkload.reduce((sum, tw) => sum + tw.count, 0)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 block uppercase font-bold">Total Active Value</span>
            <span className="text-lg font-extrabold text-green-400 font-mono">
              ${teamWorkload.reduce((sum, tw) => sum + tw.value, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 block uppercase font-bold">Peak Team Load</span>
            <span className="text-sm font-extrabold text-purple-400 uppercase block truncate">
              Team {teamWorkload.reduce((max, tw) => tw.count > max.count ? tw : max, { team: 'None', count: 0 }).team} ({teamWorkload.reduce((max, tw) => tw.count > max.count ? tw : max, { team: 'None', count: 0 }).count} WIP)
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 block uppercase font-bold">Target WIP Max</span>
            <span className="text-lg font-extrabold text-gray-400 font-mono">8 per Team</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teamWorkload.map((tw) => {
            const maxWip = 8; // Max target WIP threshold
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
  );
}
