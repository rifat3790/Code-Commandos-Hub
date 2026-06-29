'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Award, 
  Code2, 
  Download, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Save,
  PenTool,
  Trophy,
  Star,
  Target,
  Zap,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspaceStore } from '@/store/workspaceStore'; // Still needed for activity logs or local data

interface ProjectData {
  _id: string;
  projectName: string;
  clientName: string;
  storeUrl: string;
  value: string;
  status: string;
  createdAt: string;
}

export default function MemberProfilePage() {
  const store = useWorkspaceStore();
  const { user, dbUser } = useAuth();
  
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    store.hydrate();
  }, []);

  // Hydrate local form states when store loads or user changes
  useEffect(() => {
    if (dbUser) {
      setName(dbUser.name || user?.displayName || '');
      setRole(dbUser.role || '');
      setSkills(dbUser.skills || []);
    } else if (user) {
      setName(user.displayName || '');
    }
  }, [dbUser, user]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setIsLoadingProjects(false);
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`/api/personal-projects?uid=${user?.uid}`);
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const updateProfileInDB = async (updateData: any) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await fetch(`/api/users/me?uid=${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      // Force reload auth context if possible, or just update local state
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    await updateProfileInDB({ name, role });
    setIsEditing(false);
    store.logActivity('Profile Info Updated', 'note', 'Modified developer credentials.');
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim() || skills.includes(newSkill.trim())) return;
    
    const updatedSkills = [...skills, newSkill.trim()];
    setSkills(updatedSkills);
    setNewSkill('');
    
    await updateProfileInDB({ skills: updatedSkills });
    store.logActivity('Skill Added', 'note', `Added skill: ${newSkill.trim()}`);
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    const updatedSkills = skills.filter(s => s !== skillToRemove);
    setSkills(updatedSkills);
    await updateProfileInDB({ skills: updatedSkills });
    store.logActivity('Skill Removed', 'note', `Removed skill: ${skillToRemove}`);
  };

  // Dynamic Calculations
  const { totalProjects, totalValue, averageValue } = useMemo(() => {
    const total = projects.length;
    const value = projects.reduce((acc, curr) => {
      const num = parseFloat(String(curr.value).replace(/[^0-9.-]+/g, ""));
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
    const avg = total > 0 ? value / total : 0;
    
    return {
      totalProjects: total,
      totalValue: value,
      averageValue: avg
    };
  }, [projects]);

  // Determine Dynamic Badges based on accomplishments
  const dynamicBadges = useMemo(() => {
    const badges = [];
    if (totalProjects >= 1) badges.push({ name: "First Project 🏆", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: Trophy });
    if (totalProjects >= 10) badges.push({ name: "10+ Projects 🔥", color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: Sparkles });
    if (totalProjects >= 50) badges.push({ name: "Veteran 👑", color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: Star });
    
    if (totalValue >= 1000) badges.push({ name: "$1k+ Earner 💰", color: "text-green-400 bg-green-500/10 border-green-500/20", icon: Target });
    if (totalValue >= 5000) badges.push({ name: "$5k+ Elite 💎", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: Zap });
    if (totalValue >= 10000) badges.push({ name: "$10k+ Master 🚀", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Award });
    
    return badges;
  }, [totalProjects, totalValue]);

  const displayName = dbUser?.name || user?.displayName || name || 'Developer';
  const displayRole = dbUser?.role || role || 'User';
  const avatarText = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white uppercase">MEMBER PROFILE</h1>
        <p className="text-gray-400 text-sm">Shopify expert team dashboard. Manage skills inventory and completed milestones.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar Card & Editable Profile */}
        <div className="space-y-6">
          
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-transparent pointer-events-none" />
            
            <div className="pt-6 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-green-500 to-emerald-800 flex items-center justify-center font-bold text-3xl text-white border-2 border-green-500/30 shadow-lg glow-green overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  avatarText
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white tracking-wide">{displayName}</h2>
              <p className="text-xs text-green-400 font-semibold uppercase">{displayRole}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-glass-border pt-4 text-xs font-medium">
              <div className="p-2 rounded bg-gray-950/40">
                <span className="text-gray-500 text-[10px] block">Downloads</span>
                <span className="text-white font-bold">{store.memberProfile?.downloadsCount || 0} files</span>
              </div>
              <div className="p-2 rounded bg-gray-950/40">
                <span className="text-gray-500 text-[10px] block">Template Uses</span>
                <span className="text-white font-bold">{store.memberProfile?.templateUsageCount || 0} copies</span>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-3 pt-2 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">Developer Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                  />
                </div>
                {dbUser?.role === 'super_admin' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase">Role Title</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                    />
                  </div>
                )}
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-2 rounded-lg bg-gray-900 border border-glass-border hover:bg-glass-hover text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
              >
                <PenTool className="w-3.5 h-3.5 text-green-400" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {/* Stats Achievements Card */}
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-green-400" />
              <span>Achievements Milestones</span>
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded bg-gray-950/60 border border-glass-border">
                <span className="text-gray-400 font-semibold">Total Projects Delivered</span>
                <span className="text-white font-extrabold">{totalProjects}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-gray-950/60 border border-glass-border relative overflow-hidden">
                <div className="absolute inset-0 bg-green-500/5 glow-green pointer-events-none"></div>
                <span className="text-green-400 font-bold z-10">Lifetime Earnings</span>
                <span className="text-green-400 font-extrabold z-10 text-sm">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-gray-950/60 border border-glass-border">
                <span className="text-gray-400 font-semibold">Average Value / Project</span>
                <span className="text-white font-extrabold">${averageValue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-gray-950/60 border border-glass-border">
                <span className="text-gray-400 font-semibold">Milestone Badges Unlocked</span>
                <span className="text-white font-extrabold">{dynamicBadges.length} items</span>
              </div>
            </div>
            
            {/* Dynamic Badges Display */}
            {dynamicBadges.length > 0 && (
              <div className="pt-2 border-t border-glass-border">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 block">Unlocked Badges</p>
                <div className="flex flex-wrap gap-2">
                  {dynamicBadges.map((badge, idx) => (
                    <div key={idx} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badge.color}`}>
                      <badge.icon className="w-3 h-3" />
                      {badge.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Center & Right Column: Skills Board & Completed Projects */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Skills Board */}
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4.5 h-4.5 text-green-400" />
                <span>Shopify Developer Skills inventory</span>
              </h3>
              
              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Liquid Section Schemas"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="px-3 py-1 text-xs rounded-lg glass-input w-44"
                />
                <button type="submit" disabled={isSaving} className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-black">
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
              </form>
            </div>

            <div className="flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <div 
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-glass-border text-xs text-white"
                  >
                    <span className="font-semibold">{skill}</span>
                    <button 
                      onClick={() => handleRemoveSkill(skill)}
                      disabled={isSaving}
                      className="text-gray-500 hover:text-red-400 transition-colors ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No skills added yet. Add your Shopify skills above.</p>
              )}
            </div>
          </div>

          {/* Completed Shopify Projects Grid */}
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-green-400" />
              <span>Completed Projects Logbook</span>
            </h3>

            {isLoadingProjects ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
              </div>
            ) : projects.length > 0 ? (
              <div className="divide-y divide-glass-border max-h-[400px] overflow-y-auto pr-2">
                {projects.map((proj) => (
                  <div key={proj._id} className="py-3 flex items-center justify-between text-xs gap-4">
                    <div>
                      <h4 className="font-bold text-white text-sm">{proj.projectName}</h4>
                      <p className="text-gray-500 text-[10px] mt-0.5">
                        Client: <span className="font-semibold text-gray-300">{proj.clientName}</span> • URL: <span className="italic text-blue-400">{proj.storeUrl}</span>
                      </p>
                      <p className="text-gray-600 text-[9px] mt-0.5">
                        Submitted: {new Date(proj.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-0.5 rounded bg-green-500/10 border border-green-500/15 text-green-400 text-[10px] font-bold uppercase tracking-wider glow-green">
                        COMPLETED
                      </span>
                      <span className="block text-green-400 font-mono mt-1 font-extrabold text-sm">${String(proj.value).replace(/[^0-9.-]+/g, "")}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-2">
                <p className="text-xs text-gray-400 font-medium">No projects logged yet.</p>
                <p className="text-[10px] text-gray-500">Go to your Personal Projects tab to log completed work and unlock badges!</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
