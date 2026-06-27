'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  CheckSquare, 
  FileText, 
  Lightbulb, 
  Users, 
  ListTodo, 
  Save, 
  Edit2, 
  Check, 
  PlusCircle, 
  FolderPlus
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { DeveloperNote, NoteType, ChecklistItem } from '@/types';

const NOTE_CATEGORIES: { value: NoteType | 'all'; label: string; icon: any }[] = [
  { value: 'all', label: 'All notes', icon: FileText },
  { value: 'notes', label: 'General notes', icon: FileText },
  { value: 'checklist', label: 'Checklists', icon: CheckSquare },
  { value: 'ideas', label: 'Ideas Board', icon: Lightbulb },
  { value: 'meeting', label: 'Meeting Notes', icon: Users },
  { value: 'todo', label: 'Todo Lists', icon: ListTodo }
];

export default function NotesPage() {
  const store = useWorkspaceStore();
  const [activeCategory, setActiveCategory] = useState<NoteType | 'all'>('all');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  
  // Note Form Editor States
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  
  // Checklist item States
  const [newCheckItemText, setNewCheckItemText] = useState('');

  // Builder Modal States
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteType, setNewNoteType] = useState<NoteType>('notes');

  useEffect(() => {
    store.hydrate();
  }, []);

  // Set first note as default active
  useEffect(() => {
    if (store.notes.length > 0 && !selectedNoteId) {
      setSelectedNoteId(store.notes[0].id);
    }
  }, [store.notes, selectedNoteId]);

  const activeNote = useMemo(() => {
    return store.notes.find(n => n.id === selectedNoteId) || null;
  }, [selectedNoteId, store.notes]);

  // Sync editor fields on note swap
  useEffect(() => {
    if (activeNote) {
      setEditTitle(activeNote.title);
      setEditContent(activeNote.content);
    }
  }, [activeNote]);

  const filteredNotes = useMemo(() => {
    return store.notes.filter(n => activeCategory === 'all' || n.type === activeCategory);
  }, [store.notes, activeCategory]);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    const newNote: DeveloperNote = {
      id: Math.random().toString(36).substring(2),
      title: newNoteTitle,
      content: newNoteType === 'checklist' || newNoteType === 'todo' ? '' : 'Type note content here...',
      type: newNoteType,
      listItems: newNoteType === 'checklist' || newNoteType === 'todo' ? [] : undefined,
      updatedAt: new Date().toISOString()
    };

    store.addNote(newNote);
    setSelectedNoteId(newNote.id);
    setNewNoteTitle('');
    setNoteModalOpen(false);
  };

  const handleUpdateTextNote = () => {
    if (!selectedNoteId) return;
    store.updateNote(selectedNoteId, {
      title: editTitle,
      content: editContent
    });
    store.logActivity('Note Text Updated', 'note', `Updated note: ${editTitle}`);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    store.deleteNote(id);
    if (selectedNoteId === id) {
      setSelectedNoteId(store.notes[0]?.id || '');
    }
  };

  // CHECKLIST BUILDER LOGIC
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckItemText.trim() || !activeNote) return;

    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substring(2),
      text: newCheckItemText.trim(),
      completed: false
    };

    const updatedList = [...(activeNote.listItems || []), newItem];
    store.updateNote(activeNote.id, { listItems: updatedList });
    setNewCheckItemText('');
  };

  const handleToggleChecklistItem = (itemId: string) => {
    if (!activeNote) return;
    const updatedList = (activeNote.listItems || []).map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    store.updateNote(activeNote.id, { listItems: updatedList });
  };

  const handleRemoveChecklistItem = (itemId: string) => {
    if (!activeNote) return;
    const updatedList = (activeNote.listItems || []).filter(item => item.id !== itemId);
    store.updateNote(activeNote.id, { listItems: updatedList });
  };

  const getNoteIcon = (type: NoteType) => {
    const iconStyle = NOTE_CATEGORIES.find(c => c.value === type);
    if (iconStyle) {
      const IconComp = iconStyle.icon;
      return <IconComp className="w-4 h-4 text-green-400 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-gray-400 shrink-0" />;
  };

  return (
    <div className="h-full flex flex-col space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">DEVELOPER NOTES</h1>
          <p className="text-gray-400 text-sm">Offline notepad system. Track client meeting requirements, Liquid coding ideas and tasks checklists.</p>
        </div>
        
        <button
          onClick={() => setNoteModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1 glow-green shrink-0 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Note/Board</span>
        </button>
      </div>

      {/* Workspace notes layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 border border-glass-border rounded-2xl bg-gray-950/20 overflow-hidden min-h-[580px] h-[calc(100vh-180px)]">
        
        {/* Left Side: Note Type filters */}
        <div className="border-r border-glass-border bg-gray-950/45 p-4 overflow-y-auto space-y-4">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block text-left">Folders</span>
          <nav className="space-y-1">
            {NOTE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                  activeCategory === cat.value 
                    ? 'text-green-400 bg-green-500/10 border border-green-500/15' 
                    : 'text-gray-400 hover:text-white hover:bg-glass-hover'
                }`}
              >
                <cat.icon className="w-4 h-4 shrink-0 text-gray-500" />
                <span>{cat.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Center: Notes Listing */}
        <div className="lg:col-span-1 border-r border-glass-border flex flex-col bg-gray-950/15 h-full overflow-hidden">
          <div className="p-3.5 border-b border-glass-border shrink-0 text-left">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Note List</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-glass-border">
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => {
                const isSelected = selectedNoteId === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`p-3.5 cursor-pointer transition-colors text-left relative flex items-center justify-between gap-3 ${
                      isSelected ? 'bg-glass-hover border-l-2 border-green-400' : 'hover:bg-glass-hover/45'
                    }`}
                  >
                    <div className="overflow-hidden flex items-center gap-2">
                      {getNoteIcon(note.type)}
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{note.title}</p>
                        <span className="text-[9px] text-gray-500">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="p-1 rounded text-gray-500 hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-500 text-center py-12">No notes in this folder.</p>
            )}
          </div>
        </div>

        {/* Right Side: Note Content Editor canvas */}
        <div className="lg:col-span-2 flex flex-col h-full overflow-hidden bg-gray-950/30">
          {activeNote ? (
            <div className="flex flex-col h-full overflow-hidden p-6 text-left space-y-4">
              
              {/* Note Header Title Editor */}
              <div className="flex items-center gap-3 shrink-0">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleUpdateTextNote}
                  className="bg-transparent border-0 border-b border-transparent hover:border-white/10 focus:border-green-500 font-extrabold text-lg text-white w-full py-1 focus:outline-none transition-all"
                  placeholder="Untitled note"
                />
              </div>

              {/* EDITOR SWITCH: Text Notes vs Checklists */}
              {activeNote.type !== 'checklist' && activeNote.type !== 'todo' ? (
                // 1. Text Area Editor
                <div className="flex-1 flex flex-col overflow-hidden relative">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleUpdateTextNote}
                    placeholder="Start typing your Shopify layout parameters or meeting guidelines here..."
                    className="flex-1 w-full bg-transparent text-sm leading-relaxed text-gray-300 resize-none focus:outline-none py-2 font-medium"
                  />
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <button
                      onClick={handleUpdateTextNote}
                      className="px-3.5 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 glow-green"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              ) : (
                // 2. Checklist Todo Board Editor
                <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                  {/* Task Addition Form */}
                  <form onSubmit={handleAddChecklistItem} className="flex gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder="Add task bullet..."
                      value={newCheckItemText}
                      onChange={(e) => setNewCheckItemText(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg glass-input text-xs"
                    />
                    <button type="submit" className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <PlusCircle className="w-4 h-4" />
                      <span>Add Item</span>
                    </button>
                  </form>

                  {/* Tasks List */}
                  <div className="flex-1 overflow-y-auto space-y-2 max-h-[360px] pr-1">
                    {activeNote.listItems && activeNote.listItems.length > 0 ? (
                      activeNote.listItems.map((item) => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-gray-950/40 border border-glass-border text-xs"
                        >
                          <button
                            onClick={() => handleToggleChecklistItem(item.id)}
                            className="flex items-center gap-3 text-left w-full mr-4"
                          >
                            <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all ${
                              item.completed ? 'bg-green-500 border-green-500 text-black' : 'border-glass-border bg-gray-900 text-transparent'
                            }`}>
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </div>
                            <span className={`font-semibold ${item.completed ? 'line-through text-gray-500 font-medium' : 'text-gray-300'}`}>
                              {item.text}
                            </span>
                          </button>
                          
                          <button
                            onClick={() => handleRemoveChecklistItem(item.id)}
                            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-white/5 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-12">Checklist board is empty. Add tasks using the box above.</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
              <FileText className="w-12 h-12 text-gray-600 stroke-[1.2]" />
              <p className="text-xs">Create or select a note from the panel to edit.</p>
            </div>
          )}
        </div>

      </div>

      {/* Create Note / Checklist Builder Modal */}
      <AnimatePresence>
        {noteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setNoteModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="bg-gray-900 border border-glass-border p-6 rounded-xl w-full max-w-md relative z-10 space-y-4 text-left shadow-2xl">
              <div>
                <h3 className="text-base font-bold text-white">Create Note or Todo Board</h3>
                <p className="text-xs text-gray-500">Initialize a new document container in local cache.</p>
              </div>

              <form onSubmit={handleCreateNote} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Document Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Liquid schema layouts config"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Container Type</label>
                  <select
                    value={newNoteType}
                    onChange={(e) => setNewNoteType(e.target.value as NoteType)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs cursor-pointer"
                  >
                    <option value="notes">Written Notes</option>
                    <option value="checklist">Checklist Board</option>
                    <option value="ideas">Ideas Board</option>
                    <option value="meeting">Meetings log</option>
                    <option value="todo">Todo Lists</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setNoteModalOpen(false)}
                    className="px-3.5 py-2 rounded-lg bg-gray-950 border border-glass-border hover:bg-glass-hover text-xs font-semibold text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-xs font-semibold text-black"
                  >
                    Create Note
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
