import type { APIRoute } from 'astro';
import { fetchSheetData } from '../../lib/sheets/client';
import { getTermsHtml } from '../../lib/terms';
import { validateAndParseProposal } from '../../lib/schema/validator';

export const GET: APIRoute = async () => {
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

    return new Response(JSON.stringify(diag, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    diag.error = {
      message: err?.message || String(err),
      stack: err?.stack,
    };

    return new Response(JSON.stringify(diag, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
