'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, BookOpen, CheckCircle2, ClipboardList, Code2, Users } from 'lucide-react';
import { analyticsApi, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SubmissionActivityChart } from '@/components/dashboard/SubmissionActivityChart';
import Leaderboard from '@/components/analytics/Leaderboard';
import { LANGUAGES } from '@/types';

type AnalyticsOverview = { totalStudents: number; active7d: number; submissions7d: number; accepted7d: number; publishedCourses: number; totalProblems: number; activeAssignments: number };
type LanguageActivity = { languageId: number; submissions: number; accepted: number };

export default function InstitutionAnalyticsPage() {
  const tenantId = useAuthStore((state) => state.user?.tenantId);
  const [days, setDays] = useState<30 | 90>(30);
  const overview = useQuery({ queryKey: ['analytics-overview', tenantId], queryFn: () => analyticsApi.overview(tenantId || undefined).then((r) => r.data.data as AnalyticsOverview), enabled: !!tenantId });
  const activity = useQuery({ queryKey: ['analytics-heatmap', tenantId, days], queryFn: () => analyticsApi.heatmap(days).then((r) => r.data.data), enabled: !!tenantId });
  const leaderboard = useQuery({ queryKey: ['analytics-leaderboard', tenantId], queryFn: () => analyticsApi.leaderboard().then((r) => r.data.data), enabled: !!tenantId });
  const languages = useQuery({ queryKey: ['analytics-languages', tenantId, days], queryFn: () => analyticsApi.languages(days).then((r) => r.data.data as LanguageActivity[]), enabled: !!tenantId });
  const metric = overview.data;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">Performance</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Institution analytics</h2><p className="mt-1 text-sm text-slate-500">Activity, adoption, and learner outcomes from your institution.</p></div><div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900" aria-label="Activity date range">{([30, 90] as const).map((range) => <button key={range} type="button" aria-pressed={days === range} onClick={() => setDays(range)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${days === range ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>Last {range} days</button>)}</div></header>
    {overview.error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">{getErrorMessage(overview.error)} <button onClick={() => overview.refetch()} className="ml-2 font-medium underline">Retry</button></div>}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Active students" value={metric?.totalStudents?.toLocaleString() ?? (overview.isLoading ? '—' : 0)} detail="Currently enrolled" icon={Users} />
      <MetricCard label="Active this week" value={metric?.active7d?.toLocaleString() ?? (overview.isLoading ? '—' : 0)} detail="Recent learner logins" icon={Activity} tone="green" />
      <MetricCard label="Published courses" value={metric?.publishedCourses?.toLocaleString() ?? (overview.isLoading ? '—' : 0)} detail="Available to learners" icon={BookOpen} tone="violet" />
      <MetricCard label="Open assignments" value={metric?.activeAssignments?.toLocaleString() ?? (overview.isLoading ? '—' : 0)} detail="Published and not yet due" icon={ClipboardList} tone="amber" />
      <MetricCard label="Submissions · 7 days" value={metric?.submissions7d?.toLocaleString() ?? (overview.isLoading ? '—' : 0)} detail="Across all verdicts" icon={Code2} />
      <MetricCard label="Accepted · 7 days" value={metric?.accepted7d?.toLocaleString() ?? (overview.isLoading ? '—' : 0)} detail={`${metric?.submissions7d ? Math.round(metric.accepted7d / metric.submissions7d * 100) : 0}% of recent runs`} icon={CheckCircle2} tone="green" />
    </section>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
      <SubmissionActivityChart data={activity.data} days={days} isLoading={activity.isLoading} error={activity.error} onRetry={() => activity.refetch()} />
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6"><div><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Language activity</h3><p className="mt-1 text-xs text-slate-500">Submissions by programming language · {days} days</p></div>
        {languages.isLoading ? <div className="mt-4 h-48 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" /> : languages.error ? <p role="alert" className="mt-4 text-sm text-rose-600">Couldn’t load language activity. <button onClick={() => languages.refetch()} className="underline">Retry</button></p> : !languages.data?.length ? <div className="mt-4 grid h-48 place-items-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-800">No language submissions in this period.</div> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[260px] text-left text-xs"><thead><tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500 dark:border-slate-800"><th className="py-2 font-medium">Language</th><th className="py-2 text-right font-medium">Runs</th><th className="py-2 text-right font-medium">Accepted</th></tr></thead><tbody>{languages.data.map((row) => <tr key={row.languageId} className="border-b border-slate-100 last:border-0 dark:border-slate-800/70"><td className="py-3 font-medium text-slate-700 dark:text-slate-300">{LANGUAGES[row.languageId]?.name || `Language ${row.languageId}`}</td><td className="py-3 text-right tabular-nums text-slate-600 dark:text-slate-400">{row.submissions}</td><td className="py-3 text-right tabular-nums text-slate-600 dark:text-slate-400">{row.accepted}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6"><div className="mb-4"><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Learner leaderboard</h3><p className="mt-1 text-xs text-slate-500">Current institution ranking by score.</p></div>{leaderboard.error ? <p role="alert" className="text-sm text-rose-600">{getErrorMessage(leaderboard.error)} <button onClick={() => leaderboard.refetch()} className="underline">Retry</button></p> : <Leaderboard entries={leaderboard.data ?? []} isLoading={leaderboard.isLoading} />}</section>
  </div>;
}
