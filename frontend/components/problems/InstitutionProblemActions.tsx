'use client';

import { type FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { getErrorMessage, problemApi } from '@/lib/api';
import type { Problem } from '@/types';

type ProblemForm = {
  title: string;
  statement: string;
  difficulty: Problem['difficulty'];
  tags: string;
};

const blankForm: ProblemForm = {
  title: '',
  statement: '',
  difficulty: 'easy',
  tags: '',
};

export function InstitutionProblemActions({ problem }: { problem?: Problem }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ProblemForm>(blankForm);
  const [formError, setFormError] = useState('');

  const saveMutation = useMutation({
    mutationFn: () => {
      const data = {
        title: form.title.trim(),
        statement: form.statement.trim(),
        difficulty: form.difficulty,
        scope: 'institution' as const,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      };
      return problem
        ? problemApi.update(problem.id, data)
        : problemApi.create(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['problems'] });
      void queryClient.invalidateQueries({ queryKey: ['problem-tag-options'] });
      setDialogOpen(false);
      setForm(blankForm);
      setFormError('');
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => problemApi.delete(problem!.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['problems'] });
      void queryClient.invalidateQueries({ queryKey: ['problem-tag-options'] });
    },
  });

  async function openDialog() {
    setFormError('');
    saveMutation.reset();
    if (problem) {
      try {
        const response = await problemApi.get(problem.id);
        const details = response.data.data;
        setForm({
          title: details.title ?? problem.title,
          statement: details.statement ?? '',
          difficulty: details.difficulty ?? problem.difficulty,
          tags: (details.tags ?? problem.tags ?? []).join(', '),
        });
      } catch (error) {
        setFormError(getErrorMessage(error));
        return;
      }
    } else {
      setForm(blankForm);
    }
    setDialogOpen(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.title.trim().length < 2 || form.statement.trim().length < 10) {
      setFormError('Enter a title of at least 2 characters and a statement of at least 10 characters.');
      return;
    }
    setFormError('');
    saveMutation.mutate();
  }

  return (
    <>
      {problem ? (
        <div className="flex items-center gap-1">
          {formError && !dialogOpen && (
            <p role="alert" className="max-w-36 text-xs text-rose-700 dark:text-rose-300">
              {formError}
            </p>
          )}
          <button
            type="button"
            aria-label={`Edit ${problem.title}`}
            onClick={() => void openDialog()}
            className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-white/10"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={`Delete ${problem.title}`}
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (window.confirm(`Delete ${problem.title} for your institution?`)) {
                deleteMutation.mutate();
              }
            }}
            className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
          {deleteMutation.error && (
            <p role="alert" className="max-w-36 text-xs text-rose-700 dark:text-rose-300">
              {getErrorMessage(deleteMutation.error)}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void openDialog()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add problem
          </button>
          {deleteMutation.error && (
            <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">
              {getErrorMessage(deleteMutation.error)}
            </p>
          )}
        </div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="institution-problem-form-title"
            className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="institution-problem-form-title" className="text-lg font-semibold text-slate-950 dark:text-white">
                  {problem ? 'Edit problem' : 'Add institution problem'}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  This problem is available to students in your institution.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close problem form"
                onClick={() => setDialogOpen(false)}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <form className="mt-5 space-y-4" onSubmit={submit}>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Problem title
                <input
                  required
                  minLength={2}
                  maxLength={255}
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Problem statement
                <textarea
                  required
                  minLength={10}
                  rows={7}
                  value={form.statement}
                  onChange={(event) => setForm({ ...form, statement: event.target.value })}
                  className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Difficulty
                  <select
                    value={form.difficulty}
                    onChange={(event) => setForm({ ...form, difficulty: event.target.value as Problem['difficulty'] })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </label>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Tags
                  <input
                    value={form.tags}
                    onChange={(event) => setForm({ ...form, tags: event.target.value })}
                    placeholder="arrays, strings"
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
              </div>
              {formError && <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">{formError}</p>}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving…' : problem ? 'Save changes' : 'Create problem'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
