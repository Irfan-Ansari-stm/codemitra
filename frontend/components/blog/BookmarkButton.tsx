'use client';

import React, { useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useToggleBlogBookmark, useBlogBookmark } from '@/hooks/useBlog';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { SignInPromptModal } from '@/components/auth/SignInPromptModal';

interface BookmarkButtonProps {
  postId: string;
  className?: string;
}

export function BookmarkButton({ postId, className }: BookmarkButtonProps) {
  const user = useAuthStore((state) => state.user);
  const { data: bookmarkState } = useBlogBookmark(postId);
  const toggleBookmark = useToggleBlogBookmark(postId);
  const bookmarked = bookmarkState?.bookmarked ?? false;
  const [showSignInModal, setShowSignInModal] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    if (!toggleBookmark.isPending) {
      toggleBookmark.mutate(!bookmarked);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={!!user && toggleBookmark.isPending}
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

      <SignInPromptModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        title="Bookmark Article"
        actionName="bookmark and save articles to your library"
      />
    </>
  );
}
