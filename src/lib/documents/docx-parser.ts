import JSZip from 'jszip'

/**
 * Checks for OLE Compound File Binary format (legacy .doc, .ppt, .xls).
 * Header: 0xD0 0xCF 0x11 0xE0 0xA1 0xB1 0x1A 0xE1
 */
export function isLegacyOleBinary(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false
  return (
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0 &&
    bytes[4] === 0xa1 &&
    bytes[5] === 0xb1 &&
    bytes[6] === 0x1a &&
    bytes[7] === 0xe1
  )
}

/**
 * Extracts clean readable text from a DOCX file buffer.
 * A modern .docx file is an OpenXML ZIP archive containing word/document.xml.
 */
export async function parseDocx(fileData: ArrayBuffer | Uint8Array): Promise<string> {
  const bytes = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData)

  if (isLegacyOleBinary(bytes)) {
    throw new Error(
      'Legacy binary Microsoft Word (.doc) format is not supported. Please export or save your document as a modern .docx or PDF file before uploading.'
    )
  }

  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(bytes)
  } catch {
    throw new Error('Invalid DOCX format: The file is corrupted or not a valid OpenXML document archive.')
  }

  const docXmlFile = zip.file('word/document.xml')
  if (!docXmlFile) {
    throw new Error('Invalid DOCX format: word/document.xml not found.')
  }

  const xmlContent = await docXmlFile.async('text')

  // Extract all paragraphs (<w:p>...</w:p>)
  const paragraphs = xmlContent.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/gi) || []
  const extractedLines: string[] = []

  for (const p of paragraphs) {
    // Extract all text elements (<w:t>...</w:t>)
    const textMatches = p.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi) || []
    const line = textMatches
      .map((t) => t.replace(/<[^>]+>/g, ''))
      .join('')
      .trim()

    if (line) {
      extractedLines.push(line)
    }
  }

  const result = extractedLines.join('\n').trim()
  if (!result) {
    throw new Error('DOCX document contains no readable text content.')
  }

  return result
}
