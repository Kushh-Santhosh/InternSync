import type { Opportunity, SkillGapPlan, SkillGapPlanDay } from '@/types'

/**
 * Authoritative, verified learning resource registry.
 * Zero placeholder '#' links; every URL points to official documentation,
 * established guides, or canonical reference materials.
 */
const SKILL_RESOURCE_MAP: Record<string, { label: string; url: string }[]> = {
  python: [
    { label: 'Official Python Tutorial', url: 'https://docs.python.org/3/tutorial/' },
    { label: 'Real Python Architecture & Idioms', url: 'https://realpython.com/' },
  ],
  react: [
    { label: 'React Official Documentation', url: 'https://react.dev/learn' },
    { label: 'Building Interactive UI with React (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/React_getting_started' },
  ],
  typescript: [
    { label: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
    { label: 'TypeScript in 5 Minutes', url: 'https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html' },
  ],
  javascript: [
    { label: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide' },
    { label: 'Modern JavaScript Tutorial', url: 'https://javascript.info/' },
  ],
  fastapi: [
    { label: 'FastAPI Tutorial - First Steps', url: 'https://fastapi.tiangolo.com/tutorial/' },
    { label: 'Building Asynchronous Web APIs in Python', url: 'https://fastapi.tiangolo.com/features/' },
  ],
  pytorch: [
    { label: 'PyTorch Deep Learning Basics', url: 'https://pytorch.org/tutorials/beginner/basics/intro.html' },
    { label: 'PyTorch Tensor Fundamentals', url: 'https://pytorch.org/tutorials/beginner/basics/tensors_tutorial.html' },
  ],
  tensorflow: [
    { label: 'TensorFlow Quickstart for Beginners', url: 'https://www.tensorflow.org/tutorials/quickstart/beginner' },
    { label: 'TensorFlow Core Tutorials', url: 'https://www.tensorflow.org/tutorials' },
  ],
  'machine learning': [
    { label: 'Google Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course' },
    { label: 'Scikit-Learn Machine Learning Tutorials', url: 'https://scikit-learn.org/stable/tutorial/index.html' },
  ],
  sql: [
    { label: 'PostgreSQL Official Tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html' },
    { label: 'SQLZoo Interactive SQL Exercises', url: 'https://sqlzoo.net/' },
  ],
  postgresql: [
    { label: 'PostgreSQL Documentation', url: 'https://www.postgresql.org/docs/current/' },
    { label: 'Postgres Tutorial (Command Line & Queries)', url: 'https://www.postgresqltutorial.com/' },
  ],
  docker: [
    { label: 'Docker Getting Started Guide', url: 'https://docs.docker.com/get-started/' },
    { label: 'Docker Hands-On Labs', url: 'https://docs.docker.com/get-started/workshop/' },
  ],
  git: [
    { label: 'Pro Git Book (Official Free Edition)', url: 'https://git-scm.com/book/en/v2' },
    { label: 'GitHub Interactive Git Cheat Sheet', url: 'https://education.github.com/git-cheat-sheet-education.pdf' },
  ],
  'node.js': [
    { label: 'Node.js Official Learning Journey', url: 'https://nodejs.org/en/learn' },
    { label: 'MDN Server-side Website Programming (Node)', url: 'https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs' },
  ],
  'tailwind css': [
    { label: 'Tailwind CSS Documentation', url: 'https://tailwindcss.com/docs' },
    { label: 'Responsive Design in Tailwind', url: 'https://tailwindcss.com/docs/responsive-design' },
  ],
  'next.js': [
    { label: 'Next.js App Router Documentation', url: 'https://nextjs.org/docs' },
    { label: 'Next.js Foundations Course', url: 'https://nextjs.org/learn' },
  ],
  graphql: [
    { label: 'GraphQL Official Introduction', url: 'https://graphql.org/learn/' },
    { label: 'How to GraphQL Full Course', url: 'https://www.howtographql.com/' },
  ],
  mongodb: [
    { label: 'MongoDB University Documentation', url: 'https://www.mongodb.com/docs/manual/tutorial/' },
  ],
  redis: [
    { label: 'Redis Official Documentation', url: 'https://redis.io/docs/latest/develop/' },
  ],
  'data structures': [
    { label: 'LeetCode Explore Data Structures', url: 'https://leetcode.com/explore/' },
    { label: 'GeeksforGeeks DSA Guide', url: 'https://www.geeksforgeeks.org/data-structures/' },
  ],
  'system design': [
    { label: 'System Design Primer (Open Source)', url: 'https://github.com/donnemartin/system-design-primer' },
  ],
  figma: [
    { label: 'Figma Help Center & Design Tutorials', url: 'https://help.figma.com/hc/en-us' },
    { label: 'Figma Auto Layout & Components Guide', url: 'https://help.figma.com/hc/en-us/articles/360040451373-Explore-auto-layout-properties' },
  ],
}

/**
 * Returns canonical verified learning resources for a given skill
 */
export function getResourcesForSkill(skillName: string): { label: string; url: string }[] {
  const normalized = skillName.toLowerCase().trim()
  if (SKILL_RESOURCE_MAP[normalized]) {
    return SKILL_RESOURCE_MAP[normalized]
  }

  // Check substring matches
  for (const [key, resources] of Object.entries(SKILL_RESOURCE_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return resources
    }
  }

  // Authoritative fallback: MDN Web Docs search or official documentation
  return [
    {
      label: `${skillName} Official Documentation`,
      url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(skillName)}`,
    },
    {
      label: `${skillName} Open Curriculum (freeCodeCamp)`,
      url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(skillName)}`,
    },
  ]
}

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

  const primaryResources = getResourcesForSkill(primarySkill)
  const secondaryResources = getResourcesForSkill(secondarySkill)

  const dailyPlan: SkillGapPlanDay[] = [
    {
      day: 1,
      title: `${primarySkill} Fundamentals & Setup`,
      objective: `Establish development environment and master foundational architecture of ${primarySkill}.`,
      tasks: [
        `Review official documentation and core mental models for ${primarySkill}.`,
        `Set up local repository with linting, formatting, and unit testing framework.`,
        `Implement 3 foundational exercise problems testing basic syntax and primitives.`,
      ],
      estimatedMinutes: 90,
      expectedOutcome: `Working local development environment and solid understanding of ${primarySkill} primitives.`,
      resources: primaryResources,
      completed: false,
    },
    {
      day: 2,
      title: `${primarySkill} Idioms & Design Patterns`,
      objective: `Master standard idioms and clean code patterns expected in technical interviews.`,
      tasks: [
        `Solve 5 intermediate practice exercises implementing common data structures in ${primarySkill}.`,
        `Study common performance bottlenecks and anti-patterns.`,
        `Document key learnings and architectural choices in a local README.`,
      ],
      estimatedMinutes: 90,
      expectedOutcome: `Confidence in writing readable, idiomatically correct ${primarySkill} code.`,
      resources: primaryResources,
      completed: false,
    },
    {
      day: 3,
      title: 'State & Data Pipeline Management',
      objective: `Understand how data flows through ${primarySkill} in production environments.`,
      tasks: [
        `Build a modular component or service that parses and validates untrusted inputs.`,
        `Connect to a local mock dataset or REST/GraphQL endpoint.`,
        `Write unit tests validating edge cases and malformed inputs.`,
      ],
      estimatedMinutes: 105,
      expectedOutcome: `A working data processing module with comprehensive unit tests.`,
      resources: [
        ...primaryResources.slice(0, 1),
        { label: 'Software Testing Best Practices (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Cross_browser_testing/Introduction' },
      ],
      completed: false,
    },
    {
      day: 4,
      title: `${secondarySkill} Overview & Interoperability`,
      objective: `Introduce ${secondarySkill} and build an integration bridge with ${primarySkill}.`,
      tasks: [
        `Explore the primary use cases and industry benchmarks for ${secondarySkill}.`,
        `Install dependencies and configure connection interface.`,
        `Run sample end-to-end integration test validating connectivity.`,
      ],
      estimatedMinutes: 90,
      expectedOutcome: `Verified integration link connecting ${primarySkill} and ${secondarySkill}.`,
      resources: secondaryResources,
      completed: false,
    },
    {
      day: 5,
      title: 'Mid-Sprint Checkpoint & Review',
      objective: `Consolidate progress through code review and active recall.`,
      tasks: [
        `Refactor code written in Days 1-4 for clarity, performance, and modularity.`,
        `Take a 10-question self-assessment on ${primarySkill} concepts.`,
        `Ensure clean Git commit history on your preparation repository.`,
      ],
      estimatedMinutes: 75,
      expectedOutcome: `Clean Git history and reinforced recall of core concepts.`,
      resources: [
        { label: 'Pro Git Workflow & Commit Guidelines', url: 'https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project' },
      ],
      completed: false,
    },
    {
      day: 6,
      title: 'Resilient Architecture & Error Handling',
      objective: `Implement resilient exception handling, retry policies, and structured logging.`,
      tasks: [
        `Add structured logging and graceful fallbacks to your scripts.`,
        `Simulate network failures and corrupted payloads.`,
        `Verify error states do not crash application processes.`,
      ],
      estimatedMinutes: 90,
      expectedOutcome: `Production-ready error handling and clean recovery paths.`,
      resources: [
        { label: 'Twelve-Factor App Methodology', url: 'https://12factor.net/' },
      ],
      completed: false,
    },
    {
      day: 7,
      title: 'Mini-Project Blueprinting',
      objective: `Design a standalone portfolio project that demonstrates ${primarySkill} and ${secondarySkill}.`,
      tasks: [
        `Write a 1-page design doc describing problem statement, architecture, and technology stack.`,
        `Draft database schema or data pipeline flow diagram.`,
        `Initialize GitHub repository with structured README.md and license.`,
      ],
      estimatedMinutes: 90,
      expectedOutcome: `Clear technical specification and scaffolding for portfolio project.`,
      resources: [
        { label: 'GitHub Guide: Creating Standout Project Readmes', url: 'https://docs.github.com/en/get-started/writing-on-github' },
      ],
      completed: false,
    },
    {
      day: 8,
      title: 'Mini-Project Core Implementation (Part 1)',
      objective: `Build core business logic of the portfolio project.`,
      tasks: [
        `Implement main processing algorithms and services.`,
        `Set up automated continuous integration (CI) tests on GitHub Actions.`,
        `Verify automated build and test passes on push.`,
      ],
      estimatedMinutes: 120,
      expectedOutcome: `Functional core service logic with passing CI automation.`,
      resources: [
        { label: 'GitHub Actions Quickstart', url: 'https://docs.github.com/en/actions/quickstart' },
      ],
      completed: false,
    },
    {
      day: 9,
      title: 'Mini-Project Integration (Part 2)',
      objective: `Connect user interface or public API endpoints.`,
      tasks: [
        `Complete client interface or API endpoints with input validation.`,
        `Benchmark execution latency and optimize query response times.`,
        `Write integration tests covering end-to-end user workflows.`,
      ],
      estimatedMinutes: 120,
      expectedOutcome: `Complete end-to-end user flow connected to data store.`,
      resources: [
        ...secondaryResources.slice(0, 1),
        { label: 'Web Performance Optimization (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/Performance' },
      ],
      completed: false,
    },
    {
      day: 10,
      title: 'Documentation & Interactive Demo',
      objective: `Make the repository verifiable for recruiter and hiring manager review.`,
      tasks: [
        `Deploy working demo to Vercel, Render, or public cloud.`,
        `Record 60-second walkthrough GIF or screenshot gallery and embed in README.`,
        `Link live demo and repository URL to your InternSync profile.`,
      ],
      estimatedMinutes: 90,
      expectedOutcome: `Publicly accessible live demonstration and verified GitHub repository.`,
      resources: [
        { label: 'Vercel Deployment Documentation', url: 'https://vercel.com/docs' },
      ],
      completed: false,
    },
    {
      day: 11,
      title: 'Interview Reasoning & Code Walkthrough',
      objective: `Prepare to explain technical trade-offs verbally.`,
      tasks: [
        `Practice answering: "Why did you choose this architecture over alternatives?"`,
        `Conduct a mock technical interview answering domain questions for ${opportunity.roleTitle}.`,
        `Review data structures and algorithms relevant to ${primarySkill}.`,
      ],
      estimatedMinutes: 90,
      expectedOutcome: `Structured verbal articulation of technical trade-offs and design rationale.`,
      resources: [
        { label: 'System Design Primer (Interview Questions)', url: 'https://github.com/donnemartin/system-design-primer#system-design-interview-questions-with-solutions' },
      ],
      completed: false,
    },
    {
      day: 12,
      title: 'InternSync Skill Lab Validation',
      objective: `Validate newly acquired knowledge with official signal assessments.`,
      tasks: [
        `Take the InternSync Skill Lab assessment for ${primarySkill}.`,
        `Achieve a verified score >= 70% to update your Career DNA confidence.`,
        `Review any incorrect questions and document key learnings.`,
      ],
      estimatedMinutes: 60,
      expectedOutcome: `Objective Skill Lab score recorded in your student profile.`,
      resources: [
        { label: 'MDN Web Technology Reference', url: 'https://developer.mozilla.org/en-US/docs/Web' },
      ],
      completed: false,
    },
    {
      day: 13,
      title: 'Evidence-Based Resume Tuning',
      objective: `Align your project bullet points with ${opportunity.companyName}'s requirements.`,
      tasks: [
        `Add your newly built mini-project to your resume with metric-driven, truthful bullets.`,
        `Use the InternSync Resume Improvement Workspace to refine clarity without fabricating claims.`,
        `Confirm that every technical skill mentioned is backed by verifiable project evidence.`,
      ],
      estimatedMinutes: 60,
      expectedOutcome: `Grounded, truthful resume draft specifically aligned with ${opportunity.roleTitle}.`,
      resources: [
        { label: 'Harvard Resume & Bullet Point Guidelines', url: 'https://careerservices.fas.harvard.edu/resources/bullet-point-resume-template/' },
      ],
      completed: false,
    },
    {
      day: 14,
      title: 'Final Review & Application Submission',
      objective: `Submit application through official channels with verified proof.`,
      tasks: [
        `Final verification of application requirements, location alignment, and deadlines.`,
        `Submit application via ${opportunity.companyName}'s official portal.`,
        `Log application in the InternSync tracker under "Applied" with notes.`,
      ],
      estimatedMinutes: 45,
      expectedOutcome: `Application submitted with elevated evidence and tracked in your pipeline.`,
      resources: [
        { label: 'Application Checklist & Follow-up Etiquette', url: 'https://www.freecodecamp.org/news/how-to-apply-for-tech-jobs/' },
      ],
      completed: false,
    },
  ]

  let outcomeSummary = `This 14-day sprint bridges core skill requirements in ${criticalGaps.concat(importantGaps).slice(0, 3).join(', ')} with real projects and verified signals. Match scores update automatically as you add verifiable project evidence.`

  // Clarify mandatory eligibility constraint if present
  if (opportunity.eligibleYears && opportunity.eligibleYears.length > 0) {
    outcomeSummary += ` Note: Confirm that your academic standing matches ${opportunity.eligibleYears.join('/')} to satisfy hard eligibility requirements.`
  }

  return {
    opportunityId: opportunity.id,
    roleTitle: opportunity.roleTitle,
    companyName: opportunity.companyName,
    durationDays: 14,
    criticalGaps,
    importantGaps,
    niceToHaveGaps,
    dailyPlan,
    outcomeSummary,
  }
}
