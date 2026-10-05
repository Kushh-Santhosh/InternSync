import React from 'react'
import { CheckCircle2, Code2, FileText, GitBranch, ShieldCheck } from 'lucide-react'
import type { SkillEvidenceItem } from '@/types'
import { cn } from '@/lib/utils/cn'

interface SkillEvidenceBadgeProps {
  skill: SkillEvidenceItem
  showSources?: boolean
  onClick?: () => void
  className?: string
}

export const SkillEvidenceBadge: React.FC<SkillEvidenceBadgeProps> = ({
  skill,
  showSources = true,
  onClick,
  className,
}) => {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
    if (conf >= 60) return 'text-indigo-700 bg-indigo-50 border-indigo-200'
    return 'text-amber-700 bg-amber-50 border-amber-200'
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex flex-col p-2.5 rounded-lg border bg-white shadow-2xs hover:border-slate-300 transition-all',
        onClick && 'cursor-pointer hover:shadow-xs',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
          {skill.skillName}
        </span>
        <span
          className={cn(
            'text-[11px] font-bold px-1.5 py-0.5 rounded border',
            getConfidenceColor(skill.confidence)
          )}
        >
          {skill.confidence}%
        </span>
      </div>

      {showSources && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          {skill.evidenceSources.includes('resume') && (
            <span className="inline-flex items-center gap-0.5" title="Found in Resume">
              <FileText className="w-3 h-3 text-slate-400" />
            </span>
          )}
          {skill.evidenceSources.includes('project') && (
            <span
              className="inline-flex items-center gap-0.5 text-slate-600 font-medium"
              title={`${skill.projectCount} Practical Project(s)`}
            >
              <Code2 className="w-3 h-3 text-indigo-500" />
              <span>{skill.projectCount}p</span>
            </span>
          )}
          {skill.evidenceSources.includes('github') && (
            <span className="inline-flex items-center gap-0.5" title="Verified via GitHub code">
              <GitBranch className="w-3 h-3 text-slate-700" />
            </span>
          )}
          {skill.assessmentScore ? (
            <span
              className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold"
              title={`Skill Lab Verified: ${skill.assessmentScore}%`}
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>{skill.assessmentScore}%</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-slate-400 text-[10px]">
              <CheckCircle2 className="w-3 h-3 text-slate-300" />
            </span>
          )}
        </div>
      )}
    </div>
  )
}
