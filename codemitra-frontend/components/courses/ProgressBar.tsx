'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  className?: string;
  barClassName?: string;
  label?: string;
}

export function ProgressBar({
  value,
  className,
  barClassName,
  label,
}: ProgressBarProps) {
  const percent = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn('w-full', className)}>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? `Progress ${percent}%`}
      >
        <div
          className={cn(
            'h-full rounded-full bg-brand-500 transition-all duration-500',
            barClassName
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
