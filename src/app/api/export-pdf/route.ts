import { NextRequest, NextResponse } from 'next/server';
import type { Browser } from 'puppeteer-core';

export const dynamic = 'force-dynamic';
// Allow up to 60s for high-res PDF generation with external hotlink image downloads
export const maxDuration = 60;

/**
 * Launch a headless Chromium browser.
 * - On Vercel / AWS Lambda: uses @sparticuz/chromium (serverless-compatible binary)
 * - Locally: uses full puppeteer with its bundled Chromium
 */
async function launchBrowser(): Promise<Browser> {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isServerless) {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteerCore = (await import('puppeteer-core')).default;

    return puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    }) as unknown as Browser;
  } else {
    const puppeteer = (await import('puppeteer')).default;
    return puppeteer.launch({
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
    }) as unknown as Browser;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { html, filename } = await request.json();

    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'Missing HTML content' }, { status: 400 });
    }

    const browser = await launchBrowser();

    try {
      const page = await browser.newPage();

      // Set standard A4 portrait viewport
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2,
      });

      // Load the exact HTML directly into Chromium (bypasses loopback network deadlocks)
      await page.setContent(html, {
        waitUntil: 'load',
        timeout: 30000,
      });

      // Ensure all web fonts and hotlinked images are completely resolved
      await page.evaluate(async () => {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }

        const images = Array.from(document.images);
        await Promise.all(
          images.map((img) => {
            if (img.complete && img.naturalWidth > 0) return Promise.resolve();
            return new Promise<void>((resolve) => {
              const timeout = setTimeout(resolve, 8000);
              img.onload = () => {
                clearTimeout(timeout);
                resolve();
              };
              img.onerror = () => {
                clearTimeout(timeout);
                resolve();
              };
            });
          })
        );
      });

      // Generate exact A4 PDF with background graphics enabled
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
      const safeFilename = filename || 'tour-proposal.pdf';

      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeFilename}"`,
          'Cache-Control': 'no-store',
        },
      });
    } finally {
      await browser.close().catch(() => {});
    }
  } catch (error: any) {
    console.error('Export PDF API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'PDF generation failed',
      },
      { status: 500 }
    );
  }
}
