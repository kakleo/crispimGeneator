import { getPayload } from 'payload';
import config from '@payload-config';
import { ensureDatabaseSchema } from './init-schema';
import {
  ProposalDocument,
  PricingOptionGroup,
  ItineraryDay,
  normalizeStatus,
  normalizeImageUrl,
} from '../schema/types';
import { getSiteSettings } from '../settings';
import { getTermsHtml } from '../terms';
import { sanitizeCustomHtml } from '../sanitize';

let payloadInstance: any = null;

function formatCurrency(amount: number, currency: string = 'IDR'): string {
  const formattedNumber = new Intl.NumberFormat('id-ID').format(amount);
  return `${currency.toUpperCase()} ${formattedNumber}`;
}

export async function getPayloadClient() {
  if (!payloadInstance) {
    payloadInstance = await getPayload({ config });

    // 1. Ensure all database tables and indexes exist (works on Turso, Vercel /tmp, and local SQLite)
    try {
      await ensureDatabaseSchema(payloadInstance.db);
    } catch (err: any) {
      console.error('[Payload] Schema initialization error:', err);
    }

    // 2. Ensure initial seed proposal exists
    await seedInitialData(payloadInstance);
  }
  return payloadInstance;
}

export async function getRawProposals(): Promise<any[]> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: 'proposals',
    limit: 100,
    sort: '-updatedAt',
  });
  return res.docs || [];
}

export async function getRawProposalBySlug(slug: string): Promise<any | null> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: 'proposals',
    where: {
      proposal_id: {
        equals: slug,
      },
    },
    limit: 1,
  });
  return res.docs[0] || null;
}

export function payloadDocToProposalDocument(doc: any): ProposalDocument {
  const settings = getSiteSettings();
  const termsHtml = getTermsHtml();

  // 1. Itinerary parsing
  const rawItinerary = Array.isArray(doc.itinerary) ? doc.itinerary : [];
  const itinerary: ItineraryDay[] = rawItinerary.map((d: any, idx: number) => {
    let itemsList: string[] = [];
    if (Array.isArray(d.items)) {
      itemsList = d.items.map(String).filter(Boolean);
    } else if (typeof d.items === 'string') {
      itemsList = d.items
        .split(/\r?\n/)
        .map((s: string) => s.trim().replace(/^[-•*]\s*/, ''))
        .filter(Boolean);
    }
    if (itemsList.length === 0) {
      itemsList = ['Tour activities and visits'];
    }

    return {
      proposal_id: doc.proposal_id,
      day_no: Number(d.day_no || idx + 1),
      day_title: String(d.day_title || `Day ${idx + 1}`),
      items: itemsList,
      accommodation_note: d.accommodation_note ? String(d.accommodation_note).trim() : undefined,
      image_url: d.image_url ? normalizeImageUrl(d.image_url) : undefined,
    };
  });
  itinerary.sort((a, b) => a.day_no - b.day_no);

  // 2. Pricing parsing
  const rawPricing = Array.isArray(doc.pricing) ? doc.pricing : [];
  const pricingOptions: PricingOptionGroup[] = rawPricing.map((opt: any) => {
    let staysList: string[] = [];
    if (Array.isArray(opt.stays)) {
      staysList = opt.stays.map(String).filter(Boolean);
    } else if (typeof opt.stays === 'string') {
      staysList = opt.stays
        .split(/\r?\n/)
        .map((s: string) => s.trim().replace(/^[-•*]\s*/, ''))
        .filter(Boolean);
    }

    const rows = (Array.isArray(opt.rows) ? opt.rows : []).map((r: any) => {
      const priceAmount = Number(r.price_amount) || 0;
      const currency = String(r.currency || 'IDR').toUpperCase();
      return {
        type: String(r.row_type || 'Standard'),
        price: formatCurrency(priceAmount, currency),
        rawPrice: priceAmount,
        currency,
        stays: staysList,
      };
    });

    return {
      label: String(opt.option_label || 'OPTION #1'),
      rows,
    };
  });

  // 3. Inclusions & Exclusions
  const parseList = (val: any): string[] => {
    if (Array.isArray(val)) return val.map(String).filter(Boolean);
    if (typeof val === 'string') {
      return val
        .split(/\r?\n/)
        .map((s) => s.trim().replace(/^[-•*]\s*/, ''))
        .filter(Boolean);
    }
    return [];
  };

  const includeList = parseList(doc.inclusions);
  const excludeList = parseList(doc.exclusions);

  // 4. Intro paragraphs
  const introParagraphs = typeof doc.intro_text === 'string'
    ? doc.intro_text.split(/\r?\n\r?\n/).map((p: string) => p.trim()).filter(Boolean)
    : [];

  // 5. Extra info rows (key: value)
  const extraInfoRows: Array<[string, string]> = [];
  if (typeof doc.extra_info === 'string') {
    const lines = doc.extra_info.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > -1) {
        extraInfoRows.push([
          line.substring(0, colonIdx).trim(),
          line.substring(colonIdx + 1).trim(),
        ]);
      } else {
        extraInfoRows.push(['Info', line]);
      }
    }
  }

  const sanitizedHtml = doc.custom_html ? sanitizeCustomHtml(doc.custom_html) : undefined;

  return {
    meta: {
      proposal_id: String(doc.proposal_id || '').trim(),
      status: normalizeStatus(doc.status),
      version: doc.version || 'v1',
      title: String(doc.title || 'Untitled Tour Proposal'),
      cover_image_url: doc.cover_image_url ? normalizeImageUrl(doc.cover_image_url) : undefined,
      tour_type: doc.tour_type || undefined,
      travel_date: doc.travel_date ? String(doc.travel_date) : undefined,
      route: doc.route || undefined,
      intro_text: doc.intro_text || undefined,
      extra_info: doc.extra_info || undefined,
      custom_html: doc.custom_html || undefined,
    },
    settings,
    itinerary,
    pricingOptions,
    inclusions: {
      include: includeList,
      exclude: excludeList,
    },
    extraInfoRows,
    introParagraphs,
    termsHtml,
    sanitizedHtml,
    validation: {
      isValid: itinerary.length > 0 && pricingOptions.length > 0,
      errors: [],
      warnings: [],
    },
  };
}

