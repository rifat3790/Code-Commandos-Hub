import mongoose, { Schema, Document } from 'mongoose';

export interface ITimelineItem extends Document {
  clientName: string;
  memberName: string;
  projectTitle?: string;
  orderId?: string;
  targetEndDate: Date;
  status: 'running' | 'delivered';
  deliveredAt?: Date;
  notes?: string;
  notified72h?: boolean;
  notified48h?: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineItemSchema: Schema = new Schema({
  clientName: { type: String, required: true, trim: true },
  memberName: { type: String, required: true, trim: true },
  projectTitle: { type: String, default: '', trim: true },
  orderId: { type: String, default: '', trim: true },
  targetEndDate: { type: Date, required: true },
  status: { type: String, enum: ['running', 'delivered'], default: 'running' },
  deliveredAt: { type: Date },
  notes: { type: String, default: '' },
  notified72h: { type: Boolean, default: false },
  notified48h: { type: Boolean, default: false },
  createdBy: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.TimelineItem || mongoose.model<ITimelineItem>('TimelineItem', TimelineItemSchema);
