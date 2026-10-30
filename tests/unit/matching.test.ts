import { describe, expect, it } from 'vitest'
import { DEMO_STUDENT_PROFILE, DEMO_STUDENT_PROJECTS, DEMO_STUDENT_SKILLS } from '@/data/demo-profile'
import { SEED_OPPORTUNITIES } from '@/data/seed-opportunities'
import { calculateMatch } from '@/lib/matching/engine'
import { generateSkillGapRoadmap } from '@/lib/matching/roadmap'
import { areSkillsEqual, normalizeSkill } from '@/lib/matching/taxonomy'

describe('Skill Taxonomy & Normalization', () => {
  it('normalizes common aliases to canonical names', () => {
    expect(normalizeSkill('js')).toBe('JavaScript')
    expect(normalizeSkill('reactjs')).toBe('React')
    expect(normalizeSkill('react.js')).toBe('React')
    expect(normalizeSkill('ts')).toBe('TypeScript')
    expect(normalizeSkill('py')).toBe('Python')
    expect(normalizeSkill('ml')).toBe('Machine Learning')
  })

  it('correctly compares skills handling case-insensitivity and aliases', () => {
    expect(areSkillsEqual('React.js', 'React')).toBe(true)
    expect(areSkillsEqual('PYTHON', 'py')).toBe(true)
    expect(areSkillsEqual('TypeScript', 'Golang')).toBe(false)
  })
})

describe('Deterministic Matching Engine', () => {
  it('calculates APPLY NOW for high-affinity role (HackerRank SDE Intern)', () => {
    const opp = SEED_OPPORTUNITIES.find(
      (o) => o.companyName === 'HackerRank' && o.roleTitle.includes('Software Development Engineer')
    )!
    expect(opp).toBeDefined()
    const result = calculateMatch({
      student: DEMO_STUDENT_PROFILE,
      skills: DEMO_STUDENT_SKILLS,
      projects: DEMO_STUDENT_PROJECTS,
      opportunity: opp,
    })

    expect(result.overallMatchScore).toBeGreaterThanOrEqual(80)
    expect(result.recommendation).toBe('APPLY NOW')
    expect(result.eligibilityScore).toBeGreaterThanOrEqual(80)
    expect(result.whyMatched.length).toBeGreaterThan(0)
  })

  it('calculates PREPARE FIRST for role with addressable skill gap (Perplexity ML Research Intern)', () => {
    const opp = SEED_OPPORTUNITIES.find(
      (o) => o.companyName === 'Perplexity' && o.roleTitle.includes('Research Engineer')
    )!
    expect(opp).toBeDefined()
    const result = calculateMatch({
      student: DEMO_STUDENT_PROFILE,
      skills: DEMO_STUDENT_SKILLS,
      projects: DEMO_STUDENT_PROJECTS,
      opportunity: opp,
    })

    expect(result.recommendation).toBe('PREPARE FIRST')
    expect(result.missingSkills).toContain('PyTorch')
    expect(result.skillScore).toBeLessThan(75) // Triggered PREPARE FIRST because critical skill is missing
  })

  it('calculates NOT ELIGIBLE or SKIP for hard eligibility mismatch (Modal ML Research 4th-year only)', () => {
    const opp = SEED_OPPORTUNITIES.find(
      (o) => o.companyName === 'Modal' && o.roleTitle.includes('ML Research Intern')
    )!
    expect(opp).toBeDefined()
    const result = calculateMatch({
      student: DEMO_STUDENT_PROFILE,
      skills: DEMO_STUDENT_SKILLS,
      projects: DEMO_STUDENT_PROJECTS,
      opportunity: opp,
    })

    expect(['NOT ELIGIBLE', 'SKIP']).toContain(result.recommendation)
    expect(result.isEligible).toBe(false)
    expect(result.eligibilityScore).toBeLessThan(50)
  })
})

