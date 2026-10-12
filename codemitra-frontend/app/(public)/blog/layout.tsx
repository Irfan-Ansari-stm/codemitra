import type { Metadata } from 'next';
import { buildBlogListMetadata } from '@/lib/seo';

export const metadata: Metadata = buildBlogListMetadata();

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
