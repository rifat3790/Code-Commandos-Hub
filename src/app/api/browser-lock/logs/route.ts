import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import BrowserLockLog from '@/models/BrowserLockLog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('deviceId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: any = {};
    if (deviceId) {
      query.deviceId = deviceId;
    }

    const logs = await BrowserLockLog.find(query).sort({ createdAt: -1 }).limit(limit);

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await connectToDatabase();
    await BrowserLockLog.deleteMany({});
    return NextResponse.json({ success: true, message: 'Logs cleared successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
