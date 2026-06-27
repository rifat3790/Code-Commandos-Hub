import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  id: string;
  enabledMenus: string[];
}

const SettingsSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  enabledMenus: { type: [String], default: [] }
});

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
