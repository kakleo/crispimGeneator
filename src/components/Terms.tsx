import React from 'react';

interface TermsProps {
  termsHtml: string;
}

export default function Terms({ termsHtml }: TermsProps) {
  return (
    <div className="terms-section pt-[2mm] mb-[8mm]">
      <div
        className="terms-content text-zinc-900"
        dangerouslySetInnerHTML={{ __html: termsHtml }}
      />
    </div>
  );
}
