import { jsPDF } from 'jspdf';

export interface SharePdfOptions {
  doc: jsPDF;
  fileName: string;
  shareTitle: string;
  summaryText: string;
  onSuccess?: (mode: 'native-share' | 'download-and-whatsapp') => void;
  onError?: (error: any) => void;
}

/**
 * Shares a generated PDF document directly via WhatsApp.
 * - If supported by the device/browser (e.g. mobile, Web Share API with files support),
 *   it directly attaches the actual .pdf file into WhatsApp.
 * - On desktop or unsupported browsers, it automatically downloads the .pdf file
 *   and opens WhatsApp with the formatted summary text and attachment note.
 */
export async function sharePdfToWhatsApp({
  doc,
  fileName,
  shareTitle,
  summaryText,
  onSuccess,
  onError
}: SharePdfOptions): Promise<'native-share' | 'download-and-whatsapp' | 'cancelled'> {
  try {
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    // 1. Attempt Native Web Share API with attached PDF file
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: shareTitle,
          text: summaryText,
        });
        onSuccess?.('native-share');
        return 'native-share';
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return 'cancelled';
        }
        console.warn('Native share failed, falling back to download + WhatsApp Web:', err);
      }
    }

    // 2. Desktop Fallback: Automatically save PDF and open WhatsApp Web
    doc.save(fileName);

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`;
    window.open(whatsappUrl, '_blank');

    onSuccess?.('download-and-whatsapp');
    return 'download-and-whatsapp';
  } catch (error) {
    console.error('Error sharing PDF to WhatsApp:', error);
    onError?.(error);
    throw error;
  }
}
