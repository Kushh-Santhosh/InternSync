import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateOpportunityId,
  generateApplicationId,
  isValidUUID,
  normalizeCanonicalUrl,
} from '@/lib/utils/uuid'
import {
  upsertUserApplication,
  fetchUserApplications,
} from '@/lib/supabase/database'
import type { ApplicationItem, Opportunity } from '@/types'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => {
  return {
    isSupabaseConfigured: true,
    supabase: {
      from: vi.fn(),
      storage: {
        from: vi.fn(),
      },
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    },
  }
})

import { supabase } from '@/lib/supabase/client'

describe('Opportunity Identity and Persistence Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates deterministic, collision-resistant UUIDv5 identities', () => {
    const url1 = 'https://careers.google.com/jobs/results/12345?utm_source=linkedin&ref=board'
    const url2 = 'https://careers.google.com/jobs/results/12345'
    
    // Normalized URLs produce identical deterministic IDs regardless of tracking params
    const id1 = generateOpportunityId(url1, 'Google', 'Software Engineering Intern')
    const id2 = generateOpportunityId(url2, 'Google', 'Software Engineering Intern')

    expect(isValidUUID(id1)).toBe(true)
    expect(isValidUUID(id2)).toBe(true)
    expect(id1).toBe(id2)

    // Distinct URLs produce distinct collision-resistant UUIDs
    const id3 = generateOpportunityId('https://careers.microsoft.com/jobs/99999', 'Microsoft', 'Software Intern')
    expect(id3).not.toBe(id1)
  })

  it('normalizes canonical URLs by stripping tracking queries and host prefixes', () => {
    const raw = 'https://WWW.Example.COM/internships/swe-2025/?utm_source=test&utm_campaign=summer&fbclid=xyz'
    const normalized = normalizeCanonicalUrl(raw)
    expect(normalized).toBe('https://example.com/internships/swe-2025')
  })

  it('persists the opportunity before persisting an application that references it', async () => {
    const mockOpp: Opportunity = {
      id: generateOpportunityId('https://stripe.com/jobs/swe-intern', 'Stripe', 'Software Engineering Intern'),
      companyName: 'Stripe',
      companyLogo: 'https://stripe.com/logo.png',
      roleTitle: 'Software Engineering Intern',
      category: 'Backend',
      description: 'Join our payments infrastructure team.',
      location: 'Bengaluru / Remote',
      workMode: 'remote',
      internshipDurationMonths: 6,
      stipendAmount: 90000,
      applicationUrl: 'https://stripe.com/jobs/swe-intern',
      source: 'Stripe Careers',
      deadline: '2026-06-30T00:00:00Z',
      eligibleYears: [3, 4],
      eligibleDegrees: ['B.Tech', 'BE'],
      requiredSkills: ['Python', 'SQL', 'FastAPI'],
      preferredSkills: ['Distributed Systems'],
      postedAt: '2026-03-01T00:00:00Z',
    }

    const mockApp: ApplicationItem = {
      id: generateApplicationId('student-uuid-1', mockOpp.id),
      studentId: 'student-uuid-1',
      opportunityId: mockOpp.id,
      opportunity: mockOpp,
      matchScore: 88,
      recommendation: 'APPLY NOW',
      status: 'saved',
      notes: 'Applied through official portal.',
      updatedAt: new Date().toISOString(),
    }

    const calls: string[] = []

    // Mock supabase.from implementation
    const fromMock = vi.fn().mockImplementation((table: string) => {
      calls.push(table)
      return {
        upsert: vi.fn().mockImplementation((payload: any) => {
          // Verify payload uses compatible UUID
          expect(isValidUUID(payload.id || payload.opportunity_id)).toBe(true)
          return Promise.resolve({ data: payload, error: null })
        }),
      }
    })

    ;(supabase as any).from = fromMock

    const success = await upsertUserApplication(mockApp)
    expect(success).toBe(true)

    // Verify opportunity table was touched BEFORE applications table
    expect(calls[0]).toBe('opportunities')
    expect(calls[1]).toBe('applications')
  })

  it('restores original title, company, URL, match score, and actual status from the database', async () => {
    const studentId = 'student-uuid-10'
    const oppId = generateOpportunityId('https://databricks.com/jobs/1', 'Databricks', 'Data Engineering Intern')

    const dbResponse = [
      {
        id: 'app-uuid-99',
        student_id: studentId,
        opportunity_id: oppId,
        status: 'interview',
        notes: 'Technical round scheduled for next Monday.',
        match_score: 92,
        recommendation: 'APPLY NOW',
        applied_at: '2026-03-10T10:00:00Z',
        updated_at: '2026-03-15T10:00:00Z',
        opportunities: {
          id: oppId,
          company_name: 'Databricks',
          company_logo: 'https://databricks.com/logo.png',
          role_title: 'Data Engineering Intern',
          category: 'Data',
          description: 'Apache Spark and Lakehouse engineering',
          location: 'Bengaluru',
          work_mode: 'hybrid',
          internship_duration_months: 6,
          stipend_amount: 110000,
          stipend_currency: 'INR',
          stipend_period: 'month',
          application_url: 'https://databricks.com/jobs/1',
          source: 'Databricks Campus',
          deadline: '2026-05-01T00:00:00Z',
          eligible_years: [3, 4],
          eligible_degrees: ['B.Tech'],
          required_skills: ['Python', 'SQL', 'Apache Spark'],
          preferred_skills: ['Scala'],
          created_at: '2026-02-15T00:00:00Z',
        },
      },
    ]

    ;(supabase as any).from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: dbResponse, error: null }),
        }),
      }),
    })

    const applications = await fetchUserApplications(studentId)
    expect(applications).toHaveLength(1)
    const app = applications[0]

    expect(app.opportunity.companyName).toBe('Databricks')
    expect(app.opportunity.roleTitle).toBe('Data Engineering Intern')
    expect(app.opportunity.applicationUrl).toBe('https://databricks.com/jobs/1')
    expect(app.status).toBe('interview')
    expect(app.matchScore).toBe(92)
    expect(app.recommendation).toBe('APPLY NOW')
    expect(app.notes).toBe('Technical round scheduled for next Monday.')
  })

  it('returns an honest unavailable-record state without fabricating company or score when listing is missing', async () => {
    const studentId = 'student-uuid-11'
    const missingOppId = '00000000-0000-0000-0000-000000000099'

    // Opportunity row is null (deleted or removed from DB)
    const dbResponse = [
      {
        id: 'app-uuid-missing-1',
        student_id: studentId,
        opportunity_id: missingOppId,
        status: 'saved',
        notes: 'Saved role before it expired.',
        match_score: null,
        recommendation: null,
        opportunities: null, // Foreign opportunity record missing
      },
    ]

    ;(supabase as any).from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: dbResponse, error: null }),
        }),
      }),
    })

    const applications = await fetchUserApplications(studentId)
    expect(applications).toHaveLength(1)
    const app = applications[0]

    // Must NOT substitute a fake company, default score of 80, or APPLY NOW recommendation
    expect(app.opportunity.companyName).toBe('Unavailable Listing')
    expect(app.opportunity.roleTitle).toBe('Opportunity record unavailable')
    expect(app.matchScore).toBe(0)
    expect(app.recommendation).toBe('SKIP')
    expect(app.matchScore).not.toBe(80)
    expect(app.recommendation).not.toBe('APPLY NOW')
  })

  it('fails truthfully if opportunity persistence fails', async () => {
    // Simulate database write failure on opportunities table
    ;(supabase as any).from = vi.fn().mockImplementation((table: string) => {
      if (table === 'opportunities') {
        return {
          upsert: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database connection timeout' } }),
        }
      }
      return {
        upsert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      }
    })

    const mockOpp: Opportunity = {
      id: generateOpportunityId('https://example.com/test', 'CompanyX', 'Intern'),
      companyName: 'CompanyX',
      companyLogo: '',
      roleTitle: 'Intern',
      category: 'Engineering',
      description: '',
      location: 'Remote',
      workMode: 'remote',
      internshipDurationMonths: 3,
      applicationUrl: 'https://example.com/test',
      source: 'Web',
      deadline: '2026-12-31T00:00:00Z',
      eligibleYears: [3],
      eligibleDegrees: ['B.Tech'],
      requiredSkills: ['Python'],
      preferredSkills: [],
      postedAt: '2026-01-01T00:00:00Z',
    }

    const mockApp: ApplicationItem = {
      id: generateApplicationId('student-1', mockOpp.id),
      studentId: 'student-1',
      opportunityId: mockOpp.id,
      opportunity: mockOpp,
      matchScore: 70,
      recommendation: 'APPLY NOW',
      status: 'saved',
      notes: '',
      updatedAt: new Date().toISOString(),
    }

    const success = await upsertUserApplication(mockApp)
    expect(success).toBe(false)
  })
})
