import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — CodeVerse',
  description:
    'Read how CodeVerse collects, processes, and protects personal and institutional data across our online coding platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#080d18] dark:text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>

        <header className="mt-8 border-b border-slate-200 pb-8 dark:border-white/10">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 dark:text-white">
            CodeVerse Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Last Updated: November 15, 2026 • Effective Date: January 1, 2026
          </p>
        </header>

        <div className="prose prose-slate mt-8 max-w-none dark:prose-invert text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              1. Overview & Commitment
            </h2>
            <p>
              At CodeVerse, we respect and safeguard the privacy of our students, educators, and partner
              institutions. This Privacy Policy describes how we collect, store, process, and protect your
              information when you visit our website, submit code through our compilers, or use our
              multi-tenant institutional learning portals.
            </p>
          </section>

          <section className="mt-8 space-y-4 border-t border-slate-200 pt-6 dark:border-white/10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account Credentials:</strong> Name, university/student email, hashed passwords,
                and role associations (general student, institute student, instructor, administrator).
              </li>
              <li>
                <strong>Code Submissions & Execution Data:</strong> Source code submitted to the online IDE,
                execution telemetry (CPU time, memory consumed, exit codes, and test case pass/fail verdicts).
              </li>
              <li>
                <strong>Learning Analytics:</strong> Course progress, chapter completions, problem solve
                attempts, assessment grades, and milestone badges.
              </li>
              <li>
                <strong>Technical Logs:</strong> IP address, browser user-agent, session identifiers, and
                error stack traces for diagnostics and security enforcement.
              </li>
            </ul>
          </section>

          <section className="mt-8 space-y-4 border-t border-slate-200 pt-6 dark:border-white/10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              3. How We Use Your Data
            </h2>
            <p>
              We use collected information strictly to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Deliver automated test-case evaluation and compiler feedback in real time.</li>
              <li>Maintain tenant isolation and ensure academic integrity across batches and cohorts.</li>
              <li>Provide aggregated performance analytics to authorized instructors and institutions.</li>
              <li>Prevent denial-of-service attacks, compiler abuse, and unauthorized system access.</li>
            </ul>
          </section>

          <section className="mt-8 space-y-4 border-t border-slate-200 pt-6 dark:border-white/10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              4. Data Retention & Tenant Isolation
            </h2>
            <p>
              All institutional student data is guarded by PostgreSQL row-level security policies. Your code
              and academic submissions are retained during your active enrollment and can be exported or purged
              upon written request by your institution’s primary administrator.
            </p>
          </section>

          <section className="mt-8 space-y-4 border-t border-slate-200 pt-6 dark:border-white/10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              5. Contact Us Regarding Privacy
            </h2>
            <p>
              If you have any questions or data privacy requests, contact our Data Protection Officer at{' '}
              <a href="mailto:privacy@codeverse.dev" className="text-brand-600 dark:text-brand-400 font-semibold underline">
                privacy@codeverse.dev
              </a>{' '}
              or visit our <Link href="/contact" className="text-brand-600 dark:text-brand-400 font-semibold underline">Contact page</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
