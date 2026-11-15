import { Metadata } from 'next';
import OnlineIde from '@/components/ide/OnlineIde';
import Link from 'next/link';
import { Sparkles, Terminal } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Online Playground IDE — CodeVerse',
  description:
    'Free online coding playground and compiler. Write, execute, and debug code instantly in 16+ programming languages with zero setup.',
};

export default function PublicPlaygroundIdePage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-slate-900 text-white">
      {/* Top Banner for Guests */}
      <div className="border-b border-white/10 bg-slate-950/80 px-4 py-2 text-xs text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-brand-500/20 px-2 py-0.5 font-medium text-brand-300">
              <Terminal className="h-3 w-3" /> Playground Mode
            </span>
            <span className="text-slate-400">
              Code execution is active. No sign-in required to write, run, and test code.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-1 font-semibold text-brand-400 hover:text-brand-300"
            >
              <Sparkles className="h-3 w-3" />
              <span>Sign up to save code snippets & track progress</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main IDE Container */}
      <main className="flex-1 p-2 sm:p-4">
        <div className="h-[calc(100vh-8rem)] w-full rounded-xl border border-white/10 bg-[#0e1728] shadow-2xl overflow-hidden">
          <OnlineIde />
        </div>
      </main>
    </div>
  );
}
