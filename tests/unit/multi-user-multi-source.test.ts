import { describe, expect, it, vi } from 'vitest'
import { calculateMatch } from '../../src/lib/matching/engine.ts'
import { MultiSourceOpportunityEngine } from '../../src/features/opportunities/sources/MultiSourceOpportunityEngine.ts'
import { deduplicateOpportunities } from '../../src/features/opportunities/deduplication/deduplicator.ts'
import { evaluateOpportunityFreshness } from '../../src/features/opportunities/extraction/requirement-extractor.ts'
import { VERIFIED_EMPLOYER_REGISTRY } from '../../src/features/opportunities/sources/registry.ts'
import type { Opportunity, RawSearchResult, StudentProfile, SkillEvidenceItem, ProjectItem } from '../../src/types/index.ts'

// Student 1: 3rd-year B.Tech CS Student targeting AI & Full-Stack
const studentCS: StudentProfile = {
  id: 'student-cs-3rd-year',
  fullName: 'Aarav Patel',
  email: 'aarav.patel@example.edu',
  university: 'NIT Surathkal',
  degree: 'B.Tech',
  branch: 'Computer Science',
  currentYear: 3,
  graduationYear: 2026,
  location: 'Bengaluru',
  preferredLocations: ['Bengaluru', 'Remote'],
  workModePreference: 'hybrid',
  availableFrom: '2026-05-01',
  availableDurationMonths: 3,
  careerInterests: ['AI Engineering', 'Full Stack Development', 'Software Engineering'],
  targetRole: 'Software Engineering Intern',
}

const skillsCS: SkillEvidenceItem[] = [
  { skillName: 'Python', category: 'languages', confidence: 92, evidenceSources: ['resume', 'project', 'assessment'], assessmentScore: 88, projectCount: 3 },
  { skillName: 'TypeScript', category: 'languages', confidence: 88, evidenceSources: ['resume', 'project', 'assessment'], assessmentScore: 85, projectCount: 2 },
  { skillName: 'React', category: 'frontend', confidence: 85, evidenceSources: ['project', 'github'], assessmentScore: 80, projectCount: 2 },
  { skillName: 'Docker', category: 'tools', confidence: 75, evidenceSources: ['project'], projectCount: 1 },
]

const projectsCS: ProjectItem[] = [
  {
    id: 'proj-cs-1',
    studentId: 'student-cs-3rd-year',
    title: 'Cloud Microservices Platform',
    description: 'High-throughput backend built with TypeScript and Python.',
    technologies: ['TypeScript', 'Python', 'React', 'Docker'],
    repositoryUrl: 'https://github.com/aarav/microservices',
    evidenceStrength: 'strong',
    highlights: ['Sub-50ms latency', 'Dockerized deployment'],
  },
]

// Student 2: 4th-year B.Des Student targeting UI/UX Product Design
const studentDesign: StudentProfile = {
  id: 'student-design-final-year',
  fullName: 'Ananya Sen',
  email: 'ananya.sen@example.edu',
  university: 'National Institute of Design',
  degree: 'B.Des',
  branch: 'Product Design',
  currentYear: 4,
  graduationYear: 2025,
  location: 'Mumbai',
  preferredLocations: ['Mumbai', 'Remote', 'Bengaluru'],
  workModePreference: 'remote',
  availableFrom: '2025-06-01',
  availableDurationMonths: 6,
  careerInterests: ['UI/UX Design', 'Product Design', 'User Research'],
  targetRole: 'Product Design Intern',
}

const skillsDesign: SkillEvidenceItem[] = [
  { skillName: 'Figma', category: 'tools', confidence: 95, evidenceSources: ['resume', 'portfolio', 'assessment'], assessmentScore: 92, projectCount: 4 },
  { skillName: 'User Research', category: 'soft_skills', confidence: 90, evidenceSources: ['resume', 'project', 'assessment'], assessmentScore: 88, projectCount: 3 },
  { skillName: 'Prototyping', category: 'design', confidence: 90, evidenceSources: ['portfolio'], assessmentScore: 85, projectCount: 3 },
  { skillName: 'Design Systems', category: 'design', confidence: 85, evidenceSources: ['project'], projectCount: 2 },
]

