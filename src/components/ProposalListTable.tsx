'use client';

import React, { useState, useMemo } from 'react';
import type { ProposalDocument } from '@/lib/schema/types';
import { Search, RefreshCw, FileText, AlertCircle, Download } from 'lucide-react';

interface ProposalListTableProps {
  proposals: ProposalDocument[];
  isStale: boolean;
  lastUpdated: string | null;
  currentUser: string;
}

export default function ProposalListTable({
  proposals,
  isStale,
  lastUpdated,
  currentUser,
}: ProposalListTableProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'ready' | 'draft'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const readyCount = useMemo(
    () => proposals.filter((p) => p.meta.status === 'ready').length,
    [proposals]
  );
  const draftCount = useMemo(
    () => proposals.filter((p) => p.meta.status === 'draft').length,
    [proposals]
  );

  const filteredProposals = useMemo(() => {
    const q = search.toLowerCase().trim();
    return proposals.filter((p) => {
      const title = (p.meta?.title || '').toLowerCase();
      const route = (p.meta?.route || '').toLowerCase();
      const slug = (p.meta?.proposal_id || '').toLowerCase();
      const status = p.meta?.status || 'draft';

      const matchesSearch = !q || title.includes(q) || route.includes(q) || slug.includes(q);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'ready' && status === 'ready') ||
        (filter === 'draft' && status === 'draft');

      return matchesSearch && matchesFilter;
    });
  }, [proposals, search, filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/refresh', { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to refresh Google Sheet data: ${errData.error || res.statusText}`);
      }
    } catch (err: any) {
      alert(`Network error while refreshing: ${err?.message || 'Connection failed'}`);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Navigation Bar (shadcn light mode) */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3 group">
              <div className="h-9 w-auto flex items-center justify-center">
                <img src="/logo.png" alt="Nusa Flores Travel" className="max-h-9 max-w-[130px] object-contain" />
              </div>
              <div className="hidden sm:block border-l border-zinc-200 pl-3">
                <span className="text-sm font-semibold tracking-tight text-zinc-900 block leading-tight">
                  Tour Proposal Generator
                </span>
                <span className="text-xs text-zinc-500">Nusa Flores Travel</span>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-3">
            {isStale && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Cached Data
              </span>
            )}

            <a
              href="/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 shadow-sm transition-colors"
            >
              <span>Settings</span>
            </a>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              title="Force refresh Google Sheet data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <div className="h-4 w-px bg-zinc-200 mx-1"></div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 hidden md:inline">
                <span className="font-medium text-zinc-800">{currentUser}</span>
              </span>
              <form action="/api/logout" method="POST">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 h-8 px-2.5 transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Proposals</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Synced directly from your Google Sheet. Open a live preview or export directly to A4 PDF.
            </p>
          </div>

          {/* Search Box (shadcn Input style) */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter proposals by title or route..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Segmented Tabs (shadcn Tabs style) */}
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center rounded-lg bg-zinc-100 p-1 text-zinc-500">
            <button
              onClick={() => setFilter('all')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-zinc-950 shadow-sm font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900 font-medium'
              }`}
            >
              All ({proposals.length})
            </button>
            <button
              onClick={() => setFilter('ready')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs transition-all cursor-pointer ${
                filter === 'ready'
                  ? 'bg-white text-zinc-950 shadow-sm font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900 font-medium'
              }`}
            >
              Ready ({readyCount})
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs transition-all cursor-pointer ${
                filter === 'draft'
                  ? 'bg-white text-zinc-950 shadow-sm font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900 font-medium'
              }`}
            >
              Drafts ({draftCount})
            </button>
          </div>

          {lastUpdated && (
            <span className="text-xs text-zinc-400 hidden sm:inline">
              Last synced: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Proposals List (shadcn Table style) */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-500 font-semibold">
                  <th className="py-3 px-4">Tour Proposal</th>
                  <th className="py-3 px-4 hidden md:table-cell">Route</th>
                  <th className="py-3 px-4 text-center">Days</th>
                  <th className="py-3 px-4 text-center hidden sm:table-cell">Options</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredProposals.map((p) => {
                  const isDraft = p.meta.status === 'draft';
                  const isReady = p.meta.status === 'ready';
                  const isExportable = p.validation.isValid && isReady;

                  return (
                    <tr key={p.meta.proposal_id} className="hover:bg-zinc-50/80 transition-colors">
                      {/* Proposal Title & Slug */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/p/${p.meta.proposal_id}`}
                            className="font-semibold text-zinc-900 hover:text-zinc-600 hover:underline transition-colors text-sm"
                          >
                            {p.meta.title}
                          </a>
                          {p.meta.version && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200">
                              {p.meta.version}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          {p.meta.proposal_id}
                        </div>
                        {p.validation.errors.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 mt-1 font-medium">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            {p.validation.errors.length} blocking error(s)
                          </span>
                        )}
                      </td>

                      {/* Route */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-zinc-600">
                        <span className="line-clamp-1 max-w-xs">{p.meta.route || '-'}</span>
                      </td>

                      {/* Days */}
                      <td className="py-3.5 px-4 text-center font-medium text-zinc-700">
                        {p.itinerary.length}d
                      </td>

                      {/* Pricing Options */}
                      <td className="py-3.5 px-4 text-center hidden sm:table-cell text-zinc-600">
                        {p.pricingOptions.length}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {isReady && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Ready
                          </span>
                        )}
                        {isDraft && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Draft
                          </span>
                        )}
                        {!isReady && !isDraft && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                            Archived
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <a
                            href={`/p/${p.meta.proposal_id}`}
                            className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 h-8 px-3 shadow-sm transition-colors"
                          >
                            Preview
                          </a>

                          {isExportable ? (
                            <a
                              href={`/p/${p.meta.proposal_id}/pdf`}
                              className="inline-flex items-center justify-center gap-1 rounded-md text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 h-8 px-3 shadow-sm transition-colors"
                              download
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </a>
                          ) : (
                            <button
                              disabled
                              className="inline-flex items-center justify-center rounded-md text-xs font-medium bg-zinc-100 text-zinc-400 h-8 px-2.5 cursor-not-allowed border border-zinc-200"
                              title={isDraft ? 'Export available only for Ready status' : 'Export blocked'}
                            >
                              {isDraft ? 'Draft' : 'Blocked'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredProposals.length === 0 && (
            <div className="py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-1">No proposals found</h3>
              <p className="text-xs text-zinc-500">No proposals match your current filter or search criteria.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
