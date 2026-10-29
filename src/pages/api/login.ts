import type { APIRoute } from 'astro';
import {
  verifyCredentials,
  createSessionToken,
  COOKIE_NAME,
  SESSION_DURATION_HOURS,
} from '../../lib/auth';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
} from '../../lib/auth/rate-limiter';

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const ip = clientAddress || request.headers.get('x-forwarded-for') || '127.0.0.1';

  // Check rate limit first (FR-27e)
  const rateStatus = checkRateLimit(ip);
  if (rateStatus.isLocked) {
    const minutes = Math.ceil((rateStatus.retryAfterSeconds || 60) / 60);
    return new Response(
      JSON.stringify({
        error: `Too many failed login attempts. Please try again in ${minutes} minute(s).`,
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = await request.json();
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const nextUrl = String(body.next || '/');

    if (!username || !password) {
      recordFailedAttempt(ip);
      return new Response(
        JSON.stringify({ error: 'Incorrect username or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const isValid = await verifyCredentials(username, password);
    if (!isValid) {
      recordFailedAttempt(ip);
      // FR-27b: Generic error message, never reveals which field was wrong
      return new Response(
        JSON.stringify({ error: 'Incorrect username or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Reset rate limiter on successful authentication
    resetAttempts(ip);

    // Create session token
    const token = await createSessionToken(username);

    // Determine cookie options (FR-27d)
    const isProduction = process.env.NODE_ENV === 'production';
    cookies.set(COOKIE_NAME, token, {
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: SESSION_DURATION_HOURS * 3600,
    });

    // Sanitize redirect target (FR-27a)
    let safeRedirect = '/';
    if (nextUrl.startsWith('/') && !nextUrl.startsWith('//') && !nextUrl.includes('\\')) {
      safeRedirect = nextUrl;
    }

    return new Response(
      JSON.stringify({ success: true, redirect: safeRedirect }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
