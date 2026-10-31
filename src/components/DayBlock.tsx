'use client';

import React, { useState } from 'react';
import type { ItineraryDay } from '@/lib/schema/types';
import { normalizeImageUrl } from '@/lib/schema/types';

interface DayBlockProps {
  day: ItineraryDay;
}

export default function DayBlock({ day }: DayBlockProps) {
  const [imgError, setImgError] = useState(false);
  const dayPrefix = `DAY ${String(day.day_no).padStart(2, '0')}`;
  const fullTitle = day.day_title.toLowerCase().startsWith('day')
    ? day.day_title
    : `${dayPrefix} - ${day.day_title}`;

  const accommodationText = day.accommodation_note
    ? day.accommodation_note.toLowerCase().startsWith('accomodation') ||
      day.accommodation_note.toLowerCase().startsWith('accommodation')
      ? day.accommodation_note
      : `Accomodation : ${day.accommodation_note}`
    : 'Accomodation : -';

  const imageUrl = normalizeImageUrl(day.image_url);

  return (
    <div className="day-block relative mb-[6mm] min-h-[44mm] break-inside-avoid">
      {/* Day Banner */}
      <div className="inline-block bg-blue text-white font-bold text-[4mm] py-[2.8mm] pr-[4mm] pl-[13mm] -ml-[9mm] min-w-[140mm] rounded-r-[7mm] mb-[5mm]">
        {fullTitle}
      </div>

      {/* Bullet Items */}
      <ul className="w-[118mm] pl-[7mm] list-disc text-[3.7mm] leading-[1.3] mb-[5mm] text-black">
        {day.items.map((item, idx) => (
          <li key={idx} className="mb-[0.8mm]">
            {item}
          </li>
        ))}
      </ul>

      {/* Accommodation Note */}
      <div className="text-[3.9mm] ml-[1mm] text-black">{accommodationText}</div>

      {/* Polaroid Photo Frame on Right */}
      <div className="absolute -right-[1mm] top-[8mm] w-[48mm] h-[45mm] bg-[#f1f1ed] border border-[#ddd] shadow-[3mm_1.5mm_0_-1mm_#f6f6f3]">
        {/* Paperclip / hanger aesthetic element */}
        <div className="absolute right-[3mm] -top-[3.5mm] w-[3mm] h-[9mm] border border-[#aaa] rounded-[2mm]"></div>

        {/* Image Box */}
        <div className="absolute inset-x-[3.5mm] top-[5mm] h-[34mm] bg-[#c9ced3] flex items-center justify-center text-[3mm] text-[#59616a] overflow-hidden">
          {imageUrl && !imgError ? (
            <img
              className="w-full h-full object-cover"
              src={imageUrl}
              alt={fullTitle}
              loading="eager"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-[2.8mm] text-zinc-500 font-medium">Photo</span>
          )}
        </div>
      </div>
    </div>
  );
}
