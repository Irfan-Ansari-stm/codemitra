import { describe, expect, it } from 'vitest';
import { buildBlogParams } from '@/hooks/useBlog';

describe('buildBlogParams', () => {
  it('applies defaults for page and limit', () => {
    expect(buildBlogParams({})).toEqual({ page: 1, limit: 12 });
  });

  it('omits neutral filter values so cache keys stay stable', () => {
    const params = buildBlogParams({
      search: '',
      category: 'all',
      tag: 'all',
      sort: 'newest',
      featured: false,
      page: 1,
      limit: 12,
    });
    expect(params).toEqual({ page: 1, limit: 12 });
    expect(params).not.toHaveProperty('search');
    expect(params).not.toHaveProperty('category');
    expect(params).not.toHaveProperty('tag');
    expect(params).not.toHaveProperty('sort');
    expect(params).not.toHaveProperty('featured');
  });

  it('keeps meaningful filter values', () => {
    const params = buildBlogParams({
      search: 'algorithms',
      category: 'tutorials',
      tag: 'python',
      sort: 'popular',
      featured: true,
      page: 2,
      limit: 9,
    });
    expect(params).toEqual({
      search: 'algorithms',
      category: 'tutorials',
      tag: 'python',
      sort: 'popular',
      featured: true,
      page: 2,
      limit: 9,
    });
  });

  it('trims whitespace-only search to undefined', () => {
    const params = buildBlogParams({ search: '   ' });
    expect(params).not.toHaveProperty('search');
  });

  it('produces a deterministic key order for identical inputs', () => {
    const first = buildBlogParams({ search: 'a', category: 'c', page: 1 });
    const second = buildBlogParams({ category: 'c', search: 'a', page: 1 });
    expect(Object.keys(first)).toEqual(Object.keys(second));
  });
});
