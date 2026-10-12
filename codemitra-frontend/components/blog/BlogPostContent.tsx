'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  ChevronLeft,
  ChevronRight,
  Eye,
  Tag,
} from 'lucide-react';
import type { BlogPost, AdjacentPost } from '@/types';
import { formatDate, getInitials, cn } from '@/lib/utils';
import { useRelatedPosts } from '@/hooks/useBlog';
import { BlogMarkdown } from '@/components/blog/BlogMarkdown';
import { TableOfContents, parseHeadings } from '@/components/blog/TableOfContents';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { RelatedArticles } from '@/components/blog/RelatedArticles';
import { AuthorBio } from '@/components/blog/AuthorBio';
import { BookmarkButton } from '@/components/blog/BookmarkButton';

interface BlogPostContentProps {
  post: BlogPost;
  adjacent: { previous: AdjacentPost | null; next: AdjacentPost | null } | null;
}

function AdjacentCard({
  post,
  direction,
}: {
  post: AdjacentPost | null;
  direction: 'previous' | 'next';
}) {
  if (!post) return null;
  const isNext = direction === 'next';
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        'group flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-500/40 hover:shadow-card dark:border-white/[0.08] dark:bg-ink-850 dark:hover:border-brand-500/30',
        isNext && 'text-right'
      )}
    >
      <span
        className={cn(
          'text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400',
          isNext && 'flex items-center justify-end gap-1'
        )}
      >
        {isNext ? (
          <>
            Next article
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </>
        ) : (
          <>
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            Previous article
          </>
        )}
      </span>
      <span className="text-sm font-semibold leading-snug text-slate-950 transition-colors group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
        {post.title}
      </span>
    </Link>
  );
}

export function BlogPostContent({ post, adjacent }: BlogPostContentProps) {
  const headings = parseHeadings(post.content || '');
  const { data: relatedPosts = [] } = useRelatedPosts(post.slug);

  const displayDate = post.publishedAt || post.createdAt;

  return (
    <div className="pb-16">
      <ReadingProgress />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Back link */}
        <div className="pt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to blog
          </Link>
        </div>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_260px]">
          {/* Main article column */}
          <article className="min-w-0">
            {/* Header */}
            <header>
              <div className="flex flex-wrap items-center gap-2">
                {post.categoryName && (
                  <Link
                    href={`/blog?category=${encodeURIComponent(post.categorySlug || '')}`}
                    className="rounded-md bg-brand-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700 ring-1 ring-brand-500/20 transition hover:bg-brand-500/15 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25"
                  >
                    {post.categoryName}
                  </Link>
                )}
                {post.isFeatured && (
                  <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
                    Featured
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15] dark:text-white">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                  {post.excerpt}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-2">
                  {post.authorAvatarUrl ? (
                    <Image
                      src={post.authorAvatarUrl}
                      alt={`${post.authorName} avatar`}
                      width={28}
                      height={28}
                      className="rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/10 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-500/20 dark:text-brand-300"
                    >
                      {getInitials(post.authorName)}
                    </span>
                  )}
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {post.authorName}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  {displayDate ? formatDate(displayDate) : 'Upcoming'}
                </span>
                {post.readTimeMinutes != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4" aria-hidden />
                    {post.readTimeMinutes} min read
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-4 w-4" aria-hidden />
                  {post.viewCount} views
                </span>
              </div>
            </header>

            {/* Cover image */}
            {post.coverImageUrl && (
              <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-ink-800">
                <Image
                  src={post.coverImageUrl}
                  alt={`${post.title} cover image`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 840px"
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Tag className="h-4 w-4 text-slate-400" aria-hidden />
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-500/40 hover:text-brand-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:text-brand-300"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-slate-200 py-4 dark:border-white/[0.08]">
              <ShareButtons title={post.title} slug={post.slug} />
              <BookmarkButton postId={post.id} />
            </div>

            {/* Content */}
            <div className="mt-8">
              <BlogMarkdown content={post.content || post.excerpt || ''} />
            </div>

            {/* Author */}
            <AuthorBio post={post} className="mt-12" />

            {/* Adjacent navigation */}
            <nav
              aria-label="Adjacent articles"
              className="mt-12 grid gap-4 sm:grid-cols-2"
            >
              <AdjacentCard post={adjacent?.previous ?? null} direction="previous" />
              <AdjacentCard post={adjacent?.next ?? null} direction="next" />
            </nav>
          </article>

          {/* TOC sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <TableOfContents headings={headings} />
            </div>
          </aside>
        </div>

        {/* Related articles */}
        <RelatedArticles
          posts={relatedPosts}
          currentSlug={post.slug}
          className="mt-16"
        />
      </div>
    </div>
  );
}
