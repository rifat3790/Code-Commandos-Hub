import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const users = await User.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { promoterUid, targetUserId, newRole } = await req.json();

    if (!promoterUid || !targetUserId || !newRole) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Only super_admin can promote to admin
    const promoter = await User.findOne({ firebaseUid: promoterUid });
    if (promoter?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super_admin can change roles' }, { status: 403 });
    }

    await User.findByIdAndUpdate(targetUserId, { role: newRole });
    return NextResponse.json({ success: true, message: 'Role updated' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
