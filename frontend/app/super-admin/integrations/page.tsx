'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Cpu, Database, Webhook, Copy, Check,
  Trash2, Plus, RefreshCw, X, CheckCircle2, AlertCircle
} from 'lucide-react';
import { superAdminIntegrationsApi } from '@/lib/api';

export default function SuperAdminIntegrationsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read:users', 'execute:code']);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const integrationsQuery = useQuery({
    queryKey: ['super-admin-integrations-overview'],
    queryFn: () => superAdminIntegrationsApi.overview().then((res) => res.data?.data || {}),
  });

  const createKeyMutation = useMutation({
    mutationFn: (data: { name: string; scopes: string[] }) =>
      superAdminIntegrationsApi.createKey(data),
    onSuccess: (res) => {
      const fullKey = res.data?.data?.secretKey;
      setGeneratedSecret(fullKey);
      void queryClient.invalidateQueries({ queryKey: ['super-admin-integrations-overview'] });
    },
    onError: (err: any) => {
      setFeedback({
        text: err?.response?.data?.error?.message || 'Failed to generate API key.',
        type: 'error',
      });
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: (id: string) => superAdminIntegrationsApi.revokeKey(id),
    onSuccess: () => {
      setFeedback({ text: 'API key revoked successfully.', type: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-integrations-overview'] });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({
        text: err?.response?.data?.error?.message || 'Failed to revoke API key.',
        type: 'error',
      });
    },
  });

  const data = integrationsQuery.data || {};
  const apiKeys = data.apiKeys || [];
  const integrations = data.integrations || [];

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    createKeyMutation.mutate({
      name: keyName.trim(),
      scopes: selectedScopes,
    });
  };

  const copyToClipboard = () => {
    if (!generatedSecret) return;
    navigator.clipboard.writeText(generatedSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Integrations & API Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Configure external service connectors, Judge0 execution sandbox, and generate developer API keys
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => integrationsQuery.refetch()}
            disabled={integrationsQuery.isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 ${integrationsQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              setKeyName('');
              setGeneratedSecret(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Generate New API Key
          </button>
        </div>
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

      {/* Integrations Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {integrations.map((item: any) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  {item.type === 'database' ? (
                    <Database className="h-5 w-5" />
                  ) : item.type === 'code_execution' ? (
                    <Cpu className="h-5 w-5" />
                  ) : (
                    <Webhook className="h-5 w-5" />
                  )}
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  {item.status}
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
                {item.name}
              </h3>
              {item.endpoint && (
                <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                  {item.endpoint}
                </p>
              )}
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800">
              Active system integration
            </div>
          </div>
        ))}
      </div>

      {/* API Keys Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Developer API Keys</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scoped access keys for external integrations, SDKs, and platform automation
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">Key Name</th>
                <th className="px-6 py-3">Prefix</th>
                <th className="px-6 py-3">Granted Scopes</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                    No API keys generated yet. Click &quot;Generate New API Key&quot; above.
                  </td>
                </tr>
              ) : (
                apiKeys.map((key: any) => (
                  <tr key={key.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{key.name}</div>
                      <div className="text-xs text-slate-500">Created by {key.creator_name || 'Admin'}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {key.key_prefix}••••••••
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(key.scopes || []).map((scope: string) => (
                          <span
                            key={scope}
                            className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {key.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(key.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {key.is_active && (
                        <button
                          onClick={() => {
                            if (confirm(`Revoke API key "${key.name}"? This action cannot be undone.`)) {
                              revokeKeyMutation.mutate(key.id);
                            }
                          }}
                          disabled={revokeKeyMutation.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {generatedSecret ? 'API Key Generated' : 'Generate New API Key'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setGeneratedSecret(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {generatedSecret ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="h-4 w-4" />
                    Copy your API key now!
                  </div>
                  <p className="mt-1">
                    For security reasons, this token will never be displayed again. If you lose it, you will need to revoke it and generate a new key.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800">
                  <input
                    type="text"
                    readOnly
                    value={generatedSecret}
                    className="flex-1 bg-transparent text-slate-900 focus:outline-none dark:text-white"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setGeneratedSecret(null);
                    }}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Key Description / Name
                  </label>
                  <input
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. CI/CD Automated Test Pipeline"
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Permissions & Scopes
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    {[
                      { scope: 'read:users', desc: 'Read user accounts' },
                      { scope: 'write:users', desc: 'Modify user accounts' },
                      { scope: 'read:courses', desc: 'Query courses' },
                      { scope: 'execute:code', desc: 'Judge0 code sandbox' },
                      { scope: 'read:analytics', desc: 'Platform metrics' },
                      { scope: 'admin:full', desc: 'Full administrative access' },
                    ].map((item) => (
                      <label
                        key={item.scope}
                        className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 transition ${
                          selectedScopes.includes(item.scope)
                            ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedScopes.includes(item.scope)}
                          onChange={() => toggleScope(item.scope)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-0"
                        />
                        <div>
                          <div className="font-mono font-semibold text-slate-900 dark:text-white">
                            {item.scope}
                          </div>
                          <div className="text-[11px] text-slate-500">{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createKeyMutation.isPending || !keyName.trim()}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {createKeyMutation.isPending ? 'Generating...' : 'Generate API Key'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

