'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, UserCheck, BookOpen, RefreshCw, Search,
  CheckCircle2, XCircle, AlertTriangle, Eye, Clock,
  Inbox, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { superAdminApprovalsApi } from '@/lib/api';
import { DecisionModal, DecisionType } from './DecisionModal';
import { ApprovalDetailsDrawer } from './ApprovalDetailsDrawer';

type Tab = 'institutes' | 'admissions' | 'courses';

export default function SuperAdminApprovalsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('institutes');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals & Drawers state
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<any | null>(null);
  const [decisionModalState, setDecisionModalState] = useState<{
    isOpen: boolean;
    type: DecisionType;
    category: Tab;
    item: any;
  } | null>(null);

  // Success message toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page when tab or status changes
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  // 1. Summary Query
  const summaryQuery = useQuery({
    queryKey: ['super-admin-approvals-summary'],
    queryFn: () => superAdminApprovalsApi.getSummary().then((res) => res.data.data),
    refetchInterval: 30000,
  });

  // 2. Data Query for current Tab
  const listQuery = useQuery({
    queryKey: ['super-admin-approvals-list', activeTab, debouncedSearch, statusFilter, page],
    queryFn: async () => {
      if (activeTab === 'institutes') {
        const res = await superAdminApprovalsApi.listInstitutes({
          search: debouncedSearch || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          page,
          limit,
        });
        return res.data.data;
      } else if (activeTab === 'admissions') {
        const res = await superAdminApprovalsApi.listAdmissions({
          search: debouncedSearch || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          page,
          limit,
        });
        return res.data.data;
      } else {
        const res = await superAdminApprovalsApi.listCourses({
          search: debouncedSearch || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          page,
          limit,
        });
        return res.data.data;
      }
    },
  });

  // Action Mutations
  const executeDecisionMutation = useMutation({
    mutationFn: async ({
      category,
      type,
      id,
      payload,
    }: {
      category: Tab;
      type: DecisionType;
      id: string;
      payload: { note?: string; reason?: string; comments?: string; adminNotes?: string };
    }) => {
      if (category === 'institutes') {
        if (type === 'approve') {
          return superAdminApprovalsApi.approveInstitute(id, payload.note);
        } else if (type === 'reject') {
          return superAdminApprovalsApi.rejectInstitute(id, payload.reason!, payload.adminNotes);
        } else {
          return superAdminApprovalsApi.requestInstituteChanges(id, payload.comments!);
        }
      } else if (category === 'admissions') {
        if (type === 'approve') {
          return superAdminApprovalsApi.approveAdmission(id, payload.note);
        } else if (type === 'reject') {
          return superAdminApprovalsApi.rejectAdmission(id, payload.reason!, payload.adminNotes);
        } else {
          return superAdminApprovalsApi.requestAdmissionChanges(id, payload.comments!);
        }
      } else {
        // courses
        if (type === 'approve') {
          return superAdminApprovalsApi.approveCourse(id, payload.note);
        } else if (type === 'reject') {
          return superAdminApprovalsApi.rejectCourse(id, payload.reason!, payload.adminNotes);
        } else {
          return superAdminApprovalsApi.requestCourseChanges(id, payload.comments!);
        }
      }
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-approvals-summary'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-approvals-list'] });
      setDecisionModalState(null);
      setSelectedItemForDetails(null);

      const actionText =
        variables.type === 'approve'
          ? 'approved successfully'
          : variables.type === 'reject'
          ? 'rejected'
          : 'changes requested';
      setToastMessage(`Record has been ${actionText}.`);
      setTimeout(() => setToastMessage(null), 4000);
    },
  });

  const handleConfirmDecision = (payload: { note?: string; reason?: string; comments?: string; adminNotes?: string }) => {
    if (!decisionModalState) return;
    executeDecisionMutation.mutate({
      category: decisionModalState.category,
      type: decisionModalState.type,
      id: decisionModalState.item.id,
      payload,
    });
  };

  const openDecisionModal = (type: DecisionType, item: any, category: Tab = activeTab) => {
    setDecisionModalState({
      isOpen: true,
      type,
      category,
      item,
    });
  };

  const counts = summaryQuery.data?.counts || {
    institutes: 0,
    admissions: 0,
    courses: 0,
    total: 0,
    approvedToday: 0,
    rejectedToday: 0,
    changesRequested: 0,
  };

  const listData = listQuery.data || { items: [], total: 0, totalPages: 1 };

  const getStatusPill = (status: string) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 size={11} /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
            <XCircle size={11} /> Rejected
          </span>
        );
      case 'changes_requested':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
            <AlertTriangle size={11} /> Changes Requested
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
            <Clock size={11} /> Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
            <Clock size={11} /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl dark:bg-white dark:text-slate-900">
          <Check size={14} className="text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

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
          onClick={() => {
            void summaryQuery.refetch();
            void listQuery.refetch();
          }}
          disabled={listQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <RefreshCw size={14} className={listQuery.isFetching ? 'animate-spin text-blue-600' : ''} />
          Refresh Queue
        </button>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Pending</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{counts.total}</p>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 font-medium">
            <Clock size={11} /> Live queue
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Institutes</p>
          <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{counts.institutes}</p>
          <p className="mt-1 text-[10px] text-slate-400">Awaiting onboarding</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Admissions</p>
          <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">{counts.admissions}</p>
          <p className="mt-1 text-[10px] text-slate-400">Candidate files</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Courses</p>
          <p className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">{counts.courses}</p>
          <p className="mt-1 text-[10px] text-slate-400">Publication reviews</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Approved Today</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{counts.approvedToday}</p>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
            <CheckCircle2 size={11} /> Verified
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Rejected Today</p>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">{counts.rejectedToday}</p>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-600 font-medium">
            <XCircle size={11} /> Declined
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => handleTabChange('institutes')}
          className={`flex items-center gap-2.5 border-b-2 px-5 py-3.5 text-xs font-semibold transition ${
            activeTab === 'institutes'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <Building2 size={16} />
          <span>Institute Applications</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'institutes'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {counts.institutes}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('admissions')}
          className={`flex items-center gap-2.5 border-b-2 px-5 py-3.5 text-xs font-semibold transition ${
            activeTab === 'admissions'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <UserCheck size={16} />
          <span>Student Admissions</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'admissions'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {counts.admissions}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('courses')}
          className={`flex items-center gap-2.5 border-b-2 px-5 py-3.5 text-xs font-semibold transition ${
            activeTab === 'courses'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <BookOpen size={16} />
          <span>Course Submissions</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'courses'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {counts.courses}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'institutes'
                ? 'Search institute, contact, city, app #...'
                : activeTab === 'admissions'
                ? 'Search candidate, email, program, institute...'
                : 'Search course title, category, instructor...'
            }
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="changes_requested">Changes Requested</option>
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          {/* TAB 1: Institutes */}
          {activeTab === 'institutes' && (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <tr>
                  <th className="py-3.5 pl-5 pr-3">App # / Institute</th>
                  <th className="py-3.5 px-3">Type / Category</th>
                  <th className="py-3.5 px-3">Contact Person & Email</th>
                  <th className="py-3.5 px-3">Location</th>
                  <th className="py-3.5 px-3">Submitted</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 pr-5 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {listQuery.isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading institute applications...
                    </td>
                  </tr>
                ) : listData.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Inbox size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      No institute applications found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  listData.items.map((item: any) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 pl-5 pr-3">
                        <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          {item.application_number || 'INS-APP'}
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white">{item.institution_name}</p>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                        {item.institution_type || 'Autonomous University'}
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.contact_person || item.applicant_name || 'Authorized Dean'}
                        </p>
                        <p className="text-[11px] text-slate-500">{item.contact_email}</p>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                        {[item.city, item.state].filter(Boolean).join(', ') || 'N/A'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3">{getStatusPill(item.status)}</td>
                      <td className="py-3.5 pr-5 pl-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedItemForDetails(item)}
                            title="View Inspection Details"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => openDecisionModal('approve', item)}
                            title="Approve Institute"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400"
                          >
                            <CheckCircle2 size={12} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openDecisionModal('reject', item)}
                            title="Reject Institute"
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => openDecisionModal('request_changes', item)}
                            title="Request Changes"
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400"
                          >
                            <AlertTriangle size={12} /> Changes
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 2: Admissions */}
          {activeTab === 'admissions' && (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <tr>
                  <th className="py-3.5 pl-5 pr-3">App # / Candidate</th>
                  <th className="py-3.5 px-3">Contact Email & Phone</th>
                  <th className="py-3.5 px-3">Target Institute</th>
                  <th className="py-3.5 px-3">Academic Program</th>
                  <th className="py-3.5 px-3">Submitted</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 pr-5 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {listQuery.isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading student admissions...
                    </td>
                  </tr>
                ) : listData.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Inbox size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      No student admission files found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  listData.items.map((item: any) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 pl-5 pr-3">
                        <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          {item.application_number}
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white">{item.full_name}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="text-slate-800 dark:text-slate-200">{item.email}</p>
                        <p className="text-[11px] text-slate-400">{item.phone || 'No phone'}</p>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {item.institution_name || 'CodeVerse Campus'}
                      </td>
                      <td className="py-3.5 px-3 font-medium text-blue-600 dark:text-blue-400">
                        {item.program}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3">{getStatusPill(item.status)}</td>
                      <td className="py-3.5 pr-5 pl-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedItemForDetails(item)}
                            title="Inspect Candidate Dossier"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => openDecisionModal('approve', item)}
                            title="Approve Candidate Admission"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400"
                          >
                            <CheckCircle2 size={12} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openDecisionModal('reject', item)}
                            title="Reject Candidate Admission"
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => openDecisionModal('request_changes', item)}
                            title="Request Change / Document"
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400"
                          >
                            <AlertTriangle size={12} /> Changes
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 3: Courses */}
          {activeTab === 'courses' && (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <tr>
                  <th className="py-3.5 pl-5 pr-3">Submission # / Course</th>
                  <th className="py-3.5 px-3">Category & Level</th>
                  <th className="py-3.5 px-3">Institute / Author</th>
                  <th className="py-3.5 px-3">Content Scope</th>
                  <th className="py-3.5 px-3">Submitted</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 pr-5 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {listQuery.isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading course submissions...
                    </td>
                  </tr>
                ) : listData.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Inbox size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      No course submissions found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  listData.items.map((item: any) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 pl-5 pr-3">
                        <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400">
                          {item.submission_number || 'SUB-2026'}
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {item.category || 'General'}
                        </span>
                        <span className="ml-1 text-[11px] text-slate-400">({item.level || 'Intermediate'})</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.instructor_name || item.creator_name || 'CodeVerse Instructor'}
                        </p>
                        <p className="text-[11px] text-slate-500">{item.institution_name || 'Global Catalog'}</p>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                        {item.modules_count || 12} modules • {item.chapters_count || 48} chapters
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3">{getStatusPill(item.status)}</td>
                      <td className="py-3.5 pr-5 pl-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedItemForDetails(item)}
                            title="Inspect Course Specifications"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => openDecisionModal('approve', item)}
                            title="Approve & Publish Course"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400"
                          >
                            <CheckCircle2 size={12} /> Publish
                          </button>
                          <button
                            type="button"
                            onClick={() => openDecisionModal('reject', item)}
                            title="Reject Course"
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => openDecisionModal('request_changes', item)}
                            title="Request Syllabus Modifications"
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400"
                          >
                            <AlertTriangle size={12} /> Changes
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Server-Side Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{listData.items.length}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{listData.total}</span> records
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || listQuery.isLoading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 text-xs font-medium text-slate-700 dark:text-slate-300">
              Page {page} of {Math.max(1, listData.totalPages || 1)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(listData.totalPages || 1, p + 1))}
              disabled={page >= (listData.totalPages || 1) || listQuery.isLoading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Decision Confirmation Modal */}
      {decisionModalState && (
        <DecisionModal
          isOpen={decisionModalState.isOpen}
          type={decisionModalState.type}
          category={decisionModalState.category}
          item={decisionModalState.item}
          isLoading={executeDecisionMutation.isPending}
          onClose={() => setDecisionModalState(null)}
          onConfirm={handleConfirmDecision}
        />
      )}

      {/* Item Details Inspection Drawer */}
      {selectedItemForDetails && (
        <ApprovalDetailsDrawer
          isOpen={Boolean(selectedItemForDetails)}
          category={activeTab}
          item={selectedItemForDetails}
          onClose={() => setSelectedItemForDetails(null)}
          onActionClick={(type, item) => openDecisionModal(type, item, activeTab)}
        />
      )}
    </div>
  );
}
