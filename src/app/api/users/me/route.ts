import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const firebaseUid = searchParams.get('uid');

    if (!firebaseUid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });

    await connectToDatabase();
    const user = await User.findOne({ firebaseUid });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
