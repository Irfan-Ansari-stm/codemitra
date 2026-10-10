'use client';

import Link from 'next/link';
import { Code2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function PublicHeader() {
  const user = useAuthStore((state) => state.user);
  const dashboardHref = user?.role === 'super_admin' ? '/super-admin/dashboard' : '/institution/dashboard';

  return (
    <header className="border-b border-white/10 bg-slate-950/90 text-slate-100 backdrop-blur">
      <nav aria-label="Main navigation" className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="inline-flex shrink-0 items-center gap-2.5 font-semibold tracking-tight text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-400/20"><Code2 className="h-5 w-5 text-blue-300" /></span>
          CodeVerse
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/problems" className="text-sm text-slate-400 transition hover:text-white">Problems</Link>
          <Link href="/blog" className="hidden text-sm text-slate-400 transition hover:text-white sm:inline">Blog</Link>
          {user ? (
            <Link href={dashboardHref} className="max-w-40 truncate rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500 sm:max-w-56 sm:px-4">
              {user.name ? `Dashboard · ${user.name}` : 'Go to dashboard'}
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-slate-300 transition hover:text-white">Sign in</Link>
              <Link href="/register" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500 sm:px-4">Create account</Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
