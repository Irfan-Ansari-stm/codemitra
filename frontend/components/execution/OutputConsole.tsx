'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Cpu,
  Zap,
  Cloud,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import { ExecutionStatus } from '@/services/wasm-executor/types';

export interface TestCaseResultItem {
  caseIndex: number;
  passed: boolean;
  verdict?: string;
  runtimeMs?: number | null;
  memoryKb?: number | null;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  input?: string;
  expectedOutput?: string;
  engineUsed?: string;
}

interface OutputConsoleProps {
  status: ExecutionStatus;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  executionTime?: number;
  memoryUsage?: number | null;
  engineUsed?: 'wasm' | 'judge0';
  fallbackOccurred?: boolean;
  notes?: string;
  testCaseResults?: TestCaseResultItem[];
}

export default function OutputConsole({
  status,
  stdout,
  stderr,
  compileOutput,
  executionTime,
  memoryUsage,
  engineUsed,
  fallbackOccurred,
  notes,
  testCaseResults,
}: OutputConsoleProps) {
  const [copied, setCopied] = useState(false);
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);

  const copyToClipboard = () => {
    const text = [stdout, stderr, compileOutput].filter(Boolean).join('\n');
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'compiling':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
            Compiling
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
            <CheckCircle size={12} className="text-green-600 dark:text-green-400" />
            Completed
          </span>
        );
      case 'timed_out':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            <Clock size={12} className="text-amber-600 dark:text-amber-400" />
            Timed Out
          </span>
        );
      case 'compilation_error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
            <XCircle size={12} className="text-red-600 dark:text-red-400" />
            Compilation Error
          </span>
        );
      case 'runtime_error':
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
            <AlertTriangle size={12} className="text-red-600 dark:text-red-400" />
            Runtime Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
            Idle
          </span>
        );
    }
  };

  const getEngineBadge = () => {
    if (!engineUsed) return null;
    if (engineUsed === 'wasm') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700">
          <Zap size={12} className="text-emerald-500 fill-emerald-500" />
          WASM (Browser Engine)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700">
        <Cloud size={12} className="text-sky-500" />
        Judge0 (Server Cloud)
      </span>
    );
  };

  const hasOutput = Boolean(stdout || stderr || compileOutput || (testCaseResults && testCaseResults.length > 0));
  const activeCase = testCaseResults && testCaseResults[activeCaseIdx];

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-800/60">
        <div className="flex items-center gap-2.5">
          <Terminal size={16} className="text-gray-500 dark:text-gray-400" />
          <span className="font-semibold text-xs tracking-wide uppercase text-gray-700 dark:text-gray-300">
            Execution Console
          </span>
          {getStatusBadge()}
          {getEngineBadge()}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          {typeof executionTime === 'number' && (
            <span className="flex items-center gap-1 font-mono">
              <Clock size={12} />
              {executionTime} ms
            </span>
          )}
          {typeof memoryUsage === 'number' && (
            <span className="flex items-center gap-1 font-mono">
              <Cpu size={12} />
              {memoryUsage} KB
            </span>
          )}
          {hasOutput && (
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1 p-1 hover:text-gray-800 dark:hover:text-gray-200 rounded"
              title="Copy output"
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            </button>
          )}
        </div>
      </div>

      {fallbackOccurred && (
        <div className="px-4 py-2 text-xs bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200">
          ℹ️ {notes || 'Execution gracefully routed to Judge0 server engine.'}
        </div>
      )}

      {/* Test Case Navigation Tabs (if running against test cases) */}
      {testCaseResults && testCaseResults.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3 border-b border-gray-100 dark:border-gray-800 pb-2.5">
          {testCaseResults.map((tc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveCaseIdx(idx)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeCaseIdx === idx
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {tc.passed ? (
                <CheckCircle size={12} className={activeCaseIdx === idx ? 'text-white' : 'text-green-500'} />
              ) : (
                <XCircle size={12} className={activeCaseIdx === idx ? 'text-white' : 'text-red-500'} />
              )}
              Case {idx + 1}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="p-4 space-y-3 font-mono text-xs">
        {/* Active Test Case Detail View */}
        {activeCase && (
          <div className="space-y-2.5">
            {activeCase.input && (
              <div>
                <span className="font-sans font-semibold text-gray-500 uppercase text-[10px] tracking-wider">
                  Input:
                </span>
                <pre className="p-2.5 rounded-lg bg-slate-900/90 text-slate-100 border border-slate-800 whitespace-pre-wrap break-words mt-1">
                  {activeCase.input}
                </pre>
              </div>
            )}

            {activeCase.expectedOutput && (
              <div>
                <span className="font-sans font-semibold text-gray-500 uppercase text-[10px] tracking-wider">
                  Expected Output:
                </span>
                <pre className="p-2.5 rounded-lg bg-slate-900/90 text-slate-100 border border-slate-800 whitespace-pre-wrap break-words mt-1">
                  {activeCase.expectedOutput}
                </pre>
              </div>
            )}

            {activeCase.stdout && (
              <div>
                <span className="font-sans font-semibold text-gray-500 uppercase text-[10px] tracking-wider">
                  Your Output:
                </span>
                <pre className="p-2.5 rounded-lg bg-slate-950 text-emerald-400 border border-slate-800 whitespace-pre-wrap break-words mt-1">
                  {activeCase.stdout}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Compilation Error Output */}
        {compileOutput && (
          <div className="p-3.5 rounded-lg bg-red-950 text-red-200 border border-red-800">
            <p className="font-sans font-semibold text-red-300 mb-1.5 flex items-center gap-1.5">
              <XCircle size={14} className="text-red-400" />
              Compilation Output:
            </p>
            <pre className="!bg-transparent !p-0 text-red-200 whitespace-pre-wrap break-words leading-relaxed max-h-56 overflow-auto">
              {compileOutput}
            </pre>
          </div>
        )}

        {/* Runtime Error / Standard Error Output */}
        {stderr && (
          <div className="p-3.5 rounded-lg bg-red-950 text-red-100 border border-red-800 shadow-inner">
            <p className="font-sans font-semibold text-red-300 mb-1.5 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-red-400" />
              Runtime Error (stderr):
            </p>
            <pre className="!bg-transparent !p-0 text-red-200 whitespace-pre-wrap break-words leading-relaxed max-h-60 overflow-auto">
              {stderr}
            </pre>
          </div>
        )}

        {/* Standalone stdout output if not in testCase mode */}
        {stdout && !testCaseResults && (
          <div className="p-3.5 rounded-lg bg-slate-950 text-slate-100 border border-slate-800">
            <p className="font-sans font-medium text-slate-400 mb-1">Standard Output (stdout):</p>
            <pre className="!bg-transparent !p-0 text-slate-100 whitespace-pre-wrap break-words leading-relaxed max-h-64 overflow-auto">
              {stdout}
            </pre>
          </div>
        )}

        {!hasOutput && status === 'idle' && (
          <p className="font-sans text-gray-400 dark:text-gray-500 py-4 text-center">
            Click &ldquo;Run Code&rdquo; to execute your solution with the selected engine.
          </p>
        )}

        {!hasOutput && (status === 'compiling' || status === 'running') && (
          <div className="py-6 text-center font-sans text-gray-500 dark:text-gray-400">
            <p className="animate-pulse">Executing code in sandbox...</p>
          </div>
        )}
      </div>
    </div>
  );
}
