'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  ListFilter,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { buildProblemParams, useProblems } from '@/hooks/useProblem';
import { getErrorMessage, problemApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { DifficultyBadge } from '@/components/problems/DifficultyBadge';
import { BookmarkButton } from '@/components/problems/BookmarkButton';
import { useCurrentTenant } from '@/hooks/useTenant';
import { institutionHref } from '@/lib/workspace';
import { Pagination } from '@/components/common/Pagination';
import {
  DEFAULT_PAGE_SIZE,
  DIFFICULTY_FILTERS,
  PAGE_SIZE_OPTIONS,
  SORT_OPTIONS,
  STATUS_FILTERS,
} from '@/components/problems/constants';
import type {
  Problem,
  ProblemDifficultyFilter,
  ProblemStatusFilter,
} from '@/types';

const EMPTY_PROBLEMS: Problem[] = [];
const SEARCH_DEBOUNCE_MS = 300;

type ScopePreference = 'available' | 'public';

function acceptanceRate(problem: Problem): number | null {
  if (typeof problem.acceptanceRate === 'number') return problem.acceptanceRate;
  if (!problem.totalSubmissions) return null;
  return Math.round((problem.acceptedSubmissions / problem.totalSubmissions) * 100);
}

export default function ProblemsPage({ embedded = false }: { embedded?: boolean }) {
  const user = useAuthStore((state) => state.user);
  const tenantQuery = useCurrentTenant();
  const isAuthenticated = !!user;

  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<ProblemDifficultyFilter>('all');
  const [status, setStatus] = useState<ProblemStatusFilter>('all');
  const [tags, setTags] = useState<string[]>([]);
  const [sortValue, setSortValue] = useState(SORT_OPTIONS[0].value);
  const [scope, setScope] = useState<ScopePreference>('available');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  // Anonymous users only ever see public problems; signed-in members of an
  // institution additionally see their institution's problems.
  const effectiveScope =
    scope === 'public' || !user?.tenantId ? 'public' : 'institution';

  const sortOption =
    SORT_OPTIONS.find((option) => option.value === sortValue) ?? SORT_OPTIONS[0];

  // One-time fetch to populate the tag filter with real tags from the API.
  const tagOptionsQuery = useQuery({
    queryKey: ['problem-tag-options', effectiveScope],
    queryFn: () =>
      problemApi
        .list({ scope: effectiveScope, limit: 100 })
        .then((response) => response.data.data),
    staleTime: 1000 * 60 * 5,
  });
  const tagOptions = useMemo(() => {
    const unique = new Set<string>();
    (tagOptionsQuery.data ?? EMPTY_PROBLEMS).forEach((problem) =>
      (problem.tags ?? []).forEach((tag) => unique.add(tag))
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [tagOptionsQuery.data]);

  const params = buildProblemParams({
    scope: effectiveScope,
    difficulty,
    tags,
    search: debouncedSearch.trim() || undefined,
    status: isAuthenticated ? status : 'all',
    sort: sortOption.sort,
    order: sortOption.order,
    page,
    limit,
  });
  const { data, isLoading, isFetching, isError, error, refetch } =
    useProblems(params);

  const problems = data?.problems ?? EMPTY_PROBLEMS;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const firstItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastItem = Math.min(total, page * limit);

  // Any filter change returns to the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, difficulty, status, tags, sortValue, scope, limit, effectiveScope]);

  const solvedOnPage = useMemo(
    () => problems.filter((problem) => problem.solved).length,
    [problems]
  );
  const bookmarkedOnPage = useMemo(
    () => problems.filter((problem) => problem.bookmarked).length,
    [problems]
  );

  const activeFilterCount =
    (debouncedSearch.trim() ? 1 : 0) +
    (difficulty !== 'all' ? 1 : 0) +
    (status !== 'all' ? 1 : 0) +
    tags.length +
    (scope === 'public' ? 1 : 0);

  const clearAllFilters = () => {
    setSearch('');
    setDifficulty('all');
    setStatus('all');
    setTags([]);
    setScope('available');
    setPage(1);
  };

  const toggleTag = (tag: string) =>
    setTags((previous) =>
      previous.includes(tag)
        ? previous.filter((item) => item !== tag)
        : [...previous, tag]
    );

  const filterButtonClass = (selected: boolean) =>
    cn(
      'inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50',
      selected
        ? 'border-brand-500/40 bg-brand-500/10 text-brand-700 dark:text-brand-300'
        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-slate-200'
    );

  const problemBasePath = user?.role === 'general_student'
    ? '/dashboard/problems'
    : user?.role === 'super_admin'
      ? '/super-admin/problems'
      : institutionHref('/institution/problems', tenantQuery.data?.slug);
  const PageContainer = embedded ? 'div' : 'main';

  return (
    <PageContainer className={embedded ? 'space-y-6 text-slate-900 dark:text-slate-100' : 'min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#080d18] dark:text-slate-100 sm:px-6 lg:px-8'}>
      <div className={embedded ? 'space-y-6' : 'mx-auto max-w-[1440px] space-y-6'}>
        <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-7 dark:border-slate-800 dark:bg-[#0e1728] sm:px-9 sm:py-9">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl"
          />
          <div className="relative flex flex-col justify-between gap-8 xl:flex-row xl:items-end">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                <Code2 className="h-3.5 w-3.5" aria-hidden /> Practice library
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Problems
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                Build problem-solving skills with focused challenges, clear
                constraints, and judge feedback.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <ListFilter className="h-4 w-4 text-blue-600 dark:text-blue-300" aria-hidden /> In
                  this library
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                  {isLoading ? '—' : total.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                  {effectiveScope === 'public' ? 'public challenges' : 'available challenges'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />{' '}
                  Your progress
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                  {isAuthenticated ? solvedOnPage : '—'}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                  {isAuthenticated
                    ? `solved on this page · ${bookmarkedOnPage} bookmarked`
                    : 'sign in to track progress'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section
          aria-label="Search and filter problems"
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0e1728] sm:p-5"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <label className="relative block w-full xl:max-w-xl">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                aria-label="Search problems by title"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by problem title…"
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 inline-flex items-center gap-2 pr-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> Difficulty
              </span>
              <div role="group" aria-label="Filter by difficulty" className="flex flex-wrap items-center gap-2">
                {DIFFICULTY_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    aria-pressed={difficulty === filter.value}
                    onClick={() => setDifficulty(filter.value)}
                    className={filterButtonClass(difficulty === filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-2 pr-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Status
            </span>
            <div role="group" aria-label="Filter by solve status" className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={status === filter.value}
                  onClick={() => setStatus(filter.value)}
                  disabled={!isAuthenticated && filter.value !== 'all'}
                  title={
                    !isAuthenticated && filter.value !== 'all'
                      ? 'Sign in to filter by solve status'
                      : undefined
                  }
                  className={filterButtonClass(status === filter.value)}
                >
                  {filter.label}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={scope === 'public'}
                onClick={() => setScope(scope === 'public' ? 'available' : 'public')}
                disabled={!user?.tenantId}
                title={!user?.tenantId ? 'Institution problems require an institution account' : 'Toggle institution problems'}
                className={filterButtonClass(scope === 'public')}
              >
                Public only
              </button>
            </div>

            {tagOptions.length > 0 && (
              <div
                role="group"
                aria-label="Filter by tags"
                className="mt-2 flex max-w-full flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-white/5"
              >
                <span className="mr-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Tags
                </span>
                {tagOptions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={tags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      filterButtonClass(tags.includes(tag)),
                      'h-8 px-2.5 text-[11px]'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 dark:border-white/5">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              Sort by
              <select
                aria-label="Sort problems"
                value={sortValue}
                onChange={(event) => setSortValue(event.target.value)}
                className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              Per page
              <select
                aria-label="Problems per page"
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="ml-auto flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span aria-live="polite">
                {isLoading
                  ? 'Loading problems…'
                  : `Showing ${firstItem}–${lastItem} of ${total.toLocaleString()}`}
              </span>
              {isFetching && !isLoading && (
                <span className="animate-pulse" aria-label="Updating results">
                  Updating…
                </span>
              )}
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  Clear all ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        </section>

        {isError ? (
          <section
            role="alert"
            className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 dark:bg-rose-500/10"
          >
            <h2 className="font-medium text-rose-700 dark:text-rose-200">
              Problems couldn’t be loaded
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading problems">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0e1728]"
              />
            ))}
          </div>
        ) : problems.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-[#0e1728]">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-950">
              <SearchX className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
              No matching problems
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try a different title, tag, or clear the active filters.
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
          <section aria-label="Problem results" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {problems.map((problem) => {
              const rate = acceptanceRate(problem);
              const solveHref = `${problemBasePath}/${problem.id}/solve`;
              return (
                <article
                  key={problem.id}
                  className="group flex min-h-[240px] flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-md dark:border-slate-800 dark:bg-[#0e1728] dark:hover:bg-[#111d31]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <DifficultyBadge difficulty={problem.difficulty} />
                    <BookmarkButton problemId={problem.id} bookmarked={problem.bookmarked} />
                  </div>

                  <h2 className="mt-4 line-clamp-2 text-lg font-semibold leading-6 text-slate-900 group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300">
                    <Link href={solveHref}>{problem.title}</Link>
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
                    {problem.statement ||
                      'Open the challenge to review its requirements and submit a solution.'}
                  </p>

                  <div className="mt-4 flex min-h-6 flex-wrap gap-1.5">
                    {(problem.tags ?? []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="tabular-nums">
                        {rate === null ? 'No submissions yet' : `${rate}% acceptance`}
                      </span>
                      <span className="tabular-nums">
                        {(problem.totalSubmissions ?? 0).toLocaleString()} submissions
                      </span>
                      {problem.solved && (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Solved
                        </span>
                      )}
                    </div>
                    <Link
                      href={solveHref}
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 opacity-80 transition group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-brand-400"
                    >
                      Solve <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {!isLoading && !isError && problems.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
              Page {page} of {totalPages}
            </p>
          </div>
        )}

        <footer className="flex items-center gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-600">
          <Code2 className="h-3.5 w-3.5" aria-hidden /> Problem details and submission results are
          provided by the coding platform.
        </footer>
      </div>
    </PageContainer>
  );
}
