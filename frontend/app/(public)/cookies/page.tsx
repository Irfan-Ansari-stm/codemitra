import React from 'react';
import Link from 'next/link';
import { Cookie, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Cookie Policy — CodeVerse',
  description:
    'Learn how CodeVerse uses essential cookies, authentication session tokens, and local preferences to provide a seamless coding experience.',
};

export default function CookiePolicyPage() {
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
            <Cookie className="h-3.5 w-3.5" />
            <span>Browser Storage Notice</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 dark:text-white">
            CodeVerse Cookie Policy
          </h1>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Last Updated: November 15, 2026
          </p>
        </header>

        <div className="prose prose-slate mt-8 max-w-none dark:prose-invert text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              1. What Are Cookies & Local Storage?
            </h2>
            <p>
              Cookies are small text files placed on your computer or mobile device when you browse websites.
              We also utilize modern browser storage mechanisms such as <code className="text-brand-600 dark:text-brand-400">localStorage</code>{' '}
              and <code className="text-brand-600 dark:text-brand-400">sessionStorage</code> to preserve IDE editor settings and theme choices.
            </p>
          </section>

          <section className="mt-8 space-y-4 border-t border-slate-200 pt-6 dark:border-white/10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2. How We Use Cookies & Storage
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Strictly Necessary Cookies:</strong> Used for HTTP-only refresh tokens, CSRF protection,
                and session authentication for registered accounts.
              </li>
              <li>
                <strong>IDE & Editor Preferences:</strong> Storing your preferred theme (Dark/Light), code font size,
                tab spaces, and selected compiler language in <code className="text-brand-600 dark:text-brand-400">localStorage</code>.
              </li>
              <li>
                <strong>Guest Mode State:</strong> Temporarily keeping your playground code snippet in browser memory
                so your work is not lost if the page is accidentally refreshed.
              </li>
              <li>
                <strong>Analytics & Telemetry:</strong> Anonymized metrics on page load times and compiler latency
                to help optimize global infrastructure.
              </li>
            </ul>
          </section>

          <section className="mt-8 space-y-4 border-t border-slate-200 pt-6 dark:border-white/10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              3. Managing Cookie Preferences
            </h2>
            <p>
              You can instruct your browser to refuse all cookies or notify you when a cookie is sent.
              However, disabling strictly necessary cookies will prevent you from signing into authenticated
              student or faculty accounts. Guest browsing and public IDE playgrounds remain accessible without
              login cookies.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
