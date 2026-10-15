import { z } from 'zod'
import { SKILL_TAXONOMY, normalizeSkill } from '@/lib/matching/taxonomy'
import { generateOpportunityId, isValidUUID } from '@/lib/utils/uuid'
import type { Opportunity, RawSearchResult, UrlVerificationStatus } from '@/types'

export const OpportunityExtractionSchema = z.object({
  title: z.string(),
  company: z.string(),
  role: z.string(),
  description: z.string(),
  location: z.string(),
  work_mode: z.enum(['remote', 'hybrid', 'onsite']),
  required_skills: z.array(z.string()),
  preferred_skills: z.array(z.string()),
  eligible_years: z.array(z.number()),
  eligible_degrees: z.array(z.string()),
  duration_months: z.number().default(3),
  stipend_amount: z.number().optional(),
  stipend_currency: z.string().optional(),
  deadline: z.string().optional(),
  application_url: z.string(),
})

export type ExtractedOpportunityData = z.infer<typeof OpportunityExtractionSchema>

/**
 * Deterministic parser that analyzes untrusted raw job snippets and text
 */
export function extractRequirementsDeterministically(
  raw: RawSearchResult,
  fullText?: string
): ExtractedOpportunityData {
  const text = `${raw.title} ${raw.snippet} ${fullText || ''}`
  const lower = text.toLowerCase()

  // 1. Role & Company extraction
  let company = 'Tech Company'
  let role = raw.title

  if (raw.title.includes(' at ')) {
    const parts = raw.title.split(' at ')
    role = parts[0].trim()
    company = parts[1].replace(/[-–|].*$/, '').trim()
  } else if (raw.title.includes(' @ ')) {
    const parts = raw.title.split(' @ ')
    role = parts[0].trim()
    company = parts[1].replace(/[-–|].*$/, '').trim()
  } else if (raw.title.includes(' - ')) {
    const parts = raw.title.split(' - ')
    role = parts[0].trim()
    if (parts[1] && parts[1].length < 30) company = parts[1].trim()
  }

  // 2. Work Mode
  let work_mode: 'remote' | 'hybrid' | 'onsite' = 'onsite'
  if (lower.includes('remote') || lower.includes('work from home')) {
    work_mode = 'remote'
  } else if (lower.includes('hybrid')) {
    work_mode = 'hybrid'
  }

  // 3. Location
  let location = 'Bengaluru'
  const cities = ['Bengaluru', 'Bangalore', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi', 'Noida', 'Gurugram', 'Chennai']
  for (const c of cities) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(text)) {
      location = c === 'Bangalore' ? 'Bengaluru' : c
      break
    }
  }
  if (work_mode === 'remote') location = 'Remote, India'

  // 4. Skills extraction using taxonomy
  const required_skills: string[] = []
  const preferred_skills: string[] = []

  for (const item of SKILL_TAXONOMY) {
    const canonical = item.canonicalName
    let matched = false
    if (lower.includes(canonical.toLowerCase())) {
      matched = true
    } else {
      for (const alias of item.aliases) {
        if (new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)) {
          matched = true
          break
        }
      }
    }

    if (matched) {
      if (required_skills.length < 5) {
        required_skills.push(canonical)
      } else if (preferred_skills.length < 3) {
        preferred_skills.push(canonical)
      }
    }
  }

  // Only extract from title if explicitly found in taxonomy, do not invent unmentioned skills
  if (required_skills.length === 0) {
    for (const item of SKILL_TAXONOMY) {
      if (new RegExp(`\\b${item.canonicalName.toLowerCase()}\\b`, 'i').test(role)) {
        required_skills.push(item.canonicalName)
      }
    }
  }

  // 5. Eligible academic years
  const eligible_years: number[] = [2, 3, 4]
  if (lower.includes('final year only') || lower.includes('4th year only')) {
    eligible_years.length = 0
    eligible_years.push(4)
  } else if (lower.includes('pre-final') || lower.includes('3rd year')) {
    eligible_years.length = 0
    eligible_years.push(3)
  }

  // 6. Stipend
  let stipend_amount: number | undefined
  const stipendMatch = text.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/i)
  if (stipendMatch) {
    const parsed = parseInt(stipendMatch[1].replace(/,/g, ''), 10)
    if (parsed >= 5000 && parsed <= 150000) stipend_amount = parsed
  }

  // 7. Deadline: Extract genuine deadline ONLY if explicitly mentioned. NEVER invent or fabricate.
  let deadline: string | undefined
  const deadlineMatch = text.match(/(?:deadline|apply\s+by|last\s+date|due\s+date|closes\s+on)\s*[:-]?\s*([A-Za-z0-9, -]{4,25})/i)
  if (deadlineMatch) {
    const rawDateStr = deadlineMatch[1].trim()
    const parsed = Date.parse(rawDateStr)
    if (!isNaN(parsed)) {
      deadline = new Date(parsed).toISOString().split('T')[0]
    }
  }

  return {
    title: role,
    company,
    role,
    description: raw.snippet || `Internship opportunity for ${role} at ${company}.`,
    location,
    work_mode,
    required_skills: Array.from(new Set(required_skills)),
    preferred_skills: Array.from(new Set(preferred_skills)),
    eligible_years,
    eligible_degrees: ['B.Tech', 'B.E', 'M.Tech', 'BCA', 'MCA'],
    duration_months: 3,
    stipend_amount,
    stipend_currency: stipend_amount ? 'INR' : undefined,
    deadline,
    application_url: raw.url,
  }
}