export async function getAllProposalDocuments(): Promise<ProposalDocument[]> {
  const rawList = await getRawProposals();
  return rawList.map(payloadDocToProposalDocument);
}

export async function getProposalDocumentBySlug(slug: string): Promise<ProposalDocument | null> {
  const doc = await getRawProposalBySlug(slug);
  if (!doc) return null;
  return payloadDocToProposalDocument(doc);
}

function sanitizePayloadImages(data: any) {
  const result = { ...data };
  if (result.cover_image_url !== undefined) {
    result.cover_image_url = normalizeImageUrl(result.cover_image_url);
  }
  if (Array.isArray(result.itinerary)) {
    result.itinerary = result.itinerary.map((d: any) => ({
      ...d,
      image_url: normalizeImageUrl(d.image_url),
    }));
  }
  return result;
}

export async function createProposalInPayload(data: any) {
  const payload = await getPayloadClient();
  const cleaned = sanitizePayloadImages(data);
  const payloadData = {
    ...cleaned,
    status: normalizeStatus(cleaned.status),
  };
  return payload.create({
    collection: 'proposals',
    data: payloadData,
  });
}

export async function updateProposalInPayload(slug: string, data: any) {
  const payload = await getPayloadClient();
  const existing = await getRawProposalBySlug(slug);
  if (!existing) {
    throw new Error(`Proposal with slug "${slug}" not found`);
  }

  // If slug is being changed, check that new slug is not already used by another proposal
  if (data.proposal_id && data.proposal_id !== slug) {
    const conflicting = await getRawProposalBySlug(data.proposal_id);
    if (conflicting && conflicting.id !== existing.id) {
      throw new Error(`Proposal ID "${data.proposal_id}" is already used by another proposal. Please choose a unique slug.`);
    }
  }

  const cleaned = sanitizePayloadImages(data);
  const payloadData = {
    ...cleaned,
    ...(cleaned.status ? { status: normalizeStatus(cleaned.status) } : {}),
  };

  return payload.update({
    collection: 'proposals',
    id: existing.id,
    data: payloadData,
  });
}

export async function duplicateProposalInPayload(sourceSlug: string): Promise<any> {
  const payload = await getPayloadClient();
  const source = await getRawProposalBySlug(sourceSlug);
  if (!source) {
    throw new Error(`Proposal with slug "${sourceSlug}" not found`);
  }

  // Generate unique duplicate slug
  let newSlug = `${source.proposal_id}-copy`;
  let counter = 1;
  while (await getRawProposalBySlug(newSlug)) {
    counter++;
    newSlug = `${source.proposal_id}-copy-${counter}`;
  }

  const newTitle = `${source.title} (Copy)`;

  // Clean nested array rows to strip primary key 'id'
  const cleanItinerary = Array.isArray(source.itinerary)
    ? source.itinerary.map((item: any) => ({
        day_no: item.day_no,
        day_title: item.day_title,
        items: item.items,
        accommodation_note: item.accommodation_note,
        image_url: item.image_url || '',
      }))
    : [];

  const cleanPricing = Array.isArray(source.pricing)
    ? source.pricing.map((opt: any) => ({
        option_label: opt.option_label,
        stays: opt.stays || '',
        rows: Array.isArray(opt.rows)
          ? opt.rows.map((r: any) => ({
              row_type: r.row_type,
              price_amount: Number(r.price_amount) || 0,
              currency: r.currency || 'IDR',
            }))
          : [],
      }))
    : [];

  const duplicateData = {
    proposal_id: newSlug,
    title: newTitle,
    status: normalizeStatus(source.status),
    version: source.version ? `${source.version}-copy` : 'v1',
    cover_image_url: source.cover_image_url || '',
    tour_type: source.tour_type || '',
    travel_date: source.travel_date || '',
    route: source.route || '',
    intro_text: source.intro_text || '',
    extra_info: source.extra_info || '',
    custom_html: source.custom_html || '',
    inclusions: source.inclusions || '',
    exclusions: source.exclusions || '',
    itinerary: cleanItinerary,
    pricing: cleanPricing,
  };

  return payload.create({
    collection: 'proposals',
    data: duplicateData,
  });
}

