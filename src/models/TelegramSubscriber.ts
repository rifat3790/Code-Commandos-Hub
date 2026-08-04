import mongoose, { Schema, Document } from 'mongoose';

export interface ITelegramSubscriber extends Document {
  telegramUserId: string; // Private Chat ID / Telegram User ID
  username?: string;      // e.g. Rifat_CC
  firstName?: string;     // e.g. Refayet
  lastName?: string;
  mappedMemberName?: string; // e.g. refayet, ibrahim
  isSubscribed: boolean;
  lastActiveAt: Date;
  createdAt: Date;
}

const TelegramSubscriberSchema: Schema = new Schema({
  telegramUserId: { type: String, required: true, unique: true },
  username: { type: String, default: '' },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  mappedMemberName: { type: String, default: '' },
  isSubscribed: { type: Boolean, default: true },
  lastActiveAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.TelegramSubscriber || mongoose.model<ITelegramSubscriber>('TelegramSubscriber', TelegramSubscriberSchema);
