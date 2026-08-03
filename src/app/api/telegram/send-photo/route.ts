import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import TelegramConfig from '@/models/TelegramConfig';
import { sendTelegramPhoto, DEFAULT_USER_MENTIONS } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { imageBase64, customCaption, memberNames } = await req.json();

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: 'Image base64 data is required' }, { status: 400 });
    }

    await connectToDatabase();
    const config = await TelegramConfig.findOne({});
    const groupChatIds = config?.groupChatIds || [];

    if (groupChatIds.length === 0) {
      return NextResponse.json({ 
        error: 'No Telegram Group Chat IDs configured. Please add group chat IDs in Admin Panel Telegram settings.' 
      }, { status: 400 });
    }

    // Resolve mentions map
    const rawMentions = config?.userMentions;
    const userMentionsMap: Record<string, string> = { ...DEFAULT_USER_MENTIONS };
    if (rawMentions instanceof Map) {
      rawMentions.forEach((val, key) => { userMentionsMap[key.toLowerCase()] = val; });
    } else if (rawMentions && typeof rawMentions === 'object') {
      Object.entries(rawMentions).forEach(([key, val]) => { userMentionsMap[key.toLowerCase()] = String(val); });
    }

    const mentionsList: string[] = [];
    if (Array.isArray(memberNames)) {
      memberNames.forEach(name => {
        const tag = userMentionsMap[String(name).toLowerCase()] || `@${name}`;
        if (!mentionsList.includes(tag)) mentionsList.push(tag);
      });
    }

    let caption = customCaption || '📸 <b>PROJECT ISSUES TABLE EXPORT</b>';
    if (mentionsList.length > 0) {
      caption += `\n\n🔔 <b>Attention Team:</b> ${mentionsList.join(' ')}`;
    }
    caption += `\n\n<i>Exported from Code Commandos Hub</i>`;

    const results = [];
    for (const cid of groupChatIds) {
      try {
        const res = await sendTelegramPhoto(cid, imageBase64, caption, 'HTML');
        results.push({ chatId: cid, success: true, res });
      } catch (err: any) {
        results.push({ chatId: cid, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: successCount > 0,
      deliveredCount: successCount,
      totalCount: groupChatIds.length,
      details: results
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
