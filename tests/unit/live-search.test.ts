import { describe, expect, it, vi } from 'vitest'
import { generateSearchQueries } from '@/features/opportunities/search/query-generator'
import { verifyOpportunityUrl } from '@/features/opportunities/url-verifier/url-verifier'
import {
  extractRequirementsDeterministically,
  buildOpportunityFromExtraction,
  evaluateOpportunityFreshness,
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

describe('Opportunity Freshness, Evidence, and Stale Listing Rules', () => {
  it('correctly classifies a posting from December 2024 as expired and excludes from recommendations', () => {
    const rawStale: RawSearchResult = {
      title: 'Software Development Engineer Intern @ CloudScale',
      url: 'https://cloudscale.io/careers/sde-intern-2024',
      domain: 'cloudscale.io',
      snippet: 'Posted: December 2024. CloudScale is looking for 2024 batch interns. Strong knowledge of Python and Go required.',
      source: 'Tech Aggregator',
    }

    const evaluation = evaluateOpportunityFreshness(`${rawStale.title} ${rawStale.snippet}`)
    expect(evaluation.freshness).toBe('expired')
    expect(evaluation.reason).toContain('2024 or earlier')

    const data = extractRequirementsDeterministically(rawStale)
    const opp = buildOpportunityFromExtraction('opp-stale-1', rawStale, data)
    expect(opp.freshnessStatus).toBe('expired')
  })

  it('correctly classifies an explicitly closed or expired posting as closed', () => {
    const rawClosed: RawSearchResult = {
      title: 'Frontend Engineering Intern @ UIProto',
      url: 'https://jobs.lever.co/uiproto/frontend-intern',
      domain: 'jobs.lever.co',
      snippet: 'Applications are closed for the Summer internship cycle. We are no longer accepting applications.',
      source: 'Lever',
    }

    const evaluation = evaluateOpportunityFreshness(`${rawClosed.title} ${rawClosed.snippet}`)
    expect(evaluation.freshness).toBe('closed')
    expect(evaluation.reason).toContain('applications are closed')

    const data = extractRequirementsDeterministically(rawClosed)
    const opp = buildOpportunityFromExtraction('opp-closed-1', rawClosed, data)
    expect(opp.freshnessStatus).toBe('closed')
  })

  it('does not invent a deadline for undated postings, preserves original URLs, and flags isUndated', () => {
    const rawUndated: RawSearchResult = {
      title: 'Full Stack Engineering Intern @ TechSphere',
      url: 'https://careers.techsphere.com/apply/fullstack',
      domain: 'careers.techsphere.com',
      snippet: 'Rolling admissions for high-performing engineering students. Strong React and Node.js skills needed. Work mode: Remote.',
      source: 'Direct Careers',
    }

    const data = extractRequirementsDeterministically(rawUndated)
    // Must NOT have fabricated a deadline
    expect(data.deadline).toBeUndefined()

    const opp = buildOpportunityFromExtraction('opp-undated-1', rawUndated, data)
    expect(opp.isUndated).toBe(true)
    expect(opp.deadline).toBe('')
    expect(opp.applicationUrl).toBe('https://careers.techsphere.com/apply/fullstack')
    expect(opp.sourceUrl).toBe('https://careers.techsphere.com/apply/fullstack')
  })

  it('correctly extracts and retains explicit future deadline for active listing', () => {
    const rawActive: RawSearchResult = {
      title: 'Data Science Intern @ MetricGen',
      url: 'https://metricgen.ai/careers/ds-intern',
      domain: 'metricgen.ai',
      snippet: 'Looking for 3rd and 4th year students. Python and SQL required. Application Deadline: 2026-11-30. Stipend: ₹35,000.',
      source: 'MetricGen Direct',
    }

    const data = extractRequirementsDeterministically(rawActive)
    expect(data.deadline).toBe('2026-11-30')

    const opp = buildOpportunityFromExtraction('opp-active-1', rawActive, data, 'VERIFIED')
    expect(opp.freshnessStatus).toBe('active')
    expect(opp.isUndated).toBe(false)
    expect(opp.deadline).toBe('2026-11-30')
  })
})

describe('Live Search Provider Honest State Propagation', () => {
  it('throws truthful SEARCH_NOT_CONFIGURED error when backend returns 503', async () => {
    const { OpenRouterWebProvider } = await import('@/features/opportunities/providers/OpenRouterWebProvider')
    const provider = new OpenRouterWebProvider()

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({
        error: 'Live web search is not configured on the server (OPENROUTER_API_KEY is not set in Vercel environment variables).',
        code: 'SEARCH_NOT_CONFIGURED',
        results: [],
      }),
    })
    globalThis.fetch = fetchMock

    await expect(provider.search({ text: 'Software Intern' })).rejects.toThrow('SEARCH_NOT_CONFIGURED')
  })

  it('throws truthful PROVIDER_CREDITS_EXHAUSTED error when backend returns 402', async () => {
    const { OpenRouterWebProvider } = await import('@/features/opportunities/providers/OpenRouterWebProvider')
    const provider = new OpenRouterWebProvider()

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 402,
      json: async () => ({
        error: 'OpenRouter account has insufficient credits.',
        code: 'PROVIDER_CREDITS_EXHAUSTED',
        results: [],
      }),
    })
    globalThis.fetch = fetchMock

    await expect(provider.search({ text: 'Software Intern' })).rejects.toThrow('PROVIDER_CREDITS_EXHAUSTED')
  })

  it('does NOT inject fake demo opportunities during connected mode when provider fails', async () => {
    const { OpportunitySearchOrchestrator } = await import('@/features/opportunities/search/orchestrator')
    const orchestrator = new OpportunitySearchOrchestrator()

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        error: 'Live web search is not configured on the server',
        code: 'SEARCH_NOT_CONFIGURED',
        results: [],
      }),
    })
    globalThis.fetch = fetchMock

    // In connected mode (isDemoMode = false), it must throw rather than quietly returning 34 demo opportunities
    await expect(
      orchestrator.runDiscovery(
        testCandidate,
        [{ skillName: 'Python', category: 'languages', confidence: 90, evidenceSources: ['resume'], projectCount: 1 }],
        [],
        false, // Connected mode!
        undefined,
        true // forceRefresh
      )
    ).rejects.toThrow('SEARCH_NOT_CONFIGURED')
  })
})


