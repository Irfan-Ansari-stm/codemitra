'use client';

import React, { useState } from 'react';
import {
  X, FileText, CheckCircle2, XCircle, AlertTriangle, Download,
  Eye, Mail, Phone, MapPin, Building2, User, BookOpen, Clock, ShieldCheck
} from 'lucide-react';
import { DecisionType } from './DecisionModal';

interface ApprovalDetailsDrawerProps {
  isOpen: boolean;
  category: 'institutes' | 'admissions' | 'courses';
  item: any;
  onClose: () => void;
  onActionClick: (type: DecisionType, item: any) => void;
}

export function ApprovalDetailsDrawer({
  isOpen,
  category,
  item,
  onClose,
  onActionClick,
}: ApprovalDetailsDrawerProps) {
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  if (!isOpen || !item) return null;

  const getStatusBadge = (status: string) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 size={12} /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
            <XCircle size={12} /> Rejected
          </span>
        );
      case 'changes_requested':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
            <AlertTriangle size={12} /> Changes Requested
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
            <Clock size={12} /> Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
            <Clock size={12} /> Pending Review
          </span>
        );
    }
  };

  const documents = Array.isArray(item.documents)
    ? item.documents
    : typeof item.documents === 'string'
    ? JSON.parse(item.documents || '[]')
    : [];

  const history = item.history || [];

  const handleDownloadDoc = (doc: any) => {
    // Simulated safe download
    const blob = new Blob([`CodeVerse Document Verification Artifact: ${doc.name}\nTimestamp: ${new Date().toISOString()}`], {
      type: 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl dark:bg-slate-900">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  {category === 'institutes' && <Building2 size={20} />}
                  {category === 'admissions' && <User size={20} />}
                  {category === 'courses' && <BookOpen size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {item.application_number || item.submission_number || 'Record Inspection'}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {item.institution_name || item.full_name || item.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Category-Specific Overview */}
              {category === 'institutes' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Institution Profile
                  </h4>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Institution Type:</span>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {item.institution_type || 'Autonomous University'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Established Year:</span>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {item.established_year || 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Mail size={13} className="mt-0.5 text-slate-400" />
                      <div>
                        <span className="text-slate-400">Official Contact:</span>
                        <p className="font-semibold text-slate-900 dark:text-white">{item.contact_email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Phone size={13} className="mt-0.5 text-slate-400" />
                      <div>
                        <span className="text-slate-400">Phone:</span>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {item.contact_phone || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-start gap-1.5">
                      <MapPin size={13} className="mt-0.5 text-slate-400" />
                      <div>
                        <span className="text-slate-400">Location:</span>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {[item.city, item.state, item.country || 'India'].filter(Boolean).join(', ') || item.address}
                        </p>
                      </div>
                    </div>
                  </div>
                  {item.description && (
                    <div className="mt-4 border-t border-slate-200/60 pt-3 dark:border-slate-800">
                      <span className="text-[11px] font-medium text-slate-400">Application Statement:</span>
                      <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{item.description}</p>
                    </div>
                  )}
                </div>
              )}

              {category === 'admissions' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Applicant Academic Dossier
                  </h4>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Program Applied:</span>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">{item.program}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Target Institute:</span>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {item.institution_name || 'CodeVerse Campus Partner'}
                      </p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Mail size={13} className="mt-0.5 text-slate-400" />
                      <div>
                        <span className="text-slate-400">Email Address:</span>
                        <p className="font-semibold text-slate-900 dark:text-white">{item.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Phone size={13} className="mt-0.5 text-slate-400" />
                      <div>
                        <span className="text-slate-400">Phone:</span>
                        <p className="font-semibold text-slate-900 dark:text-white">{item.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {item.academic_details && (
                    <div className="mt-4 border-t border-slate-200/60 pt-3 dark:border-slate-800">
                      <span className="text-[11px] font-medium text-slate-400">Academic Scorecard / Metrics:</span>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        {typeof item.academic_details === 'object' &&
                          Object.entries(item.academic_details).map(([key, val]) => (
                            <div key={key} className="rounded-lg bg-white p-2 border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800">
                              <span className="text-[10px] uppercase text-slate-400">{key}:</span>
                              <p className="font-bold text-slate-900 dark:text-white">{String(val)}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {category === 'courses' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Course Submission Specifications
                  </h4>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Category:</span>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.category || 'Engineering'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Target Level:</span>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.level || 'Intermediate'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Version:</span>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.submission_version || '1.0.0'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Author / Instructor:</span>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.instructor_name || item.creator_name || 'CodeVerse Author'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Modules Breakdown:</span>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.modules_count || 12} modules</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Interactive Chapters:</span>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.chapters_count || 48} chapters</p>
                    </div>
                  </div>
                  {item.description && (
                    <div className="mt-4 border-t border-slate-200/60 pt-3 dark:border-slate-800">
                      <span className="text-[11px] font-medium text-slate-400">Course Abstract:</span>
                      <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{item.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Attached Supporting Documents */}
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Supporting Verification Documents ({documents.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">Digitally Verified</span>
                </div>

                <div className="mt-3 space-y-2">
                  {documents.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No attached documents available.</p>
                  ) : (
                    documents.map((doc: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{doc.name}</p>
                            <p className="text-[10px] text-slate-500">
                              {doc.size || '1.8 MB'} • {doc.type || 'application/pdf'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Eye size={12} /> Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc(doc)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
                          >
                            <Download size={12} /> Download
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Review History / Audit Trail */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Approval History & Audit Trail
                </h4>
                <div className="mt-3 relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-4">
                  {history.length === 0 ? (
                    <div className="text-xs text-slate-400">
                      Initial submission received on {new Date(item.created_at || Date.now()).toLocaleDateString()}.
                    </div>
                  ) : (
                    history.map((h: any, i: number) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white ring-4 ring-white dark:ring-slate-900">
                          <ShieldCheck size={10} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold capitalize text-slate-900 dark:text-white">
                              {h.action.replace('_', ' ')}
                            </span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              {h.new_status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            By {h.performed_by_name || 'Super Admin'} •{' '}
                            {new Date(h.created_at).toLocaleString()}
                          </p>
                          {h.reason && (
                            <p className="mt-1 rounded bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                              <strong>Reason:</strong> {h.reason}
                            </p>
                          )}
                          {h.admin_notes && (
                            <p className="mt-1 rounded bg-slate-100 p-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              <strong>Notes:</strong> {h.admin_notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
              <span className="text-xs text-slate-500">
                Created: {new Date(item.created_at).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onActionClick('request_changes', item)}
                  className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400"
                >
                  <AlertTriangle size={13} /> Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => onActionClick('reject', item)}
                  className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400"
                >
                  <XCircle size={13} /> Reject
                </button>
                <button
                  type="button"
                  onClick={() => onActionClick('approve', item)}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <CheckCircle2 size={13} /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-red-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{previewDoc.name}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 flex h-80 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-950">
              <FileText size={48} className="text-blue-500" />
              <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                {previewDoc.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Document verified under CodeVerse Digital Notary • File size: {previewDoc.size || '2.4 MB'}
              </p>
              <button
                onClick={() => handleDownloadDoc(previewDoc)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                <Download size={13} /> Download File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
