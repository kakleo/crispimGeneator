import { NextRequest, NextResponse } from 'next/server';
import {
  getRawProposalBySlug,
  updateProposalInPayload,
  deleteProposalInPayload,
} from '@/lib/payload/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ proposal_id: string }> }
) {
  try {
    const { proposal_id: slug } = await params;
    const doc = await getRawProposalBySlug(slug);
    if (!doc) {
      return NextResponse.json(
        { success: false, error: `Proposal "${slug}" not found` },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, proposal: doc });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch proposal' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ proposal_id: string }> }
) {
  try {
    const { proposal_id: slug } = await params;
    const body = await request.json();
    const updated = await updateProposalInPayload(slug, body);
    return NextResponse.json({ success: true, proposal: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update proposal' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ proposal_id: string }> }
) {
  try {
    const { proposal_id: slug } = await params;
    await deleteProposalInPayload(slug);
    return NextResponse.json({ success: true, message: `Proposal "${slug}" deleted` });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete proposal' },
      { status: 400 }
    );
  }
}
