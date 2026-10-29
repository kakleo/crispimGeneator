import { NextResponse } from 'next/server';
import { fetchSheetData } from '@/lib/sheets/client';
import { getTermsHtml } from '@/lib/terms';
import { validateAndParseProposal } from '@/lib/schema/validator';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diag: Record<string, any> = {
    env: {
      hasAppsScriptUrl: !!process.env.GOOGLE_APPS_SCRIPT_URL,
      hasSessionSecret: !!process.env.SESSION_SECRET,
      hasStaffUsers: !!process.env.STAFF_USERS,
      nodeVersion: process.version,
    },
  };

  try {
    const sheetResult = await fetchSheetData();
    diag.sheets = {
      isStale: sheetResult.isStale,
      lastUpdated: sheetResult.lastUpdated,
      proposalsCount: sheetResult.data?.proposals?.length,
      firstProposalId: sheetResult.data?.proposals?.[0]?.proposal_id,
      firstProposalTitle: sheetResult.data?.proposals?.[0]?.title,
    };

    const termsHtml = getTermsHtml();
    diag.termsLength = termsHtml.length;

    const doc = validateAndParseProposal(
      sheetResult.data?.proposals?.[0]?.proposal_id || 'flores-overland-4d',
      sheetResult.data,
      termsHtml,
      sheetResult.isStale
    );

    diag.parsedDoc = {
      ok: !!doc,
      title: doc?.meta?.title,
      daysCount: doc?.itinerary?.length,
      pricingCount: doc?.pricingOptions?.length,
      inclusionsCount: doc?.inclusions?.include?.length,
      validationErrors: doc?.validation?.errors,
    };

    return NextResponse.json(diag, { status: 200 });
  } catch (err: any) {
    diag.error = {
      message: err?.message || String(err),
      stack: err?.stack,
    };

    return NextResponse.json(diag, { status: 500 });
  }
}
