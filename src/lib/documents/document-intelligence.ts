import { parsePptx } from './pptx-parser'
import { SKILL_TAXONOMY, normalizeSkill } from '@/lib/matching/taxonomy'
import type {
  EvidenceStrength,
  ProjectItem,
  SkillEvidenceItem,
  StudentProfile,
  UploadedDocument,
} from '@/types'

export interface DocumentAnalysisResult {
  document: UploadedDocument
  updatedProfile?: Partial<StudentProfile>
  newSkills: SkillEvidenceItem[]
  newProjects: ProjectItem[]
  summaryNotes: string[]
}

/**
 * Categorizes a skill into one of the canonical categories
 */
function categorizeSkill(skillName: string): 'frontend' | 'backend' | 'ai_ml' | 'data' | 'languages' | 'tools' {
  const s = skillName.toLowerCase()
  if (['react', 'vue', 'angular', 'html', 'css', 'tailwind css', 'next.js', 'svelte'].includes(s)) return 'frontend'
  if (['node.js', 'fastapi', 'express', 'django', 'spring boot', 'flask', 'graphql', 'rest apis'].includes(s)) return 'backend'
  if (['machine learning', 'pytorch', 'tensorflow', 'scikit-learn', 'deep learning', 'nlp', 'computer vision', 'vector embeddings', 'rag', 'llm'].includes(s)) return 'ai_ml'
  if (['sql', 'postgresql', 'mongodb', 'redis', 'mysql', 'pandas', 'numpy', 'database design'].includes(s)) return 'data'
  if (['python', 'typescript', 'javascript', 'c++', 'java', 'go', 'rust', 'c#'].includes(s)) return 'languages'
  return 'tools'
}

/**
 * Extracts skills from raw text using the standard taxonomy
 */
