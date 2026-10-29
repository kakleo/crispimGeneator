import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(`User-agent: *\nDisallow: /\n`, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
};
