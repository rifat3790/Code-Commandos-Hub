import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import TelegramSubscriber from '@/models/TelegramSubscriber';
import { syncTelegramUpdates } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Auto-sync updates from Telegram /getUpdates API first
    await syncTelegramUpdates();

    const subscribers = await TelegramSubscriber.find({}).sort({ lastActiveAt: -1 });

    return NextResponse.json({
      success: true,
      subscribers
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, telegramUserId, username, firstName, lastName, mappedMemberName } = await req.json();
    await connectToDatabase();

    if (action === 'sync') {
      const syncResult = await syncTelegramUpdates();
      return NextResponse.json(syncResult, { status: 200 });
    }

    if (!telegramUserId) {
      return NextResponse.json({ error: 'telegramUserId is required' }, { status: 400 });
    }

    const subscriber = await TelegramSubscriber.findOneAndUpdate(
      { telegramUserId: String(telegramUserId).trim() },
      {
        username: username || '',
        firstName: firstName || '',
        lastName: lastName || '',
        mappedMemberName: mappedMemberName || '',
        isSubscribed: true,
        lastActiveAt: new Date()
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Subscriber added/updated successfully',
      subscriber
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await connectToDatabase();
    await TelegramSubscriber.findOneAndDelete({ telegramUserId: id });

    return NextResponse.json({
      success: true,
      message: 'Subscriber removed successfully'
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
