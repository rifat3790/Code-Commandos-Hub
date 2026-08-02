import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PasswordReset from '@/models/PasswordReset';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();

    // Fetch active, non-expired codes ordered by newest
    const activeCodes = await PasswordReset.find({
      used: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      codes: activeCodes
    });
  } catch (error: any) {
    console.error('Error fetching admin reset codes:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, message: 'User email is required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    await connectDB();

    // Check if user exists
    const user = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });
    if (!user) {
      return NextResponse.json({ success: false, message: 'No registered user found with this email.' }, { status: 404 });
    }

    // Generate fresh 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes for admin generated

    await PasswordReset.deleteMany({ email: normalizedEmail });

    const newRecord = await PasswordReset.create({
      email: normalizedEmail,
      code,
      expiresAt,
      used: false
    });

    return NextResponse.json({
      success: true,
      message: `Fresh verification code ${code} generated for ${normalizedEmail}.`,
      record: newRecord
    });
  } catch (error: any) {
    console.error('Error generating admin reset code:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