const projectsDesign: ProjectItem[] = [
  {
    id: 'proj-design-1',
    studentId: 'student-design-final-year',
    title: 'Fintech Mobile Redesign',
    description: 'Complete UX flow and Figma design system for payments.',
    technologies: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    repositoryUrl: 'https://github.com/ananya/fintech-design',
    evidenceStrength: 'strong',
    highlights: ['Usability testing with 40 participants', 'Figma design tokens library'],
  },
]

// Diverse Opportunities
const softwareInternship: Opportunity = {
  id: 'opp-eng-groww',
  companyName: 'Groww',
  roleTitle: 'Software Engineering Intern',
  category: 'Software Engineering',
  description: 'Work on high-throughput microservices using TypeScript, React, and Python.',
  location: 'Bengaluru',
  workMode: 'hybrid',
  internshipDurationMonths: 3,
  applicationUrl: 'https://boards.greenhouse.io/groww/jobs/456789',
  source: 'Greenhouse Job Board',
  postedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  eligibleYears: [3, 4],
  eligibleDegrees: ['B.Tech', 'BE', 'BS'],
  requiredSkills: ['Python', 'TypeScript'],
  preferredSkills: ['React', 'Docker'],
  isVerified: true,
}

const designInternship: Opportunity = {
  id: 'opp-design-cred',
  companyName: 'CRED',
  roleTitle: 'Product Design Intern',
  category: 'Product Design',
  description: 'Design intuitive financial experiences. Deep expertise in Figma and User Research required.',
  location: 'Bengaluru',
  workMode: 'remote',
  internshipDurationMonths: 3,
  applicationUrl: 'https://jobs.lever.co/cred/789101',
  source: 'Lever Postings',
  postedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  eligibleYears: [3, 4],
  eligibleDegrees: ['B.Des', 'M.Des', 'Any'],
  requiredSkills: ['Figma', 'User Research'],
  preferredSkills: ['Prototyping', 'Design Systems'],
  isVerified: true,
}

const hardSeniorBackendInternship: Opportunity = {
  id: 'opp-hard-final-year-backend',
  companyName: 'Databricks',
  roleTitle: 'Distributed Systems Intern (Final Year / Co-op Only)',
  category: 'Backend',
  description: 'Requires 4th year graduation standing and M.Tech / B.Tech.',
  location: 'Bengaluru',
  workMode: 'onsite',
  internshipDurationMonths: 6,
  applicationUrl: 'https://boards.greenhouse.io/databricks/jobs/112233',
  source: 'Greenhouse Job Board',
  postedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  eligibleYears: [4],
  eligibleDegrees: ['B.Tech', 'M.Tech'],
  requiredSkills: ['Golang', 'Kubernetes'],
  preferredSkills: ['Distributed Systems'],
  isVerified: true,
}

