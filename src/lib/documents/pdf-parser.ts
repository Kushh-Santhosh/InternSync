/**
 * Lightweight, resilient PDF text parser.
 * Extracts textual content from PDF binary streams, literal strings,
 * and text-showing operators (Tj, TJ, ', ").
 */

export async function parsePdf(fileData: ArrayBuffer | Uint8Array): Promise<string> {
  const bytes = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData)
  const decoder = new TextDecoder('latin1')
  const rawString = decoder.decode(bytes)

  if (!rawString.startsWith('%PDF-')) {
    throw new Error('Invalid PDF: Missing %PDF- header')
  }

  const extractedLines: string[] = []

  // 1. Try extracting literal strings in text objects: BT ... ET blocks
  const textBlocks = rawString.match(/BT[\s\S]*?ET/g) || []

  for (const block of textBlocks) {
    // Match [(...)...] TJ arrays
    const tjArrays = block.match(/\[([\s\S]*?)\]\s*TJ/g) || []
    for (const tj of tjArrays) {
      const stringLiterals = tj.match(/\((.*?)\)/g) || []
      const combined = stringLiterals
        .map((s) => cleanPdfString(s.slice(1, -1)))
        .join('')
        .trim()
      if (combined.length > 1) {
        extractedLines.push(combined)
      }
    }

    // Match (text) Tj and ' / " operators
    const tjSingles = block.match(/\((.*?)\)\s*T[jJ']/g) || []
    for (const single of tjSingles) {
      const match = single.match(/\((.*?)\)/)
      if (match) {
        const cleaned = cleanPdfString(match[1]).trim()
        if (cleaned.length > 1) {
          extractedLines.push(cleaned)
        }
      }
    }
  }

  // 2. Fallback if PDF text was compressed or non-standard: extract all printable string sequences
  if (extractedLines.length === 0) {
    const rawMatches = rawString.match(/\(([a-zA-Z0-9\s.,@:;/\-_+()]{3,})\)/g) || []
    for (const m of rawMatches) {
      const inner = cleanPdfString(m.slice(1, -1)).trim()
      if (inner.length > 3 && !inner.startsWith('CID') && !inner.startsWith('Font')) {
        extractedLines.push(inner)
      }
    }
  }

  // Deduplicate consecutive identical lines and clean formatting
  const result: string[] = []
  for (let i = 0; i < extractedLines.length; i++) {
    const line = extractedLines[i]
    if (line !== extractedLines[i - 1]) {
      result.push(line)
    }
  }

  return result.join('\n')
}

function cleanPdfString(str: string): string {
  return str
    .replace(/\\([()\\])/g, '$1')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
}

export const parsePdfText = parsePdf

