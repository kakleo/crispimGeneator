import { NextRequest, NextResponse } from 'next/server';
import {
  getAllProposalDocuments,
  createProposalInPayload,
  getRawProposals,
} from '@/lib/payload/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const proposals = await getAllProposalDocuments();
    return NextResponse.json({ success: true, proposals });
  } catch (err: any) {
    console.error('Error in GET /api/proposals:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = await createProposalInPayload(body);
    return NextResponse.json({ success: true, proposal: created }, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/proposals:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create proposal' },
      { status: 400 }
    );
  }
}
