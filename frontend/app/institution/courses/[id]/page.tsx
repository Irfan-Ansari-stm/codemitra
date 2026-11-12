'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, ChevronDown, Clock3 } from 'lucide-react';
import { courseApi } from '@/lib/api';
import type { Chapter, Course, Module } from '@/types';
import { useCurrentTenant } from '@/hooks/useTenant';
import { institutionHref } from '@/lib/workspace';

export default function CourseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const tenant = useCurrentTenant();
  const courseQuery = useQuery({ queryKey: ['course', id], queryFn: () => courseApi.get(id).then((response) => response.data.data as Course), enabled: !!id });
  const modulesQuery = useQuery({ queryKey: ['modules', id], queryFn: () => courseApi.getModules(id).then((response) => (response.data.data ?? []) as Module[]), enabled: !!id });
  const modules = modulesQuery.data ?? [];
  const chapterQueries = useQueries({ queries: modules.map((module) => ({ queryKey: ['chapters', module.id], queryFn: () => courseApi.getChapters(module.id).then((response) => (response.data.data ?? []) as Chapter[]) })) });
  const course = courseQuery.data;
  const chapterCount = chapterQueries.reduce((sum, query) => sum + (query.data?.length ?? 0), 0);

  if (courseQuery.isLoading) return <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />;
  if (courseQuery.error || !course) return <section role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200"><h1 className="font-semibold">Course unavailable</h1><p className="mt-1">The course details could not be loaded.</p><button type="button" onClick={() => courseQuery.refetch()} className="mt-3 font-medium underline">Retry</button></section>;

  return <div className="mx-auto max-w-5xl space-y-6">
    <Link href={pathname.startsWith('/super-admin') ? '/super-admin/courses' : institutionHref('/institution/courses', tenant.data?.slug)} className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-300"><ArrowLeft size={15} /> Back to courses</Link>
    <header className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-3xl"><span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"><BookOpen size={12} /> Course</span><h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">{course.title}</h1>{course.description && <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{course.description}</p>}</div><span className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium capitalize text-slate-600 dark:border-slate-700 dark:text-slate-300">{course.status}</span></div>
      <div className="mt-6 flex flex-wrap gap-2">{(course.languageTags ?? []).map((tag) => <span key={tag} className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{tag}</span>)}</div>
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800"><span>{modulesQuery.isLoading ? 'Loading modules…' : `${modules.length} ${modules.length === 1 ? 'module' : 'modules'}`}</span><span>{chapterQueries.some((query) => query.isLoading) ? 'Loading lessons…' : `${chapterCount} ${chapterCount === 1 ? 'lesson' : 'lessons'}`}</span>{course.updatedAt && <span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> Updated {new Date(course.updatedAt).toLocaleDateString()}</span>}</div>
    </header>
    <section className="space-y-3"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-base font-semibold text-slate-900 dark:text-white">Course curriculum</h2><p className="mt-1 text-xs text-slate-500">Modules and lessons published for this course.</p></div>{modulesQuery.error && <button type="button" onClick={() => modulesQuery.refetch()} className="text-xs font-medium text-blue-600 underline dark:text-blue-300">Retry modules</button>}</div>
      {modulesQuery.isLoading ? <div className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" /> : modules.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">No modules are available for this course yet.</div> : modules.map((module, index) => {
        const chapters = chapterQueries[index]?.data ?? [];
        return <details key={module.id} className="group rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" open={index === 0}><summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:px-5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{index + 1}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{module.title}</span><span className="mt-1 block text-[11px] text-slate-500">{chapterQueries[index]?.isLoading ? 'Loading lessons…' : `${chapters.length} ${chapters.length === 1 ? 'lesson' : 'lessons'}`}</span></span><span className="hidden rounded-md border border-slate-200 px-2 py-1 text-[10px] capitalize text-slate-500 dark:border-slate-700 sm:inline">{module.status}</span><ChevronDown size={16} className="text-slate-400 transition-transform group-open:rotate-180" /></summary>
          {(module.description || chapters.length > 0 || chapterQueries[index]?.error) && <div className="border-t border-slate-100 px-4 py-4 dark:border-slate-800 sm:pl-16 sm:pr-5">{module.description && <p className="mb-3 text-xs leading-5 text-slate-500">{module.description}</p>}{chapterQueries[index]?.error ? <p className="text-xs text-rose-600">Lessons could not be loaded. <button type="button" onClick={() => chapterQueries[index].refetch()} className="underline">Retry</button></p> : <ol className="space-y-2">{chapters.map((chapter) => <li key={chapter.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-950"><span className="text-xs font-medium text-slate-700 dark:text-slate-300">{chapter.title}</span>{chapter.estimatedMinutes && <span className="shrink-0 text-[10px] text-slate-500">{chapter.estimatedMinutes} min</span>}</li>)}</ol>}</div>}
        </details>;
      })}
    </section>
  </div>;
}
