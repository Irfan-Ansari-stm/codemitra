'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Info, XCircle, X } from 'lucide-react';
import { getErrorMessage, instituteApplicationApi } from '@/lib/api';

type Application = {
  id: string;
  institution_name: string;
  contact_email: string;
  contact_phone: string | null;
  website_url: string | null;
  address: string | null;
  description: string | null;
  status: string;
  review_note: string | null;
  created_at: string;
};

const statusOptions = ['pending', 'approved', 'rejected', 'request_info'];

export default function InstituteApplicationsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selected, setSelected] = useState<Application | null>(null);
  const [note, setNote] = useState('');
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['institute-applications'] });

  const applications = useQuery({
    queryKey: ['institute-applications', statusFilter],
    queryFn: () =>
      instituteApplicationApi.list(statusFilter).then((r) => r.data as any),
  });

  const approve = useMutation({
    mutationFn: (id: string) => instituteApplicationApi.approve(id, note || undefined),
    onSuccess: () => { refresh(); setSelected(null); setNote(''); },
  });
  const reject = useMutation({
    mutationFn: (id: string) => instituteApplicationApi.reject(id, note || undefined),
    onSuccess: () => { refresh(); setSelected(null); setNote(''); },
  });
  const requestInfo = useMutation({
    mutationFn: (id: string) => instituteApplicationApi.requestInfo(id, note || undefined),
    onSuccess: () => { refresh(); setSelected(null); setNote(''); },
  });

  const data = applications.data?.data ?? [];
  const error = applications.error;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">Platform administration</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Institute applications</h1>
          <p className="mt-1 text-sm text-slate-500">Review and approve institute registration requests.</p>
        </div>
        <div className="flex items-center gap-2">
          {statusOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          {getErrorMessage(error)} <button type="button" onClick={() => applications.refetch()} className="ml-1 font-medium underline">Retry</button>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {applications.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading applications…</p>
        ) : data.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">No {statusFilter.replace('_', ' ')} applications.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40">
                <tr>
                  {['Institute', 'Contact', 'Description', 'Status', 'Submitted', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((app: Application) => (
                  <tr key={app.id} className="text-slate-700 dark:text-slate-300">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{app.institution_name}</p>
                      {app.website_url && <p className="text-xs text-blue-600 dark:text-blue-400">{app.website_url}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs">{app.contact_email}</p>
                      {app.contact_phone && <p className="text-xs text-slate-500">{app.contact_phone}</p>}
                    </td>
                    <td className="max-w-[240px] px-4 py-3">
                      <p className="line-clamp-2 text-xs text-slate-500">{app.description || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs capitalize ${
                        app.status === 'approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                        app.status === 'rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' :
                        app.status === 'request_info' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                        'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {statusFilter === 'pending' && (
                          <>
                            <button
                              type="button"
                              title="Approve"
                              aria-label={`Approve ${app.institution_name}`}
                              onClick={() => { setSelected(app); }}
                              className="rounded-md p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                            <button
                              type="button"
                              title="Reject"
                              aria-label={`Reject ${app.institution_name}`}
                              onClick={() => { setSelected(app); }}
                              className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                            >
                              <XCircle size={15} />
                            </button>
                            <button
                              type="button"
                              title="Request info"
                              aria-label={`Request info for ${app.institution_name}`}
                              onClick={() => { setSelected(app); }}
                              className="rounded-md p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40"
                            >
                              <Info size={15} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          title="View details"
                          aria-label={`View ${app.institution_name}`}
                          onClick={() => setSelected(app)}
                          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Clock size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4">
          <section role="dialog" aria-modal="true" className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{selected.institution_name}</h2>
                <p className="mt-1 text-xs text-slate-500">Application details and review</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setSelected(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={17} />
              </button>
            </div>

            <dl className="mt-4 grid grid-cols-[120px_1fr] gap-3 text-sm">
              <dt className="text-slate-500">Contact email</dt>
              <dd className="text-slate-800 dark:text-slate-200">{selected.contact_email}</dd>
              {selected.contact_phone && (<><dt className="text-slate-500">Phone</dt><dd className="text-slate-800 dark:text-slate-200">{selected.contact_phone}</dd></>)}
              {selected.website_url && (<><dt className="text-slate-500">Website</dt><dd className="break-words text-blue-600 dark:text-blue-400">{selected.website_url}</dd></>)}
              {selected.address && (<><dt className="text-slate-500">Address</dt><dd className="text-slate-800 dark:text-slate-200">{selected.address}</dd></>)}
              {selected.description && (<><dt className="text-slate-500">Description</dt><dd className="text-slate-800 dark:text-slate-200">{selected.description}</dd></>)}
              <dt className="text-slate-500">Status</dt>
              <dd className="capitalize text-slate-800 dark:text-slate-200">{selected.status.replace('_', ' ')}</dd>
              {selected.review_note && (<><dt className="text-slate-500">Review note</dt><dd className="text-slate-800 dark:text-slate-200">{selected.review_note}</dd></>)}
              <dt className="text-slate-500">Submitted</dt>
              <dd className="text-slate-800 dark:text-slate-200">{new Date(selected.created_at).toLocaleString()}</dd>
            </dl>

            {statusFilter === 'pending' && (
              <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Review note
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Optional note for the applicant…"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={approve.isPending}
                    onClick={() => approve.mutate(selected.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={reject.isPending}
                    onClick={() => reject.mutate(selected.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                  <button
                    type="button"
                    disabled={requestInfo.isPending}
                    onClick={() => requestInfo.mutate(selected.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    <Info size={14} /> Request info
                  </button>
                </div>
                {(approve.isError || reject.isError || requestInfo.isError) && (
                  <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">
                    {getErrorMessage(approve.error || reject.error || requestInfo.error)}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
