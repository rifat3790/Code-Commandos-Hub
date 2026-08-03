import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import TelegramConfig from '@/models/TelegramConfig';
import { getBotInfo, getOrCreateTelegramConfig, DEFAULT_USER_MENTIONS } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const config = await getOrCreateTelegramConfig();
    const botInfo = await getBotInfo();

    let userMentionsObj: Record<string, string> = { ...DEFAULT_USER_MENTIONS };
    if (config.userMentions) {
      if (config.userMentions instanceof Map) {
        config.userMentions.forEach((val: string, key: string) => {
          userMentionsObj[key] = val;
        });
      } else if (typeof config.userMentions === 'object') {
        Object.entries(config.userMentions).forEach(([k, v]) => {
          userMentionsObj[k] = String(v);
        });
      }
    }

    return NextResponse.json({
      success: true,
      botInfo,
      groupChatIds: config.groupChatIds || [],
      userMentions: userMentionsObj,
      autoAlertsEnabled: config.autoAlertsEnabled ?? true,
      lastCheckedAt: config.lastCheckedAt,
      notificationLogs: config.notificationLogs || []
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { groupChatIds, userMentions, autoAlertsEnabled } = await req.json();
    await connectToDatabase();
    
    let config = await TelegramConfig.findOne({});
    if (!config) {
      config = new TelegramConfig();
    }

    if (groupChatIds !== undefined) {
      config.groupChatIds = Array.isArray(groupChatIds) ? groupChatIds : [];
    }
    if (userMentions !== undefined && typeof userMentions === 'object') {
      config.userMentions = userMentions;
    }
    if (autoAlertsEnabled !== undefined) {
      config.autoAlertsEnabled = Boolean(autoAlertsEnabled);
    }
    config.updatedAt = new Date();

    await config.save();

    return NextResponse.json({
      success: true,
      message: 'Telegram settings updated successfully'
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
