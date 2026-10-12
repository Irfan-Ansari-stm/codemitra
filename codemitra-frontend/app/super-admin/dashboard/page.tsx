'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, CheckCircle2, Code2, FileCode2, Users } from 'lucide-react';
import { analyticsApi, getErrorMessage } from '@/lib/api';
import { MetricCard } from '@/components/dashboard/MetricCard';

type PlatformOverview = {
  totalTenants: number;
  totalUsers: number;
  totalProblems: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  totalCourses: number;
};

export default function PlatformDashboardPage() {
  const overview = useQuery({
    queryKey: ['platform-overview'],
    queryFn: () => analyticsApi.platformOverview().then((response) => response.data.data as PlatformOverview),
    staleTime: 60_000,
  });
  const data = overview.data;
  const acceptance = data && data.totalSubmissions > 0 ? Math.round(data.acceptedSubmissions / data.totalSubmissions * 100) : 0;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">Platform administration</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Platform overview</h1><p className="mt-1 text-sm text-slate-500">A live view of the CodeVerse platform.</p></div><p className="text-xs text-slate-500">{overview.dataUpdatedAt ? `Updated ${new Date(overview.dataUpdatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Live platform metrics'}</p></header>
    {overview.error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"><span>{getErrorMessage(overview.error)}</span><button type="button" onClick={() => overview.refetch()} className="font-medium underline underline-offset-2">Retry</button></div>}
    <section aria-label="Platform metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard label="Institutions" value={data?.totalTenants?.toLocaleString() ?? (overview.isLoading ? '—' : '0')} detail="Active platform tenants" icon={Building2} />
      <MetricCard label="Users" value={data?.totalUsers?.toLocaleString() ?? (overview.isLoading ? '—' : '0')} detail="Across all institutions" icon={Users} tone="green" />
      <MetricCard label="Courses" value={data?.totalCourses?.toLocaleString() ?? (overview.isLoading ? '—' : '0')} detail="Published and draft courses" icon={FileCode2} tone="violet" />
      <MetricCard label="Problems" value={data?.totalProblems?.toLocaleString() ?? (overview.isLoading ? '—' : '0')} detail="Available coding challenges" icon={Code2} tone="amber" />
      <MetricCard label="Submissions" value={data?.totalSubmissions?.toLocaleString() ?? (overview.isLoading ? '—' : '0')} detail="All recorded submissions" icon={Code2} />
      <MetricCard label="Accepted submissions" value={data?.acceptedSubmissions?.toLocaleString() ?? (overview.isLoading ? '—' : '0')} detail={`${acceptance}% of all submissions`} icon={CheckCircle2} tone="green" />
    </section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Administration</h3><p className="mt-1 text-xs text-slate-500">Manage platform entities and review operational data.</p></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{[
        ['Institutions', '/super-admin/institutions', Building2], ['General users', '/super-admin/general-users', Users], ['Institution users', '/super-admin/users', Users], ['Courses', '/super-admin/courses', FileCode2], ['Problems', '/super-admin/problems', Code2], ['Platform analytics', '/super-admin/analytics', Code2],
      ].map(([label, href, Icon]) => <Link key={String(href)} href={String(href)} className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"><Icon size={17} className="text-slate-400" />{String(label)}<ArrowRight size={14} className="ml-auto text-slate-400" /></Link>)}</div>
    </section>
  </div>;
}
