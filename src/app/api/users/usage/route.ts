import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { firebaseUid, path } = await req.json();

    if (!firebaseUid || !path) {
      return NextResponse.json({ error: 'firebaseUid and path are required' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get today's date string (local time/UTC depending on server, we will use UTC ISO string split)
    const todayStr = new Date().toISOString().split('T')[0];

    // Find if today's entry exists
    let todayEntryIndex = user.usageHistory?.findIndex((entry: any) => entry.date === todayStr);

    if (user.usageHistory === undefined) {
      user.usageHistory = [];
      todayEntryIndex = -1;
    }

    const pathWithTime = `${path}|${new Date().toISOString()}`;

    if (todayEntryIndex === -1 || todayEntryIndex === undefined) {
      // Create a new entry for today
      user.usageHistory.push({
        date: todayStr,
        pages: [pathWithTime]
      });
    } else {
      // Entry exists, check if path is already the last one (to prevent spamming on reload)
      const pages = user.usageHistory[todayEntryIndex].pages;
      const lastPageWithTime = pages[pages.length - 1] || "";
      const lastPageName = lastPageWithTime.split('|')[0];
      if (pages.length === 0 || lastPageName !== path) {
        pages.push(pathWithTime);
      }
    }

    await user.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error logging user usage:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
