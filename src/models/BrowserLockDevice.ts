import mongoose, { Schema, Document } from 'mongoose';

export interface IBrowserLockDevice extends Document {
  deviceId: string;
  deviceName: string;
  password: string; // Plain/decryptable or master pin so admin can view and reset
  isLocked: boolean;
  ipAddress: string;
  userAgent?: string;
  lastSeen: Date;
  status: 'online' | 'offline';
  failedAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const BrowserLockDeviceSchema: Schema = new Schema(
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    deviceName: { type: String, required: true, default: 'Default Browser' },
    password: { type: String, required: true, default: '1234' },
    isLocked: { type: Boolean, default: false },
    ipAddress: { type: String, default: 'Unknown' },
    userAgent: { type: String, default: '' },
    lastSeen: { type: Date, default: Date.now },
    status: { type: String, enum: ['online', 'offline'], default: 'offline' },
    failedAttempts: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.models.BrowserLockDevice ||
  mongoose.model<IBrowserLockDevice>('BrowserLockDevice', BrowserLockDeviceSchema);
