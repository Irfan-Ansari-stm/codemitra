'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Layers,
  Library,
  SearchX,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  buildCourseParams,
  useCourseCatalog,
  useCourseStats,
  useFeaturedCourses,
} from '@/hooks/useCourse';
import { courseApi, getErrorMessage } from '@/lib/api';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseGridSkeleton } from '@/components/courses/CourseCardSkeleton';
import { CourseFilters } from '@/components/courses/CourseFilters';
import { Pagination } from '@/components/common/Pagination';
import {
  DEFAULT_PAGE_SIZE,
  FEATURED_LIMIT,
  SEARCH_DEBOUNCE_MS,
  SORT_OPTIONS,
} from '@/components/courses/constants';
import type { ContentStatus, Course } from '@/types';

const EMPTY_COURSES: Course[] = [];

function SignInGate() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#080d18] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-[#0e1728] sm:px-9">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <GraduationCap className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Courses
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            Browse published courses, track your enrollment, and follow your
            learning progress.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Sign in to browse courses
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              Create an account
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function CoursesPage() {
  const user = useAuthStore((state) => state.user);
  const isReady = useAuthStore((state) => state.isReady);
  const canLoadCatalog = isReady && !!user;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | ContentStatus>('all');
  const [language, setLanguage] = useState('');
  const [sortValue, setSortValue] = useState(SORT_OPTIONS[0].value);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const sortOption =
    SORT_OPTIONS.find((option) => option.value === sortValue) ??
    SORT_OPTIONS[0];

  // One-time fetch of the tenant catalog to populate the language
  // filter with real language tags from the API.
  const languageOptionsQuery = useQuery({
    queryKey: ['courses', 'language-options'],
    queryFn: () =>
      courseApi.list().then((response) => (response.data.data ?? []) as Course[]),
    staleTime: 1000 * 60 * 5,
    enabled: canLoadCatalog,
  });
  const languageOptions = useMemo(() => {
    const unique = new Set<string>();
    (languageOptionsQuery.data ?? EMPTY_COURSES).forEach((course) =>
      (course.languageTags ?? []).forEach((tag) => unique.add(tag))
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [languageOptionsQuery.data]);

  const params = buildCourseParams({
    search: debouncedSearch.trim() || undefined,
    language: language || undefined,
    status: status === 'all' ? undefined : status,
    sort: sortOption.sort,
    order: sortOption.order,
    page,
    limit,
  });
  const { data, isLoading, isFetching, isError, error, refetch } =
    useCourseCatalog(params, canLoadCatalog);
  const statsQuery = useCourseStats(canLoadCatalog);
  const featuredQuery = useFeaturedCourses(FEATURED_LIMIT, canLoadCatalog);

  const courses = data?.courses ?? EMPTY_COURSES;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const firstItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastItem = Math.min(total, page * limit);

  // Any filter change returns to the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, language, sortValue, limit]);

  const activeFilterCount =
    (debouncedSearch.trim() ? 1 : 0) +
    (status !== 'all' ? 1 : 0) +
    (language ? 1 : 0);

  const clearAllFilters = () => {
    setSearch('');
    setStatus('all');
    setLanguage('');
    setPage(1);
  };

  if (!isReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500 dark:bg-[#080d18] dark:text-slate-400">
        Loading courses…
      </main>
    );
  }

  if (!user) return <SignInGate />;

  const stats = statsQuery.data;
  const featured = featuredQuery.data ?? EMPTY_COURSES;
  const showFeatured =
    featured.length > 0 &&
    !debouncedSearch.trim() &&
    status === 'all' &&
    !language &&
    page === 1;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#080d18] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-7 dark:border-slate-800 dark:bg-[#0e1728] sm:px-9 sm:py-9">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl"
          />
          <div className="relative flex flex-col justify-between gap-8 xl:flex-row xl:items-end">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                <Library className="h-3.5 w-3.5" aria-hidden /> Learning
                catalog
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Courses
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                Explore published courses, follow their curriculum, and track
                your progress as you learn.
              </p>
              <div className="mt-5">
                <Link
                  href="/my-learning"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  <BookOpen className="h-4 w-4" aria-hidden />
                  My learning
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[380px]">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <Layers className="h-4 w-4 text-blue-600 dark:text-blue-300" aria-hidden />{' '}
                  Courses
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                  {statsQuery.isLoading ? '—' : (stats?.totalCourses ?? total).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                  {stats?.publishedCourses != null
                    ? `${stats.publishedCourses} published`
                    : 'in this catalog'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />{' '}
                  Lessons
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                  {statsQuery.isLoading ? '—' : (stats?.totalLessons ?? 0).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                  across{' '}
                  {stats?.totalModules != null
                    ? stats.totalModules.toLocaleString()
                    : '—'}{' '}
                  modules
                </p>
              </div>
            </div>
          </div>
        </header>

        {showFeatured && (
          <section aria-label="Featured courses">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" aria-hidden />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Featured courses
              </h2>
            </div>
            {featuredQuery.isLoading ? (
              <CourseGridSkeleton count={FEATURED_LIMIT} variant="compact" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {featured.map((course) => (
                  <CourseCard key={course.id} course={course} variant="compact" />
                ))}
              </div>
            )}
          </section>
        )}

        <CourseFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          sortValue={sortValue}
          onSortChange={setSortValue}
          limit={limit}
          onLimitChange={setLimit}
          languageOptions={languageOptions}
          language={language}
          onLanguageChange={setLanguage}
          activeFilterCount={activeFilterCount}
          onClearAll={clearAllFilters}
          isFetching={isFetching}
          isLoading={isLoading}
          total={total}
          firstItem={firstItem}
          lastItem={lastItem}
        />

        {isError ? (
          <section
            role="alert"
            className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 dark:bg-rose-500/10"
          >
            <h2 className="font-medium text-rose-700 dark:text-rose-200">
              Courses couldn&apos;t be loaded
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
          <CourseGridSkeleton count={limit > 9 ? 9 : limit} />
        ) : courses.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-[#0e1728]">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-950">
              <SearchX className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
              No matching courses
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try a different search term, language, or clear the active filters.
            </p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                Clear all filters
              </button>
            )}
          </section>
        ) : (
          <section aria-label="Course results" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </section>
        )}

        {!isLoading && !isError && courses.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
              Page {page} of {totalPages}
            </p>
          </div>
        )}

        <footer className="flex items-center gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-600">
          <BookOpen className="h-3.5 w-3.5" aria-hidden /> Published courses
          are available to CodeVerse learners.
        </footer>
      </div>
    </main>
  );
}