export async function deleteProposalInPayload(slug: string) {
  const payload = await getPayloadClient();
  const existing = await getRawProposalBySlug(slug);
  if (!existing) {
    throw new Error(`Proposal with slug "${slug}" not found`);
  }
  return payload.delete({
    collection: 'proposals',
    id: existing.id,
  });
}

// Initial Data Seeding for zero downtime / preserving production-ready proposal
async function seedInitialData(payload: any) {
  try {
    const existing = await payload.find({
      collection: 'proposals',
      limit: 1,
    });

    if (existing.totalDocs > 0) {
      return;
    }

    console.log('[Payload Seeder] Seeding initial production proposals...');

    // Proposal 1: Flores Overland Tour 4 Days
    await payload.create({
      collection: 'proposals',
      data: {
        proposal_id: 'flores-overland-4d',
        title: 'FLORES OVERLAND TOUR 4 DAYS',
        status: 'ready',
        version: 'v3',
        cover_image_url: '',
        tour_type: 'Private Tour (Minimum 2 People)',
        travel_date: '2026',
        route: 'Ende - Kelimutu - Bajawa - Ruteng - Labuan Bajo',
        intro_text:
          'Please find your detailed tour quotation in the following pages. Thank you for choosing us at Nusa Flores Travel and we hope you will have a memorable journey.\n\nIf you find anything unpleasant during the trip, please do not hesitate to contact us and we will do everything we can to assist you.',
        extra_info: 'Pickup: Ende Airport (ENE)\nDropoff: Labuan Bajo Port / Airport',
        custom_html: '',
        itinerary: [
          {
            day_no: 1,
            day_title: 'Journey to Moni',
            items:
              'Picked up at Ende Airport (ENE) Transfer to Moni. On the way stop over in Detusoko, rice field walk.\nVisit Wologai Village ; a traditional village lived by Lionese\nStay and overnight at Lodge in Moni',
            accommodation_note: 'See Price List',
          },
          {
            day_no: 2,
            day_title: 'Kelimutu',
            items:
              'Seeing the Kelimutu Lakes at dawn is a truly magical experience. Up at 04:00 you will drive with your driver to the crater lakes through the base of the Kelimutu National Park and walk up to the lakes through early morning woodland.\nSip hot drinks while sunlight wakes the spiritual volcanic crater and learn about local beliefs and folklore. Then explore all three of the ever-changing coloured lakes. This is an unforgettable adventure.\nBreakfast at lodge, loading luggage and check out. Drive to Penggajawa\nStop over in Blue stone Beach\nDrive to Bajawa, Stay and overnight at Hotel in Bajawa.',
            accommodation_note: 'See Price List',
          },
          {
            day_no: 3,
            day_title: 'Journey to Ruteng',
            items:
              'Breakfast at hotel and check out\nFirst visit Wolobobo view point\nVisit Bena Traditional VIllage ; meghalit village lived by Ngadanese tribe\nVisit Malanage Hot Spring\nDrive to Ruteng, on the way stop over to see arak; local wine distillation process\nStay and overnight at Hotel in Ruteng',
            accommodation_note: 'See Price List',
          },
          {
            day_no: 4,
            day_title: 'Journey to Labuan bajo',
            items:
              'Breakfast at hotel and check out\nVisit Cancar spider web rice field.\nDrive to Todo, visit Todo Traditional village ; old Manggarai tribe village, These represent one of the oldest kingships, established when the Dutch chose the Todo Clan to rule over Manggarai\nDrive to Labuan Bajo and tour finish.',
            accommodation_note: '-',
          },
        ],
        pricing: [
          {
            option_label: 'OPTION #1',
            stays:
              'Bintang Lodge Moni - Day 1\nSilverin Hotel Bajawa - Day 2\nSky Flores Hotel Ruteng - Day 3',
            rows: [
              {
                row_type: 'Without Tour Guide',
                price_amount: 5000000,
                currency: 'IDR',
              },
              {
                row_type: 'Include Tour Guide',
                price_amount: 6100000,
                currency: 'IDR',
              },
            ],
          },
          {
            option_label: 'OPTION #2',
            stays:
              'Ecolodge Moni - Day 1\nSabrina Rest and Living - Day 2\nSpring Hill Hotel Ruteng - Day 3',
            rows: [
              {
                row_type: 'Without Tour Guide',
                price_amount: 5000000,
                currency: 'IDR',
              },
              {
                row_type: 'Include Tour Guide',
                price_amount: 6100000,
                currency: 'IDR',
              },
            ],
          },
        ],
        inclusions:
          'Private Car, driver and petrol\nTour Guide\nEntrance fee\nMineral water\nAccomodation 3 nights\n3x Breakfast at Hotel',
        exclusions: 'Flight tickets\nLunch and dinner\nOptional tour',
      },
    });

    console.log('[Payload Seeder] Initial proposals seeded successfully!');
  } catch (err) {
    console.error('[Payload Seeder] Error during seed:', err);
  }
}
