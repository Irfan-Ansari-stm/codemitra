'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, Search } from 'lucide-react';
import { courseApi } from '@/lib/api';
import type { Course } from '@/types';

type Status = 'all' | 'published' | 'draft' | 'archived';
const EMPTY_COURSES: Course[] = [];

export default function CoursesPage() {
  const [status, setStatus] = useState<Status>('all');
  const [search, setSearch] = useState('');
  const coursesQuery = useQuery({
    queryKey: ['courses', status],
    queryFn: () => courseApi.list(status === 'all' ? undefined : { status }).then((response) => (response.data.data ?? []) as Course[]),
  });
  const courses = coursesQuery.data ?? EMPTY_COURSES;
  const visibleCourses = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return term ? courses.filter((course) => `${course.title} ${course.description ?? ''} ${(course.languageTags ?? []).join(' ')}`.toLocaleLowerCase().includes(term)) : courses;
  }, [courses, search]);
  const publishedCount = courses.filter((course) => course.status === 'published').length;

  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">Learning content</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Courses</h2><p className="mt-1 text-sm text-slate-500">Explore the course catalog and open a course to review its modules.</p></div><div className="flex gap-3"><div className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"><p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Courses</p><p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{coursesQuery.isLoading ? '—' : courses.length}</p></div><div className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"><p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Published</p><p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{coursesQuery.isLoading ? '—' : publishedCount}</p></div></div></header>
    <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
      <label className="relative block w-full sm:max-w-sm"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search courses" placeholder="Search courses or topics" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
      <div role="group" aria-label="Filter courses by status" className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950">{([{ value: 'all', label: 'All courses' }, { value: 'published', label: 'Published' }, { value: 'draft', label: 'Drafts' }, { value: 'archived', label: 'Archived' }] as const).map((filter) => <button key={filter.value} type="button" aria-pressed={status === filter.value} onClick={() => setStatus(filter.value)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${status === filter.value ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>{filter.label}</button>)}</div>
    </section>
    {coursesQuery.isError ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">Couldn’t load courses. <button type="button" onClick={() => coursesQuery.refetch()} className="ml-1 font-medium underline">Retry</button></div> : coursesQuery.isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-52 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />)}</div> : visibleCourses.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900"><BookOpen className="mx-auto text-slate-400" size={22} /><h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">No courses found</h3><p className="mt-1 text-xs text-slate-500">Try another search or status filter.</p>{search && <button type="button" onClick={() => setSearch('')} className="mt-3 text-xs font-medium text-blue-600 hover:underline dark:text-blue-300">Clear search</button>}</div> : <section aria-label="Course catalog" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleCourses.map((course) => <article key={course.id} className="flex min-h-56 flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800"><div className="flex items-start justify-between gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-300"><BookOpen size={18} /></span><span className={`rounded-md border px-2 py-1 text-[10px] font-semibold capitalize ${course.status === 'published' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>{course.status}</span></div><h3 className="mt-4 line-clamp-2 text-base font-semibold text-slate-900 dark:text-white">{course.title}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{course.description || 'Open this course to review available modules and lessons.'}</p><div className="mt-3 flex flex-wrap gap-1.5">{(course.languageTags ?? []).slice(0, 3).map((tag) => <span key={tag} className="rounded border border-slate-200 px-2 py-1 text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400">{tag}</span>)}</div><div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800"><span className="text-[11px] text-slate-500">{course.updatedAt ? `Updated ${new Date(course.updatedAt).toLocaleDateString()}` : 'Course catalog'}</span><Link href={`/institution/courses/${course.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300">Open course <ArrowRight size={14} /></Link></div></article>)}</section>}
  </div>;
}
