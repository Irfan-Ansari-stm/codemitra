'use client';

import { type FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Eye, Pencil, Search, Trash2, X } from 'lucide-react';
import { getErrorMessage, userApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { PageHeading } from '@/components/data/ApiDataView';

type Student = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  phone?: string | null;
  bio?: string | null;
  metadata?: Record<string, unknown>;
};

type StudentForm = {
  name: string;
  phone: string;
  bio: string;
  isActive: boolean;
};

const emptyForm: StudentForm = {
  name: '',
  phone: '',
  bio: '',
  isActive: true,
};
const PAGE_SIZE = 20;

function formatDate(value?: string | null): string {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export default function StudentsPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);
  const [mode, setMode] = useState<'edit' | 'view' | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [formError, setFormError] = useState('');

  const studentsQuery = useQuery({
    queryKey: ['students', user?.tenantId, page, search],
    queryFn: () => userApi.list({
      role: 'institution_student',
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
    }).then((response) => ({
      students: (response.data.data ?? []) as Student[],
      total: response.data.total ?? 0,
    })),
    enabled: user?.role === 'institution_admin',
  });
  const detailQuery = useQuery({
    queryKey: ['student', selected?.id],
    queryFn: () => userApi.get(selected!.id).then((response) => response.data.data as Student),
    enabled: mode === 'view' && !!selected?.id,
  });

  const closeForm = () => {
    setSelected(null);
    setMode(null);
    setForm(emptyForm);
    setFormError('');
  };

  const refreshStudents = () => queryClient.invalidateQueries({ queryKey: ['students'] });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => userApi.update(id, data),
    onSuccess: () => {
      closeForm();
      void refreshStudents();
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => {
      if ((studentsQuery.data?.students.length ?? 0) === 1 && page > 1) setPage(page - 1);
      void refreshStudents();
    },
  });

  function startEdit(student: Student) {
    setSelected(student);
    setForm({
      ...emptyForm,
      name: student.name,
      phone: student.phone ?? '',
      bio: student.bio ?? '',
      isActive: student.isActive,
    });
    setFormError('');
    setMode('edit');
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    if (mode === 'edit' && selected) {
      updateMutation.mutate({
        id: selected.id,
        data: {
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          bio: form.bio.trim() || null,
          isActive: form.isActive,
        },
      });
    }
  }

  const students = studentsQuery.data?.students ?? [];
  const total = studentsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const detail = detailQuery.data ?? selected;
  const isSaving = updateMutation.isPending;

  if (user?.role !== 'institution_admin') {
    return <section role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">Only institution administrators can manage student accounts.</section>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <PageHeading title="Students" description="Manage student accounts in your institution. New institution accounts are provisioned by a super admin." />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Institution students</h2>
            <p className="mt-1 text-xs text-slate-500">{studentsQuery.isLoading ? 'Loading students…' : `${total} ${total === 1 ? 'student' : 'students'}`}</p>
          </div>
          <label className="relative block w-full sm:max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} aria-label="Search students" placeholder="Search name or email" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          </label>
        </div>

        {studentsQuery.isError ? (
          <div role="alert" className="p-5 text-sm text-rose-700 dark:text-rose-300">
            Students could not be loaded. <button type="button" onClick={() => studentsQuery.refetch()} className="font-semibold underline">Retry</button>
          </div>
        ) : studentsQuery.isLoading ? (
          <div className="space-y-2 p-4" aria-label="Loading students">{[1, 2, 3, 4].map((item) => <div key={item} className="h-12 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />)}</div>
        ) : students.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{search ? 'No students match your search' : 'No students yet'}</h3>
            <p className="mt-1 text-xs text-slate-500">{search ? 'Try another name or email.' : 'A super admin must create institution student accounts.'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/50">
                  <tr><th className="px-4 py-3 font-medium">Student</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Last login</th><th className="px-4 py-3 font-medium">Joined</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map((student) => (
                    <tr key={student.id} className="text-slate-700 dark:text-slate-300">
                      <td className="px-4 py-3"><button type="button" onClick={() => { setSelected(student); setMode('view'); }} className="text-left"><span className="block font-medium text-slate-900 hover:text-blue-700 dark:text-white dark:hover:text-blue-300">{student.name}</span><span className="mt-0.5 block text-xs text-slate-500">{student.email}</span></button></td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[11px] font-medium ${student.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>{student.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatDate(student.lastLoginAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatDate(student.createdAt)}</td>
                      <td className="px-4 py-3"><div className="flex justify-end gap-1">
                        <button type="button" onClick={() => { setSelected(student); setMode('view'); }} aria-label={`View ${student.name}`} title="View student" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Eye size={15} /></button>
                        <button type="button" onClick={() => startEdit(student)} aria-label={`Edit ${student.name}`} title="Edit student" className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800"><Pencil size={15} /></button>
                        <button type="button" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`Delete student account for ${student.name}? This will deactivate their access but preserve historical records.`)) deleteMutation.mutate(student.id); }} aria-label={`Delete ${student.name}`} title="Delete student" className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:hover:bg-rose-950/40"><Trash2 size={15} /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {deleteMutation.isError && <p role="alert" className="px-4 py-3 text-sm text-rose-700 dark:text-rose-300">Could not delete this student. Please try again.</p>}
            {totalPages > 1 && <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 disabled:opacity-40 dark:border-slate-700"><ArrowLeft size={13} /> Previous</button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 disabled:opacity-40 dark:border-slate-700">Next <ArrowRight size={13} /></button>
              </div>
            </div>}
          </>
        )}
      </section>

      {mode && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="student-dialog-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="student-dialog-title" className="text-lg font-semibold text-slate-950 dark:text-white">{mode === 'edit' ? 'Edit student' : 'Student details'}</h2><p className="mt-1 text-xs text-slate-500">{selected?.email}</p></div>
              <button type="button" aria-label="Close student dialog" onClick={closeForm} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={17} /></button>
            </div>

            {mode === 'view' ? (
              detailQuery.isError ? <p role="alert" className="mt-5 text-sm text-rose-700 dark:text-rose-300">Student details could not be loaded. <button type="button" onClick={() => detailQuery.refetch()} className="font-semibold underline">Retry</button></p>
                : detailQuery.isLoading ? <p className="mt-5 text-sm text-slate-500">Loading student details…</p>
                  : detail && <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div><dt className="text-xs text-slate-500">Name</dt><dd className="mt-1 text-sm font-medium">{detail.name}</dd></div>
                    <div><dt className="text-xs text-slate-500">Email</dt><dd className="mt-1 break-all text-sm font-medium">{detail.email}</dd></div>
                    <div><dt className="text-xs text-slate-500">Status</dt><dd className="mt-1 text-sm">{detail.isActive ? 'Active' : 'Inactive'}</dd></div>
                    <div><dt className="text-xs text-slate-500">Email verified</dt><dd className="mt-1 text-sm">{detail.isEmailVerified ? 'Yes' : 'No'}</dd></div>
                    <div><dt className="text-xs text-slate-500">Phone</dt><dd className="mt-1 text-sm">{detail.phone || '—'}</dd></div>
                    <div><dt className="text-xs text-slate-500">Last login</dt><dd className="mt-1 text-sm">{formatDate(detail.lastLoginAt)}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Bio</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{detail.bio || '—'}</dd></div>
                  </dl>
            ) : (
              <form className="mt-5 space-y-4" onSubmit={submitForm}>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Full name
                  <input required minLength={2} maxLength={255} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Phone
                    <input maxLength={30} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                  </label>
                  {mode === 'edit' && <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /> Account active</label>}
                </div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Bio
                  <textarea maxLength={1000} rows={3} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                </label>
                {formError && <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">{formError}</p>}
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <button type="button" onClick={closeForm} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button>
                  <button type="submit" disabled={isSaving} className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{isSaving ? 'Saving…' : 'Save changes'}</button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
