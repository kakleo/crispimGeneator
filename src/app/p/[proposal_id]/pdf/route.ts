import { NextRequest, NextResponse } from 'next/server';
import { getProposalDocumentBySlug } from '@/lib/payload/client';
import { generateProposalPdf, computeDataHash } from '@/lib/pdf';
import { COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ proposal_id: string }> }
) {
  const { proposal_id: proposalId } = await params;

  if (!proposalId) {
    return NextResponse.json({ error: 'Missing proposal ID' }, { status: 400 });
  }

  const proposal = await getProposalDocumentBySlug(proposalId);

  if (!proposal) {
    return NextResponse.json(
      { error: `Proposal "${proposalId}" not found` },
      { status: 404 }
    );
  }

  // Blocking errors prevent PDF export
  if (!proposal.validation.isValid) {
    return NextResponse.json(
      {
        error: 'Cannot export PDF: proposal has blocking validation errors.',
        validationErrors: proposal.validation.errors,
      },
      { status: 400 }
    );
  }

  // Archived proposals cannot be exported
  if (proposal.meta.status === 'archived') {
    return NextResponse.json(
      { error: 'Archived proposals cannot be exported.' },
      { status: 403 }
    );
  }

  try {
    const host = request.headers.get('host') || `127.0.0.1:${process.env.PORT || 3000}`;
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const targetUrl = `${protocol}://${host}/p/${proposalId}`;

    const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
    const dataHash = computeDataHash(proposal);

    const pdfBuffer = await generateProposalPdf({
      proposalId,
      dataHash,
      targetUrl,
      sessionCookie,
    });

    const today = new Date().toISOString().split('T')[0];
    const versionPart = proposal.meta.version ? `-${proposal.meta.version}` : '';
    const filename = `${proposalId}${versionPart}-${today}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-transform, max-age=60',
      },
    });
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    // Never return 302 HTML redirect. Return JSON error so the client-side direct PDF generator handles it seamlessly.
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Server headless Chromium generation failed',
      },
      { status: 500 }
    );
  }
}
