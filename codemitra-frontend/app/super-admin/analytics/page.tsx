'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, CheckCircle2, Code2, FileCode2, Users } from 'lucide-react';
import { analyticsApi, getErrorMessage } from '@/lib/api';
import { MetricCard } from '@/components/dashboard/MetricCard';

type PlatformOverview = { totalTenants: number; totalUsers: number; totalProblems: number; totalSubmissions: number; acceptedSubmissions: number; totalCourses: number };

export default function PlatformAnalyticsPage() {
  const report = useQuery({ queryKey: ['platform-overview'], queryFn: () => analyticsApi.platformOverview().then((r) => r.data.data as PlatformOverview), staleTime: 60_000 });
  const data = report.data;
  const acceptedRate = data?.totalSubmissions ? Math.round(data.acceptedSubmissions / data.totalSubmissions * 100) : 0;
  return <div className="space-y-6">
    <header><p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">Platform intelligence</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Platform analytics</h2><p className="mt-1 text-sm text-slate-500">Aggregate activity across institutions, users, learning content, and submissions.</p></header>
    {report.error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"><span>{getErrorMessage(report.error)}</span><button type="button" onClick={() => report.refetch()} className="font-medium underline">Retry</button></div>}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard label="Institutions" value={data?.totalTenants?.toLocaleString() ?? (report.isLoading ? '—' : 0)} detail="Active platform tenants" icon={Building2} />
      <MetricCard label="Users" value={data?.totalUsers?.toLocaleString() ?? (report.isLoading ? '—' : 0)} detail="Across all workspaces" icon={Users} tone="green" />
      <MetricCard label="Courses" value={data?.totalCourses?.toLocaleString() ?? (report.isLoading ? '—' : 0)} detail="Platform-wide course count" icon={FileCode2} tone="violet" />
      <MetricCard label="Problems" value={data?.totalProblems?.toLocaleString() ?? (report.isLoading ? '—' : 0)} detail="Available coding challenges" icon={Code2} tone="amber" />
      <MetricCard label="Submissions" value={data?.totalSubmissions?.toLocaleString() ?? (report.isLoading ? '—' : 0)} detail="All recorded submissions" icon={Code2} />
      <MetricCard label="Accepted submissions" value={data?.acceptedSubmissions?.toLocaleString() ?? (report.isLoading ? '—' : 0)} detail={`${acceptedRate}% of recorded submissions`} icon={CheckCircle2} tone="green" />
    </section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6"><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Explore platform data</h3><p className="mt-1 text-xs text-slate-500">Open a workspace to review its records and management controls.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{[['Institutions', '/super-admin/institutions', Building2], ['Users', '/super-admin/users', Users]].map(([label, href, Icon]) => <Link key={String(href)} href={String(href)} className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"><Icon size={17} className="text-slate-400" />{String(label)}<ArrowRight size={14} className="ml-auto text-slate-400" /></Link>)}</div></section>
    <p className="text-xs leading-5 text-slate-500">The current analytics API provides platform-wide totals. It does not expose historical time-series or per-institution comparison data, so this page reports verified aggregate values only.</p>
  </div>;
}
