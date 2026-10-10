'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, CalendarDays, Clock3 } from 'lucide-react';
import { blogApi } from '@/lib/api';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();

  const query = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => blogApi.getBySlug(slug).then((r) => r.data.data),
    enabled: !!slug,
  });

  const post = query.data;

  return (
    <div className="pb-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/blog" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200">
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>

        {query.isLoading ? (
          <div className="h-64 animate-pulse rounded-3xl border border-slate-700 bg-slate-800/60" />
        ) : query.error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200" role="alert">
            Unable to load this article right now.
          </div>
        ) : post ? (
          <article className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/80">
            <header className="border-b border-slate-700 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 p-6 md:p-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-blue-200">
                {post.category || 'Insight'}
              </div>
              <h1 className="text-3xl font-bold text-white md:text-5xl">{post.title}</h1>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                {post.createdAt && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-blue-300" />
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                )}
                {post.readTimeMinutes && (
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-cyan-300" />
                    {post.readTimeMinutes} min read
                  </span>
                )}
              </div>
            </header>

            <div className="flex flex-wrap gap-2 px-6 pt-6 md:px-8">
              {(post.tags || []).map((tag: string) => (
                <span key={tag} className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs uppercase tracking-[0.1em] text-slate-300">
                  {tag}
                </span>
              ))}
            </div>

            <div className="prose prose-invert max-w-none px-6 py-8 md:px-8 md:py-10">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content || post.excerpt || post.summary || 'No article content available yet.'}</ReactMarkdown>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}
