'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Eye, Pencil, Plus, Search, Trash2, X, CheckSquare, FileCode, Sparkles } from 'lucide-react';
import { getErrorMessage, problemApi, tenantApi } from '@/lib/api';
import type { Problem as ApiProblem } from '@/types';

const PAGE_SIZE = 25;
type Problem = {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  scope: string;
  tenant_id?: string | null;
  tags: string[];
  total_submissions: number;
  accepted_submissions: number;
  acceptance_rate: number;
  created_at: string;
};
type ProblemWireFields = {
  tenant_id?: string | null;
  total_submissions?: number;
  accepted_submissions?: number;
  acceptance_rate?: number;
  created_at?: string;
};
type TenantOption = { id: string; name: string };

export default function SuperAdminProblemsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [scope, setScope] = useState<'public' | 'institution' | 'all'>('all');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['global-problems', search, difficulty, scope, page],
    queryFn: () => problemApi.list({ scope, ...(search.trim() ? { search: search.trim() } : {}), ...(difficulty ? { difficulty } : {}), page, limit: PAGE_SIZE, sort: 'created_at', order: 'desc' })
      .then((response) => ({
        data: response.data.data.map((problem) => {
          const row = problem as ApiProblem & ProblemWireFields;
          return {
            id: row.id,
            title: row.title,
            slug: row.slug,
            difficulty: row.difficulty,
            scope: row.scope,
            tenant_id: row.tenant_id,
            tags: row.tags,
            total_submissions: row.total_submissions ?? row.totalSubmissions ?? 0,
            accepted_submissions: row.accepted_submissions ?? row.acceptedSubmissions ?? 0,
            acceptance_rate: row.acceptance_rate ?? row.acceptanceRate ?? 0,
            created_at: row.created_at ?? row.createdAt ?? '',
          } satisfies Problem;
        }),
        total: response.data.total,
      })),
    placeholderData: (previous) => previous,
  });

  const tenants = useQuery({
    queryKey: ['tenants', 'super-admin-problems'],
    queryFn: () => tenantApi.list(1, 100).then((response) => response.data.data as TenantOption[]),
  });

  const detail = useQuery({
    queryKey: ['global-problem', viewing],
    queryFn: () => problemApi.get(viewing!).then((response) => response.data.data),
    enabled: !!viewing,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => problemApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['global-problems'] }),
  });

  const seedMutation = useMutation({
    mutationFn: () => problemApi.seed(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['global-problems'] });
      alert('Successfully seeded 20+ coding questions with sample and hidden test cases!');
    },
    onError: (err) => alert('Seeding failed: ' + getErrorMessage(err)),
  });

  const rows = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">Platform catalog</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Problems</h1>
        <p className="mt-1 text-sm text-slate-500">Create, review, update, and manage test cases and submissions.</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={seedMutation.isPending}
          onClick={() => {
            if (confirm('Seed 20+ verified coding questions across Arrays, Strings, DP, Trees, and Graphs? Existing questions will be preserved.')) {
              seedMutation.mutate();
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 dark:bg-purple-950/40 dark:border-purple-800 px-3.5 py-2 text-sm font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors shadow-sm disabled:opacity-50"
        >
          <Sparkles size={16} /> {seedMutation.isPending ? 'Seeding...' : 'Seed 20+ Questions'}
        </button>
        <Link
          href="/super-admin/problems/create"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Create Question
        </Link>
      </div>
    </header>

    {deleteMutation.error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{getErrorMessage(deleteMutation.error)}</p>}
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div><h2 className="text-sm font-semibold text-slate-900 dark:text-white">Platform problems</h2><p className="mt-1 text-xs text-slate-500">{query.isLoading ? 'Loading records…' : `${total.toLocaleString()} ${total === 1 ? 'problem' : 'problems'}`}</p></div>
        <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_150px_150px]">
          <label className="relative"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search problem title" aria-label="Search problems" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"/></label>
          <select aria-label="Filter by scope" value={scope} onChange={(event) => { setScope(event.target.value as 'public' | 'institution' | 'all'); setPage(1); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="all">All scopes</option><option value="public">Public</option><option value="institution">Institution</option></select>
          <select aria-label="Filter by difficulty" value={difficulty} onChange={(event) => { setDifficulty(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="">All difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
        </div>
      </div>
      {query.error ? <div role="alert" className="flex flex-wrap items-center justify-between gap-3 p-6 text-sm text-rose-700 dark:text-rose-300"><span>{getErrorMessage(query.error)}</span><button type="button" onClick={() => query.refetch()} className="font-medium underline">Retry</button></div> : query.isLoading ? <div aria-label="Loading problems" className="space-y-2 p-4">{[0,1,2,3,4].map((item) => <div key={item} className="h-12 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />)}</div> : rows.length === 0 ? <div className="px-5 py-14 text-center"><p className="text-sm font-medium text-slate-800 dark:text-slate-200">No problems match these filters.</p><p className="mt-1 text-xs text-slate-500">Try a different title, scope, or difficulty.</p></div> : <>
        <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-950/40"><tr>{['Problem','Difficulty','Scope','Institution','Tags','Submissions','Accepted','Acceptance','Actions'].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map((problem) => <tr key={problem.id} className="text-slate-700 dark:text-slate-300"><td className="max-w-[240px] px-4 py-3"><p className="truncate font-medium text-slate-900 dark:text-white" title={problem.title}>{problem.title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{problem.slug}</p></td><td className="px-4 py-3 capitalize">{problem.difficulty}</td><td className="px-4 py-3 capitalize">{problem.scope}</td><td className="px-4 py-3">{tenants.data?.find((tenant) => tenant.id === problem.tenant_id)?.name ?? (problem.tenant_id ? 'Institution' : '—')}</td><td className="max-w-[180px] px-4 py-3 text-xs text-slate-500">{problem.tags?.length ? problem.tags.join(', ') : '—'}</td><td className="px-4 py-3 tabular-nums">{Number(problem.total_submissions || 0).toLocaleString()}</td><td className="px-4 py-3 tabular-nums">{Number(problem.accepted_submissions || 0).toLocaleString()}</td><td className="px-4 py-3 tabular-nums">{Number(problem.acceptance_rate || 0)}%</td><td className="px-4 py-3">
  <div className="flex items-center gap-1">
    <button type="button" title="Quick view" aria-label={`View ${problem.title}`} onClick={() => setViewing(problem.id)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Eye size={15}/></button>
    <Link href={`/super-admin/problems/${problem.id}/edit`} title="Full edit" className="rounded-md p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800"><Pencil size={15}/></Link>
    <Link href={`/super-admin/problems/${problem.id}/test-cases`} title="Manage test cases" className="rounded-md p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-800"><CheckSquare size={15}/></Link>
    <Link href={`/super-admin/problems/${problem.id}/submissions`} title="Submissions" className="rounded-md p-1.5 text-slate-500 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-slate-800"><FileCode size={15}/></Link>
    <button type="button" title="Delete problem" aria-label={`Delete ${problem.title}`} disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`Delete ${problem.title}?`)) deleteMutation.mutate(problem.id); }} className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:hover:bg-rose-950/40"><Trash2 size={15}/></button>
  </div>
</td></tr>)}</tbody></table></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800"><p className="text-xs text-slate-500">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}</p><div className="flex items-center gap-2"><button type="button" disabled={page <= 1 || query.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"><ArrowLeft size={14}/>Previous</button><span className="px-1 text-xs text-slate-500">Page {page} of {pageCount}</span><button type="button" disabled={page >= pageCount || query.isFetching} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">Next<ArrowRight size={14}/></button></div></div>
      </>}
    </section>

    {viewing && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4"><section role="dialog" aria-modal="true" aria-labelledby="problem-detail-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900"><div className="flex items-start justify-between"><h2 id="problem-detail-title" className="text-lg font-semibold text-slate-950 dark:text-white">Problem details</h2><button type="button" aria-label="Close problem details" onClick={() => setViewing(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={17}/></button></div>{detail.isLoading ? <p className="py-6 text-sm text-slate-500">Loading problem…</p> : detail.error ? <p role="alert" className="py-6 text-sm text-rose-700">{getErrorMessage(detail.error)}</p> : <div className="mt-4 space-y-4"><div><h3 className="font-semibold text-slate-900 dark:text-white">{detail.data?.title}</h3><p className="mt-1 text-xs capitalize text-slate-500">{detail.data?.difficulty} · {detail.data?.scope}</p></div><div><h4 className="text-xs font-semibold uppercase text-slate-500">Statement</h4><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{detail.data?.statement}</p></div>{[['Input format', detail.data?.input_format], ['Output format', detail.data?.output_format], ['Constraints', detail.data?.constraints_text], ['Sample explanation', detail.data?.sample_explanation]].map(([label, value]) => value && <div key={String(label)}><h4 className="text-xs font-semibold uppercase text-slate-500">{label}</h4><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{value}</p></div>)}</div>}</section></div>}
  </div>;
}
