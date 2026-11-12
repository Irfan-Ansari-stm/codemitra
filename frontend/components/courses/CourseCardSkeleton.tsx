export function CourseCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <div className="flex min-h-[180px] animate-pulse flex-col rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0e1728]">
        <div className="h-5 w-20 rounded-md bg-slate-100 dark:bg-slate-900" />
        <div className="mt-3 h-5 w-3/4 rounded bg-slate-100 dark:bg-slate-900" />
        <div className="mt-2 h-4 w-full rounded bg-slate-100 dark:bg-slate-900" />
        <div className="mt-2 h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-900" />
        <div className="mt-auto h-4 w-1/2 rounded bg-slate-100 dark:bg-slate-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[300px] animate-pulse flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0e1728]">
      <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-900" />
      <div className="flex flex-1 flex-col p-5">
        <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-900" />
        <div className="mt-3 h-5 w-3/4 rounded bg-slate-100 dark:bg-slate-900" />
        <div className="mt-2 h-4 w-full rounded bg-slate-100 dark:bg-slate-900" />
        <div className="mt-2 h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-900" />
        <div className="mt-auto h-4 w-1/2 rounded bg-slate-100 dark:bg-slate-900" />
      </div>
    </div>
  );
}

export function CourseGridSkeleton({
  count = 6,
  variant = 'default',
}: {
  count?: number;
  variant?: 'default' | 'compact';
}) {
  return (
    <div
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      aria-label="Loading courses"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <CourseCardSkeleton key={index} variant={variant} />
      ))}
    </div>
  );
}
