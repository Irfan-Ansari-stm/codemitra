'use client';

import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useBookmarkProblem } from '@/hooks/useProblem';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  problemId: string;
  bookmarked?: boolean;
  className?: string;
}

export function BookmarkButton({ problemId, bookmarked, className }: BookmarkButtonProps) {
  const user = useAuthStore((state) => state.user);
  const mutation = useBookmarkProblem(problemId);
  const isBookmarked = !!bookmarked;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent(
        typeof window !== 'undefined' ? window.location.pathname : '/problems'
      )}`;
      return;
    }
    if (!mutation.isPending) {
      mutation.mutate(!isBookmarked);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={mutation.isPending}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark problem'}
      aria-pressed={isBookmarked}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark problem'}
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50',
        isBookmarked
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
          : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 dark:border-white/10 dark:text-slate-500 dark:hover:border-white/20 dark:hover:text-slate-300',
        className
      )}
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-4 w-4" aria-hidden />
      ) : (
        <Bookmark className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
