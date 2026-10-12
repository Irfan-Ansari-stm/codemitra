import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBlogPostBySlug } from '@/lib/server-api';
import {
  buildBlogPostMetadata,
  buildBlogPostingJsonLd,
} from '@/lib/seo';
import { BlogPostContent } from '@/components/blog/BlogPostContent';

interface BlogPostPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const result = await getBlogPostBySlug(params.slug);
  if (!result || !result.post) {
    return { title: 'Article not found' };
  }
  return buildBlogPostMetadata(result.post);
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const result = await getBlogPostBySlug(params.slug);

  if (!result || !result.post) {
    notFound();
  }

  const { post, adjacent } = result;
  const jsonLd = buildBlogPostingJsonLd(post);

  return (
    <div className="min-h-screen bg-white text-slate-950 antialiased dark:bg-ink-950 dark:text-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostContent post={post} adjacent={adjacent} />
    </div>
  );
}
