import type {
  SheetData,
  ProposalDocument,
  ProposalMeta,
  ItineraryDay,
  PricingRow,
  PricingOptionGroup,
  InclusionItem,
  SiteSettings,
  ValidationError,
  ValidationWarning,
} from './types';
import { sanitizeCustomHtml } from '../sanitize';
import { getSiteSettings } from '../settings';

function formatCurrency(amount: number, currency: string = 'IDR'): string {
  const formattedNumber = new Intl.NumberFormat('id-ID').format(amount);
  return `${currency.toUpperCase()} ${formattedNumber}`;
}

function parseDayFromCell(cellContent: string, dayNo: number, proposalId: string): ItineraryDay | null {
  const trimmed = cellContent.trim();
  if (!trimmed) return null;

  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  let dayTitle = '';
  let accommodationNote: string | undefined;
  let imageUrl: string | undefined;
  const items: string[] = [];

  for (let j = 0; j < lines.length; j++) {
    const line = lines[j];
    const lower = line.toLowerCase();

    if (lower.startsWith('accommodation:') || lower.startsWith('accomodation:') || lower.startsWith('hotel:')) {
      accommodationNote = line.substring(line.indexOf(':') + 1).trim();
    } else if (lower.startsWith('image:') || lower.startsWith('photo:') || lower.startsWith('pic:')) {
      imageUrl = line.substring(line.indexOf(':') + 1).trim();
    } else if (!dayTitle) {
      dayTitle = line.replace(/^Day\s*\d+\s*[-:]\s*/i, '').trim() || line;
    } else {
      items.push(line.replace(/^[-•*]\s*/, ''));
    }
  }

  return {
    proposal_id: proposalId,
    day_no: dayNo,
    day_title: dayTitle || `Day ${String(dayNo).padStart(2, '0')}`,
    items: items.length > 0 ? items : ['Tour activities and visits'],
    accommodation_note: accommodationNote,
    image_url: imageUrl,
  };
}

function parseItineraryFromText(rawText: string, proposalId: string): ItineraryDay[] {
  const rawBlocks = rawText.includes('---')
    ? rawText.split(/\r?\n---\r?\n|\r?\n---$/m)
    : rawText.split(/\r?\n\s*\r?\n(?=DAY\s*\d+|Day\s*\d+)/i);

  const days: ItineraryDay[] = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i].trim();
    if (!block) continue;
    const parsed = parseDayFromCell(block, days.length + 1, proposalId);
    if (parsed) {
      days.push(parsed);
    }
  }

  return days;
}

function parsePricingFromText(rawText: string, proposalId: string): { rows: PricingRow[]; options: PricingOptionGroup[] } {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows: PricingRow[] = [];
  const optionsMap = new Map<string, PricingOptionGroup>();

  for (const line of lines) {
    // Delimited by pipe (|)
    const parts = line.split('|').map((p) => p.trim());
    if (parts.length < 3) continue;

    const optionLabel = parts[0] || 'OPTION #1';
    const rowType = parts[1] || 'Standard';
    const priceAmount = Number(parts[2].replace(/[^\d.-]/g, '')) || 0;
    const currency = parts.length >= 4 && parts[3] ? parts[3] : 'IDR';
    const rawStays = parts.length >= 5 ? parts[4] : '';
    const stays = rawStays ? rawStays.split(/;|\n/).map((s) => s.trim()).filter(Boolean) : [];

    const formattedPrice = formatCurrency(priceAmount, currency);

    rows.push({
      proposal_id: proposalId,
      option_label: optionLabel,
      row_type: rowType,
      price_amount: priceAmount,
      currency,
      stays,
    });

    if (!optionsMap.has(optionLabel)) {
      optionsMap.set(optionLabel, { label: optionLabel, rows: [] });
    }

    optionsMap.get(optionLabel)!.rows.push({
      type: rowType,
      price: formattedPrice,
      rawPrice: priceAmount,
      currency,
      stays,
    });
  }

  return { rows, options: Array.from(optionsMap.values()) };
}

function parseListFromText(rawText?: string): string[] {
  if (!rawText) return [];
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-•*\d.]+\s*/, ''))
    .filter(Boolean);
}

