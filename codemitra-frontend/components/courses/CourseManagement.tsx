'use client';

import Link from 'next/link';
import { type FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BookOpen, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { courseApi, getErrorMessage, tenantApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useCurrentTenant } from '@/hooks/useTenant';
import { institutionHref } from '@/lib/workspace';
import type { Course, ContentStatus, Tenant } from '@/types';

type StatusFilter = 'all' | ContentStatus;
type CourseForm = {
  title: string;
  description: string;
  languageTags: string;
  status: ContentStatus;
  tenantId: string;
};

const blankForm: CourseForm = {
  title: '',
  description: '',
  languageTags: '',
  status: 'draft',
  tenantId: '',
};
const statuses: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All courses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
  { value: 'archived', label: 'Archived' },
];
const EMPTY_COURSES: Course[] = [];

export default function CourseManagement() {
  const user = useAuthStore((state) => state.user);
  const tenantQuery = useCurrentTenant();
  const isSuperAdmin = user?.role === 'super_admin';
  const canManage = isSuperAdmin || user?.role === 'institution_admin';
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Course | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CourseForm>(blankForm);
  const [formError, setFormError] = useState('');

  const coursesQuery = useQuery({
    queryKey: ['courses', canManage ? 'manage' : 'catalog', status, user?.tenantId],
    queryFn: () => (canManage
      ? courseApi.manage({ status: status === 'all' ? undefined : status, limit: 100 })
      : courseApi.list({ status: 'published', limit: 100 }))
      .then((response) => (response.data.data ?? []) as Course[]),
  });
  const tenantsQuery = useQuery({
    queryKey: ['tenants', 'course-scope'],
    queryFn: () => tenantApi.list(1, 100).then((response) => (response.data.data ?? []) as Tenant[]),
    enabled: !!isSuperAdmin,
  });
  const saveMutation = useMutation({
    mutationFn: (payload: { course: Course | null; data: Record<string, unknown> }) =>
      payload.course
        ? courseApi.update(payload.course.id, payload.data)
        : courseApi.create(payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setEditing(null);
      setForm(blankForm);
      setFormError('');
      setFormOpen(false);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: (courseId: string) => courseApi.delete(courseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
  });

  const courses = coursesQuery.data ?? EMPTY_COURSES;
  const visibleCourses = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return term
      ? courses.filter((course) => `${course.title} ${course.description ?? ''} ${(course.languageTags ?? []).join(' ')}`.toLocaleLowerCase().includes(term))
      : courses;
  }, [courses, search]);
  const publishedCount = courses.filter((course) => course.status === 'published').length;
  const isTitleValid = form.title.trim().length >= 2;

  function startCreate() {
    setEditing(null);
    setForm(blankForm);
    setFormError('');
    setFormOpen(true);
  }

  function startEdit(course: Course) {
    setEditing(course);
    setForm({
      title: course.title,
      description: course.description ?? '',
      languageTags: (course.languageTags ?? []).join(', '),
      status: course.status,
      tenantId: course.tenantId ?? '',
    });
    setFormError('');
    setFormOpen(true);
  }

  function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = form.title.trim();
    if (!trimmedTitle || trimmedTitle.length < 2) {
      setFormError('Course title must be at least 2 characters long.');
      return;
    }

    const data: Record<string, unknown> = {
      title: trimmedTitle,
      description: form.description.trim() || undefined,
      languageTags: form.languageTags.split(',').map((tag) => tag.trim()).filter(Boolean),
      status: form.status,
    };
    if (isSuperAdmin && !editing) data.tenantId = form.tenantId || null;

    setFormError('');
    saveMutation.mutate({ course: editing, data });
  }

  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">Learning content</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Courses</h1>
        <p className="mt-1 text-sm text-slate-500">{isSuperAdmin ? 'Manage platform and institution course catalogs.' : canManage ? 'Manage courses for your institution’s students.' : 'Explore published courses available to you.'}</p>
      </div>
      <div className="flex items-end gap-3">
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"><p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Courses</p><p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{coursesQuery.isLoading ? '—' : courses.length}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"><p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Published</p><p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{coursesQuery.isLoading ? '—' : publishedCount}</p></div>
        {canManage && <button type="button" onClick={startCreate} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><Plus size={16} /> New course</button>}
      </div>
    </header>

    <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
      <label className="relative block w-full sm:max-w-sm"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search courses" placeholder="Search courses or topics" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
      {canManage && <div role="group" aria-label="Filter courses by status" className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950">{statuses.map((filter) => <button key={filter.value} type="button" aria-pressed={status === filter.value} onClick={() => setStatus(filter.value)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${status === filter.value ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>{filter.label}</button>)}</div>}
    </section>

    {coursesQuery.isError ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">Couldn’t load courses. <button type="button" onClick={() => coursesQuery.refetch()} className="ml-1 font-medium underline">Retry</button></div>
      : coursesQuery.isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-52 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />)}</div>
      : visibleCourses.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900"><BookOpen className="mx-auto text-slate-400" size={22} /><h2 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">No courses found</h2><p className="mt-1 text-xs text-slate-500">Try another search or status filter.</p></div>
      : <section aria-label="Course catalog" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleCourses.map((course) => <article key={course.id} className="flex min-h-56 flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800">
        <div className="flex items-start justify-between gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-300"><BookOpen size={18} /></span><span className={`rounded-md border px-2 py-1 text-[10px] font-semibold capitalize ${course.status === 'published' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>{course.status}</span></div>
        {isSuperAdmin && <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-slate-400">{course.tenantId ? (tenantsQuery.data ?? []).find((tenant) => tenant.id === course.tenantId)?.name ?? 'Institution course' : 'General users'}</p>}
        <h2 className="mt-4 text-base font-semibold leading-6 text-slate-900 dark:text-white">{course.title}</h2>
        <p className="mt-2 line-clamp-2 flex-1 text-xs leading-5 text-slate-500">{course.description || 'No course description yet.'}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">{(course.languageTags ?? []).map((tag) => <span key={tag} className="rounded border border-slate-200 px-2 py-1 text-[10px] text-slate-500 dark:border-slate-700">{tag}</span>)}</div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <Link href={isSuperAdmin ? `/super-admin/courses/${course.id}` : institutionHref(`/institution/courses/${course.id}`, tenantQuery.data?.slug)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300">Open course <ArrowRight size={14} /></Link>
          {canManage && <div className="flex items-center gap-1"><button type="button" title="Edit course" aria-label={`Edit ${course.title}`} onClick={() => startEdit(course)} className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800"><Pencil size={15} /></button><button type="button" title="Delete course" aria-label={`Delete ${course.title}`} disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`Delete ${course.title}?`)) deleteMutation.mutate(course.id); }} className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:hover:bg-rose-950/40"><Trash2 size={15} /></button></div>}
        </div>
      </article>)}</section>}

    {deleteMutation.isError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">Could not delete the course. Please try again.</p>}

    {formOpen && canManage && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="course-form-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><h2 id="course-form-title" className="text-lg font-semibold text-slate-950 dark:text-white">{editing ? 'Edit course' : 'Create course'}</h2><p className="mt-1 text-xs text-slate-500">{isSuperAdmin ? 'Choose which audience can access this course.' : 'This course will belong to your institution.'}</p></div><button type="button" aria-label="Close course form" onClick={() => { setEditing(null); setForm(blankForm); setFormError(''); setFormOpen(false); }} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={17} /></button></div>
        <form className="mt-5 space-y-4" onSubmit={saveCourse}>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Course title<input required minLength={2} maxLength={255} value={form.title} onChange={(event) => { setForm({ ...form, title: event.target.value }); setFormError(''); }} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Description<textarea maxLength={2000} rows={3} value={form.description} onChange={(event) => { setForm({ ...form, description: event.target.value }); setFormError(''); }} className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            {isSuperAdmin ? <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Audience<select disabled={!!editing} value={form.tenantId} onChange={(event) => { setForm({ ...form, tenantId: event.target.value }); setFormError(''); }} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="">General users</option>{(tenantsQuery.data ?? []).map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}</select></label> : <div className="flex items-center text-xs text-slate-500">Audience: your institution</div>}
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Status<select value={form.status} onChange={(event) => { setForm({ ...form, status: event.target.value as ContentStatus }); setFormError(''); }} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
          </div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Languages and topics<input value={form.languageTags} onChange={(event) => { setForm({ ...form, languageTags: event.target.value }); setFormError(''); }} placeholder="Python, Algorithms" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
          {formError && <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">{formError}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"><button type="button" onClick={() => { setEditing(null); setForm(blankForm); setFormError(''); setFormOpen(false); }} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button><button type="submit" disabled={saveMutation.isPending || (isSuperAdmin && tenantsQuery.isLoading) || !isTitleValid} className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saveMutation.isPending ? 'Saving...' : editing ? 'Save changes' : 'Create course'}</button></div>
        </form>
      </section>
    </div>}
  </div>;
}
