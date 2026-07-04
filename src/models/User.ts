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
  callingAllowed?: boolean;
  trackerFilters?: any;
  issuesFilters?: any;
  calculatorSettings?: {
    platformFeePercent: number;
    withdrawalFeePercent: number;
    conversionRate: number;
    currencySymbol: string;
  };
  themeColor?: string;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
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
  callingAllowed: { type: Boolean, default: true },
  trackerFilters: { type: Object },
  issuesFilters: { type: Object },
  calculatorSettings: {
    platformFeePercent: { type: Number },
    withdrawalFeePercent: { type: Number },
    conversionRate: { type: Number },
    currencySymbol: { type: String }
  },
  themeColor: { type: String, default: '#00C950' },
  lastLoginAt: { type: Date },
  lastActiveAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
