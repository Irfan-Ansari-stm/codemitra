import { CheckCircle2, ChevronDown, Clock, Play, Send, Timer } from 'lucide-react';

const testCases = [
  { id: 1, runtime: '12ms', status: 'passed' },
  { id: 2, runtime: '11ms', status: 'passed' },
  { id: 3, runtime: '14ms', status: 'passed' },
  { id: 4, runtime: '13ms', status: 'passed' },
];

const codeLines: Array<Array<{ text: string; className?: string }>> = [
  [{ text: 'def ' }, { text: 'two_sum', className: 'text-cyan-300' }, { text: '(nums, target):' }],
  [{ text: '    seen = {}' }],
  [{ text: '    ' }, { text: 'for' }, { text: ' i, num ' }, { text: 'in' }, { text: ' ' }, { text: 'enumerate', className: 'text-cyan-300' }, { text: '(nums):' }],
  [{ text: '        complement = target - num' }],
  [{ text: '        ' }, { text: 'if' }, { text: ' complement ' }, { text: 'in' }, { text: ' seen:' }],
  [{ text: '            ' }, { text: 'return' }, { text: ' [seen[complement], i]' }],
  [{ text: '        seen[num] = i' }],
  [{ text: '    ' }, { text: 'return' }, { text: ' []' }],
];

export function ProblemShowcase() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Problem statement */}
      <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 sm:p-7 dark:border-white/[0.08] dark:bg-ink-850">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
            Medium
          </span>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">#0042</span>
        </div>
        <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Two Sum</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
          Given an array of integers <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-brand-700 dark:bg-white/[0.06] dark:text-brand-300">nums</code> and an integer{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-brand-700 dark:bg-white/[0.06] dark:text-brand-300">target</code>, return the indices of the two
          numbers that add up to the target. Each input has exactly one solution, and you may not use the
          same element twice.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {['Array', 'Hash Table'].map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.06] dark:bg-ink-900/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Constraints</p>
          <p className="mt-2 font-mono text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            2 ≤ nums.length ≤ 10⁴
            <br />
            -10⁹ ≤ nums[i] ≤ 10⁹
          </p>
        </div>

        <div className="mt-auto flex items-center gap-5 pt-6 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Timer className="h-3.5 w-3.5" aria-hidden />
            2000ms limit
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            256 MB memory
          </span>
        </div>
      </article>

      {/* Editor + verdict */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-ink-900">
        {/* Editor toolbar */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/[0.06] dark:bg-ink-850/60">
          <span className="flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:bg-white/[0.06] dark:text-slate-200">
            <span className="h-2 w-2 rounded-full bg-brand-400" aria-hidden />
            solution.py
          </span>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-slate-200"
            aria-label="Select language, currently Python 3"
          >
            Python 3
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.05] dark:hover:text-white"
            >
              <Play className="h-3.5 w-3.5" aria-hidden />
              Run samples
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Send className="h-3.5 w-3.5" aria-hidden />
              Submit
            </button>
          </div>
        </div>

        {/* Code area — intentionally dark in both themes, like a real editor canvas */}
        <div className="flex-1 overflow-x-auto bg-ink-950/60 p-4 font-mono text-[13px] leading-6">
          <pre className="min-w-max">
            {codeLines.map((line, lineIndex) => (
              <div key={lineIndex} className="flex">
                <span className="w-8 shrink-0 select-none pr-4 text-right text-slate-600" aria-hidden>
                  {lineIndex + 1}
                </span>
                <code>
                  {line.map((segment, segIndex) => (
                    <span
                      key={segIndex}
                      className={segment.className ?? 'text-slate-300'}
                    >
                      {segment.text}
                    </span>
                  ))}
                </code>
              </div>
            ))}
          </pre>
        </div>

        {/* Verdict panel */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-white/[0.06] dark:bg-ink-850/60">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">Accepted</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">All 4 test cases passed</p>
            </div>
            <div className="ml-auto flex items-center gap-4 text-xs tabular-nums text-slate-500 dark:text-slate-400">
              <span>
                Runtime <span className="font-semibold text-slate-800 dark:text-slate-200">68ms</span>
              </span>
              <span>
                Memory <span className="font-semibold text-slate-800 dark:text-slate-200">14.2 MB</span>
              </span>
            </div>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {testCases.map((testCase) => (
              <li
                key={testCase.id}
                className="flex items-center gap-2.5 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] px-3 py-2 text-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 dark:text-emerald-400" aria-hidden />
                <span className="font-medium text-slate-700 dark:text-slate-300">Test case {testCase.id}</span>
                <span className="ml-auto tabular-nums text-slate-500 dark:text-slate-400">{testCase.runtime}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
