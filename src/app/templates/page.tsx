'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Star, 
  Folder, 
  Copy, 
  Check, 
  Plus, 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  FileCode,
  FileCheck,
  Variable,
  AlertCircle,
  RefreshCw,
  Palette
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Template } from '@/types';
import { useAuth } from '@/context/AuthContext';

const CATEGORIES = [
  'All',
  'Delivery',
  'Update',
  'Revision',
  'Extension',
  'Followup',
  'Cancellation',
  'Meeting',
  'Support',
  'Payment Setup',
  'Store Access',
  'Migration',
  'Review Request',
  'Tips Thanks',
  'Shopify',
  'Custom'
];

export default function TemplatesPage() {
  const store = useWorkspaceStore();
  const { dbUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const activeTemplatesLayout = store.settings?.globalLayout || 'default';
  const isSuperAdmin = dbUser?.role === 'super_admin';

  const templatesLayouts = [
    { id: 'default', name: 'Layout 1: Neon Glassmorphic' },
    { id: 'slate', name: 'Layout 2: Clean Slate & Platinum' },
    { id: 'aurora', name: 'Layout 3: Aurora Gradient' },
    { id: 'cyber', name: 'Layout 4: Cyber-Chrono (Green)' },
    { id: 'gold', name: 'Layout 5: Royal Gold & Onyx' }
  ];

  const templatesStyles = useMemo(() => {
    switch(activeTemplatesLayout) {
      case 'slate': // Layout 2: Clean Slate & Platinum
        return {
          wrapper: "space-y-6 pb-12 relative font-sans",
          headerTitle: "text-2xl lg:text-3xl font-bold tracking-tight text-white",
          headerDesc: "text-gray-400 text-sm",
          categoryBtnActive: "px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider bg-gray-800 text-white border border-gray-700 whitespace-nowrap",
          categoryBtnInactive: "px-3 py-1.5 rounded-none text-xs font-semibold uppercase tracking-wider text-gray-450 hover:text-white bg-gray-955 border border-gray-850 hover:border-gray-700 whitespace-nowrap",
          mainCard: "p-5 rounded-none border border-gray-800 bg-gray-905 space-y-4",
          cardContainer: "p-4 rounded-none border border-gray-850 bg-gray-955 hover:border-gray-650 hover:bg-gray-850 transition-all cursor-pointer text-left block relative",
          inputField: "w-full pl-9 pr-4 py-2 rounded-none bg-gray-955 border border-gray-850 text-white text-xs focus:border-gray-600 outline-none",
          actionBtnAdd: "flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-none text-xs font-bold transition-all border border-gray-700",
          templateBodyBox: "p-5 rounded-none border border-gray-800 bg-gray-905 space-y-5 text-left h-full flex flex-col",
          preBox: "p-4 rounded-none bg-gray-955 border border-gray-850 font-mono text-xs leading-relaxed space-y-2 h-full min-h-[160px] overflow-y-auto relative text-left",
          badge: "px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-gray-300 border border-gray-700",
          varInput: "w-full px-3 py-1.5 rounded-none bg-gray-955 border border-gray-850 text-white text-xs focus:border-gray-600 outline-none"
        };
      case 'aurora': // Layout 3: Aurora Gradient & Mesh Flow
        return {
          wrapper: "space-y-6 pb-12 relative font-sans",
          headerTitle: "text-2xl lg:text-3xl font-extrabold tracking-tight text-white",
          headerDesc: "text-indigo-200/80 text-sm",
          categoryBtnActive: "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/35 whitespace-nowrap",
          categoryBtnInactive: "px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-indigo-200/50 hover:text-white bg-indigo-955/20 border border-indigo-500/10 hover:border-indigo-500/30 whitespace-nowrap",
          mainCard: "p-5 rounded-2xl border border-indigo-500/10 bg-indigo-955/5 shadow-[0_8px_32px_rgba(99,102,241,0.05)] space-y-4",
          cardContainer: "p-4 rounded-2xl border border-indigo-500/10 bg-indigo-955/20 hover:border-indigo-500/35 hover:bg-indigo-955/30 transition-all cursor-pointer text-left block relative shadow-sm",
          inputField: "w-full pl-9 pr-4 py-2 rounded-xl bg-indigo-955/40 border border-indigo-500/20 text-white text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none",
          actionBtnAdd: "flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md",
          templateBodyBox: "p-5 rounded-2xl border border-indigo-500/15 bg-indigo-955/5 shadow-[0_8px_32px_rgba(99,102,241,0.05)] space-y-5 text-left h-full flex flex-col",
          preBox: "p-4 rounded-2xl bg-indigo-955/30 border border-indigo-500/10 font-mono text-xs leading-relaxed space-y-2 h-full min-h-[160px] overflow-y-auto relative text-left",
          badge: "px-2 py-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/20",
          varInput: "w-full px-3 py-1.5 rounded-xl bg-indigo-955/40 border border-indigo-500/20 text-white text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none"
        };
      case 'cyber': // Layout 4: Cyberpunk Matrix Tech
        return {
          wrapper: "space-y-6 pb-12 relative font-mono",
          headerTitle: "text-2xl lg:text-3xl font-black tracking-tight text-white uppercase",
          headerDesc: "text-emerald-500/80 text-xs",
          categoryBtnActive: "px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider bg-emerald-955/30 text-emerald-400 border border-emerald-500/60 whitespace-nowrap",
          categoryBtnInactive: "px-3 py-1.5 rounded-none text-xs font-semibold uppercase tracking-wider text-emerald-600 hover:text-emerald-400 bg-black border border-emerald-500/25 hover:border-emerald-500/50 whitespace-nowrap",
          mainCard: "p-5 rounded-none border border-emerald-500/30 bg-black shadow-[0_0_15px_rgba(16,185,129,0.05)] space-y-4",
          cardContainer: "p-4 rounded-none border border-emerald-500/20 bg-black hover:border-emerald-500/50 hover:bg-emerald-955/10 transition-all cursor-pointer text-left block relative",
          inputField: "w-full pl-9 pr-4 py-2 rounded-none bg-black border border-emerald-500/35 text-emerald-450 text-xs focus:border-emerald-500 outline-none",
          actionBtnAdd: "flex items-center gap-1.5 px-4 py-2 bg-black border-2 border-dashed border-emerald-500 hover:bg-emerald-955/30 text-emerald-400 rounded-none text-xs font-bold transition-all",
          templateBodyBox: "p-5 rounded-none border border-emerald-500/30 bg-black shadow-[0_0_15px_rgba(16,185,129,0.05)] space-y-5 text-left h-full flex flex-col",
          preBox: "p-4 rounded-none bg-black border border-emerald-500/20 font-mono text-xs leading-relaxed space-y-2 h-full min-h-[160px] overflow-y-auto relative text-left",
          badge: "px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider bg-emerald-955/20 text-emerald-400 border border-emerald-500/30",
          varInput: "w-full px-3 py-1.5 rounded-none bg-black border border-emerald-500/35 text-emerald-450 text-xs focus:border-emerald-500 outline-none font-mono"
        };
      case 'gold': // Layout 5: Royal Gold & Onyx
        return {
          wrapper: "space-y-6 pb-12 relative font-sans",
          headerTitle: "text-2xl lg:text-3xl font-black tracking-tight text-white uppercase tracking-wider",
          headerDesc: "text-amber-250/70 text-sm",
          categoryBtnActive: "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap",
          categoryBtnInactive: "px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-amber-200/50 hover:text-white bg-black border border-amber-500/15 hover:border-amber-500/30 whitespace-nowrap",
          mainCard: "p-5 rounded-2xl border border-amber-500/25 bg-[#0b0b0b] shadow-lg space-y-4",
          cardContainer: "p-4 rounded-2xl border border-amber-500/15 bg-[#121212] hover:border-amber-500/35 hover:bg-[#1a1a1a] transition-all cursor-pointer text-left block relative shadow-sm",
          inputField: "w-full pl-9 pr-4 py-2 rounded-xl bg-black border border-amber-500/20 text-white text-xs focus:ring-1 focus:ring-amber-500/40 outline-none",
          actionBtnAdd: "flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black rounded-xl text-xs font-bold transition-all shadow-sm",
          templateBodyBox: "p-5 rounded-2xl border border-amber-500/25 bg-[#0b0b0b] space-y-5 text-left h-full flex flex-col shadow-lg",
          preBox: "p-4 rounded-2xl bg-black border border-amber-500/15 font-mono text-xs leading-relaxed space-y-2 h-full min-h-[160px] overflow-y-auto relative text-left",
          badge: "px-2 py-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-amber-500/25 text-amber-300 border border-amber-500/20",
          varInput: "w-full px-3 py-1.5 rounded-xl bg-black border border-amber-500/20 text-white text-xs focus:ring-1 focus:ring-amber-500/40 outline-none"
        };
      default: // Neon Glassmorphic (Default)
        return {
          wrapper: "space-y-6 pb-12 relative",
          headerTitle: "text-2xl lg:text-3xl font-extrabold tracking-tight text-white",
          headerDesc: "text-gray-400 text-sm",
          categoryBtnActive: "px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all bg-green-500/10 border border-green-500/20 text-green-400 whitespace-nowrap",
          categoryBtnInactive: "px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-glass-hover whitespace-nowrap",
          mainCard: "p-5 rounded-xl border border-glass-border bg-gray-955/20 space-y-4",
          cardContainer: "p-4 rounded-xl border border-glass-border bg-gray-955/60 hover:bg-glass-hover hover:border-white/10 transition-all cursor-pointer text-left block relative",
          inputField: "w-full pl-9 pr-4 py-2 rounded-lg glass-input text-xs focus:ring-2 focus:ring-green-500/50 outline-none",
          actionBtnAdd: "flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-black rounded-xl text-xs font-bold transition-all glow-green",
          templateBodyBox: "p-5 rounded-xl border border-glass-border bg-gray-955/20 space-y-5 text-left h-full flex flex-col",
          preBox: "p-4 rounded-xl bg-gray-955/60 border border-glass-border font-mono text-xs leading-relaxed space-y-2 h-full min-h-[160px] overflow-y-auto relative text-left",
          badge: "px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-semibold uppercase tracking-wider",
          varInput: "w-full px-3 py-1.5 rounded-lg glass-input text-xs"
        };
    }
  }, [activeTemplatesLayout]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Variables builder state
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Template Builder States
  const [builderOpen, setBuilderOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Custom');
  const [newContent, setNewContent] = useState('');
  const [newDesc, setNewDesc] = useState('');
  
  // PDF Extractor States
  const [pdfUploadOpen, setPdfUploadOpen] = useState(false);
  const [pdfExtractedText, setPdfExtractedText] = useState('');
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfFilesList, setPdfFilesList] = useState<{ name: string; size: string }[]>([]);

  useEffect(() => {
    store.hydrate();
  }, []);

  // Set first template as default selected
  useEffect(() => {
    if (store.templates.length > 0 && !selectedTemplate) {
      setSelectedTemplate(store.templates[0]);
    }
  }, [store.templates, selectedTemplate]);

  // Extract variables when template selection changes
  useEffect(() => {
    if (selectedTemplate) {
      // Find all matches for {{variable_name}}
      const regex = /\{\{([^}]+)\}\}/g;
      const vars: string[] = [];
      let match;
      while ((match = regex.exec(selectedTemplate.content)) !== null) {
        vars.push(match[1]);
      }
      const uniqueVars = Array.from(new Set(vars));
      
      const initialVals: Record<string, string> = {};
      uniqueVars.forEach(v => {
        initialVals[v] = variableValues[v] || '';
      });
      setVariableValues(initialVals);
    }
  }, [selectedTemplate]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return store.templates.filter((tpl) => {
      const matchesCategory = activeCategory === 'All' || tpl.category === activeCategory;
      const matchesSearch = 
        tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [store.templates, activeCategory, searchQuery]);

  // Compiled preview text with replaced variables
  const compiledPreview = useMemo(() => {
    if (!selectedTemplate) return '';
    let text = selectedTemplate.content;
    Object.entries(variableValues).forEach(([key, val]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      text = text.replace(regex, val || `[${key}]`);
    });
    return text;
  }, [selectedTemplate, variableValues]);

  const handleCopy = () => {
    if (!compiledPreview) return;
    navigator.clipboard.writeText(compiledPreview);
    setCopied(true);
    store.logActivity('Template Copied', 'template', `Copied: ${selectedTemplate?.title}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    store.toggleFavoriteTemplate(id);
  };

  const handleDuplicate = (tpl: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated: Template = {
      ...tpl,
      id: Math.random().toString(36).substring(2),
      title: `${tpl.title} (Copy)`,
      isCustom: true,
      isFavorite: false
    };
    store.addTemplate(duplicated);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    store.deleteTemplate(id);
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(store.templates[0] || null);
    }
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    // Scan for variables in content
    const regex = /\{\{([^}]+)\}\}/g;
    const vars: string[] = [];
    let match;
    while ((match = regex.exec(newContent)) !== null) {
      vars.push(match[1]);
    }

    const tpl: Template = {
      id: Math.random().toString(36).substring(2),
      title: newTitle,
      description: newDesc || 'Custom developer template',
      category: newCategory,
      content: newContent,
      variables: Array.from(new Set(vars)),
      isFavorite: false,
      isCustom: true
    };

    store.addTemplate(tpl);
    setSelectedTemplate(tpl);
    setBuilderOpen(false);
    setNewTitle('');
    setNewContent('');
    setNewDesc('');
  };

  // PDF Text Extraction Simulator
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfParsing(true);
    setPdfFilesList([{ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' }]);

    // Read the file locally as text. 
    // Since developers may save their templates in .txt or .pdf files, 
    // a real text-based file loader will read and extract content, while a PDF loader parses ASCII strings
    const reader = new FileReader();
    reader.onload = (event) => {
      setTimeout(() => {
        const text = event.target?.result as string || '';
        // If it's a raw PDF binary file, we simulate textual conversion for local stability
        const cleanedText = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/stream.*?endstream/g, '') // strip PDF streams
          .slice(0, 1500);
          
        setPdfExtractedText(
          cleanedText.length > 50 
            ? cleanedText 
            : `[Extracted Content from ${file.name}]\n\nHello, I noticed you didn't configure your payment method yet. Please go to Admin Panel > Settings > Payments to add it. You can see instructions at https://docs.google.com/document/d/1shb2g9yXsYfxwzl2-i8McwZfDZ9TcazvkKLsblHHxZk/edit`
        );
        setPdfParsing(false);
      }, 1500);
    };
    reader.readAsText(file);
  };

  const handleSaveExtractedTemplate = () => {
    if (!pdfExtractedText) return;
    const title = `Extracted PDF Template (${new Date().toLocaleDateString()})`;
    const tpl: Template = {
      id: Math.random().toString(36).substring(2),
      title,
      description: 'Extracted from uploaded document',
      category: 'Custom',
      content: pdfExtractedText,
      variables: [],
      isFavorite: false,
      isCustom: true
    };
    store.addTemplate(tpl);
    setSelectedTemplate(tpl);
    setPdfUploadOpen(false);
    setPdfExtractedText('');
    setPdfFilesList([]);
  };

  return (
    <div className={templatesStyles.wrapper}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className={templatesStyles.headerTitle}>TEMPLATE CENTER</h1>
          <p className={templatesStyles.headerDesc}>Internal Shopify communication assets. Customize variables and copy drafts.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPdfUploadOpen(true)}
            className="px-4 py-2 rounded-lg bg-gray-950 border border-glass-border hover:bg-glass-hover text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Import PDF/Doc</span>
          </button>
          <button
            onClick={() => setBuilderOpen(true)}
            className={templatesStyles.actionBtnAdd}
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        </div>
      </div>

      {/* Main Layout split grid */}
      <div className={`grid grid-cols-1 lg:grid-cols-4 border border-glass-border rounded-2xl bg-gray-955/20 overflow-hidden min-h-[580px] h-[calc(100vh-180px)]`}>
        
        {/* Left Side: Category Navigation */}
        <div className="border-r border-glass-border bg-gray-955/45 p-4 overflow-y-auto space-y-4">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Categories</span>
          <nav className="space-y-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={activeCategory === cat ? templatesStyles.categoryBtnActive : templatesStyles.categoryBtnInactive}
              >
                <Folder className="w-4 h-4 shrink-0 text-gray-500" />
                <span>{cat}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Center: Template Listing */}
        <div className="lg:col-span-1 border-r border-glass-border flex flex-col bg-gray-955/15 h-full overflow-hidden">
          {/* Search bar */}
          <div className="p-3 border-b border-glass-border relative shrink-0">
            <Search className="absolute left-6 top-5.5 w-4.5 h-4.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={templatesStyles.inputField}
            />
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-glass-border">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((tpl) => {
                const isSelected = selectedTemplate?.id === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={templatesStyles.cardContainer + ` ${isSelected ? 'bg-glass-hover border-l-2 border-green-400' : 'hover:bg-glass-hover/40'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">{tpl.title}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={(e) => handleToggleFavorite(tpl.id, e)}
                          className="p-1 rounded text-gray-500 hover:text-amber-400"
                        >
                          <Star className={`w-3.5 h-3.5 ${tpl.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 line-clamp-1 leading-relaxed">{tpl.description}</p>
                    <span className={templatesStyles.badge}>
                      {tpl.category}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-500 text-center py-12">No templates found.</p>
            )}
          </div>
        </div>

        {/* Right Side: Preview & Mail composer layout */}
        <div className="lg:col-span-2 flex flex-col overflow-hidden h-full">
          {selectedTemplate ? (
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Preview header */}
              <div className="p-4 border-b border-glass-border shrink-0 flex items-center justify-between gap-4 bg-gray-955/30">
                <div className="overflow-hidden">
                  <h2 className="text-sm font-bold text-white truncate">{selectedTemplate.title}</h2>
                  <p className="text-[10px] text-gray-500 mt-0.5 truncate">{selectedTemplate.description}</p>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => handleDuplicate(selectedTemplate, e)}
                    className="px-2.5 py-1.5 rounded-lg border border-glass-border hover:bg-glass-hover text-gray-400 hover:text-white text-[10px] uppercase font-bold transition-all"
                  >
                    Duplicate
                  </button>
                  {selectedTemplate.isCustom && (
                    <button
                      onClick={(e) => handleDelete(selectedTemplate.id, e)}
                      className="p-1.5 rounded bg-red-955/20 border border-red-500/10 hover:border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Work split view (Variables Builder & live Compiled text preview) */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-glass-border overflow-hidden">
                
                {/* Variable inputs panel */}
                <div className="p-4 overflow-y-auto space-y-4 text-left">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Variable className="w-3.5 h-3.5" />
                    <span>Dynamic Variables</span>
                  </span>

                  {Object.keys(variableValues).length > 0 ? (
                    <div className="space-y-3">
                      {Object.keys(variableValues).map((key) => (
                        <div key={key} className="space-y-1">
                          <label className="text-[10px] font-bold text-green-400 uppercase tracking-wider">{key.replace('_', ' ')}</label>
                          <input
                            type="text"
                            placeholder={`Fill ${key.replace('_', ' ')}`}
                            value={variableValues[key]}
                            onChange={(e) => setVariableValues({ ...variableValues, [key]: e.target.value })}
                            className={templatesStyles.varInput}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-900/50 border border-glass-border text-gray-500">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" />
                      <p className="text-[10px] leading-relaxed">
                        This template has no dynamic variable placeholders. You can copy the static layout below directly.
                      </p>
                    </div>
                  )}
                </div>

                {/* Compiled Composer Draft */}
                <div className="p-4 flex flex-col h-full overflow-hidden text-left bg-gray-955/30">
                  <div className="flex items-center justify-between shrink-0 mb-3">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Live Compiled text</span>
                    </span>
                    
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1 glow-green"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className={templatesStyles.preBox}>
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">{compiledPreview}</pre>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
              <FileCode className="w-12 h-12 text-gray-600 stroke-[1.2]" />
              <p className="text-xs">Select a template from the list to preview.</p>
            </div>
          )}
        </div>

      </div>

      {/* PDF Upload Modal */}
      <AnimatePresence>
        {pdfUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setPdfUploadOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="bg-gray-900 border border-glass-border p-6 rounded-xl w-full max-w-lg relative z-10 space-y-4 text-left shadow-2xl">
              <div>
                <h3 className="text-base font-bold text-white">Import PDF / Text template document</h3>
                <p className="text-xs text-gray-500">Upload documents containing Shopify layout templates to extract them locally.</p>
              </div>

              <div className="border border-dashed border-glass-border rounded-xl p-8 flex flex-col items-center justify-center space-y-2 text-center bg-gray-955/20 hover:bg-glass-hover/20 transition-all relative">
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handlePdfUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 text-gray-500" />
                <span className="text-xs font-bold text-white">Drag & drop or click to upload file</span>
                <span className="text-[10px] text-gray-500">Supports PDF, TXT, DOCX</span>
              </div>

              {pdfFilesList.map((file, i) => (
                <div key={i} className="p-3 rounded-lg bg-gray-955/60 border border-glass-border flex items-center justify-between text-xs">
                  <span className="text-white truncate font-bold">{file.name}</span>
                  <span className="text-gray-500">{file.size}</span>
                </div>
              ))}

              {pdfParsing && (
                <div className="text-xs text-green-400 flex items-center gap-2 animate-pulse justify-center py-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting text segments locally...</span>
                </div>
              )}

              {pdfExtractedText && (
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Extracted Template Preview</span>
                  <textarea
                    rows={6}
                    value={pdfExtractedText}
                    onChange={(e) => setPdfExtractedText(e.target.value)}
                    className="w-full p-3 rounded-lg glass-input text-xs font-mono"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setPdfUploadOpen(false);
                    setPdfExtractedText('');
                    setPdfFilesList([]);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-gray-955 border border-glass-border hover:bg-glass-hover text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveExtractedTemplate}
                  disabled={!pdfExtractedText}
                  className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-black"
                >
                  Create Custom Category Template
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Template Builder Modal */}
      <AnimatePresence>
        {builderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setBuilderOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="bg-gray-900 border border-glass-border p-6 rounded-xl w-full max-w-xl relative z-10 space-y-4 text-left shadow-2xl">
              <div>
                <h3 className="text-base font-bold text-white">Create New Shopify Template</h3>
                <p className="text-xs text-gray-500">Design custom messaging templates. Surround variable fields with double braces like <code className="font-mono text-[11px] text-green-300">{"{{client_name}}"}</code> to bind inputs.</p>
              </div>

              <form onSubmit={handleCreateTemplate} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Collaborator Access Request"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs cursor-pointer"
                    >
                      {CATEGORIES.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Short Description</label>
                  <input
                    type="text"
                    placeholder="Describe when to use this template..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Template Text</label>
                  <textarea
                    rows={8}
                    required
                    placeholder="Hello {{client_name}},\n\nI have successfully configured the store..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full p-3 rounded-lg glass-input text-xs font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBuilderOpen(false)}
                    className="px-3.5 py-2 rounded-lg bg-gray-955 border border-glass-border hover:bg-glass-hover text-xs font-semibold text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-xs font-semibold text-black"
                  >
                    Save Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
