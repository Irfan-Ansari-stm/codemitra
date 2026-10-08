'use client';

import { Submission, SubmissionVerdict, VERDICT_CONFIG } from '@/types';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface SubmissionResultProps {
  submission: Submission;
  isPolling?: boolean;
}

export default function SubmissionResult({
  submission,
  isPolling,
}: SubmissionResultProps) {
  const verdictConfig = VERDICT_CONFIG[submission.verdict];
  const VerdictIcon = {
    'Accepted': CheckCircle,
    'Wrong Answer': XCircle,
    'Compilation Error': AlertCircle,
    'Runtime Error': AlertCircle,
    'Time Limit Exceeded': Clock,
    'Pending': Clock,
  }[submission.verdict] || Clock;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Verdict Header */}
      <div
        className={`p-4 border-b border-gray-200 dark:border-gray-800 ${verdictConfig.bg}`}
      >
        <div className="flex items-center gap-3">
          <VerdictIcon size={24} className={verdictConfig.color} />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {submission.verdict}
            </h3>
            {isPolling && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Judging your submission...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Time
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {submission.executionTime ? `${submission.executionTime}ms` : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Memory
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {submission.memoryUsed ? `${submission.memoryUsed}KB` : '—'}
          </p>
        </div>
      </div>

      {/* Test Cases */}
      {submission.testCaseResults && submission.testCaseResults.length > 0 && (
        <div className="p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Test Cases ({submission.testCaseResults.filter(r => r.passed).length}/{submission.testCaseResults.length})
          </h4>
          <div className="space-y-2">
            {submission.testCaseResults.map((result, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  result.passed
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.passed ? (
                    <CheckCircle size={18} className="text-green-600" />
                  ) : (
                    <XCircle size={18} className="text-red-600" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-white">
                    Test Case {idx + 1}
                  </span>
                  {!result.passed && (
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {result.error}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Output */}
      {submission.compilationOutput && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <h4 className="font-medium text-red-900 dark:text-red-200 mb-2">
            Compilation Error
          </h4>
          <pre className="text-xs text-red-800 dark:text-red-300 whitespace-pre-wrap break-words overflow-hidden max-h-40">
            {submission.compilationOutput}
          </pre>
        </div>
      )}

      {submission.runtimeOutput && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
          <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2">
            Output
          </h4>
          <pre className="text-xs text-yellow-800 dark:text-yellow-300 whitespace-pre-wrap break-words overflow-hidden max-h-40">
            {submission.runtimeOutput}
          </pre>
        </div>
      )}
    </div>
  );
}
