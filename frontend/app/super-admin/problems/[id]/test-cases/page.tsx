'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Eye,
  EyeOff,
  Download,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { problemApi, getErrorMessage } from '@/lib/api';

interface TestCase {
  id: string;
  problem_id?: string;
  problemId?: string;
  input: string;
  expected_output?: string;
  expectedOutput?: string;
  is_hidden?: boolean;
  isHidden?: boolean;
  points?: number;
  order_index?: number;
  orderIndex?: number;
  explanation?: string;
}

export default function ProblemTestCasesPage() {
  const params = useParams<{ id: string }>();
  const problemId = params.id;
  const queryClient = useQueryClient();

  const [newInput, setNewInput] = useState('');
  const [newExpectedOutput, setNewExpectedOutput] = useState('');
  const [newIsHidden, setNewIsHidden] = useState(true);
  const [newPoints, setNewPoints] = useState(2);
  const [newExplanation, setNewExplanation] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [editExpected, setEditExpected] = useState('');
  const [editHidden, setEditHidden] = useState(false);
  const [editPoints, setEditPoints] = useState(1);
  const [editExplanation, setEditExplanation] = useState('');

  const [formError, setFormError] = useState('');

  // Fetch Problem
  const problemQuery = useQuery({
    queryKey: ['problem-detail', problemId],
    queryFn: () => problemApi.get(problemId).then((res) => res.data.data),
    enabled: !!problemId,
  });

  // Fetch Test Cases
  const testCasesQuery = useQuery({
    queryKey: ['problem-test-cases', problemId],
    queryFn: () => problemApi.getTestCases(problemId).then((res) => res.data.data as TestCase[]),
    enabled: !!problemId,
  });

  // Add Test Case Mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      if (!newExpectedOutput.trim()) throw new Error('Expected output is required');
      const payload = {
        input: newInput,
        expectedOutput: newExpectedOutput.trim(),
        isHidden: newIsHidden,
        points: Number(newPoints) || 1,
        explanation: newExplanation.trim() || undefined,
        orderIndex: (testCasesQuery.data?.length || 0) + 1,
      };
      await problemApi.addTestCase(problemId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problem-test-cases', problemId] });
      setNewInput('');
      setNewExpectedOutput('');
      setNewIsHidden(true);
      setNewPoints(2);
      setNewExplanation('');
      setIsAddOpen(false);
      setFormError('');
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  // Update Test Case Mutation
  const updateMutation = useMutation({
    mutationFn: async (testCaseId: string) => {
      const payload = {
        input: editInput,
        expectedOutput: editExpected.trim(),
        isHidden: editHidden,
        points: Number(editPoints) || 1,
        explanation: editExplanation.trim() || undefined,
      };
      await problemApi.updateTestCase(testCaseId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problem-test-cases', problemId] });
      setEditingId(null);
      setFormError('');
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  // Delete Test Case Mutation
  const deleteMutation = useMutation({
    mutationFn: (testCaseId: string) => problemApi.deleteTestCase(testCaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problem-test-cases', problemId] });
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const startEdit = (tc: TestCase) => {
    setEditingId(tc.id);
    setEditInput(tc.input || '');
    setEditExpected(tc.expected_output || tc.expectedOutput || '');
    setEditHidden(tc.is_hidden ?? tc.isHidden ?? false);
    setEditPoints(tc.points || 1);
    setEditExplanation(tc.explanation || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const exportJson = () => {
    if (!testCasesQuery.data) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(testCasesQuery.data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `test-cases-${problemQuery.data?.slug || problemId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const testCases = testCasesQuery.data || [];
  const sampleCount = testCases.filter((tc) => !(tc.is_hidden ?? tc.isHidden)).length;
  const hiddenCount = testCases.filter((tc) => tc.is_hidden ?? tc.isHidden).length;

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Test Cases: {problemQuery.data?.title || 'Loading...'}
            </h1>
            <p className="text-sm text-gray-500">
              Manage sample (public) and hidden (grading verification) test cases.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Download size={14} /> Export JSON
          </button>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus size={14} /> Add Test Case
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500">Total Cases</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{testCases.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-950 bg-emerald-50/50 dark:bg-emerald-950/20">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Sample Cases (Visible)</p>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">{sampleCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-950 bg-amber-50/50 dark:bg-amber-950/20">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Hidden Cases (Private Grading)</p>
          <p className="text-2xl font-bold text-amber-800 dark:text-amber-300 mt-1">{hiddenCount}</p>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300 flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{formError}</span>
        </div>
      )}

      {/* Add Test Case Drawer/Card */}
      {isAddOpen && (
        <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 dark:bg-primary/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Create New Test Case</h3>
            <button
              onClick={() => setIsAddOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Standard Input (stdin)
              </label>
              <textarea
                rows={3}
                value={newInput}
                onChange={(e) => setNewInput(e.target.value)}
                placeholder="Data passed to stdin..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Expected Output (stdout) *
              </label>
              <textarea
                rows={3}
                required
                value={newExpectedOutput}
                onChange={(e) => setNewExpectedOutput(e.target.value)}
                placeholder="Exact expected output..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsHidden}
                  onChange={(e) => setNewIsHidden(e.target.checked)}
                  className="rounded accent-primary"
                />
                <span>Hidden test case (Only evaluated on final server submission)</span>
              </label>

              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>Points:</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newPoints}
                  onChange={(e) => setNewPoints(Number(e.target.value))}
                  className="w-14 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-center"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={addMutation.isPending}
                onClick={() => addMutation.mutate()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"
              >
                <Save size={14} /> Save Test Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Cases List */}
      <div className="space-y-4">
        {testCases.map((tc, idx) => {
          const isHidden = tc.is_hidden ?? tc.isHidden ?? false;
          const isEditing = editingId === tc.id;
          const expectedOut = tc.expected_output || tc.expectedOutput || '';

          if (isEditing) {
            return (
              <div
                key={tc.id}
                className="p-5 rounded-2xl border border-primary/40 bg-white dark:bg-gray-900 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Editing Case #{idx + 1}
                  </span>
                  <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                    <X size={15} />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Standard Input (stdin)
                    </label>
                    <textarea
                      rows={3}
                      value={editInput}
                      onChange={(e) => setEditInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Expected Output (stdout) *
                    </label>
                    <textarea
                      rows={3}
                      value={editExpected}
                      onChange={(e) => setEditExpected(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editHidden}
                        onChange={(e) => setEditHidden(e.target.checked)}
                        className="rounded accent-primary"
                      />
                      <span>Hidden test case</span>
                    </label>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span>Points:</span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={editPoints}
                        onChange={(e) => setEditPoints(Number(e.target.value))}
                        className="w-14 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-center"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={updateMutation.isPending}
                      onClick={() => updateMutation.mutate(tc.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"
                    >
                      <Save size={14} /> Update Case
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={tc.id}
              className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    Case #{idx + 1}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isHidden
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    }`}
                  >
                    {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
                    {isHidden ? 'Hidden (Grading Only)' : 'Sample (Visible)'}
                  </span>
                  <span className="text-xs text-gray-500">Points: {tc.points || 1}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(tc)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Edit test case"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this test case?')) {
                        deleteMutation.mutate(tc.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Delete test case"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] mb-1">Input (stdin):</p>
                  <pre className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/80 font-mono text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap max-h-32">
                    {tc.input || '(empty stdin)'}
                  </pre>
                </div>

                <div>
                  <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] mb-1">Expected Output:</p>
                  <pre className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/80 font-mono text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap max-h-32">
                    {expectedOut || '(empty)'}
                  </pre>
                </div>
              </div>
            </div>
          );
        })}

        {testCases.length === 0 && (
          <div className="p-12 text-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900">
            <AlertCircle size={28} className="mx-auto text-gray-400 mb-2" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">No test cases found</h3>
            <p className="text-xs text-gray-500 mt-1">Add sample and hidden test cases to evaluate submissions.</p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus size={14} /> Add First Test Case
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
