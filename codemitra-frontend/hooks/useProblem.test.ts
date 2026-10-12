import { describe, expect, it } from 'vitest';
import { buildProblemParams } from '@/hooks/useProblem';

describe('buildProblemParams', () => {
  it('applies defaults for page and limit', () => {
    expect(buildProblemParams({})).toEqual({ page: 1, limit: 20 });
  });

  it('omits neutral filter values so cache keys stay stable', () => {
    const params = buildProblemParams({
      difficulty: 'all',
      status: 'all',
      search: '',
      tags: [],
      bookmarked: false,
      page: 3,
      limit: 10,
    });
    expect(params).toEqual({ page: 3, limit: 10 });
    expect(params).not.toHaveProperty('difficulty');
    expect(params).not.toHaveProperty('status');
    expect(params).not.toHaveProperty('search');
    expect(params).not.toHaveProperty('tags');
    expect(params).not.toHaveProperty('bookmarked');
  });

  it('keeps meaningful filter values', () => {
    const params = buildProblemParams({
      scope: 'institution',
      difficulty: 'medium',
      status: 'solved',
      search: 'binary',
      tags: ['dp', 'graphs'],
      bookmarked: true,
      sort: 'acceptance_rate',
      order: 'desc',
      page: 2,
      limit: 50,
    });
    expect(params).toEqual({
      scope: 'institution',
      difficulty: 'medium',
      status: 'solved',
      search: 'binary',
      tags: ['dp', 'graphs'],
      bookmarked: true,
      sort: 'acceptance_rate',
      order: 'desc',
      page: 2,
      limit: 50,
    });
  });

  it('produces a deterministic key order for identical inputs', () => {
    const first = buildProblemParams({ search: 'a', difficulty: 'easy', page: 1 });
    const second = buildProblemParams({ difficulty: 'easy', search: 'a', page: 1 });
    expect(Object.keys(first)).toEqual(Object.keys(second));
  });
});
