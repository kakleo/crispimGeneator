'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AutoDirectDownloaderProps {
  filename: string;
}

export default function AutoDirectDownloader({ filename }: AutoDirectDownloaderProps) {
  const [status, setStatus] = useState<'working' | 'done' | 'error'>('working');
  const [progressMsg, setProgressMsg] = useState('Generating high-resolution PDF with images...');

  useEffect(() => {
    let isMounted = true;

    async function runDownload() {
      try {
        // Allow images & fonts to mount in DOM
        await new Promise((r) => setTimeout(r, 600));
        if (!isMounted) return;

        const previewEl = document.querySelector('.preview-viewport');
        if (!previewEl) {
          throw new Error('Could not find proposal viewport to render.');
        }

        const fullHtml = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            ${document.head.innerHTML}
            <style>
              body { margin: 0; padding: 0; background-color: #ffffff !important; }
              .no-print { display: none !important; }
            </style>
          </head>
          <body class="${document.body.className}">
            ${previewEl.outerHTML}
          </body>
        </html>`;

        if (isMounted) {
          setProgressMsg('Processing PDF & resolving hotlink images...');
        }

        const res = await fetch('/api/export-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: fullHtml, filename }),
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/pdf')) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            if (isMounted) {
              setStatus('done');
              setProgressMsg(`Downloaded ${filename} successfully!`);
            }
            return;
          }
        }

        throw new Error('Server PDF export failed');
      } catch (err: any) {
        if (isMounted) {
          setStatus('error');
          setProgressMsg(`Could not download PDF directly: ${err?.message || 'Error occurred'}`);
        }
      }
    }

    runDownload();

    return () => {
      isMounted = false;
    };
  }, [filename]);

  return (
    <div className="no-print bg-zinc-950 text-white px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 shadow-sm">
      <div className="flex items-center gap-2">
        {status === 'working' && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />}
        {status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
        {status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
        <span className="font-medium text-zinc-200">{progressMsg}</span>
      </div>

      {status === 'done' && (
        <span className="text-[11px] text-zinc-400">
          Saved directly to your Downloads folder without opening print window.
        </span>
      )}
    </div>
  );
}
