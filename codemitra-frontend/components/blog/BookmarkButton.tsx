'use client';

import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useToggleBlogBookmark, useBlogBookmark } from '@/hooks/useBlog';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface BookmarkButtonProps {
  postId: string;
  className?: string;
}

export function BookmarkButton({ postId, className }: BookmarkButtonProps) {
  const user = useAuthStore((state) => state.user);
  const { data: bookmarkState } = useBlogBookmark(postId);
  const toggleBookmark = useToggleBlogBookmark(postId);
  const bookmarked = bookmarkState?.bookmarked ?? false;

  if (!user) {
    return (
      <Link
        href="/login"
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]',
          className
        )}
      >
        <Bookmark className="h-4 w-4" aria-hidden />
        Save article
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (!toggleBookmark.isPending) toggleBookmark.mutate(!bookmarked);
      }}
      disabled={toggleBookmark.isPending}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? 'Remove bookmark' : 'Save article'}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50',
        bookmarked
          ? 'border-brand-500/40 bg-brand-500/10 text-brand-700 dark:text-brand-300'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]',
        className
      )}
    >
      {bookmarked ? (
        <BookmarkCheck className="h-4 w-4" aria-hidden />
      ) : (
        <Bookmark className="h-4 w-4" aria-hidden />
      )}
      {bookmarked ? 'Saved' : 'Save article'}
    </button>
  );
}
