import { z } from 'zod'
import { parsePptx } from './pptx-parser'
import { parseDocx } from './docx-parser'
import { parsePdf } from './pdf-parser'
import { SKILL_TAXONOMY, normalizeSkill } from '@/lib/matching/taxonomy'
import { uploadDocumentToStorage } from '@/lib/supabase/database'
import type {
  EvidenceStrength,
  ProjectItem,
  SkillEvidenceItem,
  StudentProfile,
  UploadedDocument,
} from '@/types'

export const ExtractedResumeSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  degree: z.string().optional(),
  branch: z.string().optional(),
  graduationYear: z.number().int().optional(),
  currentYear: z.number().int().min(1).max(5).optional(),
  location: z.string().optional(),
  skills: z.array(z.object({
    name: z.string(),
    confidence: z.number().min(0).max(100),
  })),
  projects: z.array(z.object({
    title: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
  })),
})

export type ExtractedResumeData = z.infer<typeof ExtractedResumeSchema>

export interface DocumentAnalysisResult {
  document: UploadedDocument
  updatedProfile?: Partial<StudentProfile>
  newSkills: SkillEvidenceItem[]
  newProjects: ProjectItem[]
  summaryNotes: string[]
  storagePath?: string
  error?: string
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
 * Extracts skills from raw text using the standard taxonomy.
 * Assigns measured baseline confidence for resume claims (never 90%+ without project verification).
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
      // Measured resume claim confidence: 60% for single mention, 70% for multiple mentions
      // High confidence (>=80%) requires practical project proof or assessment
      const baseConfidence = count >= 3 ? 72 : count >= 2 ? 68 : 62
      found.set(item.canonicalName, baseConfidence)
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
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i]
      if (
        line.length > 2 &&
        line.length < 50 &&
        !/@|http|resume|curriculum|vitae|github|linkedin|education|experience|projects/i.test(line)
      ) {
        updates.fullName = line.replace(/[^a-zA-Z\s.-]/g, '').trim()
        break
      }
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
  } else if (/mca|master of computer applications/i.test(text)) {
    updates.degree = 'MCA'
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
    else if (diff <= 0) updates.currentYear = 4
    else if (diff === 2) updates.currentYear = 2
    else if (diff >= 3) updates.currentYear = 1
  }

  // Location detection
  const indianCities = [
    'Bengaluru',
    'Bangalore',
    'Hyderabad',
    'Pune',
    'Mumbai',
    'Delhi',
    'Chennai',
    'Noida',
    'Gurugram',
  ]
  for (const city of indianCities) {
    if (new RegExp(`\\b${city}\\b`, 'i').test(text)) {
      updates.location = city === 'Bangalore' ? 'Bengaluru' : city
      break
    }
  }

  return updates
}

/**
 * Validates upload safety, size, and type
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: 'File size exceeds maximum allowable limit (10MB).' }
  }

  const blockedExtensions = ['.exe', '.bat', '.cmd', '.sh', '.bin', '.dll', '.msi', '.vbs', '.js']
  const lowerName = file.name.toLowerCase()
  if (blockedExtensions.some((ext) => lowerName.endsWith(ext))) {
    return { valid: false, error: 'Executable files are prohibited for security.' }
  }

  if (file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Image-based documents require optical character recognition (OCR). Please upload a PDF, DOCX, PPTX, or TXT document.',
    }
  }

  return { valid: true }
}

/**
 * Processes an uploaded file (Resume, PPT/PPTX, DOCX, Project Report, or TXT)
 */
export async function processUploadedDocument(
  file: File,
  type: 'resume' | 'presentation' | 'report' | 'certificate',
  currentProfile: StudentProfile,
  existingSkills: SkillEvidenceItem[]
): Promise<DocumentAnalysisResult> {
  const validation = validateDocumentFile(file)
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file format')
  }

  const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  let parsedText = ''
  let slideCount: number | undefined
  const extractedProjects: ProjectItem[] = []
  const summaryNotes: string[] = []
  let profileUpdates: Partial<StudentProfile> = {}

  const lowerName = file.name.toLowerCase()

  // 1. Format-specific extraction
  if (lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt') || type === 'presentation') {
    try {
      const buffer = await file.arrayBuffer()
      const presentation = await parsePptx(buffer)
      parsedText = presentation.allText
      slideCount = presentation.totalSlides
      summaryNotes.push(
        `Parsed ${presentation.totalSlides} slides from presentation "${presentation.title}"`
      )

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
      parsedText = await file.text().catch(() => '')
      summaryNotes.push(`Extracted text stream from presentation file ${file.name}`)
    }
  } else if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
    try {
      const buffer = await file.arrayBuffer()
      parsedText = await parseDocx(buffer)
      summaryNotes.push(`Parsed clean document text from DOCX document "${file.name}"`)
    } catch {
      parsedText = await file.text().catch(() => '')
      summaryNotes.push(`Extracted fallback text from ${file.name}`)
    }
  } else if (lowerName.endsWith('.pdf')) {
    try {
      const buffer = await file.arrayBuffer()
      parsedText = await parsePdf(buffer)
      summaryNotes.push(`Parsed readable PDF text content from "${file.name}"`)
    } catch {
      parsedText = await file.text().catch(() => '')
      summaryNotes.push(`Extracted text from PDF file ${file.name}`)
    }
  } else {
    // Plain text / Markdown
    parsedText = await file.text().catch(() => '')
    summaryNotes.push(`Read text document "${file.name}"`)
  }

  // 2. Profile credential extraction if resume
  if (type === 'resume') {
    profileUpdates = extractProfileFromResumeText(parsedText)
    if (profileUpdates.fullName) {
      summaryNotes.push(`Extracted candidate name: "${profileUpdates.fullName}"`)
    }
    if (profileUpdates.degree) {
      summaryNotes.push(`Identified academic degree: ${profileUpdates.degree} (${profileUpdates.branch || 'Engineering'})`)
    }
  }

  // 3. Technical skills extraction
  const detectedSkills = extractSkillsFromText(parsedText)
  summaryNotes.push(`Extracted ${detectedSkills.length} evidence-referenced technical skills`)

  // 4. Synthesize updated multi-source SkillEvidenceItems
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
      const boost = sources.length >= 3 ? 12 : sources.length === 2 ? 6 : 2
      const newConfidence = Math.min(95, Math.max(existing.confidence, detected.confidence) + boost)

      updatedSkills[existingIndex] = {
        ...existing,
        confidence: newConfidence,
        evidenceSources: sources as ('resume' | 'project' | 'github' | 'assessment')[],
        projectCount:
          type === 'presentation' || type === 'report' ? existing.projectCount + 1 : existing.projectCount,
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

  // 5. Upload to Supabase Storage if user profile has an id
  let storagePath: string | undefined
  if (currentProfile.id) {
    try {
      const uploadRes = await uploadDocumentToStorage(currentProfile.id, file)
      if (uploadRes.path) {
        storagePath = uploadRes.path
        summaryNotes.push('Stored securely in private document storage.')
      }
    } catch {
      // Storage upload error is non-fatal for extraction
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
    storagePath,
  }
}

/**
 * Convenience wrapper for single-file analysis
 */
export async function analyzeDocumentFile(
  file: File,
  currentProfile: StudentProfile,
  existingSkills: SkillEvidenceItem[] = []
): Promise<DocumentAnalysisResult> {
  const type = file.name.endsWith('.pptx') || file.name.endsWith('.ppt')
    ? 'presentation'
    : file.name.includes('cert')
    ? 'certificate'
    : 'resume'
  return processUploadedDocument(file, type, currentProfile, existingSkills)
}

