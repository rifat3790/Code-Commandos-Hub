import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firebaseUid, email, name, teamName, phoneNumber, photoURL } = body;

    if (!firebaseUid || !email) {
      return NextResponse.json({ error: 'firebaseUid and email are required' }, { status: 400 });
    }

    await connectToDatabase();

    const updateData: any = { 
      email, 
      name, 
      teamName, 
      phoneNumber, 
      photoURL,
      lastLoginAt: new Date()
    };

    if (email === 'mdrifayethossen@gmail.com') {
      updateData.role = 'super_admin';
    }

    const setOnInsertData: any = {};
    if (!updateData.role) {
      setOnInsertData.role = 'user';
    }

    const updateOps: any = { $set: updateData };
    if (Object.keys(setOnInsertData).length > 0) {
      updateOps.$setOnInsert = setOnInsertData;
    }

    // Upsert user (update if exists, create if not)
    const user = await User.findOneAndUpdate(
      { firebaseUid },
      updateOps,
      { returnDocument: 'after', upsert: true }
    );

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error: any) {
    console.error('Error saving user to MongoDB:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
