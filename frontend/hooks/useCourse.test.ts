import { describe, expect, it } from 'vitest';
import { buildCourseParams } from '@/hooks/useCourse';

describe('buildCourseParams', () => {
  it('applies the default page', () => {
    expect(buildCourseParams({})).toEqual({ page: 1 });
  });

  it('omits neutral filter values so cache keys stay stable', () => {
    const params = buildCourseParams({
      search: '',
      language: '',
      status: undefined,
      sort: undefined,
      page: 3,
      limit: 9,
    });
    expect(params).toEqual({ page: 3, limit: 9 });
    expect(params).not.toHaveProperty('search');
    expect(params).not.toHaveProperty('language');
    expect(params).not.toHaveProperty('status');
    expect(params).not.toHaveProperty('sort');
  });

  it('keeps meaningful filter values', () => {
    const params = buildCourseParams({
      search: 'algorithms',
      language: 'Python',
      status: 'published',
      sort: 'popular',
      order: 'desc',
      page: 2,
      limit: 18,
    });
    expect(params).toEqual({
      search: 'algorithms',
      language: 'Python',
      status: 'published',
      sort: 'popular',
      order: 'desc',
      page: 2,
      limit: 18,
    });
  });

  it('produces a deterministic key order for identical inputs', () => {
    const first = buildCourseParams({ search: 'a', language: 'Python', page: 1 });
    const second = buildCourseParams({ language: 'Python', search: 'a', page: 1 });
    expect(Object.keys(first)).toEqual(Object.keys(second));
  });
});
