'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { downloadProposalPdfDirectly, DownloadProgress } from '@/lib/pdf/client-download';

interface AutoDirectDownloaderProps {
  filename: string;
}

export default function AutoDirectDownloader({ filename }: AutoDirectDownloaderProps) {
  const [status, setStatus] = useState<'working' | 'done' | 'error'>('working');
  const [progressMsg, setProgressMsg] = useState('Initializing high-resolution PDF download...');

  useEffect(() => {
    let isMounted = true;

    async function runDownload() {
      try {
        // Allow images & fonts to settle in DOM
        await new Promise((r) => setTimeout(r, 600));
        if (!isMounted) return;

        await downloadProposalPdfDirectly(filename, (progress: DownloadProgress) => {
          if (isMounted) {
            setProgressMsg(progress.message);
          }
        });

        if (isMounted) {
          setStatus('done');
          setProgressMsg(`Downloaded ${filename} successfully!`);
        }
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
