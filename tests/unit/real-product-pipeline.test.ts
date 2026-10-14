import { describe, it, expect } from 'vitest'
import {
  extractSkillsFromText,
  extractProfileFromResumeText,
} from '@/lib/documents/document-intelligence'
import { normalizeSkill, areSkillsEqual } from '@/lib/matching/taxonomy'
import { calculateMatch } from '@/lib/matching/engine'
import { N8nOpportunityProvider } from '@/features/opportunities/providers/N8nOpportunityProvider'
import { OpenRouterModelRouter } from '@/features/ai/model-router'
import type { StudentProfile, Opportunity } from '@/types'

describe('Real Product Pipeline & Verification Tests', () => {
  it('extracts real profile details from uploaded resume text without hardcoding', () => {
    const resumeSample = `
Alex Rivera
alex.rivera@stanford.edu
Bachelor of Technology in Computer Science & Engineering
Expected Graduation: 2026
Location: Bengaluru

Summary:
Full stack developer with hands-on experience building AI assistants using Python, React, and PostgreSQL.
    `
    const profile = extractProfileFromResumeText(resumeSample)
    expect(profile.fullName).toBe('Alex Rivera')
    expect(profile.email).toBe('alex.rivera@stanford.edu')
    expect(profile.degree).toBe('B.Tech')
    expect(profile.branch).toBe('Computer Science & Engineering')
    expect(profile.location).toBe('Bengaluru')
    expect(profile.currentYear).toBe(4)
  })

  it('normalizes skills accurately against the 150+ technology taxonomy', () => {
    expect(normalizeSkill('react.js')).toBe('React')
    expect(normalizeSkill('reactjs')).toBe('React')
    expect(normalizeSkill('TypeScript')).toBe('TypeScript')
    expect(normalizeSkill('pytorch')).toBe('PyTorch')
    expect(normalizeSkill('postgres')).toBe('SQL')

    expect(areSkillsEqual('React.js', 'React')).toBe(true)
    expect(areSkillsEqual('Postgres', 'SQL')).toBe(true)
    expect(areSkillsEqual('PyTorch', 'TensorFlow')).toBe(false)
  })

  it('extracts skill evidence with frequency-based confidence scores', () => {
    const resumeText = `
Developed distributed systems using Python and FastAPI.
Trained PyTorch deep neural networks and PyTorch vision models with PyTorch GPU acceleration.
Utilized PostgreSQL for relational storage and Redis for embedding caching.
    `
    const extracted = extractSkillsFromText(resumeText)
    const pytorch = extracted.find((s) => s.skillName.toLowerCase() === 'pytorch')
    const python = extracted.find((s) => s.skillName.toLowerCase() === 'python')

    expect(pytorch).toBeDefined()
    expect(python).toBeDefined()
    // Repeated 3 times -> higher measured confidence capped at realistic 72%
    expect(pytorch!.confidence).toBeGreaterThanOrEqual(68)
  })

  it('calculates deterministic 8-factor fit and classifies APPLY NOW vs PREPARE FIRST', () => {
    const candidateProfile: StudentProfile = {
      id: 'student-test-1',
      fullName: 'Maya Lin',
      email: 'maya@mit.edu',
      currentYear: 3,
      degree: 'B.Tech',
      branch: 'Computer Science',
      university: 'MIT',
      location: 'Bengaluru',
      targetRoles: ['AI Engineer Intern'],
      careerInterests: ['AI/ML', 'Full Stack'],
      preferences: {
        locations: ['Bengaluru', 'Remote'],
        remotePreference: 'HYBRID',
        minStipend: 20000,
        opportunityTypes: ['INTERNSHIP'],
      },
      lastUpdated: new Date().toISOString(),
    }

    const highFitOpp: Opportunity = {
      id: 'opp-ai-test-1',
      companyName: 'NeuralStack Labs',
      roleTitle: 'AI Engineering Intern',
      category: 'AI/ML',
      location: 'Bengaluru',
      workMode: 'hybrid',
      description: 'Build LLM and retrieval systems with Python and React.',
      internshipDurationMonths: 3,
      stipendAmount: 35000,
      stipendCurrency: 'INR',
      stipendPeriod: 'month',
      applicationUrl: 'https://neuralstack.ai/careers/intern-1',
      source: 'Greenhouse',
      postedAt: new Date().toISOString(),
      eligibleYears: [3, 4],
      eligibleDegrees: ['B.Tech', 'BE'],
      requiredSkills: ['Python', 'React'],
      preferredSkills: ['TypeScript'],
    }

    const candidateSkills = [
      {
        skillName: 'Python',
        category: 'languages' as const,
        confidence: 90,
        evidenceSources: ['resume' as const, 'project' as const],
        projectCount: 2,
        githubStrength: 'strong' as const,
        lastValidatedAt: new Date().toISOString(),
      },
      {
        skillName: 'React',
        category: 'frontend' as const,
        confidence: 85,
        evidenceSources: ['resume' as const],
        projectCount: 1,
        githubStrength: 'moderate' as const,
        lastValidatedAt: new Date().toISOString(),
      },
    ]

    const candidateProjects = [
      {
        id: 'proj-1',
        studentId: candidateProfile.id,
        title: 'Neural Rag Assistant',
        description: 'Built vector search app in Python and React.',
        technologies: ['Python', 'React'],
        evidenceStrength: 'strong' as const,
        highlights: ['Deployed app'],
      },
    ]

    const matchResult = calculateMatch({
      student: candidateProfile,
      skills: candidateSkills,
      projects: candidateProjects,
      opportunity: highFitOpp,
    })

    expect(matchResult.overallMatchScore).toBeGreaterThanOrEqual(70)
    expect(['APPLY NOW', 'PREPARE FIRST']).toContain(matchResult.recommendation)
    expect(matchResult.whyMatched.length).toBeGreaterThan(0)
  })

  it('ensures N8nOpportunityProvider operates in graceful standby when unconfigured', async () => {
    const unconfiguredN8n = new N8nOpportunityProvider()
    expect(unconfiguredN8n.isConfigured()).toBe(false)

    // Should return empty array without throwing
    const results = await unconfiguredN8n.search({ text: 'AI intern', skills: ['Python'] })
    expect(results).toEqual([])

    const health = await unconfiguredN8n.healthCheck()
    expect(health.status).toBe('NOT_CONFIGURED')
    expect(health.message).toContain('standby')
  })

  it('verifies model router fallback categorization', () => {
    const router = new OpenRouterModelRouter('test-key', {
      primaryModel: 'google/gemini-2.0-flash-001',
      fallbackModels: ['anthropic/claude-3.5-haiku', 'meta-llama/llama-3.3-70b-instruct'],
    })

    expect(router.isRetriableError(429)).toBe(true)
    expect(router.isRetriableError(503)).toBe(true)
    expect(router.isRetriableError(401)).toBe(false)
  })

  it('verifies project evidence genuinely increases the matching score', () => {
    const candidateProfile: StudentProfile = {
      id: 'student-test-2',
      fullName: 'Alex Chen',
      email: 'alex@berkeley.edu',
      currentYear: 3,
      degree: 'B.Tech',
      branch: 'Computer Science',
      university: 'UC Berkeley',
      location: 'Bengaluru',
      targetRoles: ['AI Engineer Intern'],
      careerInterests: ['AI/ML'],
      preferences: {
        locations: ['Bengaluru'],
        remotePreference: 'HYBRID',
        minStipend: 0,
        opportunityTypes: ['INTERNSHIP'],
      },
      lastUpdated: new Date().toISOString(),
    }

    const testOpp: Opportunity = {
      id: 'opp-project-weight-test',
      companyName: 'ScaleTech',
      roleTitle: 'Machine Learning Intern',
      category: 'AI/ML',
      location: 'Bengaluru',
      workMode: 'hybrid',
      description: 'Hands-on Python and PyTorch development for embeddings.',
      internshipDurationMonths: 3,
      stipendAmount: 30000,
      stipendCurrency: 'INR',
      stipendPeriod: 'month',
      applicationUrl: 'https://scaletech.io/apply',
      source: 'Direct Portal',
      postedAt: new Date().toISOString(),
      eligibleYears: [3],
      eligibleDegrees: ['B.Tech'],
      requiredSkills: ['Python', 'PyTorch'],
      preferredSkills: [],
    }

    const skills = [
      {
        skillName: 'Python',
        category: 'languages' as const,
        confidence: 85,
        evidenceSources: ['resume' as const],
        projectCount: 0,
        githubStrength: 'none' as const,
      },
      {
        skillName: 'PyTorch',
        category: 'ai_ml' as const,
        confidence: 80,
        evidenceSources: ['resume' as const],
        projectCount: 0,
        githubStrength: 'none' as const,
      },
    ]

    const withoutProjects = calculateMatch({
      student: candidateProfile,
      skills,
      projects: [],
      opportunity: testOpp,
    })

    const withProjects = calculateMatch({
      student: candidateProfile,
      skills: skills.map((s) => ({ ...s, projectCount: 1 })),
      projects: [
        {
          id: 'proj-ml-1',
          studentId: candidateProfile.id,
          title: 'PyTorch Embeddings Pipeline',
          description: 'Production vector search indexing in Python and PyTorch.',
          technologies: ['Python', 'PyTorch'],
          evidenceStrength: 'strong' as const,
          highlights: ['Optimized inference latency'],
        },
      ],
      opportunity: testOpp,
    })

    // Project evidence factor is 15% - score with project evidence MUST be strictly greater
    expect(withProjects.overallMatchScore).toBeGreaterThan(withoutProjects.overallMatchScore)
    expect(withProjects.projectScore).toBeGreaterThan(withoutProjects.projectScore)
  })

  it('enforces hard eligibility mismatches as SKIP regardless of strong skill alignment', () => {
    const candidateProfile: StudentProfile = {
      id: 'student-2nd-year',
      fullName: 'Tara Rao',
      email: 'tara@iitb.ac.in',
      currentYear: 2, // 2nd year student
      degree: 'B.Tech',
      branch: 'Computer Science',
      university: 'IIT Bombay',
      location: 'Bengaluru',
      targetRoles: ['Software Engineer Intern'],
      careerInterests: ['Full Stack'],
      preferences: {
        locations: ['Bengaluru'],
        remotePreference: 'HYBRID',
        minStipend: 0,
        opportunityTypes: ['INTERNSHIP'],
      },
      lastUpdated: new Date().toISOString(),
    }

    const graduatingOnlyOpp: Opportunity = {
      id: 'opp-final-year-only',
      companyName: 'FinCorp Tech',
      roleTitle: 'Graduate SWE Intern',
      category: 'Software Engineering',
      location: 'Bengaluru',
      workMode: 'onsite',
      description: 'Pre-placement internship strictly for final year (4th year) graduating students.',
      internshipDurationMonths: 6,
      stipendAmount: 50000,
      stipendCurrency: 'INR',
      stipendPeriod: 'month',
      applicationUrl: 'https://fincorp.com/careers/grad',
      source: 'Direct Portal',
      postedAt: new Date().toISOString(),
      eligibleYears: [4], // Hard gate: 4th year only
      eligibleDegrees: ['B.Tech'],
      requiredSkills: ['Python', 'SQL'],
      preferredSkills: [],
    }

    const perfectSkills = [
      {
        skillName: 'Python',
        category: 'languages' as const,
        confidence: 95,
        evidenceSources: ['resume' as const, 'project' as const],
        projectCount: 2,
        githubStrength: 'strong' as const,
      },
      {
        skillName: 'SQL',
        category: 'data' as const,
        confidence: 90,
        evidenceSources: ['resume' as const],
        projectCount: 1,
        githubStrength: 'moderate' as const,
      },
    ]

    const match = calculateMatch({
      student: candidateProfile,
      skills: perfectSkills,
      projects: [],
      opportunity: graduatingOnlyOpp,
    })

    // Despite 95% Python and 90% SQL, eligibility fails and recommendation MUST be SKIP
    expect(match.recommendation).toBe('SKIP')
    expect(match.eligibilityScore).toBeLessThan(50)
    expect(match.eligibilityNotes.some((n) => n.toLowerCase().includes('year'))).toBe(true)
  })

  it('rejects unsafe executable extensions during document analysis', async () => {
    const { analyzeDocumentFile } = await import('@/lib/documents/document-intelligence')
    const badFile = new File(['echo malicious'], 'exploit.sh', { type: 'application/x-sh' })
    const mockProfile: any = { fullName: 'Test Student' }

    await expect(analyzeDocumentFile(badFile, mockProfile)).rejects.toThrow(/prohibited/i)
  })

  it('extracts readable text from PDF literal strings and streams', async () => {
    const { parsePdfText } = await import('@/lib/documents/pdf-parser')
    // Minimal mock PDF byte buffer with BT (Text) Tj ET operators
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Length 40 >>
stream
BT
/F1 12 Tf
(Antigravity AI Engineer Resume) Tj
ET
endstream
endobj
%%EOF`
    const encoder = new TextEncoder()
    const buffer = encoder.encode(pdfContent).buffer
    const extracted = await parsePdfText(buffer)

    expect(extracted).toContain('Antigravity AI Engineer Resume')
  })
})
