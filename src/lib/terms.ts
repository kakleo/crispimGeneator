import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

export const DEFAULT_TERMS_MARKDOWN = `# Terms & Conditions

### 1. Booking & Confirmation
- All bookings are made with **Nusa Flores Travel**.
- A non-refundable deposit of 30% of the total tour price is required upon confirmation of the booking to secure reservations for vehicles, drivers, guides, and accommodations.
- The remaining balance of 70% must be settled no later than 7 days prior to the commencement of the tour or upon arrival by prior agreement.

### 2. Pricing & Currency
- All prices quoted are in Indonesian Rupiah (IDR) unless specified otherwise.
- Quoted prices are per person based on the stated minimum number of participants (minimum 2 persons for private tours).
- Nusa Flores Travel reserves the right to adjust prices in the event of significant fuel price increases, government tax changes, or entrance fee revisions by national park authorities.

### 3. Inclusions & Exclusions
- Only items specifically listed in the **Include** section of this proposal are covered.
- Personal expenses, tips/gratuities for drivers and guides, travel insurance, alcoholic beverages, and any activities not specified in the itinerary are excluded.

### 4. Cancellation & Refund Policy
- **More than 30 days prior to departure:** Deposit is forfeited; any additional payments will be refunded minus banking fees.
- **15 to 30 days prior to departure:** 50% of the total tour cost is non-refundable.
- **Less than 15 days prior to departure or No Show:** 100% of the total tour cost is non-refundable.
- No refunds will be provided for unused services, early departures, or missed activities during the tour.

### 5. Itinerary Adjustments & Force Majeure
- Nusa Flores Travel reserves the right to alter routes, timing, or accommodations due to weather conditions, volcanic activity (e.g., Mount Kelimutu alerts), flight schedule alterations, road closures, or other unforeseen circumstances beyond our control (Force Majeure).
- Any extra expenses incurred due to delays or cancellations caused by Force Majeure events will be the responsibility of the traveler.

### 6. Health & Travel Insurance
- Travel insurance is **mandatory** for all participants. Guests must possess adequate coverage for medical emergencies, evacuation, trip cancellation, and baggage loss.
- Participants are responsible for ensuring they are in suitable physical condition for light trekking and travel across mountainous terrain in Flores.

### 7. Responsibility & Liability
- Nusa Flores Travel acts only as an agent for transportation companies, hotels, and local service providers. We accept no liability for loss, damage, injury, delay, or irregularity resulting from negligence or default of any third-party service provider.
- Guests are responsible for safeguarding their personal belongings throughout the trip.

For inquiries or assistance, please contact us via WhatsApp at **+62 821-4473-7881** or email **info@tourfloreskomodo.com**.`;

let cachedTermsMarkdown: string | null = null;
let cachedTermsHtml: string | null = null;

async function getPayloadAdapter() {
  try {
    const { getPayloadClient } = await import('./payload/client');
    const payload = await getPayloadClient();
    return payload?.db?.client || null;
  } catch (err) {
    console.warn('[Terms] Failed to obtain database adapter:', err);
    return null;
  }
}

/**
 * Returns current Terms of Service in Markdown format.
 * Checks memory cache -> SQLite/Turso payload_kv -> content/terms.md -> DEFAULT_TERMS_MARKDOWN.
 */
