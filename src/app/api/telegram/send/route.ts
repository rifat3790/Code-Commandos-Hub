import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import TelegramConfig from '@/models/TelegramConfig';
import TelegramSubscriber from '@/models/TelegramSubscriber';
import { sendTelegramMessage, sendCCSummaryReport } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { targetChatId, message, isSummaryReport, slotType } = await req.json();

    if (isSummaryReport) {
      const result = await sendCCSummaryReport(slotType);
      return NextResponse.json({ success: true, result }, { status: 200 });
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    await connectToDatabase();
    const config = await TelegramConfig.findOne({});

    let targetIds: string[] = [];
    
    if (targetChatId === 'all_subscribers') {
      // Broadcast DM to all registered individual bot subscribers
      const subscribers = await TelegramSubscriber.find({ isSubscribed: true });
      targetIds = subscribers.map(s => s.telegramUserId);
    } else if (targetChatId && targetChatId !== 'all') {
      // Individual DM target or single group
      targetIds = [String(targetChatId).replace(/^user_/, '').trim()];
    } else {
      // All registered group chats
      targetIds = config?.groupChatIds || [];
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ 
        error: 'No target Chat/User IDs available for dispatch. Please sync subscribers or add Chat IDs.' 
      }, { status: 400 });
    }

    const results = [];
    for (const cid of targetIds) {
      try {
        const res = await sendTelegramMessage(cid, message, 'HTML');
        results.push({ chatId: cid, success: true, data: res });

        if (config) {
          config.notificationLogs = [
            {
              timestamp: new Date(),
              clientName: 'Direct / Broadcast Message',
              assignee: 'Admin',
              mention: 'Admin',
              status: 'sent',
              message: message.substring(0, 100),
              chatId: cid
            },
            ...(config.notificationLogs || [])
          ].slice(0, 50);
          await config.save();
        }
      } catch (err: any) {
        results.push({ chatId: cid, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const firstError = results.find(r => !r.success)?.error;

    if (successCount === 0) {
      return NextResponse.json({
        success: false,
        error: firstError || 'Failed to send message to Telegram chat(s).',
        details: results
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      deliveredCount: successCount,
      totalCount: targetIds.length,
      details: results
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
