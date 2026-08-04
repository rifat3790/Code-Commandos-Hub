import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import TelegramSubscriber from '@/models/TelegramSubscriber';
import { sendTelegramMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const update = await req.json();
    const message = update.message || update.edited_message;

    if (message && message.chat && message.chat.type === 'private') {
      await connectToDatabase();
      const userId = String(message.chat.id);
      const username = message.from?.username || message.chat.username || '';
      const firstName = message.from?.first_name || message.chat.first_name || 'Subscriber';
      const text = (message.text || '').trim();

      // Register or update subscriber in DB
      await TelegramSubscriber.findOneAndUpdate(
        { telegramUserId: userId },
        {
          username: username,
          firstName: firstName,
          lastName: message.from?.last_name || message.chat.last_name || '',
          isSubscribed: true,
          lastActiveAt: new Date()
        },
        { upsert: true, new: true }
      );

      // Auto reply greeting on /start
      if (text.startsWith('/start')) {
        const welcomeMsg = [
          `👋 <b>Welcome to Code Commandos Bot (@code_commandos_bot)!</b>\n`,
          `Hello ${firstName}! You have been successfully registered for <b>1-on-1 private direct alerts & notifications</b> from Code Commandos Hub.\n`,
          `<i>You will receive direct updates, issue assignments, and status reports right here!</i> 🚀`
        ].join('\n');
        
        try {
          await sendTelegramMessage(userId, welcomeMsg, 'HTML');
        } catch (e) {
          console.error("Failed to send welcome message:", e);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
