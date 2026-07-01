'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Code2, Plus, Copy, Trash2, Check, ExternalLink, X, MonitorPlay } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Snippet {
  _id: string;
  title: string;
  code: string;
  createdBy: string;
  createdAt: string;
}

export default function ShopifyCodesPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { user } = useAuth();
  const profile = useWorkspaceStore((state) => state.memberProfile);
  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : profile?.name) || 'Developer';

  useEffect(() => {
    fetchSnippets();
  }, []);

  const fetchSnippets = async () => {
    try {
      const res = await fetch('/api/shopify-snippets');
      const data = await res.json();
      if (res.ok) {
        setSnippets(data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load snippets');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) {
      toast.error('Please enter both title and code');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/shopify-snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          code,
          createdBy: displayName
        })
      });

      if (res.ok) {
        toast.success('Snippet saved successfully!');
        setShowModal(false);
        setTitle('');
        setCode('');
        fetchSnippets();
      } else {
        toast.error('Failed to save snippet');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error saving snippet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this snippet?')) return;
    try {
      const res = await fetch(`/api/shopify-snippets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Snippet deleted');
        setSnippets(prev => prev.filter(s => s._id !== id));
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error deleting snippet');
    }
  };

  const copyToClipboard = (codeStr: string, id: string) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedId(id);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-glass-border">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <Code2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider">Shopify Codes</h1>
            <p className="text-gray-400 text-sm">Save, share, and preview Shopify components</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold tracking-wider flex items-center gap-2 transition-colors shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Save New Code</span>
        </button>
      </div>

      {/* Grid of Snippets */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading snippets...</div>
      ) : snippets.length === 0 ? (
        <div className="text-center py-20 glass-panel border border-glass-border rounded-xl">
          <MonitorPlay className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-300">No codes saved yet</h2>
          <p className="text-sm text-gray-500">Be the first to save a Shopify snippet!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {snippets.map((snippet) => (
            <div key={snippet._id} className="glass-panel border border-glass-border rounded-2xl overflow-hidden flex flex-col shadow-lg">
              {/* Card Header */}
              <div className="p-4 border-b border-glass-border flex items-center justify-between bg-black/40">
                <div className="overflow-hidden pr-4">
                  <h3 className="font-bold text-white text-lg truncate">{snippet.title}</h3>
                  <p className="text-xs text-gray-500 font-mono">Saved by {snippet.createdBy} • {new Date(snippet.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyToClipboard(snippet.code, snippet._id)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors flex items-center gap-2"
                    title="Copy Code"
                  >
                    {copiedId === snippet._id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(snippet._id)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Live Preview Iframe */}
              <div className="relative w-full h-[400px] bg-white group">
                {/* Fallback for basic liquid display - since browser iframe can only render HTML/CSS perfectly */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white font-mono z-10 select-none opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10">
                  Live Preview Container
                </div>
                <iframe
                  title={`Preview for ${snippet.title}`}
                  srcDoc={snippet.code}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1120] border border-glass-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-glass-border flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-400" />
                Save Shopify Code
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Section Name / Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Custom Announcement Bar, Product Grid, etc."
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              <div className="flex-1 min-h-[300px] flex flex-col">
                <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider flex items-center justify-between">
                  <span>Code (HTML / CSS / JS / Liquid)</span>
                </label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={`<!-- Paste your code here -->\n<div class="my-section">\n  <h1>{{ section.settings.title }}</h1>\n</div>\n\n<style>\n  .my-section {\n    background: #f4f4f4;\n    padding: 20px;\n  }\n</style>`}
                  className="w-full flex-1 bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono text-sm transition-colors resize-none min-h-[400px]"
                  required
                  spellCheck="false"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-lg border border-gray-600 hover:bg-gray-800 text-gray-300 font-bold tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold tracking-wider transition-colors flex items-center gap-2"
                >
                  {submitting ? 'Saving...' : 'Save Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
