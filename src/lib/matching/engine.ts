import type {
  MatchResult,
  MatchScores,
  Opportunity,
  ProjectItem,
  RecommendationType,
  SkillEvidenceItem,
  StudentProfile,
} from '@/types'
import { normalizeSkill } from './taxonomy'

export interface MatchingWeights {
  skill: number // 30%
  eligibility: number // 20%
  project: number // 15%
  education: number // 10%
  experience: number // 10%
  location: number // 5%
  availability: number // 5%
  intent: number // 5%
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  skill: 0.3,
  eligibility: 0.2,
  project: 0.15,
  education: 0.1,
  experience: 0.1,
  location: 0.05,
  availability: 0.05,
  intent: 0.05,
}

export interface MatchingContext {
  student: StudentProfile
  skills: SkillEvidenceItem[]
  projects: ProjectItem[]
  opportunity: Opportunity
  weights?: MatchingWeights
}

/**
 * Deterministic Matching Engine v1
 * Computes an explainable 8-dimensional fit vector and Apply/Prepare/Skip recommendation.
 */
export function calculateMatch(context: MatchingContext): MatchResult {
  const { student, skills, projects, opportunity, weights = DEFAULT_MATCHING_WEIGHTS } = context

  const studentSkillMap = new Map<string, SkillEvidenceItem>()
  skills.forEach((s) => {
    studentSkillMap.set(normalizeSkill(s.skillName).toLowerCase(), s)
  })

  // 1. Skill Compatibility (30%)
  const requiredCanonical = opportunity.requiredSkills.map((s) => normalizeSkill(s))
  const preferredCanonical = opportunity.preferredSkills.map((s) => normalizeSkill(s))

  let matchedRequiredCount = 0
  let matchedPreferredCount = 0
  const missingSkills: string[] = []
  const whyMatched: string[] = []
  const evidenceFound: string[] = []

  requiredCanonical.forEach((req) => {
    const found = studentSkillMap.get(req.toLowerCase())
    if (found && found.confidence >= 40) {
      matchedRequiredCount++
      const projectCount = projects.filter((p) =>
        p.technologies.some((t) => normalizeSkill(t).toLowerCase() === req.toLowerCase())
      ).length

      if (projectCount > 0) {
        whyMatched.push(`${req} demonstrated in ${projectCount} project${projectCount > 1 ? 's' : ''}`)
        evidenceFound.push(`${req}: Practical project execution`)
      } else {
        whyMatched.push(`${req} profile confidence at ${found.confidence}%`)
      }

      if (found.assessmentScore && found.assessmentScore >= 70) {
        evidenceFound.push(`${req}: Skill Lab verified score ${found.assessmentScore}%`)
      }
    } else {
      missingSkills.push(req)
    }
  })

  preferredCanonical.forEach((pref) => {
    const found = studentSkillMap.get(pref.toLowerCase())
    if (found && found.confidence >= 40) {
      matchedPreferredCount++
      whyMatched.push(`Bonus: ${pref} experience detected`)
    } else {
      // Preferred skills are secondary missing
      if (!missingSkills.includes(pref)) {
        missingSkills.push(pref)
      }
    }
  })

  const requiredSkillRatio =
    requiredCanonical.length > 0 ? matchedRequiredCount / requiredCanonical.length : 1
  const preferredSkillRatio =
    preferredCanonical.length > 0 ? matchedPreferredCount / preferredCanonical.length : 0

  const skillScore = Math.round(
    Math.min(100, (requiredSkillRatio * 0.8 + preferredSkillRatio * 0.2) * 100)
  )

  // 2. Academic Eligibility (20%)
  const eligibilityNotes: string[] = []
  const isYearSpecified =
    student.isCurrentYearConfirmed !== false &&
    typeof student.currentYear === 'number' &&
    student.currentYear >= 1
  const degreeClean = (student.degree || '').trim()
  const isDegreeSpecified = degreeClean.length > 0
  const degreeNormalized = degreeClean.toLowerCase().replace(/[^a-z]/g, '')

  // Match both by academic standing (Year 1, 2, 3) and graduation batch (Class of 2028)
  const yearEligible =
    opportunity.eligibleYears.length === 0 ||
    (isYearSpecified && opportunity.eligibleYears.includes(student.currentYear)) ||
    (Boolean(student.graduationYear) && opportunity.eligibleYears.includes(student.graduationYear)) ||
    (student.graduationYear === 2028 && opportunity.eligibleYears.some((y) => y === 2028 || y === 1 || y === 2))

  const degreeEligible = isDegreeSpecified
    ? (opportunity.eligibleDegrees.length === 0 ||
       opportunity.eligibleDegrees.some((deg) => {
         const lower = deg.toLowerCase()
         if (lower.includes('any') || lower.includes('all') || lower.includes('open')) return true
         const norm = lower.replace(/[^a-z]/g, '')
         return norm.length > 0 && (norm.includes(degreeNormalized) || degreeNormalized.includes(norm))
       }))
    : false

  // Academic Metric / GPA gate: exclude unconfirmed metric from eligibility thresholds
  if (!student.isAcademicMetricConfirmed && student.academicMetric) {
    eligibilityNotes.push(
      `Academic grade (${student.academicMetric}) is unconfirmed: excluded from minimum GPA thresholds until verified.`
    )
  }

  let eligibilityScore = 100
  if (!isYearSpecified && !student.graduationYear && !isDegreeSpecified) {
    eligibilityScore = 30
    eligibilityNotes.push('Academic year and degree are unconfirmed in profile; eligibility cannot be verified.')
  } else if (!yearEligible) {
    eligibilityScore = 30
    eligibilityNotes.push(
      `This role targets ${opportunity.eligibleYears.join('/')} (your profile indicates ${
        student.graduationYear ? `Class of ${student.graduationYear}` : isYearSpecified ? `Year ${student.currentYear}` : 'unconfirmed year'
      })`
    )
  } else if (!degreeEligible) {
    eligibilityScore = 60
    eligibilityNotes.push(`This opportunity specifically targets ${opportunity.eligibleDegrees.join(', ')} degrees`)
  } else {
    whyMatched.push(
      `Academic standing (${student.degree || 'Degree'}, ${
        student.graduationYear ? `Class of ${student.graduationYear}` : `Year ${student.currentYear}`
      }) satisfies eligibility`
    )
    eligibilityNotes.push(
      `Fully eligible: ${student.degree || 'Engineering'} (${student.graduationYear ? `Class of ${student.graduationYear}` : `Year ${student.currentYear}`})`
    )
  }

  // 3. Project Evidence Score (15%)
  const relevantProjects = projects.filter((p) =>
    p.technologies.some((tech) =>
      requiredCanonical.some((r) => r.toLowerCase() === normalizeSkill(tech).toLowerCase()) ||
      preferredCanonical.some((pr) => pr.toLowerCase() === normalizeSkill(tech).toLowerCase())
    )
  )
  const strongProjects = relevantProjects.filter((p) => p.evidenceStrength === 'strong').length
  const projectScore = Math.min(
    100,
    Math.round(
      (relevantProjects.length * 35 + strongProjects * 25)
    )
  )

  // 4. Education Score (10%)
  const educationScore = degreeEligible ? 95 : 60

  // 5. Experience Score (10%)
  // For students, base experience on project depth and validated skills
  const validatedCount = skills.filter((s) => s.assessmentScore && s.assessmentScore >= 70).length
  const experienceScore = Math.min(100, 60 + validatedCount * 15)

  // 6. Location Score (5%)
  const isRemote = opportunity.workMode === 'remote'
  const locationMatches =
    isRemote ||
    opportunity.location.toLowerCase() === student.location.toLowerCase() ||
    student.preferredLocations.some((loc) =>
      loc.toLowerCase() === opportunity.location.toLowerCase()
    )
  const locationScore = locationMatches ? 100 : 40
  if (locationMatches) {
    whyMatched.push(
      isRemote
        ? 'Remote work mode matches flexible availability'
        : `Location (${opportunity.location}) aligns with your preferences`
    )
  }

  // 7. Availability Score (5%)
  const availabilityMatches =
    student.availableDurationMonths >= opportunity.internshipDurationMonths
  const availabilityScore = availabilityMatches ? 100 : 50
  if (availabilityMatches) {
    whyMatched.push(`${opportunity.internshipDurationMonths}-month commitment matches your availability`)
  } else {
    eligibilityNotes.push(
      `Opportunity requires ${opportunity.internshipDurationMonths} months (you specified ${student.availableDurationMonths})`
    )
  }

  // 8. Intent Score (5%)
  const targetRoleMatches = Boolean(
    student.targetRole &&
    (opportunity.roleTitle.toLowerCase().includes(student.targetRole.toLowerCase()) ||
     student.targetRole.toLowerCase().includes(opportunity.roleTitle.toLowerCase()) ||
     opportunity.category.toLowerCase().includes(student.targetRole.toLowerCase()))
  )
  const categoryMatches = student.careerInterests.some(
    (interest) =>
      interest.toLowerCase().includes(opportunity.category.toLowerCase()) ||
      opportunity.category.toLowerCase().includes(interest.toLowerCase()) ||
      opportunity.roleTitle.toLowerCase().includes(interest.toLowerCase())
  )
  const intentScore = (targetRoleMatches || categoryMatches) ? 100 : 50
  if (targetRoleMatches || categoryMatches) {
    whyMatched.push(`Target role/career interests align with ${opportunity.roleTitle}`)
  }

  // Weighted Total Calculation
  const weightedTotal =
    skillScore * weights.skill +
    eligibilityScore * weights.eligibility +
    projectScore * weights.project +
    educationScore * weights.education +
    experienceScore * weights.experience +
    locationScore * weights.location +
    availabilityScore * weights.availability +
    intentScore * weights.intent

  const overallMatchScore = Math.round(Math.min(100, Math.max(0, weightedTotal)))

  // Tri-State Recommendation Engine: APPLY NOW / PREPARE FIRST / SKIP
  let recommendation: RecommendationType = 'SKIP'

  // Hard eligibility gate: if year is not eligible, or eligibility is unconfirmed/mismatched
  const isAcademicUnconfirmed = !isYearSpecified || !isDegreeSpecified
  const hasHardEligibilityMismatch = !yearEligible || eligibilityScore < 50

  if (hasHardEligibilityMismatch || overallMatchScore < 55) {
    recommendation = 'SKIP'
  } else if (overallMatchScore >= 80 && skillScore >= 75 && yearEligible && !isAcademicUnconfirmed) {
    recommendation = 'APPLY NOW'
  } else {
    // 55 - 79% score with addressable skills or pending confirmation
    recommendation = 'PREPARE FIRST'
  }

  const scores: MatchScores = {
    overallMatchScore,
    skillScore,
    eligibilityScore,
    projectScore,
    educationScore,
    experienceScore,
    locationScore,
    availabilityScore,
    intentScore,
  }

  return {
    ...scores,
    id: `match-${student.id}-${opportunity.id}`,
    studentId: student.id,
    opportunityId: opportunity.id,
    recommendation,
    whyMatched: Array.from(new Set(whyMatched)),
    missingSkills: Array.from(new Set(missingSkills)),
    evidenceFound: Array.from(new Set(evidenceFound)),
    eligibilityNotes: Array.from(new Set(eligibilityNotes)),
    engineVersion: 'v1.0.0-deterministic',
    calculatedAt: new Date().toISOString(),
  }
}
