'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { problemApi, getErrorMessage } from '@/lib/api';

const CATEGORIES = [
  'Arrays',
  'Strings',
  'Hash Maps',
  'Sorting',
  'Searching',
  'Recursion',
  'Mathematics',
  'Linked Lists',
  'Stacks & Queues',
  'Trees & Binary Search Trees',
  'Graphs',
  'Dynamic Programming',
  'Greedy Algorithms',
  'Bit Manipulation',
];

interface TestCaseInput {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  points: number;
  explanation?: string;
}

export default function CreateProblemPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Arrays');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [scope, setScope] = useState<'public' | 'institution'>('public');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('published');
  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(256);
  const [tags, setTags] = useState('algorithms, coding');
  const [statement, setStatement] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraintsText, setConstraintsText] = useState('');
  const [sampleExplanation, setSampleExplanation] = useState('');
  const [pythonStarter, setPythonStarter] = useState('import sys\n\ndef solve():\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    solve()\n');
  const [jsStarter, setJsStarter] = useState('function solve() {\n  // Write your solution here\n}\n\nsolve();\n');
  const [cppStarter, setCppStarter] = useState('#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n');
  
  const [testCases, setTestCases] = useState<TestCaseInput[]>([
    { input: '', expectedOutput: '', isHidden: false, points: 1, explanation: 'Sample case 1' },
    { input: '', expectedOutput: '', isHidden: true, points: 2, explanation: 'Hidden verification case' },
  ]);

  const [formError, setFormError] = useState('');

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const addTestCase = () => {
    setTestCases([
      ...testCases,
      { input: '', expectedOutput: '', isHidden: true, points: 2, explanation: '' },
    ]);
  };

  const removeTestCase = (idx: number) => {
    if (testCases.length <= 1) return;
    setTestCases(testCases.filter((_, i) => i !== idx));
  };

  const updateTestCase = (idx: number, updates: Partial<TestCaseInput>) => {
    setTestCases(
      testCases.map((tc, i) => (i === idx ? { ...tc, ...updates } : tc))
    );
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Problem title is required');
      if (!statement.trim()) throw new Error('Problem statement is required');

      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        category,
        difficulty,
        scope,
        status,
        timeLimitMs: Number(timeLimitMs),
        memoryLimitMb: Number(memoryLimitMb),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        statement: statement.trim(),
        inputFormat: inputFormat.trim() || undefined,
        outputFormat: outputFormat.trim() || undefined,
        constraintsText: constraintsText.trim() || undefined,
        sampleExplanation: sampleExplanation.trim() || undefined,
        codeTemplates: {
          71: pythonStarter,
          63: jsStarter,
          54: cppStarter,
        },
        testCases: testCases
          .filter((tc) => tc.expectedOutput.trim().length > 0)
          .map((tc, idx) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput.trim(),
            isHidden: tc.isHidden,
            points: Number(tc.points) || 1,
            orderIndex: idx + 1,
            explanation: tc.explanation || undefined,
          })),
      };

      const res = await problemApi.create(payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-problems'] });
      router.push(`/super-admin/problems`);
    },
    onError: (err) => {
      setFormError(getErrorMessage(err));
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/problems"
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Coding Problem</h1>
            <p className="text-sm text-gray-500">Design a new coding problem with verified test cases and starters.</p>
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300 flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
        className="space-y-6"
      >
        {/* Core Metadata Card */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-3 border-gray-100 dark:border-gray-800">
            Basic Information
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Problem Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Two Sum"
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Slug (URL Identifier)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="two-sum"
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Scope
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="public">Public (Global Platform)</option>
                <option value="institution">Institution Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Time Limit (ms)
              </label>
              <input
                type="number"
                min={500}
                max={15000}
                step={500}
                value={timeLimitMs}
                onChange={(e) => setTimeLimitMs(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Memory Limit (MB)
              </label>
              <input
                type="number"
                min={64}
                max={1024}
                step={64}
                value={memoryLimitMb}
                onChange={(e) => setMemoryLimitMb(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="arrays, hash-map, two-pointers"
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Statement & Details Card */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-3 border-gray-100 dark:border-gray-800">
            Problem Description & Specifications
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Problem Statement * (Markdown supported)
            </label>
            <textarea
              required
              rows={6}
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Describe the problem, requirements, and examples clearly..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Input Format
              </label>
              <textarea
                rows={3}
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
                placeholder="e.g. First line contains integer n. Second line contains n space-separated integers."
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Output Format
              </label>
              <textarea
                rows={3}
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                placeholder="e.g. Print two zero-based indices separated by space."
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Constraints
              </label>
              <textarea
                rows={3}
                value={constraintsText}
                onChange={(e) => setConstraintsText(e.target.value)}
                placeholder="e.g. 1 <= n <= 10^5&#10;-10^9 <= nums[i] <= 10^9"
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Sample Explanation
              </label>
              <textarea
                rows={3}
                value={sampleExplanation}
                onChange={(e) => setSampleExplanation(e.target.value)}
                placeholder="e.g. nums[0] + nums[1] == 9, so we return [0, 1]."
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Starter Templates Card */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-3 border-gray-100 dark:border-gray-800">
            Language Starter Templates
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Python 3 Starter Code
              </label>
              <textarea
                rows={4}
                value={pythonStarter}
                onChange={(e) => setPythonStarter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-mono text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                JavaScript Starter Code
              </label>
              <textarea
                rows={4}
                value={jsStarter}
                onChange={(e) => setJsStarter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-mono text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                C++ Starter Code
              </label>
              <textarea
                rows={4}
                value={cppStarter}
                onChange={(e) => setCppStarter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-mono text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Initial Test Cases Card */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-5">
          <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Initial Test Cases
              </h2>
              <p className="text-xs text-gray-500">
                At least one sample case and one hidden verification case are recommended.
              </p>
            </div>
            <button
              type="button"
              onClick={addTestCase}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus size={14} /> Add Test Case
            </button>
          </div>

          <div className="space-y-4">
            {testCases.map((tc, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Case #{idx + 1}
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tc.isHidden}
                        onChange={(e) => updateTestCase(idx, { isHidden: e.target.checked })}
                        className="rounded accent-primary"
                      />
                      <span className={tc.isHidden ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'}>
                        {tc.isHidden ? 'Hidden (Grading Only)' : 'Sample (Visible in Problem)'}
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span>Points:</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={tc.points}
                        onChange={(e) => updateTestCase(idx, { points: Number(e.target.value) })}
                        className="w-12 px-2 py-0.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-xs text-center"
                      />
                    </div>
                    {testCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestCase(idx)}
                        className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Delete test case"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Standard Input (stdin)
                    </label>
                    <textarea
                      rows={2}
                      value={tc.input}
                      onChange={(e) => updateTestCase(idx, { input: e.target.value })}
                      placeholder="Input data..."
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Expected Output (stdout) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={tc.expectedOutput}
                      onChange={(e) => updateTestCase(idx, { expectedOutput: e.target.value })}
                      placeholder="Expected output..."
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/super-admin/problems"
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {createMutation.isPending ? (
              'Creating Problem...'
            ) : (
              <>
                <CheckCircle2 size={16} /> Save & Create Problem
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
