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
    const { deviceId, newPassword, performedBy } = body;

    if (!deviceId || !newPassword) {
      return NextResponse.json({ error: 'deviceId and newPassword are required' }, { status: 400 });
    }

    if (String(newPassword).length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
    }

    const device = await BrowserLockDevice.findOne({ deviceId });
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const previousPassword = device.password;
    device.password = String(newPassword).trim();
    device.failedAttempts = 0;
    await device.save();

    await BrowserLockLog.create({
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      eventType: 'password_reset',
      performedBy: performedBy || 'Admin',
      ipAddress,
      details: `Password changed from ${'*'.repeat(previousPassword.length)} to new password by ${performedBy || 'Admin'}`
    });

    return NextResponse.json({
      success: true,
      deviceId: device.deviceId,
      message: 'Password updated successfully',
      password: device.password
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
