import mongoose, { Schema, Document } from 'mongoose';

export interface IPersonalProject extends Document {
  firebaseUid: string;
  month: string;
  projectName: string;
  value: string;
  profileName: string;
  clientName: string;
  storeUrl: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PersonalProjectSchema: Schema = new Schema({
  firebaseUid: { type: String, required: true },
  month: { type: String, required: true },
  projectName: { type: String, required: true },
  value: { type: String, required: true },
  profileName: { type: String, required: true },
  clientName: { type: String, required: true },
  storeUrl: { type: String, required: true },
  password: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.PersonalProject || mongoose.model<IPersonalProject>('PersonalProject', PersonalProjectSchema);
