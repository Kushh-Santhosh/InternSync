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
 * Placeholder and fictional domains that must NEVER be treated as valid application destinations
 */
export const REJECTED_APPLICATION_DOMAINS = [
  'example.com',
  'example.org',
  'example.net',
  'example.edu',
  'demolabs.example.com',
  'nexasphere.example.com',
  'novastack.example.com',
  'pixelworks.example.com',
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'test.com',
  'sample.com',
]

/**
 * Validates whether a URL is a genuine, safe external application destination.
 * Returns false for empty, non-http(s), placeholder, or rejected domains.
 */
export function isSafeApplicationUrl(rawUrl?: string | null): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false
  const trimmed = rawUrl.trim()
  if (trimmed === '' || trimmed === '#' || trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) {
    return false
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false
    }

    const domain = parsed.hostname.toLowerCase()
    if (!domain.includes('.')) {
      return false
    }

    for (const rejected of REJECTED_APPLICATION_DOMAINS) {
      if (domain === rejected || domain.endsWith(`.${rejected}`)) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

/**
 * Validates and classifies application URL safety and reachability
 */
export async function verifyOpportunityUrl(
  rawUrl: string,
  options: { checkReachability?: boolean; companyName?: string } = {}
): Promise<UrlVerificationResult> {
  const checkedAt = new Date().toISOString()

  // 1. Sanitize & protocol validation
  if (!isSafeApplicationUrl(rawUrl)) {
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
