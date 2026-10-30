import { NextRequest, NextResponse } from 'next/server';
import { duplicateProposalInPayload } from '@/lib/payload/client';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ proposal_id: string }> }
) {
  try {
    const { proposal_id: slug } = await params;
    const duplicated = await duplicateProposalInPayload(slug);
    return NextResponse.json({
      success: true,
      proposal: duplicated,
      message: `Duplicated proposal successfully as "${duplicated.proposal_id}"`,
    });
  } catch (err: any) {
    console.error('Error duplicating proposal:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to duplicate proposal' },
      { status: 400 }
    );
  }
}
