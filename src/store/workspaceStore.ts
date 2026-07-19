import { create } from 'zustand';
import { 
  Template, 
  DeveloperNote, 
  ChatSession, 
  RecentActivity, 
  StickyNote, 
  DownloadItem, 
  MemberProfile 
} from '@/types';
import { StoreCredential } from '@/templates/storeCredentials';
import { auth } from '@/lib/firebase';

interface WorkspaceState {
  templates: Template[];
  notes: DeveloperNote[];
  chatSessions: ChatSession[];
  recentActivities: RecentActivity[];
  stickyNotes: StickyNote[];
  downloads: DownloadItem[];
  credentials: StoreCredential[];
  memberProfile: MemberProfile;
  settings: { enabledMenus: string[], adminEnabledMenus?: string[], userEnabledMenus?: string[], trackerLayout?: string, homeLayout?: string, workspaceLayout?: string, messageHelperLayout?: string, templatesLayout?: string, fontFamily?: string, borderRadius?: string, globalLayout?: string, global3DStyle?: string, allowCommandersDock?: boolean, systemBanner?: string };
  isHydrated: boolean;
  pendingModal: { isOpen: boolean; message: string };

  hydrate: (uid?: string) => Promise<void>;
  showPendingModal: (message?: string) => void;
  closePendingModal: () => void;
  
  // Actions
  addTemplate: (template: Template) => Promise<void>;
  updateTemplate: (template: Template) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  toggleFavoriteTemplate: (id: string) => Promise<void>;
  
