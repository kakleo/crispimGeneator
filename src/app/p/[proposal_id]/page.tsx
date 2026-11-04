import React from 'react';
import { notFound } from 'next/navigation';
import { getProposalDocumentBySlug } from '@/lib/payload/client';
import Toolbar from '@/components/Toolbar';
import Cover from '@/components/Cover';
import GeneralInfo from '@/components/GeneralInfo';
import DayBlock from '@/components/DayBlock';
import PriceTable from '@/components/PriceTable';
import IncludeExclude from '@/components/IncludeExclude';
import Terms from '@/components/Terms';
import Footer from '@/components/Footer';
import PagedBlocks from '@/components/PagedBlocks';
import AutoDirectDownloader from '@/components/AutoDirectDownloader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    proposal_id: string;
  }>;
  searchParams?: Promise<{
    autodownload?: string;
    autoprint?: string;
  }>;
}

export default async function ProposalPreviewPage({ params, searchParams }: PageProps) {
  const { proposal_id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  if (!proposal_id) {
    notFound();
  }

  let proposal = null;
  try {
    proposal = await getProposalDocumentBySlug(proposal_id);
  } catch (err: any) {
    console.error(`Error loading proposal "${proposal_id}":`, err);
    throw new Error(`Failed to load proposal: ${err?.message || err}`);
  }

  if (!proposal) {
    notFound();
  }

  const { meta, settings, itinerary, pricingOptions, inclusions, extraInfoRows, introParagraphs, sanitizedHtml } = proposal;

  const today = new Date().toISOString().split('T')[0];
  const ver = meta.version ? `-${meta.version}` : '';
  const pdfFilename = `${meta.proposal_id}${ver}-${today}.pdf`;

  return (
    <div className="bg-zinc-100 print:bg-white text-zinc-900 min-h-screen">
      {/* Top Toolbar outside printable area */}
      <Toolbar proposal={proposal} />

      {/* Direct PDF Auto-Downloader (when triggered from Home table) */}
      {resolvedSearchParams?.autodownload === '1' && (
        <AutoDirectDownloader filename={pdfFilename} proposalId={meta.proposal_id} />
      )}

      {/* Preview Viewport */}
      <div className="preview-viewport py-6 print:py-0 flex flex-col items-center">
        {/* PAGE 1: COVER */}
        <Cover meta={meta} settings={settings} />

        {/* PAGES 2+: General Information & Itinerary. Whole days move to a new page when they don't fit. */}
        <PagedBlocks
          settings={settings}
          padXmm={9}
          padTopFirstMm={12}
          padTopRestMm={10}
          header={
            <>
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
            </>
          }
          blocks={itinerary.map((day) => (
            <DayBlock key={day.day_no} day={day} />
          ))}
        />

        {/* Price Information: each option table is kept whole; overflow goes to a new page */}
        <PagedBlocks
          settings={settings}
          padXmm={14}
          padTopFirstMm={12}
          padTopRestMm={12}
          blocks={pricingOptions.map((option, i) => (
            <PriceTable key={i} pricingOptions={[option]} showHeading={i === 0} />
          ))}
        />

        {/* PAGE 5: Inclusions & Exclusions */}
        <section className="page-container relative w-[210mm] min-h-[297mm] print:h-[297mm] print:max-h-[297mm] mx-auto mb-6 bg-white overflow-hidden shadow-lg print:shadow-none print:m-0 print:break-after-page flex flex-col justify-between">
          <div className="pt-[12mm] px-[9mm] pb-[16mm] flex-1">
            <IncludeExclude
              include={inclusions.include}
              exclude={inclusions.exclude}
            />
          </div>
          <Footer settings={settings} />
        </section>

        {/* Terms: split at each heading so a section is never cut between pages */}
        <PagedBlocks
          settings={settings}
          padXmm={12}
          padTopFirstMm={12}
          padTopRestMm={12}
          blocks={proposal.termsHtml
            .split(/(?=<h[1-3][\s>])/i)
            .filter((chunk) => chunk.trim())
            .map((chunk, i) => (
              <div
                key={i}
                className="terms-content text-zinc-900 mb-[3mm]"
                dangerouslySetInnerHTML={{ __html: chunk }}
              />
            ))}
        />
      </div>
    </div>
  );
}