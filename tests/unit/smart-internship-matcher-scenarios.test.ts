import { describe, expect, it } from 'vitest'
import { calculateMatch } from '@/lib/matching/engine'
import {
  extractRequirementsDeterministically,
  buildOpportunityFromExtraction,
} from '@/features/opportunities/extraction/requirement-extractor'
import type { Opportunity, ProjectItem, RawSearchResult, SkillEvidenceItem, StudentProfile } from '@/types'

describe('Smart Internship Matcher — 10 Core Product Scenarios', () => {
  const baseStudent: StudentProfile = {
    id: 'student-scenario-base',
    fullName: 'Aditya Verma',
    email: 'aditya@example.edu',
    degree: 'B.Tech',
    branch: 'Computer Science and Engineering',
    university: 'National Institute of Technology',
    currentYear: 3,
    graduationYear: 2026,
    academicMetric: '8.5',
    isAcademicMetricConfirmed: true,
    location: 'Bengaluru',
    targetRole: 'Full Stack Engineer',
    preferredLocations: ['Bengaluru', 'Remote'],
    workModePreference: 'hybrid',
    availableDurationMonths: 6,
    careerInterests: ['Web Development', 'Distributed Systems'],
  }

  const baseOpportunity: Opportunity = {
    id: 'opp-scenario-base',
    companyName: 'Razorpay',
    companyLogo: 'https://example.com/logo.png',
    roleTitle: 'Software Engineering Intern',
    category: 'Full Stack',
    description: 'Looking for 3rd or 4th year B.Tech engineering interns skilled in React and TypeScript.',
    location: 'Bengaluru',
    workMode: 'hybrid',
    internshipDurationMonths: 3,
    stipendAmount: 45000,
    stipendCurrency: 'INR',
    stipendPeriod: 'month',
    applicationUrl: 'https://razorpay.com/careers/intern-101',
    source: 'Razorpay ATS',
    postedAt: new Date().toISOString(),
    deadline: '2026-11-30',
    eligibleYears: [3, 4],
    eligibleDegrees: ['B.Tech', 'B.E'],
    requiredSkills: ['React', 'TypeScript', 'Node.js'],
    preferredSkills: ['PostgreSQL', 'Docker'],
    minCgpa: 7.5,
  }

  // SCENARIO 1: Strong candidate
  // Student satisfies the mandatory requirements and most skills.
  // Expected: Eligible, strong match, APPLY NOW.
  it('Scenario 1: Strong candidate receives APPLY NOW recommendation with high match score', () => {
    const strongSkills: SkillEvidenceItem[] = [
      {
        skillName: 'React',
        category: 'frontend',
        confidence: 90,
        evidenceSources: ['project', 'resume', 'assessment'],
        projectCount: 2,
        githubStrength: 'strong',
        assessmentScore: 92,
      },
      {
        skillName: 'TypeScript',
        category: 'languages',
        confidence: 88,
        evidenceSources: ['project', 'resume'],
        projectCount: 2,
        githubStrength: 'strong',
      },
      {
        skillName: 'Node.js',
        category: 'backend',
        confidence: 85,
        evidenceSources: ['project', 'resume'],
        projectCount: 1,
        githubStrength: 'moderate',
      },
      {
        skillName: 'PostgreSQL',
        category: 'data',
        confidence: 80,
        evidenceSources: ['resume'],
        projectCount: 1,
        githubStrength: 'moderate',
      },
    ]

    const strongProjects: ProjectItem[] = [
      {
        id: 'proj-1',
        studentId: baseStudent.id,
        title: 'Full Stack E-Commerce Engine',
        description: 'Microservices architecture with React, TypeScript, and Node.js.',
        technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        evidenceStrength: 'strong',
        highlights: ['Handles 1000 requests/min', 'Deployed on AWS'],
      },
    ]

    const match = calculateMatch({
      student: baseStudent,
      skills: strongSkills,
      projects: strongProjects,
      opportunity: baseOpportunity,
    })

    expect(match.isEligible).toBe(true)
    expect(match.eligibilityStatus).toBe('Eligible')
    expect(match.overallMatchScore).toBeGreaterThanOrEqual(80)
    expect(match.recommendation).toBe('APPLY NOW')
    expect(match.skillsMatched).toEqual(expect.arrayContaining(['React', 'TypeScript', 'Node.js']))
    expect(match.whyMatched.length).toBeGreaterThan(0)
  })

  // SCENARIO 2: Missing technical skills
  // Student satisfies education and eligibility requirements but lacks two required skills.
  // Expected: Eligible, reduced match, explicit skill gaps and PREPARE FIRST where appropriate.
  it('Scenario 2: Missing technical skills triggers PREPARE FIRST and explicit skill gaps', () => {
    // Only has React, lacks TypeScript and Node.js
    const partialSkills: SkillEvidenceItem[] = [
      {
        skillName: 'React',
        category: 'frontend',
        confidence: 85,
        evidenceSources: ['resume'],
        projectCount: 1,
        githubStrength: 'moderate',
      },
    ]

    const match = calculateMatch({
      student: baseStudent,
      skills: partialSkills,
      projects: [],
      opportunity: baseOpportunity,
    })

    expect(match.isEligible).toBe(true)
    expect(match.eligibilityStatus).toBe('Eligible')
    expect(match.recommendation).toBe('PREPARE FIRST')
    expect(match.requiredSkillsMissing).toContain('TypeScript')
    expect(match.requiredSkillsMissing).toContain('Node.js')
    expect(match.overallMatchScore).toBeLessThan(80)
    expect(match.missingSkills.length).toBeGreaterThanOrEqual(2)
  })

  // SCENARIO 3: Degree mismatch
  // Student does not satisfy a mandatory degree requirement.
  // Expected: INELIGIBLE, regardless of numerical score.
  it('Scenario 3: Degree mismatch enforces hard ineligibility regardless of skill alignment', () => {
    const designStudent: StudentProfile = {
      ...baseStudent,
      degree: 'Bachelor of Design (B.Des)',
    }

    const allSkills: SkillEvidenceItem[] = [
      { skillName: 'React', category: 'frontend', confidence: 95, evidenceSources: ['resume'], projectCount: 3, githubStrength: 'strong' },
      { skillName: 'TypeScript', category: 'languages', confidence: 95, evidenceSources: ['resume'], projectCount: 3, githubStrength: 'strong' },
      { skillName: 'Node.js', category: 'backend', confidence: 95, evidenceSources: ['resume'], projectCount: 2, githubStrength: 'strong' },
    ]

    const match = calculateMatch({
      student: designStudent,
      skills: allSkills,
      projects: [],
      opportunity: baseOpportunity,
    })

    expect(match.isEligible).toBe(false)
    expect(match.eligibilityStatus).toBe('Ineligible')
    expect(['SKIP', 'NOT ELIGIBLE']).toContain(match.recommendation)
    expect(match.eligibilityScore).toBeLessThan(50)
    expect(match.eligibilityNotes.some((n) => n.toLowerCase().includes('degree'))).toBe(true)
  })

  // SCENARIO 4: Academic year mismatch
  // Student does not satisfy a mandatory year restriction.
  // Expected: INELIGIBLE.
  it('Scenario 4: Academic year mismatch triggers hard ineligibility', () => {
    const firstYearStudent: StudentProfile = {
      ...baseStudent,
      currentYear: 1,
      graduationYear: 2028,
    }

    const match = calculateMatch({
      student: firstYearStudent,
      skills: [],
      projects: [],
      opportunity: baseOpportunity, // requires year [3, 4]
    })

    expect(match.isEligible).toBe(false)
    expect(match.eligibilityStatus).toBe('Ineligible')
    expect(['SKIP', 'NOT ELIGIBLE']).toContain(match.recommendation)
    expect(match.eligibilityNotes.some((n) => n.toLowerCase().includes('targets') || n.toLowerCase().includes('year'))).toBe(true)
  })

  // SCENARIO 5: Unknown information
  // Internship description does not specify a degree, location or duration.
  // Expected: Those fields remain unknown. No invented restrictions.
  it('Scenario 5: Unknown information does not invent restrictions or penalize the candidate', () => {
    const rawListing: RawSearchResult = {
      title: 'Software Developer Intern',
      url: 'https://startup.io/careers/intern',
      domain: 'startup.io',
      snippet: 'We are looking for an ambitious Software Developer Intern to join our engineering crew. Flexible culture.',
      source: 'Startup.io Careers',
      discoveredAt: new Date().toISOString(),
    }

    const extracted = extractRequirementsDeterministically(rawListing)
    const opp = buildOpportunityFromExtraction('opp-unknown-info', rawListing, extracted)

    // Verify parser did not invent convenient defaults
    expect(opp.eligibleDegrees).toEqual([])
    expect(opp.eligibleYears).toEqual([])
    expect(opp.internshipDurationMonths).toBe(0)
    expect(opp.location.toLowerCase()).toContain('unspecified')

    const match = calculateMatch({
      student: baseStudent,
      skills: [],
      projects: [],
      opportunity: opp,
    })

    // Unknown fields should be recorded in unknownCriteria, not treated as hard failures
    expect(match.unknownCriteria).toContain('Eligible academic years not stated')
    expect(match.unknownCriteria).toContain('Degree requirements not stated')
    expect(match.isEligible).toBe(true)
  })

  // SCENARIO 6: Student without previous work experience
  // Internship does not require prior experience.
  // Expected: No unfair experience penalty.
  it('Scenario 6: Entry-level internship does not penalize students with zero prior professional experience', () => {
    const fresherStudent: StudentProfile = {
      ...baseStudent,
      experiences: [], // Zero previous internships or employment
    }

    const entryLevelOpp: Opportunity = {
      ...baseOpportunity,
      experienceRequirements: undefined, // No prior experience required
    }

    const match = calculateMatch({
      student: fresherStudent,
      skills: [],
      projects: [],
      opportunity: entryLevelOpp,
    })

    // Baseline experience score must be full 100% without penalty
    expect(match.experienceScore).toBe(100)
    expect(match.whyMatched.some((w) => w.includes('prior professional experience is not required'))).toBe(true)
  })

  // SCENARIO 7: Strong project evidence
  // Student has relevant projects but no professional experience.
  // Expected: Project evidence contributes to matching independently of employment experience.
  it('Scenario 7: Strong project evidence contributes independently to matching score', () => {
    const studentWithProjectsOnly: StudentProfile = {
      ...baseStudent,
      experiences: [],
    }

    const robustProjects: ProjectItem[] = [
      {
        id: 'proj-7a',
        studentId: baseStudent.id,
        title: 'Distributed Event Store',
        description: 'React, TypeScript, and Node.js high-throughput ledger.',
        technologies: ['React', 'TypeScript', 'Node.js'],
        evidenceStrength: 'strong',
        highlights: ['Benchmarked with 5000 RPS'],
      },
      {
        id: 'proj-7b',
        studentId: baseStudent.id,
        title: 'Full Stack Dashboard',
        description: 'React analytics interface.',
        technologies: ['React', 'TypeScript'],
        evidenceStrength: 'strong',
        highlights: ['Production deployment with 200 users'],
      },
    ]

    const match = calculateMatch({
      student: studentWithProjectsOnly,
      skills: [],
      projects: robustProjects,
      opportunity: baseOpportunity,
    })

    expect(match.projectScore).toBeGreaterThanOrEqual(70)
    expect(match.whyMatched.some((w) => w.toLowerCase().includes('project'))).toBe(true)
  })

  // SCENARIO 8: Incomplete internship description
  // Only a search snippet is available.
  // Expected: Listing is marked partially verified and uncertain criteria are disclosed.
  it('Scenario 8: Incomplete snippet listing is marked partially verified with uncertain criteria disclosed', () => {
    const snippetOnlyResult: RawSearchResult = {
      title: 'Frontend Intern - FinTech Hub',
      url: 'https://fintechhub.com/jobs/123',
      domain: 'fintechhub.com',
      snippet: 'Looking for a Frontend Intern with React skills. Quick apply via link.',
      source: 'FinTech Hub',
      discoveredAt: new Date().toISOString(),
    }

    // No full description available (< 150 characters)
    const extracted = extractRequirementsDeterministically(snippetOnlyResult)
    const opp = buildOpportunityFromExtraction('opp-partially-verified', snippetOnlyResult, extracted)

    expect(opp.isPartiallyVerified).toBe(true)
    expect(opp.requiredSkills).toContain('React')

    const match = calculateMatch({
      student: baseStudent,
      skills: [{ skillName: 'React', category: 'frontend', confidence: 80, evidenceSources: ['resume'], projectCount: 1, githubStrength: 'moderate' }],
      projects: [],
      opportunity: opp,
    })

    expect(match.unknownCriteria.length).toBeGreaterThan(0)
    expect(match.unknownCriteria).toContain('Eligible academic years not stated')
    expect(match.unknownCriteria).toContain('Degree requirements not stated')
  })

  // SCENARIO 9: Multiple opportunities comparison
  // Student compares several internships.
  // Expected: Accurate comparison and recommendation of the strongest genuinely eligible opportunity.
  it('Scenario 9: Multi-opportunity comparison identifies and highlights the top eligible fit', () => {
    const studentSkills: SkillEvidenceItem[] = [
      { skillName: 'React', category: 'frontend', confidence: 90, evidenceSources: ['project', 'resume'], projectCount: 2, githubStrength: 'strong' },
      { skillName: 'TypeScript', category: 'languages', confidence: 85, evidenceSources: ['project', 'resume'], projectCount: 2, githubStrength: 'strong' },
    ]

    // Opportunity A: Strong fit (90%+), Eligible
    const oppA: Opportunity = {
      ...baseOpportunity,
      id: 'opp-a-strong',
      roleTitle: 'React Frontend Intern',
      requiredSkills: ['React', 'TypeScript'],
      eligibleDegrees: ['B.Tech'],
      eligibleYears: [3, 4],
    }

    // Opportunity B: Ineligible degree (Requires MBBS / Medicine only)
    const oppB: Opportunity = {
      ...baseOpportunity,
      id: 'opp-b-ineligible',
      roleTitle: 'Clinical Data Intern',
      requiredSkills: ['React'],
      eligibleDegrees: ['MBBS', 'MD'],
      eligibleYears: [3, 4],
    }

    // Opportunity C: Lower match score due to missing Python & PyTorch
    const oppC: Opportunity = {
      ...baseOpportunity,
      id: 'opp-c-partial',
      roleTitle: 'AI Research Intern',
      requiredSkills: ['React', 'PyTorch', 'Python', 'CUDA'],
      eligibleDegrees: ['B.Tech'],
      eligibleYears: [3, 4],
    }

    const matchA = calculateMatch({ student: baseStudent, skills: studentSkills, projects: [], opportunity: oppA })
    const matchB = calculateMatch({ student: baseStudent, skills: studentSkills, projects: [], opportunity: oppB })
    const matchC = calculateMatch({ student: baseStudent, skills: studentSkills, projects: [], opportunity: oppC })

    const compared = [
      { opp: oppA, match: matchA },
      { opp: oppB, match: matchB },
      { opp: oppC, match: matchC },
    ]

    // Disqualify hard ineligible opportunities from top fit
    const eligibleCompared = compared.filter(
      (c) => c.match.recommendation !== 'NOT ELIGIBLE' && c.match.recommendation !== 'SKIP' && c.match.isEligible !== false
    )

    const topFit = eligibleCompared.reduce((best, curr) =>
      curr.match.overallMatchScore > best.match.overallMatchScore ? curr : best
    )

    expect(topFit.opp.id).toBe('opp-a-strong')
    expect(topFit.match.isEligible).toBe(true)
    expect(matchB.isEligible).toBe(false) // oppB disqualified
    expect(topFit.match.overallMatchScore).toBeGreaterThan(matchC.overallMatchScore)
  })

  // SCENARIO 10: Persistent profile
  // Student uploads and confirms a resume, logs out and logs back in.
  // Expected: Confirmed profile information remains available and matching still works.
  it('Scenario 10: Confirmed profile state retains experiences, certifications, and academic validation', () => {
    // Simulated persistent profile loaded after session restoration
    const restoredProfile: StudentProfile = {
      ...baseStudent,
      experiences: [
        {
          id: 'exp-saved-1',
          company: 'TechCorp Solutions',
          roleTitle: 'Frontend Intern',
          duration: '3 months',
          summary: 'Developed dashboard in React and TypeScript.',
          isVerified: true,
          source: 'resume',
        },
      ],
      certifications: [
        {
          id: 'cert-saved-1',
          name: 'AWS Certified Cloud Practitioner',
          issuer: 'Amazon Web Services',
          year: 2025,
          isVerified: true,
          source: 'resume',
        },
      ],
      isAcademicMetricConfirmed: true,
      isCurrentYearConfirmed: true,
    }

    const match = calculateMatch({
      student: restoredProfile,
      skills: [
        { skillName: 'React', category: 'frontend', confidence: 90, evidenceSources: ['resume'], projectCount: 1, githubStrength: 'strong' },
      ],
      projects: [],
      opportunity: baseOpportunity,
    })

    expect(match.experienceScore).toBeGreaterThanOrEqual(80)
    expect(match.isEligible).toBe(true)
    expect(match.whyMatched.some((w) => w.includes('TechCorp Solutions'))).toBe(true)
    expect(restoredProfile.experiences?.length).toBe(1)
    expect(restoredProfile.certifications?.length).toBe(1)
  })
})