  addNote: (note: DeveloperNote) => Promise<void>;
  updateNote: (id: string, updates: Partial<DeveloperNote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  addChatSession: (session: ChatSession) => Promise<void>;
  updateChatSession: (id: string, updates: Partial<ChatSession>) => Promise<void>;
  deleteChatSession: (id: string) => Promise<void>;
  addChatMessage: (sessionId: string, message: { role: 'user' | 'assistant', content: string }) => Promise<void>;
  
  addStickyNote: (content: string, color: StickyNote['color']) => Promise<void>;
  updateStickyNote: (id: string, content: string) => Promise<void>;
  deleteStickyNote: (id: string) => Promise<void>;
  
  addDownload: (download: Omit<DownloadItem, 'id' | 'date'>) => Promise<void>;
  deleteDownload: (id: string) => Promise<void>;
  
  addCredential: (credential: StoreCredential) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;

  updateProfile: (updates: Partial<MemberProfile>) => Promise<void>;
  logActivity: (title: string, type: RecentActivity['type'], details: string) => Promise<void>;
  updateSettings: (settings: { enabledMenus?: string[], adminEnabledMenus?: string[], userEnabledMenus?: string[], trackerLayout?: string, homeLayout?: string, workspaceLayout?: string, messageHelperLayout?: string, templatesLayout?: string, fontFamily?: string, borderRadius?: string, globalLayout?: string, global3DStyle?: string, allowCommandersDock?: boolean, systemBanner?: string }) => Promise<void>;
  exportBackup: () => string;
  importBackup: (dataStr: string) => boolean;
}

const defaultProfile: MemberProfile = {
  name: 'Code Commandos Team',
  role: 'Developer',
  photo: '',
  skills: ['Shopify Liquid', 'React', 'Tailwind CSS'],
  projectsCount: 0,
  achievementsCount: 0,
  downloadsCount: 0,
  templateUsageCount: 0
};

// Helper function to send requests to API
async function pushToDatabase(action: 'create' | 'update' | 'delete', collectionName: string, data: any, documentId?: string) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    useWorkspaceStore.getState().showPendingModal("You must be logged in to make changes.");
    return false;
  }

  try {
    const res = await fetch('/api/pending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firebaseUid: currentUser.uid,
        email: currentUser.email,
        action,
        collectionName,
        documentId,
        data
      })
    });
    
    const result = await res.json();
    if (!res.ok) {
      console.error(result.error);
      return false;
    }

    if (result.message === 'Pending approval') {
      useWorkspaceStore.getState().showPendingModal();
      return false; // Don't update local UI yet
    }
    
    return true; // Was directly applied by Admin
  } catch (error) {
    console.error("Error pushing to DB", error);
    return false;
  }
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  templates: [],
  notes: [],
  chatSessions: [],
  recentActivities: [],
  stickyNotes: [],
  downloads: [],
  credentials: [],
  memberProfile: defaultProfile,
  settings: { 
    enabledMenus: ['Home', 'Workspace', 'Order Tracker', 'Personal Projects', 'Message Helper', 'Templates', 'Schema Builder', 'Audit Suite', 'Projects', 'Mockup Studio', 'AI Assistant', 'Team Notes', 'Downloads', 'Member Profile', 'Settings'], 
    adminEnabledMenus: ['Home', 'Workspace', 'Order Tracker', 'Personal Projects', 'Message Helper', 'Templates', 'Schema Builder', 'Audit Suite', 'Projects', 'Mockup Studio', 'AI Assistant', 'Team Notes', 'Downloads', 'Member Profile', 'Settings'], 
    userEnabledMenus: ['Home', 'Workspace', 'Order Tracker', 'Personal Projects', 'Message Helper', 'Templates', 'Schema Builder', 'Audit Suite', 'Projects', 'AI Assistant', 'Team Notes', 'Downloads', 'Member Profile', 'Settings'] 
  },
  isHydrated: false,
  pendingModal: { isOpen: false, message: '' },

  showPendingModal: (message?: string) => set({ 
    pendingModal: { 
      isOpen: true, 
      message: message || "Your request has been successfully submitted to the administrator (Refayet). Once approved from the Admin Panel, the changes will be reflected on the website."
    } 
  }),
  
  closePendingModal: () => set({ pendingModal: { isOpen: false, message: '' } }),

  hydrate: async (uid?: string) => {
    try {
      const currentUid = uid || auth.currentUser?.uid;
      const url = currentUid ? `/api/data?uid=${currentUid}` : '/api/data';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        set({
          templates: (data.data.templates || []).map((t: any) => {
            let favs: string[] = [];
            try { favs = JSON.parse(localStorage.getItem('cc_favorite_templates') || '[]'); } catch(e) {}
            return { ...t, isFavorite: favs.includes(t.id) ? true : t.isFavorite };
          }),
          notes: data.data.notes || [],
          chatSessions: data.data.chatSessions || [],
          stickyNotes: data.data.stickyNotes || [],
          downloads: (() => {
            try { return JSON.parse(localStorage.getItem('cc_downloads_history') || '[]'); }
            catch(e) { return []; }
          })(),
          credentials: data.data.credentials || [],
          recentActivities: data.data.recentActivities || [],
          settings: data.data.settings || { enabledMenus: ['Home', 'Workspace', 'Order Tracker', 'Personal Projects', 'Message Helper', 'Templates', 'Schema Builder', 'Audit Suite', 'Projects', 'Mockup Studio', 'AI Assistant', 'Team Notes', 'Downloads', 'Member Profile', 'Settings'], trackerLayout: 'default', homeLayout: 'default', workspaceLayout: 'default', messageHelperLayout: 'default', templatesLayout: 'default', fontFamily: 'sans', borderRadius: 'xl', globalLayout: 'default', global3DStyle: 'default' },
          isHydrated: true
        });
      }
    } catch (error) {
      console.error("Failed to load DB data", error);
    }
  },

  addTemplate: async (template) => {
    const applied = await pushToDatabase('create', 'templates', template);
    if (applied) {
      set((state) => ({ templates: [template, ...state.templates] }));
      get().logActivity('Custom Template Created', 'template', `Created: ${template.title}`);
    }
  },

  updateTemplate: async (template) => {
    const applied = await pushToDatabase('update', 'templates', template, template.id);
    if (applied) {
      set((state) => ({
        templates: state.templates.map((t) => (t.id === template.id ? template : t))
      }));
    }
  },

  deleteTemplate: async (id) => {
    const applied = await pushToDatabase('delete', 'templates', {}, id);
    if (applied) {
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id)
      }));
    }
  },

  toggleFavoriteTemplate: async (id) => {
    const template = get().templates.find((t) => t.id === id);
    if (!template) return;
    const updated = { ...template, isFavorite: !template.isFavorite };
    
    set((state) => ({
      templates: state.templates.map((t) => t.id === id ? updated : t)
    }));

    let favs: string[] = [];
    try { favs = JSON.parse(localStorage.getItem('cc_favorite_templates') || '[]'); } catch(e) {}
    if (updated.isFavorite && !favs.includes(id)) favs.push(id);
    else if (!updated.isFavorite) favs = favs.filter(f => f !== id);
    localStorage.setItem('cc_favorite_templates', JSON.stringify(favs));
  },

  addNote: async (note) => {
    const applied = await pushToDatabase('create', 'notes', note);
    if (applied) {
      set((state) => ({ notes: [note, ...state.notes] }));
    }
  },

  updateNote: async (id, updates) => {
    const note = get().notes.find(n => n.id === id);
    if (!note) return;
    const updated = { ...note, ...updates, updatedAt: new Date().toISOString() };
    const applied = await pushToDatabase('update', 'notes', updated, id);
    if (applied) {
      set((state) => ({
        notes: state.notes.map((n) => n.id === id ? updated : n)
      }));
    }
  },

  deleteNote: async (id) => {
    const applied = await pushToDatabase('delete', 'notes', {}, id);
    if (applied) {
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id)
      }));
    }
  },

  addChatSession: async (session) => {
    const sessionWithUid = auth.currentUser ? { ...session, firebaseUid: auth.currentUser.uid } : session;
    const applied = await pushToDatabase('create', 'chatSessions', sessionWithUid);
    if (applied) {
      set((state) => ({ chatSessions: [sessionWithUid, ...state.chatSessions] }));
    }
  },

  updateChatSession: async (id, updates) => {
    const session = get().chatSessions.find(s => s.id === id);
    if (!session) return;
    const updated = { ...session, ...updates, updatedAt: new Date().toISOString() };
    const applied = await pushToDatabase('update', 'chatSessions', updated, id);
    if (applied) {
      set((state) => ({
        chatSessions: state.chatSessions.map((s) => s.id === id ? updated : s)
      }));
    }
  },

  deleteChatSession: async (id) => {
    const applied = await pushToDatabase('delete', 'chatSessions', {}, id);
    if (applied) {
      set((state) => ({
        chatSessions: state.chatSessions.filter((s) => s.id !== id)
      }));
    }
  },

  addChatMessage: async (sessionId, message) => {
    const session = get().chatSessions.find(s => s.id === sessionId);
    if (!session) return;
    const newMsg = {
      ...message,
      id: Math.random().toString(36).substring(2),
      timestamp: new Date().toISOString()
    };
    const updated = { ...session, messages: [...session.messages, newMsg], updatedAt: new Date().toISOString() };
    const applied = await pushToDatabase('update', 'chatSessions', updated, sessionId);
    if (applied) {
      set((state) => ({
        chatSessions: state.chatSessions.map((s) => s.id === sessionId ? updated : s)
      }));
    }
  },

  addStickyNote: async (content, color) => {
    const newSticky = {
      id: Math.random().toString(36).substring(2),
      content,
      color,
      updatedAt: new Date().toISOString()
    };
    const applied = await pushToDatabase('create', 'stickyNotes', newSticky);
    if (applied) {
      set((state) => ({ stickyNotes: [newSticky, ...state.stickyNotes] }));
    }
  },

  updateStickyNote: async (id, content) => {
    const sticky = get().stickyNotes.find(s => s.id === id);
    if (!sticky) return;
    const updated = { ...sticky, content, updatedAt: new Date().toISOString() };
    const applied = await pushToDatabase('update', 'stickyNotes', updated, id);
    if (applied) {
      set((state) => ({
        stickyNotes: state.stickyNotes.map((s) => s.id === id ? updated : s)
      }));
    }
  },

  deleteStickyNote: async (id) => {
    const applied = await pushToDatabase('delete', 'stickyNotes', {}, id);
    if (applied) {
      set((state) => ({
        stickyNotes: state.stickyNotes.filter((s) => s.id !== id)
      }));
    }
  },

  addDownload: async (download) => {
    const newItem = {
      ...download,
      id: Math.random().toString(36).substring(2),
      date: new Date().toLocaleDateString()
    };
    set((state) => {
      const newDownloads = [newItem, ...state.downloads];
      localStorage.setItem('cc_downloads_history', JSON.stringify(newDownloads));
      return { downloads: newDownloads };
    });
  },

  deleteDownload: async (id) => {
    set((state) => {
      const newDownloads = state.downloads.filter((d) => d.id !== id);
      localStorage.setItem('cc_downloads_history', JSON.stringify(newDownloads));
      return { downloads: newDownloads };
    });
  },

  addCredential: async (credential) => {
    const applied = await pushToDatabase('create', 'credentials', credential);
    if (applied) {
      set((state) => ({ credentials: [credential, ...state.credentials] }));
      get().logActivity('Credential Created', 'note', `Added credentials for: ${credential.link}`);
    }
  },

  deleteCredential: async (id) => {
    const applied = await pushToDatabase('delete', 'credentials', {}, id);
    if (applied) {
      set((state) => ({
        credentials: state.credentials.filter((c) => c.id !== id)
      }));
    }
  },

  updateProfile: async (updates) => {
    set((state) => ({
      memberProfile: { ...state.memberProfile, ...updates }
    }));
  },

  logActivity: async (title, type, details) => {
    const newAct = {
      id: Math.random().toString(36).substring(2),
      title,
      type,
      timestamp: new Date().toISOString(),
      details
    };
    const applied = await pushToDatabase('create', 'activities', newAct);
    if (applied) {
      set((state) => ({
        recentActivities: [newAct, ...state.recentActivities.slice(0, 49)]
      }));
    }
  },

  updateSettings: async (settings) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: currentUser.uid, ...settings })
      });
      const data = await res.json();
      if (data.success) {
        set({ settings: data.settings });
      }
    } catch (error) {
      console.error('Error updating settings', error);
    }
  },

  exportBackup: () => {
    const state = get();
    const backup = {
      templates: state.templates,
      notes: state.notes,
      chatSessions: state.chatSessions,
      stickyNotes: state.stickyNotes,
      downloads: state.downloads,
      credentials: state.credentials,
      memberProfile: state.memberProfile
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackup: (dataStr: string) => {
    try {
      const data = JSON.parse(dataStr);
      if (data.templates) set({ templates: data.templates });
      if (data.notes) set({ notes: data.notes });
      if (data.chatSessions) set({ chatSessions: data.chatSessions });
      if (data.stickyNotes) set({ stickyNotes: data.stickyNotes });
      if (data.downloads) set({ downloads: data.downloads });
      if (data.credentials) set({ credentials: data.credentials });
      if (data.memberProfile) set({ memberProfile: data.memberProfile });
      return true;
    } catch (e) {
      return false;
    }
  }
}));
