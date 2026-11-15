'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  Play,
  Sparkles,
  ArrowRight,
  SearchX,
} from 'lucide-react';
import { publicApi, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { BookmarkButton } from '@/components/problems/BookmarkButton';
import { SignInPromptModal } from '@/components/auth/SignInPromptModal';
import { cn } from '@/lib/utils';

export default function PublicProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';
  const user = useAuthStore((state) => state.user);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'javascript' | 'cpp' | 'java'>('python');

  const { data: problemData, isLoading, isError, error } = useQuery({
    queryKey: ['public-problem', id],
    queryFn: async () => {
      const res = await publicApi.getProblem(id);
      return res.data?.data;
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSolveClick = () => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }

    if (user.role === 'general_student') {
      router.push(`/dashboard/problems/${id}/solve`);
    } else if (user.role === 'super_admin') {
      router.push(`/super-admin/problems/${id}/solve`);
    } else {
      router.push(`/institution/problems/${id}/solve`);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-[#080d18] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="h-6 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0e1728]" />
          <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0e1728]" />
        </div>
      </main>
    );
  }

  if (isError || !problemData) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-900 dark:bg-[#080d18] dark:text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-[#0e1728]">
            <SearchX className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            Problem Not Found
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {error ? getErrorMessage(error) : 'The requested problem is not available or has been removed.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition hover:bg-brand-500"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Browse All Problems</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const problem = problemData;
  const difficulty = (problem.difficulty || 'easy').toLowerCase();
  const difficultyBadgeStyle =
    difficulty === 'easy'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
      : difficulty === 'medium'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
      : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400';

  const starterTemplates: Record<string, string> = {
    python: `# ${problem.title}\n# Solution template\n\ndef solution():\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    solution()\n`,
    javascript: `// ${problem.title}\n// Solution template\n\nfunction solution() {\n  // Write your solution here\n}\n\nsolution();\n`,
    cpp: `// ${problem.title}\n#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
    java: `// ${problem.title}\nimport java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n`,
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#080d18] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/problems"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Problem Catalog
          </Link>

          <div className="flex items-center gap-2">
            <BookmarkButton problemId={problem.id} bookmarked={problem.bookmarked} />
          </div>
        </div>

        {/* Problem Header Card */}
        <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0e1728] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={cn(
                    'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider',
                    difficultyBadgeStyle
                  )}
                >
                  {difficulty}
                </span>

                {(problem.tags ?? []).map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {problem.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {problem.acceptanceRate ?? 65}% Acceptance
                </span>
                <span>•</span>
                <span>{(problem.totalSubmissions ?? 120).toLocaleString()} Submissions</span>
                <span>•</span>
                <span>Execution limit: {problem.timeLimitMs || 2000} ms</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={handleSolveClick}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>{user ? 'Solve Challenge' : 'Sign In to Solve'}</span>
              </button>

              <Link
                href={`/platform/ide?problemId=${problem.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <Terminal className="h-4 w-4 text-brand-500" />
                <span>Open in Playground IDE</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Problem Body */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Description */}
          <div className="space-y-6 lg:col-span-2">
            {/* Statement */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0e1728] sm:p-7">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Problem Description
              </h2>
              <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {problem.statement}
              </div>

              {/* Input Format */}
              {problem.inputFormat && (
                <div className="mt-6 border-t border-slate-100 pt-5 dark:border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Input Format
                  </h3>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    {problem.inputFormat}
                  </p>
                </div>
              )}

              {/* Output Format */}
              {problem.outputFormat && (
                <div className="mt-5 border-t border-slate-100 pt-5 dark:border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Output Format
                  </h3>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    {problem.outputFormat}
                  </p>
                </div>
              )}

              {/* Constraints */}
              {problem.constraintsText && (
                <div className="mt-5 border-t border-slate-100 pt-5 dark:border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Constraints
                  </h3>
                  <div className="mt-2 rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-800 dark:bg-slate-900/80 dark:text-slate-200">
                    {problem.constraintsText}
                  </div>
                </div>
              )}
            </section>

            {/* Test Cases */}
            {problem.testCases && problem.testCases.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0e1728] sm:p-7">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Sample Test Cases
                </h2>

                <div className="mt-4 space-y-4">
                  {problem.testCases.map((tc: any, index: number) => (
                    <div
                      key={tc.id || index}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/70 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                        <span>Sample {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(tc.input, index)}
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500" />
                              <span className="text-[11px] text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span className="text-[11px]">Copy Input</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="grid divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0 dark:divide-slate-800">
                        <div className="p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Input
                          </p>
                          <pre className="mt-1 font-mono text-xs text-slate-800 dark:text-slate-200">
                            {tc.input}
                          </pre>
                        </div>
                        <div className="p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Expected Output
                          </p>
                          <pre className="mt-1 font-mono text-xs text-slate-800 dark:text-slate-200">
                            {tc.output}
                          </pre>
                        </div>
                      </div>

                      {tc.explanation && (
                        <div className="border-t border-slate-200 bg-white/50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-transparent dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Explanation:{' '}
                          </span>
                          {tc.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Starter Code Preview */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0e1728] sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Starter Code Template
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Preview the boilerplate code in your preferred language.
                  </p>
                </div>

                <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/5">
                  {(['python', 'javascript', 'cpp', 'java'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setSelectedLanguage(lang)}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition',
                        selectedLanguage === lang
                          ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      )}
                    >
                      {lang === 'cpp' ? 'C++' : lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-[#0d1117] p-4 font-mono text-xs text-emerald-400 dark:border-slate-800">
                <pre>{starterTemplates[selectedLanguage]}</pre>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0e1728]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ready to solve?
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Submit your code against our automated judge, check edge cases, and climb the platform rankings.
              </p>

              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={handleSolveClick}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition hover:bg-brand-500"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>{user ? 'Open in Coding Arena' : 'Sign in to Submit Solution'}</span>
                </button>

                <Link
                  href={`/platform/ide?problemId=${problem.id}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  <Terminal className="h-4 w-4 text-brand-500" />
                  <span>Open in Playground IDE</span>
                </Link>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Supported Compilers
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['Python 3', 'C++ 20', 'Java 21', 'TypeScript', 'Go', 'Rust'].map((l) => (
                    <span
                      key={l}
                      className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-white/5 dark:text-slate-400"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Need Help Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0e1728]">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Sparkles className="h-4 w-4 text-brand-500" />
                <span>Need hints or explanation?</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Explore our curated tutorials and algorithm courses to master the fundamental techniques used in this problem.
              </p>
              <div className="mt-4">
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400"
                >
                  <span>Browse algorithmic courses</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal for Guests */}
      <SignInPromptModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        title="Sign in to Submit Solution"
        actionName="submit code solutions and track submission history"
        nextUrl={`/problems/${id}`}
      />
    </main>
  );
}
