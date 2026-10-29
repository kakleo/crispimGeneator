import React from 'react';
import type { PricingOptionGroup } from '@/lib/schema/types';

interface PriceTableProps {
  pricingOptions: PricingOptionGroup[];
}

export default function PriceTable({ pricingOptions }: PriceTableProps) {
  const columns = ['Type', 'Price / Person', 'Accomodation'];

  return (
    <div className="price-section mb-[8mm]">
      <h2 className="text-[9.5mm] font-bold tracking-tight mb-[5mm] font-display font-extrabold text-black">
        PRICE INFORMATION
      </h2>

      {pricingOptions.map((option, optIdx) => (
        <div key={optIdx} className="price-option-group mb-[6mm] break-inside-avoid">
          <div className="font-display font-bold text-[3.8mm] mt-[4mm] mb-[2.5mm] text-black">
            {option.label}
          </div>

          <table className="w-full border-collapse text-[3.7mm]">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className="border-[.5mm] border-black px-[4mm] py-[3.5mm] h-[14mm] font-normal text-left text-black bg-white"
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
                            className="border-[.5mm] border-black px-[4mm] w-[45mm] text-center h-[13.5mm] text-black bg-white align-middle"
                            rowSpan={row.stays.length}
                          >
                            {row.type}
                          </td>
                          <td
                            className="border-[.5mm] border-black px-[4mm] w-[45mm] text-black bg-white align-middle"
                            rowSpan={row.stays.length}
                          >
                            {row.price}
                          </td>
                        </>
                      )}
                      <td className="border-[.5mm] border-black px-[4mm] h-[13.5mm] text-black bg-white align-middle">
                        {stay}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr key={rowIdx}>
                    <td className="border-[.5mm] border-black px-[4mm] w-[45mm] text-center h-[13.5mm] text-black bg-white align-middle">
                      {row.type}
                    </td>
                    <td className="border-[.5mm] border-black px-[4mm] w-[45mm] text-black bg-white align-middle">
                      {row.price}
                    </td>
                    <td className="border-[.5mm] border-black px-[4mm] h-[13.5mm] text-black bg-white align-middle">
                      -
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
