'use client';

import { format, parseISO } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HeatmapData } from '@/types';

export function SubmissionActivityChart({ data, isLoading, error, onRetry, days = 90 }: {
  data?: HeatmapData[];
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  days?: number;
}) {
  const chartData = (data ?? []).map((entry) => ({
    ...entry,
    label: (() => { try { return format(parseISO(entry.date), 'MMM d'); } catch { return entry.date; } })(),
  }));

  return <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-slate-900 dark:text-white">Submission activity</h2><p className="mt-1 text-xs text-slate-500">Daily submissions over the last {days} days</p></div><span className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">{days} days</span></div>
    {isLoading ? <div className="mt-6 h-64 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" /> : error ? <div role="alert" className="mt-6 grid h-64 place-items-center rounded-lg border border-dashed border-slate-300 text-center dark:border-slate-700"><div><p className="text-sm text-slate-600 dark:text-slate-300">Activity data is unavailable.</p>{onRetry && <button type="button" onClick={onRetry} className="mt-2 text-xs font-medium text-blue-600 hover:underline dark:text-blue-300">Try again</button>}</div></div> : chartData.length === 0 ? <div className="mt-6 grid h-64 place-items-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700">No submissions recorded in this period.</div> : <div className="mt-5 h-64 w-full">
      <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={26} className="fill-slate-500" />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="fill-slate-500" />
        <Tooltip contentStyle={{ borderRadius: 10, borderColor: '#334155', background: '#0f172a', color: '#f8fafc', fontSize: 12 }} labelStyle={{ color: '#cbd5e1' }} formatter={(value: number, name: string) => [value, name === 'accepted' ? 'Accepted' : 'Submissions']} />
        <Bar dataKey="total" name="Submissions" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={18} />
        <Bar dataKey="accepted" name="Accepted" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={18} />
      </BarChart></ResponsiveContainer>
    </div>}
    <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-blue-500" /> All submissions</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" /> Accepted</span></div>
  </section>;
}
