import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import BrowserLockDevice from '@/models/BrowserLockDevice';
import BrowserLockLog from '@/models/BrowserLockLog';

export const dynamic = 'force-dynamic';

function extractIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const ipAddress = extractIp(req);

    const body = await req.json();
    const { deviceId, isLocked, performedBy } = body;

    if (!deviceId || typeof isLocked !== 'boolean') {
      return NextResponse.json({ error: 'deviceId and isLocked (boolean) are required' }, { status: 400 });
    }

    const device = await BrowserLockDevice.findOne({ deviceId });
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    device.isLocked = isLocked;
    if (!isLocked) {
      device.failedAttempts = 0;
    }
    await device.save();

    await BrowserLockLog.create({
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      eventType: isLocked ? 'remote_lock' : 'remote_unlock',
      performedBy: performedBy || 'Admin',
      ipAddress,
      details: isLocked
        ? `Browser remotely locked by ${performedBy || 'Admin'}`
        : `Browser remotely unlocked by ${performedBy || 'Admin'}`
    });

    return NextResponse.json({
      success: true,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      isLocked: device.isLocked
    });
  } catch (error: any) {
    console.error('Lock toggle error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
