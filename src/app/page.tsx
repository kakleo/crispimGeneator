import React from 'react';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { getAllProposalDocuments } from '@/lib/payload/client';
import type { ProposalDocument } from '@/lib/schema/types';
import ProposalListTable from '@/components/ProposalListTable';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
  const auth = await verifySessionToken(sessionCookie);
  const currentUser = auth.username || 'Staff';

  let proposalsList: ProposalDocument[] = [];
  let loadError: string | null = null;

  try {
    proposalsList = await getAllProposalDocuments();
  } catch (err: any) {
    console.error('Error loading proposals from Payload:', err);
    loadError = err?.message || String(err);
  }

  return (
    <main className="min-h-screen bg-zinc-50/50 flex flex-col">
      {loadError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-3 text-xs text-rose-800 text-center font-medium">
          Warning: Could not connect to Payload database ({loadError}).
        </div>
      )}
      <ProposalListTable
        proposals={proposalsList}
        isStale={false}
        lastUpdated={new Date().toISOString()}
        currentUser={currentUser}
      />
    </main>
  );
}
