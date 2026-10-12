'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  SearchX,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useMyCourses } from '@/hooks/useCourse';
import { getErrorMessage } from '@/lib/api';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseGridSkeleton } from '@/components/courses/CourseCardSkeleton';
import { ProgressBar } from '@/components/courses/ProgressBar';
import type { EnrolledCourse } from '@/types';

const EMPTY_COURSES: EnrolledCourse[] = [];

export default function MyLearningPage() {
  const user = useAuthStore((state) => state.user);
  const isReady = useAuthStore((state) => state.isReady);
  const [showCompleted, setShowCompleted] = useState(false);

  const { data, isLoading, isError, error, refetch } = useMyCourses();

  const courses = data ?? EMPTY_COURSES;
  const inProgress = courses.filter(
    (course) =>
      !course.progress ||
      (course.progress as any)?.percent === undefined ||
      ((course as any).completedLessons ?? 0) <
        ((course as any).chapterCount ?? 0)
  );
  const completed = courses.filter(
    (course) =>
      ((course as any).completedLessons ?? 0) >=
        ((course as any).chapterCount ?? 0) &&
      ((course as any).chapterCount ?? 0) > 0
  );

  // Any filter change returns to the first page.
  useEffect(() => {
    setShowCompleted(false);
  }, [data]);

  if (!isReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500 dark:bg-[#080d18] dark:text-slate-400">
        Loading your learning…
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#080d18] dark:text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-[#0e1728]">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-950">
              <GraduationCap className="h-5 w-5" aria-hidden />
            </div>
            <h1 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
              Sign in to track your learning
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your enrolled courses and progress are tied to your account.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Sign in
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#080d18] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-7 dark:border-slate-800 dark:bg-[#0e1728] sm:px-9 sm:py-9">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full bg-emerald-600/10 blur-3xl"
          />
          <div className="relative flex flex-col justify-between gap-8 xl:flex-row xl:items-end">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden /> My
                learning
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                My Learning
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                Your enrolled courses and learning progress, synced with
                your institution.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-300" aria-hidden />{' '}
                  Enrolled
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                  {isLoading ? '—' : courses.length.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                  courses
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />{' '}
                  Completed
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                  {isLoading ? '—' : completed.length.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                  courses
                </p>
              </div>
            </div>
          </div>
        </header>

        {isError ? (
          <section
            role="alert"
            className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 dark:bg-rose-500/10"
          >
            <h2 className="font-medium text-rose-700 dark:text-rose-200">
              Your courses couldn&apos;t be loaded
            </h2>
            <p className="mt-1 text-sm text-rose-600/80 dark:text-rose-200/70">
              {getErrorMessage(error)}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-lg border border-rose-400/30 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-500/10 dark:text-rose-200"
            >
              Retry
            </button>
          </section>
        ) : isLoading ? (
          <CourseGridSkeleton count={3} variant="compact" />
        ) : courses.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-[#0e1728]">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-950">
              <SearchX className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
              No enrolled courses yet
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Browse the catalog and enroll in a course to start
              learning.
            </p>
            <Link
              href="/courses"
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Browse courses
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </section>
        ) : (
          <>
            <section aria-label="Courses in progress">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
                {inProgress.length > 0 ? 'Continue learning' : 'Your courses'}
              </h2>
              {inProgress.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  You have completed all enrolled courses.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {inProgress.map((course) => {
                    const total = (course as any).chapterCount ?? 0;
                    const done = (course as any).completedLessons ?? 0;
                    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                      <article
                        key={course.id}
                        className="group flex min-h-[220px] flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-md dark:border-slate-800 dark:bg-[#0e1728] dark:hover:bg-[#111d31]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                            Enrolled
                          </span>
                          <span className="text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
                            {percent}%
                          </span>
                        </div>
                        <h3 className="mt-3 line-clamp-2 text-base font-semibold leading-6 text-slate-900 group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300">
                          <Link href={`/courses/${course.id}`}>
                            {course.title}
                          </Link>
                        </h3>
                        {course.description && (
                          <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
                            {course.description}
                          </p>
                        )}
                        <div className="mt-4">
                          <ProgressBar
                            value={percent}
                            label={`Progress for ${course.title}`}
                          />
                          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            {done} of {total} lessons completed
                          </p>
                        </div>
                        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {course.createdByName}
                          </span>
                          <Link
                            href={`/courses/${course.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 opacity-80 transition group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-brand-400"
                          >
                            {percent > 0 && percent < 100
                              ? 'Continue learning'
                              : 'Start learning'}
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {completed.length > 0 && (
              <section aria-label="Completed courses">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Completed courses
                  </h2>
                  <button
                    type="button"
                    aria-expanded={showCompleted}
                    onClick={() => setShowCompleted((value) => !value)}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    {showCompleted ? 'Hide' : 'Show'} ({completed.length})
                  </button>
                </div>
                {showCompleted && (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {completed.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={{
                          ...course,
                          progress: {
                            totalLessons: (course as any).chapterCount ?? 0,
                            completedLessons:
                              (course as any).completedLessons ?? 0,
                            percent: 100,
                          },
                        }}
                        variant="compact"
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}

        <footer className="flex items-center gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-600">
          <GraduationCap className="h-3.5 w-3.5" aria-hidden /> Progress is
          saved to your account and synced across devices.
        </footer>
      </div>
    </main>
  );
}
