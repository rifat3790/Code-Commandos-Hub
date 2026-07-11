import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  id: string;
  enabledMenus: string[]; // Legacy/fallback
  adminEnabledMenus: string[];
  userEnabledMenus: string[];
  trackerLayout: string;
  homeLayout: string;
  workspaceLayout: string;
  messageHelperLayout: string;
  templatesLayout: string;
  fontFamily: string;
  borderRadius: string;
}

const SettingsSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  enabledMenus: { type: [String], default: [] },
  adminEnabledMenus: { type: [String], default: [] },
  userEnabledMenus: { type: [String], default: [] },
  trackerLayout: { type: String, default: 'default' },
  homeLayout: { type: String, default: 'default' },
  workspaceLayout: { type: String, default: 'default' },
  messageHelperLayout: { type: String, default: 'default' },
  templatesLayout: { type: String, default: 'default' },
  fontFamily: { type: String, default: 'sans' },
  borderRadius: { type: String, default: 'xl' }
});

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
