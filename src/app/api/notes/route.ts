import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Note from '@/models/Note';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const firebaseUid = searchParams.get('uid');

    if (!firebaseUid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Sort notes descending by updated time
    const notes = await Note.find({ firebaseUid }).sort({ updatedAt: -1 });
    
    return NextResponse.json({ success: true, notes }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firebaseUid, title, content, type, listItems } = body;

    if (!firebaseUid || !title || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();
    
    const newNote = await Note.create({
      firebaseUid,
      title,
      content: content || '',
      type,
      listItems: listItems || []
    });

    return NextResponse.json({ success: true, note: newNote }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
