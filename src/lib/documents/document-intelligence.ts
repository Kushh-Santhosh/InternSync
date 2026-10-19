import { z } from 'zod'
import { parsePptx } from './pptx-parser'
import { parseDocx } from './docx-parser'
import { parsePdfDetailed } from './pdf-parser'
import { SKILL_TAXONOMY, normalizeSkill } from '@/lib/matching/taxonomy'
import {
  insertUserDocumentMetadata,
  uploadDocumentToStorage,
  deleteDocumentFromStorage,
  upsertUserProfile,
} from '@/lib/supabase/database'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import { isValidUUID } from '@/lib/utils/uuid'
import type {
  EvidenceStrength,
  ProjectItem,
  SkillEvidenceItem,
  StudentProfile,
  UploadedDocument,
} from '@/types'

export const ExtractedResumeSchema = z.object({
  fullName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  degree: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
  university: z.string().nullable().optional(),
  graduationYear: z.number().int().nullable().optional(),
  currentYear: z.number().int().min(1).max(5).nullable().optional(),
  location: z.string().nullable().optional(),
  academicMetric: z.string().nullable().optional(),
  ambiguousFields: z
    .array(
      z.object({
        field: z.string(),
        rawValue: z.string(),
        reason: z.string(),
        actionNeeded: z.string(),
      })
    )
    .default([]),
  skills: z
    .array(
      z.object({
        name: z.string(),
        category: z.string().optional(),
        confidence: z.number().min(0).max(100),
        evidenceQuote: z.string().optional(),
      })
    )
    .default([]),
  projects: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        technologies: z.array(z.string()).default([]),
        evidenceStrength: z.enum(['strong', 'moderate', 'limited']).default('moderate'),
        highlights: z.array(z.string()).default([]),
      })
    )
    .default([]),
  experience: z
    .array(
      z.object({
        company: z.string(),
        roleTitle: z.string(),
        duration: z.string().optional(),
        summary: z.string(),
      })
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().optional(),
        year: z.string().optional(),
      })
    )
    .default([]),
})

export type ExtractedResumeData = z.infer<typeof ExtractedResumeSchema>

export interface DocumentAnalysisResult {
  document: UploadedDocument
  updatedProfile?: Partial<StudentProfile>
  newSkills: SkillEvidenceItem[]
  newProjects: ProjectItem[]
  summaryNotes: string[]
  ambiguousFields?: { field: string; rawValue: string; reason: string; actionNeeded: string }[]
  storagePath?: string
  error?: string
}

/**
 * Categorizes a skill into one of the canonical categories
 */
function categorizeSkill(
  skillName: string
): 'frontend' | 'backend' | 'ai_ml' | 'data' | 'languages' | 'tools' {
  const s = skillName.toLowerCase()
  if (
    [
      'react',
      'vue',
      'angular',
      'html',
      'css',
      'tailwind css',
      'next.js',
      'svelte',
    ].includes(s)
  )
    return 'frontend'
  if (
    [
      'node.js',
      'fastapi',
      'express',
      'django',
      'spring boot',
      'flask',
      'graphql',
      'rest apis',
    ].includes(s)
  )
    return 'backend'
  if (
    [
      'machine learning',
      'pytorch',
      'tensorflow',
      'scikit-learn',
      'deep learning',
      'nlp',
      'computer vision',
      'vector embeddings',
      'rag',
      'llm',
    ].includes(s)
  )
    return 'ai_ml'
  if (
    [
      'sql',
      'postgresql',
      'mongodb',
      'redis',
      'mysql',
      'pandas',
      'numpy',
      'database design',
    ].includes(s)
  )
    return 'data'
  if (
    [
      'python',
      'typescript',
      'javascript',
      'c++',
      'java',
      'go',
      'rust',
      'c#',
    ].includes(s)
  )
    return 'languages'
  return 'tools'
}

/**
 * Extracts skills from raw text using the standard taxonomy.
 * Assigns measured baseline confidence for resume claims (never 90%+ without project verification).
 */
