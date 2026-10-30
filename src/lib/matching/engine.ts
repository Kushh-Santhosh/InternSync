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
  const skillsMatched: string[] = []
  const skillsNeedsImprovement: string[] = []
  const requiredSkillsMissing: string[] = []
  const preferredSkillsMissing: string[] = []
  const missingSkills: string[] = []
  const whyMatched: string[] = []
  const evidenceFound: string[] = []
  const unknownCriteria: string[] = []

  requiredCanonical.forEach((req) => {
    const found = studentSkillMap.get(req.toLowerCase())
    if (found && found.confidence >= 40) {
      if (found.confidence >= 60) {
        skillsMatched.push(req)
      } else {
        skillsNeedsImprovement.push(req)
      }
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
      requiredSkillsMissing.push(req)
      missingSkills.push(req)
    }
  })

  preferredCanonical.forEach((pref) => {
    const found = studentSkillMap.get(pref.toLowerCase())
    if (found && found.confidence >= 40) {
      if (found.confidence >= 60) {
        skillsMatched.push(pref)
      } else {
        skillsNeedsImprovement.push(pref)
      }
      matchedPreferredCount++
      whyMatched.push(`Bonus: ${pref} experience detected`)
    } else {
      preferredSkillsMissing.push(pref)
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

  const oppYears = Array.isArray(opportunity.eligibleYears) ? opportunity.eligibleYears : []
  const oppDegrees = Array.isArray(opportunity.eligibleDegrees) ? opportunity.eligibleDegrees : []

  // Match both by academic standing (Year 1, 2, 3, 4) and graduation batch (Class of 2025, 2026, 2027, 2028)
  const currentCalendarYear = new Date().getFullYear()
  const derivedStanding = student.graduationYear
    ? Math.max(1, Math.min(4, 4 - (student.graduationYear - currentCalendarYear)))
    : student.currentYear

  const hasStatedYears = oppYears.length > 0
  const hasStatedDegrees = oppDegrees.length > 0

  if (!hasStatedYears) {
    unknownCriteria.push('Eligible academic years not stated')
  }
  if (!hasStatedDegrees) {
    unknownCriteria.push('Degree requirements not stated')
  }

  const yearEligible =
    !hasStatedYears ||
    (isYearSpecified
      ? oppYears.includes(student.currentYear)
      : Boolean(student.graduationYear) && oppYears.includes(derivedStanding)) ||
    (Boolean(student.graduationYear) && oppYears.includes(student.graduationYear))

  const degreeEligible = !hasStatedDegrees
    ? true
    : isDegreeSpecified
    ? oppDegrees.some((deg) => {
        const lower = deg.toLowerCase()
        if (lower.includes('any') || lower.includes('all') || lower.includes('open')) return true
        const norm = lower.replace(/[^a-z]/g, '')
        return norm.length > 0 && (norm.includes(degreeNormalized) || degreeNormalized.includes(norm))
      })
    : false

  // CGPA / Academic performance gate (if opportunity specifies minCgpa)
  let cgpaEligible = true
  if (opportunity.minCgpa && opportunity.minCgpa > 0) {
    if (student.academicMetric) {
      const parsedMetric = parseFloat(String(student.academicMetric).replace(/[^0-9.]/g, ''))
      if (!isNaN(parsedMetric)) {
        // Normalize percentage to 10-scale if metric > 10
        const normalizedCgpa = parsedMetric > 10 ? (parsedMetric / 9.5) : parsedMetric
        if (normalizedCgpa < opportunity.minCgpa) {
          cgpaEligible = false
          eligibilityNotes.push(`Minimum CGPA requirement not met (Requires ${opportunity.minCgpa}, your profile indicates ${normalizedCgpa.toFixed(1)}).`)
        }
      }
      if (!student.isAcademicMetricConfirmed) {
        unknownCriteria.push('Academic GPA unconfirmed')
      }
    } else {
      unknownCriteria.push('Academic GPA not specified in profile')
    }
  }

  // Academic Metric / GPA gate: exclude unconfirmed metric from eligibility thresholds
  if (!student.isAcademicMetricConfirmed && student.academicMetric) {
    eligibilityNotes.push(
      `Academic grade (${student.academicMetric}) is unconfirmed: excluded from minimum GPA thresholds until verified.`
    )
  }

  let eligibilityScore = 100
  let isAcademicUnconfirmed = false

  if (!isYearSpecified && !student.graduationYear && hasStatedYears) {
    eligibilityScore = 30
    isAcademicUnconfirmed = true
    unknownCriteria.push('Current academic year not confirmed')
    eligibilityNotes.push('Academic year is unconfirmed in profile; eligibility cannot be verified.')
  } else if (!isDegreeSpecified && hasStatedDegrees) {
    eligibilityScore = 35
    isAcademicUnconfirmed = true
    unknownCriteria.push('Academic degree not specified')
    eligibilityNotes.push('Degree program is unconfirmed in profile; eligibility cannot be verified.')
  } else if (!yearEligible) {
    eligibilityScore = 30
    eligibilityNotes.push(
      `This role targets ${opportunity.eligibleYears.join('/')} (your profile indicates ${
        student.graduationYear ? `Class of ${student.graduationYear}` : isYearSpecified ? `Year ${student.currentYear}` : 'unconfirmed year'
      })`
    )
  } else if (!degreeEligible) {
    eligibilityScore = 35
    eligibilityNotes.push(`This opportunity specifically targets ${opportunity.eligibleDegrees.join(', ')} degrees`)
  } else if (!cgpaEligible) {
    eligibilityScore = 40
  } else {
    if (hasStatedDegrees || hasStatedYears) {
      whyMatched.push(
        `Academic standing (${student.degree || 'Degree'}, ${
          student.graduationYear ? `Class of ${student.graduationYear}` : `Year ${student.currentYear}`
        }) satisfies eligibility`
      )
      eligibilityNotes.push(
        `Fully eligible: ${student.degree || 'Engineering'} (${student.graduationYear ? `Class of ${student.graduationYear}` : `Year ${student.currentYear}`})`
      )
    } else {
      whyMatched.push('Open eligibility: Opportunity welcomes candidates from all degree programs and academic years')
      eligibilityNotes.push('Open academic standing: All years and degrees accepted')
    }
  }

  // Determine explicit EligibilityStatus
  let eligibilityStatus: 'Eligible' | 'Ineligible' | 'Needs verification' | 'Not specified' = 'Eligible'
  if (!hasStatedYears && !hasStatedDegrees && !opportunity.minCgpa) {
    eligibilityStatus = 'Not specified'
  } else if (!yearEligible || !degreeEligible || !cgpaEligible) {
    eligibilityStatus = 'Ineligible'
  } else if (isAcademicUnconfirmed || unknownCriteria.length > 0) {
    eligibilityStatus = 'Needs verification'
  } else {
    eligibilityStatus = 'Eligible'
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
  if (relevantProjects.length > 0) {
    whyMatched.push(
      `Portfolio evidence: ${relevantProjects.length} relevant project(s) demonstrated required tech stack (${relevantProjects.map((p) => p.title).slice(0, 2).join(', ')})`
    )
  }

  // 4. Education Score (10%)
  const educationScore = degreeEligible ? 95 : 60

  // 5. Experience Score (10%)
  // Grounded in actual extracted & student-confirmed experience (internships, work history).
  // If an internship does not require prior work experience, lack of experience does NOT unfairly penalize.
  const expReq = (opportunity.experienceRequirements || '').toLowerCase()
  const requiresPriorExperience =
    expReq.length > 0 &&
    !expReq.includes('no prior experience') &&
    !expReq.includes('not required') &&
    !expReq.includes('freshers') &&
    !expReq.includes('open to all') &&
    (expReq.includes('prior') ||
      expReq.includes('previous') ||
      expReq.includes('experience required') ||
      expReq.includes('months of experience') ||
      expReq.includes('internship experience') ||
      expReq.includes('minimum'))

  const studentExperiences = student.experiences || []
  let experienceScore = 100

  if (!requiresPriorExperience) {
    // Role is suitable for students with zero prior professional experience
    if (studentExperiences.length > 0) {
      experienceScore = 100
      whyMatched.push(`Bonus: Prior internship at ${studentExperiences[0].company} exceeds baseline expectations`)
    } else {
      experienceScore = 100 // Fully unpenalized baseline for entry-level student roles
      whyMatched.push('Role is designed for students; prior professional experience is not required')
    }
  } else {
    // Opportunity explicitly demands prior professional/internship experience
    if (studentExperiences.length === 0) {
      experienceScore = 40
      eligibilityNotes.push(`Opportunity requires prior experience (${opportunity.experienceRequirements}); no confirmed internships found in profile.`)
    } else {
      let isRelevant = false
      for (const exp of studentExperiences) {
        const text = `${exp.roleTitle} ${exp.summary}`.toLowerCase()
        if (
          requiredCanonical.some((r) => text.includes(r.toLowerCase())) ||
          (student.targetRole && text.includes(student.targetRole.toLowerCase())) ||
          text.includes('developer') ||
          text.includes('engineer') ||
          text.includes('intern')
        ) {
          isRelevant = true
          break
        }
      }

      if (isRelevant) {
        experienceScore = 100
        whyMatched.push(`Demonstrated relevant internship experience at ${studentExperiences[0].company}`)
      } else {
        experienceScore = 75
        whyMatched.push(`Confirmed work experience at ${studentExperiences[0].company}`)
      }
    }
  }

  // 6. Location Score (5%)
  const isRemote = opportunity.workMode === 'remote'
  const isLocationUnspecified = !opportunity.location || opportunity.location.toLowerCase() === 'unspecified' || opportunity.location.toLowerCase() === 'location unspecified'
  const locationMatches =
    isRemote ||
    isLocationUnspecified ||
    opportunity.location.toLowerCase() === student.location.toLowerCase() ||
    student.preferredLocations.some((loc) =>
      loc.toLowerCase() === opportunity.location.toLowerCase()
    )
  const locationScore = locationMatches ? 100 : 40
  if (locationMatches) {
    whyMatched.push(
      isRemote
        ? 'Remote work mode matches flexible availability'
        : isLocationUnspecified
        ? 'Location is flexible or unspecified'
        : `Location (${opportunity.location}) aligns with your preferences`
    )
  }

  // 7. Availability Score (5%)
  const oppDuration = opportunity.internshipDurationMonths || 0
  const availabilityMatches =
    oppDuration === 0 ||
    student.availableDurationMonths === 0 ||
    student.availableDurationMonths >= oppDuration
  const availabilityScore = availabilityMatches ? 100 : 50
  if (availabilityMatches && oppDuration > 0) {
    whyMatched.push(`${oppDuration}-month commitment matches your availability`)
  } else if (!availabilityMatches) {
    eligibilityNotes.push(
      `Opportunity requires ${oppDuration} months (you specified ${student.availableDurationMonths})`
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

  // Five-State Recommendation Engine:
  // APPLY NOW | PREPARE FIRST | SKIP | NOT ELIGIBLE | NEEDS VERIFICATION
  let recommendation: RecommendationType = 'SKIP'

  const hasHardEligibilityMismatch = !yearEligible || !degreeEligible || !cgpaEligible || eligibilityScore < 50

  if (hasHardEligibilityMismatch || overallMatchScore < 55) {
    recommendation = 'SKIP'
  } else if (isAcademicUnconfirmed && overallMatchScore >= 70) {
    recommendation = 'PREPARE FIRST'
  } else if (overallMatchScore >= 80 && skillScore >= 75 && yearEligible && !isAcademicUnconfirmed) {
    recommendation = 'APPLY NOW'
  } else {
    // 55 - 79% score with addressable skills or pending confirmation
    recommendation = 'PREPARE FIRST'
  }

  // Formulate clear, human-readable explanation
  let explanation = ''
  if (recommendation === 'APPLY NOW') {
    explanation = `Strong ${overallMatchScore}% match. You satisfy academic eligibility criteria and demonstrate verified skills in ${skillsMatched.slice(0, 3).join(', ')}.`
  } else if (recommendation === 'PREPARE FIRST') {
    const missingStr = missingSkills.slice(0, 3).join(', ')
    explanation = `Moderate ${overallMatchScore}% match with addressable gaps. You meet baseline criteria but would benefit from completing preparation in ${missingStr || 'target skills'} before applying.`
  } else {
    explanation = eligibilityNotes[0] || `Match score is ${overallMatchScore}%. Role requirements do not align with your current profile standing.`
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
    isEligible: !hasHardEligibilityMismatch,
    eligibilityStatus,
    skillsMatched: Array.from(new Set(skillsMatched)),
    requiredSkillsMissing: Array.from(new Set(requiredSkillsMissing)),
    preferredSkillsMissing: Array.from(new Set(preferredSkillsMissing)),
    skillsNeedsImprovement: Array.from(new Set(skillsNeedsImprovement)),
    unknownCriteria: Array.from(new Set(unknownCriteria)),
    explanation,
    whyMatched: Array.from(new Set(whyMatched)),
    missingSkills: Array.from(new Set(missingSkills)),
    evidenceFound: Array.from(new Set(evidenceFound)),
    eligibilityNotes: Array.from(new Set(eligibilityNotes)),
    engineVersion: 'v1.0.0-deterministic',
    calculatedAt: new Date().toISOString(),
  }
}
