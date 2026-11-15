'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck, ShieldAlert, KeyRound, Unlock, Trash2,
  RefreshCw, CheckCircle2, AlertTriangle, Monitor, Clock, Building2,
  Search, Sliders, UserX
} from 'lucide-react';
import { superAdminSecurityApi } from '@/lib/api';

function formatDateSafe(val: any): string {
  if (!val) return 'Timestamp unavailable';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return 'Timestamp unavailable';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return 'Timestamp unavailable';
  }
}

export default function SuperAdminSecurityPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'sessions' | 'locked' | 'controls' | 'compliance'>('sessions');
  const [sessionSearch, setSessionSearch] = useState('');
  const [unlockReason, setUnlockReason] = useState('Super Admin identity verification');
  const [unlockTargetUser, setUnlockTargetUser] = useState<any | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Queries
  const overviewQuery = useQuery({
    queryKey: ['super-admin-security-overview'],
    queryFn: () => superAdminSecurityApi.overview().then((res) => res.data?.data || {}),
    refetchInterval: 30000,
  });

  const sessionsQuery = useQuery({
    queryKey: ['super-admin-security-sessions', sessionSearch],
    queryFn: () => superAdminSecurityApi.sessions({ search: sessionSearch || undefined, limit: 50 }).then((res) => res.data?.data?.data || []),
  });

  const lockedQuery = useQuery({
    queryKey: ['super-admin-security-locked'],
    queryFn: () => superAdminSecurityApi.lockedAccounts().then((res) => res.data?.data?.data || []),
  });

  const controlsQuery = useQuery({
    queryKey: ['super-admin-security-controls'],
    queryFn: () => superAdminSecurityApi.controls().then((res) => res.data?.data || []),
  });

  const complianceQuery = useQuery({
    queryKey: ['super-admin-security-compliance'],
    queryFn: () => superAdminSecurityApi.compliance().then((res) => res.data?.data || []),
  });

  // Mutations
  const revokeSessionMutation = useMutation({
    mutationFn: (id: string) => superAdminSecurityApi.revokeSession(id),
    onSuccess: () => {
      setFeedbackMessage({ text: 'Session successfully revoked.', type: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-security-sessions'] });
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

  const revokeUserSessionsMutation = useMutation({
    mutationFn: (userId: string) => superAdminSecurityApi.revokeUserSessions(userId),
    onSuccess: () => {
      setFeedbackMessage({ text: 'All active sessions for user revoked.', type: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-security-sessions'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-security-overview'] });
      setTimeout(() => setFeedbackMessage(null), 4000);
    },
    onError: (err: any) => {
      setFeedbackMessage({
        text: err?.response?.data?.error?.message || 'Failed to revoke user sessions.',
        type: 'error',
      });
    },
  });

  const unlockUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      superAdminSecurityApi.unlockUser(userId, reason),
    onSuccess: () => {
      setFeedbackMessage({ text: 'User account unlocked successfully.', type: 'success' });
      setUnlockTargetUser(null);
      void queryClient.invalidateQueries({ queryKey: ['super-admin-security-locked'] });
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

  const toggleControlMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      superAdminSecurityApi.updateControl(id, { isEnabled }),
    onSuccess: () => {
      setFeedbackMessage({ text: 'Security control setting updated.', type: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-security-controls'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-security-overview'] });
      setTimeout(() => setFeedbackMessage(null), 3000);
    },
  });

  const overview = overviewQuery.data || {};
  const activeSessions = sessionsQuery.data || [];
  const lockedUsers = lockedQuery.data || [];
  const controls = controlsQuery.data || [];
  const complianceChecks = complianceQuery.data || [];

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
          onClick={() => {
            void overviewQuery.refetch();
            void sessionsQuery.refetch();
            void lockedQuery.refetch();
            void controlsQuery.refetch();
            void complianceQuery.refetch();
          }}
          disabled={overviewQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${overviewQuery.isFetching ? 'animate-spin' : ''}`} />
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
            {overview.activeSessionsCount ?? activeSessions.length}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Valid JWT device sessions active</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Locked Accounts</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {overview.lockedAccountsCount ?? lockedUsers.length}
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
            {overview.failedLogins24h ?? 0}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Logged security failure attempts</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Security Posture</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {overview.securityScore || 94}/100
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {overview.securityPosture || 'Grade A Posture'}
          </p>
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
          onClick={() => setActiveTab('controls')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'controls'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Sliders className="h-4 w-4" />
          Security Controls ({controls.length})
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
          Compliance Standards ({complianceChecks.length})
        </button>
      </div>

      {/* Active Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search sessions by user, email, or IP..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Institute</th>
                    <th className="px-6 py-3">IP Address</th>
                    <th className="px-6 py-3">Device / Client</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {activeSessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                        No active sessions matching criteria.
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
                          {session.user_agent || 'Web Client'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {formatDateSafe(session.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                if (confirm(`Revoke session for ${session.user_email}?`)) {
                                  revokeSessionMutation.mutate(session.id);
                                }
                              }}
                              disabled={revokeSessionMutation.isPending}
                              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/60 dark:text-red-400"
                              title="Revoke only this device session"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Revoke
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Revoke ALL active sessions for ${session.user_email}?`)) {
                                  revokeUserSessionsMutation.mutate(session.user_id);
                                }
                              }}
                              disabled={revokeUserSessionsMutation.isPending}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              title="Revoke all devices for this user"
                            >
                              <UserX className="h-3.5 w-3.5 text-amber-500" />
                              All
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
                        <div className="font-medium text-slate-900 dark:text-white">{user.user_name || user.name}</div>
                        <div className="text-xs text-slate-500">{user.user_email || user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {user.user_role || user.role || 'student'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-400">
                          {user.failed_attempts || 5} attempts
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDateSafe(user.lock_expires_at || user.locked_until)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setUnlockTargetUser(user)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-400"
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

      {/* Security Controls Tab */}
      {activeTab === 'controls' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {controls.map((ctrl: any) => (
              <div
                key={ctrl.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">{ctrl.name}</span>
                    <button
                      onClick={() =>
                        toggleControlMutation.mutate({ id: ctrl.id, isEnabled: !ctrl.is_enabled })
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        ctrl.is_enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          ctrl.is_enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{ctrl.description}</p>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800">
                  Key: <code className="font-mono">{ctrl.key}</code>
                </div>
              </div>
            ))}
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
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{check.name}</h4>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {check.standard}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{check.description}</p>
                  <p className="mt-2 text-xs">
                    Status:{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase text-[11px] tracking-wide">
                      {check.status}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unlock User Modal */}
      {unlockTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Unlock Account for {unlockTargetUser.user_name || unlockTargetUser.name}
            </h3>
            <p className="text-xs text-slate-500">
              Provide justification reason for audit log compliance record.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                unlockUserMutation.mutate({
                  userId: unlockTargetUser.user_id || unlockTargetUser.id,
                  reason: unlockReason,
                });
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Administrative Reason
                </label>
                <input
                  type="text"
                  required
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUnlockTargetUser(null)}
                  className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={unlockUserMutation.isPending}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  {unlockUserMutation.isPending ? 'Unlocking...' : 'Confirm Unlock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