describe('14-Day Skill Gap Roadmap Synthesizer', () => {
  it('generates a 14-day structured timeline targeting missing skills', () => {
    const opp = SEED_OPPORTUNITIES.find(
      (o) => o.companyName === 'Perplexity' && o.roleTitle.includes('Research Engineer')
    )!
    expect(opp).toBeDefined()
    const roadmap = generateSkillGapRoadmap(opp, ['PyTorch', 'Transformer Architecture'])

    expect(roadmap.durationDays).toBe(14)
    expect(roadmap.dailyPlan.length).toBe(14)
    expect(roadmap.criticalGaps).toContain('PyTorch')
    expect(roadmap.dailyPlan[0].day).toBe(1)
    expect(roadmap.dailyPlan[13].day).toBe(14)
  })

  it('provides genuine non-placeholder resource URLs and structured daily outcomes for all 14 days', () => {
    const opp = SEED_OPPORTUNITIES[0]
    const roadmap = generateSkillGapRoadmap(opp, ['React', 'TypeScript', 'Node.js'])

    for (const day of roadmap.dailyPlan) {
      expect(day.estimatedMinutes).toBeGreaterThan(0)
      expect(day.expectedOutcome).toBeDefined()
      expect(day.expectedOutcome!.length).toBeGreaterThan(10)
      expect(day.resources.length).toBeGreaterThan(0)
      for (const res of day.resources) {
        expect(res.url).toMatch(/^https:\/\//)
        expect(res.url).not.toBe('#')
        expect(res.label.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('Advanced Hard Eligibility & Experience Scoring', () => {
  const baseStudent = {
    ...DEMO_STUDENT_PROFILE,
    academicMetric: '8.2',
    experiences: [],
  }

  it('does not penalize candidate experience on entry-level roles requiring no prior experience', () => {
    const entryRole = {
      ...SEED_OPPORTUNITIES[0],
      experienceRequirements: undefined,
    }

    const result = calculateMatch({
      student: baseStudent,
      skills: DEMO_STUDENT_SKILLS,
      projects: DEMO_STUDENT_PROJECTS,
      opportunity: entryRole,
    })

    // Experience score should be full marks (100) since role has no prior experience requirement
    expect(result.experienceScore).toBe(100)
  })

  it('rewards candidate with authentic extracted experience when role mentions prior experience', () => {
    const studentWithExp = {
      ...baseStudent,
      experiences: [
        {
          id: 'exp-1',
          company: 'TechCorp Solutions',
          roleTitle: 'Web Development Intern',
          duration: '3 months',
          summary: 'Built full-stack React and Node features.',
          isVerified: true,
        },
      ],
    }

    const expRole = {
      ...SEED_OPPORTUNITIES[0],
      experienceRequirements: 'Prior software internship experience preferred',
    }

    const result = calculateMatch({
      student: studentWithExp,
      skills: DEMO_STUDENT_SKILLS,
      projects: DEMO_STUDENT_PROJECTS,
      opportunity: expRole,
    })

    expect(result.experienceScore).toBeGreaterThanOrEqual(80)
  })

  it('triggers hard eligibility rejection when student CGPA does not meet mandatory threshold', () => {
    const lowCgpaStudent = {
      ...baseStudent,
      academicMetric: '7.2',
    }

    const strictCgpaRole = {
      ...SEED_OPPORTUNITIES[0],
      minCgpa: 8.5,
    }

    const result = calculateMatch({
      student: lowCgpaStudent,
      skills: DEMO_STUDENT_SKILLS,
      projects: DEMO_STUDENT_PROJECTS,
      opportunity: strictCgpaRole,
    })

    expect(result.isEligible).toBe(false)
    expect(result.eligibilityStatus).toBe('Ineligible')
    expect(result.recommendation).toBe('SKIP')
    expect(result.eligibilityNotes.some((n) => n.includes('CGPA'))).toBe(true)
  })

  it('accurately categorizes skills into matched, needs improvement, and missing requirements', () => {
    const customRole = {
      ...SEED_OPPORTUNITIES[0],
      requiredSkills: ['React', 'TypeScript', 'Rust', 'Kubernetes'],
      preferredSkills: ['GraphQL', 'Docker'],
    }

    // Student has React (verified strong) and Docker (low confidence), but lacks Rust, Kubernetes, GraphQL
    const customSkills = [
      {
        skillName: 'React',
        category: 'frontend' as const,
        confidence: 90,
        evidenceSources: ['project' as const, 'resume' as const],
        projectCount: 2,
        githubStrength: 'strong' as const,
      },
      {
        skillName: 'Docker',
        category: 'tools' as const,
        confidence: 45, // < 60% confidence -> needs improvement
        evidenceSources: ['resume' as const],
        projectCount: 0,
        githubStrength: 'moderate' as const,
      },
    ]

    const result = calculateMatch({
      student: baseStudent,
      skills: customSkills,
      projects: DEMO_STUDENT_PROJECTS,
      opportunity: customRole,
    })

    expect(result.skillsMatched).toContain('React')
    expect(result.skillsNeedsImprovement).toContain('Docker')
    expect(result.requiredSkillsMissing).toContain('Rust')
    expect(result.requiredSkillsMissing).toContain('Kubernetes')
    expect(result.preferredSkillsMissing).toContain('GraphQL')
  })

  it('handles unknown criteria gracefully without fabricating defaults or rejecting candidate', () => {
    const minimalRole = {
      ...SEED_OPPORTUNITIES[0],
      eligibleDegrees: [],
      eligibleYears: [],
      minCgpa: undefined,
    }

    const result = calculateMatch({
      student: baseStudent,
      skills: DEMO_STUDENT_SKILLS,
      projects: DEMO_STUDENT_PROJECTS,
      opportunity: minimalRole,
    })

    // Missing criteria must not arbitrarily fail the candidate
    expect(result.isEligible).toBe(true)
    expect(result.unknownCriteria.length).toBeGreaterThan(0)
    expect(result.unknownCriteria).toContain('Eligible academic years not stated')
    expect(result.unknownCriteria).toContain('Degree requirements not stated')
  })
})
