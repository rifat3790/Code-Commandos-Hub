import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import PasswordReset from '@/models/PasswordReset';
import { sendResetCodeEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, message: 'Email address is required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    await connectDB();

    // Check if user exists in database
    const user = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'No registered account found with this email address.' 
      }, { status: 404 });
    }

    // Generate secure 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Valid for 15 minutes

    // Delete existing reset codes for this email
    await PasswordReset.deleteMany({ email: normalizedEmail });

    // Store new code in MongoDB (Synced to Admin Panel)
    await PasswordReset.create({
      email: normalizedEmail,
      code,
      expiresAt,
      used: false
    });

    // Dispatch 6-digit OTP email to Gmail
    await sendResetCodeEmail(normalizedEmail, code);

    return NextResponse.json({
      success: true,
      message: 'A 6-digit verification code has been generated and dispatched to your email & Admin Panel.',
      email: normalizedEmail,
      expiresInMinutes: 15
    });
  } catch (error: any) {
    console.error('Error in forgot-password API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
