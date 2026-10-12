import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArticleCard } from '@/components/blog/ArticleCard';
import type { BlogPost } from '@/types';

// next/image is not implemented in jsdom — render a plain img.
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
  }) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  ),
}));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/hooks/useBlog', () => ({
  useToggleBlogBookmark: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: { user: null }) => unknown) =>
    selector({ user: null }),
}));

const mockPost: BlogPost = {
  id: 'post-1',
  title: 'Mastering Binary Search',
  slug: 'mastering-binary-search',
  excerpt: 'A deep dive into binary search variations.',
  content: '# Binary search\n\nContent here.',
  coverImageUrl: 'https://example.com/binary.png',
  tags: ['algorithms'],
  status: 'published',
  isFeatured: false,
  viewCount: 10,
  readTimeMinutes: 8,
  publishedAt: '2026-02-01T10:00:00.000Z',
  authorId: 'author-1',
  authorName: 'S. Iqbal',
  createdAt: '2026-01-30T10:00:00.000Z',
  updatedAt: '2026-02-01T10:00:00.000Z',
  categoryName: 'Algorithms',
  categorySlug: 'algorithms',
};

describe('ArticleCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the article title, excerpt, and metadata', () => {
    render(<ArticleCard post={mockPost} />);
    expect(screen.getByText('Mastering Binary Search')).toBeInTheDocument();
    expect(
      screen.getByText('A deep dive into binary search variations.')
    ).toBeInTheDocument();
    expect(screen.getByText('S. Iqbal')).toBeInTheDocument();
    expect(screen.getByText('Algorithms')).toBeInTheDocument();
    expect(screen.getByText('8 min')).toBeInTheDocument();
  });

  it('links to the article detail page', () => {
    render(<ArticleCard post={mockPost} />);
    const link = screen.getByRole('link', {
      name: 'Read article: Mastering Binary Search',
    });
    expect(link).toHaveAttribute('href', '/blog/mastering-binary-search');
  });

  it('renders the cover image with meaningful alt text', () => {
    render(<ArticleCard post={mockPost} />);
    const image = screen.getByAltText('Mastering Binary Search cover image');
    expect(image).toHaveAttribute('src', 'https://example.com/binary.png');
  });

  it('renders a fallback when no cover image exists', () => {
    render(<ArticleCard post={{ ...mockPost, coverImageUrl: null }} />);
    expect(
      screen.queryByAltText('Mastering Binary Search cover image')
    ).not.toBeInTheDocument();
  });

  it('renders an author initials avatar when no avatar URL exists', () => {
    render(<ArticleCard post={mockPost} />);
    expect(screen.getByText('SI')).toBeInTheDocument();
  });

  it('shows a featured badge for featured posts', () => {
    render(<ArticleCard post={{ ...mockPost, isFeatured: true }} />);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('does not render a bookmark button for anonymous users', () => {
    render(<ArticleCard post={mockPost} showBookmark />);
    expect(
      screen.queryByRole('button', { name: /bookmark/i })
    ).not.toBeInTheDocument();
  });
});
