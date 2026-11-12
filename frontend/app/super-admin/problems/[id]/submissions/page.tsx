'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronRight,
  X,
} from 'lucide-react';
import { problemApi, submissionApi } from '@/lib/api';

interface SubmissionItem {
  id: string;
  verdict: string;
  score: string | number;
  runtime_ms?: number;
  runtimeMs?: number;
  memory_kb?: number;
  memoryKb?: number;
  language_id?: number;
  languageId?: number;
  execution_engine?: string;
  executionEngine?: string;
  passed_test_cases?: number;
  passedTestCases?: number;
  total_test_cases?: number;
  totalTestCases?: number;
  student_name?: string;
  studentName?: string;
  student_email?: string;
  studentEmail?: string;
  created_at?: string;
  createdAt?: string;
}

const LANGUAGE_NAMES: Record<number, string> = {
  71: 'Python 3',
  63: 'JavaScript',
  74: 'TypeScript',
  64: 'Lua',
  50: 'C (GCC)',
  54: 'C++ (G++)',
  62: 'Java',
  73: 'Rust',
  60: 'Go',
  72: 'Ruby',
  68: 'PHP',
  51: 'C#',
};

export default function ProblemSubmissionsPage() {
  const params = useParams<{ id: string }>();
  const problemId = params.id;

  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [filterVerdict, setFilterVerdict] = useState<string>('all');

  const problemQuery = useQuery({
    queryKey: ['problem-detail', problemId],
    queryFn: () => problemApi.get(problemId).then((res) => res.data.data),
    enabled: !!problemId,
  });

  const submissionsQuery = useQuery({
    queryKey: ['problem-submissions', problemId],
    queryFn: () => submissionApi.problemSubmissions(problemId).then((res) => res.data.data as SubmissionItem[]),
    enabled: !!problemId,
  });

  const detailQuery = useQuery({
    queryKey: ['submission-single-detail', selectedSub?.id],
    queryFn: () => submissionApi.get(selectedSub.id).then((res) => res.data.data),
    enabled: !!selectedSub?.id,
  });

  const submissions = submissionsQuery.data || [];
  const filtered = submissions.filter((s) => {
    if (filterVerdict !== 'all' && s.verdict !== filterVerdict) return false;
    return true;
  });

  const acceptedCount = submissions.filter((s) => s.verdict === 'accepted').length;
  const acceptanceRate = submissions.length > 0 ? Math.round((acceptedCount / submissions.length) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/problems"
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Submissions: {problemQuery.data?.title || 'Loading...'}
            </h1>
            <p className="text-sm text-gray-500">
              Audit student submissions, grading verdicts, runtimes, and engine usage.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500">Total Submissions</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{submissions.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-950 bg-emerald-50/50 dark:bg-emerald-950/20">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Accepted</p>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">{acceptedCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-950 bg-blue-50/50 dark:bg-blue-950/20">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Acceptance Rate</p>
          <p className="text-2xl font-bold text-blue-800 dark:text-blue-300 mt-1">{acceptanceRate}%</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500">Filter Verdict</p>
          <select
            value={filterVerdict}
            onChange={(e) => setFilterVerdict(e.target.value)}
            className="mt-1 w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
          >
            <option value="all">All Verdicts</option>
            <option value="accepted">Accepted</option>
            <option value="wrong_answer">Wrong Answer</option>
            <option value="time_limit_exceeded">Time Limit Exceeded</option>
            <option value="runtime_error">Runtime Error</option>
            <option value="compile_error">Compilation Error</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Verdict</th>
                <th className="px-5 py-3">Score</th>
                <th className="px-5 py-3">Language</th>
                <th className="px-5 py-3">Engine</th>
                <th className="px-5 py-3">Runtime</th>
                <th className="px-5 py-3">Submitted At</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((sub) => {
                const isAccepted = sub.verdict === 'accepted';
                const langName =
                  LANGUAGE_NAMES[sub.language_id || sub.languageId || 0] || `Lang #${sub.language_id}`;

                return (
                  <tr
                    key={sub.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedSub(sub)}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {sub.student_name || sub.studentName || 'Student'}
                      </p>
                      <p className="text-xs text-gray-500">{sub.student_email || sub.studentEmail}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isAccepted
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                        }`}
                      >
                        {isAccepted ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {sub.verdict.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-bold">
                      {sub.score}%
                      <span className="text-[11px] font-normal text-gray-500 block">
                        {sub.passed_test_cases ?? sub.passedTestCases ?? 0} /{' '}
                        {sub.total_test_cases ?? sub.totalTestCases ?? 0} cases
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs font-mono">{langName}</td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium uppercase ${
                          (sub.execution_engine || sub.executionEngine) === 'wasm'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                        }`}
                      >
                        {sub.execution_engine || sub.executionEngine || 'judge0'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">
                      {(sub.runtime_ms ?? sub.runtimeMs ?? 0)} ms
                    </td>

                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {sub.created_at ? new Date(sub.created_at).toLocaleString() : '—'}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSub(sub);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                      >
                        Details <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    No submissions found for this problem.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submission Detail Modal/Drawer */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-gray-200 dark:border-gray-800 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Submission Details (#{selectedSub.id.slice(0, 8)})
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedSub.student_name} ({selectedSub.student_email})
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            {detailQuery.isLoading ? (
              <p className="py-8 text-center text-gray-500 animate-pulse">Loading submission details...</p>
            ) : detailQuery.data ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-4 gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div>
                    <span className="text-gray-500 block">Verdict</span>
                    <span className="font-bold text-sm capitalize">{detailQuery.data.verdict}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Score</span>
                    <span className="font-bold text-sm">{detailQuery.data.score}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Runtime</span>
                    <span className="font-bold text-sm">{detailQuery.data.runtime_ms || 0} ms</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Engine</span>
                    <span className="font-bold text-sm uppercase">{detailQuery.data.execution_engine || 'judge0'}</span>
                  </div>
                </div>

                <div>
                  <p className="font-bold uppercase tracking-wider text-gray-500 mb-1">Source Code:</p>
                  <pre className="p-3.5 rounded-xl bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto max-h-60 whitespace-pre-wrap">
                    {detailQuery.data.source_code || detailQuery.data.sourceCode || '(empty source)'}
                  </pre>
                </div>

                {detailQuery.data.stderr_output && (
                  <div>
                    <p className="font-bold uppercase tracking-wider text-red-600 mb-1">Standard Error:</p>
                    <pre className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                      {detailQuery.data.stderr_output}
                    </pre>
                  </div>
                )}

                {detailQuery.data.compile_output && (
                  <div>
                    <p className="font-bold uppercase tracking-wider text-amber-600 mb-1">Compiler Output:</p>
                    <pre className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                      {detailQuery.data.compile_output}
                    </pre>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
