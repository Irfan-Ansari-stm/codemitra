import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, problemApi } from '@/lib/api';

function mockList() {
  return vi
    .spyOn(api, 'get')
    .mockResolvedValue({ data: { success: true, data: [], total: 0 } } as any);
}

describe('problemApi.list', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serializes the tags array as a comma-separated string', async () => {
    const getSpy = mockList();

    await problemApi.list({
      scope: 'public',
      tags: ['arrays', 'hashing'],
      page: 1,
      limit: 20,
    });

    expect(getSpy).toHaveBeenCalledWith('/problems', {
      params: {
        scope: 'public',
        tags: 'arrays,hashing',
        page: 1,
        limit: 20,
      },
    });
  });

  it('serializes a single tag without array brackets', async () => {
    const getSpy = mockList();

    await problemApi.list({ scope: 'institution', tags: ['dp'], page: 2, limit: 10 });

    expect(getSpy).toHaveBeenCalledWith('/problems', {
      params: { scope: 'institution', tags: 'dp', page: 2, limit: 10 },
    });
  });

  it('omits tags when none are selected', async () => {
    const getSpy = mockList();

    await problemApi.list({ scope: 'public', page: 1, limit: 20 });

    const params = getSpy.mock.calls[0][1].params;
    expect(params).toMatchObject({ scope: 'public', page: 1, limit: 20 });
    expect(params.tags).toBeUndefined();
  });
});
