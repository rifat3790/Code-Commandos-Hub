import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ShopifySnippet } from '@/models/ShopifySnippet';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Using updateOne or findByIdAndUpdate
    const updated = await ShopifySnippet.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Snippet not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, snippet: updated });
  } catch (error) {
    console.error('Error updating shopify snippet status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update snippet' }, { status: 500 });
  }
}
