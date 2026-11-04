import React from 'react';
import type { PricingOptionGroup } from '@/lib/schema/types';

interface PriceTableProps {
  pricingOptions: PricingOptionGroup[];
  showHeading?: boolean;
}

export default function PriceTable({ pricingOptions, showHeading = true }: PriceTableProps) {
  return (
    <div className="price-section mb-[8mm]">
      {showHeading && (
        <h2 className="text-[9.5mm] font-bold tracking-tight mb-[5mm] text-black uppercase font-sans">
          PRICE INFORMATION
        </h2>
      )}

      {pricingOptions.map((option, optIdx) => {
        const isUnit = option.price_unit === 'unit';
        const priceHeader = isUnit ? 'Price / Unit' : 'Price / Person';
        const columns = ['Type', priceHeader, 'Accomodation'];

        return (
          <div key={optIdx} className="price-option-group mb-[6mm] break-inside-avoid">
            <div className="font-sans font-bold text-[4.2mm] mt-[4mm] mb-[2.5mm] text-zinc-900 tracking-wide uppercase">
              {option.label}
            </div>

            <table className="w-full border-collapse text-[3.7mm]">
              <thead>
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      className="border-[.5mm] border-black px-[4mm] py-[3.5mm] h-[12mm] font-sans font-bold text-left text-zinc-900 bg-[#f9fafb] align-middle"
                      style={{ verticalAlign: 'middle' }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {option.rows.map((row, rowIdx) =>
                  row.stays.length > 0 ? (
                    row.stays.map((stay, idx) => (
                      <tr key={`${rowIdx}-${idx}`}>
                        {idx === 0 && (
                          <>
                            <td
                              className="border-[.5mm] border-black px-[3mm] py-[2mm] w-[45mm] text-center text-black bg-white align-middle font-sans"
                              style={{ verticalAlign: 'middle' }}
                              rowSpan={row.stays.length}
                            >
                              <div className="w-full min-h-[12mm] flex items-center justify-center text-center leading-[1.35]">
                                {row.type}
                              </div>
                            </td>
                            <td
                              className="border-[.5mm] border-black px-[3mm] py-[2mm] w-[45mm] text-center text-black bg-white align-middle font-sans font-semibold"
                              style={{ verticalAlign: 'middle' }}
                              rowSpan={row.stays.length}
                            >
                              <div className="w-full min-h-[12mm] flex items-center justify-center text-center leading-[1.35]">
                                {row.price}
                              </div>
                            </td>
                          </>
                        )}
                        <td
                          className="border-[.5mm] border-black px-[4mm] py-[2.5mm] text-black bg-white align-middle font-sans leading-[1.4]"
                          style={{ verticalAlign: 'middle' }}
                        >
                          {stay}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr key={rowIdx}>
                      <td
                        className="border-[.5mm] border-black px-[3mm] py-[2.5mm] w-[45mm] text-center text-black bg-white align-middle font-sans"
                        style={{ verticalAlign: 'middle' }}
                      >
                        <div className="w-full flex items-center justify-center text-center leading-[1.35]">
                          {row.type}
                        </div>
                      </td>
                      <td
                        className="border-[.5mm] border-black px-[3mm] py-[2.5mm] w-[45mm] text-center text-black bg-white align-middle font-sans font-semibold"
                        style={{ verticalAlign: 'middle' }}
                      >
                        <div className="w-full flex items-center justify-center text-center leading-[1.35]">
                          {row.price}
                        </div>
                      </td>
                      <td
                        className="border-[.5mm] border-black px-[4mm] py-[2.5mm] text-black bg-white align-middle font-sans leading-[1.4]"
                        style={{ verticalAlign: 'middle' }}
                      >
                        -
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}