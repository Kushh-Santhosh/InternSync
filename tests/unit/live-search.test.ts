import { describe, expect, it } from 'vitest'
import { generateSearchQueries } from '@/features/opportunities/search/query-generator'
import { verifyOpportunityUrl } from '@/features/opportunities/url-verifier/url-verifier'
import {
  extractRequirementsDeterministically,
  buildOpportunityFromExtraction,
} from '@/features/opportunities/extraction/requirement-extractor'
import { deduplicateOpportunities } from '@/features/opportunities/deduplication/deduplicator'
import { calculateMatch } from '@/lib/matching/engine'
import type { Opportunity, RawSearchResult, StudentProfile } from '@/types'

const testCandidate: StudentProfile = {
  id: 'student-test-1',
  fullName: 'Arjun Verma',
  email: 'arjun@example.edu',
  university: 'IIT Madras',
  degree: 'B.Tech',
  branch: 'Computer Science',
  currentYear: 3,
  graduationYear: 2026,
  location: 'Bengaluru',
  preferredLocations: ['Bengaluru', 'Remote'],
  workModePreference: 'hybrid',
  availableFrom: '2026-05-01',
  availableDurationMonths: 3,
  careerInterests: ['AI Engineering', 'Machine Learning'],
  targetRole: 'AI Engineering Intern',
}

describe('Live Search Query Generation', () => {
  it('generates multi-vector search queries from Career DNA', () => {
    const queries = generateSearchQueries(testCandidate, ['Python', 'React', 'Machine Learning'], {
      maxQueries: 6,
    })

    expect(queries.length).toBeGreaterThanOrEqual(3)
    expect(queries.length).toBeLessThanOrEqual(6)

    // Checks that queries include role, location, or skills
    const allQueryTexts = queries.map((q) => q.text.toLowerCase()).join(' ')
    expect(allQueryTexts).toContain('ai')
    expect(allQueryTexts).toContain('bengaluru')
  })

  it('avoids duplicate queries and caps fan-out', () => {
    const queries = generateSearchQueries(testCandidate, ['Python'], { maxQueries: 4 })
    const texts = queries.map((q) => q.text.toLowerCase())
    const unique = new Set(texts)
    expect(texts.length).toBe(unique.size)
    expect(queries.length).toBeLessThanOrEqual(4)
  })
})

describe('Opportunity URL Verification', () => {
  it('identifies direct ATS domains as verified application URLs', async () => {
    const result = await verifyOpportunityUrl('https://boards.greenhouse.io/demo/jobs/12345')
    expect(result.status).toBe('VERIFIED')
    expect(result.directApplyAvailable).toBe(true)
    expect(result.buttonLabel).toBe('Apply directly')
    expect(result.isOfficialCareersPage).toBe(true)
  })

  it('rejects invalid or unsafe protocols as broken', async () => {
    const result = await verifyOpportunityUrl('javascript:alert(1)')
    expect(result.status).toBe('BROKEN')
    expect(result.directApplyAvailable).toBe(false)
    expect(result.buttonLabel).toBe('Expired')
  })

  it('marks general public domains as unverified but valid listing links', async () => {
    const result = await verifyOpportunityUrl('https://example-jobs-board.com/post/999')
    expect(result.status).toBe('VERIFIED')
    expect(result.isHttps).toBe(true)
  })
})

describe('Opportunity Requirement Extraction', () => {
  it('extracts technical requirements, work mode, and eligibility from raw search snippets', () => {
    const raw: RawSearchResult = {
      title: 'Machine Learning Engineering Intern @ NeuroScale',
      url: 'https://careers.neuroscale.ai/jobs/ml-intern',
      domain: 'careers.neuroscale.ai',
      snippet:
        'Looking for 3rd year or final year B.Tech students in Bengaluru or Remote. Requires Python, PyTorch, and SQL experience. Stipend: ₹45,000/month.',
      source: 'Company Careers',
      discoveredAt: new Date().toISOString(),
    }

    const data = extractRequirementsDeterministically(raw)
    expect(data.company).toBe('NeuroScale')
    expect(data.work_mode).toBe('remote')
    expect(data.required_skills).toContain('Python')
    expect(data.required_skills).toContain('PyTorch')
    expect(data.stipend_amount).toBe(45000)

    const opp = buildOpportunityFromExtraction('opp-test-1', raw, data)
    expect(opp.companyName).toBe('NeuroScale')
    expect(opp.requiredSkills).toContain('Python')
    expect(opp.requiredSkills).toContain('PyTorch')
  })
})

