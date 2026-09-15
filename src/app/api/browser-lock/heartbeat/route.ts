import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import BrowserLockDevice from '@/models/BrowserLockDevice';
import BrowserLockLog from '@/models/BrowserLockLog';

export const dynamic = 'force-dynamic';

function extractIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return '127.0.0.1';
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const ipAddress = extractIp(req);
    const userAgent = req.headers.get('user-agent') || 'Browser Extension';

    const body = await req.json().catch(() => ({}));
    const { deviceId, deviceName, localIsLocked, event, eventDetails } = body;

    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId is required' }, { status: 400 });
    }

    let device = await BrowserLockDevice.findOne({ deviceId });

    if (!device) {
      // Auto-register new device
      device = await BrowserLockDevice.create({
        deviceId,
        deviceName: deviceName || `Browser-${deviceId.slice(0, 6)}`,
        password: body.password || '1234',
        isLocked: localIsLocked ?? false,
        ipAddress,
        userAgent,
        lastSeen: new Date(),
        status: 'online',
        failedAttempts: 0
      });

      await BrowserLockLog.create({
        deviceId,
        deviceName: device.deviceName,
        eventType: 'device_registered',
        performedBy: 'Extension Client',
        ipAddress,
        details: `Device registered: ${device.deviceName}`
      });
    } else {
      // Device exists - update heartbeat and device stats
      device.lastSeen = new Date();
      device.ipAddress = ipAddress;
      device.userAgent = userAgent;
      device.status = 'online';

      if (deviceName && device.deviceName !== deviceName) {
        device.deviceName = deviceName;
      }

      // Handle specific event report from client
      if (event === 'local_unlock') {
        device.isLocked = false;
        device.failedAttempts = 0;
        await BrowserLockLog.create({
          deviceId,
          deviceName: device.deviceName,
          eventType: 'local_unlock',
          performedBy: 'Local User',
          ipAddress,
          details: eventDetails || 'User entered correct password on device'
        });
      } else if (event === 'failed_unlock') {
        device.failedAttempts = (device.failedAttempts || 0) + 1;
        await BrowserLockLog.create({
          deviceId,
          deviceName: device.deviceName,
          eventType: 'failed_unlock',
          performedBy: 'Local User',
          ipAddress,
          details: eventDetails || `Failed unlock attempt (Count: ${device.failedAttempts})`
        });
      }

      await device.save();
    }

    return NextResponse.json({
      success: true,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      isLocked: device.isLocked,
      password: device.password,
      ipAddress: device.ipAddress,
      serverTime: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Heartbeat error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
