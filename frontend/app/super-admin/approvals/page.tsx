'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, XCircle, Building2,
  BookOpen, UserCheck, RefreshCw, X, AlertCircle
} from 'lucide-react';
import { superAdminApprovalsApi, instituteApplicationApi, courseApi } from '@/lib/api';

type Tab = 'institutes' | 'admissions' | 'courses';

export default function SuperAdminApprovalsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('institutes');
  const [decisionModal, setDecisionModal] = useState<{
    type: 'approve' | 'reject';
    category: Tab;
    item: any;
  } | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const approvalsQuery = useQuery({
    queryKey: ['super-admin-approvals'],
    queryFn: () => superAdminApprovalsApi.get().then((res) => res.data.data),
  });

  const instituteActionMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: 'approve' | 'reject'; note: string }) =>
      action === 'approve'
        ? instituteApplicationApi.approve(id, note)
        : instituteApplicationApi.reject(id, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-approvals'] });
      setDecisionModal(null);
      setReviewNote('');
    },
  });

  const courseActionMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      courseApi.update(id, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-approvals'] });
      setDecisionModal(null);
      setReviewNote('');
    },
  });

  const data = approvalsQuery.data || { institutes: [], admissions: [], courses: [], counts: {} };

  const handleConfirmDecision = () => {
    if (!decisionModal) return;
    const { category, type, item } = decisionModal;
    if (category === 'institutes') {
      instituteActionMutation.mutate({ id: item.id, action: type, note: reviewNote });
    } else if (category === 'courses') {
      courseActionMutation.mutate({
        id: item.id,
        status: type === 'approve' ? 'published' : 'archived',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Workflow Approvals Hub
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Centralized queue for institute registrations, admissions, and platform-wide course reviews
          </p>
        </div>
        <button
          onClick={() => approvalsQuery.refetch()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <RefreshCw size={13} className={approvalsQuery.isFetching ? 'animate-spin' : ''} />
          Refresh Queue
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('institutes')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'institutes'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <Building2 size={15} />
          <span>Institute Applications</span>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            {data.institutes?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('admissions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'admissions'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <UserCheck size={15} />
          <span>Student Admissions</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {data.admissions?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'courses'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <BookOpen size={15} />
          <span>Course Submissions</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {data.courses?.length || 0}
          </span>
        </button>
      </div>

      {/* Content for Institute Applications */}
      {activeTab === 'institutes' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="py-3 pl-4 pr-3">Institute Name</th>
                  <th className="py-3 px-3">Contact Email</th>
                  <th className="py-3 px-3">Applicant</th>
                  <th className="py-3 px-3">Submitted Date</th>
                  <th className="py-3 pr-4 pl-3 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {approvalsQuery.isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Loading pending applications...
                    </td>
                  </tr>
                ) : data.institutes?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No pending institute applications in queue. All clear!
                    </td>
                  </tr>
                ) : (
                  data.institutes?.map((item: any) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 pl-4 pr-3 font-semibold text-slate-900 dark:text-white">
                        {item.institution_name}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{item.contact_email}</td>
                      <td className="py-3 px-3 text-slate-500">{item.applicant_name || 'Self-Registered'}</td>
                      <td className="py-3 px-3 text-slate-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4 pl-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() =>
                              setDecisionModal({ category: 'institutes', type: 'approve', item })
                            }
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400"
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button
                            onClick={() =>
                              setDecisionModal({ category: 'institutes', type: 'reject', item })
                            }
                            className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400"
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content for Admissions */}
      {activeTab === 'admissions' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="py-3 pl-4 pr-3">Applicant Name</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Target Institute</th>
                  <th className="py-3 px-3">Program</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 pr-4 pl-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {data.admissions?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No pending admission applications.
                    </td>
                  </tr>
                ) : (
                  data.admissions?.map((item: any) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 pl-4 pr-3 font-semibold text-slate-900 dark:text-white">
                        {item.full_name}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{item.email}</td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {item.institution_name}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{item.program || 'General Program'}</td>
                      <td className="py-3 px-3 text-slate-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4 pl-3 text-right">
                        <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                          Pending Review
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content for Courses */}
      {activeTab === 'courses' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="py-3 pl-4 pr-3">Course Title</th>
                  <th className="py-3 px-3">Institute / Creator</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Created Date</th>
                  <th className="py-3 pr-4 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {data.courses?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No draft courses awaiting publication approval.
                    </td>
                  </tr>
                ) : (
                  data.courses?.map((item: any) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 pl-4 pr-3 font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {item.institution_name || item.creator_name || 'Global Platform'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4 pl-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() =>
                              setDecisionModal({ category: 'courses', type: 'approve', item })
                            }
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400"
                          >
                            Publish
                          </button>
                          <button
                            onClick={() =>
                              setDecisionModal({ category: 'courses', type: 'reject', item })
                            }
                            className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400"
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Decision Confirmation Modal */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertCircle
                  size={18}
                  className={decisionModal.type === 'approve' ? 'text-emerald-600' : 'text-rose-600'}
                />
                <h3 className="text-base font-bold capitalize text-slate-900 dark:text-white">
                  {decisionModal.type} {decisionModal.category.slice(0, -1)}
                </h3>
              </div>
              <button
                onClick={() => setDecisionModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to <strong>{decisionModal.type}</strong> this{' '}
              {decisionModal.item.institution_name || decisionModal.item.title || 'request'}?
            </p>

            <div className="mt-4">
              <label className="text-[11px] font-semibold text-slate-500">
                Decision Note / Reviewer Reason (Optional)
              </label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Enter review comments for the audit log..."
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDecisionModal(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecision}
                disabled={instituteActionMutation.isPending || courseActionMutation.isPending}
                className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition ${
                  decisionModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {decisionModal.type}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

