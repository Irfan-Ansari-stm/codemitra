'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, X, Loader2 } from 'lucide-react';

export type DecisionType = 'approve' | 'reject' | 'request_changes';

interface DecisionModalProps {
  isOpen: boolean;
  type: DecisionType;
  category: 'institutes' | 'admissions' | 'courses';
  item: any;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (payload: { note?: string; reason?: string; comments?: string; adminNotes?: string }) => void;
}

export function DecisionModal({
  isOpen,
  type,
  category,
  item,
  isLoading,
  onClose,
  onConfirm,
}: DecisionModalProps) {
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [note, setNote] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const categoryLabel =
    category === 'institutes'
      ? 'Institute Application'
      : category === 'admissions'
      ? 'Student Admission'
      : 'Course Submission';

  const itemTitle =
    item.institution_name ||
    item.full_name ||
    item.title ||
    item.application_number ||
    item.submission_number ||
    'Selected Record';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (type === 'reject') {
      if (!reason.trim()) {
        setError('Please provide a specific rejection reason for the applicant.');
        return;
      }
      onConfirm({ reason: reason.trim(), adminNotes: adminNotes.trim() || undefined });
    } else if (type === 'request_changes') {
      if (!comments.trim()) {
        setError('Please specify the required changes or missing documents.');
        return;
      }
      onConfirm({ comments: comments.trim(), adminNotes: adminNotes.trim() || undefined });
    } else {
      // Approve
      onConfirm({ note: note.trim() || undefined });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            {type === 'approve' && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CheckCircle2 size={20} />
              </div>
            )}
            {type === 'reject' && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                <XCircle size={20} />
              </div>
            )}
            {type === 'request_changes' && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <AlertTriangle size={20} />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {type === 'approve'
                  ? `Approve ${categoryLabel}`
                  : type === 'reject'
                  ? `Reject ${categoryLabel}`
                  : `Request Changes on ${categoryLabel}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Action target: <span className="font-semibold text-slate-700 dark:text-slate-300">{itemTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {type === 'approve' && (
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Are you sure you want to approve this {categoryLabel.toLowerCase()}? This will officially activate the
                account, publish the course, or confirm enrollment in the CodeVerse platform.
              </p>
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Approval Note / Welcome Message (Optional)
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., Credentials verified. Approved for full platform access."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
          )}

          {type === 'reject' && (
            <div>
              <p className="text-xs text-rose-600 dark:text-rose-400">
                Rejection is a significant action. The applicant will be notified with the reason specified below.
              </p>
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rejection Reason <span className="text-rose-500">* (Required)</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g., Application rejected due to missing mandatory statutory accreditation credentials."
                  className="mt-1.5 w-full rounded-xl border border-rose-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none dark:border-rose-900/60 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Internal Admin Notes (Optional)
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Confidential reviewer remarks for audit log..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
          )}

          {type === 'request_changes' && (
            <div>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Requesting changes transitions this application into <strong>Changes Requested</strong> status. The
                applicant will be invited to update their submission.
              </p>
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Required Modifications & Comments <span className="text-amber-500">* (Required)</span>
                </label>
                <textarea
                  rows={4}
                  value={comments}
                  onChange={(e) => {
                    setComments(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g., Please attach the official university affiliation certificate and re-upload page 2 of the syllabus."
                  className="mt-1.5 w-full rounded-xl border border-amber-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none dark:border-amber-900/60 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-sm transition ${
                type === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : type === 'reject'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isLoading && <Loader2 size={13} className="animate-spin" />}
              <span>
                {isLoading
                  ? 'Processing...'
                  : type === 'approve'
                  ? 'Confirm Approval'
                  : type === 'reject'
                  ? 'Confirm Rejection'
                  : 'Send Feedback & Request Changes'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
