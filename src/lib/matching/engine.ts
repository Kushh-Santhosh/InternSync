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
  const yearEligible =
    opportunity.eligibleYears.length === 0 ||
    opportunity.eligibleYears.includes(student.currentYear)

  const degreeNormalized = student.degree.toLowerCase().replace(/[^a-z]/g, '')
  const degreeEligible =
    opportunity.eligibleDegrees.length === 0 ||
    opportunity.eligibleDegrees.some((deg) =>
      deg.toLowerCase().replace(/[^a-z]/g, '').includes(degreeNormalized) ||
      degreeNormalized.includes(deg.toLowerCase().replace(/[^a-z]/g, ''))
    )

  let eligibilityScore = 100
  if (!yearEligible && !degreeEligible) {
    eligibilityScore = 10
    eligibilityNotes.push(`This role is currently limited to year ${opportunity.eligibleYears.join(' or ')} students in ${opportunity.eligibleDegrees.join(', ')}`)
  } else if (!yearEligible) {
    eligibilityScore = 30
    eligibilityNotes.push(`This role is currently limited to final-year students (Year ${opportunity.eligibleYears.join('/')})`)
  } else if (!degreeEligible) {
    eligibilityScore = 60
    eligibilityNotes.push(`This opportunity specifically targets ${opportunity.eligibleDegrees.join(', ')} degrees`)
  } else {
    whyMatched.push(`Your academic standing (Year ${student.currentYear}, ${student.degree}) fully satisfies eligibility`)
    eligibilityNotes.push(`Fully eligible: ${student.degree} Year ${student.currentYear}`)
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
  const categoryMatches = student.careerInterests.some(
    (interest) =>
      interest.toLowerCase().includes(opportunity.category.toLowerCase()) ||
      opportunity.category.toLowerCase().includes(interest.toLowerCase()) ||
      opportunity.roleTitle.toLowerCase().includes(interest.toLowerCase())
  )
  const intentScore = categoryMatches ? 100 : 50

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

  // Hard eligibility gate
  const hasHardEligibilityMismatch = !yearEligible || eligibilityScore < 50

  if (hasHardEligibilityMismatch || overallMatchScore < 55) {
    recommendation = 'SKIP'
  } else if (overallMatchScore >= 80 && skillScore >= 75 && yearEligible) {
    recommendation = 'APPLY NOW'
  } else {
    // 55 - 79% score with addressable skills
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