export function validateAndParseProposal(
  proposalId: string,
  data: SheetData,
  termsHtml: string,
  isStale: boolean = false
): ProposalDocument | null {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Settings: loaded from fixed application const (src/lib/settings.ts)
  const defaultSettings = getSiteSettings();
  const rawSettings = data.settings && data.settings.length > 0 ? data.settings[0] : {};
  const settings: SiteSettings = {
    company_name: String(rawSettings.company_name || defaultSettings.company_name).trim(),
    website: String(rawSettings.website || defaultSettings.website).trim(),
    whatsapp: String(rawSettings.whatsapp || defaultSettings.whatsapp).trim(),
    instagram: String(rawSettings.instagram || defaultSettings.instagram).trim(),
    logo_url: rawSettings.logo_url ? String(rawSettings.logo_url).trim() : defaultSettings.logo_url,
    primary_green: String(rawSettings.primary_green || defaultSettings.primary_green).trim(),
    accent_blue: String(rawSettings.accent_blue || defaultSettings.accent_blue).trim(),
    exclude_red: String(rawSettings.exclude_red || defaultSettings.exclude_red).trim(),
  };

  // 2. Proposals tab: locate proposal row
  const proposalRows = data.proposals || [];
  let foundRowIndex = -1;
  let targetRow: any = null;

  for (let i = 0; i < proposalRows.length; i++) {
    const row = proposalRows[i];
    if (String(row.proposal_id || '').trim().toLowerCase() === proposalId.toLowerCase()) {
      targetRow = row;
      foundRowIndex = i;
      break;
    }
  }

  if (!targetRow) {
    return null;
  }

  const sheetRowNum = foundRowIndex + 2;

  // Validate proposal fields
  const rawId = String(targetRow.proposal_id || '').trim();
  const rawStatus = String(targetRow.status || '').trim().toLowerCase();
  const rawTitle = String(targetRow.title || '').trim();

  if (!rawId) {
    errors.push({
      tab: 'Proposals',
      row: sheetRowNum,
      column: 'proposal_id',
      message: 'proposal_id is required',
    });
  }

  if (!['draft', 'ready', 'archived'].includes(rawStatus)) {
    errors.push({
      tab: 'Proposals',
      row: sheetRowNum,
      column: 'status',
      message: `status must be "draft", "ready", or "archived", got "${targetRow.status}"`,
    });
  }

  if (!rawTitle) {
    errors.push({
      tab: 'Proposals',
      row: sheetRowNum,
      column: 'title',
      message: 'title is required',
    });
  }

  const meta: ProposalMeta = {
    proposal_id: rawId,
    status: (rawStatus as any) || 'draft',
    version: targetRow.version ? String(targetRow.version).trim() : undefined,
    title: rawTitle,
    cover_image_url: targetRow.cover_image_url ? String(targetRow.cover_image_url).trim() : undefined,
    intro_text: targetRow.intro_text ? String(targetRow.intro_text).trim() : undefined,
    tour_type: targetRow.tour_type ? String(targetRow.tour_type).trim() : undefined,
    travel_date: targetRow.travel_date ? String(targetRow.travel_date).trim() : undefined,
    route: targetRow.route ? String(targetRow.route).trim() : undefined,
    extra_info: targetRow.extra_info ? String(targetRow.extra_info).trim() : undefined,
    custom_html: targetRow.custom_html ? String(targetRow.custom_html) : undefined,
    terms_variant: targetRow.terms_variant ? String(targetRow.terms_variant).trim() : 'standard',
  };

  // Parse extra_info
  const extraInfoRows: Array<[string, string]> = [];
  if (meta.extra_info) {
    const lines = meta.extra_info.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const idx = line.indexOf(':');
      if (idx > -1) {
        extraInfoRows.push([line.substring(0, idx).trim(), line.substring(idx + 1).trim()]);
      } else {
        extraInfoRows.push([line, '']);
      }
    }
  }

  // Parse intro paragraphs
  const introParagraphs = (meta.intro_text || '')
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  // 3. Itinerary parsing:
  // First, check for columns itinerary_1 through itinerary_12 (or day_1 through day_12)
  let itineraryDays: ItineraryDay[] = [];
  const targetKeys = Object.keys(targetRow);

  for (let d = 1; d <= 12; d++) {
    const candidates = [
      `itinerary_${d}`,
      `itinerary ${d}`,
      `itinerary${d}`,
      `itinerary_${String(d).padStart(2, '0')}`,
      `itinerary ${String(d).padStart(2, '0')}`,
      `day_${d}`,
      `day ${d}`,
      `day${d}`,
    ];

    let cellValue = '';
    for (const candidate of candidates) {
      const matchedKey = targetKeys.find((k) => k.toLowerCase().trim() === candidate.toLowerCase());
      if (matchedKey && targetRow[matchedKey]) {
        cellValue = String(targetRow[matchedKey]);
        break;
      }
    }

    if (cellValue && cellValue.trim()) {
      const parsedDay = parseDayFromCell(cellValue, itineraryDays.length + 1, proposalId);
      if (parsedDay) {
        itineraryDays.push(parsedDay);
      }
    }
  }

  // If columns itinerary_1..12 were not used, fallback to single 'itinerary' column with --- blocks
  if (itineraryDays.length === 0 && targetRow.itinerary && typeof targetRow.itinerary === 'string' && targetRow.itinerary.trim()) {
    itineraryDays = parseItineraryFromText(targetRow.itinerary, proposalId);
  }

  // If still empty, check legacy multi-tab data.itinerary
  if (itineraryDays.length === 0) {
    const rawItinerary = data.itinerary || [];
    for (let i = 0; i < rawItinerary.length; i++) {
      const row = rawItinerary[i];
      const rowNum = i + 2;
      if (String(row.proposal_id || '').trim().toLowerCase() !== proposalId.toLowerCase()) {
        continue;
      }

      const dayNoRaw = row.day_no;
      const dayNo = Number(dayNoRaw);
      if (isNaN(dayNo) || dayNo <= 0) {
        errors.push({
          tab: 'Itinerary',
          row: rowNum,
          column: 'day_no',
          message: `day_no is not a valid number (got "${dayNoRaw}")`,
        });
      }

      const dayTitle = String(row.day_title || '').trim();
      if (!dayTitle) {
        errors.push({
          tab: 'Itinerary',
          row: rowNum,
          column: 'day_title',
          message: 'day_title is required',
        });
      }

      const rawItems = String(row.items || '');
      const items = rawItems
        .split(/\r?\n/)
        .map((item) => item.trim().replace(/^[-•*]\s*/, ''))
        .filter(Boolean);

      if (items.length === 0) {
        errors.push({
          tab: 'Itinerary',
          row: rowNum,
          column: 'items',
          message: 'At least one bullet point item is required',
        });
      }

      const accommodationNote = row.accommodation_note ? String(row.accommodation_note).trim() : undefined;
      const imageUrl = row.image_url ? String(row.image_url).trim() : undefined;

      itineraryDays.push({
        proposal_id: proposalId,
        day_no: dayNo || i + 1,
        day_title: dayTitle,
        items,
        accommodation_note: accommodationNote,
        image_url: imageUrl,
      });
    }

    itineraryDays.sort((a, b) => a.day_no - b.day_no);
  }

  // Image warning checks
  for (const day of itineraryDays) {
    if (!day.image_url) {
      warnings.push({
        tab: 'Proposals',
        row: sheetRowNum,
        column: `itinerary_${day.day_no}`,
        message: `Day ${day.day_no} has no photo; neutral placeholder will be shown in preview`,
      });
    }
  }

  if (itineraryDays.length === 0) {
    errors.push({
      tab: 'Proposals',
      row: sheetRowNum,
      column: 'itinerary_1',
      message: 'Proposal must have at least one itinerary day (in column itinerary_1)',
    });
  }

  // 4. Pricing parsing: check single-tab column OR separate tab
  let pricingOptions: PricingOptionGroup[] = [];

  if (targetRow.pricing && typeof targetRow.pricing === 'string' && targetRow.pricing.trim()) {
    const parsedPricing = parsePricingFromText(targetRow.pricing, proposalId);
    pricingOptions = parsedPricing.options;
  } else {
    const rawPricing = data.pricing || [];
    const optionsMap = new Map<string, PricingOptionGroup>();

    for (let i = 0; i < rawPricing.length; i++) {
      const row = rawPricing[i];
      if (String(row.proposal_id || '').trim().toLowerCase() !== proposalId.toLowerCase()) {
        continue;
      }

      const optionLabel = String(row.option_label || '').trim();
      const rowType = String(row.row_type || '').trim();
      const rawPrice = row.price_amount;
      const priceAmount = Number(String(rawPrice || '').replace(/[^\d.-]/g, ''));
      const currency = String(row.currency || 'IDR').trim();
      const stays = String(row.stays || '')
        .split(/\r?\n/)
        .map((s) => s.trim().replace(/^[-•*]\s*/, ''))
        .filter(Boolean);

      const formattedPrice = formatCurrency(priceAmount || 0, currency);

      if (!optionsMap.has(optionLabel)) {
        optionsMap.set(optionLabel, { label: optionLabel, rows: [] });
      }

      optionsMap.get(optionLabel)!.rows.push({
        type: rowType,
        price: formattedPrice,
        rawPrice: priceAmount,
        currency,
        stays,
      });
    }

    pricingOptions = Array.from(optionsMap.values());
  }

  if (pricingOptions.length === 0) {
    errors.push({
      tab: 'Proposals',
      row: sheetRowNum,
      column: 'pricing',
      message: 'Proposal must have at least one pricing option',
    });
  }

  // 5. Inclusions & Exclusions parsing: check single-tab columns OR separate tab
  let includeList: string[] = [];
  let excludeList: string[] = [];

  if (targetRow.inclusions || targetRow.includes || targetRow.exclusions || targetRow.excludes) {
    includeList = parseListFromText(targetRow.inclusions || targetRow.includes);
    excludeList = parseListFromText(targetRow.exclusions || targetRow.excludes);
  } else {
    const rawInclusions = data.inclusions || [];
    const incItems: Array<{ sort: number; text: string }> = [];
    const excItems: Array<{ sort: number; text: string }> = [];

    for (let i = 0; i < rawInclusions.length; i++) {
      const row = rawInclusions[i];
      if (String(row.proposal_id || '').trim().toLowerCase() !== proposalId.toLowerCase()) {
        continue;
      }
      const kind = String(row.kind || '').trim().toLowerCase();
      const sortNum = Number(row.sort);
      const text = String(row.text || '').trim();

      if (kind === 'include' && text) {
        incItems.push({ sort: isNaN(sortNum) ? 999 : sortNum, text });
      } else if (kind === 'exclude' && text) {
        excItems.push({ sort: isNaN(sortNum) ? 999 : sortNum, text });
      }
    }

    incItems.sort((a, b) => a.sort - b.sort);
    excItems.sort((a, b) => a.sort - b.sort);

    includeList = incItems.map((i) => i.text);
    excludeList = excItems.map((i) => i.text);
  }

  if (includeList.length === 0) {
    errors.push({
      tab: 'Proposals',
      row: sheetRowNum,
      column: 'inclusions',
      message: 'Proposal must have at least one include item',
    });
  }

  // Check overlap warning
  const incTexts = new Set(includeList.map((i) => i.toLowerCase().trim()));
  for (const exc of excludeList) {
    const excNorm = exc.toLowerCase().trim();
    if (incTexts.has(excNorm)) {
      warnings.push({
        tab: 'Inclusions',
        column: 'text',
        message: `Item "${exc}" is listed under both Include and Exclude`,
      });
    }
  }

  const sanitizedHtml = meta.custom_html ? sanitizeCustomHtml(meta.custom_html) : undefined;

  return {
    meta,
    settings,
    itinerary: itineraryDays,
    pricingOptions,
    inclusions: {
      include: includeList,
      exclude: excludeList,
    },
    extraInfoRows,
    introParagraphs,
    sanitizedHtml,
    termsHtml,
    isStale,
    validation: {
      isValid: errors.length === 0,
      errors,
      warnings,
    },
  };
}
