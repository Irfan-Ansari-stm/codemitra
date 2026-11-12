'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ScrollText, Activity, Key, Search,
  Download, Eye, RefreshCw, X
} from 'lucide-react';
import { logsApi } from '@/lib/api';

type LogTab = 'audit' | 'application' | 'auth';

export default function SuperAdminLogsPage() {
  const [activeTab, setActiveTab] = useState<LogTab>('audit');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewingDetail, setViewingDetail] = useState<any | null>(null);

  const auditLogsQuery = useQuery({
    queryKey: ['super-admin-audit-logs', search, page],
    queryFn: () => logsApi.getAuditLogs({ action: search || undefined, page, limit: 30 }).then((res) => res.data),
    enabled: activeTab === 'audit',
  });

  const appLogsQuery = useQuery({
    queryKey: ['super-admin-app-logs', search, page],
    queryFn: () => logsApi.getApplicationLogs({ source: search || undefined, page, limit: 30 }).then((res) => res.data),
    enabled: activeTab === 'application',
  });

  const authLogsQuery = useQuery({
    queryKey: ['super-admin-auth-logs', search, page],
    queryFn: () => logsApi.getAuthLogs({ page, limit: 30 }).then((res) => res.data),
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
    const headers = Object.keys(logs[0]).join(',');
    const csv = [
      headers,
      ...logs.map((r: any) =>
        Object.values(r)
          .map((v) => `"${String(typeof v === 'object' ? JSON.stringify(v) : (v ?? '')).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Logs & Audit Trail
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Centralized operational monitoring, tamper-evident administrative audit logs, and security event trails
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <Download size={14} />
            Export CSV
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
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <ScrollText size={15} />
          <span>Audit Logs</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('application');
            setPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'application'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Activity size={15} />
          <span>Application Logs</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('auth');
            setPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'auth'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Key size={15} />
          <span>Authentication History</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-[280px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Filter ${activeTab} logs by keyword...`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <button
          onClick={() => {
            if (activeTab === 'audit') auditLogsQuery.refetch();
            else if (activeTab === 'application') appLogsQuery.refetch();
            else authLogsQuery.refetch();
          }}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              {activeTab === 'audit' && (
                <tr>
                  <th className="py-3 pl-4 pr-3">Action</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Resource</th>
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
                    No log events found.
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
                          {log.user_name || log.user_email || 'System'}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {log.resource_type ? `${log.resource_type}:${log.resource_id ? String(log.resource_id).slice(0, 8) : ''}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-400">{log.ip_address || '-'}</td>
                        <td className="py-3 px-3 font-sans text-slate-400">
                          {new Date(log.created_at).toLocaleString()}
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
                        <td className="py-3 px-3 font-sans text-slate-800 dark:text-slate-200">
                          {log.message}
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-400">
                          {new Date(log.created_at).toLocaleString()}
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
                          {log.user_name || log.email || 'User'}
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          {log.action || 'auth.event'}
                        </td>
                        <td className="py-3 px-3 text-slate-400">{log.ip_address || '-'}</td>
                        <td className="py-3 px-3 text-slate-400 max-w-[200px] truncate font-sans">
                          {log.user_agent || '-'}
                        </td>
                        <td className="py-3 pr-4 pl-3 text-right font-sans text-slate-400">
                          {new Date(log.created_at).toLocaleString()}
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

      {/* Structured Log Detail Viewer Modal */}
      {viewingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Structured Event Payload
              </h3>
              <button
                onClick={() => setViewingDetail(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto rounded-lg bg-slate-950 p-4 text-xs font-mono text-emerald-400">
              <pre>{JSON.stringify(viewingDetail, null, 2)}</pre>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingDetail(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

