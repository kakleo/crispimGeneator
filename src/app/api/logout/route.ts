import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const acceptsJson = request.headers.get('accept')?.includes('application/json');

  if (acceptsJson) {
    const response = NextResponse.json({ success: true, redirect: '/login' });
    response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
    return response;
  }

  const response = NextResponse.redirect(new URL('/login', request.url), 303);
  response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url), 303);
  response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return response;
}
