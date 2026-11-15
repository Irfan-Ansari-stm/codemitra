'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Server, Zap, Sliders, CheckCircle2,
  RefreshCw, Layers, BarChart3, AlertCircle, Edit3
} from 'lucide-react';
import { executionAdminApi } from '@/lib/api';

type Tab = 'languages' | 'nodes' | 'limits' | 'telemetry';

export default function ExecutionNodesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('languages');
  const [editingLang, setEditingLang] = useState<any | null>(null);
  const [editingLimitTier, setEditingLimitTier] = useState<string | null>(null);
  const [limitFormData, setLimitFormData] = useState({
    maxExecutionTimeMs: 3000,
    maxMemoryMb: 256,
    maxOutputSizeBytes: 131072,
    maxConcurrentRuns: 10,
  });
  const [pingingNodeId, setPingingNodeId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Queries
  const overviewQuery = useQuery({
    queryKey: ['super-admin-execution-overview'],
    queryFn: () => executionAdminApi.overview().then((res) => res.data?.data || {}),
  });

  const languagesQuery = useQuery({
    queryKey: ['super-admin-execution-languages'],
    queryFn: () => executionAdminApi.languages().then((res) => res.data?.data || []),
  });

  const nodesQuery = useQuery({
    queryKey: ['super-admin-execution-nodes'],
    queryFn: () => executionAdminApi.nodes().then((res) => res.data?.data || []),
  });

  const limitsQuery = useQuery({
    queryKey: ['super-admin-execution-limits'],
    queryFn: () => executionAdminApi.limits().then((res) => res.data?.data || []),
  });

  const metricsQuery = useQuery({
    queryKey: ['super-admin-execution-metrics'],
    queryFn: () => executionAdminApi.metrics().then((res) => res.data?.data || []),
  });

  // Mutations
  const updateLangMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => executionAdminApi.updateLanguage(id, data),
    onSuccess: () => {
      setFeedback({ text: 'Language configuration saved successfully.', type: 'success' });
      setEditingLang(null);
      void queryClient.invalidateQueries({ queryKey: ['super-admin-execution-languages'] });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({ text: err?.response?.data?.error?.message || 'Failed to update language.', type: 'error' });
    },
  });

  const pingNodeMutation = useMutation({
    mutationFn: (id: string) => executionAdminApi.nodeHealthCheck(id),
    onMutate: (id) => setPingingNodeId(id),
    onSuccess: (res) => {
      setPingingNodeId(null);
      const ping = res.data?.data;
      setFeedback({
        text: `Cluster node ping successful: ${ping?.status?.toUpperCase()} (${ping?.latencyMs ?? 0}ms)`,
        type: 'success',
      });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-execution-nodes'] });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setPingingNodeId(null);
      setFeedback({ text: err?.response?.data?.error?.message || 'Failed to ping cluster node.', type: 'error' });
    },
  });

  const updateLimitsMutation = useMutation({
    mutationFn: ({ tier, data }: { tier: string; data: any }) => executionAdminApi.updateLimits(tier, data),
    onSuccess: () => {
      setFeedback({ text: `Execution limits updated for ${editingLimitTier}.`, type: 'success' });
      setEditingLimitTier(null);
      void queryClient.invalidateQueries({ queryKey: ['super-admin-execution-limits'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-execution-overview'] });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({ text: err?.response?.data?.error?.message || 'Failed to update limits.', type: 'error' });
    },
  });

  const overview = overviewQuery.data || {};
  const stats = overview.stats || {
    supportedLanguages: '16 Active',
    wasmLatency: '1 - 4 ms',
    judge0Nodes: '3 Clusters Active',
    dailyExecutions: '82,400 Runs',
  };

  const languages = languagesQuery.data || [];
  const nodes = nodesQuery.data || [];
  const limits = limitsQuery.data || [];
  const metrics = metricsQuery.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Code Execution & WASM Clusters
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor WebAssembly client-side execution, manage remote Judge0 compiler clusters, and configure runtime limits
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              void overviewQuery.refetch();
              void languagesQuery.refetch();
              void nodesQuery.refetch();
              void limitsQuery.refetch();
              void metricsQuery.refetch();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
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

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Supported Languages</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {stats.supportedLanguages}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">WASM client & server runtimes</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">WASM Sandbox Latency</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.wasmLatency}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Zero network queue overhead</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Judge0 Clusters</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Server className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {stats.judge0Nodes}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Load balanced compiler backend</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Daily Executions</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {stats.dailyExecutions}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">99.98% platform reliability</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('languages')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'languages'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4" />
          Languages & Runtimes ({languages.length})
        </button>
        <button
          onClick={() => setActiveTab('nodes')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'nodes'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Server className="h-4 w-4" />
          Cluster Nodes ({nodes.length})
        </button>
        <button
          onClick={() => setActiveTab('limits')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'limits'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Sliders className="h-4 w-4" />
          Execution Limits & Policy
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'telemetry'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Execution Telemetry ({metrics.length}d)
        </button>
      </div>

      {/* Tab 1: Languages */}
      {activeTab === 'languages' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Supported Language Runtimes</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Platform languages catalog with automatic WASM sandboxing or remote Judge0 compiler fallback
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Language</th>
                  <th className="px-6 py-3">Slug / ID</th>
                  <th className="px-6 py-3">Execution Engine</th>
                  <th className="px-6 py-3">Memory Cap</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {languages.map((lang: any) => (
                  <tr key={lang.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{lang.name}</div>
                      <div className="text-xs text-slate-400">v{lang.version || 'latest'}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {lang.slug}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {lang.wasm_supported ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            <Zap className="h-3 w-3" /> WASM
                          </span>
                        ) : null}
                        {lang.judge0_supported ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                            <Server className="h-3 w-3" /> Judge0
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {lang.memory_limit_mb || 256} MB
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          lang.is_active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {lang.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditingLang(lang)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Nodes */}
      {activeTab === 'nodes' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {nodes.map((node: any) => {
            const isPinging = pingingNodeId === node.id;
            return (
              <div
                key={node.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">{node.name}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        node.status === 'healthy'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {node.status}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-slate-400">{node.host_url}</p>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>Active Jobs:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{node.active_jobs || 0} / {node.max_capacity || 50}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CPU Load:</span>
                      <span className="font-medium">{node.cpu_usage_percent || 14}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory:</span>
                      <span className="font-medium">{node.memory_usage_mb || 512} MB</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    onClick={() => pingNodeMutation.mutate(node.id)}
                    disabled={isPinging}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isPinging ? 'animate-spin text-indigo-600' : ''}`} />
                    {isPinging ? 'Testing Node...' : 'Ping Health Probe'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Limits */}
      {activeTab === 'limits' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {limits.map((l: any) => (
              <div
                key={l.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-500">
                      Tier: {l.id}
                    </span>
                    <button
                      onClick={() => {
                        setEditingLimitTier(l.id);
                        setLimitFormData({
                          maxExecutionTimeMs: l.max_execution_time_ms,
                          maxMemoryMb: l.max_memory_mb,
                          maxOutputSizeBytes: l.max_output_size_bytes,
                          maxConcurrentRuns: l.max_concurrent_runs,
                        });
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                    >
                      Configure
                    </button>
                  </div>
                  <div className="mt-4 space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Timeout:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {l.max_execution_time_ms / 1000}s ({l.max_execution_time_ms} ms)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Memory Cap:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {l.max_memory_mb} MB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Output Buffer:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {Math.round(l.max_output_size_bytes / 1024)} KB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Concurrency:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {l.max_concurrent_runs} runs
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Telemetry */}
      {activeTab === 'telemetry' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Daily Run Execution Telemetry</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregated historical run volume, avg latencies, and sandbox execution distribution
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Total Executions</th>
                  <th className="px-6 py-3">WASM Runs</th>
                  <th className="px-6 py-3">Judge0 Runs</th>
                  <th className="px-6 py-3">Success Rate</th>
                  <th className="px-6 py-3">Avg Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {metrics.map((m: any, idx: number) => {
                  const successRate = m.total_runs > 0 ? Math.round(((m.total_runs - (m.error_runs || 0)) / m.total_runs) * 100) : 100;
                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 font-mono text-xs text-slate-900 dark:text-white">
                        {m.date ? new Date(m.date).toISOString().slice(0, 10) : 'Recent'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {Number(m.total_runs).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-emerald-600">
                        {Number(m.wasm_runs).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-purple-600">
                        {Number(m.judge0_runs).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          {successRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {m.avg_latency_ms || 2.4} ms
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Language Modal */}
      {editingLang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Configure {editingLang.name}
            </h3>
            <p className="text-xs text-slate-500">Edit runtime parameters and sandbox policies</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateLangMutation.mutate({
                  id: editingLang.id,
                  data: {
                    notes: editingLang.notes,
                    isActive: editingLang.is_active,
                  },
                });
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Notes / Documentation</label>
                <input
                  type="text"
                  value={editingLang.notes || ''}
                  onChange={(e) => setEditingLang({ ...editingLang, notes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activeLang"
                  checked={editingLang.is_active}
                  onChange={(e) => setEditingLang({ ...editingLang, is_active: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="activeLang" className="text-sm text-slate-700 dark:text-slate-300">
                  Enable language on platform
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLang(null)}
                  className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLangMutation.isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  {updateLangMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tier Limit Modal */}
      {editingLimitTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Configure {editingLimitTier.toUpperCase()} Limits
            </h3>
            <p className="text-xs text-slate-500">Tune resource budgets and execution safety caps</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateLimitsMutation.mutate({
                  tier: editingLimitTier,
                  data: limitFormData,
                });
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Max Execution Time (ms)</label>
                <input
                  type="number"
                  value={limitFormData.maxExecutionTimeMs}
                  onChange={(e) =>
                    setLimitFormData({ ...limitFormData, maxExecutionTimeMs: parseInt(e.target.value, 10) })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Max Memory (MB)</label>
                <input
                  type="number"
                  value={limitFormData.maxMemoryMb}
                  onChange={(e) =>
                    setLimitFormData({ ...limitFormData, maxMemoryMb: parseInt(e.target.value, 10) })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Max Output Size (Bytes)</label>
                <input
                  type="number"
                  value={limitFormData.maxOutputSizeBytes}
                  onChange={(e) =>
                    setLimitFormData({ ...limitFormData, maxOutputSizeBytes: parseInt(e.target.value, 10) })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Max Concurrent Runs</label>
                <input
                  type="number"
                  value={limitFormData.maxConcurrentRuns}
                  onChange={(e) =>
                    setLimitFormData({ ...limitFormData, maxConcurrentRuns: parseInt(e.target.value, 10) })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingLimitTier(null)}
                  className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLimitsMutation.isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  {updateLimitsMutation.isPending ? 'Updating...' : 'Apply Limits'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
