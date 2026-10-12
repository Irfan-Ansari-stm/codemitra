import { describe, expect, it } from 'vitest';
import { institutionHref, isInstitutionRouteSegment } from '@/lib/workspace';

describe('institution workspace paths', () => {
  it('prefixes institution routes with the institution slug', () => {
    expect(institutionHref('/institution/dashboard', 'demo-college')).toBe('/demo-college/dashboard');
    expect(institutionHref('/institution/problems/123/solve', 'demo-college')).toBe(
      '/demo-college/problems/123/solve'
    );
  });

  it('leaves routes unchanged until an institution slug is available', () => {
    expect(institutionHref('/institution/dashboard')).toBe('/institution/dashboard');
  });

  it('identifies supported institution route roots', () => {
    expect(isInstitutionRouteSegment('problems')).toBe(true);
    expect(isInstitutionRouteSegment('courses')).toBe(true);
    expect(isInstitutionRouteSegment('unknown')).toBe(false);
  });
});
