'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Bell, Send, CheckCircle2,
  Radio, ExternalLink, Info
} from 'lucide-react';
import { superAdminNotificationsApi } from '@/lib/api';

export default function SuperAdminNotificationsPage() {
  const [targetAudience, setTargetAudience] = useState<'all' | 'institution_admin' | 'institution_student' | 'general_student'>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [broadcastHistory, setBroadcastHistory] = useState<Array<{
    id: string;
    targetAudience: string;
    title: string;
    message: string;
    recipientsCount: number;
    sentAt: string;
  }>>([
    {
      id: 'b-1',
      targetAudience: 'all',
      title: 'Scheduled Maintenance Notice',
      message: 'Platform maintenance window scheduled for Saturday at 02:00 UTC for database upgrades.',
      recipientsCount: 420,
      sentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'b-2',
      targetAudience: 'institution_admin',
      title: 'New Semester Enrollment Enabled',
      message: 'Batch creation and student semester enrollments are now live for the upcoming academic cycle.',
      recipientsCount: 45,
      sentAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ]);

  const broadcastMutation = useMutation({
    mutationFn: (data: { targetAudience: 'all' | 'institution_admin' | 'institution_student' | 'general_student'; title: string; message: string; actionUrl?: string }) =>
      superAdminNotificationsApi.broadcast(data),
    onSuccess: (res) => {
      const recipients = res.data?.data?.recipientsCount ?? 0;
      setStatusMessage({
        text: `Broadcast sent successfully to ${recipients} platform users.`,
        type: 'success',
      });
      // Append to local broadcast history
      setBroadcastHistory((prev) => [
        {
          id: `b-${Date.now()}`,
          targetAudience,
          title,
          message,
          recipientsCount: recipients,
          sentAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setTitle('');
      setMessage('');
      setActionUrl('');
      setTimeout(() => setStatusMessage(null), 5000);
    },
    onError: (err: any) => {
      setStatusMessage({
        text: err?.response?.data?.error?.message || 'Failed to dispatch broadcast notification.',
        type: 'error',
      });
    },
  });

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    if (
      confirm(
        `Are you sure you want to broadcast this notification to target: "${targetAudience.toUpperCase()}"? This will deliver notifications to all matching active accounts immediately.`
      )
    ) {
      broadcastMutation.mutate({
        targetAudience,
        title: title.trim(),
        message: message.trim(),
        actionUrl: actionUrl.trim() || undefined,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            System Notifications & Broadcasts
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Dispatch urgent platform alerts, maintenance notices, and targeted announcements to platform users
          </p>
        </div>
      </div>

      {/* Status Feedback */}
      {statusMessage && (
        <div
          className={`rounded-lg border p-4 text-sm font-medium ${
            statusMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Broadcast Form and Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Composer Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
            <Radio className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Compose Platform Broadcast
            </h2>
          </div>

          <form onSubmit={handleBroadcast} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Target Audience
              </label>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { value: 'all', label: 'All Users' },
                  { value: 'institution_admin', label: 'Institute Admins' },
                  { value: 'institution_student', label: 'Students Only' },
                  { value: 'general_student', label: 'General Users' },
                ].map((aud) => (
                  <button
                    key={aud.value}
                    type="button"
                    onClick={() => setTargetAudience(aud.value as any)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      targetAudience === aud.value
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {aud.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Notification Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Critical Security Update: Please Verify Accounts"
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Message Content
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Explain the alert, upcoming schedule change, or action required by recipients..."
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Action URL (Optional Link)
              </label>
              <input
                type="text"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="e.g. /dashboard or https://codemitra.dev/releases"
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-xs text-slate-500">
                Notifications are written directly to recipient inboxes.
              </span>
              <button
                type="submit"
                disabled={broadcastMutation.isPending || !title.trim() || !message.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {broadcastMutation.isPending ? 'Broadcasting...' : 'Send Broadcast'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Card */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Notification Card Preview
            </h3>
            <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-indigo-600 p-2 text-white shadow-sm">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {title || 'Sample Notification Title'}
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {message || 'Your notification body preview will render here as users will see it in their notification feed.'}
                  </p>
                  {actionUrl && (
                    <div className="mt-2.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        View details <ExternalLink className="h-3 w-3" />
                      </span>
                    </div>
                  )}
                  <span className="mt-2 block text-[10px] text-slate-400">Just now</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Info className="h-4 w-4 text-indigo-500" />
              Delivery Channels
            </div>
            <ul className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> In-App Notification Tray
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Role-based Audience Filtering
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Tamper-evident Audit Logging
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent Broadcast History</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit record of platform-wide broadcasts sent to users
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">Title & Message</th>
                <th className="px-6 py-3">Audience</th>
                <th className="px-6 py-3">Recipients</th>
                <th className="px-6 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {broadcastHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">{item.title}</div>
                    <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">{item.message}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {item.targetAudience.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {item.recipientsCount.toLocaleString()}
                    </span>{' '}
                    <span className="text-xs text-slate-500">users</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(item.sentAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

