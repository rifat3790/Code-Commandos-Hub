import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PersonalProject from '@/models/PersonalProject';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const month = searchParams.get('month');
    const profileName = searchParams.get('profileName');

    // Build dynamic query
    const query: any = {};
    if (uid) query.firebaseUid = uid;
    if (month) query.month = month;
    if (profileName) query.profileName = profileName;

    const projects = await PersonalProject.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const newProject = await PersonalProject.create(body);
    return NextResponse.json({ success: true, project: newProject });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { _id, ...updateData } = body;
    
    const updatedProject = await PersonalProject.findByIdAndUpdate(
      _id,
      updateData,
      { new: true }
    );

    return NextResponse.json({ success: true, project: updatedProject });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

    await PersonalProject.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
