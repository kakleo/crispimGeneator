import React from 'react';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { fetchSheetData } from '@/lib/sheets/client';
import { getTermsHtml } from '@/lib/terms';
import { validateAndParseProposal } from '@/lib/schema/validator';
import type { ProposalDocument } from '@/lib/schema/types';
import ProposalListTable from '@/components/ProposalListTable';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
  const auth = await verifySessionToken(sessionCookie);
  const currentUser = auth.username || 'Staff';

  let proposalsList: ProposalDocument[] = [];
  let isStale = false;
  let lastUpdated: string | null = null;
  let loadError: string | null = null;

  try {
    const sheetResult = await fetchSheetData();
    const data = sheetResult.data;
    isStale = sheetResult.isStale;
    lastUpdated = sheetResult.lastUpdated;
    const termsHtml = getTermsHtml();

    const rawProposals = data?.proposals || [];
    for (const raw of rawProposals) {
      const slug = String(raw.proposal_id || '').trim();
      if (!slug) continue;
      const doc = validateAndParseProposal(slug, data, termsHtml, isStale);
      if (doc) {
        proposalsList.push(doc);
      }
    }
  } catch (err: any) {
    console.error('Error loading proposals for dashboard:', err);
    loadError = err?.message || String(err);
  }

  return (
    <main className="min-h-screen bg-zinc-50/50 flex flex-col">
      {loadError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-3 text-xs text-rose-800 text-center font-medium">
          Warning: Could not connect to Google Sheets ({loadError}). Showing cached or default proposals.
        </div>
      )}
      <ProposalListTable
        proposals={proposalsList}
        isStale={isStale}
        lastUpdated={lastUpdated}
        currentUser={currentUser}
      />
    </main>
  );
}
