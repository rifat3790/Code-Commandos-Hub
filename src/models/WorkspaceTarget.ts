import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspaceTargetMember {
  employeeId: string;
  name: string;
  officialTarget: number;
  teamTarget: number;
  achieved: number;
}

export interface IWorkspaceTarget extends Document {
  teamName: string;
  monthName: string;
  members: IWorkspaceTargetMember[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceTargetMemberSchema = new Schema<IWorkspaceTargetMember>({
  employeeId: { type: String, required: true },
  name: { type: String, required: true },
  officialTarget: { type: Number, default: 0 },
  teamTarget: { type: Number, default: 0 },
  achieved: { type: Number, default: 0 }
});

const WorkspaceTargetSchema = new Schema<IWorkspaceTarget>({
  teamName: { type: String, required: true },
  monthName: { type: String, required: true },
  members: { type: [WorkspaceTargetMemberSchema], default: [] }
}, {
  timestamps: true
});

// Ensure uniqueness for teamName and monthName combination
WorkspaceTargetSchema.index({ teamName: 1, monthName: 1 }, { unique: true });

export default mongoose.models.WorkspaceTarget || mongoose.model<IWorkspaceTarget>('WorkspaceTarget', WorkspaceTargetSchema);
