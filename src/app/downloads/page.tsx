'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Trash2, 
  FileImage, 
  FileText, 
  FileJson, 
  Filter,
  Search,
  ExternalLink
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function DownloadsPage() {
  const store = useWorkspaceStore();
  const [filterType, setFilterType] = useState<'all' | 'mockup' | 'pdf' | 'image' | 'template' | 'json'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    store.hydrate();
  }, []);

  const handlePurgeDownload = (id: string, name: string) => {
    store.deleteDownload(id);
    store.logActivity('Download Entry Removed', 'download', `Removed log: ${name}`);
  };

  const filteredItems = store.downloads.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'mockup':
      case 'image':
        return <FileImage className="w-5 h-5 text-blue-400" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-400" />;
      case 'json':
      case 'template':
        return <FileJson className="w-5 h-5 text-purple-400" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">DOWNLOAD MANAGER</h1>
        <p className="text-gray-400 text-sm">Workspace download log. Redownload card mockups and configuration backups.</p>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-glass-border bg-gray-950/20">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search downloads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg glass-input text-xs"
          />
        </div>

        {/* Filter categories */}
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'mockup', 'pdf', 'image', 'template', 'json'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all border ${
                filterType === type 
                  ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                  : 'border-glass-border text-gray-400 hover:text-white hover:bg-glass-hover'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div 
              key={item.id}
              className="p-4 rounded-xl border border-glass-border bg-gray-950/40 hover:bg-glass-hover/40 transition-all flex items-start gap-4 relative group text-left"
            >
              <div className="p-2.5 bg-gray-900 rounded-lg shrink-0">
                {getFileIcon(item.type)}
              </div>
              
              <div className="overflow-hidden flex-1 space-y-1 pr-6">
                <p className="text-xs font-bold text-white truncate leading-tight" title={item.name}>{item.name}</p>
                <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
                  <span className="font-semibold text-gray-400 capitalize">{item.type}</span>
                  <span>•</span>
                  <span>{item.size}</span>
                  <span>•</span>
                  <span>{item.date}</span>
                </div>
              </div>

              {/* Action Buttons floating on card hover */}
              <div className="absolute top-3 right-3 flex items-center gap-1">
                <a 
                  href={item.url} 
                  download={item.name}
                  className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button 
                  onClick={() => handlePurgeDownload(item.id, item.name)}
                  className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-white/5 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center border border-dashed border-glass-border rounded-2xl text-gray-500 text-xs">
            No downloaded files match your search criteria. Open mockup cards studio to export images.
          </div>
        )}
      </div>

      {/* Storage info note */}
      <div className="p-4 rounded-xl border border-glass-border bg-gray-950/20 text-xs text-gray-500 leading-relaxed max-w-xl">
        <span className="font-bold text-gray-400 block mb-1">LOCAL DISK CACHE STORAGE:</span>
        All file lists are managed in local memory registry hooks. Exported assets are stored directly inside your download directory or as URL blobs under local browser session memory caches.
      </div>
    </div>
  );
}
