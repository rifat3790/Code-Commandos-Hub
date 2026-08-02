import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PasswordReset from '@/models/PasswordReset';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ success: false, message: 'Missing required parameters.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    await connectDB();

    // Verify reset code
    const resetRecord = await PasswordReset.findOne({
      email: normalizedEmail,
      code: cleanCode,
      used: false
    });

    if (!resetRecord || new Date() > new Date(resetRecord.expiresAt)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid or expired verification code.' 
      }, { status: 400 });
    }

    // Mark code as used
    resetRecord.used = true;
    await resetRecord.save();

    // Update user updatedAt timestamp in MongoDB
    await User.updateOne(
      { email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } },
      { $set: { updatedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: 'Password reset authorization verified successfully.'
    });
  } catch (error: any) {
    console.error('Error in reset-password API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
