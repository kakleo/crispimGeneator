export type ProposalStatus = 'draft' | 'ready' | 'archived';

export function normalizeStatus(val: unknown): ProposalStatus {
  const s = String(val || '').toLowerCase().trim();
  if (s === 'ready') return 'ready';
  if (s === 'archived') return 'archived';
  return 'draft';
}

/**
 * Normalizes hotlinked image URLs from various services:
 * - Direct URLs: preserves intact
 * - Google Drive share links: converts to direct high-res stream via lh3
 * - Dropbox share links: ensures raw=1
 * - Strips leading/trailing quotes and whitespace
 */
export function normalizeImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim().replace(/^["']+|["']+$/g, '');
  if (!clean) return '';

  // 1. Google Drive view/open links: convert to direct image stream
  const driveFileMatch = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }
  const driveIdMatch = clean.match(/drive\.google\.com\/.*?[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveIdMatch && driveIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}`;
  }

  // 2. Dropbox links: change dl=0 to raw=1 for direct image stream
  if (clean.includes('dropbox.com')) {
    clean = clean.replace(/([?&])dl=0\b/, '$1raw=1');
    if (!clean.includes('raw=1')) {
      clean += clean.includes('?') ? '&raw=1' : '?raw=1';
    }
    return clean;
  }

  return clean;
}

export interface RawRow {
  [key: string]: any;
}

export interface SheetData {
  proposals: RawRow[];
  itinerary: RawRow[];
  pricing: RawRow[];
  inclusions: RawRow[];
  settings: RawRow[];
}

export interface ProposalMeta {
  proposal_id: string;
  status: ProposalStatus;
  version?: string;
  title: string;
  cover_image_url?: string;
  intro_text?: string;
  tour_type?: string;
  travel_date?: string;
  route?: string;
  extra_info?: string;
  custom_html?: string;
  terms_variant?: string;
}

export interface ItineraryDay {
  proposal_id: string;
  day_no: number;
  day_title: string;
  items: string[];
  accommodation_note?: string;
  image_url?: string;
}

export interface PricingRow {
  proposal_id: string;
  option_label: string;
  row_type: string;
  price_amount: number;
  currency: string;
  stays: string[];
}

export interface PricingOptionGroup {
  label: string;
  rows: Array<{
    type: string;
    price: string;
    rawPrice: number;
    currency: string;
    stays: string[];
  }>;
}

export interface InclusionItem {
  proposal_id: string;
  kind: 'include' | 'exclude';
  sort: number;
  text: string;
}

export interface SiteSettings {
  company_name: string;
  website: string;
  whatsapp: string;
  instagram: string;
  logo_url?: string;
  primary_green: string;
  accent_blue: string;
  exclude_red: string;
}

export interface ValidationError {
  tab: string;
  row: number;
  column: string;
  message: string;
}

export interface ValidationWarning {
  tab: string;
  row?: number;
  column?: string;
  message: string;
}

export interface ProposalDocument {
  meta: ProposalMeta;
  settings: SiteSettings;
  itinerary: ItineraryDay[];
  pricingOptions: PricingOptionGroup[];
  inclusions: {
    include: string[];
    exclude: string[];
  };
  extraInfoRows: Array<[string, string]>;
  introParagraphs: string[];
  sanitizedHtml?: string;
  termsHtml: string;
  lastUpdated?: string;
  isStale?: boolean;
  validation: {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  };
}
