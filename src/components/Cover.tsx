import React from 'react';
import type { ProposalMeta, SiteSettings } from '@/lib/schema/types';
import Footer from './Footer';

interface CoverProps {
  meta: ProposalMeta;
  settings: SiteSettings;
}

export default function Cover({ meta, settings }: CoverProps) {
  // Title split for aesthetic line breaking matching design
  const formattedTitle = (meta.title || '').replace(/\b(TOUR)\b/i, '<br>$1');

  return (
    <section className="proposal-page cover-page relative w-[210mm] h-[297mm] mx-auto mb-6 bg-white overflow-hidden print:m-0 print:break-after-page shadow-md print:shadow-none">
      {/* Rounded Hero Image Container */}
      <div className="absolute left-[10mm] top-[9mm] right-[10mm] h-[196mm] rounded-[12mm] overflow-hidden bg-gradient-to-b from-[#8a94ad] via-[#f0a35a] to-[#7d8f88]">
        {meta.cover_image_url ? (
          <img
            className="w-full h-full object-cover"
            src={meta.cover_image_url}
            alt={meta.title}
            loading="eager"
          />
        ) : null}
      </div>

      {/* Notch holding Logo */}
      <div className="absolute left-[10mm] top-[9mm] w-[90mm] h-[46mm] bg-white rounded-br-[12mm] flex items-center justify-center p-[3mm]">
        <img
          className="max-w-[75mm] max-h-[36mm] object-contain"
          src={settings.logo_url || '/logo.png'}
          alt={settings.company_name}
        />
      </div>

      {/* Title */}
      <h1
        className="absolute left-[12mm] right-[10mm] top-[217mm] text-[21mm] leading-[.98] font-medium tracking-tight text-black"
        dangerouslySetInnerHTML={{ __html: formattedTitle }}
      />

      {/* Footer */}
      <Footer settings={settings} />
    </section>
  );
}
