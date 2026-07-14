'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Truck } from 'lucide-react';

interface Props {
  csvDataOrders: string;
}

export default function TeamDeliveryTab({ csvDataOrders }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('CC'); // Default team 'CC' as seen in Tracker

  useEffect(() => {
    if (!csvDataOrders) return;
    
    Papa.parse(csvDataOrders, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          const firstRow = results.data[0] as Record<string, any>;
          // Fix spacing issue
          if (firstRow[' '] !== undefined && firstRow['Status'] === undefined) {
            results.data.forEach((row: any) => {
              row['Status'] = row[' '];
            });
          }
          // Fix unnamed Assign Team
          results.data.forEach((row: any) => {
            if (row[''] !== undefined && (!row['Assign Team'] || row['Assign Team'].trim() === '')) {
              row['Assign Team'] = row[''];
            }
          });

          setData(results.data);
          
          // Extract unique teams
          const uniqueTeams = Array.from(new Set(results.data.map((r: any) => r['Assign Team']?.trim()).filter(Boolean))) as string[];
          setTeams(uniqueTeams.sort());
          if (uniqueTeams.length > 0 && !uniqueTeams.includes(selectedTeam)) {
            setSelectedTeam(uniqueTeams[0]);
          }
        }
      }
    });
  }, [csvDataOrders]);

  const deliveryStats = useMemo(() => {
    if (!data.length || !selectedTeam) return [];
    
    const teamData = data.filter((row: any) => row['Assign Team']?.trim() === selectedTeam);
    
    const statsMap: Record<string, number> = {};
    
    teamData.forEach(row => {
      const personName = row['Profile Name']?.trim() || row['Developer']?.trim() || row['Assign Person']?.trim() || 'Unknown';
      const status = (row['Status'] || '').toLowerCase();
      
      // Consider an order "delivered" if its status is 'delivered', 'done', 'completed'
      const isDelivered = status.includes('deliver') || status.includes('done') || status.includes('complete');
      
      if (isDelivered) {
        statsMap[personName] = (statsMap[personName] || 0) + 1;
      }
    });
    
    const sortedStats = Object.entries(statsMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // Sort by highest deliveries
      
    return sortedStats;
  }, [data, selectedTeam]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gray-900 border border-glass-border rounded-xl">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" /> Team Delivery Stats
          </h2>
          <p className="text-xs text-gray-400 mt-1">Showing individual delivery counts per team based on Order Tracker data.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400 font-bold uppercase">Filter Team:</label>
          <select 
            value={selectedTeam} 
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="bg-black border border-glass-border text-white text-sm rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
          >
            <option value="" disabled>Select Team</option>
            {teams.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-gray-900 border border-glass-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-glass-border bg-black/40">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Delivery Leaderboard - <span className="text-blue-400">{selectedTeam || 'All'}</span>
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-950/50 text-xs text-gray-400 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium w-16 text-center">Rank</th>
                <th className="px-4 py-3 font-medium">Team Member</th>
                <th className="px-4 py-3 font-medium text-right">Total Delivered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {deliveryStats.map((stat, idx) => (
                <tr key={stat.name} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-center text-gray-500 font-bold">
                    #{idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">{stat.name}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 font-bold text-xs border border-blue-500/20">
                      {stat.count}
                    </span>
                  </td>
                </tr>
              ))}
              {deliveryStats.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500 text-xs">
                    No delivery records found for this team.
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
