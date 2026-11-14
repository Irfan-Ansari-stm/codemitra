'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Download, CheckCircle2, XCircle, Eye,
  Building2, Trophy, Flame, RefreshCw, X, ShieldAlert
} from 'lucide-react';
import { superAdminStudentsApi, tenantApi, getErrorMessage } from '@/lib/api';

export default function SuperAdminStudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [page, setPage] = useState(1);
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
  const [assigningStudent, setAssigningStudent] = useState<any | null>(null);
  const [targetTenantId, setTargetTenantId] = useState<string>('');

  const tenantsQuery = useQuery({
    queryKey: ['admin-tenants-list'],
    queryFn: () => tenantApi.list(1, 100).then((res) => res.data.data),
  });

  const studentsQuery = useQuery({
    queryKey: ['super-admin-students', search, selectedTenant, statusFilter, verificationFilter, page],
    queryFn: () =>
      superAdminStudentsApi
        .list({
          search: search.trim() || undefined,
          tenantId: selectedTenant || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          verificationStatus: verificationFilter !== 'all' ? verificationFilter : undefined,
          page,
          limit: 20,
        })
        .then((res) => res.data),
  });

  const studentDetailsQuery = useQuery({
    queryKey: ['super-admin-student-details', viewingStudentId],
    queryFn: () => superAdminStudentsApi.getDetails(viewingStudentId!).then((res) => res.data.data),
    enabled: Boolean(viewingStudentId),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      superAdminStudentsApi.verify(id, isVerified),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-students'] });
      if (viewingStudentId) {
        void queryClient.invalidateQueries({ queryKey: ['super-admin-student-details', viewingStudentId] });
      }
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isSuspended }: { id: string; isSuspended: boolean }) =>
      superAdminStudentsApi.toggleStatus(id, isSuspended),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-students'] });
      if (viewingStudentId) {
        void queryClient.invalidateQueries({ queryKey: ['super-admin-student-details', viewingStudentId] });
      }
    },
  });

  const assignTenantMutation = useMutation({
    mutationFn: ({ id, tenantId }: { id: string; tenantId: string | null }) =>
      superAdminStudentsApi.assignInstitution(id, tenantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-students'] });
      setAssigningStudent(null);
      if (viewingStudentId) {
        void queryClient.invalidateQueries({ queryKey: ['super-admin-student-details', viewingStudentId] });
      }
    },
  });

  const handleExport = async () => {
    try {
      const res = await superAdminStudentsApi.export(selectedTenant || undefined);
      const rows = res.data?.data || [];
      if (!rows.length) return;
      const headers = ['Student ID', 'Name', 'Email', 'Institution', 'Status', 'Verified', 'Problems Solved', 'Total Score'];
      const csv = [
        headers.join(','),
        ...rows.map((r: any) => [
          `"${r.id || ''}"`,
          `"${(r.name || '').replace(/"/g, '""')}"`,
          `"${r.email || ''}"`,
          `"${(r.institution || 'Unassigned').replace(/"/g, '""')}"`,
          r.is_active ? 'Active' : 'Inactive',
          r.is_email_verified ? 'Verified' : 'Unverified',
          r.problems_solved || 0,
          Math.round(Number(r.total_score || 0)),
        ].join(',')),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `institute_students_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const students = studentsQuery.data?.data || [];
  const total = (studentsQuery.data as any)?.total || 0;
  const totalPages = (studentsQuery.data as any)?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Institute Student Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Platform-wide cross-institute student records, verification, and academic progress monitoring
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

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="w-full sm:w-56">
            <select
              value={selectedTenant}
              onChange={(e) => {
                setSelectedTenant(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="">All Institutes ({tenantsQuery.data?.length || 0})</option>
              {tenantsQuery.data?.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value as any);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => studentsQuery.refetch()}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw size={13} className={studentsQuery.isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Students Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="py-3 pl-4 pr-3">Student</th>
                <th className="py-3 px-3">Institute</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Verification</th>
                <th className="py-3 px-3">Problems Solved</th>
                <th className="py-3 px-3">Score & Streak</th>
                <th className="py-3 px-3">Joined Date</th>
                <th className="py-3 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {studentsQuery.isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading student records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No institute students found matching criteria.
                  </td>
                </tr>
              ) : (
                students.map((student: any) => {
                  const isSuspended = Boolean(student.metadata?.isSuspended);
                  const isActive = Boolean(student.isActive ?? student.is_active);
                  const isVerified = Boolean(student.isEmailVerified ?? student.is_email_verified);
                  const tenantName = student.tenantName || student.tenant_name || student.institution_name || 'Unassigned';
                  const joinedDate = student.createdAt || student.created_at;
                  const problemsSolved = student.totalProblemsSolved ?? student.total_problems_solved ?? 0;
                  const score = Math.round(Number(student.totalScore ?? student.total_score ?? 0));
                  const streak = student.currentStreakDays ?? student.current_streak_days ?? 0;

                  return (
                    <tr key={student.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 pl-4 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {student.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{student.name}</p>
                            <p className="text-[11px] text-slate-400">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Building2 size={12} className="text-slate-400" />
                          {tenantName}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isSuspended
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {isSuspended ? 'Suspended' : isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() =>
                            verifyMutation.mutate({
                              id: student.id,
                              isVerified: !isVerified,
                            })
                          }
                          title={isVerified ? 'Click to unverify' : 'Click to verify'}
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold transition ${
                            isVerified
                              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}
                        >
                          {isVerified ? (
                            <>
                              <CheckCircle2 size={11} /> Verified
                            </>
                          ) : (
                            <>
                              <XCircle size={11} /> Unverified
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {problemsSolved}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <Trophy size={12} className="text-amber-500" />
                            {score}
                          </span>
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <Flame size={12} className="text-orange-500" />
                            {streak}d
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {joinedDate ? new Date(joinedDate).toLocaleDateString() : 'Not available'}
                      </td>
                      <td className="py-3 pr-4 pl-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingStudentId(student.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="View Student Details"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => {
                              setAssigningStudent(student);
                              setTargetTenantId(student.tenantId || student.tenant_id || '');
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="Assign Institution"
                          >
                            <Building2 size={13} />
                          </button>
                          <button
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: student.id,
                                isSuspended: !isSuspended,
                              })
                            }
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 transition ${
                              isSuspended
                                ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40'
                            } dark:border-slate-700`}
                            title={isSuspended ? 'Reactivate Student' : 'Suspend Student'}
                          >
                            <ShieldAlert size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Showing {students.length} of {total} institute students
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

      {/* Assign Institution Modal */}
      {assigningStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Assign Institution
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Update institution membership for {assigningStudent.name}
                </p>
              </div>
              <button
                onClick={() => setAssigningStudent(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Institution
                <select
                  value={targetTenantId}
                  onChange={(e) => setTargetTenantId(e.target.value)}
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">None (Unassigned)</option>
                  {tenantsQuery.data?.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>

              {assignTenantMutation.error && (
                <p role="alert" className="text-xs text-rose-600">
                  {getErrorMessage(assignTenantMutation.error)}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssigningStudent(null)}
                  className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={assignTenantMutation.isPending}
                  onClick={() =>
                    assignTenantMutation.mutate({
                      id: assigningStudent.id,
                      tenantId: targetTenantId || null,
                    })
                  }
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {assignTenantMutation.isPending ? 'Updating…' : 'Save Assignment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Student Details Modal */}
      {viewingStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {(studentDetailsQuery.data?.name || 'ST').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {studentDetailsQuery.data?.name || 'Student Details'}
                  </h3>
                  <p className="text-xs text-slate-400">{studentDetailsQuery.data?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingStudentId(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {studentDetailsQuery.isLoading ? (
              <p className="py-8 text-center text-xs text-slate-500">Loading student details...</p>
            ) : studentDetailsQuery.error ? (
              <p className="py-6 text-center text-xs text-rose-600">
                {getErrorMessage(studentDetailsQuery.error)}
              </p>
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                {/* Profile & Institution info */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Institution</span>
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                      <Building2 size={13} className="text-blue-500" />
                      {studentDetailsQuery.data?.tenantName || studentDetailsQuery.data?.tenant_name || 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Account Status</span>
                    <span
                      className={`inline-block font-semibold mt-0.5 ${
                        studentDetailsQuery.data?.metadata?.isSuspended
                          ? 'text-rose-600'
                          : (studentDetailsQuery.data?.isActive ?? studentDetailsQuery.data?.is_active)
                          ? 'text-emerald-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {studentDetailsQuery.data?.metadata?.isSuspended
                        ? 'Suspended'
                        : (studentDetailsQuery.data?.isActive ?? studentDetailsQuery.data?.is_active)
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Verification Status</span>
                    <span
                      className={`inline-block font-semibold mt-0.5 ${
                        studentDetailsQuery.data?.isEmailVerified ?? studentDetailsQuery.data?.is_email_verified
                          ? 'text-blue-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {studentDetailsQuery.data?.isEmailVerified ?? studentDetailsQuery.data?.is_email_verified
                        ? 'Verified'
                        : 'Unverified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Joined Date</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {studentDetailsQuery.data?.createdAt || studentDetailsQuery.data?.created_at
                        ? new Date(studentDetailsQuery.data?.createdAt || studentDetailsQuery.data?.created_at).toLocaleString()
                        : 'Not available'}
                    </span>
                  </div>
                </div>

                {/* Academic & Coding Performance */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Coding & Academic Performance
                  </h4>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
                      <span className="text-base font-bold text-blue-600 dark:text-blue-400 block">
                        {studentDetailsQuery.data?.totalProblemsSolved ?? studentDetailsQuery.data?.total_problems_solved ?? 0}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Problems</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
                      <span className="text-base font-bold text-amber-600 dark:text-amber-400 block">
                        {Math.round(Number(studentDetailsQuery.data?.totalScore ?? studentDetailsQuery.data?.total_score ?? 0))}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Score</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
                      <span className="text-base font-bold text-orange-500 block">
                        {studentDetailsQuery.data?.currentStreakDays ?? studentDetailsQuery.data?.current_streak_days ?? 0}d
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Streak</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
                      <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 block">
                        {studentDetailsQuery.data?.progressChaptersCount ?? studentDetailsQuery.data?.progress_chapters_count ?? 0}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Progress</span>
                    </div>
                  </div>
                </div>

                {/* Additional metadata */}
                <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <p>
                    <strong>Student ID:</strong> <span className="font-mono text-slate-600 dark:text-slate-400">{studentDetailsQuery.data?.id}</span>
                  </p>
                  <p>
                    <strong>Submissions:</strong> {studentDetailsQuery.data?.totalSubmissions ?? studentDetailsQuery.data?.total_submissions ?? 0} total
                  </p>
                  <p>
                    <strong>Last Login:</strong>{' '}
                    {studentDetailsQuery.data?.lastLoginAt || studentDetailsQuery.data?.last_login_at
                      ? new Date(studentDetailsQuery.data?.lastLoginAt || studentDetailsQuery.data?.last_login_at).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              {studentDetailsQuery.data && (
                <button
                  onClick={() => {
                    const isVer = Boolean(
                      studentDetailsQuery.data?.isEmailVerified ?? studentDetailsQuery.data?.is_email_verified
                    );
                    verifyMutation.mutate({
                      id: studentDetailsQuery.data.id,
                      isVerified: !isVer,
                    });
                  }}
                  className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  {studentDetailsQuery.data?.isEmailVerified ?? studentDetailsQuery.data?.is_email_verified
                    ? 'Mark Unverified'
                    : 'Verify Student'}
                </button>
              )}
              <button
                onClick={() => setViewingStudentId(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
