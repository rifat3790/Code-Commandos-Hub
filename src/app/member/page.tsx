'use client';

import React, { useState, useEffect } from 'react';
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
  PenTool
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuth } from '@/context/AuthContext';

export default function MemberProfilePage() {
  const store = useWorkspaceStore();
  const { user, dbUser } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    store.hydrate();
  }, []);

  // Hydrate local form states when store loads or user changes
  useEffect(() => {
    setName(dbUser?.name || user?.displayName || store.memberProfile?.name || '');
    setRole(dbUser?.role || store.memberProfile?.role || '');
  }, [store.memberProfile, dbUser, user]);

  const handleSaveProfile = () => {
    store.updateProfile({ name, role });
    setIsEditing(false);
    store.logActivity('Profile Info Updated', 'note', 'Modified developer credentials.');
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim() || store.memberProfile.skills.includes(newSkill.trim())) return;
    store.updateProfile({
      skills: [...store.memberProfile.skills, newSkill.trim()]
    });
    setNewSkill('');
    store.logActivity('Skill Added', 'note', `Added skill: ${newSkill.trim()}`);
  };

  const handleRemoveSkill = (skill: string) => {
    store.updateProfile({
      skills: store.memberProfile.skills.filter(s => s !== skill)
    });
    store.logActivity('Skill Removed', 'note', `Removed skill: ${skill}`);
  };

  // Mock list of completed Shopify projects matching developer metrics
  const completedProjects = [
    { name: 'Fitestore-2 Custom Theme', client: 'stankosters', status: 'Delivered', value: '$220', link: 'fitestore-2.myshopify.com' },
    { name: 'Bloom & Bath Subsections', client: 'Amonebln', status: 'Completed', value: '$180', link: 'bloomandbath.com' },
    { name: 'Abbas Shopify Product Loader', client: 'abbas_pdg', status: 'Approved', value: '$350', link: 'abbaspdg-store.myshopify.com' },
    { name: 'Fiverr Order Milestone Gateway', client: 'Daniel', status: 'Completed', value: '$90', link: 'daniel-shopify.myshopify.com' },
  ];

  const displayName = dbUser?.name || user?.displayName || store.memberProfile.name;
  const displayRole = dbUser?.role || store.memberProfile.role;
  const avatarText = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">MEMBER PROFILE</h1>
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
                <span className="text-white font-bold">{store.memberProfile.downloadsCount} files</span>
              </div>
              <div className="p-2 rounded bg-gray-950/40">
                <span className="text-gray-500 text-[10px] block">Template Uses</span>
                <span className="text-white font-bold">{store.memberProfile.templateUsageCount} copies</span>
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
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">Role Title</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  className="w-full py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
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
                <span className="text-white font-extrabold">{store.memberProfile.projectsCount}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-gray-950/60 border border-glass-border">
                <span className="text-gray-400 font-semibold">Milestone Achievement Badges</span>
                <span className="text-white font-extrabold">{store.memberProfile.achievementsCount} items</span>
              </div>
            </div>
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
                <button type="submit" className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-black">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            <div className="flex flex-wrap gap-2">
              {store.memberProfile.skills.map((skill) => (
                <div 
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-glass-border text-xs text-white"
                >
                  <span className="font-semibold">{skill}</span>
                  <button 
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-gray-500 hover:text-red-400 transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Shopify Projects Grid */}
          <div className="p-5 rounded-xl border border-glass-border bg-gray-950/20 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-green-400" />
              <span>Completed Projects Logbook</span>
            </h3>

            <div className="divide-y divide-glass-border max-h-[300px] overflow-y-auto">
              {completedProjects.map((proj, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs gap-4">
                  <div>
                    <h4 className="font-bold text-white">{proj.name}</h4>
                    <p className="text-gray-500 text-[10px] mt-0.5">
                      Client: <span className="font-semibold text-gray-400">{proj.client}</span> • URL: <span className="italic text-blue-400">{proj.link}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded bg-green-500/10 border border-green-500/15 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                      {proj.status}
                    </span>
                    <span className="block text-gray-400 font-mono mt-1 font-bold">{proj.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
