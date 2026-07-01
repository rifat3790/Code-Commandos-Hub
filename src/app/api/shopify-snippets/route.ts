import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ShopifySnippet } from '@/models/ShopifySnippet';

export async function GET() {
  try {
    await connectToDatabase();
    const snippets = await ShopifySnippet.find({}).sort({ createdAt: -1 });
    return NextResponse.json(snippets);
  } catch (error) {
    console.error('Error fetching shopify snippets:', error);
    return NextResponse.json({ error: 'Failed to fetch snippets' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, code, createdBy } = body;

    if (!title || !code || !createdBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();
    const newSnippet = await ShopifySnippet.create({
      title,
      code,
      createdBy,
    });

    return NextResponse.json(newSnippet, { status: 201 });
  } catch (error) {
    console.error('Error creating shopify snippet:', error);
    return NextResponse.json({ error: 'Failed to create snippet' }, { status: 500 });
  }
}
