'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Lock, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SignInPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actionName?: string;
  nextUrl?: string;
}

export function SignInPromptModal({
  isOpen,
  onClose,
  title = 'Sign in to Continue',
  description,
  actionName = 'access this feature',
  nextUrl,
}: SignInPromptModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const targetUrl =
    nextUrl || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl transition-all duration-200',
          'dark:border-white/10 dark:bg-[#0c1322] dark:shadow-black/60',
          'animate-in zoom-in-95 duration-200'
        )}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 text-white shadow-md shadow-brand-500/25">
          <Lock className="h-6 w-6" />
        </div>

        {/* Content */}
        <div className="mt-4">
          <h2
            id="signin-modal-title"
            className="text-lg font-bold text-slate-900 dark:text-white"
          >
            {title}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {description || (
              <>
                You need a CodeVerse account to {actionName}. Sign in with your
                credentials or create a free student account in seconds.
              </>
            )}
          </p>

          {/* Perks list */}
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-white/5 dark:bg-white/[0.02]">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Account Perks
            </p>
            <ul className="mt-2.5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>Submit code & execute against full automated test suites</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>Save problem bookmarks & track chapter progress</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>Earn verified course completion badges & analytics</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href={`/login?next=${encodeURIComponent(targetUrl)}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <span>Sign In to Continue</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/register?next=${encodeURIComponent(targetUrl)}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <Sparkles className="h-4 w-4 text-brand-500" />
            <span>Create Free Account</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="mt-1 text-center text-xs font-medium text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
          >
            Continue browsing as guest
          </button>
        </div>
      </div>
    </div>
  );
}
