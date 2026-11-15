'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ScrollText, Activity, Key, Search,
  Download, Eye, RefreshCw, X
} from 'lucide-react';
import { logsAdminApi } from '@/lib/api';

type LogTab = 'audit' | 'application' | 'auth';

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

export default function SuperAdminLogsPage() {
  const [activeTab, setActiveTab] = useState<LogTab>('audit');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewingDetail, setViewingDetail] = useState<any | null>(null);

  const auditLogsQuery = useQuery({
    queryKey: ['super-admin-audit-logs', search, page],
    queryFn: () => logsAdminApi.audit({ search: search || undefined, page, limit: 30 }).then((res) => res.data?.data || {}),
    enabled: activeTab === 'audit',
  });

  const appLogsQuery = useQuery({
    queryKey: ['super-admin-app-logs', search, page],
    queryFn: () => logsAdminApi.application({ search: search || undefined, page, limit: 30 }).then((res) => res.data?.data || {}),
    enabled: activeTab === 'application',
  });

  const authLogsQuery = useQuery({
    queryKey: ['super-admin-auth-logs', search, page],
    queryFn: () => logsAdminApi.authentication({ search: search || undefined, page, limit: 30 }).then((res) => res.data?.data || {}),
    enabled: activeTab === 'auth',
  });

  const currentResult: any =
    activeTab === 'audit'
      ? auditLogsQuery.data
      : activeTab === 'application'
      ? appLogsQuery.data
      : authLogsQuery.data;

  const logs = currentResult?.data || [];
  const total = currentResult?.total || 0;
  const totalPages = currentResult?.totalPages || 1;

  const handleExport = () => {
    if (!logs.length) return;
    const headers = Object.keys(logs[0]);
    
    // RFC 4180 CSV export with formula injection prevention
    const escapeCsv = (val: any) => {
      let str = String(typeof val === 'object' ? JSON.stringify(val) : (val ?? ''));
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`; // Prefix with single quote to prevent spreadsheet formula execution
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvLines = [headers.join(',')];
    for (const r of logs) {
      csvLines.push(headers.map((h) => escapeCsv(r[h])).join(','));
    }

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    if (activeTab === 'audit') void auditLogsQuery.refetch();
    if (activeTab === 'application') void appLogsQuery.refetch();
    if (activeTab === 'auth') void authLogsQuery.refetch();
  };

  const isFetching =
    auditLogsQuery.isFetching || appLogsQuery.isFetching || authLogsQuery.isFetching;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Logs & Audit Trail
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Immutable administrative operations, runtime application logs, and authentication events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => {
            setActiveTab('audit');
            setPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <ScrollText className="h-4 w-4" />
          Audit Trail
        </button>
        <button
          onClick={() => {
            setActiveTab('application');
            setPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'application'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Activity className="h-4 w-4" />
          Application Logs
        </button>
        <button
          onClick={() => {
            setActiveTab('auth');
            setPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'auth'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Key className="h-4 w-4" />
          Authentication History
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'audit'
                ? 'Search by action, user, or resource...'
                : activeTab === 'application'
                ? 'Search by log message, source, or level...'
                : 'Search by user email, event type, or IP...'
            }
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              {activeTab === 'audit' && (
                <tr>
                  <th className="py-3 pl-4 pr-3">Action</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Resource Target</th>
                  <th className="py-3 px-3">IP Address</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 pr-4 pl-3 text-right">Details</th>
                </tr>
              )}
              {activeTab === 'application' && (
                <tr>
                  <th className="py-3 pl-4 pr-3">Level</th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3">Message</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 pr-4 pl-3 text-right">Context</th>
                </tr>
              )}
              {activeTab === 'auth' && (
                <tr>
                  <th className="py-3 pl-4 pr-3">User</th>
                  <th className="py-3 px-3">Event</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">IP Address</th>
                  <th className="py-3 px-3">User Agent</th>
                  <th className="py-3 pr-4 pl-3 text-right">Timestamp</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    No log events found matching query.
                  </td>
                </tr>
              ) : (
                logs.map((log: any, idx: number) => (
                  <tr key={log.id || idx} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    {activeTab === 'audit' && (
                      <>
                        <td className="py-3 pl-4 pr-3 font-semibold text-blue-600 dark:text-blue-400">
                          {log.action}
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-800 dark:text-slate-200">
                          {log.user_name || log.user_email || 'System / Automated'}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {log.resource_type ? `${log.resource_type}${log.resource_id ? `:${String(log.resource_id).slice(0, 8)}` : ''}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-400">{log.ip_address || '—'}</td>
                        <td className="py-3 px-3 font-sans text-slate-400">
                          {formatDateSafe(log.created_at || log.createdAt)}
                        </td>
                        <td className="py-3 pr-4 pl-3 text-right font-sans">
                          <button
                            onClick={() => setViewingDetail(log)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                            title="Inspect full event snapshot"
                          >
                            <Eye size={13} />
                          </button>
                        </td>
                      </>
                    )}

                    {activeTab === 'application' && (
                      <>
                        <td className="py-3 pl-4 pr-3">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              log.level === 'error'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                                : log.level === 'warn'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {log.level || 'info'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{log.source || 'api'}</td>
                        <td className="py-3 px-3 font-sans text-slate-800 dark:text-slate-200 max-w-md truncate">
                          {log.message}
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-400">
                          {formatDateSafe(log.created_at || log.createdAt)}
                        </td>
                        <td className="py-3 pr-4 pl-3 text-right font-sans">
                          <button
                            onClick={() => setViewingDetail(log)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                          >
                            <Eye size={13} />
                          </button>
                        </td>
                      </>
                    )}

                    {activeTab === 'auth' && (
                      <>
                        <td className="py-3 pl-4 pr-3 font-sans text-slate-900 dark:text-white">
                          <div className="font-semibold">{log.user_name || log.user_email || 'User'}</div>
                          <div className="text-xs text-slate-400">{log.user_email}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          {log.event_type || log.action || 'auth.login'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              log.status === 'success'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            }`}
                          >
                            {log.status || 'success'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{log.ip_address || '—'}</td>
                        <td className="py-3 px-3 text-slate-400 max-w-[200px] truncate font-sans">
                          {log.user_agent || '—'}
                        </td>
                        <td className="py-3 pr-4 pl-3 text-right font-sans text-slate-400">
                          {formatDateSafe(log.created_at || log.createdAt)}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Showing {logs.length} of {total} records
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {viewingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Log Event Payload Snapshot
              </h3>
              <button
                onClick={() => setViewingDetail(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Timestamp:</span>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatDateSafe(viewingDetail.created_at || viewingDetail.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Request ID:</span>
                  <p className="font-mono text-slate-900 dark:text-white">
                    {viewingDetail.request_id || viewingDetail.requestId || '—'}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-slate-400">Raw JSON Context:</span>
                <pre className="mt-1 max-h-72 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-xs text-emerald-400">
                  {JSON.stringify(viewingDetail, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingDetail(null)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
