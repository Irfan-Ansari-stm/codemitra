import type { LucideIcon } from 'lucide-react';

export function MetricCard({ label, value, detail, icon: Icon, tone = 'blue' }: {
  label: string;
  value: number | string;
  detail: string;
  icon: LucideIcon;
  tone?: 'blue' | 'green' | 'amber' | 'violet';
}) {
  const tones = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
  };
  return <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p><p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-slate-950 dark:text-white">{value}</p></div>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}><Icon size={18} /></span>
    </div>
    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-500">{detail}</p>
  </article>;
}
