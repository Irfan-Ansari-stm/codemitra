const INSTITUTION_ROUTES = new Set([
  'dashboard',
  'courses',
  'problems',
  'assignments',
  'quizzes',
  'students',
  'analytics',
  'notifications',
  'announcements',
  'settings',
]);

export function institutionHref(path: string, tenantSlug?: string): string {
  if (!tenantSlug) return path;
  const relativePath = path.startsWith('/institution')
    ? path.slice('/institution'.length)
    : path;
  return `/${tenantSlug}${relativePath || '/dashboard'}`;
}

export function isInstitutionRouteSegment(segment?: string): boolean {
  return !!segment && INSTITUTION_ROUTES.has(segment);
}
