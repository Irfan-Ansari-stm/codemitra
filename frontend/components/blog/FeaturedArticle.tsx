'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CalendarDays, Clock3, Sparkles } from 'lucide-react';
import type { BlogPost } from '@/types';
import { formatDate, getInitials } from '@/lib/utils';

interface FeaturedArticleProps {
  post: BlogPost;
}

export function FeaturedArticle({ post }: FeaturedArticleProps) {
  return (
    <section
      aria-label="Featured article"
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-white/[0.08] dark:bg-ink-850"
    >
      <div className="grid lg:grid-cols-[1.1fr_1fr]">
        <div className="relative min-h-[220px] overflow-hidden bg-slate-100 dark:bg-ink-800 lg:min-h-[340px]">
          {post.coverImageUrl ? (
            <Image
              src={post.coverImageUrl}
              alt={`${post.title} cover image`}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              priority
            />
          ) : (
            <div
              aria-hidden
              className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500/20 via-brand-500/8 to-transparent dark:from-brand-500/25 dark:via-brand-500/10 dark:to-transparent"
            >
              <span className="font-mono text-7xl font-bold text-brand-500/30 dark:text-brand-400/25">
                {getInitials(post.title).slice(0, 1)}
              </span>
            </div>
          )}
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-sm">
            <Sparkles className="h-3 w-3" aria-hidden />
            Featured
          </span>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {post.categoryName && (
              <span className="rounded-md bg-brand-500/10 px-2.5 py-1 font-semibold uppercase tracking-wider text-brand-700 ring-1 ring-brand-500/20 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25">
                {post.categoryName}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {post.publishedAt ? formatDate(post.publishedAt) : 'Upcoming'}
            </span>
            {post.readTimeMinutes != null && (
              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Clock3 className="h-3.5 w-3.5" aria-hidden />
                {post.readTimeMinutes} min read
              </span>
            )}
          </div>

          <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl dark:text-white">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="mt-3 line-clamp-4 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
              {post.excerpt}
            </p>
          )}

          <div className="mt-5 flex items-center gap-2.5">
            {post.authorAvatarUrl ? (
              <Image
                src={post.authorAvatarUrl}
                alt={`${post.authorName} avatar`}
                width={36}
                height={36}
                className="rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <span
                aria-hidden
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/10 text-xs font-semibold text-brand-700 ring-1 ring-brand-500/20 dark:text-brand-300"
              >
                {getInitials(post.authorName)}
              </span>
            )}
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {post.authorName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Author</p>
            </div>
          </div>

          {post.tags?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {post.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <Link
            href={`/blog/${post.slug}`}
            className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ink-950"
          >
            Read article
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
