'use client';

import React, { useState } from 'react';
import { ProposalDocument, normalizeStatus } from '@/lib/schema/types';
import { RefreshCw, Printer, Download, ArrowLeft, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface ToolbarProps {
  proposal: ProposalDocument;
}

export default function Toolbar({ proposal }: ToolbarProps) {
  const { meta, validation, isStale, lastUpdated } = proposal;
  const status = normalizeStatus(meta.status);
  const isExportable = validation.isValid && status !== 'archived';
  const isDraft = status === 'draft';

  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string>('');

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/refresh', { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to refresh data: ${errData.error || res.statusText}`);
      }
    } catch (err: any) {
      alert(`Network error while refreshing: ${err?.message || 'Connection failed'}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    const today = new Date().toISOString().split('T')[0];
    const ver = meta.version ? `-${meta.version}` : '';
    const filename = `${meta.proposal_id}${ver}-${today}.pdf`;

    try {
      // 1. Server-side Chromium PDF (pixel-perfect, works on Vercel with @sparticuz/chromium)
      setDownloadStatus('Generating high-resolution PDF...');
      const res = await fetch(`/p/${encodeURIComponent(meta.proposal_id)}/pdf`);
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
        return;
      }

      // 2. Fallback: client-side html2canvas (if server PDF fails)
      setDownloadStatus('Rendering PDF client-side...');
      const { downloadProposalPdfDirectly } = await import('@/lib/pdf/client-download');
      await downloadProposalPdfDirectly(filename, (progress) => {
        setDownloadStatus(progress.message);
      });
    } catch (err: any) {
      console.error('PDF export error:', err);
      alert(`Failed to download PDF: ${err?.message || 'Error occurred'}`);
    } finally {
      setDownloading(false);
      setDownloadStatus('');
    }
  };

  return (
    <header className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur-sm text-zinc-900 shadow-sm border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Navigation & Title */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 px-3 py-1.5 rounded-md bg-white hover:bg-zinc-100 border border-zinc-200 shadow-xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Proposals</span>
          </a>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-zinc-900">
              {meta.title}
            </span>
            {meta.version && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">
                {meta.version}
              </span>
            )}
          </div>

          {/* Status Badge */}
          {status === 'ready' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Ready
            </span>
          )}
          {status === 'draft' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Draft
            </span>
          )}
          {status === 'archived' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
              Archived
            </span>
          )}

          {/* Stale Data Warning */}
          {isStale && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
              title="Google Sheets API unavailable; using last good cached data"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Stale Data
            </span>
          )}
        </div>

        {/* Right: Actions & Last Updated */}
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-zinc-400 hidden sm:inline mr-1">
              Updated {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-xs transition cursor-pointer disabled:opacity-50"
            title="Force refresh Google Sheet data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Browser Print Button (FR-23) */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-xs transition cursor-pointer"
            title="Print with browser dialog"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-500" />
            <span>Print</span>
          </button>

          {/* Download PDF Button (FR-18, FR-21, FR-31) */}
          {isExportable ? (
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm transition cursor-pointer disabled:opacity-50"
              title="Download proposal as PDF"
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Download className="w-3.5 h-3.5 text-white" />
              )}
              <span>{downloading ? (downloadStatus || 'Preparing PDF...') : 'Download PDF'}</span>
            </button>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
              title="PDF export blocked due to validation errors or archived status"
            >
              PDF Blocked
            </button>
          )}

          {/* Logout */}
          <form action="/api/logout" method="POST" className="inline">
            <button
              type="submit"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 px-2 py-1.5 rounded-md hover:bg-zinc-100 transition cursor-pointer"
              title="Sign out"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Draft Notice Watermark Banner */}
      {isDraft && (
        <div className="bg-amber-400 text-amber-950 px-4 py-1.5 text-center text-xs font-semibold tracking-wide uppercase flex items-center justify-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Draft Proposal &mdash; Not Ready For Client Distribution</span>
        </div>
      )}

      {/* Blocking Validation Error Banner */}
      {!validation.isValid && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">Validation Errors ({validation.errors.length}):</span>
            <span className="truncate max-w-xl">
              {validation.errors.map((e) => `[${e.tab}] ${e.message}`).join('; ')}
            </span>
          </div>
          <span className="text-[11px] bg-rose-700 px-2 py-0.5 rounded font-mono">Export Disabled</span>
        </div>
      )}
    </header>
  );
}
