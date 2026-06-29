import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PersonalProject from '@/models/PersonalProject';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const firebaseUid = searchParams.get('uid');

    if (!firebaseUid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });

    await connectToDatabase();
    
    const user = await User.findOne({ firebaseUid });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let projects;
    if (user.role === 'admin' || user.role === 'super_admin') {
      projects = await PersonalProject.find({}).sort({ createdAt: -1 });
    } else {
      projects = await PersonalProject.find({ firebaseUid }).sort({ createdAt: -1 });
    }

    return NextResponse.json({ success: true, projects }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.firebaseUid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });

    await connectToDatabase();
    
    const newProject = new PersonalProject(body);
    await newProject.save();

    return NextResponse.json({ success: true, project: newProject }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body._id) return NextResponse.json({ error: 'Missing _id' }, { status: 400 });

    await connectToDatabase();
    
    const updated = await PersonalProject.findByIdAndUpdate(body._id, { ...body, updatedAt: new Date() }, { new: true });
    
    return NextResponse.json({ success: true, project: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await connectToDatabase();
    
    await PersonalProject.findByIdAndDelete(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
