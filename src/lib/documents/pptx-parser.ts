import JSZip from 'jszip'
import { SKILL_TAXONOMY } from '@/lib/matching/taxonomy'

export interface ParsedSlide {
  slideNumber: number
  title: string
  bullets: string[]
  fullText: string
}

export interface ParsedPresentation {
  totalSlides: number
  title: string
  slides: ParsedSlide[]
  allText: string
  extractedTechnologies: string[]
  extractedProjects: {
    name: string
    overview: string
    technologies: string[]
    bulletCount: number
  }[]
}

/**
 * Extracts plain text from PPTX XML slide data.
 */
function extractTextFromSlideXml(xmlContent: string): { title: string; bullets: string[]; fullText: string } {
  const bullets: string[] = []
  let title = ''

  // Look for title placeholder
  const titleMatch = xmlContent.match(/<p:sp[^>]*>[\s\S]*?<p:ph[^>]*type="(?:title|ctrTitle)"[\s\S]*?<\/p:sp>/i)
  if (titleMatch) {
    const textRuns = titleMatch[0].match(/<a:t[^>]*>([^<]*)<\/a:t>/gi) || []
    title = textRuns
      .map((t) => t.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)
      .join(' ')
  }

  // Extract all paragraphs
  const paragraphs = xmlContent.match(/<a:p[^>]*>[\s\S]*?<\/a:p>/gi) || []
  for (const p of paragraphs) {
    const textRuns = p.match(/<a:t[^>]*>([^<]*)<\/a:t>/gi) || []
    const line = textRuns
      .map((t) => t.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)
      .join(' ')
      .trim()

    if (line) {
      if (!title && bullets.length === 0) {
        title = line
      } else if (line !== title) {
        bullets.push(line)
      }
    }
  }

  const fullText = [title, ...bullets].filter(Boolean).join('\n')
  return { title: title || 'Untitled Slide', bullets, fullText }
}

/**
 * Detects mentioned technologies from taxonomy in presentation text.
 */
function extractTechnologies(text: string): string[] {
  const lower = text.toLowerCase()
  const found = new Set<string>()

  for (const item of SKILL_TAXONOMY) {
    const canonical = item.canonicalName
    if (lower.includes(canonical.toLowerCase())) {
      found.add(canonical)
    } else {
      for (const alias of item.aliases) {
        // Word boundary match
        const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        if (regex.test(text)) {
          found.add(canonical)
          break
        }
      }
    }
  }

  return Array.from(found)
}

/**
 * Real PPTX presentation parser using JSZip.
 * Operates on Uint8Array or ArrayBuffer.
 */
export async function parsePptx(fileData: ArrayBuffer | Uint8Array): Promise<ParsedPresentation> {
  const zip = await JSZip.loadAsync(fileData)
  const slides: ParsedSlide[] = []

  // Collect all slide xml files (ppt/slides/slide1.xml, etc.)
  const slideFileNames = Object.keys(zip.files).filter((name) =>
    /^ppt\/slides\/slide\d+\.xml$/i.test(name)
  )

  // Sort numerically
  slideFileNames.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10)
    const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10)
    return numA - numB
  })

  for (let i = 0; i < slideFileNames.length; i++) {
    const fileName = slideFileNames[i]
    const content = await zip.file(fileName)?.async('string')
    if (content) {
      const parsed = extractTextFromSlideXml(content)
      slides.push({
        slideNumber: i + 1,
        title: parsed.title,
        bullets: parsed.bullets,
        fullText: parsed.fullText,
      })
    }
  }

  const allText = slides.map((s) => `[Slide ${s.slideNumber}: ${s.title}]\n${s.bullets.join('\n')}`).join('\n\n')
  const extractedTechnologies = extractTechnologies(allText)

  // Group slides into detected projects
  const extractedProjects: ParsedPresentation['extractedProjects'] = []
  for (const slide of slides) {
    const isProjectSlide =
      /project|architecture|system|implementation|workflow|overview|design|case study/i.test(slide.title) ||
      slide.bullets.some((b) => /built|developed|implemented|tech stack|technologies|database|backend|frontend/i.test(b))

    if (isProjectSlide && slide.bullets.length > 0) {
      const slideTech = extractTechnologies(slide.fullText)
      extractedProjects.push({
        name: slide.title.replace(/^project[:\s-]+/i, '').trim(),
        overview: slide.bullets.slice(0, 3).join('. '),
        technologies: slideTech,
        bulletCount: slide.bullets.length,
      })
    }
  }

  const presentationTitle = slides[0]?.title || 'Uploaded Project Presentation'

  return {
    totalSlides: slides.length,
    title: presentationTitle,
    slides,
    allText,
    extractedTechnologies,
    extractedProjects:
      extractedProjects.length > 0
        ? extractedProjects
        : [
            {
              name: presentationTitle,
              overview: slides.slice(0, 3).map((s) => s.bullets.join('. ')).filter(Boolean).join('. '),
              technologies: extractedTechnologies,
              bulletCount: slides.reduce((acc, s) => acc + s.bullets.length, 0),
            },
          ],
  }
}
