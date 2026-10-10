'use client';

import type { LeaderboardEntry } from '@/types';
import { Trophy } from 'lucide-react';

export default function Leaderboard({ entries, isLoading }: { entries: LeaderboardEntry[]; isLoading?: boolean }) {
  if (isLoading) return <div className="space-y-2" aria-label="Loading leaderboard">{[1, 2, 3, 4].map((row) => <div key={row} className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />)}</div>;
  if (!entries?.length) return <div className="grid min-h-44 place-items-center rounded-lg border border-dashed border-slate-200 px-4 text-center dark:border-slate-800"><div><Trophy size={20} className="mx-auto text-slate-400" /><p className="mt-2 text-xs text-slate-500">No learner scores are available yet.</p></div></div>;

  return <div className="overflow-x-auto"><table className="w-full min-w-[390px] text-left text-xs">
    <thead><tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500 dark:border-slate-800"><th className="py-2 pr-3 font-medium">Rank</th><th className="py-2 pr-3 font-medium">Learner</th><th className="py-2 pr-3 text-right font-medium">Solved</th><th className="py-2 text-right font-medium">Score</th></tr></thead>
    <tbody>{entries.slice(0, 8).map((entry, index) => <tr key={entry.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/70"><td className="py-3 pr-3 font-semibold tabular-nums text-slate-500">{entry.rank ?? index + 1}</td><td className="py-3 pr-3"><span className="flex items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{entry.name?.slice(0, 1).toUpperCase()}</span><span className="max-w-32 truncate font-medium text-slate-800 dark:text-slate-200">{entry.name}</span></span></td><td className="py-3 pr-3 text-right tabular-nums text-slate-600 dark:text-slate-400">{entry.totalProblemsSolved}</td><td className="py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">{entry.totalScore}</td></tr>)}</tbody>
  </table></div>;
}
