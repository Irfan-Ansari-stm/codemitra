'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import CodeEditor from '@/components/editor/CodeEditor';
import SubmissionResult from '@/components/editor/SubmissionResult';
import { problemApi } from '@/lib/api';
import { useSubmit } from '@/hooks/useSubmission';
import type { Problem, Submission } from '@/types';

export default function SolveProblemPage() {
  const params = useParams<{ id: string }>();
  const problemId = params.id;
  const problemQuery = useQuery({
    queryKey: ['problem', problemId],
    queryFn: () => problemApi.get(problemId).then((response) => response.data.data as Problem),
    enabled: !!problemId,
  });
  const submission = useSubmit(problemId);

  if (problemQuery.isLoading) return <div className="animate-pulse rounded-xl border p-8 text-slate-500">Loading problem…</div>;
  if (problemQuery.error || !problemQuery.data) return (
    <section className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800" role="alert">
      <h1 className="text-xl font-semibold">Problem unavailable</h1>
      <p className="mt-2">The problem could not be loaded. Check your connection and try again.</p>
      <button className="mt-4 rounded-lg border px-4 py-2" onClick={() => problemQuery.refetch()}>Retry</button>
    </section>
  );

  const problem = problemQuery.data;
  return (
    <div className="space-y-5">
      <Link href="/problems" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary"><ArrowLeft size={16} /> Back to problems</Link>
      <header>
        <p className="text-sm capitalize text-slate-500">{problem.difficulty} · {problem.timeLimitMs} ms · {problem.memoryLimitMb} MB</p>
        <h1 className="mt-1 text-3xl font-bold">{problem.title}</h1>
      </header>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <article className="prose dark:prose-invert max-w-none rounded-xl border bg-white p-5 dark:bg-gray-900">
          <h2>Problem</h2><p>{problem.statement || 'No problem statement is available.'}</p>
          {problem.inputFormat && <><h3>Input</h3><p>{problem.inputFormat}</p></>}
          {problem.outputFormat && <><h3>Output</h3><p>{problem.outputFormat}</p></>}
          {problem.constraintsText && <><h3>Constraints</h3><pre>{problem.constraintsText}</pre></>}
          {problem.sampleExplanation && <><h3>Explanation</h3><p>{problem.sampleExplanation}</p></>}
          {!!problem.tags?.length && <div className="mt-5 flex flex-wrap gap-2">{problem.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs dark:bg-slate-800">{tag}</span>)}</div>}
        </article>
        <div className="space-y-4">
          <div className="h-[min(70vh,680px)] min-h-[420px]">
            <CodeEditor problemId={problem.id} onRun={(sourceCode, languageId) => submission.run({ sourceCode, languageId })} onSubmit={(sourceCode, languageId) => submission.submit({ sourceCode, languageId })} isSubmitting={submission.isSubmitting || submission.isRunning || submission.isPolling} />
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="text-sm text-slate-500">Sample runs are for feedback. Submit sends your solution to the full judge.</span>
          </div>
          {submission.submitError && <p role="alert" className="text-sm text-red-600">Submission failed. Please sign in if required and try again.</p>}
          {submission.runError && <p role="alert" className="text-sm text-red-600">Sample run failed. Please try again.</p>}
          {submission.submission && <SubmissionResult submission={submission.submission as Submission} isPolling={submission.isPolling} />}
          {submission.runResults && <pre className="max-h-64 overflow-auto rounded-lg border bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(submission.runResults, null, 2)}</pre>}
        </div>
      </div>
    </div>
  );
}
