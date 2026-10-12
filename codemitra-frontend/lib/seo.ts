import type { Metadata } from 'next';
import type { BlogPost } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'CodeVerse';

export function blogPostUrl(slug: string): string {
  return `${APP_URL}/blog/${slug}`;
}

export function blogListUrl(): string {
  return `${APP_URL}/blog`;
}

/**
 * Per-article SEO metadata. Falls back to the excerpt (or a
 * truncated content snippet) when the author did not supply a
 * dedicated SEO description.
 */
export function buildBlogPostMetadata(post: BlogPost): Metadata {
  const title = post.seoTitle?.trim() || post.title;
  const description =
    post.seoDescription?.trim() ||
    post.excerpt?.trim() ||
    stripMarkdown(post.content).slice(0, 155).trim();
  const url = blogPostUrl(post.slug);
  const image = post.coverImageUrl || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: image ? [{ url: image }] : undefined,
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt || undefined,
      authors: post.authorName ? [post.authorName] : undefined,
      tags: post.tags?.length ? post.tags : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * JSON-LD structured data for a blog article. Only includes
 * fields that are present on the real article — no invented
 * publisher details or dates.
 */
export function buildBlogPostingJsonLd(post: BlogPost): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': blogPostUrl(post.slug),
    },
    url: blogPostUrl(post.slug),
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
  };

  if (post.excerpt) jsonLd.description = post.excerpt;
  if (post.coverImageUrl) {
    jsonLd.image = [post.coverImageUrl];
  }
  if (post.tags?.length) jsonLd.keywords = post.tags.join(', ');
  if (post.readTimeMinutes) {
    jsonLd.timeRequired = `PT${post.readTimeMinutes}M`;
  }

  return jsonLd;
}

/** Listing-page metadata. */
export function buildBlogListMetadata(): Metadata {
  return {
    title: 'Blog',
    description:
      'Insights, tutorials, and engineering notes from the CodeVerse team — learn coding, problem solving, and teaching with interactive examples.',
    alternates: {
      canonical: blogListUrl(),
    },
    openGraph: {
      type: 'website',
      title: 'Blog | CodeVerse',
      description:
        'Insights, tutorials, and engineering notes from the CodeVerse team.',
      url: blogListUrl(),
      siteName: SITE_NAME,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*`\-[\]()!|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
