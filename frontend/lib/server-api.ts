import { cache } from 'react';
import { camelCaseKeys } from '@/lib/case';
import type {
  BlogPost,
  BlogPostDetailResponse,
  BlogListResponse,
  BlogCategory,
  BlogTag,
  AdjacentPost,
} from '@/types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface FetchOptions {
  /** Revalidate interval in seconds. 0 disables caching. */
  revalidate?: number;
}

async function fetchJson<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T | null> {
  const url = `${BASE_URL}${path}`;
  try {
    const response = await fetch(url, {
      // Blog content is dynamic; always fetch fresh on the server.
      cache: 'no-store',
      next:
        options.revalidate !== undefined
          ? { revalidate: options.revalidate }
          : undefined,
    });
    if (!response.ok) return null;
    const json = await response.json();
    return camelCaseKeys(json) as T;
  } catch {
    // API unreachable during SSR — the page falls back to its
    // loading / error state on the client.
    return null;
  }
}

/**
 * Fetch a single published article by slug. Deduplicated per
 * request so generateMetadata and the page component share one
 * upstream call. Returns null when the article is missing,
 * unpublished, or the API is unreachable.
 */
interface BlogPostBySlugResult {
  post: BlogPost | null;
  adjacent: { previous: AdjacentPost | null; next: AdjacentPost | null } | null;
}

export const getBlogPostBySlug = cache(
  async (slug: string): Promise<BlogPostBySlugResult | null> => {
    const data = await fetchJson<BlogPostDetailResponse>(
      `/blog/slug/${encodeURIComponent(slug)}`
    );
    if (!data || !data.success || !data.data) return null;
    return {
      post: data.data,
      adjacent: data.adjacent ?? null,
    };
  }
);

/** Fetch the published article list (used by the sitemap). */
export const getBlogPostsForSitemap = cache(
  async (): Promise<BlogPost[]> => {
    const data = await fetchJson<BlogListResponse>('/blog?limit=1000');
    if (!data || !data.posts) return [];
    return data.posts;
  }
);

/** Fetch blog categories with published post counts. */
export const getBlogCategories = cache(async (): Promise<BlogCategory[]> => {
  const data = await fetchJson<{ success: boolean; data: BlogCategory[] }>(
    '/blog/categories'
  );
  if (!data || !data.success) return [];
  return data.data;
});

/** Fetch all tags with published post counts. */
export const getBlogTags = cache(async (): Promise<BlogTag[]> => {
  const data = await fetchJson<{ success: boolean; data: BlogTag[] }>(
    '/blog/tags'
  );
  if (!data || !data.success) return [];
  return data.data;
});