describe('Opportunity Deduplication', () => {
  it('merges identical opportunities across multiple providers and retains direct ATS link', () => {
    const oppA: Opportunity = {
      id: 'opp-1',
      companyName: 'Stripe',
      companyLogo: '',
      roleTitle: 'Software Engineering Intern',
      category: 'Software Engineering',
      description: 'Stripe software internship posted on aggregator.',
      location: 'Bengaluru',
      workMode: 'hybrid',
      internshipDurationMonths: 3,
      applicationUrl: 'https://aggregator-jobs.com/stripe-intern',
      source: 'Adzuna',
      postedAt: '2026-03-01',
      deadline: '2026-04-01',
      eligibleYears: [3],
      eligibleDegrees: ['B.Tech'],
      requiredSkills: ['Python', 'SQL'],
      preferredSkills: ['Go'],
    }

    const oppB: Opportunity = {
      ...oppA,
      id: 'opp-2',
      applicationUrl: 'https://careers.stripe.com/jobs/swe-intern',
      source: 'Company Careers',
      description: 'Official Stripe internship posting.',
      requiredSkills: ['Python', 'SQL', 'TypeScript'],
    }

    const deduped = deduplicateOpportunities([oppA, oppB])
    expect(deduped.length).toBe(1)
    expect(deduped[0].applicationUrl).toBe('https://careers.stripe.com/jobs/swe-intern')
    expect(deduped[0].duplicateSources).toContain('Adzuna')
    expect(deduped[0].duplicateSources).toContain('Company Careers')
    expect(deduped[0].requiredSkills).toContain('TypeScript')
  })
})

describe('Live Discovered Opportunity Deterministic Matching', () => {
  it('evaluates match score and produces actionable recommendation for live opportunity', () => {
    const liveOpp: Opportunity = {
      id: 'opp-live-test',
      companyName: 'CortexAI Labs',
      companyLogo: '',
      roleTitle: 'AI Research Intern',
      category: 'AI / ML',
      description: 'Hands on AI research internship',
      location: 'Bengaluru',
      workMode: 'hybrid',
      internshipDurationMonths: 3,
      applicationUrl: 'https://boards.greenhouse.io/cortexai/jobs/101',
      source: 'Greenhouse',
      postedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 864000000).toISOString().split('T')[0],
      eligibleYears: [3, 4],
      eligibleDegrees: ['B.Tech'],
      requiredSkills: ['Python', 'Machine Learning'],
      preferredSkills: ['PyTorch'],
    }

    const match = calculateMatch({
      student: testCandidate,
      skills: [
        {
          skillName: 'Python',
          category: 'languages',
          confidence: 90,
          evidenceSources: ['resume', 'project'],
          projectCount: 2,
          githubStrength: 'strong',
        },
        {
          skillName: 'Machine Learning',
          category: 'ai_ml',
          confidence: 80,
          evidenceSources: ['resume'],
          projectCount: 1,
          githubStrength: 'moderate',
        },
      ],
      projects: [
        {
          id: 'proj-test-1',
          studentId: testCandidate.id,
          title: 'Neural Inference Engine',
          description: 'High throughput neural inference engine built with Python and Machine Learning.',
          technologies: ['Python', 'Machine Learning'],
          evidenceStrength: 'strong',
          highlights: ['Optimized tensor processing'],
        },
      ],
      opportunity: liveOpp,
    })

    expect(match.overallMatchScore).toBeGreaterThanOrEqual(80)
    expect(match.recommendation).toBe('APPLY NOW')
    expect(match.whyMatched.length).toBeGreaterThan(0)
  })
})
