import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAME, verifySessionToken } from './lib/auth/session';

const PUBLIC_EXACT_PATHS = new Set([
  '/login',
  '/api/login',
  '/health',
  '/api/diag',
  '/robots.txt',
  '/favicon.ico',
]);

const PUBLIC_PREFIXES = ['/_next/', '/fonts/', '/admin'];

function isPublicAsset(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  // Check common asset extensions
  if (/\.(css|js|ttf|woff|woff2|png|jpg|jpeg|svg|gif|webp|ico)$/i.test(pathname)) {
    return true;
  }
  return false;
}

function sanitizeNextUrl(rawUrl: string): string {
  // Allow only relative paths on the same site starting with '/' but not '//'
  if (rawUrl.startsWith('/') && !rawUrl.startsWith('//') && !rawUrl.includes('\\')) {
    return rawUrl;
  }
  return '/';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths & static assets
  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  // Check session cookie
  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
  const authResult = await verifySessionToken(sessionCookie);

  if (!authResult.valid) {
    // API and PDF routes receive 401 Unauthorized (FR-27a)
    if (pathname.startsWith('/api/') || pathname.endsWith('/pdf')) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Page requests redirect to /login with sanitized next parameter
    const nextPath = sanitizeNextUrl(pathname + request.nextUrl.search);
    const loginTarget = nextPath === '/' ? '/login' : `/login?next=${encodeURIComponent(nextPath)}`;
    return NextResponse.redirect(new URL(loginTarget, request.url), 302);
  }

  const response = NextResponse.next();

  // FR-28: Internal app pages and proposals are not publicly indexed
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
