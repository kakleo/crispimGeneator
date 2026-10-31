import puppeteer, { type Browser } from 'puppeteer';
import crypto from 'crypto';

interface PdfCacheEntry {
  buffer: Buffer;
  hash: string;
  createdAt: number;
}

const pdfCache = new Map<string, PdfCacheEntry>();
const PDF_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Concurrency limiter: max 2 concurrent Chromium jobs to protect server memory
let activeJobs = 0;
const MAX_CONCURRENT_JOBS = 2;
const jobQueue: Array<() => void> = [];

function acquireJobSlot(): Promise<void> {
  if (activeJobs < MAX_CONCURRENT_JOBS) {
    activeJobs++;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    jobQueue.push(() => {
      activeJobs++;
      resolve();
    });
  });
}

function releaseJobSlot(): void {
  activeJobs--;
  if (jobQueue.length > 0) {
    const nextJob = jobQueue.shift();
    if (nextJob) nextJob();
  }
}

export function clearPdfCache(): void {
  pdfCache.clear();
}

export function computeDataHash(data: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').substring(0, 16);
}

export async function generateProposalPdf(params: {
  proposalId: string;
  dataHash: string;
  targetUrl: string;
  sessionCookie?: string;
}): Promise<Buffer> {
  const { proposalId, dataHash, targetUrl, sessionCookie } = params;

  // Check cache
  const cached = pdfCache.get(proposalId);
  const now = Date.now();
  if (cached && cached.hash === dataHash && now - cached.createdAt < PDF_CACHE_TTL_MS) {
    return cached.buffer;
  }

  await acquireJobSlot();
  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
        '--disable-web-security',
        '--allow-running-insecure-content',
      ],
    });

    const page = await browser.newPage();

    // Set A4 viewport
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2,
    });

    // Pass session cookie so Chromium passes the login middleware
    if (sessionCookie) {
      const urlObj = new URL(targetUrl);
      await page.setCookie({
        name: 'tour_session',
        value: sessionCookie,
        domain: urlObj.hostname,
        path: '/',
        httpOnly: true,
      });
    }

    // Append ?print=1 query param if needed
    const printUrl = new URL(targetUrl);
    printUrl.searchParams.set('mode', 'print');

    await page.goto(printUrl.toString(), {
      waitUntil: ['domcontentloaded', 'networkidle2'],
      timeout: 30000,
    });

    // Wait for fonts to load
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      // Wait for all images to complete loading (with timeout safeguard)
      const images = Array.from(document.images);
      await Promise.all(
        images.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise<void>((resolve) => {
            const timeout = setTimeout(() => resolve(), 8000);
            img.addEventListener('load', () => {
              clearTimeout(timeout);
              resolve();
            });
            img.addEventListener('error', () => {
              clearTimeout(timeout);
              resolve();
            });
          });
        })
      );
    });

    // Generate A4 PDF with exact colors and CSS sizing
    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
    });

    const pdfBuffer = Buffer.from(pdfUint8Array);

    // Save to cache
    pdfCache.set(proposalId, {
      buffer: pdfBuffer,
      hash: dataHash,
      createdAt: now,
    });

    return pdfBuffer;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    releaseJobSlot();
  }
}
