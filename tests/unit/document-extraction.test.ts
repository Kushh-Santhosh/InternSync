import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import { parsePdf, parsePdfDetailed } from '@/lib/documents/pdf-parser'
import { parseDocx } from '@/lib/documents/docx-parser'
import { parsePptx } from '@/lib/documents/pptx-parser'
import {
  extractProfileFromResumeText,
  processUploadedDocument,
  validateDocumentFile,
} from '@/lib/documents/document-intelligence'
import { BLANK_STUDENT_PROFILE } from '@/data/blank-profile'

describe('Document Extraction, Multi-Format, and Error State Tests', () => {
  it('extracts multi-page text from valid PDF document', async () => {
    // Construct a valid multi-page PDF structure with pages and font
    const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R 4 0 R]/Count 2>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 6 0 R>>endobj
5 0 obj<</Length 50>>stream
BT
/F1 12 Tf
100 700 Td
(Page 1: Senior Software Engineering Student) Tj
ET
endstream
endobj
6 0 obj<</Length 44>>stream
BT
/F1 12 Tf
100 700 Td
(Page 2: Projects and Production Experience) Tj
ET
endstream
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000120 00000 n 
0000000222 00000 n 
0000000324 00000 n 
0000000424 00000 n 
trailer<</Size 7/Root 1 0 R>>
startxref
518
%%EOF`

    const encoder = new TextEncoder()
    const buffer = encoder.encode(pdfContent).buffer

    const result = await parsePdfDetailed(buffer)
    expect(result.isEmpty).toBe(false)
    expect(result.isScanned).toBe(false)
    expect(result.totalPages).toBeGreaterThanOrEqual(1)
    expect(result.text).toContain('Senior Software Engineering Student')
  })

  it('accurately distinguishes scanned PDFs that require OCR', async () => {
    // Construct a PDF page with an image dictionary but zero text operators (scanned PDF)
    const scannedPdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj
4 0 obj<</Length 18>>stream
q 612 0 0 792 0 0 cm Q
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000216 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref
284
%%EOF`

    const buffer = new TextEncoder().encode(scannedPdfContent).buffer
    const result = await parsePdfDetailed(buffer)

    // Must detect that pages exist but no selectable text stream was extracted
    expect(result.isScanned).toBe(true)
    expect(result.error).toMatch(/scanned image|OCR/i)

    // parsePdf wrapper must throw the OCR error instead of falsely reporting success
    await expect(parsePdf(buffer)).rejects.toThrow(/OCR/i)
  })

  it('accurately detects empty PDF files and reports failure', async () => {
    const emptyPdf = '%PDF-1.4\n%%EOF'
    const buffer = new TextEncoder().encode(emptyPdf).buffer

    const result = await parsePdfDetailed(buffer)
    expect(result.isEmpty).toBe(true)
    expect(result.error).toBeDefined()
  })

  it('extracts clean readable text from modern DOCX archives', async () => {
    // Generate valid DOCX ZIP with word/document.xml
    const zip = new JSZip()
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Alex Rivera - Resume</w:t></w:r></w:p>
    <w:p><w:r><w:t>Education: B.Tech in Computer Science</w:t></w:r></w:p>
    <w:p><w:r><w:t>Skills: Python, TypeScript, React, Docker</w:t></w:r></w:p>
  </w:body>
</w:document>`

    zip.file('word/document.xml', documentXml)
    const buffer = await zip.generateAsync({ type: 'arraybuffer' })

    const text = await parseDocx(buffer)
    expect(text).toContain('Alex Rivera - Resume')
    expect(text).toContain('Skills: Python, TypeScript, React, Docker')
  })

  it('extracts slides and project records from modern PPTX presentations', async () => {
    const zip = new JSZip()
    const slide1Xml = `<?xml version="1.0" encoding="UTF-8"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>AI Assistant Capstone Project</a:t></a:r></a:p>
          <a:p><a:r><a:t>Implemented full-stack LLM embeddings using Python and FastAPI.</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`

    zip.file('ppt/slides/slide1.xml', slide1Xml)
    const buffer = await zip.generateAsync({ type: 'arraybuffer' })

    const presentation = await parsePptx(buffer)
    expect(presentation.totalSlides).toBe(1)
    expect(presentation.allText).toContain('AI Assistant Capstone Project')
    expect(presentation.extractedTechnologies).toContain('Python')
    expect(presentation.extractedTechnologies).toContain('FastAPI')
  })

  it('rejects legacy binary .doc and .ppt files with specific actionable instructions', async () => {
    // Construct OLE CFBF binary header [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]
    const oleHeader = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00, 0x00])

    await expect(parseDocx(oleHeader)).rejects.toThrow(/Legacy binary Microsoft Word \(\.doc\) format is not supported/i)
    await expect(parsePptx(oleHeader)).rejects.toThrow(/Legacy binary Microsoft PowerPoint \(\.ppt\) format is not supported/i)
  })

  it('rejects corrupted or malformed archives with clean errors', async () => {
    const corruptedBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x99, 0x88, 0x77]) // truncated zip

    await expect(parseDocx(corruptedBytes)).rejects.toThrow(/Invalid DOCX format/i)
    await expect(parsePptx(corruptedBytes)).rejects.toThrow(/Invalid PPTX format/i)
  })

  it('validates upload boundaries and rejects executable payloads', () => {
    const safeFile = new File(['dummy'], 'resume.pdf', { type: 'application/pdf' })
    expect(validateDocumentFile(safeFile).valid).toBe(true)

    const exeFile = new File(['dummy'], 'payload.exe', { type: 'application/x-msdownload' })
    expect(validateDocumentFile(exeFile).valid).toBe(false)
    expect(validateDocumentFile(exeFile).error).toMatch(/prohibited/i)

    const shFile = new File(['dummy'], 'script.sh', { type: 'text/x-sh' })
    expect(validateDocumentFile(shFile).valid).toBe(false)
  })

  it('processUploadedDocument rejects legacy .doc file upload with informative message', async () => {
    const legacyDoc = new File(['dummy'], 'old_resume.doc', { type: 'application/msword' })
    await expect(
      processUploadedDocument(legacyDoc, 'resume', BLANK_STUDENT_PROFILE, [])
    ).rejects.toThrow(/Legacy Microsoft Word \(\.doc\) format is not supported/i)
  })

  it('correctly resolves graduation year as 2028 (not 2027) for 4-year B.Tech starting in 2024', () => {
    const resumeText = `
KUSHAL SANTHOSH P
EDUCATION
CMR University — Bachelor of Technology, Information Technology | 2024–2028 (Pursuing)
Current CGPA: 81.08
KEY SKILLS
Full-Stack Development, UI/UX Design, Figma, Python
`
    const profile = extractProfileFromResumeText(resumeText)
    expect(profile.graduationYear).toBe(2028)
    expect(profile.graduationYear).not.toBe(2027)
    // Academic year standing remains unconfirmed when not explicitly stated in words
    expect(profile.currentYear).toBe(0)
    expect(profile.isCurrentYearConfirmed).toBe(false)
  })

  it('regression: resolves 2028 graduation year even if source stream has 2024-2027 for B.Tech degree', () => {
    const resumeStreamText = `
CMR University — Bachelor of Technology, Information Technology | 2024–2027 (Pursuing)
Current CGPA: 81.08
`
    const profile = extractProfileFromResumeText(resumeStreamText)
    expect(profile.graduationYear).toBe(2028)
    expect(profile.graduationYear).not.toBe(2027)
    expect(profile.university).toBe('CMR University')
    expect(profile.academicMetric).toContain('81.08')
    expect(profile.isAcademicMetricConfirmed).toBe(false)
  })
})
