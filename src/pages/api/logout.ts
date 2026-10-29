import type { APIRoute } from 'astro';
import { COOKIE_NAME } from '../../lib/auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(COOKIE_NAME, { path: '/' });
  return new Response(JSON.stringify({ success: true, redirect: '/login' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(COOKIE_NAME, { path: '/' });
  return redirect('/login');
};
