import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import TelegramConfig, { ITelegramConfig } from '@/models/TelegramConfig';

const DEFAULT_TOKEN = '8792351236:AAEycnhs_elMuMxSyUF1E85U4h-bhaQNlwo';

export const DEFAULT_USER_MENTIONS: Record<string, string> = {
  "refayet": "@Rifat_CC",
  "ibrahim": "@ibrahim_57",
  "ashfak": "@ashfak_CC",
  "nitto": "@nitto084",
  "sajjad": "@Sajjad_hossain19",
  "nirob": "@nirob_cc",
  "muzahid": "@Muzahid_111",
  "ismail": "@Ismail_CC",
  "muhaimenul": "@ratul7272",
  "ratul": "@ratul7272",
  "ratan": "@ratanchowdhury360"
};

export function getTelegramToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN || DEFAULT_TOKEN;
}

export async function sendTelegramMessage(
  chatId: string | number, 
  text: string, 
  parseMode: 'HTML' | 'Markdown' = 'HTML'
) {
  const token = getTelegramToken();
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: parseMode,
      disable_web_page_preview: true
    })
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.description || 'Failed to send Telegram message');
  }

  return data;
}

export async function getBotInfo() {
  const token = getTelegramToken();
  const url = `https://api.telegram.org/bot${token}/getMe`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function getOrCreateTelegramConfig() {
  await connectToDatabase();
  let config = await TelegramConfig.findOne({});
  if (!config) {
    config = await TelegramConfig.create({
      groupChatIds: [],
      userMentions: DEFAULT_USER_MENTIONS,
      notifiedIssueHashes: [],
      autoAlertsEnabled: true,
      notificationLogs: []
    });
  }
  return config;
}

function parseCSVRows(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  function splitLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  }

  const headers = splitLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });
    rows.push(rowObj);
  }

  return rows;
}

function getAssignNameFromRow(row: Record<string, string>): string {
  if (row['Assign Name']) return row['Assign Name'];
  if (row['Assign Team']) return row['Assign Team'];
  for (const [key, value] of Object.entries(row)) {
    if (value && typeof value === 'string' && /\/(cc|cm|cw)/i.test(value)) {
      return value;
    }
  }
  return '';
}

export async function checkAndNotifyCCIssues() {
  await connectToDatabase();
  const config = await TelegramConfig.findOne({});

  if (!config) {
    return { success: false, message: 'Telegram configuration not initialized.' };
  }

  const groupChatIds: string[] = config.groupChatIds || [];
  const rawMentions = config.userMentions;
  const userMentionsMap: Record<string, string> = {};

  if (rawMentions instanceof Map) {
    rawMentions.forEach((val, key) => {
      userMentionsMap[key.toLowerCase()] = val;
    });
  } else if (rawMentions && typeof rawMentions === 'object') {
    Object.entries(rawMentions).forEach(([key, val]) => {
      userMentionsMap[key.toLowerCase()] = String(val);
    });
  }

  // Merge defaults if missing
  Object.entries(DEFAULT_USER_MENTIONS).forEach(([k, v]) => {
    if (!userMentionsMap[k.toLowerCase()]) {
      userMentionsMap[k.toLowerCase()] = v;
    }
  });

  if (groupChatIds.length === 0) {
    return { 
      success: true, 
      message: 'No Telegram Group Chat IDs configured yet.',
      newIssuesNotified: 0 
    };
  }

  // Fetch Issues spreadsheet CSV
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1ic9UMVX0FFsAyz0TZ-_lGKj_D9NornoGhq38KTRtM54/export?format=csv&gid=1412843338';
  const response = await fetch(sheetUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch Issues spreadsheet CSV.');
  }

  const csvText = await response.text();
  const rows = parseCSVRows(csvText);

  const notifiedSet = new Set(config.notifiedIssueHashes || []);
  let newNotifiedCount = 0;
  const logsToAppend: any[] = [];

  for (const r of rows) {
    const assignRaw = getAssignNameFromRow(r);
    if (!assignRaw || !/\/cc/i.test(assignRaw)) {
      continue;
    }

    const clientName = r["Client's Name"] || r['Client Name'] || r['Client'] || 'N/A';
    const profileName = r['Profile Name'] || r['Profile'] || 'N/A';
    const note = r['Special Notes'] || r['Note'] || 'N/A';

    // Extract employee names (e.g., "Refayet/CC" -> ["refayet"], "Ashfak/Sajjad/CC" -> ["ashfak", "sajjad"])
    const cleanAssign = assignRaw.replace(/\/(cc|cm|cw)/gi, '').trim();
    const names = cleanAssign.split('/').map(n => n.trim()).filter(n => n.length > 0);

    for (const empName of names) {
      const empLower = empName.toLowerCase();

      // Check hash
      const rawString = `${clientName}|${profileName}|${assignRaw}|${empLower}`;
      const issueHash = crypto.createHash('md5').update(rawString).digest('hex');

      if (!notifiedSet.has(issueHash)) {
        // Resolve Telegram mention tag
        const mentionTag = userMentionsMap[empLower] || `@${empName}`;

        const otherNames = names.filter(n => n.toLowerCase() !== empLower);
        let clientDisplay = clientName;
        if (otherNames.length > 0) {
          clientDisplay += ` (+${otherNames.join(',')})`;
        }

        const noteLower = note.toLowerCase().trim();
        const noteDisplay = (noteLower && noteLower !== 'need to check' && noteLower !== 'n/a')
          ? `\n🚨 <b>Special Note:</b> ${note}`
          : '';

        const msg = [
          `⚡ <b>NEW ISSUE ASSIGNED!</b> ⚡\n`,
          `👤 <b>Assignee:</b> ${empName} (${mentionTag})`,
          `🏢 <b>Client:</b> ${clientDisplay}${noteDisplay}\n`,
          `<i>Automated Alert | Code Commandos Hub</i>`
        ].join('\n');

        let sentSuccess = false;
        for (const chatId of groupChatIds) {
          try {
            await sendTelegramMessage(chatId, msg, 'HTML');
            sentSuccess = true;
          } catch (err: any) {
            console.error(`Error sending Telegram alert to ${chatId}:`, err.message);
          }
        }

        if (sentSuccess) {
          notifiedSet.add(issueHash);
          newNotifiedCount++;

          logsToAppend.push({
            timestamp: new Date(),
            clientName,
            assignee: empName,
            mention: mentionTag,
            status: 'sent',
            message: `Notified for client ${clientName}`
          });
        }
      }
    }
  }

  // Update DB with new notified hashes and timestamp
  config.notifiedIssueHashes = Array.from(notifiedSet);
  config.lastCheckedAt = new Date();
  if (logsToAppend.length > 0) {
    config.notificationLogs = [...logsToAppend, ...(config.notificationLogs || [])].slice(0, 50);
  }
  await config.save();

  return {
    success: true,
    newIssuesNotified: newNotifiedCount,
    lastCheckedAt: config.lastCheckedAt,
    message: newNotifiedCount > 0 ? `Alerted ${newNotifiedCount} new CC issue(s).` : 'No new CC issues found.'
  };
}

