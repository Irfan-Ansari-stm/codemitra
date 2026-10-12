'use client';

import { BookOpenCheck, CheckCircle2, Clock3, Layers, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import type { CourseDetail } from '@/types';
import { ProgressBar } from './ProgressBar';

interface EnrollmentPanelProps {
  course: CourseDetail;
  isEnrolling: boolean;
  onEnroll: () => void;
  enrollError: string | null;
  isPublicCatalog?: boolean;
}

export function EnrollmentPanel({
  course,
  isEnrolling,
  onEnroll,
  enrollError,
  isPublicCatalog = false,
}: EnrollmentPanelProps) {
  const progress = course.progress;
  const hasProgress = !!progress && progress.totalLessons > 0;

  return (
    <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0e1728]">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
          Course access
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Free
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {isPublicCatalog
            ? 'Available to learners across CodeVerse'
            : 'Included with your institution membership'}
        </p>
      </div>

      {course.isEnrolled ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            You are enrolled
          </div>

          {hasProgress && progress && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>Your progress</span>
                <span className="tabular-nums">{progress.percent}%</span>
              </div>
              <ProgressBar
                value={progress.percent}
                label="Course completion"
              />
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                {progress.completedLessons} of {progress.totalLessons} lessons completed
              </p>
            </div>
          )}

          <Link
            href={`/courses/${course.id}#curriculum`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            {hasProgress && progress && progress.percent > 0 && progress.percent < 100
              ? 'Continue learning'
              : 'Start learning'}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            onClick={onEnroll}
            disabled={isEnrolling}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
          >
            {isEnrolling ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <BookOpenCheck className="h-4 w-4" aria-hidden />
            )}
            {isEnrolling ? 'Enrolling…' : 'Enroll now'}
          </button>

          {enrollError && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
              {enrollError}
            </p>
          )}

          <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <li className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Sign in required — enrollment is tied to your account
            </li>
            <li className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5" aria-hidden />
              {course.lessonCount} lessons across {course.modules.length}{' '}
              {course.modules.length === 1 ? 'module' : 'modules'}
            </li>
            {course.totalMinutes > 0 && (
              <li className="flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5" aria-hidden />
                Estimated {course.totalMinutes} minutes of content
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="border-t border-slate-100 pt-4 text-[11px] leading-5 text-slate-400 dark:border-white/5 dark:text-slate-500">
        {isPublicCatalog
          ? 'This published course is available to all CodeVerse learners.'
          : 'Access is granted by your institution. Course content is visible to members of your organization only.'}
      </div>
    </aside>
  );
}
