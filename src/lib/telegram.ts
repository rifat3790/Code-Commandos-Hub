import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import TelegramConfig from '@/models/TelegramConfig';
import TimelineItem from '@/models/TimelineItem';

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

  const strId = String(chatId).trim();
  const targetIdsToTry: string[] = [strId];
  if (strId.startsWith('-') && !strId.startsWith('-100')) {
    targetIdsToTry.push(`-100${strId.replace(/^-/, '')}`);
  } else if (!strId.startsWith('-')) {
    targetIdsToTry.push(`-${strId}`);
    targetIdsToTry.push(`-100${strId}`);
  }

  let lastError = 'Failed to send Telegram message';
  for (const tid of targetIdsToTry) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tid,
          text: text,
          parse_mode: parseMode,
          disable_web_page_preview: true
        })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        return data;
      }
      lastError = data.description || lastError;
    } catch (err: any) {
      lastError = err.message || lastError;
    }
  }

  throw new Error(lastError);
}

export async function sendTelegramPhoto(
  chatId: string | number,
  imageBase64: string,
  caption?: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
) {
  const token = getTelegramToken();
  const url = `https://api.telegram.org/bot${token}/sendPhoto`;

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const strId = String(chatId).trim();
  const targetIdsToTry: string[] = [strId];
  if (strId.startsWith('-') && !strId.startsWith('-100')) {
    targetIdsToTry.push(`-100${strId.replace(/^-/, '')}`);
  } else if (!strId.startsWith('-')) {
    targetIdsToTry.push(`-${strId}`);
    targetIdsToTry.push(`-100${strId}`);
  }

  let lastError = 'Failed to send Telegram photo';
  for (const tid of targetIdsToTry) {
    try {
      const formData = new FormData();
      formData.append('chat_id', tid);

      const blob = new Blob([buffer], { type: 'image/png' });
      formData.append('photo', blob, 'issues-table.png');

      if (caption) {
        formData.append('caption', caption);
        formData.append('parse_mode', parseMode);
      }

      const res = await fetch(url, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        return data;
      }
      lastError = data.description || lastError;
    } catch (err: any) {
      lastError = err.message || lastError;
    }
  }

  throw new Error(lastError);
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

export async function checkAndNotifyTimelines() {
  await connectToDatabase();
  const config = await getOrCreateTelegramConfig();
  const groupChatIds: string[] = config.groupChatIds || [];
  if (groupChatIds.length === 0) return;

  const rawMentions = config.userMentions;
  const userMentionsMap: Record<string, string> = { ...DEFAULT_USER_MENTIONS };
  if (rawMentions instanceof Map) {
    rawMentions.forEach((val, key) => { userMentionsMap[key.toLowerCase()] = val; });
  } else if (rawMentions && typeof rawMentions === 'object') {
    Object.entries(rawMentions).forEach(([key, val]) => { userMentionsMap[key.toLowerCase()] = String(val); });
  }

  const runningItems = await TimelineItem.find({ status: 'running' });
  const now = new Date().getTime();

  for (const item of runningItems) {
    const target = new Date(item.targetEndDate).getTime();
    const hoursLeft = (target - now) / (1000 * 60 * 60);
    const empLower = (item.memberName || '').toLowerCase();
    const mentionTag = userMentionsMap[empLower] || `@${item.memberName}`;
    const endDateStr = new Date(item.targetEndDate).toLocaleString();

    // 72 Hours Warning (Extension advice)
    if (hoursLeft <= 72 && hoursLeft > 48 && !item.notified72h) {
      const msg = [
        `⏳ <b>PROJECT TIMELINE WARNING (<= 72 Hours Left)</b> ⏳\n`,
        `👤 <b>Client:</b> ${item.clientName}`,
        `👥 <b>Assignee:</b> ${item.memberName} (${mentionTag})`,
        `⏳ <b>Time Remaining:</b> ${Math.round(hoursLeft)} Hours (Target: ${endDateStr})\n`,
        `⚠️ <i>Please check project progress and request a delivery date extension from the client if needed!</i>`
      ].join('\n');

      for (const cid of groupChatIds) {
        try { await sendTelegramMessage(cid, msg, 'HTML'); } catch (e) {}
      }

      item.notified72h = true;
      await item.save();
    }

    // 48 Hours Warning (Urgent Dangerous Critical Alert)
    if (hoursLeft <= 48 && !item.notified48h) {
      const msg = [
        `🚨 <b>DANGER WARNING: <= 48 HOURS DEADLINE CRITICAL!</b> 🚨\n`,
        `👤 <b>Client:</b> ${item.clientName}`,
        `👥 <b>Assignee:</b> ${item.memberName} (${mentionTag})`,
        `⏳ <b>Time Remaining:</b> ${Math.max(0, Math.round(hoursLeft))} Hours (Target: ${endDateStr})`,
        `🔥 <b>URGENT:</b> Immediate action required or request delivery extension!\n`,
        `⚠️ <i>High Priority Warning | Code Commandos Hub</i>`
      ].join('\n');

      for (const cid of groupChatIds) {
        try { await sendTelegramMessage(cid, msg, 'HTML'); } catch (e) {}
      }

      item.notified72h = true;
      item.notified48h = true;
      await item.save();
    }
  }
}

let isCheckingCCIssues = false;

export async function checkAndNotifyCCIssues() {
  if (isCheckingCCIssues) {
    return {
      success: true,
      message: 'An issue check is already in progress.',
      newIssuesNotified: 0
    };
  }

  isCheckingCCIssues = true;

  try {
    await connectToDatabase();
    const config = await getOrCreateTelegramConfig();

    if (config.autoAlertsEnabled === false) {
      return {
        success: true,
        message: 'Auto alerts are currently disabled in Telegram Bot config.',
        newIssuesNotified: 0
      };
    }

    const groupChatIds: string[] = Array.from(new Set((config.groupChatIds || []).map((id: string) => String(id).trim()).filter(Boolean)));
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

    // Calculate current BD Time (UTC+6)
    const now = new Date();
    const bdTime = new Date(now.getTime() + 6 * 60 * 60 * 1000); // UTC+6
    const todayStr = bdTime.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const currentHour = bdTime.getUTCHours();

    let sentScheduledReport = false;
    const sentSlots: string[] = (config.lastSummarySentDate === todayStr) ? (config.lastSummarySlots || []) : [];

    if (groupChatIds.length > 0) {
      if (currentHour >= 8 && currentHour < 15 && !sentSlots.includes('8am')) {
        await sendCCSummaryReport('8am');
        sentSlots.push('8am');
        sentScheduledReport = true;
      } else if (currentHour >= 15 && currentHour < 17 && !sentSlots.includes('3pm')) {
        await sendCCSummaryReport('3pm');
        sentSlots.push('3pm');
        sentScheduledReport = true;
      } else if (currentHour >= 17 && !sentSlots.includes('5pm')) {
        await sendCCSummaryReport('5pm');
        sentSlots.push('5pm');
        sentScheduledReport = true;
      }

      if (sentScheduledReport) {
        config.lastSummarySentDate = todayStr;
        config.lastSummarySlots = sentSlots;
        await config.save();
      }
    }

    // Also check project timelines for 72h & 48h warnings
    try {
      await checkAndNotifyTimelines();
    } catch (err) {
      console.error('Error checking timeline warnings:', err);
    }

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

      const clientName = (r["Client's Name"] || r['Client Name'] || r['Client'] || 'N/A').trim();
      const profileName = (r['Profile Name'] || r['Profile'] || 'N/A').trim();
      const note = (r['Special Notes'] || r['Note'] || 'N/A').trim();

      const cleanAssign = assignRaw.replace(/\/(cc|cm|cw)/gi, '').trim();
      const names = cleanAssign.split('/').map(n => n.trim()).filter(n => n.length > 0);

      for (const empName of names) {
        const empLower = empName.toLowerCase();
        const rawString = `${clientName.toLowerCase()}|${profileName.toLowerCase()}|${empLower}`;
        const issueHash = crypto.createHash('md5').update(rawString).digest('hex');

        if (!notifiedSet.has(issueHash)) {
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
      scheduledReportSent: sentScheduledReport,
      message: newNotifiedCount > 0 ? `Alerted ${newNotifiedCount} new CC issue(s).` : 'No new CC issues found.'
    };
  } finally {
    isCheckingCCIssues = false;
  }
}

export async function sendCCSummaryReport(slotType?: '8am' | '3pm' | '5pm' | 'congrats') {
  await connectToDatabase();
  const config = await getOrCreateTelegramConfig();
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

  const rawMentions = config.userMentions;
  const userMentionsMap: Record<string, string> = {};
  if (rawMentions instanceof Map) {
    rawMentions.forEach((val, key) => { userMentionsMap[key.toLowerCase()] = val; });
  } else if (rawMentions && typeof rawMentions === 'object') {
    Object.entries(rawMentions).forEach(([key, val]) => { userMentionsMap[key.toLowerCase()] = String(val); });
  }

  // If 0 active CC issues (or explicitly congrats requested)
  if (ccRows.length === 0 || slotType === 'congrats') {
    const congratsMsg = [
      `🎉 <b>CONGRATULATIONS TEAM! ALL ISSUES CLEARED!</b> 🎉\n`,
      `✨ <i>Outstanding work everyone! All pending /CC issues have been successfully resolved for today.</i>\n`,
      `🏆 <b>Daily Milestone Achieved:</b>`,
      `• <b>Status:</b> 100% Cleared (0 Pending Issues)`,
      `• <b>Team Effort:</b> Exceptional`,
      `• <b>Office Wrap-Up:</b> Ready to sign off!\n`,
      `<i>"Great teamwork turns challenges into achievements. Have a wonderful evening!"</i>\n`,
      `👏 <b>Kudos to Code Commandos Team!</b> 🚀`
    ].join('\n');

    for (const cid of config.groupChatIds) {
      await sendTelegramMessage(cid, congratsMsg, 'HTML');
    }
    return { success: true, count: 0, type: 'congrats' };
  }

  // Determine headers based on slot
  let customTitle = '📋 <b>CURRENT PENDING /CC ISSUES REPORT</b> 📋';
  let customBanner = '📢 <i>Please review and resolve all assigned issues.</i>';

  if (slotType === '8am') {
    customTitle = '🌅 <b>MORNING ISSUES ALERT (08:00 AM BD TIME)</b> 🌅';
    customBanner = '📢 <i>Good morning team! Please review and clear all your assigned issues for today.</i>';
  } else if (slotType === '3pm') {
    customTitle = '☀️ <b>AFTERNOON ISSUES UPDATE (03:00 PM BD TIME)</b> ☀️';
    customBanner = '⚠️ <i>Attention team! The following issues are still pending. Please resolve them as soon as possible.</i>';
  } else if (slotType === '5pm') {
    customTitle = '🌆 <b>END-OF-DAY FINAL ISSUES ALERT (05:00 PM BD TIME)</b> 🌆';
    customBanner = '🚨 <i>Final Reminder! The following issues are still pending. Everyone must clear all assigned issues before leaving the office today!</i>';
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
    text += `${theme} <b>Assignee: ${empName}</b> <i>(Total: ${issues.length})</i>\n<blockquote>`;

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

  return { success: true, count: ccRows.length, type: slotType || 'summary' };
}
