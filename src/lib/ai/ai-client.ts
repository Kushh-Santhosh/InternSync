import type {
  AssistantMessage,
  CareerDirectionRoleFit,
  Opportunity,
  StudentProfile,
} from '@/types'
import type { AIProvider, StructuredResumeResult } from './ai-provider'

/**
 * Deterministic Demo AI Provider
 * Provides competition-grade fallback behavior without external API dependencies.
 */
export class DemoAIProvider implements AIProvider {
  name = 'Deterministic Demo Intelligence Engine'

  async analyzeResume(resumeText: string): Promise<StructuredResumeResult> {
    // Return structured profile calibrated for candidate
    return {
      personal: {
        fullName: 'Student Candidate',
        email: 'student@university.edu',
        location: 'Bengaluru / Remote',
        university: 'Engineering University',
        degree: 'B.Tech',
        branch: 'Computer Science & Engineering',
        currentYear: 3,
        graduationYear: 2026,
      },
      skills: [
        { name: 'Python', category: 'languages', confidence: 91 },
        { name: 'React', category: 'frontend', confidence: 84 },
        { name: 'TypeScript', category: 'languages', confidence: 78 },
        { name: 'Machine Learning', category: 'ai_ml', confidence: 67 },
        { name: 'SQL', category: 'data', confidence: 65 },
        { name: 'Node.js', category: 'backend', confidence: 70 },
        { name: 'Git', category: 'tools', confidence: 85 },
      ],
      projects: [
        {
          title: 'AI Study Assistant',
          description:
            'Interactive document querying app combining vector embeddings with React and FastAPI to summarize course materials.',
          technologies: ['Python', 'FastAPI', 'React', 'TypeScript', 'Machine Learning'],
          evidenceStrength: 'strong',
          highlights: [
            'Indexed 500+ lecture slides using vector search',
            'Implemented streaming chat response UI with React',
            'Achieved sub-200ms document retrieval',
          ],
        },
        {
          title: 'Smart Attendance System',
          description:
            'Computer-vision powered classroom attendance automation using facial recognition embeddings and SQLite storage.',
          technologies: ['Python', 'Computer Vision', 'SQL', 'Git'],
          evidenceStrength: 'moderate',
          highlights: [
            'Automated attendance for a 60-student batch',
            'Integrated local SQLite database for student records',
          ],
        },
        {
          title: 'DevPortfolio Builder',
          description:
            'Minimalist static site generator for student developers with automatic GitHub repo ingestion.',
          technologies: ['React', 'TypeScript', 'Tailwind CSS'],
          evidenceStrength: 'strong',
          highlights: [
            'Used by 120+ peer classmates',
            'Lighthouse performance score 99/100',
          ],
        },
      ],
      careerInterests: [
        'AI Engineering',
        'Full Stack Development',
        'Machine Learning',
        'Data Science',
      ],
      summary:
        '3rd-year Computer Science undergraduate with hands-on experience building full-stack web applications and practical AI/ML micro-services.',
    }
  }

  async generateCareerDirection(interests: string[]): Promise<CareerDirectionRoleFit[]> {
    return [
      {
        role: 'AI / Machine Learning Engineer',
        category: 'ai_ml',
        fitPercentage: 88,
        rationale:
          'Your practical projects (AI Study Assistant, Attendance system) combined with verified Python proficiency establish strong alignment for junior AI roles.',
        keyStrengths: ['Python mastery', 'Applied LLM/Embeddings experience', 'FastAPI backend'],
        keyGaps: ['Deep Learning frameworks (PyTorch)', 'Model deployment / Docker'],
        recommendedNextSkills: ['PyTorch', 'Docker', 'MLflow'],
      },
      {
        role: 'Full-Stack Software Engineer',
        category: 'software_engineering',
        fitPercentage: 84,
        rationale:
          'Demonstrated expertise in React, TypeScript, and modern component architectures alongside REST API development.',
        keyStrengths: ['React & TypeScript', 'Modern CSS & UI design', 'Git workflows'],
        keyGaps: ['Production database migrations', 'Microservice architecture'],
        recommendedNextSkills: ['PostgreSQL optimization', 'Next.js', 'Testing with Vitest'],
      },
      {
        role: 'Data Science & Analytics Intern',
        category: 'data',
        fitPercentage: 72,
        rationale:
          'Good foundation in SQL and data analysis, but requires deeper exploratory data analysis (EDA) and statistical modeling portfolio pieces.',
        keyStrengths: ['SQL queries', 'Python scripting', 'Data structures'],
        keyGaps: ['Pandas / NumPy data manipulation', 'A/B testing methodology'],
        recommendedNextSkills: ['Pandas', 'Tableau / Metabase', 'Hypothesis Testing'],
      },
      {
        role: 'Technical Product Specialist',
        category: 'product',
        fitPercentage: 62,
        rationale:
          'Strong empathy for developer experience and user workflows, though currently skewed more heavily towards technical implementation.',
        keyStrengths: ['System understanding', 'User empathy', 'Product intuition'],
        keyGaps: ['Product analytics (Mixpanel/PostHog)', 'Agile roadmapping'],
        recommendedNextSkills: ['Product Analytics', 'User Research', 'PRD Writing'],
      },
    ]
  }

