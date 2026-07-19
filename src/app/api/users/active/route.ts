import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const firebaseUid = searchParams.get('uid');

    if (!firebaseUid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    await connectToDatabase();

    // Verify if requesting user exists
    const requester = await User.findOne({ firebaseUid });
    if (!requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query users active in the last 2 minutes (excluding banned)
    const threshold = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
    const activeUsers = await User.find({
      lastActiveAt: { $gte: threshold },
      role: { $ne: 'banned' }
    }).select('name email role photoURL firebaseUid lastActiveAt');

    return NextResponse.json({
      success: true,
      count: activeUsers.length,
      activeUsers
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firebaseUid } = body;

    if (!firebaseUid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { $set: { lastActiveAt: new Date() } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
