'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, Code2, Search, SlidersHorizontal, Target, X } from 'lucide-react';
import Link from 'next/link';
import { problemApi } from '@/lib/api';
import type { Problem } from '@/types';

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';
const EMPTY_PROBLEMS: Problem[] = [];

const difficultyStyles: Record<string, string> = {
  easy: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  medium: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  hard: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
};

const filters: { value: DifficultyFilter; label: string }[] = [
  { value: 'all', label: 'All problems' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function ProblemsPage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const deferredSearch = useDeferredValue(search.trim());

  const problemsQuery = useQuery({
    queryKey: ['public-problems', deferredSearch],
    queryFn: () => problemApi.list({ scope: 'public', search: deferredSearch || undefined, limit: 50 }).then((r) => r.data.data as Problem[]),
  });
  const problems = problemsQuery.data ?? EMPTY_PROBLEMS;

  const filteredProblems = useMemo(
    () => difficulty === 'all' ? problems : problems.filter((problem) => problem.difficulty === difficulty),
    [problems, difficulty]
  );
  const difficultyCounts = useMemo(() => ({
    all: problems.length,
    easy: problems.filter((problem) => problem.difficulty === 'easy').length,
    medium: problems.filter((problem) => problem.difficulty === 'medium').length,
    hard: problems.filter((problem) => problem.difficulty === 'hard').length,
  }), [problems]);
  const acceptedSubmissions = problems.reduce((total, problem) => total + (problem.acceptedSubmissions || 0), 0);

  return (
    <main className="min-h-screen bg-[#080d18] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-7">
        <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0e1728] px-6 py-7 sm:px-9 sm:py-9">
          <div className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-8 xl:flex-row xl:items-end">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                <Code2 className="h-3.5 w-3.5" /> Practice library
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Public problems</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                Build problem-solving skills with focused challenges, clear constraints, and judge feedback.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400"><Target className="h-4 w-4 text-blue-300" /> In this library</div>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{problemsQuery.isLoading ? '—' : problems.length}</p>
                <p className="mt-1 text-xs text-slate-500">public challenges</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400"><Check className="h-4 w-4 text-emerald-300" /> Accepted runs</div>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{problemsQuery.isLoading ? '—' : acceptedSubmissions.toLocaleString()}</p>
                <p className="mt-1 text-xs text-slate-500">across public problems</p>
              </div>
            </div>
          </div>
        </header>

        <section aria-label="Search and filter problems" className="rounded-2xl border border-slate-800 bg-[#0e1728] p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <label className="relative block w-full xl:max-w-xl">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                aria-label="Search public problems"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by problem title…"
                className="h-11 w-full rounded-lg border border-slate-700 bg-[#080d18] pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
              />
              {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>}
            </label>

            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by difficulty">
              <span className="mr-1 inline-flex items-center gap-2 pr-1 text-xs font-medium text-slate-500"><SlidersHorizontal className="h-3.5 w-3.5" /> Difficulty</span>
              {filters.map((filter) => {
                const selected = difficulty === filter.value;
                return <button key={filter.value} type="button" aria-pressed={selected} onClick={() => setDifficulty(filter.value)} className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${selected ? 'border-blue-400/40 bg-blue-500/15 text-blue-100' : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-600 hover:text-slate-200'}`}>
                  {filter.label}<span className={selected ? 'text-blue-200/70' : 'text-slate-600'}>{difficultyCounts[filter.value]}</span>
                </button>;
              })}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-500">
            <span>{problemsQuery.isLoading ? 'Loading problems…' : `Showing ${filteredProblems.length} of ${problems.length} problems`}</span>
            {problemsQuery.isFetching && !problemsQuery.isLoading && <span className="animate-pulse">Updating results</span>}
          </div>
        </section>

        {problemsQuery.isError ? (
          <section role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-6">
            <h2 className="font-medium text-rose-100">Problems couldn’t be loaded</h2>
            <p className="mt-1 text-sm text-rose-200/70">Check your connection and retry the request.</p>
            <button type="button" onClick={() => problemsQuery.refetch()} className="mt-4 rounded-lg border border-rose-300/30 px-3 py-2 text-sm text-rose-100 hover:bg-rose-400/10">Retry</button>
          </section>
        ) : problemsQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading problems">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-xl border border-slate-800 bg-[#0e1728]" />)}
          </div>
        ) : filteredProblems.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-700 bg-[#0e1728] px-6 py-16 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-slate-400"><Search className="h-5 w-5" /></div>
            <h2 className="mt-4 text-base font-semibold text-white">No matching problems</h2>
            <p className="mt-1 text-sm text-slate-500">Try a different title or clear the difficulty filter.</p>
            {(search || difficulty !== 'all') && <button type="button" onClick={() => { setSearch(''); setDifficulty('all'); }} className="mt-4 text-sm font-medium text-blue-300 hover:text-blue-200">Clear all filters</button>}
          </section>
        ) : (
          <section aria-label="Problem results" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProblems.map((problem) => {
              const rate = problem.totalSubmissions > 0 ? Math.round((problem.acceptedSubmissions / problem.totalSubmissions) * 100) : null;
              return <Link key={problem.id} href={`/institution/problems/${problem.id}/solve`} className="group flex min-h-[230px] flex-col rounded-xl border border-slate-800 bg-[#0e1728] p-5 transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-[#111d31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                <div className="flex items-center justify-between gap-3">
                  <span className={`rounded-md border px-2 py-1 text-[11px] font-semibold capitalize ${difficultyStyles[problem.difficulty] || 'border-slate-700 bg-slate-800 text-slate-300'}`}>{problem.difficulty}</span>
                  <span className="text-xs tabular-nums text-slate-500">{(problem.totalSubmissions || 0).toLocaleString()} submissions</span>
                </div>
                <h2 className="mt-4 line-clamp-2 text-lg font-semibold leading-6 text-slate-100 group-hover:text-blue-200">{problem.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-400">{problem.statement || 'Open the challenge to review its requirements and submit a solution.'}</p>
                <div className="mt-4 flex min-h-6 flex-wrap gap-1.5">
                  {(problem.tags || []).slice(0, 3).map((tag) => <span key={tag} className="rounded border border-slate-800 bg-slate-950/70 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">{tag}</span>)}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-slate-800 pt-4">
                  <span className="text-xs text-slate-500">{rate === null ? 'No submissions yet' : `${rate}% acceptance`}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-300 opacity-80 transition group-hover:translate-x-0.5 group-hover:opacity-100">Solve <ArrowRight className="h-3.5 w-3.5" /></span>
                </div>
              </Link>;
            })}
          </section>
        )}
        <footer className="flex items-center gap-2 border-t border-slate-800 pt-4 text-xs text-slate-600"><Code2 className="h-3.5 w-3.5" /> Problem details and submission results are provided by the coding platform.</footer>
      </div>
    </main>
  );
}
