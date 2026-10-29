import React from 'react';

interface TermsProps {
  termsHtml: string;
}

export default function Terms({ termsHtml }: TermsProps) {
  return (
    <div className="terms-section pt-[4mm] mb-[10mm] break-before-page">
      <div
        className="terms-content text-[3.8mm] leading-[1.4] text-black"
        dangerouslySetInnerHTML={{ __html: termsHtml }}
      />
    </div>
  );
}
