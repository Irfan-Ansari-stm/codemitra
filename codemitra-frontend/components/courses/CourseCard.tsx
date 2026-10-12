'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Layers,
  Users,
} from 'lucide-react';
import type { Course, CourseProgressSummary } from '@/types';
import { cn } from '@/lib/utils';
import { ProgressBar } from './ProgressBar';
import { STATUS_BADGE_STYLES } from './constants';

interface CourseCardProps {
  course: Course;
  /** Compact variant for featured / horizontal layouts. */
  variant?: 'default' | 'compact';
}

function formatDuration(minutes?: number): string | null {
  if (typeof minutes !== 'number' || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export function courseProgressLabel(
  progress?: CourseProgressSummary | null
): string | null {
  if (!progress || progress.totalLessons === 0) return null;
  if (progress.percent >= 100) return 'Completed';
  if (progress.completedLessons > 0) return 'In progress';
  return null;
}

export function CourseCard({ course, variant = 'default' }: CourseCardProps) {
  const duration = formatDuration(course.totalMinutes);
  const progressLabel = courseProgressLabel(course.progress);
  const ctaLabel = !course.isEnrolled
    ? 'View course'
    : progressLabel === 'Completed'
      ? 'Review course'
      : progressLabel === 'In progress'
        ? 'Continue learning'
        : 'Start learning';

  if (variant === 'compact') {
    return (
      <article className="group flex min-h-[180px] flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-md dark:border-slate-800 dark:bg-[#0e1728] dark:hover:bg-[#111d31]">
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              'rounded-md border px-2 py-1 text-[10px] font-semibold capitalize',
              STATUS_BADGE_STYLES[course.status]
            )}
          >
            {course.status}
          </span>
          {progressLabel && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-400">
              {progressLabel === 'Completed' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
              ) : null}
              {progressLabel}
            </span>
          )}
        </div>
        <h2 className="mt-3 line-clamp-2 text-base font-semibold leading-6 text-slate-900 group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300">
          <Link href={`/courses/${course.id}`}>{course.title}</Link>
        </h2>
        {course.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
            {course.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            {typeof course.moduleCount === 'number' && (
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" aria-hidden />
                {course.moduleCount} {course.moduleCount === 1 ? 'module' : 'modules'}
              </span>
            )}
            {duration && (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" aria-hidden />
                {duration}
              </span>
            )}
          </div>
          <Link
            href={`/courses/${course.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 opacity-80 transition group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-brand-400"
          >
            {ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex min-h-[300px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-md dark:border-slate-800 dark:bg-[#0e1728] dark:hover:bg-[#111d31]">
      <Link
        href={`/courses/${course.id}`}
        className="relative block aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-900"
        aria-label={`Open course ${course.title}`}
      >
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-brand-500/10">
            <BookOpen className="h-10 w-10 text-brand-500/60" aria-hidden />
          </span>
        )}
        <span
          className={cn(
            'absolute left-3 top-3 rounded-md border px-2 py-1 text-[10px] font-semibold capitalize backdrop-blur-sm',
            STATUS_BADGE_STYLES[course.status]
          )}
        >
          {course.status}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {(course.languageTags ?? []).slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>
          {progressLabel && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-400">
              {progressLabel === 'Completed' && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
              )}
              {progressLabel}
            </span>
          )}
        </div>

        <h2 className="mt-3 line-clamp-2 text-lg font-semibold leading-6 text-slate-900 group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300">
          <Link href={`/courses/${course.id}`}>{course.title}</Link>
        </h2>
        {course.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
            {course.description}
          </p>
        )}

        {course.isEnrolled && course.progress && course.progress.totalLessons > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span>
                {course.progress.completedLessons} of {course.progress.totalLessons} lessons
              </span>
              <span className="tabular-nums">{course.progress.percent}%</span>
            </div>
            <ProgressBar value={course.progress.percent} />
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            {course.createdByName && (
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                <span className="max-w-[120px] truncate">{course.createdByName}</span>
              </span>
            )}
            {typeof course.moduleCount === 'number' && (
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" aria-hidden />
                {course.moduleCount} {course.moduleCount === 1 ? 'module' : 'modules'}
              </span>
            )}
            {duration && (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" aria-hidden />
                {duration}
              </span>
            )}
            {typeof course.enrollmentCount === 'number' && course.enrollmentCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" aria-hidden />
                {course.enrollmentCount.toLocaleString()}
              </span>
            )}
          </div>
          <Link
            href={`/courses/${course.id}`}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-600 opacity-80 transition group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-brand-400"
          >
            {ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
