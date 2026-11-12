'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Flag, CheckCircle2,
  RefreshCw, ToggleLeft, ToggleRight, Tag, Sliders
} from 'lucide-react';
import { configurationApi } from '@/lib/api';

export default function SuperAdminReleasesPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const flagsQuery = useQuery({
    queryKey: ['super-admin-feature-flags'],
    queryFn: () => configurationApi.getFeatureFlags().then((res) => res.data?.data || []),
  });

  const updateFlagMutation = useMutation({
    mutationFn: ({ key, data }: { key: string; data: { isEnabled?: boolean; rolloutPercent?: number } }) =>
      configurationApi.updateFeatureFlag(key, data),
    onSuccess: () => {
      setFeedback({ text: 'Feature flag updated successfully.', type: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-feature-flags'] });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({
        text: err?.response?.data?.error?.message || 'Failed to update feature flag.',
        type: 'error',
      });
    },
  });

  const flags: any[] = flagsQuery.data || [];
  const enabledCount = flags.filter((f) => f.is_enabled).length;
  const canaryCount = flags.filter((f) => f.is_enabled && f.rollout_percent < 100).length;

  const handleToggle = (flag: any) => {
    updateFlagMutation.mutate({
      key: flag.flag_key,
      data: { isEnabled: !flag.is_enabled },
    });
  };

  const handleRolloutChange = (flag: any, percent: number) => {
    updateFlagMutation.mutate({
      key: flag.flag_key,
      data: { rolloutPercent: percent },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Feature Flags & Release Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Control live platform capabilities, canary percentage rollouts, and view release deployments
          </p>
        </div>
        <button
          onClick={() => flagsQuery.refetch()}
          disabled={flagsQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${flagsQuery.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`rounded-lg border p-4 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Feature Flags</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Flag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {flags.length}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Managed toggles</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Active / Enabled</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {enabledCount}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Live in production</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Canary Gradual Rollouts</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Sliders className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-purple-600 dark:text-purple-400">
            {canaryCount}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Partial percentage rollout</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Current Release</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Tag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            v2.4.0
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Production release build</p>
        </div>
      </div>

      {/* Feature Flags Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Live Feature Flags</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dynamically toggle features without requiring a full code redeployment
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">Feature Name & Flag Key</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Rollout %</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {flags.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                    No feature flags configured in the database.
                  </td>
                </tr>
              ) : (
                flags.map((flag: any) => (
                  <tr key={flag.flag_key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{flag.name}</div>
                      <div className="font-mono text-xs text-slate-500">{flag.flag_key}</div>
                    </td>
                    <td className="max-w-md px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                      {flag.description || 'Controls availability of this platform subsystem.'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="10"
                          value={flag.rollout_percent ?? 100}
                          onChange={(e) => handleRolloutChange(flag, Number(e.target.value))}
                          disabled={!flag.is_enabled || updateFlagMutation.isPending}
                          className="w-24 accent-indigo-600 disabled:opacity-30"
                        />
                        <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                          {flag.rollout_percent ?? 100}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {flag.is_enabled ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggle(flag)}
                        disabled={updateFlagMutation.isPending}
                        className={`rounded-full p-1 transition ${
                          flag.is_enabled
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                        title={flag.is_enabled ? 'Click to disable' : 'Click to enable'}
                      >
                        {flag.is_enabled ? (
                          <ToggleRight className="h-7 w-7" />
                        ) : (
                          <ToggleLeft className="h-7 w-7" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Release Notes & Deployments */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Deployment & Release Log</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Changelog of recent platform releases and architectural milestones
        </p>

        <div className="mt-5 space-y-4">
          {[
            {
              version: 'v2.4.0',
              date: 'October 2026',
              type: 'Major Release',
              items: [
                'Full Super Admin platform module with 24 administration sections',
                'Multi-tenant institute student directory and admissions approvals hub',
                'Live system health monitoring with real PostgreSQL pool telemetry',
                'Immutable audit logs, active session revocation, and security posture controls',
              ],
            },
            {
              version: 'v2.3.1',
              date: 'September 2026',
              type: 'Feature Update',
              items: [
                'Judge0 sandbox code execution support for multi-language problems',
                'Advanced course analytics, student progress tracking, and leaderboard',
              ],
            },
          ].map((rel) => (
            <div
              key={rel.version}
              className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-800/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {rel.version}
                  </span>
                  <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {rel.type}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{rel.date}</span>
              </div>
              <ul className="mt-2.5 list-disc space-y-1 pl-5 text-xs text-slate-600 dark:text-slate-400">
                {rel.items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

