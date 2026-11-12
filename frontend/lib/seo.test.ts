import { describe, expect, it } from 'vitest';
import {
  buildBlogPostingJsonLd,
  buildBlogPostMetadata,
  blogPostUrl,
} from '@/lib/seo';
import type { BlogPost } from '@/types';

const basePost: BlogPost = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Learning Algorithms by Building',
  slug: 'learning-algorithms-by-building',
  excerpt: 'A practical introduction to problem solving.',
  content: '# Learn by doing\n\nStart with a small problem.',
  coverImageUrl: 'https://example.com/cover.png',
  tags: ['algorithms', 'learning'],
  status: 'published',
  isFeatured: true,
  viewCount: 42,
  readTimeMinutes: 6,
  publishedAt: '2026-01-15T10:00:00.000Z',
  seoTitle: 'Learning Algorithms — CodeVerse',
  seoDescription: 'A practical introduction to problem solving.',
  authorId: '22222222-2222-2222-2222-222222222222',
  authorName: 'A. Rahman',
  authorAvatarUrl: null,
  authorBio: 'Educator',
  categoryId: null,
  categoryName: 'Tutorials',
  categorySlug: 'tutorials',
  createdAt: '2026-01-14T10:00:00.000Z',
  updatedAt: '2026-01-16T10:00:00.000Z',
};

describe('buildBlogPostingJsonLd', () => {
  it('produces valid BlogPosting structured data', () => {
    const jsonLd = buildBlogPostingJsonLd(basePost);
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('BlogPosting');
    expect(jsonLd.headline).toBe(basePost.title);
    expect(jsonLd.author).toEqual({
      '@type': 'Person',
      name: 'A. Rahman',
    });
    expect(jsonLd.datePublished).toBe(basePost.publishedAt);
    expect(jsonLd.dateModified).toBe(basePost.updatedAt);
    expect(jsonLd.image).toEqual([basePost.coverImageUrl]);
    expect(jsonLd.keywords).toBe('algorithms, learning');
    expect(jsonLd.timeRequired).toBe('PT6M');
  });

  it('uses the canonical article URL', () => {
    const jsonLd = buildBlogPostingJsonLd(basePost);
    expect(jsonLd.url).toBe(blogPostUrl(basePost.slug));
    const mainEntity = jsonLd.mainEntityOfPage as { '@id': string };
    expect(mainEntity['@id']).toBe(blogPostUrl(basePost.slug));
  });

  it('falls back to createdAt when publishedAt is missing', () => {
    const jsonLd = buildBlogPostingJsonLd({
      ...basePost,
      publishedAt: null,
    });
    expect(jsonLd.datePublished).toBe(basePost.createdAt);
  });

  it('omits optional fields that are not present', () => {
    const jsonLd = buildBlogPostingJsonLd({
      ...basePost,
      excerpt: null,
      coverImageUrl: null,
      tags: [],
      readTimeMinutes: null,
    });
    expect(jsonLd).not.toHaveProperty('description');
    expect(jsonLd).not.toHaveProperty('image');
    expect(jsonLd).not.toHaveProperty('keywords');
    expect(jsonLd).not.toHaveProperty('timeRequired');
  });
});

describe('buildBlogPostMetadata', () => {
  it('uses seoTitle and seoDescription when provided', () => {
    const metadata = buildBlogPostMetadata(basePost);
    expect(metadata.title).toBe('Learning Algorithms — CodeVerse');
    expect(metadata.description).toBe(
      'A practical introduction to problem solving.'
    );
    expect(metadata.alternates?.canonical).toBe(
      blogPostUrl(basePost.slug)
    );
  });

  it('falls back to title and excerpt', () => {
    const metadata = buildBlogPostMetadata({
      ...basePost,
      seoTitle: null,
      seoDescription: null,
    });
    expect(metadata.title).toBe(basePost.title);
    expect(metadata.description).toBe(basePost.excerpt);
  });

  it('derives a description from content when excerpt is missing', () => {
    const metadata = buildBlogPostMetadata({
      ...basePost,
      seoTitle: null,
      seoDescription: null,
      excerpt: null,
    });
    expect(metadata.description).toBe('Learn by doing Start with a small problem.');
  });

  it('sets article open graph type and dates', () => {
    const metadata = buildBlogPostMetadata(basePost);
    const openGraph = metadata.openGraph as
      | { type?: string; publishedTime?: string; modifiedTime?: string; images?: unknown }
      | undefined;
    expect(openGraph?.type).toBe('article');
    expect(openGraph?.publishedTime).toBe(basePost.publishedAt);
    expect(openGraph?.modifiedTime).toBe(basePost.updatedAt);
    expect(openGraph?.images).toEqual([{ url: basePost.coverImageUrl }]);
  });

  it('marks the page as indexable', () => {
    const metadata = buildBlogPostMetadata(basePost);
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });
});
