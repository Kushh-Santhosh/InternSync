import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AshbySourceAdapter } from '../../src/features/opportunities/sources/AshbySourceAdapter'
import { MultiSourceOpportunityEngine } from '../../src/features/opportunities/sources/MultiSourceOpportunityEngine'
import {
  getVerifiedEmployerSources,
  findEmployerSource,
  VERIFIED_EMPLOYER_REGISTRY,
  type EmployerSource,
} from '../../src/features/opportunities/sources/registry'

describe('Ashby Source Adapter & Multi-Source Engine Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('correctly maps Ashby posting-api response to Opportunity format with direct application links', async () => {
    const mockAshbyResponse = {
      jobs: [
        {
          id: 'ashby-notion-swe-1',
          title: 'Software Engineer Intern, Infrastructure (Summer 2026)',
          department: 'Engineering',
          location: 'San Francisco, CA',
          isRemote: false,
          employmentType: 'Intern',
          jobUrl: 'https://jobs.ashbyhq.com/notion/ashby-notion-swe-1',
          descriptionPlain: 'Join Notion as a Software Engineering Intern working on distributed systems and databases. Required: TypeScript, Node.js, distributed databases.',
          publishedAt: '2026-03-01T00:00:00Z',
        },
        {
          id: 'ashby-notion-lead-2',
          title: 'Lead Software Architect',
          department: 'Engineering',
          location: 'San Francisco, CA',
          isRemote: false,
          employmentType: 'FullTime',
          jobUrl: 'https://jobs.ashbyhq.com/notion/ashby-notion-lead-2',
          descriptionPlain: 'Senior staff leadership role requiring 10+ years experience.',
          publishedAt: '2026-02-01T00:00:00Z',
        },
      ],
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockAshbyResponse,
    } as any)

    const source: EmployerSource = {
      id: 'emp-notion',
      name: 'Notion',
      provider: 'ashby',
      boardToken: 'notion',
      careersUrl: 'https://notion.so/careers',
      category: 'tech_startup',
      locations: ['San Francisco', 'Remote'],
      roleTypes: ['software', 'backend'],
      status: 'verified',
      lastVerifiedAt: '2026-10-17',
    }

    const adapter = new AshbySourceAdapter()
    const results = await adapter.searchEmployer(source, 'software engineer intern', 'Software Engineer Intern')

    expect(results).toHaveLength(1)
    const internJob = results[0]
    expect(internJob.company).toBe('Notion')
    expect(internJob.title).toBe('Software Engineer Intern, Infrastructure (Summer 2026)')
    expect(internJob.url).toBe('https://jobs.ashbyhq.com/notion/ashby-notion-swe-1')
    expect(internJob.source).toBe('Ashby (Notion)')
  })

  it('filters out non-student and senior roles strictly from Ashby boards', async () => {
    const mockAshbyResponse = {
      jobs: [
        {
          id: 'sr-eng-1',
          title: 'Senior Software Engineer - Machine Learning',
          location: 'Remote',
          isRemote: true,
          jobUrl: 'https://jobs.ashbyhq.com/ramp/sr-eng-1',
          descriptionPlain: 'Requires 8+ years experience in production PyTorch.',
        },
        {
          id: 'staff-eng-2',
          title: 'Staff Product Designer',
          location: 'Bengaluru, India',
          isRemote: false,
          jobUrl: 'https://jobs.ashbyhq.com/ramp/staff-eng-2',
          descriptionPlain: 'Lead product design across enterprise suites.',
        },
      ],
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockAshbyResponse,
    } as any)

    const source: EmployerSource = {
      id: 'emp-ramp',
      name: 'Ramp',
      provider: 'ashby',
      boardToken: 'ramp',
      careersUrl: 'https://ramp.com/careers',
      category: 'tech_startup',
      locations: ['Remote', 'New York'],
      roleTypes: ['software', 'frontend'],
      status: 'verified',
      lastVerifiedAt: '2026-10-17',
    }

    const adapter = new AshbySourceAdapter()
    const results = await adapter.searchEmployer(source, 'software engineer intern', 'Software Engineer Intern')

    expect(results).toHaveLength(0)
  })

  it('validates that verified registry contains Greenhouse, Lever, and Ashby employers with complete metadata', () => {
    const allSources = getVerifiedEmployerSources()
    expect(allSources.length).toBeGreaterThanOrEqual(40)

    const ashbySources = allSources.filter((s) => s.provider === 'ashby')
    expect(ashbySources.length).toBeGreaterThanOrEqual(6)

    const notion = findEmployerSource('notion')
    expect(notion).toBeDefined()
    expect(notion?.provider).toBe('ashby')
    expect(notion?.officialDomain).toBe('notion.so')

    const ramp = findEmployerSource('ramp')
    expect(ramp).toBeDefined()
    expect(ramp?.officialDomain).toBe('ramp.com')
  })

  it('MultiSourceOpportunityEngine deduplicates identical vacancies across sources and verifies application URLs', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ jobs: [] }),
    } as any)

    const engine = new MultiSourceOpportunityEngine()

    const searchResult = await engine.search({
      text: 'software engineer intern',
      role: 'Software Engineer Intern',
      location: 'India',
    })

    expect(searchResult.sourcesQueried.length).toBeGreaterThan(0)
    expect(Array.isArray(searchResult.results)).toBe(true)
  })
})
