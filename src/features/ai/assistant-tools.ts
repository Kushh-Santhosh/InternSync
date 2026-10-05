import { generateSkillGapRoadmap } from '@/lib/matching/roadmap'
import { OpportunitySearchOrchestrator } from '@/features/opportunities/search/orchestrator'
import type {
  MatchResult,
  Opportunity,
  ProjectItem,
  SkillEvidenceItem,
  StudentProfile,
} from '@/types'

export interface AssistantToolContext {
  student: StudentProfile
  skills: SkillEvidenceItem[]
  projects: ProjectItem[]
  opportunities: Opportunity[]
  matches: Map<string, MatchResult>
  isDemoMode: boolean
}

/**
 * Assistant Tool Architecture
 */
export class AssistantToolExecutor {
  private ctx: AssistantToolContext

  constructor(ctx: AssistantToolContext) {
    this.ctx = ctx
  }

  getCareerDNA(): string {
    const { student, skills, projects } = this.ctx
    const topSkills = skills
      .filter((s) => s.confidence >= 60)
      .map((s) => `${s.skillName} (${s.confidence}%, verified in ${s.evidenceSources.join(', ')})`)
      .join('\n- ')

    const projectSummary = projects
      .map((p) => `${p.title}: ${p.description.slice(0, 100)}... [Tech: ${p.technologies.join(', ')}]`)
      .join('\n- ')

    return `### Current Career DNA:
- **Student:** ${student.fullName} (${student.degree} Year ${student.currentYear}, ${student.university})
- **Location:** ${student.location} (Preference: ${student.workModePreference})
- **Target Roles:** ${student.targetRole || student.careerInterests.join(', ')}
- **Top Verified Skills:**
- ${topSkills || 'None yet verified'}
- **Projects:**
- ${projectSummary || 'No projects uploaded yet'}`
  }

  async searchLiveInternships(queryText?: string): Promise<{
    summary: string
    opportunities: Opportunity[]
    matches: Map<string, MatchResult>
  }> {
    const orchestrator = new OpportunitySearchOrchestrator()
    const result = await orchestrator.runDiscovery(
      this.ctx.student,
      this.ctx.skills,
      this.ctx.isDemoMode,
      undefined,
      Boolean(queryText)
    )

    const top3 = result.opportunities.slice(0, 3)
    const formatted = top3
      .map((opp, idx) => {
        const match = result.matches.get(opp.id)
        const why = match?.whyMatched.slice(0, 3).map((w) => `✓ ${w}`).join('\n   ') || '✓ Skills match'
        const gap = match?.missingSkills.slice(0, 2).map((g) => `⚠ ${g}`).join(', ') || 'None'
        const link = opp.urlStatus === 'VERIFIED' ? `[Apply directly](${opp.applicationUrl})` : `[View listing](${opp.applicationUrl})`

        return `${idx + 1}. **${opp.roleTitle}** — ${opp.companyName}
   - **Match Score:** ${match?.overallMatchScore || 80}% (${match?.recommendation || 'APPLY NOW'})
   - **Location:** ${opp.location} (${opp.workMode})
   - **Why:**\n   ${why}
   - **Gap:** ${gap}
   - **Source:** ${opp.source}
   - **Application Link:** ${link}`
      })
      .join('\n\n')

    return {
      summary: `I searched the live web and configured job sources using your current Career DNA.
I found ${result.counts.totalDiscovered} potential listings (${result.counts.deduplicated} unique after deduplication).

Here are your strongest current matches:

${formatted}`,
      opportunities: result.opportunities,
      matches: result.matches,
    }
  }

  getSkillGaps(): string {
    const { matches } = this.ctx
    const missingFreq = new Map<string, number>()

    matches.forEach((m) => {
      m.missingSkills.forEach((skill) => {
        missingFreq.set(skill, (missingFreq.get(skill) || 0) + 1)
      })
    })

    const sortedGaps = Array.from(missingFreq.entries()).sort((a, b) => b[1] - a[1])
    if (sortedGaps.length === 0) {
      return 'You currently have strong coverage across your target roles with no major recurring skill blockers.'
    }

    const topGap = sortedGaps[0]
    return `Based on active opportunities matching your profile:

1. **#1 Highest-Leverage Skill Gap: ${topGap[0]}**
   - Blocks **${topGap[1]} opportunities** in your feed from moving into **APPLY NOW**.
   - Current verification: Not substantiated in your project portfolio or Skill Lab.

2. **Secondary High-Frequency Gaps:**
${sortedGaps.slice(1, 4).map(([skill, count]) => `   - **${skill}:** Appears in ${count} target listings`).join('\n')}

**Action Recommendation:** Complete a targeted 14-day sprint on **${topGap[0]}** to significantly improve interview conversion rates.`
  }

  compareOpportunities(): string {
    const { opportunities, matches } = this.ctx
    const top3 = opportunities.slice(0, 3)

    if (top3.length === 0) {
      return 'No active opportunities to compare. Run live discovery first.'
    }

    let table = `| Role & Company | Match Score | Recommendation | Key Trade-Off & Evidence |\n|---|---|---|---|\n`
    for (const opp of top3) {
      const match = matches.get(opp.id)
      const score = match?.overallMatchScore || 80
      const rec = match?.recommendation || 'APPLY NOW'
      const keyStrength = match?.whyMatched[0] || 'Technical fit'
      const missing = match?.missingSkills.join(', ') || 'No major gaps'
      table += `| **${opp.roleTitle}** @ ${opp.companyName} | **${score}%** | **${rec}** | ${keyStrength}. Gap: ${missing} |\n`
    }

    return `Here is a comparative analysis of your top opportunities:\n\n${table}\n\n**Strategy:** Submit applications to the **APPLY NOW** roles first, while concurrently following preparation plans for those requiring prep.`
  }

  createPreparationPlan(): string {
    const { opportunities, matches } = this.ctx
    const prepOpp = opportunities.find((o) => matches.get(o.id)?.recommendation === 'PREPARE FIRST') || opportunities[0]
    if (!prepOpp) {
      return 'Please discover opportunities first to synthesize a targeted preparation plan.'
    }

    const match = matches.get(prepOpp.id)
    const plan = generateSkillGapRoadmap(
      prepOpp,
      match?.missingSkills || prepOpp.requiredSkills
    )

    return `Here is your customized **14-Day Preparation Blueprint** for **${prepOpp.roleTitle} @ ${prepOpp.companyName}**:

- **Target Gaps:** ${plan.criticalGaps.concat(plan.importantGaps).join(', ') || 'Advanced Framework Synthesis'}
- **Sprint Structure:**
  - **Phase 1 (Days 1–4): Core Fundamentals & Setup**
    - Master key tensor, API, or component patterns needed for ${prepOpp.roleTitle}.
  - **Phase 2 (Days 5–8): Deep Architecture & Implementation**
    - Build mini-modules addressing the primary missing requirements.
  - **Phase 3 (Days 9–12): Capstone Project Demonstration**
    - Build and document an end-to-end project on GitHub.
  - **Phase 4 (Days 13–14): Verification & Direct Application**
    - Validate skills in InternSync Skill Lab and submit directly via [${prepOpp.applicationUrl}].`
  }
}
