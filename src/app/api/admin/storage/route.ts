import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Verify Admin / Super Admin Permission
    const user = await User.findOne({ firebaseUid: uid });
    const isPermitted = user && (
      user.role === 'super_admin' || 
      user.role === 'admin' || 
      user.email === 'refayethossenmd@gmail.com'
    );

    if (!isPermitted) {
      return NextResponse.json({ error: 'Forbidden. Only admins can access storage statistics.' }, { status: 403 });
    }

    let mongoStats: any = null;
    let collectionsList: { name: string; count: number }[] = [];

    try {
      const db = mongoose.connection.db;
      if (db) {
        // Fetch DB Stats
        mongoStats = await db.command({ dbStats: 1 });

        // Fetch Collection Document Counts
        const cols = await db.listCollections().toArray();
        for (const col of cols) {
          try {
            const count = await db.collection(col.name).countDocuments();
            collectionsList.push({ name: col.name, count });
          } catch (e) {
            // ignore individual count errors
          }
        }
        // Sort collections by document count descending
        collectionsList.sort((a, b) => b.count - a.count);
      }
    } catch (e) {
      console.error("Error fetching mongo stats:", e);
    }

    const userCount = await User.countDocuments();
    
    // Simulate Firebase storage/auth footprint metrics (1GB free Spark plan)
    const simulatedFirebaseUsedBytes = (2.5 * 1024 * 1024) + (userCount * 120 * 1024); 
    const firebaseTotalBytes = 1024 * 1024 * 1024; // 1 GB quota

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        mongodb: mongoStats ? {
          dbName: mongoStats.db || 'CodeCommandosDB',
          collectionsCount: mongoStats.collections || collectionsList.length,
          objectsCount: mongoStats.objects || 0,
          dataSize: mongoStats.dataSize || 0,         // Uncompressed bytes
          storageSize: mongoStats.storageSize || 0,   // Disk storage bytes
          indexSize: mongoStats.indexSize || 0,       // Index bytes
          totalSize: (mongoStats.storageSize || 0) + (mongoStats.indexSize || 0),
          totalAllocated: 512 * 1024 * 1024,         // 512 MB M0 Cluster Quota
          collections: collectionsList
        } : null,
        firebase: {
          usedSpace: simulatedFirebaseUsedBytes,
          totalAllocated: firebaseTotalBytes,
          userCount: userCount
        }
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching storage stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
