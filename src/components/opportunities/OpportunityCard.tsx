import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RecommendationBadge } from '@/components/ui/RecommendationBadge'
import { ScoreRing } from '@/components/ui/ScoreRing'
import type { MatchResult, Opportunity } from '@/types'
import { cn } from '@/lib/utils/cn'

interface OpportunityCardProps {
  opportunity: Opportunity
  match: MatchResult
  onCompareToggle?: () => void
  isCompared?: boolean
  className?: string
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  match,
  onCompareToggle,
  isCompared = false,
  className,
}) => {
  const navigate = useNavigate()

  // Top matching skills
  const topMatchedSkills = opportunity.requiredSkills.filter(
    (skill) => !match.missingSkills.some((m) => m.toLowerCase() === skill.toLowerCase())
  )

  // Main missing skill
  const mainMissingSkill = match.missingSkills[0]

  return (
    <div
      className={cn(
        'p-5 sm:p-6 rounded-2xl border bg-white shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group',
        isCompared ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-slate-200 hover:border-slate-300',
        className
      )}
    >
      <div>
        {/* Top Header: Company, Role, Logo, Recommendation */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={opportunity.companyLogo}
              alt={opportunity.companyName}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
            />
            <div>
              <h3
                onClick={() => navigate(`/opportunities/${opportunity.id}`)}
                className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer leading-snug"
              >
                {opportunity.roleTitle}
              </h3>
              <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                <span>{opportunity.companyName}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {opportunity.location} ({opportunity.workMode})
                </span>
              </div>
            </div>
          </div>

          <RecommendationBadge type={match.recommendation} size="sm" />
        </div>

        {/* Match Score & Evidence Signals */}
        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100">
          <ScoreRing score={match.overallMatchScore} size="md" showLabel={false} />
          
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Match Signals
            </div>

            {/* Top matching skills checklist */}
            <div className="flex flex-wrap items-center gap-2">
              {topMatchedSkills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50/80 border border-emerald-200/80 px-2 py-0.5 rounded-md"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{skill}</span>
                </span>
              ))}
            </div>

            {/* Main missing skill alert */}
            {mainMissingSkill ? (
              <div className="inline-flex items-center gap-1.5 text-xs text-amber-800 font-medium bg-amber-50/80 border border-amber-200/80 px-2 py-0.5 rounded-md mt-1">
                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                <span>Missing: <strong>{mainMissingSkill}</strong></span>
              </div>
            ) : (
              <div className="text-xs text-emerald-700 font-medium mt-1">
                Full skill prerequisite coverage
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Deadline & Action */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Due {new Date(opportunity.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          {onCompareToggle && (
            <>
              <span>·</span>
              <button
                type="button"
                onClick={onCompareToggle}
                className={cn(
                  'text-[11px] font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer',
                  isCompared ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {isCompared ? '✓ Compared' : '+ Compare'}
              </button>
            </>
          )}
        </div>

        <Button
          size="sm"
          onClick={() => navigate(`/opportunities/${opportunity.id}`)}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5"
        >
          <span>View why</span>
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  )
}
