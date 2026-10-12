import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CalendarDays, Clock3 } from 'lucide-react';
import type { BlogPost } from '@/types';
import { formatDate, getInitials } from '@/lib/utils';

interface RelatedArticlesProps {
  posts: BlogPost[];
  currentSlug: string;
  className?: string;
}

export function RelatedArticles({
  posts,
  currentSlug,
  className,
}: RelatedArticlesProps) {
  const related = posts.filter((post) => post.slug !== currentSlug).slice(0, 3);

  if (!related.length) return null;

  return (
    <section
      aria-label="Related articles"
      className={className}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
          Related articles
        </h2>
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          View all
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {related.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-card dark:border-white/[0.08] dark:bg-ink-850 dark:hover:border-brand-500/30"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-ink-800">
              {post.coverImageUrl ? (
                <Image
                  src={post.coverImageUrl}
                  alt={`${post.title} cover image`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              ) : (
                <div
                  aria-hidden
                  className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500/15 to-transparent dark:from-brand-500/20"
                >
                  <span className="font-mono text-3xl font-bold text-brand-500/40 dark:text-brand-400/30">
                    {getInitials(post.title).slice(0, 1)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="text-sm font-semibold leading-snug text-slate-950 transition-colors group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                {post.title}
              </h3>
              <div className="mt-auto flex items-center gap-3 pt-3 text-[11px] text-slate-500 dark:text-slate-400">
                {post.publishedAt && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" aria-hidden />
                    {formatDate(post.publishedAt)}
                  </span>
                )}
                {post.readTimeMinutes != null && (
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3 w-3" aria-hidden />
                    {post.readTimeMinutes} min
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