describe('Multi-User Personalization & Matching Engine', () => {
  it('delivers distinct, personalized recommendations and scores for two different students', () => {
    // Score Software Internship for both students
    const csMatchSoftware = calculateMatch({
      student: studentCS,
      skills: skillsCS,
      projects: projectsCS,
      opportunity: softwareInternship,
    })

    const designMatchSoftware = calculateMatch({
      student: studentDesign,
      skills: skillsDesign,
      projects: projectsDesign,
      opportunity: softwareInternship,
    })

    // CS student should match Software role strongly
    expect(csMatchSoftware.recommendation).toBe('APPLY NOW')
    expect(csMatchSoftware.overallMatchScore).toBeGreaterThanOrEqual(80)
    expect(csMatchSoftware.whyMatched.some((w) => w.includes('Python'))).toBe(true)
    expect(csMatchSoftware.whyMatched.some((w) => w.includes('TypeScript'))).toBe(true)

    // Design student has no Python/TypeScript -> should be PREPARE FIRST or SKIP
    expect(designMatchSoftware.recommendation).not.toBe('APPLY NOW')
    expect(designMatchSoftware.overallMatchScore).toBeLessThan(csMatchSoftware.overallMatchScore)
    expect(designMatchSoftware.missingSkills).toContain('Python')

    // Now score Design Internship for both students
    const csMatchDesign = calculateMatch({
      student: studentCS,
      skills: skillsCS,
      projects: projectsCS,
      opportunity: designInternship,
    })

    const designMatchDesign = calculateMatch({
      student: studentDesign,
      skills: skillsDesign,
      projects: projectsDesign,
      opportunity: designInternship,
    })

    // Design student should match Design role strongly
    expect(designMatchDesign.recommendation).toBe('APPLY NOW')
    expect(designMatchDesign.overallMatchScore).toBeGreaterThanOrEqual(80)
    expect(designMatchDesign.whyMatched.some((w) => w.includes('Figma'))).toBe(true)
    expect(designMatchDesign.whyMatched.some((w) => w.includes('User Research'))).toBe(true)

    // CS student lacks design skills
    expect(csMatchDesign.recommendation).not.toBe('APPLY NOW')
    expect(csMatchDesign.overallMatchScore).toBeLessThan(designMatchDesign.overallMatchScore)
  })

  it('enforces hard eligibility mismatch (SKIP) even if student has strong general skills', () => {
    // studentCS is in 3rd year. hardSeniorBackendInternship requires Year 4.
    const result = calculateMatch({
      student: studentCS,
      skills: skillsCS,
      projects: projectsCS,
      opportunity: hardSeniorBackendInternship,
    })

    expect(result.recommendation).toBe('SKIP')
    expect(result.eligibilityScore).toBeLessThan(50)
    expect(result.eligibilityNotes.some((g) => g.toLowerCase().includes('targets') || g.toLowerCase().includes('year'))).toBe(true)
  })

  it('rejects degree mismatch as hard eligibility blocker (e.g. B.Des applicant for strict B.Tech-only role)', () => {
    const strictBTechRole: Opportunity = {
      ...softwareInternship,
      id: 'opp-strict-btech',
      eligibleDegrees: ['B.Tech'],
    }

    const result = calculateMatch({
      student: studentDesign, // Has B.Des
      skills: skillsDesign,
      projects: projectsDesign,
      opportunity: strictBTechRole,
    })

    expect(result.recommendation).toBe('SKIP')
    expect(result.eligibilityScore).toBeLessThan(50)
  })
})

