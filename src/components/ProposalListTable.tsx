'use client';

import React, { useState, useMemo } from 'react';
import type { ProposalDocument } from '@/lib/schema/types';
import {
  Search,
  RefreshCw,
  FileText,
  AlertCircle,
  Download,
  Plus,
  Copy,
  Edit3,
  Trash2,
  ExternalLink,
  Shield,
  Loader2,
  Check,
} from 'lucide-react';
import ProposalEditorModal, { ProposalFormData } from './ProposalEditorModal';

interface ProposalListTableProps {
  proposals: ProposalDocument[];
  isStale: boolean;
  lastUpdated: string | null;
  currentUser: string;
}

export default function ProposalListTable({
  proposals: initialProposals,
  isStale,
  lastUpdated,
  currentUser,
}: ProposalListTableProps) {
  const [proposals, setProposals] = useState<ProposalDocument[]>(initialProposals);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'ready' | 'draft'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [duplicatingSlug, setDuplicatingSlug] = useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<ProposalFormData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadProposals = async () => {
    try {
      const res = await fetch('/api/proposals');
      if (res.ok) {
        const data = await res.json();
        if (data.proposals) {
          setProposals(data.proposals);
        }
      }
    } catch {
      window.location.reload();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await reloadProposals();
      showToast('Proposals refreshed successfully');
    } catch (err: any) {
      alert(`Network error: ${err?.message || 'Connection failed'}`);
    } finally {
      setRefreshing(false);
    }
  };

  // 1-Click Duplicate Handler
  const handleDuplicate = async (slug: string) => {
    setDuplicatingSlug(slug);
    try {
      const res = await fetch(`/api/proposals/${encodeURIComponent(slug)}/duplicate`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to duplicate');
      }

      showToast(`Duplicated successfully as "${data.proposal?.proposal_id}"`);
      await reloadProposals();
    } catch (err: any) {
      alert(`Error duplicating proposal: ${err?.message || 'Failed'}`);
    } finally {
      setDuplicatingSlug(null);
    }
  };

  // Open Edit Modal Handler
  const handleEdit = async (slug: string) => {
    try {
      const res = await fetch(`/api/proposals/${encodeURIComponent(slug)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.proposal) {
        throw new Error(data.error || 'Failed to fetch proposal details');
      }

      const raw = data.proposal;
      const formattedData: ProposalFormData = {
        proposal_id: raw.proposal_id,
        title: raw.title || '',
        status: raw.status || 'draft',
        version: raw.version || 'v1',
        cover_image_url: raw.cover_image_url || '',
        tour_type: raw.tour_type || 'Private Tour',
        travel_date: raw.travel_date ? String(raw.travel_date) : '',
        route: raw.route || '',
        intro_text: raw.intro_text || '',
        extra_info: raw.extra_info || '',
        custom_html: raw.custom_html || '',
        itinerary: Array.isArray(raw.itinerary)
          ? raw.itinerary.map((d: any, idx: number) => ({
              day_no: Number(d.day_no || idx + 1),
              day_title: String(d.day_title || `Day ${idx + 1}`),
              items: Array.isArray(d.items) ? d.items.join('\n') : String(d.items || ''),
              accommodation_note: String(d.accommodation_note || ''),
              image_url: String(d.image_url || ''),
            }))
          : [],
        pricing: Array.isArray(raw.pricing)
          ? raw.pricing.map((opt: any) => ({
              option_label: String(opt.option_label || 'OPTION #1'),
              stays: Array.isArray(opt.stays) ? opt.stays.join('\n') : String(opt.stays || ''),
              rows: (Array.isArray(opt.rows) ? opt.rows : []).map((r: any) => ({
                row_type: String(r.row_type || 'Standard'),
                price_amount: Number(r.price_amount) || 0,
                currency: String(r.currency || 'IDR'),
              })),
            }))
          : [],
        inclusions: Array.isArray(raw.inclusions)
          ? raw.inclusions.join('\n')
          : String(raw.inclusions || ''),
        exclusions: Array.isArray(raw.exclusions)
          ? raw.exclusions.join('\n')
          : String(raw.exclusions || ''),
      };

      setEditingData(formattedData);
      setIsEditMode(true);
      setIsModalOpen(true);
    } catch (err: any) {
      alert(`Error loading proposal: ${err?.message}`);
    }
  };

  // Open Create Modal Handler
  const handleOpenCreate = () => {
    setEditingData(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Delete Handler
  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" (${slug})? This cannot be undone.`)) {
      return;
    }

    setDeletingSlug(slug);
    try {
      const res = await fetch(`/api/proposals/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete');
      }
      showToast(`Proposal "${slug}" deleted.`);
      await reloadProposals();
    } catch (err: any) {
      alert(`Error deleting proposal: ${err?.message}`);
    } finally {
      setDeletingSlug(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar (shadcn light mode) */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3 group">
              <div className="h-9 w-auto flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Nusa Flores Travel"
                  className="max-h-9 max-w-[130px] object-contain"
                />
              </div>
              <div className="hidden sm:block border-l border-zinc-200 pl-3">
                <span className="text-sm font-semibold tracking-tight text-zinc-900 block leading-tight">
                  Tour Proposal Generator
                </span>
                <span className="text-xs text-zinc-500">Payload CMS Native</span>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            {/* New Proposal Button */}
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Proposal</span>
            </button>

            {/* Link to Payload Admin Panel */}
            <a
              href="/admin"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 shadow-xs transition-colors"
              title="Open Payload CMS Admin Panel"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Payload Admin</span>
              <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
            </a>

            <a
              href="/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 shadow-xs transition-colors"
            >
              <span>Settings</span>
            </a>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh proposals from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <div className="h-4 w-px bg-zinc-200 mx-1"></div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 hidden md:inline">
                <span className="font-medium text-zinc-800">{currentUser}</span>
              </span>
              <form action="/api/logout" method="POST">
                <button
                  type="submit"
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 px-2 py-1.5 rounded-md hover:bg-zinc-100 transition cursor-pointer"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Page Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Tour Proposals</h1>
            <p className="text-xs text-zinc-500 mt-1">
              Create, edit, duplicate, and export A4 client-ready proposal documents from Payload CMS.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-zinc-600 border border-zinc-200 shadow-2xs">
              Total: {proposals.length}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              Ready: {readyCount}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
              Drafts: {draftCount}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100/80 p-0.5 text-xs font-medium text-zinc-600 shadow-2xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                filter === 'all' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'hover:text-zinc-900'
              }`}
            >
              All ({proposals.length})
            </button>
            <button
              onClick={() => setFilter('ready')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                filter === 'ready' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'hover:text-zinc-900'
              }`}
            >
              Ready ({readyCount})
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                filter === 'draft' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'hover:text-zinc-900'
              }`}
            >
              Drafts ({draftCount})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, route, slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400 shadow-2xs focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition"
            />
          </div>
        </div>

        {/* Proposals Data Table */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-500 font-medium">
                  <th className="py-3 px-4 font-semibold text-zinc-700">Proposal</th>
                  <th className="py-3 px-4 font-semibold text-zinc-700 hidden md:table-cell">Route</th>
                  <th className="py-3 px-4 font-semibold text-zinc-700 text-center">Days</th>
                  <th className="py-3 px-4 font-semibold text-zinc-700 text-center hidden sm:table-cell">
                    Options
                  </th>
                  <th className="py-3 px-4 font-semibold text-zinc-700 text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-zinc-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70">
                {filteredProposals.map((p) => {
                  const isReady = p.meta.status === 'ready';
                  const isDraft = p.meta.status === 'draft';
                  const isExportable = isReady && p.validation.isValid;
                  const isDuplicating = duplicatingSlug === p.meta.proposal_id;
                  const isDeleting = deletingSlug === p.meta.proposal_id;

                  return (
                    <tr
                      key={p.meta.proposal_id}
                      className="hover:bg-zinc-50/80 transition-colors group"
                    >
                      {/* Title & Slug */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/p/${p.meta.proposal_id}`}
                            className="font-semibold text-zinc-900 hover:text-emerald-700 transition-colors line-clamp-1"
                          >
                            {p.meta.title}
                          </a>
                          {p.meta.version && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200">
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
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Preview Button */}
                          <a
                            href={`/p/${p.meta.proposal_id}`}
                            className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 h-8 px-2.5 shadow-2xs transition-colors"
                            title="Preview proposal document"
                          >
                            Preview
                          </a>

                          {/* PDF Download Button */}
                          {isExportable ? (
                            <a
                              href={`/p/${p.meta.proposal_id}/pdf`}
                              className="inline-flex items-center justify-center gap-1 rounded-md text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 h-8 px-2.5 shadow-2xs transition-colors"
                              download
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </a>
                          ) : (
                            <button
                              disabled
                              className="inline-flex items-center justify-center rounded-md text-xs font-medium bg-zinc-100 text-zinc-400 h-8 px-2 cursor-not-allowed border border-zinc-200"
                              title={isDraft ? 'Export available only for Ready status' : 'Export blocked'}
                            >
                              PDF
                            </button>
                          )}

                          {/* 1-Click Copy / Duplicate Button */}
                          <button
                            onClick={() => handleDuplicate(p.meta.proposal_id)}
                            disabled={isDuplicating}
                            className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 h-8 px-2.5 shadow-2xs transition-colors disabled:opacity-50"
                            title="Duplicate this proposal to create a new draft"
                          >
                            {isDuplicating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-zinc-600" />
                            )}
                            <span className="hidden lg:inline ml-1">Copy</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleEdit(p.meta.proposal_id)}
                            className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 h-8 px-2.5 shadow-2xs transition-colors"
                            title="Edit proposal in visual form"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-zinc-600" />
                            <span className="hidden lg:inline ml-1">Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(p.meta.proposal_id, p.meta.title)}
                            disabled={isDeleting}
                            className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-zinc-200 bg-white hover:bg-rose-50 text-rose-600 h-8 px-2 shadow-2xs transition-colors disabled:opacity-50"
                            title="Delete proposal"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
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
              <p className="text-xs text-zinc-500 mb-4">
                No proposals match your current filter or search criteria.
              </p>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-zinc-900 text-white hover:bg-zinc-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Your First Proposal</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Proposal Editor / Creator Modal */}
      <ProposalEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={reloadProposals}
        initialData={editingData}
        isEditMode={isEditMode}
      />
    </div>
  );
}
