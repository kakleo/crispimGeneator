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
    <div className="general-info-section mb-[8mm]">
      <h2 className="text-[9.5mm] font-bold tracking-tight mb-[4.5mm]">GENERAL INFORMATION</h2>

      {introParagraphs.map((paragraph, idx) => (
        <p key={idx} className="text-[3.8mm] leading-[1.55] mb-[3.5mm] text-zinc-900">
          {paragraph}
        </p>
      ))}

      <table className="w-full border-collapse text-[3.8mm] mt-[4mm]">
        <tbody>
          {allRows.map(([label, value], idx) => (
            <tr key={idx} className="min-h-[12mm]">
              <td
                className="border-[.5mm] border-black px-[4mm] py-[3.2mm] w-[52mm] font-semibold text-black align-middle"
                style={{ verticalAlign: 'middle' }}
              >
                {label}
              </td>
              <td
                className="border-[.5mm] border-black px-[4mm] py-[3.2mm] text-black align-middle leading-[1.45]"
                style={{ verticalAlign: 'middle' }}
              >
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
