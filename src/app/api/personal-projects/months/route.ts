import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PersonalProjectMonth from '@/models/PersonalProjectMonth';
import PersonalProject from '@/models/PersonalProject';

// Helper to format month strings strictly to standard "Month Year" format (e.g. "July 2026")
function formatStandardMonthName(str: string): string {
  if (!str || typeof str !== 'string') {
    return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }
  const trimmed = str.trim();
  const parts = trimmed.split(/\s+/);
  
  if (parts.length === 2) {
    const month = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    let year = parts[1];
    if (year.length === 2) year = `20${year}`;
    return `${month} ${year}`;
  }
  
  if (parts.length === 1 && isNaN(Number(parts[0]))) {
    const month = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    const year = new Date().getFullYear();
    return `${month} ${year}`;
  }
  
  return trimmed;
}

// GET all months for a specific user, or all months if no user is specified (Admin)
// Automatically ensures the current month (e.g. "July 2026") is created if not present!
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (uid) {
      const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const currentExists = await PersonalProjectMonth.findOne({ firebaseUid: uid, month: currentMonth });
      if (!currentExists) {
        await PersonalProjectMonth.create({ firebaseUid: uid, month: currentMonth });
      }
    }

    const query = uid ? { firebaseUid: uid } : {};
    const months = await PersonalProjectMonth.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, months });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create a new month for a user with standardized month formatting
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const formattedMonth = formatStandardMonthName(body.month);

    // Check if month already exists for this user
    const existing = await PersonalProjectMonth.findOne({ 
      firebaseUid: body.firebaseUid, 
      month: formattedMonth 
    });
    
    if (existing) {
      return NextResponse.json({ success: true, month: existing, message: 'Month already exists' });
    }

    const newMonth = await PersonalProjectMonth.create({
      ...body,
      month: formattedMonth
    });
    
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
