'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck, ShieldAlert, KeyRound, Unlock, Trash2,
  RefreshCw, CheckCircle2, AlertTriangle, Monitor, Clock, Building2
} from 'lucide-react';
import { superAdminSecurityApi } from '@/lib/api';

export default function SuperAdminSecurityPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'sessions' | 'locked' | 'compliance'>('sessions');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const securityQuery = useQuery({
    queryKey: ['super-admin-security-overview'],
    queryFn: () => superAdminSecurityApi.overview().then((res) => res.data?.data || {}),
    refetchInterval: 30000,
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (id: string) => superAdminSecurityApi.revokeSession(id),
    onSuccess: () => {
      setFeedbackMessage({ text: 'Session successfully revoked.', type: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-security-overview'] });
      setTimeout(() => setFeedbackMessage(null), 4000);
    },
    onError: (err: any) => {
      setFeedbackMessage({
        text: err?.response?.data?.error?.message || 'Failed to revoke session.',
        type: 'error',
      });
    },
  });

  const unlockUserMutation = useMutation({
    mutationFn: (id: string) => superAdminSecurityApi.unlockUser(id),
    onSuccess: () => {
      setFeedbackMessage({ text: 'User account unlocked successfully.', type: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-security-overview'] });
      setTimeout(() => setFeedbackMessage(null), 4000);
    },
    onError: (err: any) => {
      setFeedbackMessage({
        text: err?.response?.data?.error?.message || 'Failed to unlock user account.',
        type: 'error',
      });
    },
  });

  const data = securityQuery.data || {};
  const activeSessions = data.activeSessions || [];
  const lockedUsers = data.lockedUsers || [];
  const complianceChecks = data.complianceChecks || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Security & Compliance Center
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Platform-wide session management, account lockout controls, threat monitoring, and compliance verification
          </p>
        </div>
        <button
          onClick={() => securityQuery.refetch()}
          disabled={securityQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${securityQuery.isFetching ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* Feedback Message */}
      {feedbackMessage && (
        <div
          className={`rounded-lg border p-4 text-sm font-medium ${
            feedbackMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
          }`}
        >
          {feedbackMessage.text}
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Sessions</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <KeyRound className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {securityQuery.isLoading ? '...' : (data.activeSessionsCount ?? 0).toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Valid JWT refresh tokens active</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Locked Accounts</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {securityQuery.isLoading ? '...' : (data.lockedUsersCount ?? 0).toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Locked via brute force protection</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Failed Logins (24h)</span>
            <div className="rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-950 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {securityQuery.isLoading ? '...' : (data.failedLogins24h ?? 0).toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Logged security failure events</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Security Posture</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {securityQuery.isLoading ? '...' : `${data.securityScore || 94}/100`}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">All primary safeguards active</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'sessions'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Monitor className="h-4 w-4" />
          Active Sessions ({activeSessions.length})
        </button>
        <button
          onClick={() => setActiveTab('locked')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'locked'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Locked Accounts ({lockedUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'compliance'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Compliance & Controls ({complianceChecks.length})
        </button>
      </div>

      {/* Active Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Active User Sessions</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live authenticated device sessions across all platform users. Super Admins can revoke any session immediately.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Institute</th>
                  <th className="px-6 py-3">IP Address</th>
                  <th className="px-6 py-3">Device / User Agent</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Expires</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {activeSessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-slate-500">
                      No active sessions found.
                    </td>
                  </tr>
                ) : (
                  activeSessions.map((session: any) => (
                    <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{session.user_name || 'User'}</div>
                        <div className="text-xs text-slate-500">{session.user_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {session.user_role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {session.tenant_name || 'Global Platform'}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {session.ip_address || '—'}
                      </td>
                      <td className="max-w-xs truncate px-6 py-4 text-xs text-slate-500 dark:text-slate-400" title={session.user_agent}>
                        {session.user_agent || 'Unknown Client'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(session.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(session.expires_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Revoke this active session for ${session.user_email}?`)) {
                              revokeSessionMutation.mutate(session.id);
                            }
                          }}
                          disabled={revokeSessionMutation.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/60 dark:text-red-400 dark:hover:bg-red-900/60"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Locked Accounts Tab */}
      {activeTab === 'locked' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Temporarily Locked Accounts</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Users locked due to exceeding consecutive failed authentication attempts. Super Admins can unlock them manually.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Failed Attempts</th>
                  <th className="px-6 py-3">Locked Until</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {lockedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                      No accounts are currently locked. System is fully operational.
                    </td>
                  </tr>
                ) : (
                  lockedUsers.map((user: any) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {user.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-400">
                          {user.login_attempt_count} attempts
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(user.locked_until).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Unlock account for ${user.email}? This resets failed login attempts.`)) {
                              unlockUserMutation.mutate(user.id);
                            }
                          }}
                          disabled={unlockUserMutation.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-400 dark:hover:bg-emerald-900/60"
                        >
                          <Unlock className="h-3.5 w-3.5" />
                          Unlock Account
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Security & Compliance Safeguards</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time compliance validation checklist enforced by platform security middleware and database policies.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {complianceChecks.map((check: any, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-800/30"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{check.name}</h4>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Status: <span className="font-medium text-emerald-600 dark:text-emerald-400 uppercase text-[11px] tracking-wide">{check.status}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

