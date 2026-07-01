import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ShopifySnippet } from '@/models/ShopifySnippet';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectToDatabase();
    
    const deletedSnippet = await ShopifySnippet.findByIdAndDelete(id);
    
    if (!deletedSnippet) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting snippet:', error);
    return NextResponse.json({ error: 'Failed to delete snippet' }, { status: 500 });
  }
}