  async askAssistant(
    messages: AssistantMessage[],
    context: { student: StudentProfile; opportunities: Opportunity[] }
  ): Promise<string> {
    const latestQuery = messages[messages.length - 1]?.content.toLowerCase() || ''

    if (latestQuery.includes('prioritize') || latestQuery.includes('which internship') || latestQuery.includes('apply to')) {
      const studentName = context.student?.fullName || 'Candidate'
      const year = context.student?.currentYear || 3
      const degree = context.student?.degree || 'B.Tech'
      return `Based on your **Career DNA (${studentName} - Year ${year} ${degree})**, here is your prioritized application strategy:

### 1. Primary Recommendation: **AI Engineering Intern @ Demo Labs**
- **Match Score:** 91% (APPLY NOW)
- **Why:** Your **AI Study Assistant** project directly demonstrates FastAPI and vector retrieval. Your academic year (3rd year) perfectly satisfies the requirement.
- **Recommended Action:** Submit your application this week before the deadline.

### 2. Secondary Recommendation: **Full Stack Intern @ NovaStack**
- **Match Score:** 87% (APPLY NOW)
- **Why:** Full alignment with your **React + TypeScript** portfolio and clean component architecture.

### 3. Preparation Opportunity: **Machine Learning Intern @ VisionForge**
- **Match Score:** 78% (PREPARE FIRST)
- **Gap:** Requires PyTorch & Computer Vision.
- **Advice:** Follow the **14-day PyTorch sprint** before applying to significantly elevate your interview conversion probability.`
    }

    if (latestQuery.includes('why is my match score low') || latestQuery.includes('low')) {
      return `Match scores are calculated deterministically across 8 distinct vectors:

1. **Academic Year & Eligibility (20% weight):**
   If an opportunity requires final-year (4th year) students or 6-month continuous co-op commitments, our engine automatically caps the eligibility score to prevent wasted applications.
2. **Missing Prerequisite Skills (30% weight):**
   Opportunities flagged with **PREPARE FIRST** or **SKIP** generally require specialized libraries like **PyTorch**, **Docker**, or **Solidity** which are not yet verified in your projects or Skill Lab.
3. **Project Proof (15% weight):**
   Listing a skill on your resume without corresponding project or GitHub code gives lower confidence than substantiated claims.

*Tip: Check the 'Why You Match' breakdown on any opportunity card to see the exact percentage contribution of each vector.*`
    }

    if (latestQuery.includes('what skill should i learn next') || latestQuery.includes('learn next') || latestQuery.includes('gap') || latestQuery.includes('missing') || latestQuery.includes('pytorch')) {
      return `Based on your target of AI & Full-Stack engineering, your **#1 highest-leverage skill to learn next is PyTorch**:

- **Current Status:** Not yet demonstrated in your 3 active projects or Skill Lab.
- **Immediate Impact:** PyTorch currently gates **6 Machine Learning and Vision roles** in your feed from \`APPLY NOW\` into \`PREPARE FIRST\`.
- **Action Plan:** Follow the **14-Day PyTorch Preparation Sprint** (available in your Opportunity Details). Completing a hands-on CIFAR-10 or tensor classification project will immediately boost your match score above 88%.

Your secondary recommendation is **Docker & containerization**, which will strengthen your DevOps and cloud backend readiness.`
    }

    if (latestQuery.includes('compare my top 3') || latestQuery.includes('compare')) {
      return `Here is a side-by-side comparative analysis of your top 3 opportunities:

| Role & Company | Match Score | Recommendation | Key Trade-Off |
|---|---|---|---|
| **AI Engineering Intern** @ Demo Labs | **91%** | **APPLY NOW** | Best immediate fit; aligns with your FastAPI & vector search projects. Zero skill blockers. |
| **Full Stack Intern** @ NovaStack | **87%** | **APPLY NOW** | Direct match for your React + TypeScript portfolio; high conversion probability. |
| **ML Research Intern** @ VisionForge | **78%** | **PREPARE FIRST** | High compensation (₹50k/mo) but requires 14 days of PyTorch and Computer Vision prep. |

**Executive Recommendation:** Apply to **Demo Labs** and **NovaStack** this week. Simultaneously begin the 14-day PyTorch sprint for **VisionForge**.`
    }

    if (latestQuery.includes('14-day') || latestQuery.includes('preparation plan') || latestQuery.includes('roadmap')) {
      return `Here is your customized **14-Day Preparation Sprint Blueprint** to unlock high-tier AI internships:

- **Days 1–3: PyTorch Tensors & Autograd Fundamentals**
  - Master tensor operations, GPU memory allocation, and custom autograd functions.
- **Days 4–7: Neural Network Training Loop**
  - Build custom \`nn.Module\` architectures, Loss functions, and AdamW optimizers.
- **Days 8–11: Vision & Embeddings Mini-Project**
  - Train an image embedding classifier or fine-tune a pre-trained ResNet/Vision Transformer.
- **Days 12–13: Verification & Repo Documentation**
  - Push code to GitHub, deploy an interactive demo, and take the InternSync Skill Lab test.
- **Day 14: Submit Elevated Application**
  - Apply to VisionForge with newly verified project proof!

You can view the full interactive day-by-day checklist directly in the opportunity detail view.`
    }

    if (latestQuery.includes('eligible') || latestQuery.includes('eligibility')) {
      return `Here is your eligibility overview for your target market:

- **Academic Standing:** As an engineering student, you meet baseline eligibility for active internships in our live discovery feed.
- **Duration:** Your availability matches standard internship terms.
- **Location:** Flexible across remote and top tech hub opportunities.`
    }

    return `I am analyzing your **Career DNA** and active opportunities.

You currently have:
- **7 Opportunities classified as APPLY NOW** (highest match: 91%)
- **11 Opportunities classified as PREPARE FIRST**
- Strongest verified skills: **Python (91%)** and **React (84%)**

What specific role or skill would you like to review next? You can ask me to compare two roles, break down missing requirements, or generate a tailored preparation schedule.`
  }
}

/**
 * Singleton factory returning active AI provider
 */
let providerInstance: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (!providerInstance) {
    providerInstance = new DemoAIProvider()
  }
  return providerInstance
}
