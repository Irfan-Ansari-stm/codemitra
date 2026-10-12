import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Code2,
  Medal,
  ShieldCheck,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Reveal } from '@/components/common/Reveal';
import { DashboardPreview } from '@/components/homepage/DashboardPreview';
import { ProblemShowcase } from '@/components/homepage/ProblemShowcase';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Zap,
    title: 'Instant code execution',
    description:
      'Students submit code and receive test-case-driven feedback in seconds through secure, sandboxed Judge0 execution.',
  },
  {
    icon: BookOpen,
    title: 'Structured curricula',
    description:
      'Organize courses into modules and chapters with assignments, quizzes, and milestone tracking for every cohort.',
  },
  {
    icon: Users,
    title: 'Multi-tenant workspaces',
    description:
      'Isolate every institution with PostgreSQL row-level security and role-based access for admins, instructors, and learners.',
  },
  {
    icon: BarChart3,
    title: 'Outcome analytics',
    description:
      'Monitor completion rates, engagement, and leaderboard performance from institution-level dashboards.',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise-grade security',
    description:
      'JWT authentication, refresh token rotation, rate limiting, and Zod-validated requests on every API surface.',
  },
  {
    icon: Code2,
    title: 'Rich problem authoring',
    description:
      'Author problems with multiple languages, hidden test cases, time and memory limits, and difficulty metadata.',
  },
];

const stats = [
  { label: 'Active learners', value: '18k+' },
  { label: 'Problems solved', value: '1.2M+' },
  { label: 'Partner institutions', value: '240+' },
  { label: 'Average completion rate', value: '92%' },
];

const steps = [
  'Create a learning space for your students or institution, with courses, modules, and chapters.',
  'Assign challenges, quizzes, and milestone-based assessments to every cohort.',
  'Monitor analytics and improve outcomes with actionable, institution-level insights.',
];

const capabilities = [
  'JWT authentication',
  'PostgreSQL RLS',
  'Judge0 execution',
  'Role-based access',
];

const leaders = [
  { name: 'A. Rahman', solved: 214, initials: 'AR' },
  { name: 'S. Iqbal', solved: 198, initials: 'SI' },
  { name: 'M. Hossain', solved: 187, initials: 'MH' },
];

const engagementBars = [38, 56, 44, 72, 60, 84, 66];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-950 antialiased dark:bg-ink-950 dark:text-slate-50">
      <PublicHeader />

      <main>
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="bg-grid-pattern mask-fade-b absolute inset-0"
          />
          <div
            aria-hidden
            className="absolute -top-48 left-1/2 h-96 w-[52rem] -translate-x-1/2 rounded-full bg-brand-500/[0.12] blur-3xl dark:bg-brand-500/[0.09]"
          />

          <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 md:pt-28">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/[0.06] px-3 py-1.5 text-xs font-medium text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/[0.08] dark:text-brand-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden />
                  Multi-tenant coding education platform
                </div>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08] dark:text-white">
                  Run your entire coding program in one platform.
                </h1>
              </Reveal>

              <Reveal delay={160}>
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                  CodeVerse gives universities, bootcamps, and training teams everything
                  to teach coding end-to-end — curated problem libraries, assignments,
                  quizzes, live code execution, and outcome analytics.
                </p>
              </Reveal>

              <Reveal delay={240}>
                <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/register"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-glow transition-all duration-200 hover:bg-brand-700 active:scale-[0.98] sm:w-auto"
                  >
                    Start teaching free
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <Link
                    href="/problems"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:border-white/20 dark:hover:bg-white/[0.08] sm:w-auto"
                  >
                    Explore the problem library
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={320}>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                  {capabilities.map((capability) => (
                    <span
                      key={capability}
                      className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" aria-hidden />
                      {capability}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>

            <Reveal delay={400} className="mt-16">
              <DashboardPreview />
            </Reveal>
          </div>
        </section>

        {/* ---------- Stats ---------- */}
        <section aria-label="Platform metrics" className="border-y border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-ink-900/50">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Reveal
                key={stat.label}
                delay={index * 60}
                className="bg-white px-6 py-8 text-center dark:bg-ink-900"
              >
                <div className="text-3xl font-bold tracking-tight tabular-nums text-slate-950 sm:text-4xl dark:text-white">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- Features ---------- */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
                Why CodeVerse
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                Everything your coding program needs
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                A complete learning system — not another isolated tool.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }, index) => (
              <Reveal key={title} delay={index * 60} className="h-full">
                <div className="group h-full rounded-xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/30 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-ink-850 dark:hover:bg-ink-800">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 ring-1 ring-brand-500/20 transition-colors duration-300 group-hover:bg-brand-500/15 dark:text-brand-400">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mb-2.5 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                    {title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                    {description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- Product showcase ---------- */}
        <section className="border-y border-slate-200 bg-slate-50 py-20 dark:border-white/[0.06] dark:bg-ink-900/50 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
                  Product showcase
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                  From problem to verdict in one flow
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                  Students read the problem, write code, and get instant,
                  test-case-driven feedback — without leaving the page.
                </p>
              </div>
            </Reveal>

            <Reveal delay={120} className="mt-14">
              <ProblemShowcase />
            </Reveal>
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
                  How it works
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                  Turn your curriculum into a clear learning engine
                </h2>

                <div className="mt-10 space-y-4">
                  {steps.map((step, index) => (
                    <div
                      key={step}
                      className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-colors duration-300 hover:border-slate-300 dark:border-white/[0.08] dark:bg-ink-850 dark:hover:border-white/[0.14]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 font-mono text-sm font-semibold text-brand-700 ring-1 ring-brand-500/20 dark:text-brand-400">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <p className="pt-1.5 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7 dark:border-white/[0.08] dark:bg-ink-850">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                      Cohort engagement
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">This week across all courses</p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <Trophy className="h-3.5 w-3.5" aria-hidden />
                    Top cohort
                  </span>
                </div>

                <div
                  className="mt-6 flex h-32 items-end gap-2"
                  role="img"
                  aria-label="Bar chart of daily engagement"
                >
                  {engagementBars.map((height, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex-1 rounded-t-md transition-all duration-500',
                        index === engagementBars.length - 1
                          ? 'bg-brand-400'
                          : 'bg-brand-500/35 hover:bg-brand-500/55'
                      )}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                <div className="mt-6 border-t border-slate-200 pt-5 dark:border-white/[0.06]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Top learners
                  </p>
                  <ul className="mt-3 space-y-3">
                    {leaders.map((leader, index) => (
                      <li key={leader.name} className="flex items-center gap-3">
                        <span className="w-4 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                          {index + 1}
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-500/20 dark:text-brand-300">
                          {leader.initials}
                        </span>
                        <span className="flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                          {leader.name}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                          <Medal className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400/80" aria-hidden />
                          {leader.solved} solved
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------- Final CTA ---------- */}
        <section className="relative overflow-hidden border-t border-slate-200 dark:border-white/[0.06]">
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-white via-brand-500/[0.07] to-white dark:from-ink-950 dark:via-brand-500/[0.07] dark:to-ink-950"
          />
          <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 md:py-28">
            <Reveal>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                Ready to build your next generation learning culture?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                Launch your courses, keep learners engaged, and track outcomes
                without switching tools.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-glow transition-all duration-200 hover:bg-brand-700 active:scale-[0.98] sm:w-auto"
                >
                  Create account
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:border-white/20 dark:hover:bg-white/[0.08] sm:w-auto"
                >
                  Sign in
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
