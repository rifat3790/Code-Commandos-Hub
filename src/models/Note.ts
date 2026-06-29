import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  firebaseUid: string;
  title: string;
  content: string;
  type: string;
  listItems?: { id: string; text: string; completed: boolean }[];
  color?: string; // For sticky notes
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema: Schema = new Schema({
  firebaseUid: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, default: '' },
  type: { type: String, required: true },
  listItems: [
    {
      id: { type: String },
      text: { type: String },
      completed: { type: Boolean, default: false }
    }
  ],
  color: { type: String }, // For sticky notes
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