export function extractSkillsFromText(text: string): { skillName: string; confidence: number }[] {
  const found = new Map<string, number>()

  for (const item of SKILL_TAXONOMY) {
    let count = 0
    const canonicalLower = item.canonicalName.toLowerCase()

    // Count occurrences of canonical name
    const canonicalRegex = new RegExp(`\\b${canonicalLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    const canonicalMatches = text.match(canonicalRegex)
    if (canonicalMatches) count += canonicalMatches.length

    // Count occurrences of aliases
    for (const alias of item.aliases) {
      const aliasRegex = new RegExp(`\\b${alias.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      const aliasMatches = text.match(aliasRegex)
      if (aliasMatches) count += aliasMatches.length
    }

    if (count > 0) {
      // Frequency-based confidence score
      const base = count >= 4 ? 88 : count >= 2 ? 78 : 68
      found.set(item.canonicalName, base)
    }
  }

  return Array.from(found.entries()).map(([skillName, confidence]) => ({ skillName, confidence }))
}

/**
 * Extract personal profile fields from resume text
 */
export function extractProfileFromResumeText(text: string): Partial<StudentProfile> {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const updates: Partial<StudentProfile> = {}

  // Name is typically in the first 3 lines
  if (lines.length > 0) {
    const firstLine = lines[0]
    if (firstLine.length < 50 && !/@|http|resume|curriculum/i.test(firstLine)) {
      updates.fullName = firstLine.replace(/[^a-zA-Z\s.-]/g, '').trim()
    }
  }

  // Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  if (emailMatch) {
    updates.email = emailMatch[0]
  }

  // Degree
  if (/b\.?tech|bachelor of technology/i.test(text)) {
    updates.degree = 'B.Tech'
  } else if (/b\.?e|bachelor of engineering/i.test(text)) {
    updates.degree = 'B.E'
  } else if (/b\.?s\.?c|bachelor of science/i.test(text)) {
    updates.degree = 'B.Sc'
  } else if (/m\.?tech|master of technology/i.test(text)) {
    updates.degree = 'M.Tech'
  }

  // Branch
  if (/computer science|cse/i.test(text)) {
    updates.branch = 'Computer Science & Engineering'
  } else if (/information technology|it\b/i.test(text)) {
    updates.branch = 'Information Technology'
  } else if (/artificial intelligence|data science|ai\s*&\s*ds/i.test(text)) {
    updates.branch = 'AI & Data Science'
  } else if (/electronics|ece/i.test(text)) {
    updates.branch = 'Electronics & Communication'
  }

  // Current Year & Graduation Year
  const yearMatch = text.match(/202[4-9]/)
  if (yearMatch) {
    const gradYear = parseInt(yearMatch[0], 10)
    updates.graduationYear = gradYear
    const currentCalendarYear = new Date().getFullYear()
    const diff = gradYear - currentCalendarYear
    if (diff === 1) updates.currentYear = 3
    else if (diff === 0) updates.currentYear = 4
    else if (diff === 2) updates.currentYear = 2
    else if (diff === 3) updates.currentYear = 1
  }

  // Location detection
  const indianCities = ['Bengaluru', 'Bangalore', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi', 'Chennai', 'Noida', 'Gurugram']
  for (const city of indianCities) {
    if (new RegExp(`\\b${city}\\b`, 'i').test(text)) {
      updates.location = city === 'Bangalore' ? 'Bengaluru' : city
      break
    }
  }

  return updates
}

/**
 * Processes an uploaded file (Resume, PPT/PPTX, Project Report, or Certificate)
 */
export async function processUploadedDocument(
  file: File,
  type: 'resume' | 'presentation' | 'report' | 'certificate',
  currentProfile: StudentProfile,
  existingSkills: SkillEvidenceItem[]
): Promise<DocumentAnalysisResult> {
  const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  let parsedText = ''
  let slideCount: number | undefined
  const extractedProjects: ProjectItem[] = []
  const summaryNotes: string[] = []
  let profileUpdates: Partial<StudentProfile> = {}

  if (file.name.endsWith('.pptx') || file.name.endsWith('.ppt') || type === 'presentation') {
    // PPTX Parsing
    try {
      const buffer = await file.arrayBuffer()
      const presentation = await parsePptx(buffer)
      parsedText = presentation.allText
      slideCount = presentation.totalSlides
      summaryNotes.push(`Parsed ${presentation.totalSlides} slides from presentation "${presentation.title}"`)

      // Convert detected slides into project items
      for (const proj of presentation.extractedProjects) {
        extractedProjects.push({
          id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          studentId: currentProfile.id,
          title: proj.name,
          description: proj.overview,
          technologies: proj.technologies,
          evidenceStrength: 'strong' as EvidenceStrength,
          highlights: [
            `Extracted directly from ${presentation.totalSlides}-slide presentation deck`,
            `Demonstrated architecture and implementation using ${proj.technologies.slice(0, 3).join(', ')}`,
          ],
        })
      }
    } catch {
      // Fallback text extraction if format is legacy ppt or corrupted
      parsedText = await file.text().catch(() => '')
      summaryNotes.push(`Extracted text stream from presentation file ${file.name}`)
    }
  } else {
    // Resume, Project Report, or Certificate (PDF / Text / Markdown)
    try {
      parsedText = await file.text()
    } catch {
      parsedText = `Uploaded document ${file.name}`
    }

    if (type === 'resume') {
      profileUpdates = extractProfileFromResumeText(parsedText)
      summaryNotes.push(`Extracted profile credentials from resume (${profileUpdates.fullName || 'Candidate'})`)
    }
  }

  // Extract skills from parsed content
  const detectedSkills = extractSkillsFromText(parsedText)
  summaryNotes.push(`Detected ${detectedSkills.length} technical skills across taxonomy`)

  // Synthesize into multi-source SkillEvidenceItems
  const updatedSkills: SkillEvidenceItem[] = [...existingSkills]

  for (const detected of detectedSkills) {
    const canonical = normalizeSkill(detected.skillName)
    const existingIndex = updatedSkills.findIndex(
      (s) => normalizeSkill(s.skillName) === canonical
    )

    const evidenceSource = type === 'resume' ? 'resume' : 'project'

    if (existingIndex >= 0) {
      const existing = updatedSkills[existingIndex]
      const sources = Array.from(new Set([...existing.evidenceSources, evidenceSource]))
      const boost = sources.length >= 3 ? 15 : sources.length === 2 ? 8 : 4
      const newConfidence = Math.min(98, Math.max(existing.confidence, detected.confidence) + boost)

      updatedSkills[existingIndex] = {
        ...existing,
        confidence: newConfidence,
        evidenceSources: sources as ('resume' | 'project' | 'github' | 'assessment')[],
        projectCount: type === 'presentation' || type === 'report' ? existing.projectCount + 1 : existing.projectCount,
        lastValidatedAt: new Date().toISOString(),
      }
    } else {
      updatedSkills.push({
        skillName: detected.skillName,
        category: categorizeSkill(detected.skillName),
        confidence: detected.confidence,
        evidenceSources: [evidenceSource],
        projectCount: type === 'presentation' || type === 'report' ? 1 : 0,
        githubStrength: 'none',
        lastValidatedAt: new Date().toISOString(),
      })
    }
  }

  const uploadedDoc: UploadedDocument = {
    id: docId,
    name: file.name,
    type,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    parsedText,
    slideCount,
    extractedSkills: detectedSkills.map((s) => s.skillName),
    extractedProjects: extractedProjects.map((p) => p.title),
  }

  return {
    document: uploadedDoc,
    updatedProfile: profileUpdates,
    newSkills: updatedSkills,
    newProjects: extractedProjects,
    summaryNotes,
  }
}
