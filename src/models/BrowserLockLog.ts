import mongoose, { Schema, Document } from 'mongoose';

export interface IBrowserLockLog extends Document {
  deviceId: string;
  deviceName: string;
  eventType: 'remote_lock' | 'remote_unlock' | 'local_unlock' | 'failed_unlock' | 'password_reset' | 'device_registered';
  performedBy: string;
  ipAddress: string;
  details: string;
  createdAt: Date;
}

const BrowserLockLogSchema: Schema = new Schema(
  {
    deviceId: { type: String, required: true, index: true },
    deviceName: { type: String, required: true },
    eventType: {
      type: String,
      enum: ['remote_lock', 'remote_unlock', 'local_unlock', 'failed_unlock', 'password_reset', 'device_registered'],
      required: true
    },
    performedBy: { type: String, default: 'System' },
    ipAddress: { type: String, default: 'Unknown' },
    details: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

export default mongoose.models.BrowserLockLog ||
  mongoose.model<IBrowserLockLog>('BrowserLockLog', BrowserLockLogSchema);
