'use client';

import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Users, 
  MessageSquare, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  Clock, 
  Sparkles,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_USER_MENTIONS: Record<string, string> = {
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

const PRESET_MESSAGES = [
  {
    name: 'Payment Instructions',
    text: `To set up the payment method, please follow the instructions below:\n\nGo to Shopify Admin -> Settings -> Payments.\nOr check our video guide: https://docs.google.com/document/d/1shb2g9yXsYfxwzl2-i8McwZfDZ9TcazvkKLsblHHxZk/edit?usp=sharing`
  },
  {
    name: 'Followup Check',
    text: `Hi there,\n\nI hope you are doing well. Do you need any modifications, adjustments, or support from my side? Please let me know so we can proceed with delivery.`
  },
  {
    name: 'Delivery Notice',
    text: `Since I have completed all tasks, I am delivering this project to you. You get 30 days of ongoing support from our team!`
  },
  {
    name: 'Extension Request',
    text: `Hi there,\n\nSince the project delivery date is nearing and we need a bit more time for review, please accept the delivery date extension request. Thank you!`
  }
];

export default function TelegramBotTab() {
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [checkingIssues, setCheckingIssues] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const [botInfo, setBotInfo] = useState<any>(null);
  const [groupChatIds, setGroupChatIds] = useState<string[]>([]);
  const [newChatIdInput, setNewChatIdInput] = useState('');
  const [userMentions, setUserMentions] = useState<Record<string, string>>({});
  const [autoAlertsEnabled, setAutoAlertsEnabled] = useState(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [notificationLogs, setNotificationLogs] = useState<any[]>([]);

  // Broadcast Console state
  const [targetChatId, setTargetChatId] = useState('all');
  const [customMessage, setCustomMessage] = useState('');
  const [isSummaryReport, setIsSummaryReport] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/telegram/config');
      const data = await res.json();

      if (data.success) {
        setBotInfo(data.botInfo?.result || data.botInfo || null);
        setGroupChatIds(data.groupChatIds || []);
        setUserMentions(data.userMentions || {});
        setAutoAlertsEnabled(data.autoAlertsEnabled ?? true);
        setLastCheckedAt(data.lastCheckedAt || null);
        setNotificationLogs(data.notificationLogs || []);
      } else {
        toast.error(data.error || 'Failed to load Telegram configuration');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error fetching Telegram config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await fetch('/api/telegram/config');
      const data = await res.json();
      if (data.botInfo?.ok) {
        toast.success(`Connected as @${data.botInfo.result.username} (${data.botInfo.result.first_name})`);
        setBotInfo(data.botInfo.result);
      } else {
        toast.error(`Bot test failed: ${data.botInfo?.error || 'Invalid Token'}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Connection failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSettings = async (overrideGroupIds?: string[], overrideMentions?: Record<string, string>, overrideAutoAlerts?: boolean) => {
    try {
      const payload = {
        groupChatIds: overrideGroupIds ?? groupChatIds,
        userMentions: overrideMentions ?? userMentions,
        autoAlertsEnabled: overrideAutoAlerts ?? autoAlertsEnabled
      };

      const res = await fetch('/api/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Telegram settings saved successfully!');
      } else {
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving settings');
    }
  };

  const handleAddChatId = () => {
    const trimmed = newChatIdInput.trim();
    if (!trimmed) return;
    if (groupChatIds.includes(trimmed)) {
      toast.error('Chat ID already added!');
      return;
    }
    const updated = [...groupChatIds, trimmed];
    setGroupChatIds(updated);
    setNewChatIdInput('');
    handleSaveSettings(updated);
  };

  const handleRemoveChatId = (idToRemove: string) => {
    const updated = groupChatIds.filter(id => id !== idToRemove);
    setGroupChatIds(updated);
    handleSaveSettings(updated);
  };

  const handleMentionChange = (memberName: string, newMention: string) => {
    setUserMentions(prev => ({
      ...prev,
      [memberName]: newMention
    }));
  };

  const handleSaveMentions = () => {
    handleSaveSettings(undefined, userMentions);
  };

  const handleCheckIssuesNow = async () => {
    setCheckingIssues(true);
    try {
      const res = await fetch('/api/telegram/check-issues', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Checked sheet. ${data.newIssuesNotified || 0} new alert(s) sent.`);
        fetchConfig(); // Refresh logs & timestamps
      } else {
        toast.error(data.error || 'Failed to check sheet issues.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error checking sheet issues');
    } finally {
      setCheckingIssues(false);
    }
  };

  const handleSendCustomMessage = async () => {
    if (!customMessage.trim() && !isSummaryReport) {
      toast.error('Please enter a message to send');
      return;
    }

    setSendingMessage(true);
    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetChatId: targetChatId,
          message: customMessage,
          isSummaryReport: isSummaryReport
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Message sent successfully to ${data.deliveredCount || 1} chat(s)!`);
        setCustomMessage('');
        fetchConfig();
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send Telegram message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
        <span>Loading Telegram Bot configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Bot Connection & Status Card */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-blue-950/40 border border-blue-500/20 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center glow-blue shrink-0">
              <Bot className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">Telegram Alert Bot</h2>
                {botInfo?.username ? (
                  <span className="px-2.5 py-0.5 text-[11px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Online (@{botInfo.username})
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Token Configured
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Automated CC Team Issue Detector & Mention Dispatcher for Code Commandos Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="px-4 py-2 bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              {testingConnection ? 'Testing Connection...' : 'Test Bot Connection'}
            </button>
            <button
              onClick={handleCheckIssuesNow}
              disabled={checkingIssues}
              className="px-4 py-2 bg-green-600 border border-green-500 text-white hover:bg-green-500 rounded-xl text-xs font-bold shadow-lg shadow-green-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${checkingIssues ? 'animate-spin' : ''}`} />
              {checkingIssues ? 'Checking Sheet...' : 'Check New Issues Now'}
            </button>
          </div>
        </div>

        {lastCheckedAt && (
          <div className="text-[11px] text-gray-400 pt-2 border-t border-white/5 flex items-center justify-between">
            <span>Last Automated Sheet Check: <strong className="text-white">{new Date(lastCheckedAt).toLocaleString()}</strong></span>
            <span>Token Status: <code className="text-green-400 bg-black/40 px-2 py-0.5 rounded border border-green-500/20">Active (.env.local)</code></span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Registered Group Chat IDs */}
        <div className="bg-gray-900 border border-glass-border p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" /> Telegram Group Chat IDs
              </h3>
              <span className="text-xs text-gray-400">{groupChatIds.length} registered</span>
            </div>
            <p className="text-xs text-gray-400 pb-3">
              Add Telegram group chat IDs where issue alerts and daily warnings will be sent.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="e.g. -100123456789 or group ID"
                value={newChatIdInput}
                onChange={(e) => setNewChatIdInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChatId()}
                className="flex-1 px-3.5 py-2 bg-black/40 border border-glass-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddChatId}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-500 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add ID
              </button>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {groupChatIds.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-gray-800 rounded-xl text-xs text-gray-500">
                  No Group Chat IDs added yet. Please add your Telegram group chat ID above.
                </div>
              ) : (
                groupChatIds.map((cid) => (
                  <div key={cid} className="flex items-center justify-between p-2.5 bg-black/30 border border-glass-border rounded-xl text-xs">
                    <span className="font-mono text-purple-300 font-bold">{cid}</span>
                    <button
                      onClick={() => handleRemoveChatId(cid)}
                      className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                      title="Remove Chat ID"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl text-[11px] text-gray-300 space-y-1 mt-4">
            <span className="font-bold text-blue-400">💡 How to find your Group Chat ID:</span>
            <p className="text-gray-400">
              Add <code>@{botInfo?.username || 'bot'}</code> to your Telegram group as administrator. Send any message or use bot command to get your negative group ID (e.g. <code>-100...</code>).
            </p>
          </div>
        </div>

        {/* 3. CC Team Member Mention Mappings */}
        <div className="bg-gray-900 border border-glass-border p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-green-400" /> CC Team Member Mentions
            </h3>
            <button
              onClick={handleSaveMentions}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-green-600/20"
            >
              <Save className="w-3.5 h-3.5" /> Save Handles
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Map spreadsheet member names to their exact Telegram username tags for instant notification mentions.
          </p>

          <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
            {Object.keys(DEFAULT_USER_MENTIONS).map((memberKey) => (
              <div key={memberKey} className="space-y-1 bg-black/30 border border-glass-border p-2.5 rounded-xl">
                <label className="text-[11px] font-bold text-gray-300 capitalize">{memberKey}</label>
                <input
                  type="text"
                  value={userMentions[memberKey] ?? DEFAULT_USER_MENTIONS[memberKey]}
                  onChange={(e) => handleMentionChange(memberKey, e.target.value)}
                  placeholder="@telegram_handle"
                  className="w-full px-2.5 py-1.5 bg-black/50 border border-glass-border rounded-lg text-xs text-green-400 font-mono placeholder-gray-600 focus:outline-none focus:border-green-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Broadcast & Custom Message Console */}
      <div className="bg-gray-900 border border-glass-border p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-400" /> Send Custom Telegram Message / Broadcast
        </h3>
        <p className="text-xs text-gray-400">
          Send custom announcements, preset client templates, or trigger daily issue summary reports directly from this dashboard.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-300">Target Chat:</label>
            <select
              value={targetChatId}
              onChange={(e) => setTargetChatId(e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-glass-border rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Registered Group Chats ({groupChatIds.length})</option>
              {groupChatIds.map(cid => (
                <option key={cid} value={cid}>Group: {cid}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold text-gray-300">Quick Template Presets:</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_MESSAGES.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setCustomMessage(preset.text)}
                  className="px-2.5 py-1 bg-black/40 hover:bg-black/80 border border-glass-border text-gray-300 hover:text-white rounded-lg text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <FileText className="w-3 h-3 text-blue-400" />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <textarea
            rows={4}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Type your message here (supports HTML formatting: <b>bold</b>, <i>italic</i>, <code>code</code>)..."
            className="w-full px-4 py-3 bg-black/50 border border-glass-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isSummaryReport"
                checked={isSummaryReport}
                onChange={(e) => setIsSummaryReport(e.target.checked)}
                className="w-4 h-4 text-blue-500 rounded border-gray-700 bg-gray-900 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="isSummaryReport" className="text-xs text-gray-300 cursor-pointer">
                Send as <strong>Full CC Issues Summary Report</strong> (Ignores text box above)
              </label>
            </div>

            <button
              onClick={handleSendCustomMessage}
              disabled={sendingMessage}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${sendingMessage ? 'animate-bounce' : ''}`} />
              {sendingMessage ? 'Sending Message...' : 'Send Message Now'}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Notification Activity Log Table */}
      <div className="bg-gray-900 border border-glass-border p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" /> Recent Telegram Notification Logs
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300 border-collapse">
            <thead>
              <tr className="border-b border-glass-border text-gray-400 font-extrabold uppercase text-[10px]">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Assignee</th>
                <th className="py-2.5 px-3">Mention</th>
                <th className="py-2.5 px-3">Client</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {notificationLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    No notification logs recorded yet. Click "Check New Issues Now" to test.
                  </td>
                </tr>
              ) : (
                notificationLogs.slice(0, 15).map((log, index) => (
                  <tr key={index} className="hover:bg-black/20">
                    <td className="py-2.5 px-3 whitespace-nowrap text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">{log.assignee}</td>
                    <td className="py-2.5 px-3 font-mono text-green-400">{log.mention}</td>
                    <td className="py-2.5 px-3 text-gray-300">{log.clientName}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.status === 'sent' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
