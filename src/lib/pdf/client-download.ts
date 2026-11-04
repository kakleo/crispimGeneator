'use client';

export interface DownloadProgress {
  current: number;
  total: number;
  message: string;
}

/**
 * Generates and downloads an exact A4 PDF directly in the browser using html2canvas & jsPDF.
 * Zero print dialogs, zero "Save as PDF" windows, and zero CSS print media distortion.
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
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      imageTimeout: 10000,
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
}
