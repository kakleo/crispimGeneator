import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { fetchSheetData } from '@/lib/sheets/client';
import { sheetCache } from '@/lib/sheets/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  try {
    sheetCache.clear();
    const result = await fetchSheetData(true);
    revalidatePath('/', 'layout');
    return NextResponse.json({
      success: true,
      lastUpdated: result.lastUpdated,
      isStale: result.isStale,
      proposalsCount: result.data?.proposals?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to refresh sheet data',
      },
      { status: 500 }
    );
  }
}
