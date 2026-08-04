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
    let collectionsList: { name: string; count: number; weightPct: number }[] = [];

    try {
      const db = mongoose.connection.db;
      if (db) {
        // Fetch DB Stats
        mongoStats = await db.command({ dbStats: 1 });

        // Fetch Collection Document Counts
        const cols = await db.listCollections().toArray();
        let totalDocSum = 0;

        for (const col of cols) {
          try {
            const count = await db.collection(col.name).countDocuments();
            totalDocSum += count;
            collectionsList.push({ name: col.name, count, weightPct: 0 });
          } catch (e) {
            // ignore individual count errors
          }
        }

        // Calculate weight percentage per collection
        collectionsList = collectionsList.map(c => ({
          ...c,
          weightPct: totalDocSum > 0 ? parseFloat(((c.count / totalDocSum) * 100).toFixed(1)) : 0
        })).sort((a, b) => b.count - a.count);
      }
    } catch (e) {
      console.error("Error fetching mongo stats:", e);
    }

    const userCount = await User.countDocuments();
    
    // Firebase simulated metric (1GB Spark quota)
    const simulatedFirebaseUsedBytes = (2.5 * 1024 * 1024) + (userCount * 120 * 1024); 
    const firebaseTotalBytes = 1024 * 1024 * 1024; // 1 GB quota

    // Health & Diagnostic Analytics Calculations
    const dataSizeBytes = mongoStats?.dataSize || 0;
    const storageSizeBytes = mongoStats?.storageSize || 1;
    const indexSizeBytes = mongoStats?.indexSize || 0;
    const totalAllocatedBytes = 512 * 1024 * 1024; // 512 MB quota

    const compressionRatio = parseFloat((dataSizeBytes / Math.max(1, storageSizeBytes)).toFixed(2));
    const indexRatioPct = parseFloat(((indexSizeBytes / Math.max(1, dataSizeBytes)) * 100).toFixed(1));
    const quotaUsedPct = parseFloat(((dataSizeBytes / totalAllocatedBytes) * 100).toFixed(1));
    
    // Health score algorithm (Starts at 100, drops slightly as quota/index loads increase)
    const healthScore = Math.min(100, Math.max(70, Math.round(100 - (quotaUsedPct * 0.4) - (indexRatioPct * 0.05))));
    const estimatedDaysRemaining = Math.max(30, Math.round(500 - ((mongoStats?.objects || 0) * 0.12)));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        mongodb: mongoStats ? {
          dbName: mongoStats.db || 'CodeCommandosDB',
          collectionsCount: mongoStats.collections || collectionsList.length,
          objectsCount: mongoStats.objects || 0,
          dataSize: dataSizeBytes,             // Uncompressed bytes
          storageSize: storageSizeBytes,       // Disk storage bytes
          indexSize: indexSizeBytes,           // Index bytes
          totalSize: storageSizeBytes + indexSizeBytes,
          totalAllocated: totalAllocatedBytes, // 512 MB M0 Cluster Quota
          compressionRatio: compressionRatio,
          indexRatioPct: indexRatioPct,
          healthScore: healthScore,
          estimatedDaysRemaining: estimatedDaysRemaining,
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
