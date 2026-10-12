'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Layers,
  SearchX,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  useCourseDetail,
  useEnroll,
  useUpdateChapterProgress,
} from '@/hooks/useCourse';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CurriculumSection } from '@/components/courses/CurriculumSection';
import { EnrollmentPanel } from '@/components/courses/EnrollmentPanel';
import { ProgressBar } from '@/components/courses/ProgressBar';
import { STATUS_BADGE_STYLES } from '@/components/courses/constants';

function formatDuration(minutes?: number): string | null {
  if (typeof minutes !== 'number' || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div className="h-5 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0e1728]" />
          <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0e1728]" />
        </div>
        <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0e1728]" />
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const isReady = useAuthStore((state) => state.isReady);

  const courseQuery = useCourseDetail(id ?? null, isReady && !!user);
  const enrollMutation = useEnroll(id ?? '');
  const progressMutation = useUpdateChapterProgress(id ?? '');

  const course = courseQuery.data;

  const handleToggleChapter = (chapterId: string, isCompleted: boolean) => {
    progressMutation.mutate({ chapterId, isCompleted });
  };

  const handleEnroll = () => {
    enrollMutation.mutate(undefined, {
      onSuccess: () => {
        courseQuery.refetch();
      },
    });
  };

  if (!isReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500 dark:bg-[#080d18] dark:text-slate-400">
        Loading course…
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#080d18] dark:text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-brand-600 dark:hover:text-brand-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to courses
          </Link>
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-[#0e1728]">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-950">
              <BookOpen className="h-5 w-5" aria-hidden />
            </div>
            <h1 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
              Sign in to view this course
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Course details and enrollment require an account.
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

  if (courseQuery.isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-[#080d18] sm:px-6 lg:px-8">
        <DetailSkeleton />
      </main>
    );
  }

  if (courseQuery.isError || !course) {
    const isNotFound =
      (courseQuery.error as any)?.response?.status === 404;
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#080d18] dark:text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-brand-600 dark:hover:text-brand-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to courses
          </Link>
          <section
            role="alert"
            className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-[#0e1728]"
          >
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-950">
              {isNotFound ? (
                <SearchX className="h-5 w-5" aria-hidden />
              ) : (
                <BookOpen className="h-5 w-5" aria-hidden />
              )}
            </div>
            <h1 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
              {isNotFound ? 'Course not found' : 'Course unavailable'}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isNotFound
                ? 'This course may have been removed or is not available to your organization.'
                : getErrorMessage(courseQuery.error)}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              {!isNotFound && (
                <button
                  type="button"
                  onClick={() => courseQuery.refetch()}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  Retry
                </button>
              )}
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Browse courses
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const duration = formatDuration(course.totalMinutes);
  const progress = course.progress;
  const hasProgress = !!progress && progress.totalLessons > 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#080d18] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-brand-600 dark:hover:text-brand-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to courses
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0e1728]">
              <div className="relative block aspect-[16/7] overflow-hidden bg-slate-100 dark:bg-slate-900">
                {course.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-brand-500/10">
                    <BookOpen className="h-14 w-14 text-brand-500/60" aria-hidden />
                  </span>
                )}
                <span
                  className={cn(
                    'absolute left-4 top-4 rounded-md border px-2.5 py-1 text-[10px] font-semibold capitalize backdrop-blur-sm',
                    STATUS_BADGE_STYLES[course.status]
                  )}
                >
                  {course.status}
                </span>
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {(course.languageTags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  {course.title}
                </h1>
                {course.description && (
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
                    {course.description}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
                  {course.createdByName && (
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" aria-hidden />
                      {course.createdByName}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" aria-hidden />
                    {course.modules.length}{' '}
                    {course.modules.length === 1 ? 'module' : 'modules'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" aria-hidden />
                    {course.lessonCount}{' '}
                    {course.lessonCount === 1 ? 'lesson' : 'lessons'}
                  </span>
                  {duration && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden />
                      {duration}
                    </span>
                  )}
                  {typeof course.enrollmentCount === 'number' &&
                    course.enrollmentCount > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" aria-hidden />
                        {course.enrollmentCount.toLocaleString()} enrolled
                      </span>
                    )}
                  {course.updatedAt && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden />
                      Updated{' '}
                      {new Date(course.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {hasProgress && progress && (
                  <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-950/70">
                    <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span>
                        {progress.completedLessons} of {progress.totalLessons} lessons completed
                      </span>
                      <span className="tabular-nums">{progress.percent}%</span>
                    </div>
                    <ProgressBar value={progress.percent} label="Course completion" />
                    {progress.percent >= 100 && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                        Course completed
                      </p>
                    )}
                  </div>
                )}
              </div>
            </header>

            <section
              id="curriculum"
              aria-label="Course curriculum"
              className="scroll-mt-24 space-y-3"
            >
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Curriculum
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {course.isEnrolled
                    ? 'Select the checkbox to mark lessons complete.'
                    : 'Enroll to track lesson completion.'}
                </p>
              </div>
              <CurriculumSection
                modules={course.modules}
                isEnrolled={course.isEnrolled}
                isLoading={false}
                onToggleChapter={handleToggleChapter}
                pendingChapterId={progressMutation.isPending ? (progressMutation.variables as any)?.chapterId : null}
              />
            </section>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <EnrollmentPanel
              course={course}
              isEnrolling={enrollMutation.isPending}
              onEnroll={handleEnroll}
              enrollError={
                enrollMutation.isError
                  ? getErrorMessage(enrollMutation.error)
                  : null
              }
              isPublicCatalog={!user.tenantId}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
