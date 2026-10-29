import { NextRequest, NextResponse } from 'next/server';
import {
  verifyCredentials,
  createSessionToken,
  COOKIE_NAME,
  SESSION_DURATION_HOURS,
  getStaffUsers,
} from '@/lib/auth';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
} from '@/lib/auth/rate-limiter';

export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  // Check rate limit first (FR-27e)
  const rateStatus = checkRateLimit(ip);
  if (rateStatus.isLocked) {
    const minutes = Math.ceil((rateStatus.retryAfterSeconds || 60) / 60);
    return NextResponse.json(
      { error: `Too many failed login attempts. Please try again in ${minutes} minute(s).` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const nextUrl = String(body.next || '/');

    if (!username || !password) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { error: 'Incorrect username or password' },
        { status: 401 }
      );
    }

    const isValid = await verifyCredentials(username, password);
    if (!isValid) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { error: 'Incorrect username or password' },
        { status: 401 }
      );
    }

    // Reset rate limiter on successful authentication
    resetAttempts(ip);

    // Create session token
    const token = await createSessionToken(username);

    // Sanitize redirect target (FR-27a)
    let safeRedirect = '/';
    if (nextUrl.startsWith('/') && !nextUrl.startsWith('//') && !nextUrl.includes('\\')) {
      safeRedirect = nextUrl;
    }

    const response = NextResponse.json(
      { success: true, redirect: safeRedirect },
      { status: 200 }
    );

    // Set HTTP-only session cookie (FR-27d)
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set(COOKIE_NAME, token, {
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: SESSION_DURATION_HOURS * 3600,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
