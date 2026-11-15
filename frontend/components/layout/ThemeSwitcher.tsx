'use client';

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';

interface ThemeSwitcherProps {
  className?: string;
  iconClassName?: string;
}

export function ThemeSwitcher({ className, iconClassName }: ThemeSwitcherProps) {
  return (
    <ThemeToggle
      className={cn(
        'h-9 w-9 border-slate-200/80 bg-white/80 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:hover:text-white',
        className
      )}
      iconClassName={iconClassName}
    />
  );
}

export default ThemeSwitcher;
