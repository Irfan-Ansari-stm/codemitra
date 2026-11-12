import { SignalHigh, SignalLow, SignalMedium, type LucideIcon } from 'lucide-react';
import type { Difficulty } from '@/types';
import { cn } from '@/lib/utils';

const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; icon: LucideIcon; className: string }
> = {
  easy: {
    label: 'Easy',
    icon: SignalLow,
    className:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  medium: {
    label: 'Medium',
    icon: SignalMedium,
    className:
      'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  hard: {
    label: 'Hard',
    icon: SignalHigh,
    className:
      'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400',
  },
};

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const meta = DIFFICULTY_META[difficulty] ?? DIFFICULTY_META.medium;
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold',
        meta.className,
        className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {meta.label}
    </span>
  );
}
