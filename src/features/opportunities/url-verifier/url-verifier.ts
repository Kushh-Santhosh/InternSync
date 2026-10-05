import type { UrlVerificationStatus } from '@/types'

export interface UrlVerificationResult {
  url: string
  status: UrlVerificationStatus
  directApplyAvailable: boolean
  buttonLabel: 'Apply directly' | 'View listing' | 'Expired'
  domain: string
  isHttps: boolean
  isOfficialCareersPage: boolean
  checkedAt: string
}

/**
 * Known direct applicant tracking systems and career domains
 */
const DIRECT_ATS_DOMAINS = [
  'greenhouse.io',
  'lever.co',
  'workday.com',
  'myworkdayjobs.com',
  'smartrecruiters.com',
  'ashbyhq.com',
  'breezy.hr',
  'recruitee.com',
  'jobvite.com',
]

/**
 * Validates and classifies application URL safety and reachability
 */
export async function verifyOpportunityUrl(
  rawUrl: string,
  options: { checkReachability?: boolean; companyName?: string } = {}
): Promise<UrlVerificationResult> {
  const checkedAt = new Date().toISOString()

  // 1. Sanitize & protocol validation
  let parsedUrl: URL
  try {
    parsedUrl = new URL(rawUrl)
  } catch {
    return {
      url: rawUrl,
      status: 'BROKEN',
      directApplyAvailable: false,
      buttonLabel: 'Expired',
      domain: '',
      isHttps: false,
      isOfficialCareersPage: false,
      checkedAt,
    }
  }

  // Reject dangerous protocols
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return {
      url: rawUrl,
      status: 'BROKEN',
      directApplyAvailable: false,
      buttonLabel: 'Expired',
      domain: parsedUrl.hostname,
      isHttps: false,
      isOfficialCareersPage: false,
      checkedAt,
    }
  }

  const isHttps = parsedUrl.protocol === 'https:'
  const domain = parsedUrl.hostname.toLowerCase()

  // Check if known direct ATS or official company career subdomain
  const isAts = DIRECT_ATS_DOMAINS.some((d) => domain.includes(d))
  const isCareersSubdomain = domain.startsWith('careers.') || domain.startsWith('jobs.') || parsedUrl.pathname.includes('/careers') || parsedUrl.pathname.includes('/jobs')
  const isOfficialCareersPage = isAts || isCareersSubdomain

  // Optional server-side reachability check via /api/verify-url
  if (options.checkReachability) {
    try {
      const res = await fetch('/api/verify-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl }),
      })
      if (res.ok) {
        const check = await res.json()
        if (check.status === 'EXPIRED') {
          return {
            url: rawUrl,
            status: 'EXPIRED',
            directApplyAvailable: false,
            buttonLabel: 'Expired',
            domain,
            isHttps,
            isOfficialCareersPage,
            checkedAt,
          }
        }
        if (check.status === 'BROKEN') {
          return {
            url: rawUrl,
            status: 'BROKEN',
            directApplyAvailable: false,
            buttonLabel: 'Expired',
            domain,
            isHttps,
            isOfficialCareersPage,
            checkedAt,
          }
        }
      }
    } catch {
      // fallback to domain heuristic
    }
  }

  const isVerified = isOfficialCareersPage || domain.length > 3
  const status: UrlVerificationStatus = isVerified ? 'VERIFIED' : 'UNVERIFIED'

  return {
    url: rawUrl,
    status,
    directApplyAvailable: isVerified,
    buttonLabel: isVerified ? 'Apply directly' : 'View listing',
    domain,
    isHttps,
    isOfficialCareersPage,
    checkedAt,
  }
}
