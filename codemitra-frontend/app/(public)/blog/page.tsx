'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpenText, Clock3, NotebookPen } from 'lucide-react';
import { blogApi } from '@/lib/api';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  summary?: string;
  content?: string;
  category?: string;
  readTimeMinutes?: number;
  createdAt?: string;
  tags?: string[];
}

export default function BlogPage() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: () => blogApi.list().then((r) => (r.data.data ?? []) as BlogPost[]),
  });

  const featured = data[0];

  return (
    <div className="space-y-8 pb-12">
      <header className="rounded-3xl border border-slate-700 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-8 shadow-xl shadow-slate-950/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">Learning journal</p>
            <h1 className="mt-3 text-3xl font-bold text-white md:text-5xl">CodeVerse Blog</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-200">
            <NotebookPen className="h-4 w-4 text-blue-300" />
            {data.length} published stories
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200" role="alert">
          Unable to load the latest articles. Please refresh the page or check the API connection.
        </div>
      )}

      {featured && !isLoading && (
        <section className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/80">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-blue-200">
                <BookOpenText className="h-3.5 w-3.5" />
                Featured article
              </div>
              <h2 className="text-2xl font-bold text-white md:text-3xl">{featured.title}</h2>
              <p className="mt-4 max-w-2xl text-slate-300">
                {featured.excerpt || featured.summary || featured.content?.slice(0, 180) || 'Explore practical lessons for learners and educators.'}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                {featured.category && <span>{featured.category}</span>}
                {featured.readTimeMinutes && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4" />
                    {featured.readTimeMinutes} min read
                  </span>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {(featured.tags || []).slice(0, 4).map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>

              <Link
                href={`/blog/${featured.slug}`}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
              >
                Read article
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-5">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Fresh insights</span>
                <span>{featured.category || 'Education'}</span>
              </div>
              <div className="mt-5 space-y-4">
                {(data.slice(1, 4)).map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="block rounded-2xl border border-slate-700 bg-slate-900 p-4 transition hover:border-blue-500/40 hover:bg-slate-800">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-blue-300">{post.category || 'Article'}</div>
                    <h3 className="mt-2 text-lg font-semibold text-white">{post.title}</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      {post.excerpt || post.summary || 'Learn practical, actionable strategies for coding education.'}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-3xl border border-slate-700 bg-slate-800/60" />
          ))}
        </div>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.map((post) => (
            <article key={post.id} className="group rounded-3xl border border-slate-700 bg-slate-900/80 p-5 transition hover:-translate-y-1 hover:border-blue-500/40 hover:bg-slate-900">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-slate-400">
                <span>{post.category || 'Insight'}</span>
                <span>{post.readTimeMinutes ? `${post.readTimeMinutes} min` : 'Quick read'}</span>
              </div>

              <h3 className="mt-4 text-xl font-semibold text-white group-hover:text-blue-300">
                {post.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {post.excerpt || post.summary || post.content?.slice(0, 180) || 'Practical guidance for productive programming learning.'}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {(post.tags || []).slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>

              <Link href={`/blog/${post.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-300 transition hover:text-blue-200">
                Read more
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
