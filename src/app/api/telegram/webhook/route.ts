import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import TelegramSubscriber from '@/models/TelegramSubscriber';
import { sendTelegramMessage, sendCCSummaryReport } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const update = await req.json();
    const message = update.message || update.edited_message;

    if (message && message.chat) {
      await connectToDatabase();
      const chatId = String(message.chat.id);
      const text = (message.text || '').trim();
      const user = message.from;

      // Register or update private chat subscriber in DB
      if (message.chat.type === 'private' && user) {
        const username = user.username || message.chat.username || '';
        const firstName = user.first_name || message.chat.first_name || 'Subscriber';

        await TelegramSubscriber.findOneAndUpdate(
          { telegramUserId: chatId },
          {
            username: username,
            firstName: firstName,
            lastName: user.last_name || message.chat.last_name || '',
            isSubscribed: true,
            lastActiveAt: new Date()
          },
          { upsert: true, new: true }
        );
      }

      // 1. /start Command
      if (text.startsWith('/start')) {
        const firstName = user?.first_name || 'Team Member';
        const welcomeMsg = [
          `👋 <b>Welcome to Code Commandos Bot (@code_commandos_bot)!</b>\n`,
          `Hello ${firstName}! You are now connected for <b>live alerts & command interactions</b> from Code Commandos Hub.\n`,
          `💡 <b>Available Commands:</b>`,
          `• <code>/issue</code> - View all pending CC team issues report`,
          `• <code>/issue [name]</code> - View pending issues for a specific member (e.g. <code>/issue nitto</code>)`,
          `• <code>/help</code> - View help and bot command instructions\n`,
          `<i>Type <code>/issue</code> anytime to see active issues!</i> 🚀`
        ].join('\n');
        
        try {
          await sendTelegramMessage(chatId, welcomeMsg, 'HTML');
        } catch (e) {
          console.error("Failed to send welcome message:", e);
        }
      }
      // 2. /issue or /issues or /cc Command
      else if (text.startsWith('/issue') || text.startsWith('/issues') || text.startsWith('/cc')) {
        const parts = text.split(/\s+/);
        const filterMember = parts.length > 1 ? parts[1].trim() : undefined;
        try {
          await sendCCSummaryReport(undefined, chatId, filterMember);
        } catch (e: any) {
          console.error("Error sending /issue webhook response:", e.message);
        }
      }
      // 3. /help Command
      else if (text.startsWith('/help')) {
        const helpMsg = [
          `🤖 <b>CODE COMMANDOS BOT COMMANDS</b> 🤖\n`,
          `• <code>/issue</code> - View all pending CC team issues report`,
          `• <code>/issue [name]</code> - View pending issues for a specific member (e.g. <code>/issue nitto</code>)`,
          `• <code>/start</code> - Register for 1-on-1 private direct alerts`,
          `• <code>/help</code> - Show this command list\n`,
          `<i>Code Commandos Hub Automated Alert System</i>`
        ].join('\n');

        try {
          await sendTelegramMessage(chatId, helpMsg, 'HTML');
        } catch (e) {}
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
