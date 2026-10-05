import { z } from 'zod'
import { SKILL_TAXONOMY, normalizeSkill } from '@/lib/matching/taxonomy'
import type { Opportunity, RawSearchResult } from '@/types'

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

  // Guarantee at least foundational technical skills if snippet was terse
  if (required_skills.length === 0) {
    if (/ai|machine learning|ml/i.test(role)) {
      required_skills.push('Python', 'Machine Learning')
      preferred_skills.push('PyTorch')
    } else if (/frontend|react|web/i.test(role)) {
      required_skills.push('React', 'JavaScript', 'CSS')
      preferred_skills.push('TypeScript')
    } else {
      required_skills.push('Python', 'SQL', 'Git')
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

  // 7. Deadline (default 3 weeks from now)
  const deadlineDate = new Date()
  deadlineDate.setDate(deadlineDate.getDate() + 21)
  const deadline = deadlineDate.toISOString().split('T')[0]

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

/**
 * Transforms extracted data into a canonical Opportunity object
 */
export function buildOpportunityFromExtraction(
  id: string,
  raw: RawSearchResult,
  data: ExtractedOpportunityData
): Opportunity {
  return {
    id,
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
    deadline: data.deadline || new Date(Date.now() + 1814400000).toISOString().split('T')[0],
    eligibleYears: data.eligible_years,
    eligibleDegrees: data.eligible_degrees,
    requiredSkills: data.required_skills.map((s) => normalizeSkill(s)),
    preferredSkills: data.preferred_skills.map((s) => normalizeSkill(s)),
    isDemo: false,
    isLiveWeb: true,
  }
}
