import type { APIRoute } from 'astro';
import { fetchSheetData } from '../../../lib/sheets/client';
import { getTermsHtml } from '../../../lib/terms';
import { validateAndParseProposal } from '../../../lib/schema/validator';
import { generateProposalPdf, computeDataHash } from '../../../lib/pdf';
import { COOKIE_NAME } from '../../../lib/auth';

export const GET: APIRoute = async ({ params, request, cookies, url }) => {
  const proposalId = params.proposal_id;

  if (!proposalId) {
    return new Response(JSON.stringify({ error: 'Missing proposal ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch sheet data
  const { data, isStale } = await fetchSheetData();
  const termsHtml = getTermsHtml();

  const proposal = validateAndParseProposal(proposalId, data, termsHtml, isStale);

  if (!proposal) {
    return new Response(JSON.stringify({ error: `Proposal "${proposalId}" not found` }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // FR-31: Blocking errors prevent PDF export
  if (!proposal.validation.isValid) {
    return new Response(
      JSON.stringify({
        error: 'Cannot export PDF: proposal has blocking validation errors.',
        validationErrors: proposal.validation.errors,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // FR-3: Only proposals with status 'ready' are exportable by default
  if (proposal.meta.status === 'archived') {
    return new Response(
      JSON.stringify({ error: 'Archived proposals cannot be exported.' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Determine target URL for headless Chromium to render with proper port
    const host = request.headers.get('host') || `127.0.0.1:${process.env.PORT || 4321}`;
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const targetUrl = `${protocol}://${host}/p/${proposalId}`;

    const sessionCookie = cookies.get(COOKIE_NAME)?.value;
    const dataHash = computeDataHash(proposal);

    const pdfBuffer = await generateProposalPdf({
      proposalId,
      dataHash,
      targetUrl,
      sessionCookie,
    });

    // Filename format: {proposal_id}-{YYYY-MM-DD}.pdf (FR-21)
    const today = new Date().toISOString().split('T')[0];
    const versionPart = proposal.meta.version ? `-${proposal.meta.version}` : '';
    const filename = `${proposalId}${versionPart}-${today}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-transform, max-age=60',
      },
    });
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate PDF document',
        details: error?.message || String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