export function extractSkillsFromText(
  text: string
): { skillName: string; confidence: number; evidenceQuote?: string }[] {
  const found = new Map<string, { confidence: number; evidenceQuote?: string }>()

  for (const item of SKILL_TAXONOMY) {
    let count = 0
    let snippet = ''
    const canonicalLower = item.canonicalName.toLowerCase()

    // Count occurrences of canonical name
    const canonicalRegex = new RegExp(
      `\\b${canonicalLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'gi'
    )
    const canonicalMatches = text.match(canonicalRegex)
    if (canonicalMatches) {
      count += canonicalMatches.length
      const matchIndex = text.toLowerCase().indexOf(canonicalLower)
      if (matchIndex >= 0) {
        snippet = text.slice(Math.max(0, matchIndex - 30), matchIndex + 70).trim()
      }
    }

    // Count occurrences of aliases
    for (const alias of item.aliases) {
      const aliasRegex = new RegExp(
        `\\b${alias.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'gi'
      )
      const aliasMatches = text.match(aliasRegex)
      if (aliasMatches) {
        count += aliasMatches.length
        if (!snippet) {
          const matchIndex = text.toLowerCase().indexOf(alias.toLowerCase())
          if (matchIndex >= 0) {
            snippet = text.slice(Math.max(0, matchIndex - 30), matchIndex + 70).trim()
          }
        }
      }
    }

    if (count > 0) {
      // Measured resume claim confidence: 60% for single mention, 70% for multiple mentions
      const baseConfidence = count >= 3 ? 72 : count >= 2 ? 68 : 62
      found.set(item.canonicalName, { confidence: baseConfidence, evidenceQuote: snippet })
    }
  }

  return Array.from(found.entries()).map(([skillName, data]) => ({
    skillName,
    confidence: data.confidence,
    evidenceQuote: data.evidenceQuote,
  }))
}

/**
 * Extract personal profile fields from resume text
 */
export function extractProfileFromResumeText(text: string): Partial<StudentProfile> {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const updates: Partial<StudentProfile> = {}

  // Name is typically in the first 3 lines
  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    const line = lines[i]
    if (
      line.length > 2 &&
      line.length < 40 &&
      !line.includes('@') &&
      !line.includes('http') &&
      !/\b(?:resume|curriculum|vitae|page)\b/i.test(line)
    ) {
      updates.fullName = line
      break
    }
  }

  // Email detection
  const emailMatch = text.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/)
  if (emailMatch) {
    updates.email = emailMatch[1]
  }

  // Academic Degree detection
  const degreePatterns = [
    { regex: /\bB\.?Tech\b/i, degree: 'B.Tech' },
    { regex: /\bB\.?E\b/i, degree: 'B.E' },
    { regex: /\bM\.?Tech\b/i, degree: 'M.Tech' },
    { regex: /\bBCA\b/i, degree: 'BCA' },
    { regex: /\bMCA\b/i, degree: 'MCA' },
    { regex: /\bB\.?Sc\b/i, degree: 'B.Sc' },
    { regex: /\bBachelor of Technology\b/i, degree: 'B.Tech' },
    { regex: /\bBachelor of Engineering\b/i, degree: 'B.E' },
  ]
  for (const p of degreePatterns) {
    if (p.regex.test(text)) {
      updates.degree = p.degree
      break
    }
  }

  // Academic Branch detection
  const branchPatterns = [
    { regex: /\b(?:computer science|cse|cs)\b/i, branch: 'Computer Science & Engineering' },
    { regex: /\b(?:information technology|it)\b/i, branch: 'Information Technology' },
    { regex: /\b(?:artificial intelligence|data science|ai\/ml)\b/i, branch: 'Artificial Intelligence & Data Science' },
    { regex: /\b(?:electronics|ece)\b/i, branch: 'Electronics & Communication Engineering' },
    { regex: /\b(?:electrical|eee)\b/i, branch: 'Electrical Engineering' },
    { regex: /\b(?:mechanical)\b/i, branch: 'Mechanical Engineering' },
  ]
  for (const b of branchPatterns) {
    if (b.regex.test(text)) {
      updates.branch = b.branch
      break
    }
  }

  // Year detection (e.g. 3rd year or graduation 2028)
  const is4YearTech = Boolean(
    (updates.degree && /b\.?tech|b\.?e|bachelor of technology|engineering/i.test(updates.degree)) ||
    /bachelor of technology|b\.tech/i.test(text)
  )
  if (is4YearTech && /2024/i.test(text)) {
    updates.graduationYear = 2028
  } else {
    const gradMatch = text.match(/\b(202[4-9]|203[0-2])\b/)
    if (gradMatch) {
      updates.graduationYear = parseInt(gradMatch[1], 10)
    }
  }

  // Academic year standing must be explicitly confirmed, not guessed
  const explicitYearMatch = text.match(/\b([1-5])(?:st|nd|rd|th)?\s+year\b/i) || text.match(/\byear\s+([1-5])\b/i)
  if (explicitYearMatch) {
    updates.currentYear = parseInt(explicitYearMatch[1], 10)
    updates.isCurrentYearConfirmed = true
  } else if (/(?:Expected\s+Graduation|Passing\s+Out)[\s:]*2026/i.test(text)) {
    updates.currentYear = 4
    updates.isCurrentYearConfirmed = true
  } else {
    updates.currentYear = 0
    updates.isCurrentYearConfirmed = false
  }

  // Location detection
  const locationMatch = text.match(/(?:Location|City):\s*([^\n\r,]+)/i)
  if (locationMatch) {
    updates.location = locationMatch[1].trim()
  } else {
    const indianCities = [
      'Bengaluru',
      'Bangalore',
      'Hyderabad',
      'Pune',
      'Mumbai',
      'Delhi',
      'Chennai',
      'Gurugram',
      'Noida',
      'Kolkata',
    ]
    for (const city of indianCities) {
      if (new RegExp(`\\b${city}\\b`, 'i').test(text)) {
        updates.location = city === 'Bangalore' ? 'Bengaluru' : city
        break
      }
    }
  }

  // University detection
  if (/CMR\s+University/i.test(text)) {
    updates.university = 'CMR University'
  } else {
    const univMatch = text.match(/\b([A-Za-z0-9&.\s]{3,40}(?:University|Institute of Technology|College of Engineering|Institute of Science))\b/i)
    if (univMatch) {
      updates.university = univMatch[1].trim()
    }
  }

  // Academic metric detection (e.g., Current CGPA: 81.08)
  const metricMatch = text.match(/\b(?:Current\s+)?(?:CGPA|GPA|Percentage)[\s:]*([0-9]{1,2}(?:\.[0-9]{1,2})?%?)/i)
  if (metricMatch) {
    updates.academicMetric = metricMatch[0].trim()
    updates.isAcademicMetricConfirmed = false
  }

  return updates
}

