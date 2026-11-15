'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Cpu, Database, Webhook, Copy, Check,
  Trash2, Plus, RefreshCw, X, CheckCircle2, AlertCircle, PlayCircle, Key, RotateCw
} from 'lucide-react';
import { superAdminIntegrationsApi } from '@/lib/api';

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
    });
  } catch {
    return 'Timestamp unavailable';
  }
}

type Tab = 'connectors' | 'webhooks' | 'api-keys';

export default function SuperAdminIntegrationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('connectors');

  // Key creation state
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read', 'execute:code']);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  // Webhook creation state
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);
  const [webhookName, setWebhookName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['user.created', 'submission.completed']);
  const [generatedWebhookSecret, setGeneratedWebhookSecret] = useState<string | null>(null);

  const [testingId, setTestingId] = useState<string | null>(null);
  const [retryingDeliveryId, setRetryingDeliveryId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Queries
  const overviewQuery = useQuery({
    queryKey: ['super-admin-integrations-overview'],
    queryFn: () => superAdminIntegrationsApi.overview().then((res) => res.data?.data || {}),
  });

  const webhooksQuery = useQuery({
    queryKey: ['super-admin-webhooks-list'],
    queryFn: () => superAdminIntegrationsApi.webhooks().then((res) => res.data?.data || []),
  });

  const deliveriesQuery = useQuery({
    queryKey: ['super-admin-webhook-deliveries'],
    queryFn: () => superAdminIntegrationsApi.deliveries(undefined, 25).then((res) => res.data?.data || []),
  });

  // Mutations
  const testIntegrationMutation = useMutation({
    mutationFn: (id: string) => superAdminIntegrationsApi.test(id),
    onMutate: (id) => setTestingId(id),
    onSuccess: (res) => {
      setTestingId(null);
      const r = res.data?.data;
      setFeedback({
        text: `Integration probe for ${r?.name || 'service'}: ${r?.status?.toUpperCase()} (${r?.latencyMs ?? 0}ms)`,
        type: 'success',
      });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-integrations-overview'] });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setTestingId(null);
      setFeedback({
        text: err?.response?.data?.error?.message || 'Connection probe test failed.',
        type: 'error',
      });
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: (data: { name: string; scopes: string[] }) =>
      superAdminIntegrationsApi.createApiKey(data),
    onSuccess: (res) => {
      const fullKey = res.data?.data?.key;
      setGeneratedKey(fullKey);
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
    mutationFn: (id: string) => superAdminIntegrationsApi.revokeApiKey(id),
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

  const createWebhookMutation = useMutation({
    mutationFn: (data: any) => superAdminIntegrationsApi.createWebhook(data),
    onSuccess: (res) => {
      const secret = res.data?.data?.signingSecret;
      setGeneratedWebhookSecret(secret);
      void queryClient.invalidateQueries({ queryKey: ['super-admin-webhooks-list'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-integrations-overview'] });
    },
    onError: (err: any) => {
      setFeedback({
        text: err?.response?.data?.error?.message || 'Failed to register webhook.',
        type: 'error',
      });
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: (id: string) => superAdminIntegrationsApi.deleteWebhook(id),
    onSuccess: () => {
      setFeedback({ text: 'Webhook endpoint deleted.', type: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-webhooks-list'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-integrations-overview'] });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const retryDeliveryMutation = useMutation({
    mutationFn: (id: string) => superAdminIntegrationsApi.retryDelivery(id),
    onMutate: (id) => setRetryingDeliveryId(id),
    onSuccess: () => {
      setRetryingDeliveryId(null);
      setFeedback({ text: 'Webhook delivery retried successfully.', type: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-webhook-deliveries'] });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setRetryingDeliveryId(null);
      setFeedback({ text: err?.response?.data?.error?.message || 'Failed to retry delivery.', type: 'error' });
    },
  });

  const data = overviewQuery.data || {};
  const integrations = data.integrations?.items || data.integrations || [];
  const apiKeys = data.apiKeys?.items || data.apiKeys || [];
  const webhooks = webhooksQuery.data || data.webhooks?.items || [];
  const deliveries = deliveriesQuery.data || data.deliveries?.recent || [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

  const toggleEvent = (evt: string) => {
    if (webhookEvents.includes(evt)) {
      setWebhookEvents(webhookEvents.filter((e) => e !== evt));
    } else {
      setWebhookEvents([...webhookEvents, evt]);
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
            Configure external datastores, Judge0 compiler sandbox, outgoing webhooks, and developer API keys
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              void overviewQuery.refetch();
              void webhooksQuery.refetch();
              void deliveriesQuery.refetch();
            }}
            disabled={overviewQuery.isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 ${overviewQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {activeTab === 'api-keys' && (
            <button
              onClick={() => {
                setKeyName('');
                setGeneratedKey(null);
                setShowCreateKeyModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              Generate API Key
            </button>
          )}
          {activeTab === 'webhooks' && (
            <button
              onClick={() => {
                setWebhookName('');
                setWebhookUrl('');
                setGeneratedWebhookSecret(null);
                setShowCreateWebhookModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              Register Webhook
            </button>
          )}
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg border p-4 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('connectors')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'connectors'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Database className="h-4 w-4" />
          Connectors & Infrastructure ({integrations.length})
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'webhooks'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Webhook className="h-4 w-4" />
          Webhooks & Dispatcher ({webhooks.length})
        </button>
        <button
          onClick={() => setActiveTab('api-keys')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'api-keys'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Key className="h-4 w-4" />
          Developer API Keys ({apiKeys.length})
        </button>
      </div>

      {/* Tab 1: Connectors */}
      {activeTab === 'connectors' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {integrations.map((item: any) => {
            const isTesting = testingId === item.id;
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                      {item.provider === 'postgresql' || item.integration_type === 'database' ? (
                        <Database className="h-5 w-5" />
                      ) : item.provider === 'judge0' || item.integration_type === 'code_execution' ? (
                        <Cpu className="h-5 w-5" />
                      ) : (
                        <Webhook className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.connection_status === 'connected' || item.connection_status === 'ready'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {item.connection_status || 'connected'}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {item.description || 'Core system service connector'}
                  </p>
                  {item.endpoint_url && (
                    <p className="mt-2 font-mono text-xs text-slate-400">
                      {item.endpoint_url}
                    </p>
                  )}
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    onClick={() => testIntegrationMutation.mutate(item.id)}
                    disabled={isTesting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <PlayCircle className={`h-3.5 w-3.5 text-indigo-600 ${isTesting ? 'animate-spin' : ''}`} />
                    {isTesting ? 'Testing Connection...' : 'Test Connection'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Registered Webhook Endpoints</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Outbound event dispatchers signed with HMAC SHA-256 secret keys
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-3">Endpoint Name</th>
                    <th className="px-6 py-3">Target URL</th>
                    <th className="px-6 py-3">Subscribed Events</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {webhooks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                        No webhook endpoints registered. Click &quot;Register Webhook&quot; above.
                      </td>
                    </tr>
                  ) : (
                    webhooks.map((wh: any) => (
                      <tr key={wh.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                          {wh.name}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                          {wh.target_url || wh.targetUrl}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(wh.subscribed_events || wh.subscribedEvents || []).map((e: string, i: number) => (
                              <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {e}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Delete webhook ${wh.name}?`)) {
                                deleteWebhookMutation.mutate(wh.id);
                              }
                            }}
                            className="text-xs text-red-600 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Webhook Deliveries */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent Webhook Deliveries</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log of outgoing event delivery attempts and HTTP response codes
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-3">Event</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">HTTP Code</th>
                    <th className="px-6 py-3">Attempts</th>
                    <th className="px-6 py-3">Delivered At</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {deliveries.map((d: any) => {
                    const isRetrying = retryingDeliveryId === d.id;
                    return (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-mono text-xs">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                          {d.event_type || d.eventType}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              d.status === 'success' || (d.status_code >= 200 && d.status_code < 300)
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            }`}
                          >
                            {d.status?.toUpperCase() || 'SUCCESS'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {d.status_code || d.statusCode || 200}
                        </td>
                        <td className="px-6 py-4">
                          {d.attempt_number || d.attemptNumber || 1}
                        </td>
                        <td className="px-6 py-4 font-sans text-slate-400">
                          {formatDateSafe(d.delivered_at || d.deliveredAt)}
                        </td>
                        <td className="px-6 py-4 text-right font-sans">
                          <button
                            onClick={() => retryDeliveryMutation.mutate(d.id)}
                            disabled={isRetrying}
                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            <RotateCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
                            Retry
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: API Keys */}
      {activeTab === 'api-keys' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Developer API Keys</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Scoped cryptographic access keys for external automations, SDKs, and platforms
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Key Name</th>
                  <th className="px-6 py-3">Key Prefix</th>
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
                      No API keys generated yet. Click &quot;Generate API Key&quot; above.
                    </td>
                  </tr>
                ) : (
                  apiKeys.map((key: any) => (
                    <tr key={key.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {key.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {key.key_prefix || key.keyPrefix}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(key.scopes || []).map((s: string, idx: number) => (
                            <span
                              key={idx}
                              className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            key.is_active || key.isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {key.is_active || key.isActive ? 'Active' : 'Revoked'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatDateSafe(key.created_at || key.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(key.is_active || key.isActive) && (
                          <button
                            onClick={() => {
                              if (confirm(`Revoke API key "${key.name}"? This action cannot be undone.`)) {
                                revokeKeyMutation.mutate(key.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/60 dark:text-red-400"
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
      )}

      {/* Create Key Modal */}
      {showCreateKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Generate Developer API Key
              </h3>
              <button
                onClick={() => setShowCreateKeyModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {generatedKey ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  <strong>Important:</strong> Copy this secret key immediately. It is cryptographically hashed and will never be displayed again.
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Generated Secret Key</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedKey}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedKey)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowCreateKeyModal(false)}
                    className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!keyName.trim()) return;
                  createKeyMutation.mutate({ name: keyName.trim(), scopes: selectedScopes });
                }}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Key Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CI/CD Judge Pipeline"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Scopes</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {['read', 'write', 'execute:code', 'admin'].map((scope) => (
                      <label key={scope} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={selectedScopes.includes(scope)}
                          onChange={() => toggleScope(scope)}
                          className="rounded text-indigo-600"
                        />
                        {scope}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateKeyModal(false)}
                    className="rounded-lg border px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createKeyMutation.isPending}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    {createKeyMutation.isPending ? 'Generating...' : 'Generate Key'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Create Webhook Modal */}
      {showCreateWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Register Webhook Endpoint
              </h3>
              <button
                onClick={() => setShowCreateWebhookModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {generatedWebhookSecret ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  <strong>Important:</strong> Save your HMAC signing secret key. Use it to verify incoming payload signatures on your server.
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Signing Secret</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedWebhookSecret}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedWebhookSecret)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowCreateWebhookModal(false)}
                    className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!webhookName.trim() || !webhookUrl.trim()) return;
                  createWebhookMutation.mutate({
                    name: webhookName.trim(),
                    targetUrl: webhookUrl.trim(),
                    subscribedEvents: webhookEvents,
                  });
                }}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Webhook Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Production Event Consumer"
                    value={webhookName}
                    onChange={(e) => setWebhookName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Target URL (HTTPS)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/api/webhooks"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Subscribed Events</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {['user.created', 'submission.completed', 'batch.created', 'ticket.created'].map((evt) => (
                      <label key={evt} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={webhookEvents.includes(evt)}
                          onChange={() => toggleEvent(evt)}
                          className="rounded text-indigo-600"
                        />
                        {evt}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateWebhookModal(false)}
                    className="rounded-lg border px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createWebhookMutation.isPending}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    {createWebhookMutation.isPending ? 'Registering...' : 'Register Webhook'}
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
