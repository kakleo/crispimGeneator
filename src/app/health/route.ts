import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  let payloadOk = false;
  let payloadMessage = 'Payload CMS connected';

  try {
    const payload = await getPayloadClient();
    payloadOk = !!payload;
  } catch (err: any) {
    payloadMessage = err?.message || 'Payload error';
  }

  const responsePayload = {
    status: payloadOk ? 'ok' : 'degraded',
    service: 'tour-proposal-generator',
    timestamp: new Date().toISOString(),
    database: {
      provider: 'payload-cms-sqlite',
      status: payloadOk ? 'connected' : 'error',
      message: payloadMessage,
    },
  };

  return NextResponse.json(responsePayload, {
    status: payloadOk ? 200 : 503,
  });
}
