import type { MetadataRoute } from 'next';
import { getBlogPostsForSitemap, getBlogCategories } from '@/lib/server-api';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${APP_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/problems`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/courses`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${APP_URL}/register`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Blog article URLs come from the real API. When the API is
  // unreachable during generation, only static routes are emitted.
  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await getBlogPostsForSitemap();
    postRoutes = posts.map((post) => ({
      url: `${APP_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    postRoutes = [];
  }

  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await getBlogCategories();
    categoryRoutes = categories.map((category) => ({
      url: `${APP_URL}/blog?category=${encodeURIComponent(category.slug)}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.5,
    }));
  } catch {
    categoryRoutes = [];
  }

  return [...staticRoutes, ...postRoutes, ...categoryRoutes];
}
