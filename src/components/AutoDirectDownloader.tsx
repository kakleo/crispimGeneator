'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AutoDirectDownloaderProps {
  filename: string;
  proposalId: string;
}

export default function AutoDirectDownloader({ filename, proposalId }: AutoDirectDownloaderProps) {
  const [status, setStatus] = useState<'working' | 'done' | 'error'>('working');
  const [progressMsg, setProgressMsg] = useState('Generating high-resolution PDF...');

  useEffect(() => {
    let isMounted = true;

    async function runDownload() {
      try {
        // Allow images & fonts to mount in DOM
        await new Promise((r) => setTimeout(r, 400));
        if (!isMounted) return;

        // 1. Try server-side Chromium PDF (pixel-perfect)
        try {
          const res = await fetch(`/p/${encodeURIComponent(proposalId)}/pdf`);
          const contentType = res.headers.get('content-type') || '';

          if (res.ok && contentType.includes('application/pdf')) {
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
        } catch {
          // Server PDF failed, fall through to client-side
        }

        // 2. Fallback: client-side html2canvas
        if (isMounted) setProgressMsg('Rendering PDF client-side...');
        const { downloadProposalPdfDirectly } = await import('@/lib/pdf/client-download');
        await downloadProposalPdfDirectly(filename, (progress) => {
          if (isMounted) setProgressMsg(progress.message);
        });

        if (isMounted) {
          setStatus('done');
          setProgressMsg(`Downloaded ${filename} successfully!`);
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus('error');
          setProgressMsg(`Could not download PDF: ${err?.message || 'Error occurred'}`);
        }
      }
    }

    runDownload();

    return () => {
      isMounted = false;
    };
  }, [filename, proposalId]);

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
