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
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [syncingSubscribers, setSyncingSubscribers] = useState(false);
  const [newSubId, setNewSubId] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubTag, setNewSubTag] = useState('');

  // Broadcast Console state
  const [targetChatId, setTargetChatId] = useState('all');
  const [customMessage, setCustomMessage] = useState('');
  const [isSummaryReport, setIsSummaryReport] = useState(false);

  const fetchSubscribers = async () => {
    try {
      const res = await fetch('/api/telegram/subscribers');
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.subscribers || []);
      }
    } catch (e) {
      console.error("Error fetching subscribers:", e);
    }
  };

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
        fetchSubscribers();
      } else {
        toast.error(data.error || 'Failed to load Telegram configuration');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error fetching Telegram config');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSubscribers = async () => {
    setSyncingSubscribers(true);
    try {
      const res = await fetch('/api/telegram/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Synced! ${data.newSubscribersCount || 0} new user(s) & ${data.newGroupsCount || 0} group(s) discovered.`);
        setSubscribers(data.subscribers || []);
      } else {
        toast.error(data.error || 'Failed to sync updates');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error syncing updates');
    } finally {
      setSyncingSubscribers(false);
    }
  };

  const handleAddSubscriber = async () => {
    if (!newSubId.trim()) {
      toast.error('Please enter a Telegram User ID or Chat ID');
      return;
    }
    try {
      const res = await fetch('/api/telegram/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramUserId: newSubId.trim(),
          firstName: newSubName.trim(),
          username: newSubTag.trim().replace(/^@/, '')
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Subscriber added successfully!');
        setNewSubId('');
        setNewSubName('');
        setNewSubTag('');
        fetchSubscribers();
      } else {
        toast.error(data.error || 'Failed to add subscriber');
      }
    } catch (err: any) {
      toast.error('Failed to add subscriber');
    }
  };

  const handleDeleteSubscriber = async (telegramUserId: string) => {
    if (!confirm(`Are you sure you want to remove subscriber ${telegramUserId}?`)) return;
    try {
      const res = await fetch(`/api/telegram/subscribers?id=${telegramUserId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Subscriber removed');
        fetchSubscribers();
      } else {
        toast.error(data.error || 'Failed to delete subscriber');
      }
    } catch (e) {
      toast.error('Failed to delete subscriber');
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

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberHandle, setNewMemberHandle] = useState('');

  const handleAddMember = () => {
    const nameKey = newMemberName.trim().toLowerCase();
    let handleVal = newMemberHandle.trim();
    if (!nameKey || !handleVal) {
      toast.error('Please enter both Member Name and Telegram Handle (@tag)');
      return;
    }
    if (!handleVal.startsWith('@')) {
      handleVal = `@${handleVal}`;
    }

    const updated = {
      ...userMentions,
      [nameKey]: handleVal
    };
    setUserMentions(updated);
    setNewMemberName('');
    setNewMemberHandle('');
    handleSaveSettings(undefined, updated);
    toast.success(`Added member ${nameKey} (${handleVal})`);
  };

  const handleRemoveMember = (memberKey: string) => {
    if (!confirm(`Are you sure you want to remove ${memberKey} from Telegram mentions?`)) return;
    const updated = { ...userMentions };
    delete updated[memberKey];
    setUserMentions(updated);
    handleSaveSettings(undefined, updated);
    toast.success(`Removed member ${memberKey}`);
  };

  const handleSendTestMention = async (memberName: string, mentionTag: string) => {
    if (groupChatIds.length === 0) {
      toast.error('No Group Chat IDs configured yet!');
      return;
    }
    const testMsg = `🧪 <b>TELEGRAM MENTION TEST DISPATCH</b> 🧪\n\nHello ${memberName} (${mentionTag})! This is a test mention alert dispatched from Code Commandos Hub Admin Console.`;
    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetChatId: 'all', message: testMsg })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Sent test mention for ${memberName} (${mentionTag})!`);
      } else {
        toast.error(data.error || 'Failed to send test mention');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send test mention');
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
              <div className="flex items-center gap-2 flex-wrap">
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

                {/* Auto Alert Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const newVal = !autoAlertsEnabled;
                    setAutoAlertsEnabled(newVal);
                    handleSaveSettings(undefined, undefined, newVal);
                  }}
                  className={`px-3 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                    autoAlertsEnabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                  title="Toggle Automatic Telegram Alerts"
                >
                  {autoAlertsEnabled ? '● Auto-Alerts ON' : '○ Auto-Alerts OFF'}
                </button>
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

        {/* Scheduled Daily Alert Manual Triggers */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <div className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">
            Daily Scheduled Reports Manual Triggers (8 AM, 3 PM, 5 PM BD Time):
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                fetch('/api/telegram/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isSummaryReport: true, slotType: '8am' })
                }).then(res => res.json()).then(d => d.success ? toast.success('Sent 8 AM Morning Alert!') : toast.error('Failed to send'));
              }}
              className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold hover:bg-amber-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              🌅 Send 8 AM Morning Alert
            </button>

            <button
              onClick={() => {
                fetch('/api/telegram/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isSummaryReport: true, slotType: '3pm' })
                }).then(res => res.json()).then(d => d.success ? toast.success('Sent 3 PM Afternoon Alert!') : toast.error('Failed to send'));
              }}
              className="px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-bold hover:bg-blue-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              ☀️ Send 3 PM Afternoon Alert
            </button>

            <button
              onClick={() => {
                fetch('/api/telegram/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isSummaryReport: true, slotType: '5pm' })
                }).then(res => res.json()).then(d => d.success ? toast.success('Sent 5 PM End-of-Day Alert!') : toast.error('Failed to send'));
              }}
              className="px-3 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold hover:bg-purple-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              🌆 Send 5 PM End-of-Day Alert
            </button>

            <button
              onClick={() => {
                fetch('/api/telegram/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isSummaryReport: true, slotType: 'congrats' })
                }).then(res => res.json()).then(d => d.success ? toast.success('Sent Congratulations Alert!') : toast.error('Failed to send'));
              }}
              className="px-3 py-1.5 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg text-xs font-bold hover:bg-green-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              🎉 Send Congrats (0 Issues)
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-400" /> CC Team Member Mentions & Handles ({Object.keys(userMentions).length})
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Add, update, or remove member names and Telegram `@handle` tags for automated mention alerts.
              </p>
            </div>

            <button
              onClick={handleSaveMentions}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-green-600/20 shrink-0"
            >
              <Save className="w-4 h-4" /> Save All Handles
            </button>
          </div>

          {/* Add New Member Inline Form */}
          <div className="p-4 bg-black/40 border border-glass-border rounded-xl space-y-2">
            <span className="text-xs font-bold text-gray-300 block">Add New Team Member Handle:</span>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                type="text"
                placeholder="Member Name (e.g. Sumon)"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="sm:col-span-2 px-3 py-2 bg-black/60 border border-glass-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              />
              <input
                type="text"
                placeholder="Telegram Tag (e.g. @sumon_cc)"
                value={newMemberHandle}
                onChange={(e) => setNewMemberHandle(e.target.value)}
                className="sm:col-span-2 px-3 py-2 bg-black/60 border border-glass-border rounded-xl text-xs text-green-400 font-mono placeholder-gray-500 focus:outline-none focus:border-green-500"
              />
              <button
                type="button"
                onClick={handleAddMember}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Member
              </button>
            </div>
          </div>

          {/* Member Mappings Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
            {Object.keys(userMentions).length === 0 ? (
              <div className="col-span-full py-8 text-center text-gray-500 italic">
                No member handles configured. Use the form above to add team members.
              </div>
            ) : (
              Object.keys(userMentions).map((memberKey) => {
                const currentTag = userMentions[memberKey];
                return (
                  <div key={memberKey} className="space-y-1.5 bg-black/40 border border-glass-border p-3 rounded-xl relative group">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-white capitalize flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-green-400" /> {memberKey}
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendTestMention(memberKey, currentTag)}
                          className="text-[10px] font-extrabold text-blue-400 hover:text-blue-300 underline cursor-pointer"
                          title="Send test mention ping to Telegram group"
                        >
                          🧪 Test Ping
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(memberKey)}
                          className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                          title={`Remove ${memberKey}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => handleMentionChange(memberKey, e.target.value)}
                      placeholder="@telegram_handle"
                      className="w-full px-2.5 py-1.5 bg-black/60 border border-glass-border rounded-lg text-xs text-green-400 font-mono placeholder-gray-600 focus:outline-none focus:border-green-500"
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

        {/* 4. Registered Bot Subscribers Directory (1-on-1 Private DMs) */}
        <div className="bg-gray-900 border border-glass-border p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" /> Registered Bot Subscribers Directory ({subscribers.length})
                </h3>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-[10px] font-bold font-mono">
                  @code_commandos_bot Users
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Private 1-on-1 subscribers who have started or messaged <code>@code_commandos_bot</code> on Telegram.
              </p>
            </div>

            <button
              onClick={handleSyncSubscribers}
              disabled={syncingSubscribers}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingSubscribers ? 'animate-spin' : ''}`} />
              <span>{syncingSubscribers ? 'Syncing...' : 'Sync Bot Subscribers (/getUpdates)'}</span>
            </button>
          </div>

          {/* Add Subscriber Manual Form */}
          <div className="p-4 bg-black/40 border border-glass-border rounded-xl space-y-2">
            <span className="text-xs font-bold text-gray-300 block">Add / Register Individual User ID Manually:</span>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
              <input
                type="text"
                placeholder="Telegram User ID (e.g. 123456789)"
                value={newSubId}
                onChange={(e) => setNewSubId(e.target.value)}
                className="sm:col-span-2 px-3 py-2 bg-black/60 border border-glass-border rounded-xl text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="First Name (e.g. Refayet)"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                className="sm:col-span-2 px-3 py-2 bg-black/60 border border-glass-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Tag @ (optional)"
                value={newSubTag}
                onChange={(e) => setNewSubTag(e.target.value)}
                className="sm:col-span-1 px-3 py-2 bg-black/60 border border-glass-border rounded-xl text-xs text-blue-300 font-mono placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddSubscriber}
                className="sm:col-span-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-blue-600/20 flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300 border-collapse">
              <thead>
                <tr className="border-b border-glass-border text-gray-400 font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Telegram User ID</th>
                  <th className="py-2.5 px-3">First Name / Username</th>
                  <th className="py-2.5 px-3">Last Active</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 italic">
                      No individual bot subscribers found. Click "Sync Bot Subscribers (/getUpdates)" above or send <code>/start</code> to @code_commandos_bot.
                    </td>
                  </tr>
                ) : (
                  subscribers.map((sub) => (
                    <tr key={sub.telegramUserId} className="hover:bg-black/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-400 whitespace-nowrap">
                        {sub.telegramUserId}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-black text-blue-300">
                            {(sub.firstName || sub.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{sub.firstName || 'Telegram User'} {sub.lastName || ''}</span>
                            {sub.username && <span className="text-[10px] text-green-400 font-mono">@{sub.username}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-gray-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(sub.lastActiveAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-black uppercase">
                          Active DM
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => {
                            setTargetChatId(sub.telegramUserId);
                            toast.success(`Selected 1-on-1 DM target: ${sub.firstName || sub.telegramUserId}`);
                          }}
                          className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          💬 Send 1-on-1 DM
                        </button>
                        <button
                          onClick={() => handleDeleteSubscriber(sub.telegramUserId)}
                          className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded cursor-pointer"
                          title="Remove subscriber"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Broadcast & Custom Message Console */}
        <div className="bg-gray-900 border border-glass-border p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-400" /> Send Custom Telegram Message / Broadcast
          </h3>
          <p className="text-xs text-gray-400">
            Send custom announcements, preset client templates, 1-on-1 private DMs, or trigger daily issue summary reports directly from this dashboard.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300">Target Chat / User:</label>
              <select
                value={targetChatId}
                onChange={(e) => setTargetChatId(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-glass-border rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="all">🌐 All Group Chats ({groupChatIds.length})</option>
                <option value="all_subscribers">📣 All Subscribed Individual Users (Global DM Broadcast) ({subscribers.length})</option>

                {groupChatIds.length > 0 && (
                  <optgroup label="👥 Registered Telegram Groups">
                    {groupChatIds.map(cid => (
                      <option key={cid} value={cid}>Group ID: {cid}</option>
                    ))}
                  </optgroup>
                )}

                {subscribers.length > 0 && (
                  <optgroup label="👤 Individual 1-on-1 Direct Messages (DMs)">
                    {subscribers.map(sub => (
                      <option key={sub.telegramUserId} value={sub.telegramUserId}>
                        👤 {sub.firstName || 'User'} {sub.username ? `(@${sub.username})` : ''} [ID: {sub.telegramUserId}]
                      </option>
                    ))}
                  </optgroup>
                )}
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

        <div className="space-y-3">
          <textarea
            rows={4}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Type your message here (supports HTML formatting: <b>bold</b>, <i>italic</i>, <code>code</code>)..."
            className="w-full px-4 py-3 bg-black/50 border border-glass-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
          />

          {customMessage && (
            <div className="p-3 bg-black/70 border border-blue-500/30 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Live Telegram Message HTML Preview:</span>
              <div 
                className="text-xs text-gray-200 font-mono whitespace-pre-wrap leading-relaxed"
                dangerouslySetInnerHTML={{ __html: customMessage }}
              />
            </div>
          )}

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
