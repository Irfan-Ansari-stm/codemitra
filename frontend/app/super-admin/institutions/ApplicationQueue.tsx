'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X, Building2, User, Mail, Globe, MapPin, Clock } from 'lucide-react';
import { getErrorMessage, instituteApplicationApi } from '@/lib/api';

type Application = {
  id: string;
  applicantName?: string;
  applicant_name?: string;
  applicantEmail?: string;
  applicant_email?: string;
  institutionName?: string;
  institution_name?: string;
  slug: string;
  contactEmail?: string;
  contact_email?: string;
  contactPhone?: string | null;
  contact_phone?: string | null;
  websiteUrl?: string | null;
  website_url?: string | null;
  address?: string | null;
  status: string;
  reviewNote?: string | null;
  review_note?: string | null;
  createdAt?: string;
  created_at?: string;
};

export function ApplicationQueue() {
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const applications = useQuery({
    queryKey: ['super-admin-institute-applications'],
    queryFn: () =>
      instituteApplicationApi.list(1, 100, 'pending').then((response) => {
        const raw = response.data.data;
        return (Array.isArray(raw) ? raw : []) as Application[];
      }),
  });

  const review = useMutation({
    mutationFn: ({ id, decision, reviewNote }: { id: string; decision: 'approved' | 'rejected'; reviewNote?: string }) =>
      instituteApplicationApi.review(id, decision, reviewNote),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-institute-applications'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-institutions'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-users-master'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-dashboard-stats'] });

      setRejectingId(null);
      setRejectionNote('');
      setSuccessNote(
        variables.decision === 'approved'
          ? 'Institution application approved! Tenant and Administrator account created.'
          : 'Institution application was rejected.'
      );
      setTimeout(() => setSuccessNote(null), 5000);
    },
  });

  const handleApprove = (app: Application) => {
    const instName = app.institutionName || app.institution_name || 'this institution';
    if (window.confirm(`Approve application for "${instName}"? This will create the institution and configure the applicant as Institution Administrator.`)) {
      review.mutate({ id: app.id, decision: 'approved' });
    }
  };

  const handleConfirmReject = () => {
    if (!rejectingId) return;
    review.mutate({ id: rejectingId, decision: 'rejected', reviewNote: rejectionNote.trim() || undefined });
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm transition-colors">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-slate-950 dark:text-white">Pending Applications</h2>
            {applications.data && applications.data.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                {applications.data.length} waiting
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Approval automatically creates the institution tenant and grants the applicant Institution Administrator access.
          </p>
        </div>
      </div>

      {successNote && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
          <span>{successNote}</span>
          <button onClick={() => setSuccessNote(null)} className="text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      {applications.isLoading ? (
        <p className="p-6 text-sm text-slate-500">Loading applications…</p>
      ) : applications.error ? (
        <p role="alert" className="p-5 text-sm text-rose-700 dark:text-rose-400">
          {getErrorMessage(applications.error)}
        </p>
      ) : !applications.data?.length ? (
        <p className="p-6 text-sm text-slate-500 dark:text-slate-400">No applications are waiting for review.</p>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {applications.data.map((application) => {
            const instName = application.institutionName || application.institution_name || 'Unnamed Institution';
            const applicantName = application.applicantName || application.applicant_name || 'Applicant';
            const applicantEmail = application.applicantEmail || application.applicant_email || '—';
            const contactEmail = application.contactEmail || application.contact_email || '—';
            const contactPhone = application.contactPhone || application.contact_phone;
            const websiteUrl = application.websiteUrl || application.website_url;
            const createdAt = application.createdAt || application.created_at;

            return (
              <article key={application.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-semibold text-slate-950 dark:text-white flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      {instName}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {application.slug}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Applicant: <strong>{applicantName}</strong> ({applicantEmail})</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contact: {contactEmail}{contactPhone ? ` · ${contactPhone}` : ''}</span>
                  </p>
                  {websiteUrl && (
                    <p className="mt-1 text-xs flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <a className="text-blue-600 hover:underline dark:text-blue-400" href={websiteUrl} target="_blank" rel="noreferrer">
                        {websiteUrl}
                      </a>
                    </p>
                  )}
                  {application.address && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {application.address}
                    </p>
                  )}
                  {createdAt && (
                    <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Submitted {new Date(createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={review.isPending}
                    onClick={() => {
                      setRejectingId(application.id);
                      setRejectionNote('');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition shadow-sm"
                  >
                    <X size={14} className="text-rose-500" /> Reject
                  </button>
                  <button
                    type="button"
                    disabled={review.isPending}
                    onClick={() => handleApprove(application)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 transition shadow-sm"
                  >
                    <Check size={14} /> Approve
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Rejection Note Dialog */}
      {rejectingId && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">Reject Institution Application</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Provide an optional note explaining why this application was not approved.
            </p>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="e.g. Incomplete accreditation documents or invalid official email domain."
              rows={3}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={review.isPending}
                onClick={handleConfirmReject}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
              >
                {review.isPending ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {review.error && (
        <p role="alert" className="border-t border-rose-100 p-4 text-xs text-rose-700 dark:border-rose-900/40 dark:text-rose-300">
          {getErrorMessage(review.error)}
        </p>
      )}
    </section>
  );
}
