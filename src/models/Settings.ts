import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  id: string;
  enabledMenus: string[]; // Legacy/fallback
  adminEnabledMenus: string[];
  userEnabledMenus: string[];
}

const SettingsSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  enabledMenus: { type: [String], default: [] },
  adminEnabledMenus: { type: [String], default: [] },
  userEnabledMenus: { type: [String], default: [] }
});

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
