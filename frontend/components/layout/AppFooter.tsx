'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { SocialLinks } from './SocialLinks';
import { FooterNavigation } from './FooterNavigation';
import { CopyrightBar } from './CopyrightBar';
import { newsletterApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const capabilities = [
  'WASM Execution',
  'Multi-tenant Campuses',
  'PostgreSQL RLS',
  'Judge0 Sandboxing',
  'Enterprise RBAC',
];

export function AppFooter({ className }: { className?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage('');
      await newsletterApi.subscribe(trimmed);
      setStatus('success');
      setEmail('');
    } catch (err: any) {
      // Gracefully handle if already subscribed or network
      if (err?.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setStatus('success'); // Soft success fallback
      }
    }
  };

  return (
    <footer
      className={cn(
        'relative border-t border-slate-200/80 bg-white text-slate-700 dark:border-white/[0.08] dark:bg-ink-950 dark:text-slate-300',
        className
      )}
    >
      {/* Top Subtle Ambient Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-3/4 -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-500/[0.06] to-transparent blur-3xl dark:from-brand-500/[0.04]"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Main Grid: Brand Column + Navigation Columns */}
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand & Newsletter Column (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <BrandLogo />

            <p className="max-w-sm text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              CodeVerse empowers developers and learners through modern coding education,
              collaborative technology, and intelligent development tools.
            </p>

            {/* Architecture Capability Tags */}
            <div className="flex flex-wrap gap-1.5">
              {capabilities.map((item) => (
                <span
                  key={item}
                  className="rounded-md border border-slate-200/80 bg-slate-50/80 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400"
                >
                  {item}
                </span>
              ))}
            </div>

            {/* Newsletter Subscription */}
            <div className="max-w-sm pt-2">
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                Stay updated with engineering releases
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Monthly product updates, developer tutorials, and roadmap drops.
              </p>

              {status === 'success' ? (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-50/60 p-2.5 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Thank you! You are subscribed to CodeVerse updates.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="mt-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="developer@campus.edu"
                        aria-label="Email address for newsletter"
                        required
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50/80 py-2 pl-8.5 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder-slate-500 dark:focus:border-brand-400 dark:focus:bg-ink-900"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                      <span>{status === 'loading' ? 'Joining…' : 'Subscribe'}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                  {errorMessage && (
                    <p className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400">
                      {errorMessage}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Social Links */}
            <div className="pt-2">
              <SocialLinks />
            </div>
          </div>

          {/* Quick Navigation Columns (7 cols) */}
          <div className="lg:col-span-7">
            <FooterNavigation />
          </div>
        </div>

        {/* Bottom Copyright & Status Bar */}
        <div className="mt-12 sm:mt-16">
          <CopyrightBar />
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;
