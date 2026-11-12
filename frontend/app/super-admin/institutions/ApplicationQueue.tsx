'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { getErrorMessage, instituteApplicationApi } from '@/lib/api';

type Application = {
  id: string; applicantName: string; applicantEmail: string; institutionName: string;
  slug: string; contactEmail: string; contactPhone?: string | null; websiteUrl?: string | null;
  address?: string | null; createdAt: string;
};

export function ApplicationQueue() {
  const queryClient = useQueryClient();
  const applications = useQuery({
    queryKey: ['super-admin-institute-applications'],
    queryFn: () => instituteApplicationApi.list(1, 100, 'pending').then((response) => response.data.data as Application[]),
  });
  const review = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'approved' | 'rejected' }) => instituteApplicationApi.review(id, decision),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-institute-applications'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-institutions'] });
    },
  });

  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800"><h2 className="font-semibold text-slate-950 dark:text-white">Pending applications</h2><p className="mt-1 text-sm text-slate-500">Approval creates the institute and assigns its applicant as the first institute administrator.</p></div>
    {applications.isLoading ? <p className="p-6 text-sm text-slate-500">Loading applications…</p> : applications.error ? <p role="alert" className="p-5 text-sm text-rose-700">{getErrorMessage(applications.error)}</p> : !applications.data?.length ? <p className="p-6 text-sm text-slate-500">No applications are waiting for review.</p> : <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {applications.data.map((application) => <article key={application.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h3 className="font-semibold text-slate-950 dark:text-white">{application.institutionName}</h3><span className="text-xs text-slate-500">{application.slug}</span></div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Applicant: {application.applicantName} · {application.applicantEmail}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Contact: {application.contactEmail}{application.contactPhone ? ` · ${application.contactPhone}` : ''}</p>
          {application.websiteUrl && <a className="mt-1 inline-block text-sm text-blue-700 hover:underline dark:text-blue-300" href={application.websiteUrl} target="_blank" rel="noreferrer">{application.websiteUrl}</a>}
          {application.address && <p className="mt-1 text-sm text-slate-500">{application.address}</p>}
          <p className="mt-2 text-xs text-slate-400">Submitted {new Date(application.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2"><button type="button" disabled={review.isPending} onClick={() => review.mutate({ id: application.id, decision: 'rejected' })} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"><X size={15} /> Reject</button><button type="button" disabled={review.isPending} onClick={() => review.mutate({ id: application.id, decision: 'approved' })} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><Check size={15} /> Approve</button></div>
      </article>)}
    </div>}
    {review.error && <p role="alert" className="border-t border-rose-100 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:text-rose-300">{getErrorMessage(review.error)}</p>}
  </section>;
}
