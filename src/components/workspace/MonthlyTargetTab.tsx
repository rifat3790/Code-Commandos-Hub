'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Plus, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MonthlyTargetTab() {
  const { user, dbUser } = useAuth();
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreating, setIsCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newMonthName, setNewMonthName] = useState('');

  const [savingId, setSavingId] = useState<string | null>(null);

  const isAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin';

  useEffect(() => {
    if (user?.uid) {
      fetchTargets();
    }
  }, [user]);

  const fetchTargets = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/workspace/targets?uid=${user.uid}`);
      const data = await res.json();
      if (data.success) {
        setTargets(data.targets);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load targets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newMonthName.trim() || !user?.uid) return;
    
    setIsCreating(true);
    try {
      const res = await fetch('/api/workspace/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          teamName: newTeamName,
          monthName: newMonthName,
          members: []
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Monthly Target created');
        setNewTeamName('');
        setNewMonthName('');
        fetchTargets();
      } else {
        toast.error(data.error || 'Failed to create');
      }
    } catch (err) {
      toast.error('Error creating target');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddMember = (targetId: string) => {
    setTargets(targets.map(t => {
      if (t._id === targetId) {
        return {
          ...t,
          members: [...t.members, { employeeId: '', name: '', officialTarget: 0, teamTarget: 0, achieved: 0 }]
        };
      }
      return t;
    }));
  };

  const handleMemberChange = (targetId: string, memberIndex: number, field: string, value: any) => {
    setTargets(targets.map(t => {
      if (t._id === targetId) {
        const newMembers = [...t.members];
        newMembers[memberIndex] = { ...newMembers[memberIndex], [field]: value };
        return { ...t, members: newMembers };
      }
      return t;
    }));
  };

  const handleSaveTarget = async (target: any) => {
    if (!user?.uid) return;
    setSavingId(target._id);
    try {
      const res = await fetch('/api/workspace/targets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          targetId: target._id,
          members: target.members
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Saved successfully');
        fetchTargets();
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (err) {
      toast.error('Error saving');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-green-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      {isAdmin && (
        <div className="p-5 bg-gray-900 border border-glass-border rounded-xl">
          <h3 className="text-sm font-bold text-white uppercase mb-4">Create New Monthly Target</h3>
          <form onSubmit={handleCreateTarget} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Team Name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="px-4 py-2 bg-black border border-glass-border rounded-lg text-sm text-white focus:border-green-500 outline-none flex-1"
              required
            />
            <input
              type="text"
              placeholder="Month Name (e.g., July 2026)"
              value={newMonthName}
              onChange={(e) => setNewMonthName(e.target.value)}
              className="px-4 py-2 bg-black border border-glass-border rounded-lg text-sm text-white focus:border-green-500 outline-none flex-1"
              required
            />
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-2 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 disabled:opacity-50 transition-colors flex items-center gap-2 justify-center"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
            </button>
          </form>
        </div>
      )}

      {targets.map(target => {
        const totalTeamTarget = target.members.reduce((sum: number, m: any) => sum + (Number(m.teamTarget) || 0), 0);
        const totalAchieved = target.members.reduce((sum: number, m: any) => sum + (Number(m.achieved) || 0), 0);

        return (
          <div key={target._id} className="bg-gray-900 border border-glass-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-glass-border bg-black/40 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-green-400 uppercase">{target.teamName}</h3>
                <p className="text-xs text-gray-400">{target.monthName}</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleSaveTarget(target)}
                  disabled={savingId === target._id}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {savingId === target._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-950/50 text-xs text-gray-400 uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">Employee ID</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium text-right">Official Target</th>
                    <th className="px-4 py-3 font-medium text-right">Team Target</th>
                    <th className="px-4 py-3 font-medium text-right">Achieved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {target.members.map((m: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-2">
                        {isAdmin ? (
                          <input type="text" value={m.employeeId} onChange={e => handleMemberChange(target._id, idx, 'employeeId', e.target.value)} className="w-full bg-black/50 border border-gray-700 px-2 py-1 rounded text-white text-xs" />
                        ) : <span className="text-gray-300">{m.employeeId}</span>}
                      </td>
                      <td className="px-4 py-2">
                        {isAdmin ? (
                          <input type="text" value={m.name} onChange={e => handleMemberChange(target._id, idx, 'name', e.target.value)} className="w-full bg-black/50 border border-gray-700 px-2 py-1 rounded text-white text-xs" />
                        ) : <span className="text-white font-medium">{m.name}</span>}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {isAdmin ? (
                          <input type="number" value={m.officialTarget} onChange={e => handleMemberChange(target._id, idx, 'officialTarget', Number(e.target.value))} className="w-24 bg-black/50 border border-gray-700 px-2 py-1 rounded text-white text-xs text-right" />
                        ) : <span className="text-gray-300">${m.officialTarget}</span>}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {isAdmin ? (
                          <input type="number" value={m.teamTarget} onChange={e => handleMemberChange(target._id, idx, 'teamTarget', Number(e.target.value))} className="w-24 bg-black/50 border border-gray-700 px-2 py-1 rounded text-white text-xs text-right" />
                        ) : <span className="text-gray-300">${m.teamTarget}</span>}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {isAdmin ? (
                          <input type="number" value={m.achieved} onChange={e => handleMemberChange(target._id, idx, 'achieved', Number(e.target.value))} className="w-24 bg-black/50 border border-green-500/30 px-2 py-1 rounded text-green-400 text-xs font-bold text-right" />
                        ) : <span className="text-green-400 font-bold">${m.achieved}</span>}
                      </td>
                    </tr>
                  ))}
                  {target.members.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-xs">No members added yet.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-black/40 text-xs border-t-2 border-glass-border">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 font-bold text-white text-right">TOTAL</td>
                    <td className="px-4 py-3 font-bold text-yellow-400 text-right">${totalTeamTarget}</td>
                    <td className="px-4 py-3 font-bold text-green-400 text-right">${totalAchieved}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {isAdmin && (
              <div className="p-3 border-t border-glass-border bg-black/20">
                <button
                  onClick={() => handleAddMember(target._id)}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Member Entry
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
