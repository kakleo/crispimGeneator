'use client';

import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import Footer from './Footer';
import type { SiteSettings } from '@/lib/schema/types';

const PAGE_H_MM = 297;
const BOTTOM_RESERVED_MM = 16; // footer (11mm) + breathing room, same as the old pb-[16mm]
const TOLERANCE_MM = 5; // a block's trailing margin may sit in the bottom gap

interface PagedBlocksProps {
  settings: SiteSettings;
  /** Content placed once at the top of the first page (never split from the first block) */
  header?: React.ReactNode;
  /** Atomic units. A unit is never split; if it doesn't fit it starts a new page. */
  blocks: React.ReactNode[];
  padXmm: number;
  padTopFirstMm: number;
  padTopRestMm: number;
}

const PAGE_CLASS =
  'page-container relative w-[210mm] min-h-[297mm] print:h-[297mm] print:max-h-[297mm] mx-auto mb-6 bg-white overflow-hidden shadow-lg print:shadow-none print:m-0 print:break-after-page flex flex-col justify-between';

export default function PagedBlocks({
  settings,
  header,
  blocks,
  padXmm,
  padTopFirstMm,
  padTopRestMm,
}: PagedBlocksProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  // Before measuring, put everything on one page; the layout effect fixes it before first paint.
  const [pages, setPages] = useState<number[][]>([blocks.map((_, i) => i)]);

  const paginate = useCallback(() => {
    const root = measureRef.current;
    if (!root) return;
    const ref = root.querySelector<HTMLElement>('[data-ref]');
    const refPx = ref?.getBoundingClientRect().height || 0;
    if (!refPx) return;
    // Convert px -> mm using a 100mm reference element, so CSS zoom / DPR can't skew the result
    const toMm = (el: Element | null) => (el ? (el.getBoundingClientRect().height * 100) / refPx : 0);

    const headerMm = toMm(root.querySelector('[data-header]'));
    const heights = Array.from(root.querySelectorAll('[data-block]')).map((el) => toMm(el));

    const result: number[][] = [[]];
    let used = headerMm;
    const avail = (pageIdx: number) =>
      PAGE_H_MM - (pageIdx === 0 ? padTopFirstMm : padTopRestMm) - BOTTOM_RESERVED_MM + TOLERANCE_MM;

    heights.forEach((h, i) => {
      const cur = result[result.length - 1];
      if (cur.length > 0 && used + h > avail(result.length - 1)) {
        result.push([i]);
        used = h;
      } else {
        cur.push(i);
        used += h;
      }
    });

    setPages((prev) => (JSON.stringify(prev) === JSON.stringify(result) ? prev : result));
  }, [padTopFirstMm, padTopRestMm]);

  useLayoutEffect(() => {
    paginate();
    // Re-measure once web fonts / late layout settle (text wraps differently with the real font)
    document.fonts?.ready.then(paginate).catch(() => {});
    const t1 = setTimeout(paginate, 400);
    const t2 = setTimeout(paginate, 1500);
    window.addEventListener('load', paginate);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('load', paginate);
    };
  }, [paginate, blocks.length]);

  const padX = `${padXmm}mm`;

  return (
    <>
      {pages.map((idxs, p) => (
        <section key={p} className={PAGE_CLASS}>
          <div
            className="flex-1"
            style={{
              paddingTop: `${p === 0 ? padTopFirstMm : padTopRestMm}mm`,
              paddingLeft: padX,
              paddingRight: padX,
              paddingBottom: `${BOTTOM_RESERVED_MM}mm`,
            }}
          >
            {p === 0 && header}
            {idxs.map((i) => (
              <React.Fragment key={i}>{blocks[i]}</React.Fragment>
            ))}
          </div>
          <Footer settings={settings} />
        </section>
      ))}

      {/* Off-screen measuring copy (never printed) */}
      <div
        ref={measureRef}
        aria-hidden
        className="no-print"
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          width: '210mm',
          visibility: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <div data-ref style={{ height: '100mm', width: '1px' }} />
        <div style={{ paddingLeft: padX, paddingRight: padX }}>
          {header && (
            <div data-header style={{ display: 'flow-root' }}>
              {header}
            </div>
          )}
          {blocks.map((b, i) => (
            <div key={i} data-block style={{ display: 'flow-root' }}>
              {b}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}