export type OpportunityFreshness = 'active' | 'unverified' | 'expired' | 'closed'

/**
 * Strict evaluation of freshness, evidence, and past deadlines.
 * Flags expired postings (e.g., from 2024 or past deadlines) and closed positions.
 */
export function evaluateOpportunityFreshness(
  text: string,
  urlStatus?: UrlVerificationStatus
): { freshness: OpportunityFreshness; reason: string; explicitDeadline?: string; isUndated: boolean } {
  // 1. Check for closed / expired wording in content
  const closedRegex = /\b(?:applications\s+(?:are\s+)?closed|position\s+(?:is\s+)?closed|no\s+longer\s+accepting\s+applications|job\s+(?:has\s+)?expired|listing\s+(?:has\s+)?expired|closed\s+on|archive|archived\s+posting|this\s+opportunity\s+has\s+closed)\b/i
  if (closedRegex.test(text)) {
    return { freshness: 'closed', reason: 'Posting explicitly states applications are closed or expired.', isUndated: false }
  }

  // 2. Check for stale / past dates (e.g. "December 2024", "Dec 2024", 2024 or earlier dates)
  const staleYearRegex = /\b(?:dec(?:ember)?|nov(?:ember)?|oct(?:ober)?|sep(?:tember)?|aug(?:ust)?|jul(?:y)?|jun(?:e)?|may|apr(?:il)?|mar(?:ch)?|feb(?:ruary)?|jan(?:uary)?)\s+202[0-4]\b|\b202[0-4]-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])\b|\bbatch\s+(?:of\s+)?202[0-4]\b/i
  if (staleYearRegex.test(text)) {
    return { freshness: 'expired', reason: 'Posting is from 2024 or earlier with no evidence applications remain open.', isUndated: false }
  }

  // 3. Extract explicit deadline if mentioned in text
  let explicitDeadline: string | undefined
  const deadlineMatch = text.match(/(?:deadline|apply\s+by|last\s+date|due\s+date|closes\s+on)\s*[:-]?\s*([A-Za-z0-9, -]{4,25})/i)
  if (deadlineMatch) {
    const rawDateStr = deadlineMatch[1].trim()
    const parsed = Date.parse(rawDateStr)
    if (!isNaN(parsed)) {
      const d = new Date(parsed)
      // If the parsed deadline is in the past
      if (d.getTime() < Date.now() - 86400000) {
        return {
          freshness: 'expired',
          reason: `Application deadline (${rawDateStr}) has passed.`,
          explicitDeadline: d.toISOString().split('T')[0],
          isUndated: false,
        }
      }
      explicitDeadline = d.toISOString().split('T')[0]
    }
  }

  // 4. Incorporate reachability check
  if (urlStatus === 'EXPIRED') {
    return { freshness: 'expired', reason: 'Listing page returned 404/410 expired.', explicitDeadline, isUndated: !explicitDeadline }
  }
  if (urlStatus === 'BROKEN') {
    return { freshness: 'closed', reason: 'Application URL is unreachable or broken.', explicitDeadline, isUndated: !explicitDeadline }
  }
  if (urlStatus === 'UNVERIFIED') {
    return { freshness: 'unverified', reason: 'Listing URL could not be verified in real-time.', explicitDeadline, isUndated: !explicitDeadline }
  }

  return {
    freshness: 'active',
    reason: 'Verified active opportunity.',
    explicitDeadline,
    isUndated: !explicitDeadline,
  }
}

/**
 * Transforms extracted data into a canonical Opportunity object with verified freshness
 */
export function buildOpportunityFromExtraction(
  id: string,
  raw: RawSearchResult,
  data: ExtractedOpportunityData,
  urlStatus?: UrlVerificationStatus
): Opportunity {
  const finalId = isValidUUID(id)
    ? id
    : generateOpportunityId(raw.url || data.application_url, data.company, data.title)

  const text = `${raw.title} ${raw.snippet || ''}`
  const freshnessInfo = evaluateOpportunityFreshness(text, urlStatus)

  return {
    id: finalId,
    companyName: data.company,
    companyLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.company)}&background=0F172A&color=fff&size=128`,
    roleTitle: data.title,
    category: data.title.toLowerCase().includes('ai') || data.title.toLowerCase().includes('ml') ? 'AI / ML' : 'Software Engineering',
    description: data.description,
    location: data.location,
    workMode: data.work_mode,
    internshipDurationMonths: data.duration_months,
    stipendAmount: data.stipend_amount,
    stipendCurrency: data.stipend_currency,
    stipendPeriod: data.stipend_amount ? 'month' : undefined,
    applicationUrl: data.application_url,
    source: raw.source || 'Public Web',
    sourceUrl: raw.url,
    sourceDomain: raw.domain,
    postedAt: raw.discoveredAt || new Date().toISOString(),
    deadline: data.deadline || freshnessInfo.explicitDeadline || '',
    isUndated: freshnessInfo.isUndated,
    freshnessStatus: freshnessInfo.freshness,
    urlStatus: urlStatus || (freshnessInfo.freshness === 'expired' ? 'EXPIRED' : freshnessInfo.freshness === 'closed' ? 'BROKEN' : 'VERIFIED'),
    eligibleYears: data.eligible_years,
    eligibleDegrees: data.eligible_degrees,
    requiredSkills: data.required_skills.map((s) => normalizeSkill(s)),
    preferredSkills: data.preferred_skills.map((s) => normalizeSkill(s)),
    isDemo: false,
    isLiveWeb: true,
  }
}
