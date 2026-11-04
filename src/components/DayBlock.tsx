'use client';

import React, { useState, useEffect } from 'react';
import type { ItineraryDay } from '@/lib/schema/types';
import { normalizeImageUrl } from '@/lib/schema/types';

interface DayBlockProps {
  day: ItineraryDay;
}

export default function DayBlock({ day }: DayBlockProps) {
  const imageUrl = normalizeImageUrl(day.image_url);
  const [currentSrc, setCurrentSrc] = useState(imageUrl);
  const [imgError, setImgError] = useState(false);
  const [hasTriedProxy, setHasTriedProxy] = useState(false);

  useEffect(() => {
    setCurrentSrc(imageUrl);
    setImgError(false);
    setHasTriedProxy(false);
  }, [imageUrl]);

  const handleImgError = () => {
    // If it's a Google Drive link using lh3, try fallback to drive.google.com/uc?export=view&id=...
    if (currentSrc && currentSrc.includes('lh3.googleusercontent.com/d/')) {
      const id = currentSrc.split('lh3.googleusercontent.com/d/')[1];
      if (id) {
        setCurrentSrc(`https://drive.google.com/uc?export=view&id=${id}`);
        return;
      }
    }
    // Fallback to image-proxy if direct loading fails
    if (imageUrl && !hasTriedProxy && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      setHasTriedProxy(true);
      setCurrentSrc(`/api/image-proxy?url=${encodeURIComponent(imageUrl)}`);
      return;
    }
    setImgError(true);
  };

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

  return (
    <div className="day-block relative mb-[6mm] min-h-[44mm] break-inside-avoid">
      {/* Day Banner */}
      <div className="inline-block bg-blue text-white font-bold text-[4mm] py-[2.8mm] pr-[4mm] pl-[13mm] -ml-[9mm] min-w-[140mm] rounded-r-[7mm] mb-[4.5mm]">
        {fullTitle}
      </div>

      {/* Bullet Items with styled, reliable circular dots and generous line-height */}
      <ul className="w-[124mm] mb-[4mm] text-black space-y-[2.8mm]">
        {day.items.map((item, idx) => (
          <li key={idx} className="relative pl-[4.5mm] text-[3.6mm] leading-[1.55]">
            <span
              className="absolute left-0 top-[2.2mm] w-[1.4mm] h-[1.4mm] rounded-full bg-zinc-800 shrink-0"
              style={{ borderRadius: '50%' }}
            />
            <span className="block">{item}</span>
          </li>
        ))}
      </ul>

      {/* Accommodation Note */}
      <div className="text-[3.7mm] font-medium text-black mt-[2mm]">{accommodationText}</div>

      {/* Polaroid Photo Frame on Right */}
      <div className="absolute -right-[1mm] top-[8mm] w-[48mm] h-[45mm] bg-[#f1f1ed] border border-[#ddd] shadow-[3mm_1.5mm_0_-1mm_#f6f6f3]">
        {/* Paperclip / hanger aesthetic element */}
        <div className="absolute right-[3mm] -top-[3.5mm] w-[3mm] h-[9mm] border border-[#aaa] rounded-[2mm]"></div>

        {/* Image Box */}
        <div className="absolute inset-x-[3.5mm] top-[5mm] h-[34mm] bg-[#c9ced3] flex items-center justify-center text-[3mm] text-[#59616a] overflow-hidden">
          {currentSrc && !imgError ? (
            <img
              className="w-full h-full object-cover"
              src={currentSrc}
              alt={fullTitle}
              loading="eager"
              referrerPolicy="no-referrer"
              onError={handleImgError}
            />
          ) : (
            <span className="text-[2.8mm] text-zinc-500 font-medium">Photo</span>
          )}
        </div>
      </div>
    </div>
  );
}
