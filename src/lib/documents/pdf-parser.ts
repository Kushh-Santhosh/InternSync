import { extractText } from 'unpdf'

export interface PdfPageContent {
  pageNumber: number
  text: string
}

/**
 * Result of structured PDF extraction.
 */
export interface PdfParseResult {
  text: string
  pages: PdfPageContent[]
  totalPages: number
  isScanned: boolean
  isEmpty: boolean
  error?: string
}

/**
 * Extracts clean, multi-page text from compressed or standard PDF files.
 * Accurately detects empty files and distinguishes text-based PDFs from scanned PDFs requiring OCR.
 * Preserves page boundaries and page provenance for traceable evidence.
 */
export async function parsePdfDetailed(fileData: ArrayBuffer | Uint8Array): Promise<PdfParseResult> {
  const bytes = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData)

  if (bytes.length < 5) {
    return {
      text: '',
      pages: [],
      totalPages: 0,
      isScanned: false,
      isEmpty: true,
      error: 'File is too small to be a valid PDF document.',
    }
  }

  // Check PDF magic header %PDF-
  const header = String.fromCharCode(...bytes.subarray(0, 5))
  if (header !== '%PDF-') {
    return {
      text: '',
      pages: [],
      totalPages: 0,
      isScanned: false,
      isEmpty: true,
      error: 'Invalid PDF format: Missing %PDF- header.',
    }
  }

  try {
    // Pass a copy so the original bytes are not detached by PDF.js worker transfer
    const result = await extractText(new Uint8Array(bytes.slice()), { mergePages: false })
    const totalPages = result.totalPages || 0
    const rawPages: string[] = Array.isArray(result.text)
      ? result.text
      : [String(result.text || '')]

    const pages: PdfPageContent[] = rawPages.map((pageText, idx) => ({
      pageNumber: idx + 1,
      text: typeof pageText === 'string' ? pageText.trim() : String(pageText || '').trim(),
    }))

    // Build formatted multi-page text with clear page boundary markers
    const formattedText =
      pages.length > 1
        ? pages.map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`).join('\n\n')
        : pages[0]?.text || ''

    const totalTextLength = pages.reduce((acc, p) => acc + p.text.length, 0)

    // Detect scanned PDFs (pages exist, but virtually zero selectable text streams)
    const isScanned = totalPages > 0 && totalTextLength < 20
    const isEmpty = totalTextLength === 0

    return {
      text: formattedText.trim(),
      pages,
      totalPages,
      isScanned,
      isEmpty,
      error: isScanned
        ? 'This PDF appears to be a scanned image or contains no selectable text streams. OCR is required to extract text.'
        : isEmpty
        ? 'PDF contains no readable text content.'
        : undefined,
    }
  } catch (err: unknown) {
    // Fallback for fragmented or non-standard PDFs with literal text operators
    const rawFallback = extractRawPdfTextOperators(bytes)
    if (rawFallback.length >= 3) {
      return {
        text: rawFallback,
        pages: [{ pageNumber: 1, text: rawFallback }],
        totalPages: 1,
        isScanned: false,
        isEmpty: false,
      }
    }

    const message = err instanceof Error ? err.message : String(err)
    return {
      text: '',
      pages: [],
      totalPages: 0,
      isScanned: false,
      isEmpty: true,
      error: `Failed to parse PDF document: ${message}`,
    }
  }
}

function extractRawPdfTextOperators(bytes: Uint8Array): string {
  const decoder = new TextDecoder('latin1')
  const rawString = decoder.decode(bytes)
  const extractedLines: string[] = []

  const textBlocks = rawString.match(/BT[\s\S]*?ET/g) || []
  for (const block of textBlocks) {
    const tjSingles = block.match(/\((.*?)\)\s*T[jJ']/g) || []
    for (const single of tjSingles) {
      const match = single.match(/\((.*?)\)/)
      if (match && match[1]) {
        extractedLines.push(match[1].trim())
      }
    }
  }

  return extractedLines.join('\n').trim()
}

/**
 * Standard parsePdf interface returning text string or throwing an explicit error.
 */
export async function parsePdf(fileData: ArrayBuffer | Uint8Array): Promise<string> {
  const result = await parsePdfDetailed(fileData)
  if (result.error) {
    throw new Error(result.error)
  }
  return result.text
}

export const parsePdfText = parsePdf
