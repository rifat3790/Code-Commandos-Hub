import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import WorkspaceTarget from '@/models/WorkspaceTarget';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'Missing user uid' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Auth check
    const user = await User.findOne({ firebaseUid: uid });
    if (!user || (!user.canViewWorkspaceMonthlyTarget && user.role !== 'super_admin' && user.role !== 'admin')) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const targets = await WorkspaceTarget.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, targets }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, teamName, monthName, members } = body;

    if (!uid || !teamName || !monthName) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await connectToDatabase();

    // Only super admin or admin can create
    const user = await User.findOne({ firebaseUid: uid });
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized: Only admins can create targets' }, { status: 403 });
    }

    const newTarget = new WorkspaceTarget({
      teamName,
      monthName,
      members: members || []
    });

    await newTarget.save();

    return NextResponse.json({ success: true, target: newTarget }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
       return NextResponse.json({ error: 'A target for this team and month already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { uid, targetId, members } = body;

    if (!uid || !targetId || !members) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ firebaseUid: uid });
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized: Only admins can edit targets' }, { status: 403 });
    }

    const updatedTarget = await WorkspaceTarget.findByIdAndUpdate(
      targetId,
      { members },
      { new: true }
    );

    if (!updatedTarget) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, target: updatedTarget }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
