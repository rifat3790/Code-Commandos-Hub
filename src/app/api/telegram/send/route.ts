import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import TelegramConfig from '@/models/TelegramConfig';
import { sendTelegramMessage, sendCCSummaryReport } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { targetChatId, message, isSummaryReport, title, banner } = await req.json();

    if (isSummaryReport) {
      const result = await sendCCSummaryReport(title, banner);
      return NextResponse.json({ success: true, result }, { status: 200 });
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    await connectToDatabase();
    const config = await TelegramConfig.findOne({});

    let targetIds: string[] = [];
    if (targetChatId && targetChatId !== 'all') {
      targetIds = [String(targetChatId)];
    } else {
      targetIds = config?.groupChatIds || [];
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ 
        error: 'No target Chat IDs available. Please configure Group Chat IDs in settings or specify a Chat ID.' 
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
              clientName: 'Broadcast / Admin Test',
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

    return NextResponse.json({
      success: successCount > 0,
      deliveredCount: successCount,
      totalCount: targetIds.length,
      details: results
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
