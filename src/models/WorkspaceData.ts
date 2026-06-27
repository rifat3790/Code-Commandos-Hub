import mongoose, { Schema } from 'mongoose';

// 1. Template
const TemplateSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  code: { type: String },
  isCustom: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 2. DeveloperNote
const NoteSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String },
  type: { type: String, enum: ['notes', 'todo', 'code'] },
  listItems: [{
    id: String,
    text: String,
    completed: Boolean
  }],
  updatedAt: { type: Date, default: Date.now }
});

// 3. ChatSession
const ChatSessionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  messages: [{
    id: String,
    role: { type: String, enum: ['user', 'assistant'] },
    content: String,
    timestamp: String
  }],
  updatedAt: { type: Date, default: Date.now }
});

// 4. StickyNote
const StickyNoteSchema = new Schema({
  id: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  color: { type: String, enum: ['yellow', 'blue', 'pink', 'green'] },
  updatedAt: { type: Date, default: Date.now }
});

// 5. DownloadItem
const DownloadItemSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  size: { type: String },
  url: { type: String, required: true },
  date: { type: String },
  category: { type: String, enum: ['theme', 'plugin', 'script', 'asset'] }
});

// 6. RecentActivity
const ActivitySchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['note', 'template', 'chat', 'upload', 'download'] },
  timestamp: { type: String },
  details: { type: String }
});

// 7. StoreCredential
const StoreCredentialSchema = new Schema({
  id: { type: String, required: true, unique: true },
  link: { type: String, required: true },
  password: { type: String },
  category: { type: String },
  specialNote: { type: String },
  profileName: { type: String },
  clientName: { type: String }
});

export const TemplateModel = mongoose.models.Template || mongoose.model('Template', TemplateSchema);
export const NoteModel = mongoose.models.Note || mongoose.model('Note', NoteSchema);
export const ChatSessionModel = mongoose.models.ChatSession || mongoose.model('ChatSession', ChatSessionSchema);
export const StickyNoteModel = mongoose.models.StickyNote || mongoose.model('StickyNote', StickyNoteSchema);
export const DownloadModel = mongoose.models.Download || mongoose.model('Download', DownloadItemSchema);
export const ActivityModel = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
export const CredentialModel = mongoose.models.Credential || mongoose.model('Credential', StoreCredentialSchema);
