'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  History,
  X,
  Clock,
  Cpu,
  Trash2,
  Code,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ideApi } from '@/lib/api';

interface ExecutionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreCode: (code: string, language: string) => void;
}

export function ExecutionHistoryDrawer({
  isOpen,
  onClose,
  onRestoreCode,
}: ExecutionHistoryDrawerProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['ide', 'history', page],
    queryFn: async () => {
      try {
        const res = await ideApi.getHistory({ page, limit: 10 });
        return {
          items: res.data.data || [],
          meta: res.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 },
        };
      } catch {
        return { items: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } };
      }
    },
    enabled: isOpen,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ideApi.deleteHistoryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ide', 'history'] });
      if (selectedItem?.id) setSelectedItem(null);
    },
  });

  if (!isOpen) return null;

  const items = data?.items || [];
  const meta = data?.meta || { page: 1, limit: 10, total: 0 };
  const totalPages = (meta as any).totalPages || Math.ceil((meta.total || 0) / (meta.limit || 10)) || 1;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in-50">
      <div className="w-full max-w-xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <History size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Execution History</h2>
              <p className="text-xs text-slate-500">Audit trail and code snapshots of your previous runs</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading execution history...</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 space-y-2">
              <Code size={32} className="mx-auto opacity-40 text-slate-400" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No executions recorded yet</p>
              <p className="max-w-xs mx-auto text-slate-500">
                Run code using the Green Run button to automatically generate persistent execution snapshots.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item: any) => {
                const isSelected = selectedItem?.id === item.id;
                const isSuccess = item.status === 'completed';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(isSelected ? null : item)}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={11} /> Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <AlertCircle size={11} /> {item.status.replace('_', ' ')}
                          </span>
                        )}

                        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase">
                          {item.language}
                        </span>

                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {item.projectName}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this execution record?')) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                        title="Delete record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Metadata chips */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {item.executionTime} ms
                      </span>
                      {item.memoryUsed && (
                        <span className="flex items-center gap-1">
                          <Cpu size={11} />
                          {Math.round(item.memoryUsed)} KB
                        </span>
                      )}
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>

                    {/* Code Snippet Preview */}
                    <div className="mt-2.5 rounded-lg bg-slate-900 p-2.5 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-24 select-text">
                      <pre className="!bg-transparent !p-0 whitespace-pre-wrap">{item.sourceCode}</pre>
                    </div>

                    {/* Output Preview */}
                    {item.stdout && (
                      <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
                        Output: {item.stdout.split('\n')[0]}
                      </div>
                    )}

                    {/* Actions if selected */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Restore this code snapshot into editor</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreCode(item.sourceCode, item.language);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-colors"
                        >
                          <span>Load Snapshot</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination & Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing Page {meta.page || 1} of {totalPages} ({meta.total || 0} total)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
