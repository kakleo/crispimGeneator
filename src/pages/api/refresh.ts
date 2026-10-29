import type { APIRoute } from 'astro';
import { fetchSheetData } from '../../lib/sheets/client';
import { sheetCache } from '../../lib/sheets/cache';

export const POST: APIRoute = async () => {
  try {
    sheetCache.clear();
    const result = await fetchSheetData(true);
    return new Response(
      JSON.stringify({
        success: true,
        lastUpdated: result.lastUpdated,
        isStale: result.isStale,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Failed to refresh sheet data',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
