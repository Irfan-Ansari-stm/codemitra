'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, Palette, HardDrive, Save, CheckCircle2, History
} from 'lucide-react';
import { configurationApi } from '@/lib/api';

export default function SuperAdminConfigurationPage() {
  const queryClient = useQueryClient();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [form, setForm] = useState({
    platformName: 'CodeMitra',
    tagline: 'Modern Multi-Tenant Coding & Education Platform',
    supportEmail: 'support@codemitra.local',
    primaryColor: '#2563eb',
    sessionTimeoutMinutes: 120,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    mfaEnforcedAdmins: false,
    maxUploadSizeMb: 25,
    rateLimitPerMinute: 120,
    logRetentionDays: 90,
  });

  const configQuery = useQuery({
    queryKey: ['super-admin-configs'],
    queryFn: () => configurationApi.getAll().then((res) => res.data?.data || {}),
  });

  const historyQuery = useQuery({
    queryKey: ['super-admin-configs-history'],
    queryFn: () => configurationApi.getHistory().then((res) => res.data?.data || []),
  });

  useEffect(() => {
    if (configQuery.data) {
      const data = configQuery.data;
      setForm((prev) => ({
        ...prev,
        platformName: data.branding?.['branding.platform_name'] || prev.platformName,
        tagline: data.branding?.['branding.tagline'] || prev.tagline,
        supportEmail: data.branding?.['branding.support_email'] || prev.supportEmail,
        primaryColor: data.branding?.['branding.primary_color'] || prev.primaryColor,
        sessionTimeoutMinutes: data.security?.['security.session_timeout_minutes'] ?? prev.sessionTimeoutMinutes,
        maxLoginAttempts: data.security?.['security.max_login_attempts'] ?? prev.maxLoginAttempts,
        lockoutDurationMinutes: data.security?.['security.lockout_duration_minutes'] ?? prev.lockoutDurationMinutes,
        mfaEnforcedAdmins: Boolean(data.security?.['security.mfa_enforced_admins'] ?? prev.mfaEnforcedAdmins),
        maxUploadSizeMb: data.system?.['system.max_upload_size_mb'] ?? prev.maxUploadSizeMb,
        rateLimitPerMinute: data.system?.['system.rate_limit_per_minute'] ?? prev.rateLimitPerMinute,
        logRetentionDays: data.system?.['system.log_retention_days'] ?? prev.logRetentionDays,
      }));
    }
  }, [configQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (updated: typeof form) => {
      const updates = [
        { key: 'branding.platform_name', value: updated.platformName },
        { key: 'branding.tagline', value: updated.tagline },
        { key: 'branding.support_email', value: updated.supportEmail },
        { key: 'branding.primary_color', value: updated.primaryColor },
        { key: 'security.session_timeout_minutes', value: Number(updated.sessionTimeoutMinutes) },
        { key: 'security.max_login_attempts', value: Number(updated.maxLoginAttempts) },
        { key: 'security.lockout_duration_minutes', value: Number(updated.lockoutDurationMinutes) },
        { key: 'security.mfa_enforced_admins', value: Boolean(updated.mfaEnforcedAdmins) },
        { key: 'system.max_upload_size_mb', value: Number(updated.maxUploadSizeMb) },
        { key: 'system.rate_limit_per_minute', value: Number(updated.rateLimitPerMinute) },
        { key: 'system.log_retention_days', value: Number(updated.logRetentionDays) },
      ];
      for (const item of updates) {
        await configurationApi.update(item.key, item.value);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-configs'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-configs-history'] });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Platform Configuration Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Global platform settings, identity branding, security thresholds, and system policies
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={15} /> Saved successfully!
            </span>
          )}
          <button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={14} />
            {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Section 1: Platform Branding */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <Palette size={16} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Identity & Branding</h2>
          </div>

          <div className="mt-4 space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Platform Name</label>
              <input
                type="text"
                value={form.platformName}
                onChange={(e) => setForm({ ...form, platformName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Platform Hero Tagline</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Public Support Email</label>
              <input
                type="email"
                value={form.supportEmail}
                onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Primary Accent Color (Hex)</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="h-9 w-12 cursor-pointer rounded border border-slate-200 p-1 dark:border-slate-800"
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-32 rounded-lg border border-slate-200 p-2.5 font-mono text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Security & Authentication Policies */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <Shield size={16} className="text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Security & Auth Policies</h2>
          </div>

          <div className="mt-4 space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Session Inactivity Timeout (Minutes)
              </label>
              <input
                type="number"
                value={form.sessionTimeoutMinutes}
                onChange={(e) => setForm({ ...form, sessionTimeoutMinutes: parseInt(e.target.value) || 60 })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Max Consecutive Failed Logins Before Lockout
              </label>
              <input
                type="number"
                value={form.maxLoginAttempts}
                onChange={(e) => setForm({ ...form, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Lockout Duration (Minutes)
              </label>
              <input
                type="number"
                value={form.lockoutDurationMinutes}
                onChange={(e) => setForm({ ...form, lockoutDurationMinutes: parseInt(e.target.value) || 15 })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Enforce MFA for Administrators</p>
                <p className="text-[11px] text-slate-500">Require multi-factor authorization on admin logins</p>
              </div>
              <input
                type="checkbox"
                checked={form.mfaEnforcedAdmins}
                onChange={(e) => setForm({ ...form, mfaEnforcedAdmins: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: System Limits & Quotas */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <HardDrive size={16} className="text-violet-600 dark:text-violet-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">System Limits & Quotas</h2>
          </div>

          <div className="mt-4 space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Max Document/Attachment Upload Size (MB)
              </label>
              <input
                type="number"
                value={form.maxUploadSizeMb}
                onChange={(e) => setForm({ ...form, maxUploadSizeMb: parseInt(e.target.value) || 25 })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Global API Rate Limit (Requests / Min / IP)
              </label>
              <input
                type="number"
                value={form.rateLimitPerMinute}
                onChange={(e) => setForm({ ...form, rateLimitPerMinute: parseInt(e.target.value) || 120 })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Audit & System Log Retention Period (Days)
              </label>
              <input
                type="number"
                value={form.logRetentionDays}
                onChange={(e) => setForm({ ...form, logRetentionDays: parseInt(e.target.value) || 90 })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Configuration Version History */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <History size={16} className="text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Configuration History</h2>
          </div>

          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto text-xs">
            {historyQuery.isLoading ? (
              <p className="py-4 text-center text-slate-400">Loading history logs...</p>
            ) : (historyQuery.data || []).length === 0 ? (
              <p className="py-4 text-center text-slate-400">No configuration changes recorded yet.</p>
            ) : (
              (historyQuery.data || []).map((h: any) => (
                <div
                  key={h.id}
                  className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {h.config_key}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(h.changed_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Updated by {h.changed_by_name || 'Super Admin'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

