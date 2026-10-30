'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle2,
  Info,
  Loader2,
  Hotel,
} from 'lucide-react';

export interface DayInput {
  day_no: number;
  day_title: string;
  items: string;
  accommodation_note: string;
  image_url: string;
}

export interface PricingVariantInput {
  row_type: string;
  price_amount: number;
  currency: string;
}

export interface PricingOptionInput {
  option_label: string;
  stays: string;
  rows: PricingVariantInput[];
}

export interface ProposalFormData {
  proposal_id: string;
  title: string;
  status: 'draft' | 'ready' | 'archived';
  version: string;
  cover_image_url: string;
  tour_type: string;
  travel_date: string;
  route: string;
  intro_text: string;
  extra_info: string;
  custom_html: string;
  itinerary: DayInput[];
  pricing: PricingOptionInput[];
  inclusions: string;
  exclusions: string;
}

interface ProposalEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: ProposalFormData | null;
  isEditMode?: boolean;
}

const DEFAULT_FORM: ProposalFormData = {
  proposal_id: '',
  title: '',
  status: 'draft',
  version: 'v1',
  cover_image_url: '',
  tour_type: 'Private Tour (Minimum 2 People)',
  travel_date: '2026',
  route: '',
  intro_text:
    'Please find your detailed tour quotation in the following pages. Thank you for choosing us at Nusa Flores Travel and we hope you will have a memorable journey.\n\nIf you find anything unpleasant during the trip, please do not hesitate to contact us and we will do everything we can to assist you.',
  extra_info: 'Pickup: Airport\nDropoff: Port / Airport',
  custom_html: '',
  itinerary: [
    {
      day_no: 1,
      day_title: 'Arrival & Transfer',
      items: 'Airport pickup and transfer to hotel.\nCheck in and rest.\nEvening welcome dinner.',
      accommodation_note: 'See Price List',
      image_url: '',
    },
  ],
  pricing: [
    {
      option_label: 'OPTION #1',
      stays: 'Day 1: Hotel Moni\nDay 2: Hotel Bajawa\nDay 3: Hotel Ruteng',
      rows: [
        { row_type: 'Without Tour Guide', price_amount: 5000000, currency: 'IDR' },
        { row_type: 'Include Tour Guide', price_amount: 6100000, currency: 'IDR' },
      ],
    },
  ],
  inclusions:
    'Private Car, driver and petrol\nTour Guide\nEntrance fee\nMineral water\nAccomodation 3 nights\n3x Breakfast at Hotel',
  exclusions: 'Flight tickets\nLunch and dinner\nOptional tour',
};

