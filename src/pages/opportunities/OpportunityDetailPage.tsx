import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
  Info,
  KanbanSquare,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { generateSkillGapRoadmap } from '@/lib/matching/roadmap'
import { isSafeApplicationUrl } from '@/features/opportunities/url-verifier/url-verifier'
import { ResumeImprovementWorkspace } from '@/components/opportunities/ResumeImprovementWorkspace'
import { Button } from '@/components/ui/Button'
import { RecommendationBadge } from '@/components/ui/RecommendationBadge'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { cn } from '@/lib/utils/cn'

export const OpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    opportunities,
    matches,
    addApplication,
    toggleComparison,
    comparisonIds,
    profile,
    skills,
    projects,
  } = useApp()

  const [activeTab, setActiveTab] = useState<'fit' | 'resume' | 'roadmap' | 'description'>('fit')

  const opportunity = opportunities.find((o) => o.id === id)
  const match = opportunity ? matches.get(opportunity.id) : undefined

  // Roadmap progress state with local persistence
  const [completedDays, setCompletedDays] = useState<number[]>(() => {
    if (!id) return []
    try {
      const saved = localStorage.getItem(`roadmap_${id}`)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const toggleDayCompletion = (dayNum: number) => {
    if (!id) return
    setCompletedDays((prev) => {
      const next = prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
      try {
        localStorage.setItem(`roadmap_${id}`, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  if (!opportunity || !match) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Opportunity Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">
          The requested opportunity could not be located in our verified directory.
        </p>
        <Link to="/opportunities" className="mt-4 inline-block">
          <Button size="sm">Back to Opportunities</Button>
        </Link>
      </div>
    )
  }

  // Synthesize 14-day roadmap for missing skills
  const roadmap = generateSkillGapRoadmap(opportunity, match.missingSkills)
  const completionPercent = Math.round((completedDays.length / 14) * 100)

  // Safe external URL verification
  const isDirectApplySafe = isSafeApplicationUrl(opportunity.applicationUrl)

  const handleApplyPortal = () => {
    if (isDirectApplySafe && opportunity.applicationUrl) {
      window.open(opportunity.applicationUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleMarkAsApplied = async () => {
    await addApplication(opportunity.id, 'applied', 'Marked as applied by student.')
    navigate('/applications')
  }

  const handleSaveToPipeline = async () => {
    await addApplication(opportunity.id, 'saved', 'Saved to pipeline.')
    navigate('/applications')
  }

  // Evidence locator helper
  const getSkillEvidence = (skillName: string) => {
    const norm = skillName.toLowerCase()
    const skillItem = skills.find((s) => s.skillName.toLowerCase() === norm)
    const projItem = projects.find((p) => p.technologies.some((t) => t.toLowerCase() === norm))
    const expItem = profile.experiences?.find(
      (e) => e.summary?.toLowerCase().includes(norm) || e.roleTitle.toLowerCase().includes(norm)
    )

    const badges: string[] = []
    if (skillItem) {
      if (skillItem.evidenceSources?.includes('assessment')) {
        badges.push(`Skill Lab Assessment (${skillItem.assessmentScore ?? skillItem.confidence}%)`)
      }
      if (skillItem.evidenceSources?.includes('project')) {
        badges.push('Project Evidence')
      }
      if (skillItem.evidenceSources?.includes('github')) {
        badges.push('GitHub Evidence')
      }
      if (skillItem.evidenceSources?.includes('resume')) {
        badges.push(`Resume Extracted (${skillItem.confidence}%)`)
      }
    }
    if (projItem && !badges.some((b) => b.includes('Project'))) {
      badges.push(`Project: ${projItem.title}`)
    }
    if (expItem && !badges.some((b) => b.includes('Experience'))) {
      badges.push(`Experience: ${expItem.company}`)
    }
    if (badges.length === 0) {
      badges.push('Resume Keyword Evidence')
    }
    return badges
  }

  // Human recommendation text
  const getHumanRecommendation = () => {
    if (match.recommendation === 'APPLY NOW') {
      return {
        decision: 'Apply now.',
        rationale:
          'Your existing project evidence and academic standing align directly with what this team is evaluating. Submit before the application deadline.',
        bannerStyle: 'border-emerald-200 bg-emerald-50/60 text-emerald-950',
        badgeText: 'APPLY NOW: Strong Fit + Eligibility Satisfied',
      }
    }
    if (match.recommendation === 'PREPARE FIRST') {
      return {
        decision: 'Prepare first.',
        rationale:
          `You have a strong foundation in core skills, but this role specifically looks for ${match.missingSkills.join(' & ') || 'additional requirements'}. Spend 14 days following the targeted sprint roadmap before submitting.`,
        bannerStyle: 'border-amber-200 bg-amber-50/60 text-amber-950',
        badgeText: 'PREPARE FIRST: Meaningful Gaps — 14-Day Sprint Available',
      }
    }
    if (match.recommendation === 'NOT ELIGIBLE') {
      return {
        decision: 'Not Eligible.',
        rationale:
          match.eligibilityNotes[0] ||
          'Your current profile does not satisfy one or more mandatory eligibility constraints (degree, academic standing, or CGPA threshold).',
        bannerStyle: 'border-rose-200 bg-rose-50/70 text-rose-950',
        badgeText: 'NOT ELIGIBLE: Hard Constraint Mismatch',
      }
    }
    if (match.recommendation === 'NEEDS VERIFICATION') {
      return {
        decision: 'Needs Verification.',
        rationale:
          'Certain critical eligibility criteria (such as minimum degree or academic year) were not disclosed in this listing. Verify before investing extensive preparation time.',
        bannerStyle: 'border-blue-200 bg-blue-50/70 text-blue-950',
        badgeText: 'NEEDS VERIFICATION: Unspecified Criteria',
      }
    }
    return {
      decision: 'Skip this opportunity.',
      rationale:
        match.eligibilityNotes[0] ||
        'This role requires different academic year standing, continuous 6-month co-op terms, or an entirely distinct technical stack.',
      bannerStyle: 'border-slate-200 bg-slate-100/70 text-slate-800',
      badgeText: 'SKIP: Low Alignment or Major Skill Divergence',
    }
  }

  const rec = getHumanRecommendation()

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to listings</span>
      </button>

      {/* Hero Overview Header */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <img
              src={opportunity.companyLogo}
              alt={opportunity.companyName}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                  {opportunity.category}
                </span>
                {opportunity.isDemo ? (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Demo Opportunity
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Verified Listing • {opportunity.source}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                {opportunity.roleTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium mt-2">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>{opportunity.companyName}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {opportunity.location} ({opportunity.workMode})
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{opportunity.internshipDurationMonths} Months</span>
                </span>
                <span className="flex items-center gap-1 text-slate-900 font-bold">
                  {opportunity.stipendAmount
                    ? `${opportunity.stipendCurrency === 'USD' ? '$' : '₹'}${opportunity.stipendAmount.toLocaleString()}/${opportunity.stipendPeriod === 'hour' ? 'hr' : 'month'}`
                    : 'Stipend: Not Disclosed'}
                </span>
              </div>
            </div>
          </div>

          {/* Match Score & Recommendation Badge */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 self-stretch md:self-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-black text-slate-900">{match.overallMatchScore}%</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {match.overallMatchScore >= 80 ? 'Strong Match' : match.overallMatchScore >= 60 ? 'Moderate Match' : 'Low Match'}
                </div>
              </div>
              <ScoreRing score={match.overallMatchScore} size="md" showLabel={false} />
            </div>
            <RecommendationBadge type={match.recommendation} size="md" />
          </div>
        </div>

        {/* CTA Actions Bar */}
        <div className="pt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="md"
              onClick={handleApplyPortal}
              disabled={!isDirectApplySafe}
              className={cn(
                'font-semibold',
                isDirectApplySafe
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
              )}
            >
              <span>{isDirectApplySafe ? 'Open Application Portal' : 'Application Link Unverified'}</span>
              {isDirectApplySafe && <ArrowUpRight className="w-4 h-4 ml-1.5" />}
            </Button>
            <Button variant="outline" size="md" onClick={handleMarkAsApplied}>
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
              <span>Mark as Applied</span>
            </Button>
            <Button variant="secondary" size="md" onClick={handleSaveToPipeline}>
              <KanbanSquare className="w-4 h-4 mr-1.5" />
              <span>Save to Pipeline</span>
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => toggleComparison(opportunity.id)}
              className="text-slate-600"
            >
              <span>{comparisonIds.includes(opportunity.id) ? '✓ Compared' : '+ Compare'}</span>
            </Button>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Deadline: {opportunity.isUndated || !opportunity.deadline || isNaN(Date.parse(opportunity.deadline))
              ? 'Rolling / Continuous applications (Active)'
              : new Date(opportunity.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Major Visual Recommendation Banner (Priority 5 & 6) */}
      <div className={cn('p-6 rounded-2xl border shadow-xs space-y-2', rec.bannerStyle)}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI RECOMMENDATION</span>
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/80 border border-current shadow-2xs">
            {rec.decision}
          </span>
        </div>
        <p className="text-xs sm:text-sm font-medium leading-relaxed max-w-3xl">
          {rec.rationale}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'fit', label: 'Why You Match & Evidence' },
          { id: 'resume', label: 'Resume Intelligence & Tuning' },
          { id: 'roadmap', label: '14-Day Preparation Sprint' },
          { id: 'description', label: 'Role & Requirements' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px cursor-pointer',
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Fit & Score Breakdown */}
      {activeTab === 'fit' && (
        <div className="space-y-6 animate-in fade-in">
          {/* HARD ELIGIBILITY & TRANSPARENCY CARD */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                {match.eligibilityStatus === 'Eligible' && (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                )}
                {match.eligibilityStatus === 'Ineligible' && (
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                )}
                {match.eligibilityStatus === 'Needs verification' && (
                  <HelpCircle className="w-5 h-5 text-amber-600" />
                )}
                {match.eligibilityStatus === 'Not specified' && (
                  <Info className="w-5 h-5 text-slate-500" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Hard Eligibility Gate
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    Status: {match.eligibilityStatus || 'Eligible'}
                  </div>
                </div>
              </div>

              <span
                className={cn(
                  'text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto',
                  match.eligibilityStatus === 'Eligible'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : match.eligibilityStatus === 'Ineligible'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : match.eligibilityStatus === 'Needs verification'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                )}
              >
                {match.eligibilityStatus || 'Eligible'}
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {match.explanation ||
                (match.eligibilityNotes[0] ??
                  'Candidate satisfies academic and role eligibility criteria based on profile records.')}
            </p>

            {match.eligibilityNotes.length > 1 && (
              <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
                {match.eligibilityNotes.slice(1).map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            )}

            {match.unknownCriteria && match.unknownCriteria.length > 0 && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700">Not specified in listing (No assumptions made): </span>
                  <span>{match.unknownCriteria.join(', ')}</span>
                </div>
              </div>
            )}
          </div>

          {/* 8-DIMENSION SCORING BREAKDOWN */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400">
                Deterministic Fit Dimensions
              </h3>
              <span className="text-xs text-slate-400 font-medium">Weighted Model (Total 100%)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-semibold text-slate-500 block truncate">Skills (30%)</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">{match.skillScore}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-semibold text-slate-500 block truncate">Eligibility (20%)</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">{match.eligibilityScore}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-semibold text-slate-500 block truncate">Projects (15%)</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">{match.projectScore}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-semibold text-slate-500 block truncate">Education (10%)</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">{match.educationScore}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-semibold text-slate-500 block truncate">Experience (10%)</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">{match.experienceScore ?? 100}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-semibold text-slate-500 block truncate">Location (5%)</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">{match.locationScore}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-semibold text-slate-500 block truncate">Availability (5%)</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">{match.availabilityScore ?? 100}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-semibold text-slate-500 block truncate">Intent (5%)</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">{match.intentScore ?? 100}%</span>
              </div>
            </div>
          </div>

          {/* 3-CATEGORY SKILL GAP ANALYSIS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400">
              Three-Category Skill Gap Analysis
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {/* CATEGORY 1: ALREADY SATISFIED */}
              <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-emerald-950">
                      1. Already Satisfied ({match.skillsMatched?.length || 0})
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                    Verified in Profile & Evidence
                  </span>
                </div>

                {(!match.skillsMatched || match.skillsMatched.length === 0) ? (
                  <p className="text-xs text-slate-500 italic">No skills currently verified for this listing.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {match.skillsMatched.map((skill) => {
                      const evidenceBadges = getSkillEvidence(skill)
                      return (
                        <div
                          key={skill}
                          className="p-3 rounded-xl bg-white border border-emerald-200/80 shadow-2xs flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{skill}</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                              Satisfied
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {evidenceBadges.map((badge, bIdx) => (
                              <span
                                key={bIdx}
                                className="text-[10px] text-slate-600 bg-slate-100 border border-slate-200/70 px-1.5 py-0.5 rounded"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* CATEGORY 2: NEEDS IMPROVEMENT */}
              <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h4 className="text-sm font-bold text-amber-950">
                      2. Needs Improvement ({match.skillsNeedsImprovement?.length || 0})
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                    Confidence &lt; 60% — Practice Recommended
                  </span>
                </div>

                {(!match.skillsNeedsImprovement || match.skillsNeedsImprovement.length === 0) ? (
                  <p className="text-xs text-slate-500 italic">No low-confidence skills detected for this role.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {match.skillsNeedsImprovement.map((skill) => (
                      <div
                        key={skill}
                        className="p-3 rounded-xl bg-white border border-amber-200/80 shadow-2xs flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-bold text-amber-950 block">{skill}</span>
                          <span className="text-[10px] text-amber-700 mt-0.5 block">
                            Detected with basic familiarity; complete assessment before technical rounds
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate('/skill-lab')}
                          className="shrink-0 text-xs border-amber-300 text-amber-900 hover:bg-amber-50 ml-2"
                        >
                          Skill Lab
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CATEGORY 3: MISSING REQUIREMENTS */}
              <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <h4 className="text-sm font-bold text-rose-950">
                      3. Missing Requirements (
                      {(match.requiredSkillsMissing?.length || 0) + (match.preferredSkillsMissing?.length || 0)}
                      )
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded">
                    Action Required Before Applying
                  </span>
                </div>

                {(!match.requiredSkillsMissing || match.requiredSkillsMissing.length === 0) &&
                (!match.preferredSkillsMissing || match.preferredSkillsMissing.length === 0) ? (
                  <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>No missing required or preferred skills! All requirements met.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Required Skills Missing */}
                    {match.requiredSkillsMissing && match.requiredSkillsMissing.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">
                          Mandatory Required Skills Missing:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {match.requiredSkillsMissing.map((skill) => (
                            <div
                              key={skill}
                              className="p-3 rounded-xl bg-white border border-rose-200/80 shadow-2xs flex items-center justify-between"
                            >
                              <div>
                                <span className="text-xs font-bold text-rose-950 block">{skill}</span>
                                <span className="text-[10px] text-rose-700 mt-0.5 block">
                                  Mandatory prerequisite not found in profile
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActiveTab('roadmap')}
                                className="shrink-0 text-xs border-rose-300 text-rose-900 hover:bg-rose-50 ml-2"
                              >
                                <span>Sprint Plan</span>
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preferred Skills Missing */}
                    {match.preferredSkillsMissing && match.preferredSkillsMissing.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-rose-100">
                        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Preferred / Bonus Skills Missing:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {match.preferredSkillsMissing.map((skill) => (
                            <div
                              key={skill}
                              className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between"
                            >
                              <div>
                                <span className="text-xs font-bold text-slate-900 block">{skill}</span>
                                <span className="text-[10px] text-slate-500 mt-0.5 block">
                                  Nice-to-have skill — does not disqualify your candidacy
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setActiveTab('roadmap')}
                                className="shrink-0 text-xs text-indigo-600 hover:bg-indigo-50 ml-2"
                              >
                                Learn
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* VERIFIED EVIDENCE HIGHLIGHTS */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Evidence Grounds</span>
            </h3>

            <div className="space-y-2.5">
              {match.whyMatched.map((reason, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-medium text-slate-800">{reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Resume Intelligence & Tuning Workspace */}
      {activeTab === 'resume' && (
        <ResumeImprovementWorkspace
          opportunity={opportunity}
          match={match}
          profile={profile}
          skills={skills}
          projects={projects}
        />
      )}

      {/* TAB 3: 14-Day Preparation Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6 animate-in fade-in">
          {/* SPRINT HEADER & PROGRESS */}
          <div className="p-6 rounded-2xl border border-indigo-200 bg-indigo-50/50 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                  Targeted Preparation Sprint
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  14-Day Roadmap: Bridge Gaps for {opportunity.roleTitle}
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                  {roadmap.outcomeSummary}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => navigate('/skill-lab')}
                  className="bg-indigo-600 text-white"
                >
                  Take Baseline Assessment
                </Button>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="pt-3 border-t border-indigo-100/80">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 mb-1.5">
                <span>Sprint Completion: {completedDays.length} of 14 Days Completed</span>
                <span>{completionPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-indigo-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Daily Timeline */}
          <div className="space-y-3">
            {roadmap.dailyPlan.map((day) => {
              const isCompleted = completedDays.includes(day.day)
              return (
                <div
                  key={day.day}
                  className={cn(
                    'p-4 sm:p-5 rounded-2xl border transition-all',
                    isCompleted
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200 bg-white shadow-2xs hover:border-slate-300'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => toggleDayCompletion(day.day)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        id={`day-checkbox-${day.day}`}
                      />
                      <label
                        htmlFor={`day-checkbox-${day.day}`}
                        className="flex items-center gap-2.5 cursor-pointer"
                      >
                        <span
                          className={cn(
                            'w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center border',
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          )}
                        >
                          D{day.day}
                        </span>
                        <h4
                          className={cn(
                            'text-sm font-bold',
                            isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'
                          )}
                        >
                          {day.title}
                        </h4>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{day.estimatedMinutes || 60} mins</span>
                      </span>
                      <span className="text-[11px] text-slate-500 italic hidden md:inline">
                        {day.objective}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="space-y-1.5">
                      {day.tasks.map((task, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <span className={cn(isCompleted && 'text-slate-400')}>{task}</span>
                        </div>
                      ))}
                    </div>

                    {/* EXPECTED OUTCOME */}
                    {day.expectedOutcome && (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 flex items-start gap-2">
                        <span className="font-bold text-slate-900 shrink-0">🎯 Expected Outcome:</span>
                        <span>{day.expectedOutcome}</span>
                      </div>
                    )}

                    {/* AUTHENTIC RESOURCES */}
                    {day.resources && day.resources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Verified Learning Resources:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {day.resources.map((res, rIdx) => (
                            <a
                              key={rIdx}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>{res.label}</span>
                              <ExternalLink className="w-3 h-3 text-indigo-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Job Description & Requirements */}
      {activeTab === 'description' && (
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-6 animate-in fade-in">
          {opportunity.isPartiallyVerified && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Partially Verified Listing</span>
                <span>
                  The full description could not be retrieved from the provider listing endpoint. Requirements are evaluated strictly against confirmed fields without unverified assumptions.
                </span>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Role Overview</h3>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {opportunity.description}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Academic & Experience Eligibility</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Eligible Academic Years:</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {opportunity.eligibleYears && opportunity.eligibleYears.length > 0
                    ? `Year ${opportunity.eligibleYears.join(', ')}`
                    : 'Open to all academic years'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Eligible Degrees:</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {opportunity.eligibleDegrees && opportunity.eligibleDegrees.length > 0
                    ? opportunity.eligibleDegrees.join(', ')
                    : 'Any relevant degree program'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Accepted Academic Branches:</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {opportunity.acceptedBranches && opportunity.acceptedBranches.length > 0
                    ? opportunity.acceptedBranches.join(', ')
                    : 'All branches welcome'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Minimum CGPA:</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {opportunity.minCgpa ? `${opportunity.minCgpa} / 10.0` : 'No minimum CGPA required'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Experience Requirement:</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {opportunity.experienceRequirements || 'Entry-level (No prior experience required)'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Work Mode & Location:</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {opportunity.location} ({opportunity.workMode})
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Required Skills (Mandatory)</h3>
              <div className="flex flex-wrap gap-1.5">
                {opportunity.requiredSkills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs font-semibold"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {opportunity.preferredSkills && opportunity.preferredSkills.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-2">Preferred Skills (Bonus)</h3>
                <div className="flex flex-wrap gap-1.5">
                  {opportunity.preferredSkills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
