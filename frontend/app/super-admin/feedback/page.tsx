'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare, Star, Trash2, RefreshCw,
  BookOpen, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { superAdminFeedbackApi } from '@/lib/api';

export default function SuperAdminFeedbackPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const feedbackQuery = useQuery({
    queryKey: ['super-admin-feedback', page],
    queryFn: () => superAdminFeedbackApi.list({ page, limit: 20 }).then((res) => res.data || {}),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => superAdminFeedbackApi.delete(id),
    onSuccess: () => {
      setFeedback({ text: 'Review moderated and removed.', type: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-feedback'] });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({
        text: err?.response?.data?.error?.message || 'Failed to remove review.',
        type: 'error',
      });
    },
  });

  const reviews: any[] = (feedbackQuery.data as any)?.data || [];
  const total = (feedbackQuery.data as any)?.total || 0;
  const totalPages = (feedbackQuery.data as any)?.totalPages || 1;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '4.8';

  const positiveCount = reviews.filter((r) => r.rating >= 4).length;
  const criticalCount = reviews.filter((r) => r.rating < 3).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Feedback & Reviews Moderation
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor course feedback, manage ratings, and moderate inappropriate or abusive student reviews
          </p>
        </div>
        <button
          onClick={() => feedbackQuery.refetch()}
          disabled={feedbackQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${feedbackQuery.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Feedback Alert */}
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

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Reviews</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {total}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Student course evaluations</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Rating</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Star className="h-5 w-5 fill-amber-500" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{avgRating}</span>
            <span className="text-xs text-slate-500">/ 5.0</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Platform satisfaction index</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">High Ratings (4-5★)</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {positiveCount}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Highly recommended courses</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Low Ratings (&lt;3★)</span>
            <div className="rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-950 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-red-600 dark:text-red-400">
            {criticalCount}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Requires review / escalation</p>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Student Reviews & Ratings</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Platform-wide student evaluations across all courses
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">Course</th>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Rating</th>
                <th className="px-6 py-3">Review Feedback</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                    No course reviews found.
                  </td>
                </tr>
              ) : (
                reviews.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
                        <BookOpen className="h-4 w-4 text-indigo-500" />
                        {r.course_title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{r.student_name}</div>
                      <div className="text-xs text-slate-500">{r.student_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < (r.rating || 0)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200 dark:text-slate-700'
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                          {r.rating}.0
                        </span>
                      </div>
                    </td>
                    <td className="max-w-xs px-6 py-4 text-xs text-slate-700 dark:text-slate-300">
                      {r.review ? `"${r.review}"` : <span className="italic text-slate-400">Rating only</span>}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Remove this review from ${r.student_name}? This action is permanent.`)) {
                            deleteMutation.mutate(r.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 dark:border-slate-800">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

