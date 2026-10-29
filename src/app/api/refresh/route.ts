import { NextResponse } from 'next/server';
import { fetchSheetData } from '@/lib/sheets/client';
import { sheetCache } from '@/lib/sheets/cache';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    sheetCache.clear();
    const result = await fetchSheetData(true);
    return NextResponse.json({
      success: true,
      lastUpdated: result.lastUpdated,
      isStale: result.isStale,
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
