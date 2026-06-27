import mongoose, { Schema, Document } from 'mongoose';

export interface IPendingChange extends Document {
  authorUid: string;
  authorEmail: string;
  action: 'create' | 'update' | 'delete';
  collectionName: 'templates' | 'notes' | 'chatSessions' | 'stickyNotes' | 'downloads' | 'activities';
  documentId?: string; // Target ID if updating/deleting
  data: any; // The payload
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

const PendingChangeSchema: Schema = new Schema({
  authorUid: { type: String, required: true },
  authorEmail: { type: String, required: true },
  action: { type: String, enum: ['create', 'update', 'delete'], required: true },
  collectionName: { type: String, required: true },
  documentId: { type: String },
  data: { type: Schema.Types.Mixed }, // Store the JSON payload
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.PendingChange || mongoose.model<IPendingChange>('PendingChange', PendingChangeSchema);
