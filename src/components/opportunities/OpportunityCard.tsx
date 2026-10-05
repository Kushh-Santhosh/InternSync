import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Banknote,
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

  // Missing skills list
  const missingSkills = match.missingSkills || []

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
            {opportunity.companyLogo ? (
              <img
                src={opportunity.companyLogo}
                alt={opportunity.companyName}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0 bg-slate-50"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm shrink-0">
                {opportunity.companyName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h3
                onClick={() => navigate(`/opportunities/${opportunity.id}`)}
                className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer leading-snug"
              >
                {opportunity.roleTitle}
              </h3>
              <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-slate-700">{opportunity.companyName}</span>
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

        {/* Match Score & Evidence Breakdown */}
        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100">
          <div className="flex flex-col items-center">
            <ScoreRing score={match.overallMatchScore} size="md" showLabel={false} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
              MATCH {match.overallMatchScore}%
            </span>
          </div>

          <div className="space-y-2 min-w-0 flex-1">
            {/* Why you match */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Why you match:
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {topMatchedSkills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50/90 border border-emerald-200/80 px-2 py-0.5 rounded-md"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{skill}</span>
                  </span>
                ))}
                {topMatchedSkills.length === 0 && (
                  <span className="text-xs text-slate-500">Degree & location match</span>
                )}
              </div>
            </div>

            {/* What you're missing */}
            {missingSkills.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  What you're missing:
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {missingSkills.slice(0, 2).map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50/90 border border-amber-200/80 px-2 py-0.5 rounded-md"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metadata: Stipend & Deadline */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
          {opportunity.stipendAmount ? (
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <Banknote className="w-3.5 h-3.5 text-slate-400" />
              <span>₹{opportunity.stipendAmount.toLocaleString()}/mo</span>
            </span>
          ) : (
            <span className="text-slate-400">Competitive stipend</span>
          )}
          <span>·</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Due {new Date(opportunity.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </span>
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
      </div>

      {/* Card Action Buttons: View Opportunity & Apply */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/opportunities/${opportunity.id}`)}
          className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex-1 justify-center"
        >
          <span>View opportunity</span>
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>

        <a
          href={opportunity.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button
            size="sm"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold justify-center"
          >
            <span>Apply</span>
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </a>
      </div>
    </div>
  )
}
