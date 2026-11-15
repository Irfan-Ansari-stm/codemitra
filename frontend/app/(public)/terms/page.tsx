import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms & Conditions — CodeVerse',
  description:
    'Review the terms of service, acceptable code execution policy, and platform usage conditions for CodeVerse.',
};

export default function TermsAndConditionsPage() {
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
            <FileText className="h-3.5 w-3.5" />
            <span>Platform Agreement</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 dark:text-white">
            CodeVerse Terms of Service
          </h1>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Last Updated: November 15, 2026 • Applies to all users and visitors
          </p>
        </header>

        <div className="prose prose-slate mt-8 max-w-none dark:prose-invert text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing the CodeVerse website, browsing public coding challenges, or executing code
              through our online IDE (either as an unauthenticated guest or registered student), you agree
              to be bound by these Terms of Service.
            </p>
          </section>

          <section className="mt-8 space-y-4 border-t border-slate-200 pt-6 dark:border-white/10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2. Acceptable Use of Online Compiler & IDE
            </h2>
            <p>
              The CodeVerse compiler infrastructure is provided strictly for educational and testing purposes.
              You expressly agree NOT to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Submit malicious code designed to probe, bypass, or escape container sandboxes.</li>
              <li>Spawn unauthorized background daemons, crypto-miners, or port scanners.</li>
              <li>Attempt denial-of-service (DoS) attacks or deliberately exhaust CPU/memory ceilings.</li>
              <li>Plagiarize or distribute copyrighted university examination questions.</li>
            </ul>
          </section>

          <section className="mt-8 space-y-4 border-t border-slate-200 pt-6 dark:border-white/10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              3. User Accounts & Academic Integrity
            </h2>
            <p>
              Registered students are responsible for maintaining the confidentiality of their credentials.
              Institutions have the authority to review submitted code for plagiarism, automated code generation
              compliance, and academic honesty policies.
            </p>
          </section>

          <section className="mt-8 space-y-4 border-t border-slate-200 pt-6 dark:border-white/10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              4. Disclaimer of Warranties & Limitation of Liability
            </h2>
            <p>
              CodeVerse is provided &quot;as is&quot; without warranties of any kind. While we strive for 99.98%
              uptime, CodeVerse shall not be held liable for temporary interruptions, network delays during
              contests, or third-party service degradation.
            </p>
          </section>

          <section className="mt-8 space-y-4 border-t border-slate-200 pt-6 dark:border-white/10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              5. Termination & Modifications
            </h2>
            <p>
              We reserve the right to suspend accounts or IP ranges violating sandbox constraints. These terms
              may be updated periodically to reflect changes in applicable regulations or platform capabilities.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