export async function sendCCSummaryReport(title?: string, banner?: string) {
  await connectToDatabase();
  const config = await TelegramConfig.findOne({});
  if (!config || !config.groupChatIds || config.groupChatIds.length === 0) {
    return { success: false, message: 'No Group Chat IDs configured' };
  }

  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1ic9UMVX0FFsAyz0TZ-_lGKj_D9NornoGhq38KTRtM54/export?format=csv&gid=1412843338';
  const response = await fetch(sheetUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch spreadsheet');

  const csvText = await response.text();
  const rows = parseCSVRows(csvText);

  const ccRows = rows.filter(r => {
    const assign = getAssignNameFromRow(r);
    return assign && /\/cc/i.test(assign);
  });

  const customTitle = title || '📋 <b>CURRENT PENDING /CC ISSUES REPORT</b> 📋';
  const customBanner = banner || '📢 <i>Please review and resolve all assigned issues.</i>';

  if (ccRows.length === 0) {
    const emptyMsg = `${customTitle}\n\n${customBanner}\n\n🎉 <i>No pending /CC issues found right now! Great job team!</i>`;
    for (const cid of config.groupChatIds) {
      await sendTelegramMessage(cid, emptyMsg, 'HTML');
    }
    return { success: true, count: 0 };
  }

  const rawMentions = config.userMentions;
  const userMentionsMap: Record<string, string> = {};
  if (rawMentions instanceof Map) {
    rawMentions.forEach((val, key) => { userMentionsMap[key.toLowerCase()] = val; });
  } else if (rawMentions && typeof rawMentions === 'object') {
    Object.entries(rawMentions).forEach(([key, val]) => { userMentionsMap[key.toLowerCase()] = String(val); });
  }

  const grouped: Record<string, any[]> = {};
  const mentionsToTag = new Set<string>();

  for (const r of ccRows) {
    const assignRaw = getAssignNameFromRow(r);
    const cleanAssign = assignRaw.replace(/\/(cc|cm|cw)/gi, '').trim();
    const names = cleanAssign.split('/').map(n => n.trim()).filter(n => n.length > 0);
    for (const name of names) {
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(r);
      const tag = userMentionsMap[name.toLowerCase()] || `@${name}`;
      mentionsToTag.add(tag);
    }
  }

  let text = `${customTitle}\n\n${customBanner}\n\n`;
  if (mentionsToTag.size > 0) {
    text += `🔔 <b>Attention Team:</b> ${Array.from(mentionsToTag).join(' ')}\n`;
  }
  text += `--------------------------------------------------\n\n`;

  const THEMES = ["🔴", "🔵", "🟢", "🟠", "🟣", "🟤", "⚫", "⚪"];
  let idx = 0;

  for (const [empName, issues] of Object.entries(grouped)) {
    const theme = THEMES[idx % THEMES.length];
    const mention = userMentionsMap[empName.toLowerCase()] || `@${empName}`;
    text += `${theme} <b>Assignee: ${empName} (${mention})</b> <i>(Total: ${issues.length})</i>\n<blockquote>`;

    issues.forEach((iss, i) => {
      const clientName = iss["Client's Name"] || iss['Client Name'] || iss['Client'] || 'N/A';
      const note = iss['Special Notes'] || iss['Note'] || 'N/A';
      text += `👤 <b>Client: ${clientName}</b>\n`;
      if (note && note.toLowerCase() !== 'need to check' && note.toLowerCase() !== 'n/a') {
        text += `🚨 <b>Note: ${note}</b>\n`;
      }
      if (i < issues.length - 1) text += `〰️〰️〰️\n`;
    });

    text += `</blockquote>\n\n`;
    idx++;
  }

  for (const cid of config.groupChatIds) {
    await sendTelegramMessage(cid, text, 'HTML');
  }

  return { success: true, count: ccRows.length };
}
