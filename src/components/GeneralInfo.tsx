import React from 'react';
import type { ProposalMeta } from '@/lib/schema/types';

interface GeneralInfoProps {
  meta: ProposalMeta;
  introParagraphs: string[];
  extraInfoRows: Array<[string, string]>;
}

export default function GeneralInfo({ meta, introParagraphs, extraInfoRows }: GeneralInfoProps) {
  const standardRows: Array<[string, string]> = [
    ['Name of Tour', meta.title],
    ['Type of Tour', meta.tour_type || 'Private Tour'],
    ['Date of Travel', meta.travel_date || '2026'],
    ['Route', meta.route || '-'],
  ];

  const allRows = [...standardRows, ...extraInfoRows];

  return (
    <div className="general-info-section mb-[10mm]">
      <h2 className="text-[9.5mm] font-bold tracking-tight mb-[5mm]">GENERAL INFORMATION</h2>

      {introParagraphs.map((paragraph, idx) => (
        <p key={idx} className="text-[4.1mm] leading-[1.15] mb-[5mm] text-black">
          {paragraph}
        </p>
      ))}

      <table className="w-full border-collapse text-[4.1mm] mt-[4mm]">
        <tbody>
          {allRows.map(([label, value], idx) => (
            <tr key={idx}>
              <td className="border-[.5mm] border-black px-[4mm] py-[4mm] w-[50mm] font-medium text-black">
                {label}
              </td>
              <td className="border-[.5mm] border-black px-[4mm] py-[4mm] text-black">
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
