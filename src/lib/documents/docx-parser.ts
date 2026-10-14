import JSZip from 'jszip'

/**
 * Extracts clean readable text from a DOCX file buffer.
 * A .docx file is an OpenXML ZIP archive containing word/document.xml.
 */
export async function parseDocx(fileData: ArrayBuffer | Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(fileData)
  const docXmlFile = zip.file('word/document.xml')

  if (!docXmlFile) {
    throw new Error('Invalid DOCX format: word/document.xml not found')
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

  return extractedLines.join('\n')
}
