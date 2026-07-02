import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ShopifySnippet } from '@/models/ShopifySnippet';

export async function GET() {
  try {
    await connectToDatabase();
    const snippets = await ShopifySnippet.find({ status: 'pending' }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, snippets });
  } catch (error) {
    console.error('Error fetching pending shopify snippets:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch snippets' }, { status: 500 });
  }
}
