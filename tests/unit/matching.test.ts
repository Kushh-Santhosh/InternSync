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
  it('calculates APPLY NOW for high-affinity role (Demo Labs AI Intern)', () => {
    const opp = SEED_OPPORTUNITIES.find((o) => o.id === 'opp-ai-demo-labs')!
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

  it('calculates PREPARE FIRST for role with addressable skill gap (VisionForge ML Intern)', () => {
    const opp = SEED_OPPORTUNITIES.find((o) => o.id === 'opp-ml-visionforge')!
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

  it('calculates SKIP for hard eligibility mismatch (4th-year only distributed systems)', () => {
    const opp = SEED_OPPORTUNITIES.find((o) => o.id === 'opp-be-hyperscale')!
    const result = calculateMatch({
      student: DEMO_STUDENT_PROFILE,
      skills: DEMO_STUDENT_SKILLS,
      projects: DEMO_STUDENT_PROJECTS,
      opportunity: opp,
    })

    expect(result.recommendation).toBe('SKIP')
    expect(result.eligibilityScore).toBeLessThan(50)
  })
})

describe('14-Day Skill Gap Roadmap Synthesizer', () => {
  it('generates a 14-day structured timeline targeting missing skills', () => {
    const opp = SEED_OPPORTUNITIES.find((o) => o.id === 'opp-ml-visionforge')!
    const roadmap = generateSkillGapRoadmap(opp, ['PyTorch', 'Computer Vision'])

    expect(roadmap.durationDays).toBe(14)
    expect(roadmap.dailyPlan.length).toBe(14)
    expect(roadmap.criticalGaps).toContain('PyTorch')
    expect(roadmap.dailyPlan[0].day).toBe(1)
    expect(roadmap.dailyPlan[13].day).toBe(14)
  })
})
