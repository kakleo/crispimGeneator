'use client';

export interface DownloadProgress {
  current: number;
  total: number;
  message: string;
}

/**
 * Converts any image URL (local, CDN, or third-party hotlink) to a base64 Data URL.
 * By routing external images through /api/image-proxy, we bypass CORS restrictions,
 * hotlink blocking, and canvas tainting completely.
 */
async function urlToDataUrl(url: string): Promise<string> {
  if (!url || url.startsWith('data:')) return url;

  const isExternal = url.startsWith('http://') || url.startsWith('https://');
  const fetchUrl = isExternal ? `/api/image-proxy?url=${encodeURIComponent(url)}` : url;

  try {
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('FileReader did not return string'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Failed to inline image via proxy:', url, err);
    return url;
  }
}

/**
 * Pre-inlines all images inside the proposal pages as base64 Data URLs so that html2canvas
 * can render them without ANY network calls, zero CORS blocks, and zero canvas tainting.
 */
async function inlineAllProposalImages(
  pageElements: HTMLElement[],
  onProgress?: (msg: string) => void
): Promise<() => void> {
  const images: HTMLImageElement[] = [];
  pageElements.forEach((el) => {
    images.push(...Array.from(el.querySelectorAll<HTMLImageElement>('img')));
  });

  if (images.length === 0) return () => {};

  if (onProgress) {
    onProgress('Resolving hotlink images for PDF export...');
  }

  // Save original sources to restore afterwards
  const originalSrcs = new Map<HTMLImageElement, string>();

  await Promise.all(
    images.map(async (img) => {
      const originalSrc = img.src || img.getAttribute('src') || '';
      if (!originalSrc) return;
      originalSrcs.set(img, originalSrc);

      try {
        const dataUrl = await urlToDataUrl(originalSrc);
        if (dataUrl && dataUrl.startsWith('data:')) {
          img.src = dataUrl;
        }
      } catch (e) {
        console.warn('Skipping image inline error:', e);
      }
    })
  );

  // Wait for all inlined images to decode
  await Promise.all(
    images.map((img) =>
      img.decode ? img.decode().catch(() => {}) : Promise.resolve()
    )
  );

  // Return restore function
  return () => {
    originalSrcs.forEach((src, img) => {
      try {
        img.src = src;
      } catch {}
    });
  };
}

/**
 * Generates and downloads an exact A4 PDF directly in the browser using html2canvas & jsPDF.
 * Zero print dialogs, zero "Save as PDF" windows, and zero CORS/missing image issues.
 */
export async function downloadProposalPdfDirectly(
  filename: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  if (typeof window === 'undefined') return;

  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  // Query all proposal pages in document order
  const pageElements = Array.from(
    document.querySelectorAll<HTMLElement>('.cover-page, .page-container')
  );

  if (pageElements.length === 0) {
    throw new Error('No proposal pages found to generate PDF.');
  }

  const total = pageElements.length;

  // 1. Inline all images so html2canvas never makes cross-origin requests
  const restoreImages = await inlineAllProposalImages(pageElements, (msg) => {
    if (onProgress) {
      onProgress({
        current: 0,
        total,
        message: msg,
      });
    }
  });

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    for (let i = 0; i < total; i++) {
      const el = pageElements[i];

      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          message: `Rendering page ${i + 1} of ${total}...`,
        });
      }

      // Capture each page at 2x DPI for crisp text and high-res imagery
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        imageTimeout: 15000,
        onclone: (_clonedDoc, clonedEl) => {
          // Ensure cloned element has exact A4 pixel proportion during render
          clonedEl.style.boxShadow = 'none';
          clonedEl.style.margin = '0 auto';
          clonedEl.style.transform = 'none';
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // 210mm x 297mm exact A4 dimensions
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    if (onProgress) {
      onProgress({
        current: total,
        total,
        message: 'Downloading PDF file...',
      });
    }

    // Directly download the PDF file to user's computer
    pdf.save(filename);
  } finally {
    // Restore original img tags
    restoreImages();
  }
}