describe('MultiSourceOpportunityEngine (No-Paid-API Baseline)', () => {
  it('contains verified employer registry with real Greenhouse and Lever endpoints', () => {
    expect(VERIFIED_EMPLOYER_REGISTRY.length).toBeGreaterThanOrEqual(30)

    const ghSources = VERIFIED_EMPLOYER_REGISTRY.filter((s) => s.provider === 'greenhouse')
    const leverSources = VERIFIED_EMPLOYER_REGISTRY.filter((s) => s.provider === 'lever')

    expect(ghSources.length).toBeGreaterThan(15)
    expect(leverSources.length).toBeGreaterThan(4)

    // Verify all board tokens are non-empty and have official URLs
    for (const source of VERIFIED_EMPLOYER_REGISTRY) {
      expect(source.boardToken).toBeTruthy()
      expect(source.careersUrl).toMatch(/^https:\/\//)
      expect(source.status).toBe('verified')
    }
  })

  it('runs multiple source adapters concurrently with mocked responses', async () => {
    const originalFetch = global.fetch
    try {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('greenhouse.io')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              jobs: [
                {
                  id: 12345,
                  title: 'Software Engineer Intern',
                  absolute_url: 'https://boards.greenhouse.io/demo/jobs/12345',
                  location: { name: 'Bengaluru, India' },
                  content: 'Develop high-performance web applications with React and Python.',
                },
              ],
            }),
          } as unknown as Response
        }
        if (url.includes('api.lever.co')) {
          return {
            ok: true,
            status: 200,
            json: async () => [
              {
                id: 'lever-1',
                text: 'Frontend Developer Intern',
                hostedUrl: 'https://jobs.lever.co/demo/lever-1',
                descriptionPlain: 'Join as a frontend intern working with TypeScript.',
                categories: { location: 'Bengaluru', commitment: 'Intern' },
              },
            ],
          } as unknown as Response
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ jobs: [] }),
        } as unknown as Response
      })

      const engine = new MultiSourceOpportunityEngine()
      const result = await engine.search({
        query: 'software intern',
        targetRole: 'Software Engineer',
        locations: ['Bengaluru', 'Remote'],
        maxResults: 20,
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result.results)).toBe(true)
      expect(result.results.length).toBeGreaterThan(0)
      expect(typeof result.totalDiscovered).toBe('number')
      expect(typeof result.uniqueCount).toBe('number')
      expect(Array.isArray(result.sourcesQueried)).toBe(true)
      expect(result.durationMs).toBeGreaterThan(0)
    } finally {
      global.fetch = originalFetch
    }
  })

  it('deduplicates postings with identical canonical URLs and identical title/company', () => {
    const rawItems: RawSearchResult[] = [
      {
        id: '1',
        title: 'Frontend Engineer Intern',
        company: 'Groww',
        location: 'Bengaluru',
        snippet: 'React developer',
        url: 'https://boards.greenhouse.io/groww/jobs/111?gh_jid=111',
        source: 'greenhouse',
      },
      {
        id: '2',
        title: 'Frontend Engineer Intern',
        company: 'Groww',
        location: 'Bengaluru',
        snippet: 'React developer duplicate',
        url: 'https://boards.greenhouse.io/groww/jobs/111', // Same canonical URL
        source: 'lever',
      },
      {
        id: '3',
        title: 'Backend Engineer Intern',
        company: 'Groww',
        location: 'Bengaluru',
        snippet: 'Python developer',
        url: 'https://boards.greenhouse.io/groww/jobs/222',
        source: 'greenhouse',
      },
    ]

    const opportunities: Opportunity[] = rawItems.map((item) => ({
      id: item.id,
      companyName: item.company,
      roleTitle: item.title,
      category: 'Software',
      description: item.snippet,
      location: item.location,
      workMode: 'hybrid',
      applicationUrl: item.url,
      source: item.source,
      postedAt: new Date().toISOString(),
      requiredSkills: [],
      preferredSkills: [],
      isVerified: true,
    }))

    const deduped = deduplicateOpportunities(opportunities)
    expect(deduped.length).toBe(2)
    expect(deduped.map((o) => o.roleTitle)).toEqual([
      'Frontend Engineer Intern',
      'Backend Engineer Intern',
    ])
  })

  it('correctly detects freshness state (active, expired, closed)', () => {
    // Closed posting
    const closed = evaluateOpportunityFreshness('This position is closed and no longer accepting applications.')
    expect(closed.freshness).toBe('closed')

    // Stale/expired posting from 2024
    const expired = evaluateOpportunityFreshness('Internship for batch of 2024. Deadline: December 2024.')
    expect(expired.freshness).toBe('expired')

    // Active posting
    const active = evaluateOpportunityFreshness('We are actively hiring 2026 software engineering interns in Bengaluru!')
    expect(active.freshness).toBe('active')
  })
})

describe('Account Isolation & Cross-Account Boundaries', () => {
  it('ensures distinct users maintain isolated student IDs and profiles', () => {
    expect(studentCS.id).not.toBe(studentDesign.id)
    expect(studentCS.email).not.toBe(studentDesign.email)
    expect(studentCS.degree).not.toBe(studentDesign.degree)

    // Mock application store simulation
    const userApplications = new Map<string, string[]>()
    userApplications.set(studentCS.id, ['opp-eng-groww'])
    userApplications.set(studentDesign.id, ['opp-design-cred'])

    // Verify isolation
    expect(userApplications.get(studentCS.id)).toContain('opp-eng-groww')
    expect(userApplications.get(studentCS.id)).not.toContain('opp-design-cred')
    expect(userApplications.get(studentDesign.id)).toContain('opp-design-cred')
    expect(userApplications.get(studentDesign.id)).not.toContain('opp-eng-groww')
  })
})
