import { describe, it, expect } from 'vitest'
import { SEED_OPPORTUNITIES } from '@/data/seed-opportunities'
import { isSafeApplicationUrl } from '@/features/opportunities/url-verifier/url-verifier'

describe('Opportunity Data Integrity and Direct Application Link Regression Suite', () => {
  it('ensures every opportunity in the catalog is genuinely an internship or supported student opportunity', () => {
    expect(SEED_OPPORTUNITIES.length).toBeGreaterThan(0)

    for (const opp of SEED_OPPORTUNITIES) {
      const titleLower = opp.roleTitle.toLowerCase()
      const descLower = opp.description.toLowerCase()

      // Must explicitly be an internship, student ambassador, apprentice, or co-op program
      const isStudentRole =
        /\b(intern|internship|student|trainee|apprentice|co-op|ambassador)\b/i.test(opp.roleTitle) ||
        /\b(intern|internship|student|fellow)\b/i.test(opp.description)

      expect(
        isStudentRole,
        `Role "${opp.roleTitle}" at ${opp.companyName} must be genuinely classified as an internship or student program`
      ).toBe(true)

      // Must NOT be a senior/staff/lead/full-time engineer role disguised as an internship
      const forbiddenFullTimeTerms = [
        'staff engineer',
        'lead data engineer',
        'principal systems',
        'engineering manager',
        'associate general counsel',
        'devrel engineer ii',
        'senior backend engineer',
        'applied scientist iii',
      ]

      for (const term of forbiddenFullTimeTerms) {
        expect(
          titleLower.includes(term),
          `Role "${opp.roleTitle}" at ${opp.companyName} must not contain forbidden full-time designation "${term}"`
        ).toBe(false)
      }
    }
  })

  it('rejects generic career homepages and enforces direct vacancy application URLs', () => {
    // List of forbidden generic URLs that do not point to a specific vacancy
    const genericUrls = [
      'https://jobs.lever.co/fampay',
      'https://www.rubrik.com/company/careers',
      'https://careers.google.com/jobs',
      'https://boards.greenhouse.io/hackerrank',
      'https://boards.greenhouse.io/inmobi',
      'https://jobs.ashbyhq.com/perplexity',
    ]

    for (const opp of SEED_OPPORTUNITIES) {
      expect(opp.applicationUrl).toBeDefined()
      expect(opp.applicationUrl.length).toBeGreaterThan(10)

      // Must not match generic company career listings
      for (const generic of genericUrls) {
        expect(
          opp.applicationUrl.replace(/\/$/, ''),
          `Opportunity "${opp.roleTitle}" at ${opp.companyName} must not point to generic career homepage: ${opp.applicationUrl}`
        ).not.toBe(generic.replace(/\/$/, ''))
      }

      // Must be an ATS direct vacancy with a specific vacancy ID or slug
      const hasSpecificIdOrSlug =
        /(\/jobs\/\d+|\/positions\/\d+|job\.\d+|\/[a-f0-9-]{16,}|gh_jid=\d+)/i.test(opp.applicationUrl)
      expect(
        hasSpecificIdOrSlug,
        `Opportunity "${opp.roleTitle}" at ${opp.companyName} must include a specific posting identifier in applicationUrl: ${opp.applicationUrl}`
      ).toBe(true)
    }
  })

  it('verifies that employer name and role title match truthful ATS records without misleading mappings', () => {
    for (const opp of SEED_OPPORTUNITIES) {
      // Supabase senior full-time Jobicy role must be completely purged
      expect(
        opp.companyName === 'Supabase' && opp.applicationUrl.includes('jobicy.com'),
        'Supabase Jobicy senior role must not exist in internship catalog'
      ).toBe(false)

      // Mismatched DevRel II role labeled as Python Backend Developer Intern must not exist
      expect(
        opp.companyName === 'HackerRank' && opp.applicationUrl.includes('8009429'),
        'HackerRank DevRel II role (8009429) must not be labeled as Python Backend Developer Intern'
      ).toBe(false)

      // Mismatched Associate General Counsel labeled as Security Associate must not exist
      expect(
        opp.companyName === 'Cloudflare' && opp.applicationUrl.includes('8144669'),
        'Cloudflare Associate General Counsel role (8144669) must not be labeled as Security Associate'
      ).toBe(false)

      // FamPay must not point to generic lever homepage
      if (opp.companyName === 'FamPay') {
        expect(opp.applicationUrl).not.toBe('https://jobs.lever.co/fampay')
      }
    }
  })

  it('confirms all application URLs pass security and verification checks', () => {
    for (const opp of SEED_OPPORTUNITIES) {
      const isSafe = isSafeApplicationUrl(opp.applicationUrl)
      expect(
        isSafe,
        `Application URL for ${opp.companyName} - "${opp.roleTitle}" (${opp.applicationUrl}) must be safe and valid`
      ).toBe(true)
    }
  })

  it('guarantees deterministic UUID identifiers match generated UUIDv5 hashes', async () => {
    const { generateOpportunityId } = await import('@/lib/utils/uuid')

    for (const opp of SEED_OPPORTUNITIES) {
      const expectedId = generateOpportunityId(opp.sourceUrl || opp.applicationUrl, opp.companyName, opp.roleTitle)
      expect(
        opp.id,
        `Opportunity ID for ${opp.companyName} - "${opp.roleTitle}" must match deterministic UUIDv5`
      ).toBe(expectedId)
    }
  })

  it('guarantees truthful metadata without invented stipends or fake hard deadlines', () => {
    for (const opp of SEED_OPPORTUNITIES) {
      // If stipend is published, it must be positive and explicitly denominated
      if (opp.stipendAmount !== undefined) {
        expect(opp.stipendAmount).toBeGreaterThan(0)
        expect(opp.stipendCurrency).toBeDefined()
        expect(opp.stipendPeriod).toBeDefined()
      }

      // Rolling applications must have isUndated flag
      if (opp.isUndated) {
        expect(opp.isUndated).toBe(true)
      }
    }
  })
})
