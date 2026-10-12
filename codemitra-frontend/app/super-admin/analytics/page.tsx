'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, Building2, CheckCircle2, Code2, FileCode2, GraduationCap, Users } from 'lucide-react';
import { analyticsApi, getErrorMessage } from '@/lib/api';
import { MetricCard } from '@/components/dashboard/MetricCard';

type Activity = { id: string; type: string; status: string; occurredAt: string; studentId: string; studentName: string; studentEmail: string; institutionId: string; institutionName: string; itemTitle: string };
type Institution = { id: string; name: string; plan: string; isActive: boolean; students: number; activeUsers7d: number; courses: number; problems: number; submissions: number; lastSubmissionAt: string | null };
type PlatformOverview = { totalTenants: number; totalUsers: number; totalStudents: number; activeUsers7d: number; activeUsersToday: number; totalProblems: number; totalSubmissions: number; submissions7d: number; acceptedSubmissions: number; totalCourses: number; totalAssignments: number; totalQuizzes: number; assignmentSubmissions: number; quizAttempts: number; progressRecords: number; institutions: Institution[]; recentActivity: Activity[] };

const number = (value?: number) => value?.toLocaleString() ?? '0';
const dateTime = (value?: string | null) => value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'No activity yet';
const activityLabel: Record<string, string> = { code_submission: 'Code submission', assignment_submission: 'Assignment', quiz_attempt: 'Quiz attempt', course_progress: 'Course progress' };

export default function PlatformAnalyticsPage() {
  const report = useQuery({ queryKey: ['platform-overview'], queryFn: () => analyticsApi.platformOverview().then((r) => r.data.data as PlatformOverview), staleTime: 60_000 });
  const data = report.data;
  const acceptedRate = data?.totalSubmissions ? Math.round(data.acceptedSubmissions / data.totalSubmissions * 100) : 0;
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">Platform intelligence</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Everything happening across CodeVerse</h1><p className="mt-1 text-sm text-slate-500">Institution health, student activity, and learning engagement across the platform.</p></div><button onClick={() => report.refetch()} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Refresh data</button></header>
    {report.error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"><span>{getErrorMessage(report.error)}</span><button type="button" onClick={() => report.refetch()} className="font-medium underline">Retry</button></div>}
    <section aria-label="Platform metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Institutions" value={number(data?.totalTenants)} detail="Workspaces on the platform" icon={Building2} />
      <MetricCard label="Users" value={number(data?.totalUsers)} detail={`${number(data?.totalStudents)} students`} icon={Users} tone="green" />
      <MetricCard label="Active today" value={number(data?.activeUsersToday)} detail={`${number(data?.activeUsers7d)} users in the last 7 days`} icon={GraduationCap} tone="violet" />
      <MetricCard label="Submissions" value={number(data?.totalSubmissions)} detail={`${number(data?.submissions7d)} in the last 7 days`} icon={Code2} />
      <MetricCard label="Accepted solutions" value={number(data?.acceptedSubmissions)} detail={`${acceptedRate}% acceptance rate`} icon={CheckCircle2} tone="green" />
      <MetricCard label="Courses" value={number(data?.totalCourses)} detail="Across all institutions" icon={BookOpen} tone="violet" />
      <MetricCard label="Assignments" value={number(data?.totalAssignments)} detail={`${number(data?.assignmentSubmissions)} student submissions`} icon={FileCode2} tone="amber" />
      <MetricCard label="Quizzes" value={number(data?.totalQuizzes)} detail={`${number(data?.quizAttempts)} student attempts`} icon={CheckCircle2} />
    </section>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 p-5 dark:border-slate-800"><h2 className="text-base font-semibold text-slate-950 dark:text-white">Institution activity</h2><p className="mt-1 text-sm text-slate-500">Compare student engagement, learning content, and coding activity.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40"><tr>{['Institution','Plan / status','Students','Active users · 7d','Courses','Problems','Submissions','Last submission'].map((x) => <th key={x} className="px-4 py-3 font-medium">{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{data?.institutions.map((institution) => <tr key={institution.id} className="text-slate-700 dark:text-slate-300"><td className="px-4 py-3"><Link href={`/super-admin/institutions/${institution.id}`} className="font-medium text-blue-700 hover:underline dark:text-blue-300">{institution.name}</Link></td><td className="px-4 py-3 capitalize">{institution.plan} · {institution.isActive ? 'Active' : 'Inactive'}</td><td className="px-4 py-3 tabular-nums">{number(institution.students)}</td><td className="px-4 py-3 tabular-nums">{number(institution.activeUsers7d)}</td><td className="px-4 py-3 tabular-nums">{number(institution.courses)}</td><td className="px-4 py-3 tabular-nums">{number(institution.problems)}</td><td className="px-4 py-3 tabular-nums">{number(institution.submissions)}</td><td className="px-4 py-3 text-xs text-slate-500">{dateTime(institution.lastSubmissionAt)}</td></tr>)}</tbody></table>{!report.isLoading && !data?.institutions.length && <p className="p-6 text-sm text-slate-500">No institutions found.</p>}</div>
    </section>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 p-5 dark:border-slate-800"><h2 className="text-base font-semibold text-slate-950 dark:text-white">Recent student activity</h2><p className="mt-1 text-sm text-slate-500">Latest course progress, code submissions, assignment work, and quiz attempts from all institutions.</p></div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">{data?.recentActivity.map((activity) => <article key={`${activity.type}-${activity.id}`} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4"><div className="min-w-[180px] flex-1"><p className="text-sm font-medium text-slate-900 dark:text-white">{activity.studentName} <span className="font-normal text-slate-500">· {activity.institutionName}</span></p><p className="mt-1 text-xs text-slate-500">{activityLabel[activity.type] || activity.type} · {activity.itemTitle}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">{activity.status.replaceAll('_', ' ')}</span><time className="text-xs text-slate-500">{dateTime(activity.occurredAt)}</time><Link href="/super-admin/users" className="text-xs font-medium text-blue-700 hover:underline dark:text-blue-300">Student record <ArrowRight size={12} className="ml-1 inline" /></Link></article>)}{!report.isLoading && !data?.recentActivity.length && <p className="p-6 text-sm text-slate-500">No student activity recorded yet.</p>}</div>
    </section>
    <section className="grid gap-3 sm:grid-cols-2"><Link href="/super-admin/institutions" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"><Building2 size={18} />Manage institutions<ArrowRight size={15} className="ml-auto" /></Link><Link href="/super-admin/users" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"><Users size={18} />View all users<ArrowRight size={15} className="ml-auto" /></Link></section>
    <p className="text-xs text-slate-500">Activity reflects records stored by the platform. Student email addresses and submitted code are not shown in this overview.</p>
  </div>;
}
