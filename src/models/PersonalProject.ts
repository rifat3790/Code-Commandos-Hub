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
  status?: 'running' | 'delivered';
  progress?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  notes?: string;
  deliveredAt?: Date;
  orderId?: string;
  originalOrderValue?: string;
  personCount?: number;
  isSyncedWithTracker?: boolean;
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
  status: { type: String, enum: ['running', 'delivered'], default: 'delivered' },
  progress: { type: Number, default: 100 },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  deadline: { type: String, default: '' },
  notes: { type: String, default: '' },
  deliveredAt: { type: Date },
  orderId: { type: String, default: '' },
  originalOrderValue: { type: String, default: '' },
  personCount: { type: Number, default: 1 },
  isSyncedWithTracker: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.PersonalProject || mongoose.model<IPersonalProject>('PersonalProject', PersonalProjectSchema);
