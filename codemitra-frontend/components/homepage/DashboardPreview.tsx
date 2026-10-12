import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Code2,
  LayoutDashboard,
  Lock,
  TrendingUp,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Courses', icon: BookOpen, active: false },
  { label: 'Problems', icon: Code2, active: false },
  { label: 'Assignments', icon: ClipboardList, active: false },
  { label: 'Students', icon: Users, active: false },
  { label: 'Analytics', icon: BarChart3, active: false },
];

const metrics = [
  { label: 'Active learners', value: '1,284', delta: '+12.4%' },
  { label: 'Submissions (7d)', value: '3,492', delta: '+8.1%' },
  { label: 'Avg. score', value: '87%', delta: '+4.2%' },
];

const problems = [
  { title: 'Two Sum', difficulty: 'Easy', tone: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400', acceptance: '72%', submissions: '1,482' },
  { title: 'Level Order Traversal', difficulty: 'Medium', tone: 'text-amber-700 bg-amber-500/10 border-amber-500/20 dark:text-amber-400', acceptance: '58%', submissions: '964' },
  { title: 'Shortest Path in Graph', difficulty: 'Hard', tone: 'text-red-700 bg-red-500/10 border-red-500/20 dark:text-red-400', acceptance: '34%', submissions: '512' },
  { title: 'Grid DP Optimizer', difficulty: 'Medium', tone: 'text-amber-700 bg-amber-500/10 border-amber-500/20 dark:text-amber-400', acceptance: '51%', submissions: '738' },
];

const activity = [42, 68, 55, 90, 74, 96, 82];
const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function DashboardPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-x-10 top-1/2 h-[80%] -translate-y-1/2 rounded-full bg-brand-500/[0.07] blur-3xl"
      />
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card dark:border-white/10 dark:bg-ink-900">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/[0.06] dark:bg-ink-850">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-white/10" />
          </div>
          <div className="flex flex-1 items-center justify-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 dark:bg-white/[0.04]">
            <Lock className="h-3 w-3 text-slate-400 dark:text-slate-500" />
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              codeverse.io/institution/dashboard
            </span>
          </div>
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Live</span>
          </div>
        </div>

        {/* App shell */}
        <div className="grid sm:grid-cols-[190px_1fr]">
          {/* Sidebar */}
          <aside className="hidden border-r border-slate-200 bg-slate-50/80 p-3 dark:border-white/[0.06] dark:bg-ink-850/60 sm:block">
            <nav aria-label="Preview navigation" className="space-y-1">
              {sidebarItems.map(({ label, icon: Icon, active }) => (
                <div
                  key={label}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium',
                    active
                      ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden />
                  )}
                </div>
              ))}
            </nav>
          </aside>

          {/* Main panel */}
          <div className="p-4 sm:p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-slate-950 dark:text-white">Program overview</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Fall 2026 · CS 101 cohort</p>
              </div>
              <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
                Week 6 of 14
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 dark:border-white/[0.06] dark:bg-ink-850/60"
                >
                  <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {metric.label}
                  </p>
                  <p className="mt-1.5 text-xl font-semibold tracking-tight tabular-nums text-slate-950 dark:text-white">
                    {metric.value}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-3 w-3" aria-hidden />
                    {metric.delta}
                  </p>
                </div>
              ))}
            </div>

            {/* Table + activity */}
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/[0.06]">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:border-white/[0.06] dark:bg-ink-850/60 dark:text-slate-400">
                      <th className="px-3.5 py-2.5">Problem</th>
                      <th className="hidden px-3.5 py-2.5 sm:table-cell">Difficulty</th>
                      <th className="px-3.5 py-2.5 text-right">Acceptance</th>
                      <th className="hidden px-3.5 py-2.5 text-right md:table-cell">Submissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((problem) => (
                      <tr key={problem.title} className="border-b border-slate-100 last:border-0 dark:border-white/[0.04]">
                        <td className="px-3.5 py-2.5 font-medium text-slate-700 dark:text-slate-300">
                          {problem.title}
                        </td>
                        <td className="hidden px-3.5 py-2.5 sm:table-cell">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium',
                              problem.tone
                            )}
                          >
                            {problem.difficulty}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right tabular-nums text-slate-500 dark:text-slate-400">
                          {problem.acceptance}
                        </td>
                        <td className="hidden px-3.5 py-2.5 text-right tabular-nums text-slate-500 dark:text-slate-400 md:table-cell">
                          {problem.submissions}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Activity chart */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 dark:border-white/[0.06] dark:bg-ink-850/60">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Weekly activity</p>
                <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">2,148 submissions</p>
                <div className="mt-4 flex h-24 items-end gap-1.5" role="img" aria-label="Bar chart of weekly submissions">
                  {activity.map((height, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center gap-1.5">
                      <div
                        className={cn(
                          'w-full rounded-t-sm',
                          index === activity.length - 1
                            ? 'bg-brand-400'
                            : 'bg-brand-500/40'
                        )}
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[10px] text-slate-400 dark:text-slate-600">{days[index]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
