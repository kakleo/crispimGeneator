import React from 'react';
import { notFound } from 'next/navigation';
import { fetchSheetData } from '@/lib/sheets/client';
import { getTermsHtml } from '@/lib/terms';
import { validateAndParseProposal } from '@/lib/schema/validator';
import Toolbar from '@/components/Toolbar';
import Cover from '@/components/Cover';
import GeneralInfo from '@/components/GeneralInfo';
import DayBlock from '@/components/DayBlock';
import PriceTable from '@/components/PriceTable';
import IncludeExclude from '@/components/IncludeExclude';
import Terms from '@/components/Terms';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    proposal_id: string;
  };
  searchParams?: {
    autoprint?: string;
  };
}

export default async function ProposalPreviewPage({ params, searchParams }: PageProps) {
  const proposalId = params.proposal_id;
  if (!proposalId) {
    notFound();
  }

  let proposal = null;
  try {
    const { data, isStale } = await fetchSheetData();
    const termsHtml = getTermsHtml();
    proposal = validateAndParseProposal(proposalId, data, termsHtml, isStale);
  } catch (err: any) {
    console.error(`Error loading proposal "${proposalId}":`, err);
    throw new Error(`Failed to load proposal: ${err?.message || err}`);
  }

  if (!proposal) {
    notFound();
  }

  const { meta, settings, itinerary, pricingOptions, inclusions, extraInfoRows, introParagraphs, sanitizedHtml } = proposal;

  return (
    <div className="bg-zinc-100 print:bg-white text-zinc-900 min-h-screen">
      {/* Top Toolbar outside printable area */}
      <Toolbar proposal={proposal} />

      {/* Preview Viewport */}
      <div className="preview-viewport py-6 print:py-0 flex flex-col items-center">
        {/* PAGE 1: COVER */}
        <Cover meta={meta} settings={settings} />

        {/* PAGE 2: General Information & Itinerary Start */}
        <section className="page-container relative w-[210mm] min-h-[297mm] mx-auto mb-6 bg-white overflow-hidden shadow-lg print:shadow-none print:m-0 print:break-after-page flex flex-col justify-between">
          <div className="pt-[12mm] px-[9mm] pb-[16mm] flex-1">
            <GeneralInfo
              meta={meta}
              introParagraphs={introParagraphs}
              extraInfoRows={extraInfoRows}
            />

            {sanitizedHtml && (
              <div
                className="custom-html-block mb-[6mm] p-[3mm] bg-[#f8f9fa] border border-[#e2e8f0] rounded"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
              />
            )}

            <h2 className="text-[9.5mm] font-bold tracking-tight mb-[5mm] text-black">
              TOUR ITINERARY
            </h2>

            {itinerary.slice(0, 2).map((day) => (
              <DayBlock key={day.day_no} day={day} />
            ))}
          </div>

          <Footer settings={settings} />
        </section>

        {/* PAGE 3: Remaining Itinerary Days (if more than 2 days) */}
        {itinerary.length > 2 && (
          <section className="page-container relative w-[210mm] min-h-[297mm] mx-auto mb-6 bg-white overflow-hidden shadow-lg print:shadow-none print:m-0 print:break-after-page flex flex-col justify-between">
            <div className="pt-[10mm] px-[9mm] pb-[16mm] flex-1">
              {itinerary.slice(2).map((day) => (
                <DayBlock key={day.day_no} day={day} />
              ))}
            </div>
            <Footer settings={settings} />
          </section>
        )}

        {/* PAGE 4: Price Information */}
        <section className="page-container relative w-[210mm] min-h-[297mm] mx-auto mb-6 bg-white overflow-hidden shadow-lg print:shadow-none print:m-0 print:break-after-page flex flex-col justify-between">
          <div className="pt-[12mm] px-[14mm] pb-[16mm] flex-1">
            <PriceTable pricingOptions={pricingOptions} />
          </div>
          <Footer settings={settings} />
        </section>

        {/* PAGE 5: Inclusions & Exclusions */}
        <section className="page-container relative w-[210mm] min-h-[297mm] mx-auto mb-6 bg-white overflow-hidden shadow-lg print:shadow-none print:m-0 print:break-after-page flex flex-col justify-between">
          <div className="pt-[12mm] px-[9mm] pb-[16mm] flex-1">
            <IncludeExclude
              include={inclusions.include}
              exclude={inclusions.exclude}
            />
          </div>
          <Footer settings={settings} />
        </section>

        {/* PAGE 6: Terms of Service */}
        <section className="page-container relative w-[210mm] min-h-[297mm] mx-auto mb-6 bg-white overflow-hidden shadow-lg print:shadow-none print:m-0 print:break-after-page flex flex-col justify-between">
          <div className="pt-[12mm] px-[12mm] pb-[16mm] flex-1">
            <Terms termsHtml={proposal.termsHtml} />
          </div>
          <Footer settings={settings} />
        </section>
      </div>

      {/* Autoprint handler if triggered from /pdf fallback */}
      {searchParams?.autoprint === '1' && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', function() {
                setTimeout(function() { window.print(); }, 600);
              });
            `,
          }}
        />
      )}
    </div>
  );
}
