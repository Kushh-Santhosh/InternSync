import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Building,
  CheckCircle2,
  Clock,
  KanbanSquare,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { generateSkillGapRoadmap } from '@/lib/matching/roadmap'
import { Button } from '@/components/ui/Button'
import { RecommendationBadge } from '@/components/ui/RecommendationBadge'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { cn } from '@/lib/utils/cn'

export const OpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { opportunities, matches, addApplication, toggleComparison, comparisonIds } = useApp()

  const [activeTab, setActiveTab] = useState<'fit' | 'roadmap' | 'description'>('fit')

  const opportunity = opportunities.find((o) => o.id === id)
  const match = opportunity ? matches.get(opportunity.id) : undefined

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

  const handleApply = () => {
    addApplication(opportunity.id, 'applied', 'Applied via official portal link.')
    window.open(opportunity.applicationUrl, '_blank')
  }

  const handleSaveToPipeline = () => {
    addApplication(opportunity.id, 'saved', 'Saved from opportunity detail page.')
    navigate('/applications')
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
          `You have a strong foundation in core skills, but this role specifically looks for ${match.missingSkills.join(' & ')}. Spend 14 days following the targeted sprint roadmap before submitting.`,
        bannerStyle: 'border-amber-200 bg-amber-50/60 text-amber-950',
        badgeText: 'PREPARE FIRST: Meaningful Gaps — 14-Day Sprint Available',
      }
    }
    return {
      decision: 'Skip this opportunity.',
      rationale:
        match.eligibilityNotes[0] ||
        'This role requires different academic year standing, continuous 6-month co-op terms, or an entirely distinct technical stack.',
      bannerStyle: 'border-slate-200 bg-slate-100/70 text-slate-800',
      badgeText: 'SKIP: Hard Eligibility Mismatch or Low Alignment',
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
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Demo Opportunity
                </span>
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
                  ₹{opportunity.stipendAmount?.toLocaleString()}/month
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
          <div className="flex items-center gap-2">
            <Button
              size="md"
              onClick={handleApply}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              <span>Apply on Company Portal</span>
              <ArrowUpRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button variant="outline" size="md" onClick={handleSaveToPipeline}>
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
            Deadline: {new Date(opportunity.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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

      {/* TAB 1: Fit & Score Breakdown (Priority 5) */}
      {activeTab === 'fit' && (
        <div className="space-y-6 animate-in fade-in">
          {/* WHY YOU MATCH Breakdown */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400">
              Why You Match
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[11px] font-semibold text-slate-500 block">Skills Fit</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">{match.skillScore}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[11px] font-semibold text-slate-500 block">Eligibility</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">{match.eligibilityScore}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[11px] font-semibold text-slate-500 block">Project Evidence</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">{match.projectScore}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[11px] font-semibold text-slate-500 block">Education</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">{match.educationScore}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[11px] font-semibold text-slate-500 block">Location</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">{match.locationScore}%</span>
              </div>
            </div>
          </div>

          {/* EVIDENCE & WHAT'S MISSING (Priority 5) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EVIDENCE SECTION */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Evidence Found</span>
              </h3>

              <div className="space-y-3">
                {match.whyMatched.map((reason, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100/80 flex items-start gap-3 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-emerald-950 block">{reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WHAT'S MISSING SECTION */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>What's Missing</span>
              </h3>

              {match.missingSkills.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No missing skill gaps detected! Your profile satisfies all core prerequisites.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {match.missingSkills.map((skill, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-amber-950">{skill}</div>
                        <div className="text-[11px] text-amber-700 mt-0.5">
                          Prerequisite not yet demonstrated in projects or assessments
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('roadmap')}
                        className="text-xs border-amber-300 text-amber-900 bg-white hover:bg-amber-50"
                      >
                        <span>Study Plan</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 14-Day Preparation Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-2xl border border-indigo-200 bg-indigo-50/40 shadow-xs">
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
          </div>

          {/* Daily Timeline */}
          <div className="space-y-3">
            {roadmap.dailyPlan.map((day) => (
              <div
                key={day.day}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center border border-indigo-100">
                      D{day.day}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{day.title}</h4>
                  </div>
                  <span className="text-[11px] text-slate-500 italic">{day.objective}</span>
                </div>

                <div className="mt-3 space-y-1.5">
                  {day.tasks.map((task, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Job Description & Requirements */}
      {activeTab === 'description' && (
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Role Overview</h3>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {opportunity.description}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Academic & Experience Eligibility</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Eligible Academic Years:</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  Year {opportunity.eligibleYears.join(', ')}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Eligible Degrees:</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {opportunity.eligibleDegrees.join(', ')}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Required Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {opportunity.requiredSkills.map((s) => (
                <span key={s} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
