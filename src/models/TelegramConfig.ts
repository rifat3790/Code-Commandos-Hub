import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationLog {
  timestamp: Date;
  clientName: string;
  assignee: string;
  mention: string;
  status: 'sent' | 'failed';
  message: string;
  chatId?: string;
}

export interface ITelegramConfig extends Document {
  groupChatIds: string[];
  userMentions: Record<string, string>;
  notifiedIssueHashes: string[];
  autoAlertsEnabled: boolean;
  lastCheckedAt?: Date;
  lastSummarySentDate?: string;
  lastSummarySlots?: string[];
  notificationLogs: INotificationLog[];
  updatedAt: Date;
}

const TelegramConfigSchema: Schema = new Schema({
  groupChatIds: { type: [String], default: [] },
  userMentions: {
    type: Map,
    of: String,
    default: {
      "refayet": "@Rifat_CC",
      "ibrahim": "@ibrahim_57",
      "ashfak": "@ashfak_CC",
      "nitto": "@nitto084",
      "sajjad": "@Sajjad_hossain19",
      "nirob": "@nirob_cc",
      "muzahid": "@Muzahid_111",
      "ismail": "@Ismail_CC",
      "muhaimenul": "@ratul7272",
      "ratul": "@ratul7272",
      "ratan": "@ratanchowdhury360"
    }
  },
  notifiedIssueHashes: { type: [String], default: [] },
  autoAlertsEnabled: { type: Boolean, default: true },
  lastCheckedAt: { type: Date },
  lastSummarySentDate: { type: String, default: '' },
  lastSummarySlots: { type: [String], default: [] },
  notificationLogs: [
    {
      timestamp: { type: Date, default: Date.now },
      clientName: String,
      assignee: String,
      mention: String,
      status: String,
      message: String,
      chatId: String
    }
  ],
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.TelegramConfig || mongoose.model<ITelegramConfig>('TelegramConfig', TelegramConfigSchema);
