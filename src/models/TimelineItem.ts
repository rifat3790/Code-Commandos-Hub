import mongoose, { Schema, Document } from 'mongoose';

export interface ITimelineItem extends Document {
  clientName: string;
  memberName: string;
  projectTitle: string;
  orderId?: string;
  targetEndDate: Date;
  status: 'running' | 'delivered';
  deliveredAt?: Date;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineItemSchema: Schema = new Schema({
  clientName: { type: String, required: true, trim: true },
  memberName: { type: String, required: true, trim: true },
  projectTitle: { type: String, required: true, trim: true },
  orderId: { type: String, default: '', trim: true },
  targetEndDate: { type: Date, required: true },
  status: { type: String, enum: ['running', 'delivered'], default: 'running' },
  deliveredAt: { type: Date },
  notes: { type: String, default: '' },
  createdBy: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.TimelineItem || mongoose.model<ITimelineItem>('TimelineItem', TimelineItemSchema);
