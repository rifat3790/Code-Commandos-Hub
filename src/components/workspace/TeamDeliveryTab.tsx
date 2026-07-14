'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import { Truck, Filter, ChevronDown, CheckCircle2, Search, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  csvDataOrders: string;
}

// A reusable Single Select Dropdown Component
function SelectDropdown({
  label,
  options,
  selected,
  onChange,
  icon: Icon,
}: {
  label: string;
  options: string[];
  selected: string;
  onChange: (val: string) => void;
  icon?: any;
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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium bg-gray-900/50 border-glass-border text-gray-300 hover:bg-gray-800`}
      >
        {Icon && <Icon className="w-4 h-4 text-purple-400" />}
        <span className="text-gray-400">{label}:</span> <span className="text-white font-bold">{selected || 'All'}</span>
        <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 w-56 bg-gray-900 border border-glass-border rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto p-2 space-y-1">
              <div
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                onClick={() => { onChange(''); setIsOpen(false); }}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${!selected ? 'bg-purple-500 border-purple-500 text-white' : 'border-gray-500'}`}>
                  {!selected && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-sm text-gray-300">All</span>
              </div>

              {options.map(opt => {
                const isSelected = selected === opt;
                return (
                  <div
                    key={opt}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                    onClick={() => { onChange(opt); setIsOpen(false); }}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'border-gray-500'}`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
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

export default function TeamDeliveryTab({ csvDataOrders }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [serviceLines, setServiceLines] = useState<string[]>([]);
  
  const [selectedTeam, setSelectedTeam] = useState<string>('CC');
  const [selectedServiceLine, setSelectedServiceLine] = useState<string>('Shopify');

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
          
          // Extract unique service lines
          const uniqueServiceLines = Array.from(new Set(results.data.map((r: any) => r['Service Line']?.trim()).filter(Boolean))) as string[];
          setServiceLines(uniqueServiceLines.sort());
        }
      }
    });
  }, [csvDataOrders]);

  const deliveryStats = useMemo(() => {
    if (!data.length) return { list: [], totalDelivery: 0 };
    
    let filteredData = data;
    
    if (selectedTeam) {
      filteredData = filteredData.filter((row: any) => row['Assign Team']?.trim() === selectedTeam);
    }
    
    if (selectedServiceLine) {
      filteredData = filteredData.filter((row: any) => row['Service Line']?.trim() === selectedServiceLine);
    }
    
    const statsMap: Record<string, number> = {};
    let totalDelivery = 0;
    
    filteredData.forEach(row => {
      const personName = row['Profile Name']?.trim() || row['Developer']?.trim() || row['Assign Person']?.trim() || 'Unknown';
      const status = (row['Status'] || '').toLowerCase();
      
      // Consider an order "delivered" if its status is 'delivered', 'done', 'completed'
      const isDelivered = status.includes('deliver') || status.includes('done') || status.includes('complete');
      
      if (isDelivered) {
        statsMap[personName] = (statsMap[personName] || 0) + 1;
        totalDelivery++;
      }
    });
    
    const sortedStats = Object.entries(statsMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // Sort by highest deliveries
      
    return { list: sortedStats, totalDelivery };
  }, [data, selectedTeam, selectedServiceLine]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#0b0f19] border border-gray-800 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 w-full">
          <div className="flex-1">
            <h2 className="text-white font-extrabold text-2xl flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl border border-white/5 shadow-inner">
                <Truck className="w-6 h-6 text-purple-400" />
              </div>
              Team Deliveries
            </h2>
            <p className="text-sm text-gray-400 mt-2 font-medium">Track and analyze individual delivery performance across teams and service lines.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <SelectDropdown 
              label="Service Line"
              icon={Filter}
              options={serviceLines}
              selected={selectedServiceLine}
              onChange={setSelectedServiceLine}
            />
            <SelectDropdown 
              label="Team"
              icon={Filter}
              options={teams}
              selected={selectedTeam}
              onChange={setSelectedTeam}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-[#0b0f19] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total Deliveries</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                {deliveryStats.totalDelivery}
              </span>
              <span className="text-gray-500 font-medium">orders</span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-800/50">
              <p className="text-xs text-gray-500">Filtered by: <span className="text-gray-300 font-bold">{selectedServiceLine || 'All'}</span> / <span className="text-gray-300 font-bold">{selectedTeam || 'All'}</span></p>
            </div>
          </div>
          
          {deliveryStats.list.length > 0 && (
            <div className="bg-[#0b0f19] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
               <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-white text-sm font-bold uppercase tracking-widest">Top Performer</h3>
               </div>
               <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-black text-yellow-500">{deliveryStats.list[0].name.charAt(0)}</span>
                  </div>
                  <h4 className="text-lg font-bold text-white">{deliveryStats.list[0].name}</h4>
                  <p className="text-sm text-yellow-500 font-medium mt-1">{deliveryStats.list[0].count} deliveries</p>
               </div>
            </div>
          )}
        </div>

        <div className="md:col-span-3 bg-[#0b0f19] border border-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-800/60 bg-gray-950/30 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" /> Leaderboard
            </h3>
            <span className="text-xs font-medium text-gray-500 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
              {deliveryStats.list.length} Members Found
            </span>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#0b0f19] text-[11px] text-gray-400 font-bold uppercase tracking-widest border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 w-20 text-center">Rank</th>
                  <th className="px-6 py-4">Team Member</th>
                  <th className="px-6 py-4 text-right">Total Delivered</th>
                  <th className="px-6 py-4 text-right w-32">Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {deliveryStats.list.map((stat, idx) => {
                  const percentage = deliveryStats.totalDelivery > 0 ? Math.round((stat.count / deliveryStats.totalDelivery) * 100) : 0;
                  return (
                    <tr key={stat.name} className="hover:bg-gray-800/40 transition-colors group even:bg-gray-900/10 odd:bg-gray-950/5">
                      <td className="px-6 py-4 text-center">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                          idx === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 
                          idx === 1 ? 'bg-gray-300/20 text-gray-300 border border-gray-300/30' :
                          idx === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          'bg-gray-800 text-gray-500 border border-gray-700'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-purple-300">{stat.name.charAt(0)}</span>
                          </div>
                          <span className="text-gray-300 font-medium group-hover:text-white transition-colors">{stat.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="px-3 py-1 rounded-md bg-purple-500/10 text-purple-300 font-bold text-[13px] border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)] inline-block min-w-[3rem] text-center">
                          {stat.count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs font-bold text-gray-400 w-8">{percentage}%</span>
                          <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {deliveryStats.list.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="inline-flex flex-col items-center justify-center text-gray-500">
                        <Search className="w-8 h-8 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No delivery records found for this combination.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
