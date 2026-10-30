import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAllProposalDocuments } from '@/lib/payload/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  try {
    revalidatePath('/', 'layout');
    const proposals = await getAllProposalDocuments();
    return NextResponse.json({
      success: true,
      lastUpdated: new Date().toISOString(),
      isStale: false,
      proposalsCount: proposals.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to refresh data',
      },
      { status: 500 }
    );
  }
}
