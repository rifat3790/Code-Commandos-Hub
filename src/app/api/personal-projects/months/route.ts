import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PersonalProjectMonth from '@/models/PersonalProjectMonth';
import PersonalProject from '@/models/PersonalProject';

// GET all months for a specific user, or all months if no user is specified (Admin)
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    const query = uid ? { firebaseUid: uid } : {};
    const months = await PersonalProjectMonth.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, months });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create a new month for a user
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Check if month already exists for this user
    const existing = await PersonalProjectMonth.findOne({ firebaseUid: body.firebaseUid, month: body.month });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Month already exists' }, { status: 400 });
    }

    const newMonth = await PersonalProjectMonth.create(body);
    return NextResponse.json({ success: true, month: newMonth });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE a month and all its associated projects
export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

    const monthDoc = await PersonalProjectMonth.findById(id);
    if (!monthDoc) {
      return NextResponse.json({ success: false, error: 'Month not found' }, { status: 404 });
    }

    // Delete all projects inside this month for this user
    await PersonalProject.deleteMany({ firebaseUid: monthDoc.firebaseUid, month: monthDoc.month });
    
    // Delete the month document itself
    await PersonalProjectMonth.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