export default function ProposalEditorModal({
  isOpen,
  onClose,
  onSaved,
  initialData,
  isEditMode = false,
}: ProposalEditorModalProps) {
  const [formData, setFormData] = useState<ProposalFormData>(initialData || DEFAULT_FORM);
  const [activeTab, setActiveTab] = useState<'general' | 'itinerary' | 'pricing' | 'inclusions'>(
    'general'
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handlers for Basic Info
  const updateField = (field: keyof ProposalFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Itinerary Handlers
  const addDay = () => {
    const nextNo = formData.itinerary.length + 1;
    setFormData((prev) => ({
      ...prev,
      itinerary: [
        ...prev.itinerary,
        {
          day_no: nextNo,
          day_title: `Day ${nextNo} Activity`,
          items: '',
          accommodation_note: 'See Price List',
          image_url: '',
        },
      ],
    }));
  };

  const removeDay = (idx: number) => {
    setFormData((prev) => {
      const updated = prev.itinerary.filter((_, i) => i !== idx);
      // Re-number days
      return {
        ...prev,
        itinerary: updated.map((d, i) => ({ ...d, day_no: i + 1 })),
      };
    });
  };

  const updateDay = (idx: number, field: keyof DayInput, val: any) => {
    setFormData((prev) => {
      const copy = [...prev.itinerary];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, itinerary: copy };
    });
  };

  // Pricing Handlers (Pain Free!)
  const addPricingOption = () => {
    const optNo = formData.pricing.length + 1;
    setFormData((prev) => ({
      ...prev,
      pricing: [
        ...prev.pricing,
        {
          option_label: `OPTION #${optNo}`,
          stays: '',
          rows: [
            { row_type: 'Without Tour Guide', price_amount: 5000000, currency: 'IDR' },
            { row_type: 'Include Tour Guide', price_amount: 6000000, currency: 'IDR' },
          ],
        },
      ],
    }));
  };

  const removePricingOption = (optIdx: number) => {
    setFormData((prev) => ({
      ...prev,
      pricing: prev.pricing.filter((_, i) => i !== optIdx),
    }));
  };

  const updatePricingOptionLabel = (optIdx: number, val: string) => {
    setFormData((prev) => {
      const copy = [...prev.pricing];
      copy[optIdx] = { ...copy[optIdx], option_label: val };
      return { ...prev, pricing: copy };
    });
  };

  const updatePricingOptionStays = (optIdx: number, val: string) => {
    setFormData((prev) => {
      const copy = [...prev.pricing];
      copy[optIdx] = { ...copy[optIdx], stays: val };
      return { ...prev, pricing: copy };
    });
  };

  const addPricingVariant = (optIdx: number) => {
    setFormData((prev) => {
      const copy = [...prev.pricing];
      copy[optIdx] = {
        ...copy[optIdx],
        rows: [
          ...copy[optIdx].rows,
          { row_type: 'Standard Package', price_amount: 0, currency: 'IDR' },
        ],
      };
      return { ...prev, pricing: copy };
    });
  };

  const removePricingVariant = (optIdx: number, varIdx: number) => {
    setFormData((prev) => {
      const copy = [...prev.pricing];
      copy[optIdx] = {
        ...copy[optIdx],
        rows: copy[optIdx].rows.filter((_, i) => i !== varIdx),
      };
      return { ...prev, pricing: copy };
    });
  };

  const updatePricingVariant = (
    optIdx: number,
    varIdx: number,
    field: keyof PricingVariantInput,
    val: any
  ) => {
    setFormData((prev) => {
      const copy = [...prev.pricing];
      const rows = [...copy[optIdx].rows];
      rows[varIdx] = { ...rows[varIdx], [field]: val };
      copy[optIdx] = { ...copy[optIdx], rows };
      return { ...prev, pricing: copy };
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.proposal_id.trim()) {
      setError('Proposal ID (Slug) is required.');
      return;
    }
    if (!formData.title.trim()) {
      setError('Tour Title is required.');
      return;
    }
    if (formData.itinerary.length === 0) {
      setError('At least 1 itinerary day is required.');
      return;
    }
    if (formData.pricing.length === 0) {
      setError('At least 1 pricing option is required.');
      return;
    }

    setSubmitting(true);
    try {
      const url = isEditMode
        ? `/api/proposals/${encodeURIComponent(formData.proposal_id)}`
        : '/api/proposals';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save proposal');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error saving proposal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/60">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              {isEditMode ? `Edit Proposal: ${formData.title || formData.proposal_id}` : 'Create New Tour Proposal'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Data is saved and managed directly in your Payload CMS database.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 bg-white px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>General Info</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('itinerary')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'itinerary'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Itinerary ({formData.itinerary.length} Days)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'pricing'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Price Table ({formData.pricing.length} Options)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inclusions')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'inclusions'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Inclusions & Terms</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: GENERAL INFO */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Proposal ID (Slug) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isEditMode}
                    value={formData.proposal_id}
                    onChange={(e) =>
                      updateField('proposal_id', e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))
                    }
                    placeholder="e.g. komodo-island-3d"
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none disabled:bg-zinc-100 font-mono"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Used in URL: /p/{formData.proposal_id || 'slug'}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none bg-white"
                  >
                    <option value="draft">Draft (Editing in progress)</option>
                    <option value="ready">Ready (Exportable & Published)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Tour Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g. FLORES OVERLAND & KOMODO TOUR 5 DAYS"
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Version</label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => updateField('version', e.target.value)}
                    placeholder="e.g. v1, v2, v3"
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Tour Type</label>
                  <input
                    type="text"
                    value={formData.tour_type}
                    onChange={(e) => updateField('tour_type', e.target.value)}
                    placeholder="e.g. Private Tour (Min 2 Pax)"
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Travel Date / Year</label>
                  <input
                    type="text"
                    value={formData.travel_date}
                    onChange={(e) => updateField('travel_date', e.target.value)}
                    placeholder="e.g. 2026 or Oct 2026"
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Route Summary</label>
                <input
                  type="text"
                  value={formData.route}
                  onChange={(e) => updateField('route', e.target.value)}
                  placeholder="e.g. Ende - Kelimutu - Bajawa - Ruteng - Labuan Bajo"
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Cover Image URL (Hero Photo)</label>
                <input
                  type="text"
                  value={formData.cover_image_url}
                  onChange={(e) => updateField('cover_image_url', e.target.value)}
                  placeholder="Leave empty for default scenic cover, or paste image URL / public path"
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB 2: ITINERARY BUILDER */}
          {activeTab === 'itinerary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                <span className="text-xs font-semibold text-zinc-700">Days Timeline</span>
                <button
                  type="button"
                  onClick={addDay}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Next Day</span>
                </button>
              </div>

              {formData.itinerary.map((day, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-md bg-[#00897b] text-white flex items-center justify-center font-bold text-xs select-none">
                        D{day.day_no}
                      </span>
                      <input
                        type="text"
                        required
                        value={day.day_title}
                        onChange={(e) => updateDay(idx, 'day_title', e.target.value)}
                        placeholder="Day Title (e.g. Journey to Moni)"
                        className="px-3 py-1.5 text-xs font-medium border border-zinc-300 rounded-md bg-white w-64 md:w-80 shadow-xs focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeDay(idx)}
                      disabled={formData.itinerary.length <= 1}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove Day"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                      Activities & Highlights (one per line)
                    </label>
                    <textarea
                      rows={3}
                      value={day.items}
                      onChange={(e) => updateDay(idx, 'items', e.target.value)}
                      placeholder="e.g. Picked up at airport and transfer to hotel&#10;Visit Wologai traditional village&#10;Overnight stay at lodge"
                      className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md bg-white shadow-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Accommodation Note
                      </label>
                      <input
                        type="text"
                        value={day.accommodation_note}
                        onChange={(e) => updateDay(idx, 'accommodation_note', e.target.value)}
                        placeholder="e.g. See Price List or Hotel Moni"
                        className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-md bg-white shadow-xs focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Polaroid Photo URL (optional)
                      </label>
                      <input
                        type="text"
                        value={day.image_url}
                        onChange={(e) => updateDay(idx, 'image_url', e.target.value)}
                        placeholder="Image URL for this day"
                        className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-md bg-white shadow-xs focus:ring-1 focus:ring-zinc-900 font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: PRICE TABLE BUILDER (PAIN FREE!) */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-800">Price Packages & Hotel Stays</h3>
                  <p className="text-[11px] text-zinc-500">
                    No more pipes or semicolons. Enter options, stays, and price variants cleanly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addPricingOption}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Price Option</span>
                </button>
              </div>

              {formData.pricing.map((opt, optIdx) => (
                <div
                  key={optIdx}
                  className="p-5 rounded-xl border-2 border-zinc-200 bg-white shadow-sm space-y-4"
                >
                  {/* Option Header */}
                  <div className="flex items-center justify-between gap-4 pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Option Label:
                      </span>
                      <input
                        type="text"
                        required
                        value={opt.option_label}
                        onChange={(e) => updatePricingOptionLabel(optIdx, e.target.value)}
                        placeholder="e.g. OPTION #1 (Standard Hotel)"
                        className="px-3 py-1.5 text-xs font-bold border border-zinc-300 rounded-md bg-zinc-50 shadow-xs focus:ring-1 focus:ring-zinc-900 flex-1"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removePricingOption(optIdx)}
                      disabled={formData.pricing.length <= 1}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove this option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Hotel Stays for this Option */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 mb-1">
                      <Hotel className="w-3.5 h-3.5 text-teal-600" />
                      <span>Hotel Stays for this Option (one per line)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={opt.stays}
                      onChange={(e) => updatePricingOptionStays(optIdx, e.target.value)}
                      placeholder="e.g. Bintang Lodge Moni - Day 1&#10;Silverin Hotel Bajawa - Day 2&#10;Sky Flores Hotel Ruteng - Day 3"
                      className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md bg-zinc-50/50 shadow-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                    />
                  </div>

                  {/* Pricing Variants List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-zinc-700">
                        Price Variants (per person)
                      </span>
                      <button
                        type="button"
                        onClick={() => addPricingVariant(optIdx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Variant</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {opt.rows.map((row, varIdx) => (
                        <div
                          key={varIdx}
                          className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200"
                        >
                          <input
                            type="text"
                            required
                            value={row.row_type}
                            onChange={(e) =>
                              updatePricingVariant(optIdx, varIdx, 'row_type', e.target.value)
                            }
                            placeholder="Package Type (e.g. Without Guide / Include Guide)"
                            className="px-3 py-1.5 text-xs border border-zinc-300 rounded bg-white flex-1 min-w-[180px]"
                          />

                          <div className="flex items-center gap-1.5">
                            <select
                              value={row.currency}
                              onChange={(e) =>
                                updatePricingVariant(optIdx, varIdx, 'currency', e.target.value)
                              }
                              className="px-2 py-1.5 text-xs border border-zinc-300 rounded bg-white font-medium"
                            >
                              <option value="IDR">IDR</option>
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                              <option value="AUD">AUD</option>
                              <option value="SGD">SGD</option>
                            </select>

                            <input
                              type="number"
                              required
                              value={row.price_amount}
                              onChange={(e) =>
                                updatePricingVariant(
                                  optIdx,
                                  varIdx,
                                  'price_amount',
                                  Number(e.target.value) || 0
                                )
                              }
                              placeholder="Price"
                              className="px-3 py-1.5 text-xs border border-zinc-300 rounded bg-white w-32 font-semibold text-right"
                            />

                            <span className="text-[11px] text-zinc-400">/ person</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removePricingVariant(optIdx, varIdx)}
                            disabled={opt.rows.length <= 1}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 rounded disabled:opacity-25"
                            title="Remove variant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: INCLUSIONS & TERMS */}
          {activeTab === 'inclusions' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Introductory Greeting Text
                </label>
                <textarea
                  rows={3}
                  value={formData.intro_text}
                  onChange={(e) => updateField('intro_text', e.target.value)}
                  placeholder="Welcoming message displayed on page 2"
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Extra Info (e.g. Pickup & Dropoff details)
                </label>
                <textarea
                  rows={2}
                  value={formData.extra_info}
                  onChange={(e) => updateField('extra_info', e.target.value)}
                  placeholder="Pickup: Ende Airport&#10;Dropoff: Labuan Bajo Port"
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-emerald-700 mb-1">
                    Include Items (one per line)
                  </label>
                  <textarea
                    rows={6}
                    value={formData.inclusions}
                    onChange={(e) => updateField('inclusions', e.target.value)}
                    placeholder="Private Car, driver and petrol&#10;Tour Guide&#10;Entrance fees&#10;Mineral water&#10;Breakfast"
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-rose-700 mb-1">
                    Exclude Items (one per line)
                  </label>
                  <textarea
                    rows={6}
                    value={formData.exclusions}
                    onChange={(e) => updateField('exclusions', e.target.value)}
                    placeholder="Flight tickets&#10;Lunch and dinner&#10;Optional tours&#10;Personal expenses"
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Custom HTML (optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.custom_html}
                  onChange={(e) => updateField('custom_html', e.target.value)}
                  placeholder="Optional sanitized custom HTML block"
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-md shadow-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-zinc-200 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              {formData.itinerary.length} days &bull; {formData.pricing.length} price options
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium border border-zinc-300 rounded-md text-zinc-700 hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs transition disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isEditMode ? 'Update Proposal' : 'Create Proposal'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
