import { NextResponse } from 'next/server';
import { checkAndNotifyCCIssues } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await checkAndNotifyCCIssues();
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await checkAndNotifyCCIssues();
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
