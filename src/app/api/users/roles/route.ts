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
    const { promoterUid, targetUserId, newRole, callingAllowed } = await req.json();

    if (!promoterUid || !targetUserId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await connectToDatabase();
    
    const promoter = await User.findOne({ firebaseUid: promoterUid });
    if (!promoter || (promoter.role !== 'super_admin' && promoter.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateObj: any = {};
    if (newRole) {
      if (promoter.role !== 'super_admin') {
        return NextResponse.json({ error: 'Only super_admin can change roles' }, { status: 403 });
      }
      updateObj.role = newRole;
    }
    if (callingAllowed !== undefined) {
      updateObj.callingAllowed = callingAllowed;
    }

    await User.findByIdAndUpdate(targetUserId, updateObj);
    return NextResponse.json({ success: true, message: 'User settings updated' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
