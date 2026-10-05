import type { Opportunity, SkillGapPlan, SkillGapPlanDay } from '@/types'

/**
 * 14-Day Skill Gap Roadmap Synthesizer
 * Generates an actionable, progressive preparation sprint targeting missing skills.
 */
export function generateSkillGapRoadmap(
  opportunity: Opportunity,
  missingSkills: string[]
): SkillGapPlan {
  const criticalGaps: string[] = []
  const importantGaps: string[] = []
  const niceToHaveGaps: string[] = []

  // Classify gaps based on whether they were required vs preferred
  missingSkills.forEach((skill) => {
    const isRequired = opportunity.requiredSkills.some(
      (r) => r.toLowerCase() === skill.toLowerCase()
    )
    if (isRequired) {
      if (criticalGaps.length < 2) {
        criticalGaps.push(skill)
      } else {
        importantGaps.push(skill)
      }
    } else {
      niceToHaveGaps.push(skill)
    }
  })

  // Ensure at least one primary skill focus
  const primarySkill = criticalGaps[0] || importantGaps[0] || 'Core Domain Principles'
  const secondarySkill = criticalGaps[1] || importantGaps[1] || niceToHaveGaps[0] || 'Applied Integration'

  const dailyPlan: SkillGapPlanDay[] = [
    {
      day: 1,
      title: `${primarySkill} Fundamentals & Setup`,
      objective: `Establish development environment and understand the core architecture of ${primarySkill}.`,
      tasks: [
        `Review official documentation and key mental models for ${primarySkill}.`,
        `Set up local repository with linting and unit test framework.`,
        `Implement 3 foundational hello-world exercises.`,
      ],
      resources: [
        { label: `${primarySkill} Official Docs`, url: '#' },
        { label: 'Environment Setup Guide', url: '#' },
      ],
    },
    {
      day: 2,
      title: `${primarySkill} Core Patterns & Syntax`,
      objective: `Master standard idioms and syntax patterns expected in technical interviews.`,
      tasks: [
        `Solve 5 intermediate practice problems testing core data structures.`,
        `Study common anti-patterns and performance bottlenecks.`,
        `Document key learnings in your technical notebook.`,
      ],
      resources: [
        { label: 'Interactive Practice Exercises', url: '#' },
        { label: 'Standard Coding Conventions', url: '#' },
      ],
    },
    {
      day: 3,
      title: 'State & Data Pipeline Management',
      objective: `Learn how data flows through ${primarySkill} in production pipelines.`,
      tasks: [
        `Build a modular component or service that parses and validates inputs.`,
        `Connect to a local mock dataset or REST/GraphQL endpoint.`,
        `Write basic unit tests validating edge cases.`,
      ],
      resources: [{ label: 'Data Architecture Patterns', url: '#' }],
    },
    {
      day: 4,
      title: `${secondarySkill} Overview & Interoperability`,
      objective: `Introduce ${secondarySkill} and understand how it connects with ${primarySkill}.`,
      tasks: [
        `Explore the primary use cases and industry benchmarks for ${secondarySkill}.`,
        `Install dependencies and configure integration bridge.`,
        `Run sample end-to-end integration test.`,
      ],
      resources: [{ label: `${secondarySkill} Quickstart Guide`, url: '#' }],
    },
    {
      day: 5,
      title: 'Mid-Sprint Checkpoint & Review',
      objective: `Consolidate progress through code review and flashcard recall.`,
      tasks: [
        `Refactor code written in Days 1-4 for readability and maintainability.`,
        `Take a 10-question self-assessment on ${primarySkill}.`,
        `Ensure clean Git commit history on your preparation repo.`,
      ],
      resources: [{ label: 'Self-Assessment Quiz', url: '#' }],
    },
    {
      day: 6,
      title: 'Real-world Architecture & Error Handling',
      objective: `Implement resilient exception handling and logging.`,
      tasks: [
        `Add structured logging and graceful fallbacks to your scripts.`,
        `Simulate network failures and corrupted payloads.`,
      ],
      resources: [{ label: 'Production Engineering Best Practices', url: '#' }],
    },
    {
      day: 7,
      title: 'Mini-Project Blueprinting',
      objective: `Design a standalone portfolio project that demonstrates ${primarySkill} and ${secondarySkill}.`,
      tasks: [
        `Write a 1-page design doc describing problem statement and architecture.`,
        `Draft database schema or data pipeline diagram.`,
        `Initialize GitHub repo with structured README.md.`,
      ],
      resources: [{ label: 'Portfolio Project Guidelines', url: '#' }],
    },
    {
      day: 8,
      title: 'Mini-Project Core Implementation (Part 1)',
      objective: `Build core business logic of the portfolio project.`,
      tasks: [
        `Implement main processing algorithms.`,
        `Set up automated continuous integration (CI) tests on GitHub.`,
      ],
      resources: [{ label: 'GitHub Actions Starter', url: '#' }],
    },
    {
      day: 9,
      title: 'Mini-Project Integration (Part 2)',
      objective: `Connect user interface or public API endpoints.`,
      tasks: [
        `Complete client or endpoint integrations.`,
        `Benchmark execution latency and optimize where necessary.`,
      ],
      resources: [{ label: 'API Performance Tuning', url: '#' }],
    },
    {
      day: 10,
      title: 'Documentation & Interactive Demo',
      objective: `Make the repository verifiable for recruiter and hiring manager review.`,
      tasks: [
        `Deploy working demo to Vercel/Render/Streamlit.`,
        `Record 60-second GIF walkthrough and embed in README.`,
        `Link live demo and repo URL to your InternSync profile.`,
      ],
      resources: [{ label: 'README Presentation Guide', url: '#' }],
    },
    {
      day: 11,
      title: 'Interview Reasoning & Code Walkthrough',
      objective: `Prepare to explain technical trade-offs verbally.`,
      tasks: [
        `Practice answering: "Why did you choose this architecture over alternatives?"`,
        `Conduct a mock technical interview answering domain questions.`,
      ],
      resources: [{ label: 'Common Technical Interview Questions', url: '#' }],
    },
    {
      day: 12,
      title: 'InternSync Skill Lab Validation',
      objective: `Validate newly acquired knowledge with official signal assessments.`,
      tasks: [
        `Take the InternSync Skill Lab assessment for ${primarySkill}.`,
        `Achieve a verified score >= 70% to update your Career DNA confidence.`,
      ],
      resources: [{ label: 'InternSync Skill Lab', url: '#' }],
    },
    {
      day: 13,
      title: 'Application Materials Tailoring',
      objective: `Align your resume bullet points with the target opportunity.`,
      tasks: [
        `Add your newly built mini-project to your resume with metric-driven bullet points.`,
        `Craft a concise, tailored note explaining why you're ready for ${opportunity.roleTitle}.`,
      ],
      resources: [{ label: 'STAR Format Guide for Students', url: '#' }],
    },
    {
      day: 14,
      title: 'Final Review & Apply',
      objective: `Execute application submission with elevated evidence.`,
      tasks: [
        `Final verification of application requirements and deadlines.`,
        `Submit application via ${opportunity.companyName}'s official portal.`,
        `Log application in the InternSync Kanban tracker under "Applied".`,
      ],
      resources: [{ label: 'Application Checklist', url: '#' }],
    },
  ]

  return {
    opportunityId: opportunity.id,
    roleTitle: opportunity.roleTitle,
    companyName: opportunity.companyName,
    durationDays: 14,
    criticalGaps,
    importantGaps,
    niceToHaveGaps,
    dailyPlan,
    outcomeSummary:
      'After completing this plan, your profile should have stronger evidence for this role. (Note: Match scores update as you add verifiable project and assessment proof).',
  }
}
