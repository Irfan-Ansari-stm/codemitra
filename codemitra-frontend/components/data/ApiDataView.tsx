'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import { getErrorMessage } from '@/lib/api';

function display(value: unknown): string {
  if (value == null || value === '') return '—';
  if (Array.isArray(value)) return value.map(display).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export function ApiDataView({ title, data, isLoading, error, emptyMessage = 'No records found.', onRetry }: {
  title: string;
  data: unknown;
  isLoading?: boolean;
  error?: unknown;
  emptyMessage?: string;
  onRetry?: () => void;
}) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const records = useMemo(() => {
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return rows.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object');
  }, [data]);
  const columns = useMemo(() => [...new Set(records.flatMap((row) => Object.keys(row)))].filter((key) => !/password|token|secret|source.?code/i.test(key)), [records]);
  const visibleRecords = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    const filtered = term ? records.filter((row) => columns.some((key) => display(row[key]).toLocaleLowerCase().includes(term))) : [...records];
    if (sort) filtered.sort((a, b) => {
      const left = a[sort.key];
      const right = b[sort.key];
      const leftValue = typeof left === 'number' ? left : display(left).toLocaleLowerCase();
      const rightValue = typeof right === 'number' ? right : display(right).toLocaleLowerCase();
      const compare = typeof leftValue === 'number' && typeof rightValue === 'number' ? leftValue - rightValue : String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true });
      return sort.direction === 'asc' ? compare : -compare;
    });
    return filtered;
  }, [columns, records, search, sort]);

  if (isLoading) return <section aria-label={`Loading ${title}`} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">{[0, 1, 2, 3, 4].map((row) => <div key={row} className="mb-2 h-10 animate-pulse rounded-md bg-slate-100 last:mb-0 dark:bg-slate-800" />)}</section>;
  if (error) return <section role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200"><p>{getErrorMessage(error)}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-2 font-medium underline">Retry</button>}</section>;
  if (!records.length) return <section className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">{emptyMessage}</section>;

  const toggleSort = (key: string) => setSort((current) => current?.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2><p className="mt-0.5 text-[11px] text-slate-500">{visibleRecords.length} {visibleRecords.length === 1 ? 'record' : 'records'}</p></div><label className="relative block w-full sm:max-w-xs"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} aria-label={`Search ${title}`} placeholder="Filter visible records" className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label></div>
    {visibleRecords.length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-500">No records match “{search}”.</p> : <div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50 dark:bg-slate-950/50"><tr>{columns.map((key) => <th key={key} scope="col" className="whitespace-nowrap border-b border-slate-200 px-4 py-3 dark:border-slate-800"><button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1.5 font-semibold capitalize text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:text-white">{key.replace(/[A-Z]/g, (character) => ` ${character.toLowerCase()}`).replace(/_/g, ' ')}{sort?.key === key ? sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ArrowUpDown size={12} className="opacity-40" />}</button></th>)}</tr></thead><tbody>{visibleRecords.map((row, index) => <tr key={String(row.id ?? index)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 dark:border-slate-800/70 dark:hover:bg-slate-800/30">{columns.map((key) => <td key={key} className="max-w-sm whitespace-pre-wrap break-words px-4 py-3 text-slate-600 dark:text-slate-300">{display(row[key])}</td>)}</tr>)}</tbody></table></div>}
  </section>;
}

export function PageHeading({ title, description }: { title: string; description?: string }) {
  return <header className="mb-5"><h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h1>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</header>;
}
