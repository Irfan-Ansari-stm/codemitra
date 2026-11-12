'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, AlertCircle, FileCode, CheckSquare } from 'lucide-react';
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

export default function EditProblemPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const problemId = params.id;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Arrays');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [scope, setScope] = useState<'public' | 'institution'>('public');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('published');
  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(256);
  const [tags, setTags] = useState('');
  const [statement, setStatement] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraintsText, setConstraintsText] = useState('');
  const [sampleExplanation, setSampleExplanation] = useState('');
  const [formError, setFormError] = useState('');

  const problemQuery = useQuery({
    queryKey: ['problem-detail', problemId],
    queryFn: () => problemApi.get(problemId).then((res) => res.data.data),
    enabled: !!problemId,
  });

  useEffect(() => {
    if (problemQuery.data) {
      const p = problemQuery.data;
      setTitle(p.title || '');
      setSlug(p.slug || '');
      setCategory(p.category || 'Arrays');
      setDifficulty(p.difficulty || 'medium');
      setScope(p.scope || 'public');
      setStatus(p.status || 'published');
      setTimeLimitMs(p.time_limit_ms || p.timeLimitMs || 2000);
      setMemoryLimitMb(p.memory_limit_mb || p.memoryLimitMb || 256);
      setTags((p.tags || []).join(', '));
      setStatement(p.statement || '');
      setInputFormat(p.input_format || p.inputFormat || '');
      setOutputFormat(p.output_format || p.outputFormat || '');
      setConstraintsText(p.constraints_text || p.constraintsText || '');
      setSampleExplanation(p.sample_explanation || p.sampleExplanation || '');
    }
  }, [problemQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async () => {
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
      };

      const res = await problemApi.update(problemId, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-problems'] });
      queryClient.invalidateQueries({ queryKey: ['problem-detail', problemId] });
      router.push(`/super-admin/problems`);
    },
    onError: (err) => {
      setFormError(getErrorMessage(err));
    },
  });

  if (problemQuery.isLoading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading problem details...</div>;
  }

  if (problemQuery.isError || !problemQuery.data) {
    return (
      <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-800">
        <h2 className="text-lg font-bold">Problem Not Found</h2>
        <p className="mt-1 text-sm">The problem could not be loaded.</p>
        <Link href="/super-admin/problems" className="mt-4 inline-block text-sm font-semibold underline">
          Back to problems
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Problem: {problemQuery.data.title}</h1>
            <p className="text-sm text-gray-500">Update question specifications, constraints, and runtime limits.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/super-admin/problems/${problemId}/test-cases`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <CheckSquare size={14} /> Manage Test Cases
          </Link>
          <Link
            href={`/super-admin/problems/${problemId}/submissions`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FileCode size={14} /> View Submissions
          </Link>
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
          updateMutation.mutate();
        }}
        className="space-y-6"
      >
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
                onChange={(e) => setTitle(e.target.value)}
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
                <option value="public">Public</option>
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
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

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
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/super-admin/problems"
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving Changes...' : (
              <>
                <CheckCircle2 size={16} /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
