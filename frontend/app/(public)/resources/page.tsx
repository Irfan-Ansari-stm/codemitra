import React from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Terminal,
  FileText,
  Activity,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Code2,
  LifeBuoy,
  Compass,
} from 'lucide-react';

export const metadata = {
  title: 'Learning & Developer Resources — CodeVerse',
  description:
    'Explore guides, technical articles, FAQs, problem sets, and documentation for CodeVerse learners, instructors, and universities.',
};

const resourceCards = [
  {
    icon: FileText,
    title: 'Blog & Articles',
    description:
      'In-depth technical guides, platform engineering case studies, algorithmic breakdowns, and updates from the CodeVerse team.',
    href: '/blog',
    tag: 'Knowledge',
    cta: 'Read Articles',
  },
  {
    icon: HelpCircle,
    title: 'Frequently Asked Questions',
    description:
      'Got questions? Find answers on account tiers, code execution limits, institutional licensing, submissions, and grading.',
    href: '/faqs',
    tag: 'Support',
    cta: 'Browse FAQs',
  },
  {
    icon: Terminal,
    title: 'Playground IDE',
    description:
      'Zero-setup cloud & WebAssembly code playground supporting 16+ languages. Test logic, run algorithms, and inspect stdio.',
    href: '/platform/ide',
    tag: 'Tooling',
    cta: 'Launch IDE',
  },
  {
    icon: Code2,
    title: 'Problem Catalog',
    description:
      'Curated library of 35+ original coding challenges across Arrays, Trees, Dynamic Programming, Graphs, and Concurrency.',
    href: '/problems',
    tag: 'Practice',
    cta: 'Solve Problems',
  },
  {
    icon: GraduationCap,
    title: 'Structured Courses',
    description:
      'Full cohort-ready learning paths from introductory C & Python to Advanced Distributed Systems and Systems Programming.',
    href: '/courses',
    tag: 'Curriculum',
    cta: 'Explore Catalog',
  },
  {
    icon: Activity,
    title: 'Live System Status',
    description:
      'Real-time uptime and latency metrics across our compiler cluster, authentication gateway, database, and API endpoints.',
    href: '/status',
    tag: 'Operational',
    cta: 'Check Status',
  },
  {
    icon: LifeBuoy,
    title: 'Campus & Academic Portal',
    description:
      'Information for college deans, department chairs, and computer science faculty looking to adopt CodeVerse on campus.',
    href: '/apply-institution',
    tag: 'Enterprise',
    cta: 'Partner With Us',
  },
  {
    icon: Compass,
    title: 'Help Desk & Contact',
    description:
      'Need assistance with your account, billing, or enterprise deployment? Our dedicated team is ready to help.',
    href: '/contact',
    tag: 'Direct Help',
    cta: 'Contact Support',
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#080d18] dark:text-slate-100">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white py-20 dark:border-white/10 dark:bg-[#0c1322]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Developer & Learner Hub</span>
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-900 dark:text-white">
              Resources, Guides & Documentation
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Everything you need to master competitive programming, build full-stack applications,
              and integrate CodeVerse with your university computer science curriculum.
            </p>
          </div>
        </div>
      </section>

      {/* Grid of Resources */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {resourceCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-lg dark:border-white/10 dark:bg-[#0e1728] dark:hover:bg-[#111d31]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                        {card.tag}
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                    <Link
                      href={card.href}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 transition group-hover:gap-2 dark:text-brand-400"
                    >
                      <span>{card.cta}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Assistance Banner */}
      <section className="border-t border-slate-200 bg-slate-100/70 py-12 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Can’t find what you’re looking for?
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Our documentation and academic support teams are ready to answer your inquiries.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/faqs"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            >
              <HelpCircle className="h-4 w-4 text-brand-500" />
              <span>Read FAQs</span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-brand-500/25 hover:bg-brand-500"
            >
              <span>Get in Touch</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
