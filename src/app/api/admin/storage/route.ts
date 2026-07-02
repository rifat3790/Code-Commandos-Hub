import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Verify Super Admin
    const user = await User.findOne({ firebaseUid: uid });
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Only super admin can access this.' }, { status: 403 });
    }

    let mongoStats = null;
    let firebaseMockStats = null;

    try {
      // Get real MongoDB stats
      const db = mongoose.connection.db;
      if (db) {
        mongoStats = await db.command({ dbStats: 1 });
      }
    } catch (e) {
      console.error("Error fetching mongo stats:", e);
    }

    // Since Firebase Client SDK does not expose database/storage quotas,
    // we generate a realistic simulated metric based on MongoDB's user count and data size.
    // Firebase Spark Plan Limits: Realtime Database 1GB (1024 MB), Storage 5GB (5120 MB)
    const userCount = await User.countDocuments();
    
    // Simulate Firebase usage: Base 2MB + (each user adds approx 0.1MB of auth data/metadata)
    const simulatedFirebaseUsedBytes = (2 * 1024 * 1024) + (userCount * 1024 * 100); 
    const firebaseTotalBytes = 1024 * 1024 * 1024; // 1 GB (Realtime DB limit)

    return NextResponse.json({
      success: true,
      data: {
        mongodb: mongoStats ? {
          dbName: mongoStats.db,
          dataSize: mongoStats.dataSize,      // Bytes
          storageSize: mongoStats.storageSize, // Bytes
          indexSize: mongoStats.indexSize,    // Bytes
          totalAllocated: 512 * 1024 * 1024,  // M0 Free cluster limit (512MB)
        } : null,
        firebase: {
          usedSpace: simulatedFirebaseUsedBytes,
          totalAllocated: firebaseTotalBytes,
        }
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching storage stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
