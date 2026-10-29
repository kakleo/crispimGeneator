import { NextResponse } from 'next/server';
import { checkSheetsHealth } from '@/lib/sheets/client';

export const dynamic = 'force-dynamic';

export async function GET() {
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

  return NextResponse.json(responsePayload, {
    status: sheetsHealth.ok ? 200 : 503,
  });
}
