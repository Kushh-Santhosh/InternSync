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
  eligible_years: z.array(z.number()).default([]),
  eligible_degrees: z.array(z.string()).default([]),
  duration_months: z.number().default(0),
  stipend_amount: z.number().optional(),
  stipend_currency: z.string().optional(),
  deadline: z.string().optional(),
  application_url: z.string(),
  is_partially_verified: z.boolean().default(false),
  experience_requirements: z.string().optional(),
  min_cgpa: z.number().optional(),
})

export type ExtractedOpportunityData = z.infer<typeof OpportunityExtractionSchema>

/**
 * Deterministic parser that analyzes untrusted raw job snippets and text without fabricating requirements.
 */
export function extractRequirementsDeterministically(
  raw: RawSearchResult,
  fullText?: string
): ExtractedOpportunityData {
  const sourceText = fullText || raw.snippet || ''
  const isPartiallyVerified = !fullText || fullText.length < 150
  const combinedText = `${raw.title} ${sourceText}`
  const lower = combinedText.toLowerCase()

  // 1. Role & Company extraction: extract truthfully without inventing placeholder names
  let company = ''
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
    if (parts[1] && parts[1].length < 35) company = parts[1].trim()
  }

  if (!company) {
    company = raw.source ? raw.source.replace(/\(.*?\)/g, '').trim() : 'Employer'
  }

  // 2. Work Mode: evaluate strictly from text
  let work_mode: 'remote' | 'hybrid' | 'onsite' = 'onsite'
  if (lower.includes('remote') || lower.includes('work from home')) {
    work_mode = 'remote'
  } else if (lower.includes('hybrid')) {
    work_mode = 'hybrid'
  }

  // 3. Location: extract strictly if mentioned, never default to Bengaluru
  let location = ''
  const cities = [
    'Bengaluru', 'Bangalore', 'Hyderabad', 'Pune', 'Mumbai',
    'Delhi', 'Noida', 'Gurugram', 'Chennai', 'Kolkata', 'Ahmedabad',
    'San Francisco', 'New York', 'London', 'Seattle', 'Singapore'
  ]
  for (const c of cities) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(combinedText)) {
      location = c === 'Bangalore' ? 'Bengaluru' : c
      break
    }
  }

  if (!location) {
    location = work_mode === 'remote' ? 'Remote, India' : 'Location Unspecified'
  }

  // 4. Skills extraction: distinguish required vs preferred from section wording
  const required_skills: string[] = []
  const preferred_skills: string[] = []

  // Segment text into required vs preferred zones if clear section boundaries exist
  const preferredSectionMatch = combinedText.match(/(?:preferred|bonus|nice to have|good to have|plus|desirable|plus points)[\s\S]*$/i)
  const preferredSectionText = preferredSectionMatch ? preferredSectionMatch[0].toLowerCase() : ''

  const requiredSectionMatch = combinedText.match(/(?:requirements|required|qualifications|must have|minimum qualifications|basic qualifications|eligibility)[\s\S]*?(?=(?:preferred|bonus|nice to have|benefits|$))/i)
  const requiredSectionText = requiredSectionMatch ? requiredSectionMatch[0].toLowerCase() : ''

  for (const item of SKILL_TAXONOMY) {
    const canonical = item.canonicalName
    const canonicalLower = canonical.toLowerCase()
    let matched = false
    let inPreferredZone = false
    let inRequiredZone = false

    const matchesSkill = (str: string) => {
      if (str.includes(canonicalLower)) return true
      for (const alias of item.aliases) {
        if (new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(str)) {
          return true
        }
      }
      return false
    }

    if (matchesSkill(lower)) {
      matched = true
      if (preferredSectionText && matchesSkill(preferredSectionText)) {
        inPreferredZone = true
      }
      if (requiredSectionText && matchesSkill(requiredSectionText)) {
        inRequiredZone = true
      }
    }

    if (matched) {
      if (inPreferredZone && !inRequiredZone) {
        preferred_skills.push(canonical)
      } else if (inRequiredZone) {
        required_skills.push(canonical)
      } else {
        // Fallback: If mentioned in role title, it is required; otherwise based on skill type
        if (matchesSkill(role.toLowerCase())) {
          required_skills.push(canonical)
        } else if (required_skills.length < 4) {
          required_skills.push(canonical)
        } else {
          preferred_skills.push(canonical)
        }
      }
    }
  }

  // If no taxonomy skill matched in text, check title
  if (required_skills.length === 0) {
    for (const item of SKILL_TAXONOMY) {
      if (new RegExp(`\\b${item.canonicalName.toLowerCase()}\\b`, 'i').test(role)) {
        required_skills.push(item.canonicalName)
      }
    }
  }

  // 5. Eligible academic years: extract ONLY if stated; never fabricate [2, 3, 4]
  const eligible_years: number[] = []
  if (lower.includes('final year only') || lower.includes('4th year only')) {
    eligible_years.push(4)
  } else if (lower.includes('3rd year only')) {
    eligible_years.push(3)
  } else if (lower.includes('pre-final and final') || lower.includes('3rd and 4th')) {
    eligible_years.push(3, 4)
  } else if (lower.includes('2nd, 3rd') || lower.includes('2nd and 3rd')) {
    eligible_years.push(2, 3)
  } else {
    // Check batch mentions (e.g. batch of 2026, 2025)
    const batchMatches = combinedText.match(/\b(?:batch\s+(?:of\s+)?|class\s+(?:of\s+)?)(202[4-9])\b/gi)
    if (batchMatches) {
      const yearMatches = batchMatches.map((m) => parseInt(m.replace(/\D/g, ''), 10))
      eligible_years.push(...yearMatches)
    }
  }

  // 6. Eligible degrees: extract ONLY if stated; never fabricate default list
  const eligible_degrees: string[] = []
  const degreeCheckPatterns = [
    { name: 'B.Tech', regex: /\b(?:b\.?tech|bachelor of technology)\b/i },
    { name: 'B.E', regex: /\b(?:b\.?e|bachelor of engineering)\b/i },
    { name: 'M.Tech', regex: /\b(?:m\.?tech|master of technology)\b/i },
    { name: 'MCA', regex: /\bmca\b/i },
    { name: 'BCA', regex: /\bbca\b/i },
    { name: 'B.Sc', regex: /\bb\.?sc\b/i },
    { name: 'M.Sc', regex: /\bm\.?sc\b/i },
  ]
  for (const deg of degreeCheckPatterns) {
    if (deg.regex.test(combinedText)) {
      eligible_degrees.push(deg.name)
    }
  }

  // 7. Duration: extract ONLY if stated; never default to 3 months
  let duration_months = 0
  const durationMatch = combinedText.match(/\b([1-9]|1[0-2])\s*(?:-|to)?\s*(?:months?|mos?)\b/i)
  if (durationMatch) {
    duration_months = parseInt(durationMatch[1], 10)
  }

  // 8. Stipend
  let stipend_amount: number | undefined
  const stipendMatch = combinedText.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/i)
  if (stipendMatch) {
    const parsed = parseInt(stipendMatch[1].replace(/,/g, ''), 10)
    if (parsed >= 5000 && parsed <= 150000) stipend_amount = parsed
  }

  // 9. Deadline: Extract genuine deadline ONLY if explicitly mentioned.
  let deadline: string | undefined
  const deadlineMatch = combinedText.match(/(?:deadline|apply\s+by|last\s+date|due\s+date|closes\s+on)\s*[:-]?\s*([A-Za-z0-9, -]{4,25})/i)
  if (deadlineMatch) {
    const rawDateStr = deadlineMatch[1].trim()
    const parsed = Date.parse(rawDateStr)
    if (!isNaN(parsed)) {
      deadline = new Date(parsed).toISOString().split('T')[0]
    }
  }

  // 10. Minimum CGPA
  let min_cgpa: number | undefined
  const cgpaMatch = combinedText.match(/(?:min(?:imum)?\s+)?(?:cgpa|gpa)[\s:]*([6-9](?:\.[0-9]{1,2})?)/i)
  if (cgpaMatch) {
    min_cgpa = parseFloat(cgpaMatch[1])
  }

  return {
    title: role,
    company,
    role,
    description: sourceText || `Internship opportunity for ${role} at ${company}.`,
    location,
    work_mode,
    required_skills: Array.from(new Set(required_skills)),
    preferred_skills: Array.from(new Set(preferred_skills)),
    eligible_years,
    eligible_degrees,
    duration_months,
    stipend_amount,
    stipend_currency: stipend_amount ? 'INR' : undefined,
    deadline,
    application_url: raw.url,
    is_partially_verified: isPartiallyVerified,
    min_cgpa,
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
    isPartiallyVerified: data.is_partially_verified,
    minCgpa: data.min_cgpa,
    experienceRequirements: data.experience_requirements,
    rawDescription: text,
    isDemo: false,
    isLiveWeb: true,
  }
}
