export interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  variables: string[];
  isFavorite: boolean;
  isCustom: boolean;
  folderId?: string;
}

export type NoteType = 'notes' | 'checklist' | 'ideas' | 'meeting' | 'todo';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DeveloperNote {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  listItems?: ChecklistItem[];
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  category: string;
  messages: ChatMessage[];
  isPinned: boolean;
  folderId?: string;
  updatedAt: string;
}

export interface RecentActivity {
  id: string;
  title: string;
  type: 'mockup' | 'template' | 'chat' | 'download' | 'note';
  timestamp: string;
  details: string;
}

export interface StickyNote {
  id: string;
  content: string;
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'gray';
  updatedAt: string;
}

export interface DownloadItem {
  id: string;
  name: string;
  type: 'mockup' | 'pdf' | 'image' | 'template' | 'json';
  url: string; // Object URL or file path reference
  size: string;
  date: string;
}

export interface MemberProfile {
  name: string;
  role: string;
  photo: string; // base64 or placeholder
  skills: string[];
  projectsCount: number;
  achievementsCount: number;
  downloadsCount: number;
  templateUsageCount: number;
}

export type MockupStyle =
  | 'classic'
  | 'elite'
  | 'minimal'
  | 'luxury'
  | 'green-award'
  | 'blue-tech'
  | 'dark-premium'
  | 'soft-gradient'
  | 'celebration'
  | 'glass';

export interface MockupData {
  id: string;
  style: MockupStyle;
  memberName: string;
  role: string;
  memberPhoto?: string; // base64 or URL
  reviewScreenshot?: string; // base64 or URL
  orderScreenshot?: string; // base64 or URL
  tipScreenshot?: string; // base64 or URL
  tipAmount?: string;
  clientName?: string;
  orderId?: string;
  projectName?: string;
  website?: string;
  category?: string;
  featureList: string[];
  completionDate: string;
  profileLink?: string;
  customMessage?: string;
  sticker?: string; // star, gold-badge, verified, thumbs-up
  themeColor: string; // custom hex color override
  specialBlocks: {
    congratulations: boolean;
    keepAchieving: boolean;
    starReview: boolean;
    tipsEarned: boolean;
    topPerformance: boolean;
    projectCompleted: boolean;
    badge: boolean;
  };
}
