import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PasswordReset from '@/models/PasswordReset';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ success: false, message: 'Email and verification code are required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    await connectDB();

    // Find active code
    const resetRecord = await PasswordReset.findOne({
      email: normalizedEmail,
      code: cleanCode,
      used: false
    });

    if (!resetRecord) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid verification code. Please check your code or request a new one from an Admin.' 
      }, { status: 400 });
    }

    // Check if code has expired
    if (new Date() > new Date(resetRecord.expiresAt)) {
      return NextResponse.json({ 
        success: false, 
        message: 'This verification code has expired. Please generate a new code or ask an Admin.' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Code verified successfully.'
    });
  } catch (error: any) {
    console.error('Error in verify-reset-code API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
