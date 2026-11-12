'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, Clock3, Bookmark, BookmarkCheck } from 'lucide-react';
import type { BlogPost } from '@/types';
import { formatDate, getInitials, cn } from '@/lib/utils';
import { useToggleBlogBookmark } from '@/hooks/useBlog';
import { useAuthStore } from '@/store/authStore';

interface ArticleCardProps {
  post: BlogPost;
  /** Show the bookmark toggle. Requires an authenticated user. */
  showBookmark?: boolean;
  className?: string;
}

function CoverImage({ post }: { post: BlogPost }) {
  if (!post.coverImageUrl) {
    return (
      <div
        aria-hidden
        className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-brand-500/15 via-brand-500/5 to-transparent dark:from-brand-500/20 dark:via-brand-500/8 dark:to-transparent"
      >
        <span className="font-mono text-4xl font-bold text-brand-500/40 dark:text-brand-400/30">
          {getInitials(post.title).slice(0, 1)}
        </span>
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-ink-800">
      <Image
        src={post.coverImageUrl}
        alt={post.coverImageUrl ? `${post.title} cover image` : ''}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        loading="lazy"
      />
    </div>
  );
}

export function ArticleCard({ post, showBookmark = false, className }: ArticleCardProps) {
  const user = useAuthStore((state) => state.user);
  const toggleBookmark = useToggleBlogBookmark(post.id);
  const canBookmark = showBookmark && !!user;

  const handleBookmark = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canBookmark || toggleBookmark.isPending) return;
    toggleBookmark.mutate(!post.bookmarked);
  };

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-card dark:border-white/[0.08] dark:bg-ink-850 dark:hover:border-brand-500/30 dark:hover:bg-ink-800',
        className
      )}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="flex h-full flex-col"
        aria-label={`Read article: ${post.title}`}
      >
        <CoverImage post={post} />

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex items-center gap-2">
            {post.categoryName && (
              <span className="rounded-md bg-brand-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700 ring-1 ring-brand-500/20 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25">
                {post.categoryName}
              </span>
            )}
            {post.isFeatured && (
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
                Featured
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold leading-snug tracking-tight text-slate-950 transition-colors group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {post.excerpt}
            </p>
          )}

          <div className="mt-auto pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {post.authorAvatarUrl ? (
                <Image
                  src={post.authorAvatarUrl}
                  alt={`${post.authorName} avatar`}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/10 text-[10px] font-semibold text-brand-700 ring-1 ring-brand-500/20 dark:text-brand-300"
                >
                  {getInitials(post.authorName)}
                </span>
              )}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {post.authorName}
              </span>
              <span aria-hidden className="text-slate-300 dark:text-slate-600">·</span>
              {post.publishedAt && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  {formatDate(post.publishedAt)}
                </span>
              )}
              {post.readTimeMinutes != null && (
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden />
                  {post.readTimeMinutes} min
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {canBookmark && (
        <button
          type="button"
          onClick={handleBookmark}
          disabled={toggleBookmark.isPending}
          aria-label={post.bookmarked ? 'Remove bookmark' : 'Bookmark article'}
          aria-pressed={post.bookmarked}
          className={cn(
            'absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border backdrop-blur transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50',
            post.bookmarked
              ? 'border-brand-500/30 bg-brand-500/90 text-white'
              : 'border-slate-200/80 bg-white/80 text-slate-500 hover:text-brand-600 dark:border-white/10 dark:bg-ink-900/80 dark:text-slate-400 dark:hover:text-brand-400'
          )}
        >
          {post.bookmarked ? (
            <BookmarkCheck className="h-4 w-4" aria-hidden />
          ) : (
            <Bookmark className="h-4 w-4" aria-hidden />
          )}
        </button>
      )}
    </article>
  );
}
