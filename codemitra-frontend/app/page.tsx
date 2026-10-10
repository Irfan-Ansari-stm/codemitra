import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';

const features = [
  {
    icon: Zap,
    title: 'Interactive coding',
    description:
      'Practice on real coding challenges with instant feedback, execution traces, and guided hints.',
  },
  {
    icon: Users,
    title: 'Collaborative learning',
    description:
      'Track cohort progress, share feedback, and build a learning culture across classrooms and teams.',
  },
  {
    icon: BookOpen,
    title: 'Structured learning paths',
    description:
      'Organize courses, assignments, quizzes, and revision tracks in one place for every learner.',
  },
];

const stats = [
  { label: 'Active learners', value: '18k+' },
  { label: 'Problems solved', value: '1.2M+' },
  { label: 'Partner institutions', value: '240+' },
  { label: 'Average completion rate', value: '92%' },
];

const steps = [
  'Create a learning space for your students or institution.',
  'Assign challenges, modules, and milestone-based assessments.',
  'Monitor analytics and improve outcomes with actionable insights.',
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <PublicHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_40%)]" />
          <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 md:pt-24">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-200">
                <Sparkles className="h-4 w-4" />
                Built for modern coding education
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
                Learn coding with{' '}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  real practice
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 md:text-xl">
                CodeVerse helps institutions, educators, and learners run live coding courses,
                track outcomes, and turn practice into measurable progress.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white transition hover:bg-blue-500"
                >
                  Start learning
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/problems"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 px-7 py-3.5 font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
                >
                  Browse problems
                </Link>
              </div>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center shadow-lg shadow-blue-950/20"
                >
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="mt-2 text-sm text-slate-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              Why CodeVerse
            </p>
            <h2 className="mt-4 text-3xl font-bold text-white md:text-4xl">
              Everything your coding program needs
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-3xl border border-white/10 bg-slate-900/80 p-7 shadow-lg shadow-slate-950/30"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>
                <p className="text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-slate-900/70">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Built for outcomes
              </p>
              <h2 className="mt-4 text-3xl font-bold text-white md:text-4xl">
                Turn your curriculum into a clear learning engine
              </h2>
              <div className="mt-8 space-y-5">
                {steps.map((step, index) => (
                  <div key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                      {index + 1}
                    </div>
                    <p className="pt-1 text-slate-200">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-xl shadow-slate-950/40">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Program overview</p>
                  <h3 className="text-xl font-semibold text-white">Learning dashboard</h3>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-1 text-sm font-medium text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  Healthy
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                    <span>Course completion</span>
                    <span className="font-medium text-blue-300">86%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-900 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Trophy className="h-4 w-4 text-amber-300" />
                      Leaderboard
                    </div>
                    <div className="mt-3 text-2xl font-bold text-white">#12</div>
                  </div>
                  <div className="rounded-2xl bg-slate-900 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Zap className="h-4 w-4 text-fuchsia-300" />
                      Streak
                    </div>
                    <div className="mt-3 text-2xl font-bold text-white">18 days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Ready to build your next generation learning culture?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Launch your courses, keep learners engaged, and track outcomes without switching tools.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white transition hover:bg-blue-500"
            >
              Create account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-7 py-3.5 font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-400 md:flex-row">
          <p>&copy; 2024 CodeVerse. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/blog" className="hover:text-white">
              Blog
            </Link>
            <Link href="/problems" className="hover:text-white">
              Problems
            </Link>
            <Link href="/institution/courses" className="hover:text-white">
              Courses
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
