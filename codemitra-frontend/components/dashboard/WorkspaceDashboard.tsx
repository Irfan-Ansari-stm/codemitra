'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight, BookOpen, CheckCircle2, ClipboardList, Code2, Users } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SubmissionActivityChart } from '@/components/dashboard/SubmissionActivityChart';
import Leaderboard from '@/components/analytics/Leaderboard';
import { getErrorMessage } from '@/lib/api';
import { useCurrentTenant } from '@/hooks/useTenant';
import { institutionHref } from '@/lib/workspace';

type Overview = {
  totalStudents: number;
  active7d: number;
  submissions7d: number;
  accepted7d: number;
  publishedCourses: number;
  totalProblems: number;
  activeAssignments: number;
};

function InstitutionAdminOverview({ tenantId }: { tenantId: string }) {
  const tenant = useCurrentTenant();
  const workspaceHref = (path: string) => institutionHref(path, tenant.data?.slug);
  const overview = useQuery({
    queryKey: ['analytics-overview', tenantId],
    queryFn: () => analyticsApi.overview(tenantId).then((response) => response.data.data as Overview),
  });
  const activity = useQuery({
    queryKey: ['analytics-heatmap', tenantId, 90],
    queryFn: () => analyticsApi.heatmap(90).then((response) => response.data.data),
  });
  const leaderboard = useQuery({
    queryKey: ['analytics-leaderboard', tenantId],
    queryFn: () => analyticsApi.leaderboard().then((response) => response.data.data),
  });
  const metrics = overview.data;
  const acceptance = metrics && metrics.submissions7d > 0 ? Math.round(metrics.accepted7d / metrics.submissions7d * 100) : 0;

  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">Institution workspace</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Overview</h1><p className="mt-1 text-sm text-slate-500">A live snapshot of learning activity and institution operations.</p></div><p className="text-xs text-slate-500">Metrics refresh automatically as new activity is recorded.</p></header>
    {overview.error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"><span>{getErrorMessage(overview.error)}</span><button onClick={() => overview.refetch()} className="font-medium underline underline-offset-2">Retry</button></div>}
    <section aria-label="Institution metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Active students" value={metrics?.totalStudents?.toLocaleString() ?? (overview.isLoading ? '—' : '0')} detail="Currently enrolled and active" icon={Users} />
      <MetricCard label="Active this week" value={metrics?.active7d?.toLocaleString() ?? (overview.isLoading ? '—' : '0')} detail="Students with a recent login" icon={Activity} tone="green" />
      <MetricCard label="Published courses" value={metrics?.publishedCourses?.toLocaleString() ?? (overview.isLoading ? '—' : '0')} detail="Available in this institution" icon={BookOpen} tone="violet" />
      <MetricCard label="Open assignments" value={metrics?.activeAssignments?.toLocaleString() ?? (overview.isLoading ? '—' : '0')} detail="Published and not yet due" icon={ClipboardList} tone="amber" />
      <MetricCard label="Submissions · 7 days" value={metrics?.submissions7d?.toLocaleString() ?? (overview.isLoading ? '—' : '0')} detail="All verdicts" icon={Code2} />
      <MetricCard label="Accepted · 7 days" value={metrics?.accepted7d?.toLocaleString() ?? (overview.isLoading ? '—' : '0')} detail={`${acceptance}% of recent submissions`} icon={CheckCircle2} tone="green" />
      <MetricCard label="Problem library" value={metrics?.totalProblems?.toLocaleString() ?? (overview.isLoading ? '—' : '0')} detail="Institution and public problems" icon={Code2} tone="violet" />
    </section>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.9fr)]">
      <SubmissionActivityChart data={activity.data} isLoading={activity.isLoading} error={activity.error} onRetry={() => activity.refetch()} />
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-slate-900 dark:text-white">Top learners</h2><p className="mt-1 text-xs text-slate-500">Ranked by platform score</p></div><Link href={workspaceHref('/institution/analytics')} className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-300">View analytics</Link></div>
        {leaderboard.error ? <div role="alert" className="mt-6 rounded-lg bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">Leaderboard is unavailable. <button onClick={() => leaderboard.refetch()} className="underline">Retry</button></div> : <div className="mt-4"><Leaderboard entries={leaderboard.data ?? []} isLoading={leaderboard.isLoading} /></div>}
      </section>
    </div>
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Workspace shortcuts</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{[
        ['Manage courses', '/institution/courses', BookOpen], ['Review assignments', '/institution/assignments', ClipboardList], ['Browse problem library', '/institution/problems', Code2], ['Manage students', '/institution/students', Users],
      ].map(([label, href, Icon]) => <Link key={String(href)} href={workspaceHref(String(href))} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"><Icon size={17} className="text-slate-400" />{String(label)}<ArrowRight size={14} className="ml-auto text-slate-400" /></Link>)}</div>
    </section>
  </div>;
}

function LearnerOverview() {
  const user = useAuthStore((state) => state.user);
  const tenant = useCurrentTenant();
  const workspaceHref = (path: string) => institutionHref(path, tenant.data?.slug);
  const problemsHref = user?.role === 'general_student' ? '/dashboard/problems' : workspaceHref('/institution/problems');
  const actions = [
    { label: 'Practice problems', href: problemsHref, description: 'Build skills with coding challenges', icon: Code2 },
    { label: 'Browse courses', href: workspaceHref('/institution/courses'), description: 'Continue a structured learning path', icon: BookOpen },
    { label: 'Assignments', href: workspaceHref('/institution/assignments'), description: 'Review work and due dates', icon: ClipboardList },
  ];
  return <div className="mx-auto max-w-5xl space-y-6">
    <header><p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">Learner workspace</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Welcome back, {user?.name?.split(' ')[0] || 'there'}</h1><p className="mt-1 text-sm text-slate-500">Pick up where you left off.</p></header>
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-medium text-slate-500">Signed in as</p><p className="mt-1 font-medium text-slate-900 dark:text-white">{user?.email}</p><p className="mt-1 text-xs capitalize text-slate-500">{user?.role.replace(/_/g, ' ')}</p></section>
    <section className="grid gap-3 md:grid-cols-3">{actions.map(({ label, href, description, icon: Icon }) => <Link key={href} href={href} className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-300"><Icon size={18} /></span><h3 className="mt-4 text-sm font-semibold text-slate-900 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">{label}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></Link>)}</section>
  </div>;
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  if (user?.role === 'institution_admin' && user.tenantId) return <InstitutionAdminOverview tenantId={user.tenantId} />;
  return <LearnerOverview />;
}