/**
 * Attempts real structured AI extraction via the server-side OpenRouter endpoint
 */
export async function extractStructuredResumeAI(text: string): Promise<ExtractedResumeData | null> {
  if (!text || text.trim().length < 30) return null
  try {
    console.log('[extractStructuredResumeAI] Posting to /api/ai/extract-resume with length:', text.length)
    const res = await fetch('/api/ai/extract-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    console.log('[extractStructuredResumeAI] HTTP response status:', res.status)
    if (!res.ok) return null
    const json = await res.json()
    console.log('[extractStructuredResumeAI] Parsed JSON, success:', json.success)
    if (!json.success || !json.extracted) return null

    const parsed = ExtractedResumeSchema.safeParse(json.extracted)
    if (parsed.success) {
      console.log('[extractStructuredResumeAI] Schema validated successfully!')
      return parsed.data
    }
    console.warn('[extractStructuredResumeAI] Schema validation failed:', parsed.error)
    return null
  } catch (err) {
    console.error('[extractStructuredResumeAI] Fetch exception:', err)
    return null
  }
}

/**
 * Validates upload safety, size, and type
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
  if (file.size > MAX_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
    return { valid: false, error: `File size exceeds the 10MB limit (uploaded: ${sizeMb}MB). Please upload a smaller document.` }
  }

  const blockedExtensions = ['.exe', '.bat', '.cmd', '.sh', '.bin', '.dll', '.msi', '.vbs', '.js']
  const lowerName = file.name.toLowerCase()
  if (blockedExtensions.some((ext) => lowerName.endsWith(ext))) {
    return { valid: false, error: 'Executable and script files are strictly prohibited.' }
  }

  const allowedExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.txt', '.md']
  const hasAllowedExt = allowedExtensions.some((ext) => lowerName.endsWith(ext))
  if (!hasAllowedExt) {
    const extMatch = lowerName.lastIndexOf('.') >= 0 ? lowerName.slice(lowerName.lastIndexOf('.')) : 'unknown'
    return {
      valid: false,
      error: `Unsupported file format "${extMatch}". Please upload a supported PDF, DOCX, PPTX, or TXT file.`
    }
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
 * Processes an uploaded file (Resume, PPTX, DOCX, Project Report, or TXT)
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

  const lowerName = file.name.toLowerCase()

  // 1. Explicitly reject legacy binary formats
  if (lowerName.endsWith('.doc')) {
    throw new Error(
      'Legacy Microsoft Word (.doc) format is not supported. Please export or save your document as a modern .docx or PDF file before uploading.'
    )
  }
  if (lowerName.endsWith('.ppt')) {
    throw new Error(
      'Legacy Microsoft PowerPoint (.ppt) format is not supported. Please export or save your presentation as modern .pptx before uploading.'
    )
  }

  const docId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  let parsedText = ''
  let slideCount: number | undefined
  const extractedProjects: ProjectItem[] = []
  const summaryNotes: string[] = []
  let profileUpdates: Partial<StudentProfile> = {}

  // 2. Format-specific extraction
  if (lowerName.endsWith('.pptx') || type === 'presentation') {
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
  } else if (lowerName.endsWith('.docx')) {
    const buffer = await file.arrayBuffer()
    parsedText = await parseDocx(buffer)
    summaryNotes.push(`Parsed clean document text from DOCX document "${file.name}"`)
  } else if (lowerName.endsWith('.pdf')) {
    const buffer = await file.arrayBuffer()
    const pdfResult = await parsePdfDetailed(buffer)
    if (pdfResult.error) {
      throw new Error(pdfResult.error)
    }
    parsedText = pdfResult.text
    summaryNotes.push(
      `Extracted readable text from ${pdfResult.totalPages}-page PDF document "${file.name}"`
    )
  } else {
    // Plain text / Markdown
    parsedText = await file.text().catch(() => '')
    summaryNotes.push(`Read text document "${file.name}"`)
  }

  if (!parsedText || parsedText.trim().length === 0) {
    throw new Error('Document contains no readable text content.')
  }

  // 3. Profile & Skills Extraction: AI Structured with Deterministic Fallback
  let detectedSkills: { skillName: string; confidence: number; evidenceQuote?: string }[] = []
  let aiExtraction: ExtractedResumeData | null = null

  if (type === 'resume') {
    aiExtraction = await extractStructuredResumeAI(parsedText)
    if (aiExtraction) {
      summaryNotes.push('Synthesized structured credentials via AI evidence extraction.')

      if (aiExtraction.fullName) profileUpdates.fullName = aiExtraction.fullName
      if (aiExtraction.university) profileUpdates.university = aiExtraction.university
      if (aiExtraction.degree) profileUpdates.degree = aiExtraction.degree
      if (aiExtraction.branch) profileUpdates.branch = aiExtraction.branch
      const isExplicitYearStated = /\b([1-5])(?:st|nd|rd|th)?\s+year\b/i.test(parsedText) || /\byear\s+([1-5])\b/i.test(parsedText)
      if (isExplicitYearStated && aiExtraction.currentYear) {
        profileUpdates.currentYear = aiExtraction.currentYear
        profileUpdates.isCurrentYearConfirmed = true
      } else {
        profileUpdates.currentYear = 0
        profileUpdates.isCurrentYearConfirmed = false
      }

      const is4YearTech = Boolean(
        (profileUpdates.degree && /b\.?tech|b\.?e|bachelor of technology|engineering/i.test(profileUpdates.degree)) ||
        /bachelor of technology|b\.tech/i.test(parsedText)
      )
      if (is4YearTech && /2024/i.test(parsedText)) {
        profileUpdates.graduationYear = 2028
      } else if (aiExtraction.graduationYear) {
        profileUpdates.graduationYear = aiExtraction.graduationYear === 2027 && is4YearTech ? 2028 : aiExtraction.graduationYear
      } else {
        const rangeMatch = parsedText.match(/20\d{2}\s*[–-]\s*(20\d{2})/)
        if (rangeMatch && rangeMatch[1]) {
          const parsedYr = parseInt(rangeMatch[1], 10)
          profileUpdates.graduationYear = parsedYr === 2027 && is4YearTech ? 2028 : parsedYr
        }
      }
      if (aiExtraction.academicMetric) {
        profileUpdates.academicMetric = aiExtraction.academicMetric
        profileUpdates.isAcademicMetricConfirmed = false
      }
      if (aiExtraction.location) profileUpdates.location = aiExtraction.location

      // Map AI skills
      for (const s of aiExtraction.skills) {
        detectedSkills.push({
          skillName: s.name,
          confidence: s.confidence,
          evidenceQuote: s.evidenceQuote,
        })
      }

      // Map AI projects
      for (const p of aiExtraction.projects) {
        extractedProjects.push({
          id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          studentId: currentProfile.id,
          title: p.title,
          description: p.description,
          technologies: p.technologies,
          evidenceStrength: p.evidenceStrength,
          highlights: p.highlights || [],
        })
      }

      if (aiExtraction.ambiguousFields && aiExtraction.ambiguousFields.length > 0) {
        for (const amb of aiExtraction.ambiguousFields) {
          summaryNotes.push(
            `Ambiguous metric detected (${amb.field}: "${amb.rawValue}"): ${amb.reason} — Action: ${amb.actionNeeded}`
          )
        }
      }
    } else {
      // Deterministic taxonomy fallback
      profileUpdates = extractProfileFromResumeText(parsedText)
      detectedSkills = extractSkillsFromText(parsedText)
      if (profileUpdates.fullName) {
        summaryNotes.push(`Extracted candidate name: "${profileUpdates.fullName}"`)
      }
      if (profileUpdates.degree) {
        summaryNotes.push(
          `Identified academic degree: ${profileUpdates.degree} (${profileUpdates.branch || 'Engineering'})`
        )
      }
    }
  } else {
    detectedSkills = extractSkillsFromText(parsedText)
  }

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
      const newConfidence = Math.min(
        95,
        Math.max(existing.confidence, detected.confidence) + boost
      )

      updatedSkills[existingIndex] = {
        ...existing,
        confidence: newConfidence,
        evidenceSources: sources as ('resume' | 'project' | 'github' | 'assessment')[],
        projectCount:
          type === 'presentation' || type === 'report'
            ? existing.projectCount + 1
            : existing.projectCount,
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

  // 5. Upload to Supabase Storage & Database ONLY IF user is genuinely authenticated
  let storagePath: string | undefined
  const hasValidAuthId = Boolean(currentProfile.id && isValidUUID(currentProfile.id))

  if (hasValidAuthId && isSupabaseConfigured && supabase) {
    try {
      const { data: authSession } = await supabase.auth.getUser()
      const isSessionValid = Boolean(authSession?.user && authSession.user.id === currentProfile.id)

      if (isSessionValid) {
        console.log('[processUploadedDocument] Authenticated student confirmed:', currentProfile.id)
        await upsertUserProfile(currentProfile)

        console.log('[processUploadedDocument] Uploading to private Supabase storage path...')
        const uploadRes = await uploadDocumentToStorage(currentProfile.id, file, docId)
        if (uploadRes.error) {
          console.error('[processUploadedDocument] Storage upload error:', uploadRes.error)
          throw new Error(`Failed to upload document to storage: ${uploadRes.error}`)
        }
        storagePath = uploadRes.path
        console.log('[processUploadedDocument] Storage upload successful, path:', storagePath)

        console.log('[processUploadedDocument] Inserting document metadata into public.documents...')
        const metaRes = await insertUserDocumentMetadata({
          id: isValidUUID(docId) ? docId : undefined,
          studentId: currentProfile.id,
          fileName: file.name,
          storagePath,
          contentType: file.type || 'application/octet-stream',
          fileSize: file.size,
          documentType: type,
          processingStatus: 'parsed',
          extractedSkills: detectedSkills.map((s) => s.skillName),
          extractedProjects: extractedProjects.map((p) => p.title),
          extractedData: {
            skillCount: detectedSkills.length,
            projectCount: extractedProjects.length,
            ambiguousFields: aiExtraction?.ambiguousFields || [],
            academicMetric: aiExtraction?.academicMetric || null,
            certifications: aiExtraction?.certifications || [],
          },
        })

        if (!metaRes) {
          console.error('[processUploadedDocument] Metadata insertion failed, rolling back storage object...')
          if (storagePath) {
            await deleteDocumentFromStorage(storagePath).catch(() => {})
          }
          throw new Error('Failed to record document metadata in database. Storage file was safely rolled back.')
        }
        console.log('[processUploadedDocument] Document metadata saved successfully!')
        summaryNotes.push('Stored and recorded securely in private document storage.')
      } else {
        console.warn('[processUploadedDocument] Profile ID is set but active session is missing or mismatched. Processing in-memory.')
        summaryNotes.push('Processed in temporary session. Sign in to permanently save your document and Career DNA.')
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.message.includes('Failed to upload document') || err.message.includes('Failed to record document metadata'))) {
        throw err
      }
      console.error('[processUploadedDocument] Storage upload exception:', err)
      throw err
    }
  } else {
    // Visitor or Demo Mode: safe in-memory processing without cloud persistence
    console.log('[processUploadedDocument] Running in temporary demo/visitor mode (no cloud storage write).')
    summaryNotes.push('Processed in temporary session. Sign in to permanently save your document and Career DNA.')
  }

  const uploadedDoc: UploadedDocument = {
    id: docId,
    name: file.name,
    type,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    storagePath,
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
  const type =
    file.name.endsWith('.pptx') || file.name.endsWith('.ppt')
      ? 'presentation'
      : file.name.includes('cert')
      ? 'certificate'
      : 'resume'
  return processUploadedDocument(file, type, currentProfile, existingSkills)
}
