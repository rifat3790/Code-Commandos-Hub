import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const firebaseUid = searchParams.get('uid');

    if (!firebaseUid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });

    await connectToDatabase();
    const user = await User.findOne({ firebaseUid });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const firebaseUid = searchParams.get('uid');
    
    if (!firebaseUid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });

    const body = await req.json();

    await connectToDatabase();
    
    // Allows updating arbitrary user fields but for now just trackerFilters and skills
    const updateData: any = {};
    if (body.trackerFilters !== undefined) {
      updateData.trackerFilters = body.trackerFilters;
    }
    if (body.skills !== undefined) {
      updateData.skills = body.skills;
    }
    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.role !== undefined) {
      updateData.role = body.role;
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