export async function getTermsMarkdown(): Promise<string> {
  if (cachedTermsMarkdown) {
    return cachedTermsMarkdown;
  }

  // 1. Try reading from Database (Turso / SQLite)
  try {
    const client = await getPayloadAdapter();
    if (client && typeof client.execute === 'function') {
      const res = await client.execute({
        sql: `SELECT data FROM payload_kv WHERE key = 'terms_of_service' LIMIT 1`,
        args: [],
      });
      if (res?.rows && res.rows.length > 0 && res.rows[0].data) {
        const dbContent = String(res.rows[0].data);
        cachedTermsMarkdown = dbContent;
        cachedTermsHtml = marked.parse(dbContent) as string;
        return cachedTermsMarkdown;
      }
    }
  } catch (dbErr) {
    console.warn('[Terms] Could not query payload_kv table:', dbErr);
  }

  // 2. Try reading from content/terms.md
  try {
    const termsPath = path.resolve(process.cwd(), 'content', 'terms.md');
    if (fs.existsSync(termsPath)) {
      const fileContent = fs.readFileSync(termsPath, 'utf-8');
      if (fileContent.trim()) {
        cachedTermsMarkdown = fileContent;
        cachedTermsHtml = marked.parse(fileContent) as string;
        return cachedTermsMarkdown;
      }
    }
  } catch (fsErr) {
    console.warn('[Terms] Could not read content/terms.md:', fsErr);
  }

  // 3. Fallback to default
  cachedTermsMarkdown = DEFAULT_TERMS_MARKDOWN;
  cachedTermsHtml = marked.parse(DEFAULT_TERMS_MARKDOWN) as string;
  return cachedTermsMarkdown;
}

/**
 * Saves Terms of Service in Markdown format.
 * Persists to memory cache, SQLite/Turso payload_kv, and content/terms.md.
 */
export async function saveTermsMarkdown(markdown: string): Promise<void> {
  const cleanMarkdown = markdown.trim();
  cachedTermsMarkdown = cleanMarkdown;
  cachedTermsHtml = marked.parse(cleanMarkdown) as string;

  // 1. Persist to SQLite / Turso database
  try {
    const client = await getPayloadAdapter();
    if (client && typeof client.execute === 'function') {
      await client.execute({
        sql: `INSERT INTO payload_kv (key, data) VALUES ('terms_of_service', ?)
              ON CONFLICT(key) DO UPDATE SET data = excluded.data`,
        args: [cleanMarkdown],
      });
    }
  } catch (dbErr) {
    console.error('[Terms] Failed to persist terms to database:', dbErr);
  }

  // 2. Persist to content/terms.md file on disk
  try {
    const termsPath = path.resolve(process.cwd(), 'content', 'terms.md');
    fs.writeFileSync(termsPath, cleanMarkdown, 'utf-8');
  } catch (fsErr) {
    // Read-only filesystem warning in serverless
    console.warn('[Terms] Could not write to content/terms.md (filesystem might be read-only):', fsErr);
  }

  // 3. Clear PDF buffer cache so subsequent PDF exports use the latest terms
  try {
    const { clearPdfCache } = await import('./pdf');
    clearPdfCache();
  } catch (pdfErr) {
    // Ignore if pdf module not available
  }
}

/**
 * Resets Terms of Service back to default Nusa Flores Travel content.
 */
export async function resetTermsToDefault(): Promise<void> {
  await saveTermsMarkdown(DEFAULT_TERMS_MARKDOWN);
}

/**
 * Returns compiled HTML string of the Terms of Service (asynchronous).
 */
export async function getTermsHtmlAsync(variant: string = 'standard'): Promise<string> {
  if (cachedTermsHtml) {
    return cachedTermsHtml;
  }
  const md = await getTermsMarkdown();
  cachedTermsHtml = marked.parse(md) as string;
  return cachedTermsHtml;
}

/**
 * Synchronous version for backwards compatibility.
 */
export function getTermsHtml(variant: string = 'standard'): string {
  if (cachedTermsHtml) {
    return cachedTermsHtml;
  }

  try {
    const termsPath = path.resolve(process.cwd(), 'content', 'terms.md');
    if (fs.existsSync(termsPath)) {
      const markdown = fs.readFileSync(termsPath, 'utf-8');
      cachedTermsMarkdown = markdown;
      cachedTermsHtml = marked.parse(markdown) as string;
      return cachedTermsHtml;
    }
  } catch (err) {
    console.error('[Terms] Error reading terms markdown file synchronously:', err);
  }

  cachedTermsMarkdown = DEFAULT_TERMS_MARKDOWN;
  cachedTermsHtml = marked.parse(DEFAULT_TERMS_MARKDOWN) as string;
  return cachedTermsHtml;
}
