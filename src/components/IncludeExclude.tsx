import React from 'react';

interface IncludeExcludeProps {
  include: string[];
  exclude: string[];
}

export default function IncludeExclude({ include, exclude }: IncludeExcludeProps) {
  const num = (i: number) => String(i + 1).padStart(2, '0');

  return (
    <div className="include-exclude-section mb-[8mm]">
      <h2 className="text-[9.5mm] font-bold tracking-tight mb-[5mm] text-black">
        INCLUDE & EXCLUDE
      </h2>

      <div className="flex flex-wrap md:flex-nowrap gap-[16mm] md:gap-[23mm]">
        {/* Include Column */}
        <div className="w-full md:w-[84mm]">
          <h3 className="text-[4mm] font-bold mt-[4mm] mb-[6mm] text-black uppercase tracking-wider">
            Include
          </h3>
          {include.map((item, idx) => (
            <div key={idx} className="flex mb-[4.5mm] min-h-[11.5mm] text-[3.9mm] bg-[#f2f2f2] break-inside-avoid">
              <b className="bg-green w-[11.5mm] min-w-[11.5mm] flex items-center justify-center text-white font-bold select-none">
                {num(idx)}
              </b>
              <span className="px-[4mm] py-[2mm] flex items-center text-black leading-tight">
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* Exclude Column */}
        <div className="w-full md:w-[84mm]">
          <h3 className="text-[4mm] font-bold mt-[4mm] mb-[6mm] text-black uppercase tracking-wider">
            Exclude
          </h3>
          {exclude.map((item, idx) => (
            <div key={idx} className="flex mb-[4.5mm] min-h-[11.5mm] text-[3.9mm] bg-[#f2f2f2] break-inside-avoid">
              <b className="bg-red w-[11.5mm] min-w-[11.5mm] flex items-center justify-center text-white font-bold select-none">
                {num(idx)}
              </b>
              <span className="px-[4mm] py-[2mm] flex items-center text-black leading-tight">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
