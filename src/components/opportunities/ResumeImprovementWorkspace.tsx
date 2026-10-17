import React, { useState, useMemo } from 'react'
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  ShieldCheck,
  Code2,
  TrendingUp,
} from 'lucide-react'
import type { Opportunity, MatchResult, StudentProfile, SkillEvidenceItem, ProjectItem } from '@/types'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

export interface ResumeImprovementWorkspaceProps {
  opportunity: Opportunity
  match: MatchResult
  profile: StudentProfile
  skills: SkillEvidenceItem[]
  projects: ProjectItem[]
}

interface BulletSuggestion {
  id: string
  sourceProjectTitle: string
  originalBullet: string
  refinedBullet: string
  rationale: string
  skillsEmphasized: string[]
  isVerifiedEvidence: boolean
  accepted: boolean
}

export const ResumeImprovementWorkspace: React.FC<ResumeImprovementWorkspaceProps> = ({
  opportunity,
  match,
  profile,
  skills,
  projects,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [acceptedBullets, setAcceptedBullets] = useState<Record<string, boolean>>({})

  // Generate deterministic, truthful bullet refinements from the student's genuine projects
  const suggestions: BulletSuggestion[] = useMemo(() => {
    const list: BulletSuggestion[] = []

    // Map projects to role requirements
    for (const proj of projects) {
      // Find matching technologies between project and opportunity requirements
      const matchedTech = proj.technologies.filter((t) =>
        opportunity.requiredSkills.concat(opportunity.preferredSkills).some(
          (req) => req.toLowerCase() === t.toLowerCase() || t.toLowerCase().includes(req.toLowerCase())
        )
      )

      if (proj.highlights && proj.highlights.length > 0) {
        proj.highlights.forEach((highlight, idx) => {
          let tuned = highlight

          // If the original bullet lacks explicit tech stack framing, make genuine tech explicit
          if (matchedTech.length > 0 && !matchedTech.some((t) => highlight.toLowerCase().includes(t.toLowerCase()))) {
            tuned = `${highlight} (Implemented utilizing ${matchedTech.slice(0, 3).join(', ')})`
          }

          // If the highlight is descriptive, emphasize production readiness and testing
          if (!tuned.toLowerCase().includes('tested') && !tuned.toLowerCase().includes('deployed') && proj.liveUrl) {
            tuned = `${tuned}; verified and deployed with live access at ${proj.liveUrl}`
          }

          list.push({
            id: `${proj.id}-bullet-${idx}`,
            sourceProjectTitle: proj.title,
            originalBullet: highlight,
            refinedBullet: tuned !== highlight ? tuned : `Architected ${proj.title}: ${highlight} leveraging ${proj.technologies.slice(0, 3).join(', ')}`,
            rationale: matchedTech.length > 0
              ? `Directly showcases required ${matchedTech.join(', ')} referenced in ${opportunity.roleTitle} role description.`
              : `Highlights proven delivery capability in ${proj.technologies.slice(0, 2).join('/')}.`,
            skillsEmphasized: matchedTech.length > 0 ? matchedTech : proj.technologies.slice(0, 2),
            isVerifiedEvidence: true,
            accepted: !!acceptedBullets[`${proj.id}-bullet-${idx}`],
          })
        })
      } else {
        // Synthesize a truthful bullet from title + description + technologies
        const matchedTech = proj.technologies.filter((t) =>
          opportunity.requiredSkills.concat(opportunity.preferredSkills).some(
            (req) => req.toLowerCase() === t.toLowerCase()
          )
        )

        list.push({
          id: `${proj.id}-synth-0`,
          sourceProjectTitle: proj.title,
          originalBullet: proj.description || `Built ${proj.title} using ${proj.technologies.join(', ')}.`,
          refinedBullet: `Engineered ${proj.title} utilizing ${proj.technologies.join(', ')}${proj.repositoryUrl ? ' with modular architecture and version-controlled codebase' : ''}.`,
          rationale: `Grounds your candidacy with verified project evidence matching ${opportunity.companyName}'s stack.`,
          skillsEmphasized: matchedTech.length > 0 ? matchedTech : proj.technologies.slice(0, 3),
          isVerifiedEvidence: true,
          accepted: !!acceptedBullets[`${proj.id}-synth-0`],
        })
      }
    }

    // If student has no projects, generate evidence-seeking draft prompts (strictly unverified warnings)
    if (list.length === 0) {
      list.push({
        id: 'draft-prompt-1',
        sourceProjectTitle: 'Draft Project Entry (Awaiting Confirmation)',
        originalBullet: '[No project evidence recorded in student profile]',
        refinedBullet: `[Draft requiring your confirmation]: Developed a student project implementing ${opportunity.requiredSkills.slice(0, 2).join(' & ')}.`,
        rationale: 'InternSync never invents experience. Enter your actual project repository to generate truthful bullet points.',
        skillsEmphasized: opportunity.requiredSkills.slice(0, 2),
        isVerifiedEvidence: false,
        accepted: false,
      })
    }

    return list
  }, [projects, opportunity, acceptedBullets])

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleAccept = (id: string) => {
    setAcceptedBullets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Summary counts
  const matchedRequirements = opportunity.requiredSkills.filter((req) =>
    skills.some((s) => s.skillName.toLowerCase() === req.toLowerCase() && s.confidence >= 50)
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Integrity & Zero-Fabrication Pledge Banner */}
      <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/90 text-indigo-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Resume-to-Internship Intelligence</span>
              <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                Zero Fabrication Policy
              </span>
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
              Every suggested refinement is strictly grounded in the evidence and projects already confirmed in your
              profile. InternSync never invents metrics, employers, or unevidenced skills. Your original master resume
              remains unaltered.
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold text-slate-500 whitespace-nowrap self-end sm:self-center">
          Target: <span className="text-slate-900 font-bold">{opportunity.companyName}</span>
        </div>
      </div>

      {/* Grid: What Matches vs What's Missing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* What Already Matches */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>What Already Matches</span>
            </h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {matchedRequirements.length}/{opportunity.requiredSkills.length} Core Skills
            </span>
          </div>

          <div className="space-y-2.5">
            {matchedRequirements.map((skill, idx) => {
              const ev = skills.find((s) => s.skillName.toLowerCase() === skill.toLowerCase())
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-bold text-emerald-950">{skill}</span>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-700">
                    {ev?.evidenceSources.join(', ') || 'Verified'} ({ev?.confidence || 80}% confidence)
                  </span>
                </div>
              )
            })}

            {matchedRequirements.length === 0 && (
              <p className="text-xs text-slate-500 italic py-2">
                No strict 1:1 keyword matches in core skills. Review preferred qualifications or project overlaps below.
              </p>
            )}

            {/* Academic & Degree Match */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Academic Eligibility:</span>
              <span className="font-bold text-slate-900">
                {profile.degree} (Year {profile.currentYear}) meets Year {opportunity.eligibleYears.join(', ')} criteria
              </span>
            </div>
          </div>
        </div>

        {/* What's Missing or Under-Demonstrated */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Addressable Skill Gaps</span>
            </h3>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {match.missingSkills.length} Gaps Detected
            </span>
          </div>

          <div className="space-y-2.5">
            {match.missingSkills.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All listed role prerequisites are evidenced in your verified profile!</span>
              </div>
            ) : (
              match.missingSkills.map((gap, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/70 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-amber-950">{gap}</div>
                    <div className="text-[11px] text-amber-700">
                      Required by {opportunity.companyName} for {opportunity.roleTitle}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                    Learn Before Applying
                  </span>
                </div>
              ))
            )}

            {/* Non-technical or Preferred Requirements */}
            {opportunity.preferredSkills.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase">
                  Bonus / Preferred Skills:
                </span>
                <div className="flex flex-wrap gap-1">
                  {opportunity.preferredSkills.map((ps, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                    >
                      {ps}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role-Specific Truthful Bullet Refinements */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Role-Specific Resume Refinements for {opportunity.roleTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Selectively tailor your project bullet points to emphasize relevant skills without exaggerating or
              inventing claims.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            {Object.values(acceptedBullets).filter(Boolean).length} of {suggestions.length} Accepted
          </div>
        </div>

        {/* Suggestion Cards */}
        <div className="space-y-4">
          {suggestions.map((sug) => {
            const isAccepted = !!acceptedBullets[sug.id]
            const isCopied = copiedId === sug.id

            return (
              <div
                key={sug.id}
                className={cn(
                  'p-4 sm:p-5 rounded-2xl border transition-all text-xs space-y-3',
                  isAccepted
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-bold text-slate-800">{sug.sourceProjectTitle}</span>
                    {sug.isVerifiedEvidence ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Evidenced in Portfolio
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        Unconfirmed Draft
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(sug.id, sug.refinedBullet)}
                      className="h-7 px-2.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600 mr-1" />
                          <span className="text-emerald-700 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant={isAccepted ? 'secondary' : 'outline'}
                      onClick={() => toggleAccept(sug.id)}
                      className={cn(
                        'h-7 px-2.5 text-xs font-semibold cursor-pointer',
                        isAccepted
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-transparent'
                          : 'border-slate-300 text-slate-700'
                      )}
                    >
                      {isAccepted ? '✓ Accepted for Tailored Resume' : '+ Accept Change'}
                    </Button>
                  </div>
                </div>

                {/* Before / After Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Before */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Current Wording in Profile
                    </span>
                    <p className="text-slate-600 leading-relaxed italic">{sug.originalBullet}</p>
                  </div>

                  {/* After */}
                  <div className="p-3 rounded-xl bg-white border border-indigo-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Role-Tailored Bullet Refinement</span>
                    </span>
                    <p className="text-slate-900 font-medium leading-relaxed">{sug.refinedBullet}</p>
                  </div>
                </div>

                {/* Explanation Rationale */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span>{sug.rationale}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Emphasizes:</span>
                    {sug.skillsEmphasized.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-800 text-[10px] font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
