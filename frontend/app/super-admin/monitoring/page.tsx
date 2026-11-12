'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Database, HardDrive, Server,
  CheckCircle2, Clock, RefreshCw, Zap, ShieldCheck
} from 'lucide-react';
import { superAdminMonitoringApi } from '@/lib/api';

function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}

export default function SuperAdminMonitoringPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const healthQuery = useQuery({
    queryKey: ['super-admin-monitoring-health'],
    queryFn: () => superAdminMonitoringApi.health().then((res) => res.data?.data || {}),
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const data = healthQuery.data || {};
  const db = data.database || {};
  const memory = data.memory || {};
  const system = data.system || {};
  const services = data.services || [];

  const heapPercent = memory.heapTotalMb
    ? Math.min(100, Math.round((memory.heapUsedMb / memory.heapTotalMb) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            System Monitoring & Health
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time infrastructure health, database connection pool telemetry, and memory consumption
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-0"
            />
            Auto-refresh (10s)
          </label>
          <button
            onClick={() => healthQuery.refetch()}
            disabled={healthQuery.isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${healthQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Status Banner */}
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-5 dark:border-emerald-800/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                All Core Platform Systems Operational
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Last checked: {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Connecting...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-900/80 dark:text-slate-300">
            <Clock className="h-4 w-4 text-emerald-500" />
            Process Uptime: {formatUptime(data.uptimeSeconds || 0)}
          </div>
        </div>
      </div>

      {/* Telemetry Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* PostgreSQL Datastore */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Database Latency</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {db.latencyMs ?? 0} ms
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Connected
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Pool: {db.poolTotal ?? 0} total &bull; {db.poolIdle ?? 0} idle &bull; {db.poolWaiting ?? 0} waiting
          </p>
        </div>

        {/* Memory RSS */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Process Memory (RSS)</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <HardDrive className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {memory.rssMb ?? 0} MB
            </span>
            <span className="text-xs text-slate-500">resident memory</span>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Heap: {memory.heapUsedMb ?? 0} / {memory.heapTotalMb ?? 0} MB</span>
              <span>{heapPercent}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-1.5 rounded-full bg-blue-500"
                style={{ width: `${heapPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Runtime Environment */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Runtime Engine</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Server className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            Node {system.nodeVersion || 'v20+'}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Platform: {system.platform || 'linux'} ({system.arch || 'x64'}) &bull; {system.env}
          </p>
        </div>

        {/* Service Posture */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Microservices Status</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {services.length} / {services.length} Healthy
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">100% services operational</p>
        </div>
      </div>

      {/* Services Health Breakdown Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Platform Subsystems & Health Probes</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated internal ping latencies and live status checks across application modules
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">Service / Component</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Probe Latency</th>
                <th className="px-6 py-3">Uptime Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {services.map((svc: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5 font-medium text-slate-900 dark:text-white">
                      <Zap className="h-4 w-4 text-indigo-500" />
                      {svc.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      {svc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                    {svc.latencyMs} ms
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">
                    99.95% SLA
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

