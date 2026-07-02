import mongoose, { Document, Model } from 'mongoose';

export interface IShopifySnippet extends Document {
  title: string;
  code: string;
  createdBy: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const shopifySnippetSchema = new mongoose.Schema<IShopifySnippet>(
  {
    title: { type: String, required: true },
    code: { type: String, required: true },
    createdBy: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

export const ShopifySnippet: Model<IShopifySnippet> = 
  mongoose.models.ShopifySnippet || mongoose.model<IShopifySnippet>('ShopifySnippet', shopifySnippetSchema);
