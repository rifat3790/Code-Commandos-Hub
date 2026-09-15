import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import BrowserLockDevice from '@/models/BrowserLockDevice';
import BrowserLockLog from '@/models/BrowserLockLog';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();

    const devices = await BrowserLockDevice.find().sort({ lastSeen: -1 });

    const now = Date.now();
    const thresholdMs = 45 * 1000; // 45 seconds heartbeat threshold

    // Format devices with live online status
    const formatted = devices.map((dev) => {
      const lastSeenMs = dev.lastSeen ? new Date(dev.lastSeen).getTime() : 0;
      const isOnline = now - lastSeenMs < thresholdMs;

      return {
        _id: dev._id,
        deviceId: dev.deviceId,
        deviceName: dev.deviceName,
        password: dev.password,
        isLocked: dev.isLocked,
        ipAddress: dev.ipAddress || 'Unknown',
        userAgent: dev.userAgent || '',
        lastSeen: dev.lastSeen,
        status: isOnline ? 'online' : 'offline',
        failedAttempts: dev.failedAttempts || 0,
        createdAt: dev.createdAt,
        updatedAt: dev.updatedAt
      };
    });

    const totalDevices = formatted.length;
    const onlineDevices = formatted.filter((d) => d.status === 'online').length;
    const lockedDevices = formatted.filter((d) => d.isLocked).length;
    const totalLogs = await BrowserLockLog.countDocuments();

    return NextResponse.json({
      success: true,
      devices: formatted,
      stats: {
        totalDevices,
        onlineDevices,
        lockedDevices,
        totalLogs
      }
    });
  } catch (error: any) {
    console.error('Fetch devices error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { deviceName, password, deviceId } = body;

    const id = deviceId || `device_${Math.random().toString(36).substring(2, 10)}`;

    const existing = await BrowserLockDevice.findOne({ deviceId: id });
    if (existing) {
      return NextResponse.json({ error: 'Device ID already exists' }, { status: 400 });
    }

    const device = await BrowserLockDevice.create({
      deviceId: id,
      deviceName: deviceName || 'New Browser Device',
      password: password || '1234',
      isLocked: false,
      ipAddress: '127.0.0.1',
      lastSeen: new Date(),
      status: 'offline'
    });

    await BrowserLockLog.create({
      deviceId: id,
      deviceName: device.deviceName,
      eventType: 'device_registered',
      performedBy: 'Admin',
      details: 'Device manually created in Admin Console'
    });

    return NextResponse.json({ success: true, device });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId is required' }, { status: 400 });
    }

    await BrowserLockDevice.deleteOne({ deviceId });
    await BrowserLockLog.deleteMany({ deviceId });

    return NextResponse.json({ success: true, message: 'Device deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
