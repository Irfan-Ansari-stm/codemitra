'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, Clock3, Loader2 } from 'lucide-react';
import type { CourseModule } from '@/types';
import { cn } from '@/lib/utils';

interface CurriculumSectionProps {
  modules: CourseModule[];
  isEnrolled: boolean;
  isLoading: boolean;
  onToggleChapter: (chapterId: string, isCompleted: boolean) => void;
  pendingChapterId?: string | null;
}

export function CurriculumSection({
  modules,
  isEnrolled,
  isLoading,
  onToggleChapter,
  pendingChapterId,
}: CurriculumSectionProps) {
  const [openModules, setOpenModules] = useState<Set<string>>(
    () => new Set(modules.slice(0, 1).map((module) => module.id))
  );

  const toggleModule = (moduleId: string) => {
    setOpenModules((previous) => {
      const next = new Set(previous);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3" aria-label="Loading curriculum" aria-busy="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0e1728]"
          />
        ))}
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-[#0e1728]">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          No curriculum available
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Modules and lessons will appear here once the instructor publishes them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {modules.map((module, moduleIndex) => {
        const chapters = module.chapters ?? [];
        const isOpen = openModules.has(module.id);
        const completedCount = chapters.filter((chapter) => chapter.isCompleted).length;

        return (
          <details
            key={module.id}
            open={isOpen}
            onToggle={() => toggleModule(module.id)}
            className="group rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0e1728]"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 sm:px-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {moduleIndex + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {module.title}
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
                  {chapters.length} {chapters.length === 1 ? 'lesson' : 'lessons'}
                  {isEnrolled && chapters.length > 0 &&
                    ` · ${completedCount} completed`}
                </span>
              </span>
              <span className="hidden rounded-md border border-slate-200 px-2 py-1 text-[10px] capitalize text-slate-500 dark:border-white/10 sm:inline">
                {module.status}
              </span>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>

            {(module.description || chapters.length > 0) && (
              <div className="border-t border-slate-100 px-4 py-4 dark:border-white/5 sm:pl-16 sm:pr-5">
                {module.description && (
                  <p className="mb-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {module.description}
                  </p>
                )}
                {chapters.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No lessons published in this module yet.
                  </p>
                ) : (
                  <ol className="space-y-2">
                    {chapters.map((chapter) => {
                      const isPending = pendingChapterId === chapter.id;
                      return (
                        <li
                          key={chapter.id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-950"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            {isEnrolled ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onToggleChapter(chapter.id, !chapter.isCompleted)
                                }
                                disabled={isPending}
                                aria-pressed={!!chapter.isCompleted}
                                aria-label={
                                  chapter.isCompleted
                                    ? `Mark lesson "${chapter.title}" as incomplete`
                                    : `Mark lesson "${chapter.title}" as complete`
                                }
                                className={cn(
                                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50',
                                  chapter.isCompleted
                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : 'border-slate-300 bg-white hover:border-brand-400 dark:border-white/20 dark:bg-slate-900'
                                )}
                              >
                                {isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                                ) : chapter.isCompleted ? (
                                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                                ) : null}
                              </button>
                            ) : (
                              <span
                                className={cn(
                                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                                  chapter.isCompleted
                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : 'border-slate-300 dark:border-white/20'
                                )}
                                aria-hidden
                              />
                            )}
                            <span
                              className={cn(
                                'truncate text-xs font-medium',
                                chapter.isCompleted
                                  ? 'text-slate-400 line-through dark:text-slate-500'
                                  : 'text-slate-700 dark:text-slate-300'
                              )}
                            >
                              {chapter.title}
                            </span>
                          </div>
                          {typeof chapter.estimatedMinutes === 'number' &&
                            chapter.estimatedMinutes > 0 && (
                              <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                                <Clock3 className="h-3 w-3" aria-hidden />
                                {chapter.estimatedMinutes} min
                              </span>
                            )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            )}
          </details>
        );
      })}
    </div>
  );
}
