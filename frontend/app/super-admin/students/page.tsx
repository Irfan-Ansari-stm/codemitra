'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Download, CheckCircle2, XCircle, Eye,
  Building2, Trophy, Flame, RefreshCw, X
} from 'lucide-react';
import { superAdminStudentsApi, tenantApi } from '@/lib/api';

export default function SuperAdminStudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [page, setPage] = useState(1);
  const [viewingStudent, setViewingStudent] = useState<any | null>(null);

  const tenantsQuery = useQuery({
    queryKey: ['admin-tenants-list'],
    queryFn: () => tenantApi.list(1, 100).then((res) => res.data.data),
  });

  const studentsQuery = useQuery({
    queryKey: ['super-admin-students', search, selectedTenant, page],
    queryFn: () =>
      superAdminStudentsApi
        .list({ search, tenantId: selectedTenant || undefined, page, limit: 20 })
        .then((res) => res.data),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      superAdminStudentsApi.verify(id, isVerified),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-students'] });
      if (viewingStudent) {
        setViewingStudent((prev: any) => ({ ...prev, is_email_verified: !prev.is_email_verified }));
      }
    },
  });

  const handleExport = async () => {
    try {
      const res = await superAdminStudentsApi.export(selectedTenant || undefined);
      const rows = res.data?.data || [];
      if (!rows.length) return;
      const headers = Object.keys(rows[0]).join(',');
      const csv = [
        headers,
        ...rows.map((r: any) =>
          Object.values(r)
            .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
            .join(',')
        ),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative min-w-[260px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="w-full sm:w-64">
            <select
              value={selectedTenant}
              onChange={(e) => {
                setSelectedTenant(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              <option value="">All Institutes ({tenantsQuery.data?.length || 0})</option>
              {tenantsQuery.data?.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
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
                students.map((student: any) => (
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
                        {student.tenant_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          student.is_active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}
                      >
                        {student.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() =>
                          verifyMutation.mutate({
                            id: student.id,
                            isVerified: !student.is_email_verified,
                          })
                        }
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold transition ${
                          student.is_email_verified
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}
                      >
                        {student.is_email_verified ? (
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
                      {student.total_problems_solved || 0}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <Trophy size={12} className="text-amber-500" />
                          {Math.round(student.total_score || 0)}
                        </span>
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <Flame size={12} className="text-orange-500" />
                          {student.current_streak_days || 0}d
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 pl-3 text-right">
                      <button
                        onClick={() => setViewingStudent(student)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        title="View Details"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Showing {students.length} of {total} students
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

      {/* Student Details Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {viewingStudent.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {viewingStudent.name}
                  </h3>
                  <p className="text-xs text-slate-400">{viewingStudent.email}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-slate-400">Institution</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {viewingStudent.tenant_name || 'None'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-slate-400">Account Status</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {viewingStudent.is_active ? 'Active' : 'Suspended'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-slate-400">Verification Status</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {viewingStudent.is_email_verified ? 'Verified' : 'Unverified'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-slate-400">Joined Date</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {new Date(viewingStudent.created_at).toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-slate-400">Problems Solved</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {viewingStudent.total_problems_solved || 0}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-slate-400">Platform Total Score</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {Math.round(viewingStudent.total_score || 0)} pts
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                onClick={() =>
                  verifyMutation.mutate({
                    id: viewingStudent.id,
                    isVerified: !viewingStudent.is_email_verified,
                  })
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                {viewingStudent.is_email_verified ? 'Mark Unverified' : 'Verify Student'}
              </button>
              <button
                onClick={() => setViewingStudent(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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

