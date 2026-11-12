'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertOctagon, AlertTriangle, CheckCircle2, Clock,
  Plus, RefreshCw, X, MessageSquare, Trash2
} from 'lucide-react';
import { superAdminIncidentsApi } from '@/lib/api';

export default function SuperAdminIncidentsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [newTimelineMsg, setNewTimelineMsg] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states for creating an incident
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [summary, setSummary] = useState('');
  const [services, setServices] = useState<string[]>(['Core REST API']);
  const [initialMessage, setInitialMessage] = useState('Engineers are currently investigating the issue.');

  const incidentsQuery = useQuery({
    queryKey: ['super-admin-incidents'],
    queryFn: () => superAdminIncidentsApi.list().then((res) => res.data?.data || {}),
  });

  const createIncidentMutation = useMutation({
    mutationFn: (data: any) => superAdminIncidentsApi.create(data),
    onSuccess: () => {
      setFeedback({ text: 'Incident reported and published to platform status.', type: 'success' });
      setShowCreateModal(false);
      setTitle('');
      setSummary('');
      void queryClient.invalidateQueries({ queryKey: ['super-admin-incidents'] });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({
        text: err?.response?.data?.error?.message || 'Failed to create incident.',
        type: 'error',
      });
    },
  });

  const updateIncidentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      superAdminIncidentsApi.update(id, data),
    onSuccess: (res) => {
      const updated = res.data?.data;
      if (updated) setSelectedIncident(updated);
      setNewTimelineMsg('');
      setFeedback({ text: 'Incident timeline and status updated.', type: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-incidents'] });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({
        text: err?.response?.data?.error?.message || 'Failed to update incident.',
        type: 'error',
      });
    },
  });

  const deleteIncidentMutation = useMutation({
    mutationFn: (id: string) => superAdminIncidentsApi.delete(id),
    onSuccess: () => {
      setSelectedIncident(null);
      setFeedback({ text: 'Incident deleted.', type: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-incidents'] });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const data = incidentsQuery.data || {};
  const incidents: any[] = data.incidents || [];

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const criticalCount = incidents.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length;
  const resolvedCount = incidents.filter((i) => i.status === 'resolved').length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;
    createIncidentMutation.mutate({
      title: title.trim(),
      severity,
      summary: summary.trim(),
      affectedServices: services,
      initialMessage: initialMessage.trim(),
    });
  };

  const handleUpdateTimeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    updateIncidentMutation.mutate({
      id: selectedIncident.id,
      data: {
        status: newStatus || selectedIncident.status,
        newTimelineMessage: newTimelineMsg.trim() || undefined,
      },
    });
  };

  const toggleService = (name: string) => {
    if (services.includes(name)) {
      setServices(services.filter((s) => s !== name));
    } else {
      setServices([...services, name]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Incident Management & Response
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Log, track, and publish production incidents, service degradations, and public timeline updates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => incidentsQuery.refetch()}
            disabled={incidentsQuery.isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 ${incidentsQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
          >
            <Plus className="h-4 w-4" />
            Report Incident
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Incidents</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {activeIncidents.length}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Investigating or monitoring</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Critical Outages</span>
            <div className="rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-950 dark:text-red-400">
              <AlertOctagon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-red-600 dark:text-red-400">
            {criticalCount}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Severe customer impact</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Resolved Incidents</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {resolvedCount}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Historic mitigation records</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Mean Time to Resolve</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            24 mins
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Average recovery speed</p>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Platform Incident Log</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chronological register of service disruptions, severity levels, and root cause mitigation
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">Incident Title & Scope</th>
                <th className="px-6 py-3">Severity</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Affected Services</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                    No incidents recorded. All services functioning optimally.
                  </td>
                </tr>
              ) : (
                incidents.map((inc: any) => (
                  <tr
                    key={inc.id}
                    onClick={() => {
                      setSelectedIncident(inc);
                      setNewStatus(inc.status);
                    }}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{inc.title}</div>
                      <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">{inc.summary}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                          inc.severity === 'critical'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : inc.severity === 'high'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          inc.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : inc.status === 'monitoring'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(inc.affected_services || []).map((s: string) => (
                          <span
                            key={s}
                            className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(inc.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIncident(inc);
                          setNewStatus(inc.status);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Report Production Incident
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Incident Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Judge0 sandbox timeout spike on Python submissions"
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Severity Level
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="low">Low (Minor cosmetic / non-blocking)</option>
                  <option value="medium">Medium (Degraded performance in non-core area)</option>
                  <option value="high">High (Major feature impacted)</option>
                  <option value="critical">Critical (Full platform / database outage)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Summary Description
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={2}
                  placeholder="Describe the nature of the issue..."
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Affected Services
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['Core REST API', 'PostgreSQL Datastore', 'Judge0 Sandbox Engine', 'Authentication', 'Webhooks'].map((svc) => (
                    <button
                      key={svc}
                      type="button"
                      onClick={() => toggleService(svc)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                        services.includes(svc)
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {svc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Initial Status Note
                </label>
                <input
                  type="text"
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
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
                  disabled={createIncidentMutation.isPending}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                >
                  {createIncidentMutation.isPending ? 'Publishing...' : 'Publish Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Incident Details & Timeline Drawer Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                      selectedIncident.severity === 'critical'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {selectedIncident.severity}
                  </span>
                  <span className="text-xs capitalize text-slate-500">Status: {selectedIncident.status}</span>
                </div>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  {selectedIncident.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Reported at {new Date(selectedIncident.created_at).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedIncident(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                <div className="font-semibold text-slate-800 dark:text-slate-200">Incident Summary</div>
                <p className="mt-1 text-slate-600 dark:text-slate-400">{selectedIncident.summary}</p>
              </div>

              {/* Timeline Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Investigation Timeline
                </h4>
                {(selectedIncident.timeline || []).map((tl: any, idx: number) => (
                  <div
                    key={idx}
                    className="relative flex gap-3 border-l-2 border-indigo-500 pl-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {tl.status}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(tl.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{tl.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Append Update Form */}
            <form onSubmit={handleUpdateTimeline} className="border-t border-slate-200 p-4 dark:border-slate-800">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Update Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="investigating">Investigating</option>
                    <option value="identified">Identified</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Add Timeline Update
                  </label>
                  <input
                    type="text"
                    value={newTimelineMsg}
                    onChange={(e) => setNewTimelineMsg(e.target.value)}
                    placeholder="e.g. A fix has been deployed and system is recovering."
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Delete this incident record permanently?')) {
                      deleteIncidentMutation.mutate(selectedIncident.id);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Incident
                </button>
                <button
                  type="submit"
                  disabled={updateIncidentMutation.isPending}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                  {updateIncidentMutation.isPending ? 'Updating...' : 'Post Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

