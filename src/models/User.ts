import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  name?: string;
  teamName?: string;
  phoneNumber?: string;
  photoURL?: string;
  skills?: string[];
  role: 'super_admin' | 'admin' | 'user' | 'banned';
  trackerFilters?: any;
  lastLoginAt?: Date;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String },
  teamName: { type: String },
  phoneNumber: { type: String },
  photoURL: { type: String },
  skills: { type: [String], default: [] },
  role: { type: String, enum: ['super_admin', 'admin', 'user', 'banned'], default: 'user' },
  trackerFilters: { type: Object },
  lastLoginAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
