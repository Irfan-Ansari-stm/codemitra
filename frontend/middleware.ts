import { NextRequest, NextResponse } from 'next/server';

const workspaceRoutes = new Set([
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

const reservedPrefixes = new Set([
  'about',
  'api',
  'apply-institution',
  'blog',
  'contact',
  'cookies',
  'courses',
  'dashboard',
  'faqs',
  'forgot-password',
  'ide',
  'institution',
  'login',
  'my-learning',
  'platform',
  'privacy',
  'problems',
  'register',
  'resources',
  'status',
  'super-admin',
  'terms',
]);

export function middleware(request: NextRequest) {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  const [tenantSlug, route, ...rest] = segments;

  if (!tenantSlug || !route || reservedPrefixes.has(tenantSlug) || !workspaceRoutes.has(route)) {
    return NextResponse.next();
  }

  const rewrittenUrl = request.nextUrl.clone();
  rewrittenUrl.pathname = `/institution/${[route, ...rest].join('/')}`;
  return NextResponse.rewrite(rewrittenUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
