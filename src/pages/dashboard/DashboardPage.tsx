import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  KanbanSquare,
  RefreshCw,
  Search,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { OpportunityCard } from '@/components/opportunities/OpportunityCard'
import { Button } from '@/components/ui/Button'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { ResumeUploadCard } from '@/components/resume/ResumeUploadCard'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    profile,
    skills,
    opportunities,
    matches,
    applications,
    searchLiveOpportunities,
    searchProgress,
  } = useApp()

  const [isSearching, setIsSearching] = useState(false)
  const [showUploadZone, setShowUploadZone] = useState(skills.length === 0)

  const handleSearch = async () => {
    setIsSearching(true)
    await searchLiveOpportunities(true)
    setIsSearching(false)
  }

  // Dynamic greeting based on time of day
  const hour = new Date().getHours()
  const greetingTime = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile.fullName?.trim() ? profile.fullName.trim().split(' ')[0] : 'there'

  // Count opportunities strictly by recommendation
  const applyNowList = Array.from(matches.values()).filter(
    (m) => m.recommendation === 'APPLY NOW'
  )
  const prepareFirstList = Array.from(matches.values()).filter(
    (m) => m.recommendation === 'PREPARE FIRST'
  )
  const skipList = Array.from(matches.values()).filter((m) => m.recommendation === 'SKIP')

  // Calculate dynamic readiness score from user skills or matches
  const averageMatch = matches.size > 0
    ? Math.round(
        Array.from(matches.values()).reduce((acc, m) => acc + m.overallMatchScore, 0) / matches.size
      )
    : skills.length > 0
    ? Math.min(92, Math.round(skills.reduce((acc, s) => acc + s.confidence, 0) / skills.length))
    : 72

  // Top opportunities for focused student action
  const topOpportunities = [...opportunities]
    .map((opp) => ({
      opp,
      match: matches.get(opp.id),
    }))
    .filter(
      (item): item is { opp: (typeof opportunities)[0]; match: NonNullable<ReturnType<typeof matches.get>> } =>
        item.match !== undefined
    )
    .sort((a, b) => b.match.overallMatchScore - a.match.overallMatchScore)
    .slice(0, 3)

  // Top skill gaps detected across opportunities
  const missingSkillFrequency = new Map<string, number>()
  for (const m of matches.values()) {
    for (const missing of m.missingSkills) {
      missingSkillFrequency.set(missing, (missingSkillFrequency.get(missing) || 0) + 1)
    }
  }
  const topSkillGaps = Array.from(missingSkillFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([skill]) => skill)

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Live Search Progress Callout if active */}
      {searchProgress.stage !== 'idle' && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              <span>Live Opportunity Discovery in Progress</span>
            </span>
            <span className="text-indigo-600 font-mono text-[11px]">{searchProgress.stage}</span>
          </div>
          <p className="text-indigo-700">{searchProgress.message}</p>
        </div>
      )}

      {/* Greeting & Action Header */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {greetingTime}, {firstName}.
          </h1>
          <p className="text-base text-slate-500 mt-1 font-medium">
            What are you looking for?
          </p>
        </div>

        {/* 3 Core Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setShowUploadZone(!showUploadZone)}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
              <span>Upload resume</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Extract skills and build your Career DNA automatically.
            </p>
          </button>

          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
              <span>Find internships</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Search live company portals matching your exact verified stack.
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/dream-internship')}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-400 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-3 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
              <span>Find my dream internship</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Target top companies (Google, NVIDIA, etc.) with a 14-day roadmap.
            </p>
          </button>
        </div>

        {/* Collapsible / Prominent Resume Dropzone */}
        {showUploadZone && (
          <div className="animate-fadeIn">
            <ResumeUploadCard
              onSuccess={() => {
                setShowUploadZone(false)
                handleSearch()
              }}
            />
          </div>
        )}
      </div>

      {/* 4 Core Value Metric Widgets: Career Readiness, Opportunity Matches, Skill Gaps, Applications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Career Readiness */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Career Readiness
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{averageMatch}%</div>
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Competitive Candidate</span>
            </div>
          </div>
          <ScoreRing score={averageMatch} size="sm" showLabel={false} />
        </div>

        {/* 2. Opportunity Matches */}
        <div
          onClick={() => navigate('/opportunities')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Opportunity Matches
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {opportunities.length}
              <span className="text-xs font-semibold text-slate-500 ml-1.5">roles</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold">
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {applyNowList.length} Apply
            </span>
            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              {prepareFirstList.length} Prepare
            </span>
          </div>
        </div>

        {/* 3. Skill Gaps */}
        <div
          onClick={() => navigate('/skill-lab')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Identified Skill Gaps
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {topSkillGaps.length ? `${topSkillGaps.length} Priority` : '0 Gaps'}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-2">
            {topSkillGaps.length ? `Bridge: ${topSkillGaps.join(', ')}` : 'Full alignment with current roles'}
          </div>
        </div>

        {/* 4. Applications */}
        <div
          onClick={() => navigate('/applications')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Applications
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {applications.length}
              <span className="text-xs font-semibold text-slate-500 ml-1.5">tracked</span>
            </div>
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 mt-2">
            <KanbanSquare className="w-3.5 h-3.5" />
            <span>Open Application Board</span>
          </div>
        </div>
      </div>

      {/* Tri-State Decision Cards Grid (Apply Now / Prepare First / Skip) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Readiness Breakdown
          </h2>
          <span className="text-xs text-slate-500">{opportunities.length} Total Verified Listings</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* APPLY NOW CARD */}
          <div
            onClick={() => navigate('/opportunities?filter=apply')}
            className="p-6 rounded-2xl border border-emerald-300/80 bg-emerald-50/40 hover:bg-emerald-50/70 hover:border-emerald-400 transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  APPLY NOW
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  High Fit
                </span>
              </div>
              <div className="text-4xl font-black text-emerald-950 mt-3">
                {applyNowList.length}
                <span className="text-sm font-semibold text-emerald-800 ml-1.5">opportunities</span>
              </div>
              <p className="text-xs text-emerald-800/90 mt-2 leading-relaxed">
                Eligibility validated with verifiable skill and project evidence in your Career DNA.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-800 font-semibold group-hover:text-emerald-950">
              <span>View high-readiness roles</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* PREPARE FIRST CARD */}
          <div
            onClick={() => navigate('/opportunities?filter=prepare')}
            className="p-6 rounded-2xl border border-amber-300/80 bg-amber-50/40 hover:bg-amber-50/70 hover:border-amber-400 transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  PREPARE FIRST
                </span>
                <span className="text-xs font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full">
                  14-Day Sprint
                </span>
              </div>
              <div className="text-4xl font-black text-amber-950 mt-3">
                {prepareFirstList.length}
                <span className="text-sm font-semibold text-amber-800 ml-1.5">opportunities</span>
              </div>
              <p className="text-xs text-amber-800/90 mt-2 leading-relaxed">
                Reasonable fit with addressable skill gaps. Follow our guided plan before applying.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-800 font-semibold group-hover:text-amber-950">
              <span>View preparation sprints</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* SKIP CARD */}
          <div
            onClick={() => navigate('/opportunities?filter=skip')}
            className="p-6 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  SKIP
                </span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Ineligible
                </span>
              </div>
              <div className="text-4xl font-black text-slate-900 mt-3">
                {skipList.length}
                <span className="text-sm font-semibold text-slate-500 ml-1.5">opportunities</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Hard mismatch (e.g. requires final-year graduation, 6-month full time, or unaligned stack).
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold group-hover:text-slate-900">
              <span>Understand mismatches</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* TOP OPPORTUNITIES: Top Matches Aligned with User */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Top Recommended Opportunities</h2>
            <p className="text-xs text-slate-500">
              The highest-readiness opportunities aligned with your current Career DNA.
            </p>
          </div>
          <Link to="/opportunities">
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold">
              <span>View All Opportunities</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {topOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {topOpportunities.map(({ opp, match }) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                match={match}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
            <p className="text-xs text-slate-500">No matching opportunities loaded yet.</p>
            <Button
              size="sm"
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-indigo-600 text-white text-xs px-4"
            >
              <Search className="w-3.5 h-3.5 mr-1.5" />
              <span>Search Live Opportunities</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
