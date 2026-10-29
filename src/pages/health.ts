import type { APIRoute } from 'astro';
import { checkSheetsHealth } from '../lib/sheets/client';

export const GET: APIRoute = async () => {
  const sheetsHealth = await checkSheetsHealth();

  const responsePayload = {
    status: sheetsHealth.ok ? 'ok' : 'degraded',
    service: 'tour-proposal-generator',
    timestamp: new Date().toISOString(),
    sheets: {
      status: sheetsHealth.ok ? 'connected' : 'error',
      mode: sheetsHealth.mode,
      message: sheetsHealth.message,
    },
  };

  return new Response(JSON.stringify(responsePayload, null, 2), {
    status: sheetsHealth.ok ? 200 : 503,
    headers: { 'Content-Type': 'application/json' },
  });
};
