import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Code2,
  ShieldCheck,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

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

const capabilities = [
  'JWT authentication',
  'PostgreSQL RLS',
  'Judge0 execution',
  'Role-based access',
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white pb-16 text-slate-950 antialiased dark:bg-ink-950 dark:text-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <header className="relative overflow-hidden pt-14 pb-10 sm:pt-20">
          <div
            aria-hidden
            className="bg-grid-pattern mask-fade-b absolute inset-0"
          />
          <div
            aria-hidden
            className="absolute -top-32 left-1/2 h-80 w-[46rem] -translate-x-1/2 rounded-full bg-brand-500/[0.10] blur-3xl dark:bg-brand-500/[0.07]"
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/[0.08] dark:text-brand-300">
              <Code2 className="h-3.5 w-3.5" aria-hidden />
              About CodeVerse
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl dark:text-white">
              About Us
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              CodeVerse is a multi-tenant coding education platform built for
              universities, bootcamps, and training teams that want rigorous,
              hands-on learning at scale.
            </p>
          </div>
        </header>

        <section aria-label="Our story" className="mx-auto max-w-3xl">
          <div className="space-y-4 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
            <p>
              We believe the best way to learn programming is by writing code
              and getting fast, precise feedback. CodeVerse gives instructors
              the tools to build structured curricula — courses, modules, and
              chapters — and gives learners a problem library with instant,
              test-case-driven evaluation.
            </p>
            <p>
              Every institution runs in its own isolated tenant, so students,
              content, and results never leak across organizations. Role-based
              access keeps admins, instructors, and learners focused on what
              they own, while institution-level analytics turn activity into
              actionable insight.
            </p>
          </div>
        </section>

        <section
          aria-label="Key numbers"
          className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-white/[0.08] dark:bg-ink-900"
            >
              <p className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                {stat.value}
              </p>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
            </div>
          ))}
        </section>

        <section aria-label="What we offer" className="mt-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              What we offer
            </h2>
            <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
              Everything a modern coding program needs, in one platform.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-brand-500/40 dark:border-white/[0.08] dark:bg-ink-900"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/30">
                  <feature.icon className="h-5 w-5 text-brand-400" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-label="Call to action"
          className="mt-16 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-brand-500/[0.06] p-8 text-center dark:border-white/[0.08] dark:from-ink-900 dark:via-ink-900 dark:to-brand-500/[0.08] sm:p-10"
        >
          <Trophy className="mx-auto h-8 w-8 text-brand-500" aria-hidden />
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
            Ready to start learning?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
            Create a free account and dive into the problem library, or
            explore the course catalog to follow a structured path.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Create account
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/problems"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
            >
              Browse problems
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {capabilities.map((capability) => (
              <span
                key={capability}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400"
              >
                {capability}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
