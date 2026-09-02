import { extractText, getDocumentProxy } from 'unpdf';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// Polyfill Node.js global fetch for file:// URLs to cleanly load pdfjs-dist standard fonts (e.g. FoxitDingbats.pfb)
const originalFetch = globalThis.fetch;
if (typeof originalFetch === 'function') {
  globalThis.fetch = async function (url: any, options?: any) {
    const urlStr = typeof url === 'string' ? url : (url && url.href ? url.href : String(url));
    if (urlStr.startsWith('file://')) {
      try {
        const filePath = fileURLToPath(urlStr);
        const data = await fs.readFile(filePath);
        return new Response(data, {
          status: 200,
          headers: { 'Content-Type': 'application/octet-stream' },
        });
      } catch (err: any) {
        return new Response(null, { status: 404, statusText: err.message });
      }
    }
    return originalFetch(url, options);
  };
}

export interface PDFExtractionResult {
  text: string;
  isScannedOrEmpty: boolean;
  pageCount: number;
  message?: string;
}

/**
 * Extracts plain text from a PDF Buffer using modern unpdf.
 * Reliably detects image-only / scanned documents where text cannot be parsed.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<PDFExtractionResult> {
  try {
    const uint8 = new Uint8Array(buffer);
    const pdfDoc = await getDocumentProxy(uint8);
    const extraction = await extractText(pdfDoc);

    const fullText = Array.isArray(extraction.text)
      ? extraction.text.join('\n\n')
      : String(extraction.text || '');

    const cleanText = fullText.trim();
    const meaningfulCharacters = cleanText.replace(/[\s\r\n\t]/g, '');

    // If text has less than 25 meaningful characters, it is empty or scanned image-only
    if (meaningfulCharacters.length < 25) {
      return {
        text: cleanText,
        isScannedOrEmpty: true,
        pageCount: extraction.totalPages || 1,
        message: 'This document appears to contain scanned images or text that could not be extracted.',
      };
    }

    return {
      text: cleanText,
      isScannedOrEmpty: false,
      pageCount: extraction.totalPages || 1,
    };
  } catch (error: any) {
    console.error('[PDF Service] Error parsing PDF:', error.message);
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}
