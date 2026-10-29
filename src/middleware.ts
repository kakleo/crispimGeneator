import { defineMiddleware } from 'astro:middleware';
import { COOKIE_NAME, verifySessionToken } from './lib/auth';

const PUBLIC_EXACT_PATHS = new Set(['/login', '/api/login', '/health', '/api/diag', '/robots.txt', '/favicon.ico']);
const PUBLIC_PREFIXES = ['/_astro/', '/fonts/'];

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

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, cookies, redirect } = context;
  const pathname = url.pathname;

  // Allow public paths
  if (isPublicAsset(pathname)) {
    return next();
  }

  // Check session cookie
  const sessionCookie = cookies.get(COOKIE_NAME)?.value;
  const authResult = await verifySessionToken(sessionCookie);

  if (!authResult.valid) {
    // API and PDF routes receive 401 Unauthorized (FR-27a)
    if (pathname.startsWith('/api/') || pathname.endsWith('/pdf')) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Please log in.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Page requests redirect to /login with sanitized next parameter
    const nextPath = sanitizeNextUrl(url.pathname + url.search);
    const loginTarget = nextPath === '/' ? '/login' : `/login?next=${encodeURIComponent(nextPath)}`;
    return new Response(null, {
      status: 302,
      headers: {
        Location: loginTarget,
      },
    });
  }

  // Set user on locals for pages/components to access if needed
  context.locals.user = authResult.username;

  const response = await next();

  // FR-28: Proposal URLs and internal app pages are not publicly indexed
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');

  return response;
});
