import { NextResponse } from 'next/server';
import { getPayloadClient, getAllProposalDocuments } from '@/lib/payload/client';
import { getTermsHtml } from '@/lib/terms';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diag: Record<string, any> = {
    env: {
      hasDatabaseUri: !!process.env.DATABASE_URI,
      hasPayloadSecret: !!process.env.PAYLOAD_SECRET,
      hasSessionSecret: !!process.env.SESSION_SECRET,
      nodeVersion: process.version,
    },
  };

  try {
    const payload = await getPayloadClient();
    diag.payload = {
      connected: !!payload,
    };

    const docs = await getAllProposalDocuments();
    diag.proposalsCount = docs.length;
    diag.firstProposalId = docs[0]?.meta?.proposal_id;
    diag.firstProposalTitle = docs[0]?.meta?.title;

    const termsHtml = getTermsHtml();
    diag.termsLength = termsHtml.length;

    return NextResponse.json(diag, { status: 200 });
  } catch (err: any) {
    diag.error = {
      message: err?.message || String(err),
      stack: err?.stack,
    };
    return NextResponse.json(diag, { status: 500 });
  }
}
