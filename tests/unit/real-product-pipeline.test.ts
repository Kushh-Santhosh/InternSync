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
    // Repeated 3 times -> higher confidence
    expect(pytorch!.confidence).toBeGreaterThanOrEqual(78)
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
})
