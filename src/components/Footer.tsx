import React from 'react';
import type { SiteSettings } from '@/lib/schema/types';

interface FooterProps {
  settings: SiteSettings;
}

export default function Footer({ settings }: FooterProps) {
  return (
    <footer className="footer-bar absolute inset-x-0 bottom-0 h-[11mm] bg-green flex justify-center items-center gap-[10mm] text-white">
      {/* Website */}
      <div className="footer-bar-item flex items-center gap-[2mm] leading-none" style={{ display: 'inline-flex', alignItems: 'center' }}>
        <svg
          className="w-[4.5mm] h-[4.5mm] shrink-0 block fill-none stroke-white stroke-[1.8]"
          viewBox="0 0 24 24"
          width="18"
          height="18"
        >
          <circle cx="12" cy="12" r="9.5"></circle>
          <path d="M2.5 12h19M12 2.5c3 3 3 16 0 19M12 2.5c-3 3-3 16 0 19"></path>
        </svg>
        <span className="text-[3.6mm] font-normal leading-none tracking-normal">
          {settings.website}
        </span>
      </div>

      {/* WhatsApp */}
      <div className="footer-bar-item flex items-center gap-[2mm] leading-none" style={{ display: 'inline-flex', alignItems: 'center' }}>
        <svg
          className="w-[4.5mm] h-[4.5mm] shrink-0 block fill-none stroke-white stroke-[1.8]"
          viewBox="0 0 24 24"
          width="18"
          height="18"
        >
          <path d="M4 20l1.3-4.2A8.5 8.5 0 1 1 8.4 18.8z"></path>
          <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2z"></path>
        </svg>
        <span className="text-[3.6mm] font-normal leading-none tracking-normal">
          {settings.whatsapp}
        </span>
      </div>

      {/* Instagram */}
      <div className="footer-bar-item flex items-center gap-[2mm] leading-none" style={{ display: 'inline-flex', alignItems: 'center' }}>
        <svg
          className="w-[4.5mm] h-[4.5mm] shrink-0 block fill-none stroke-white stroke-[1.8]"
          viewBox="0 0 24 24"
          width="18"
          height="18"
        >
          <rect x="3" y="3" width="18" height="18" rx="5"></rect>
          <circle cx="12" cy="12" r="4"></circle>
          <circle cx="17.2" cy="6.8" r=".6"></circle>
        </svg>
        <span className="text-[3.6mm] font-normal leading-none tracking-normal">
          {settings.instagram}
        </span>
      </div>
    </footer>
  );
}
