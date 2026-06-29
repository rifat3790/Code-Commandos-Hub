import mongoose, { Schema, Document } from 'mongoose';

export interface IPersonalProjectMonth extends Document {
  firebaseUid: string;
  month: string;
  createdAt: Date;
}

const PersonalProjectMonthSchema: Schema = new Schema({
  firebaseUid: { type: String, required: true },
  month: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Compound index to prevent duplicate months for the same user
PersonalProjectMonthSchema.index({ firebaseUid: 1, month: 1 }, { unique: true });

export default mongoose.models.PersonalProjectMonth || mongoose.model<IPersonalProjectMonth>('PersonalProjectMonth', PersonalProjectMonthSchema);
