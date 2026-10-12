import { cn } from '@/lib/utils';

interface BlogPostSkeletonProps {
  count?: number;
  className?: string;
}

export function BlogPostSkeleton({ count = 6, className }: BlogPostSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading articles"
      className={cn('grid gap-5 sm:grid-cols-2 xl:grid-cols-3', className)}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-ink-850"
        >
          <div className="aspect-[16/9] animate-pulse bg-slate-100 dark:bg-ink-800" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-20 animate-pulse rounded bg-slate-100 dark:bg-ink-800" />
            <div className="h-5 w-full animate-pulse rounded bg-slate-100 dark:bg-ink-800" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-ink-800" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-ink-800" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-ink-800" />
            <div className="flex items-center gap-2 pt-2">
              <div className="h-6 w-6 animate-pulse rounded-full bg-slate-100 dark:bg-ink-800" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-100 dark:bg-ink-800" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading articles…</span>
    </div>
  );
}

export function FeaturedSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading featured article"
      className={cn('overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-ink-850', className)}
    >
      <div className="grid lg:grid-cols-[1.1fr_1fr]">
        <div className="min-h-[220px] animate-pulse bg-slate-100 dark:bg-ink-800 lg:min-h-[340px]" />
        <div className="space-y-4 p-8">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-100 dark:bg-ink-800" />
          <div className="h-8 w-full animate-pulse rounded bg-slate-100 dark:bg-ink-800" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-ink-800" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-ink-800" />
          <div className="flex items-center gap-3 pt-2">
            <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100 dark:bg-ink-800" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100 dark:bg-ink-800" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-100 dark:bg-ink-800" />
        </div>
      </div>
      <span className="sr-only">Loading featured article…</span>
    </div>
  );
}
