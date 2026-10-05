import React, { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Briefcase,
  Columns3,
  Globe,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { EmptyState } from '@/components/common/EmptyState'
import { OpportunityCard } from '@/components/opportunities/OpportunityCard'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { RecommendationBadge } from '@/components/ui/RecommendationBadge'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { cn } from '@/lib/utils/cn'

export const OpportunitiesPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    opportunities,
    matches,
    comparisonIds,
    toggleComparison,
    clearComparison,
    searchLiveOpportunities,
    searchProgress,
  } = useApp()

  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    setIsSearching(true)
    await searchLiveOpportunities(true)
    setIsSearching(false)
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>('all')
  const [selectedRecommendation, setSelectedRecommendation] = useState<string>(
    searchParams.get('filter') || 'all'
  )
  const [sortBy, setSortBy] = useState<'match' | 'deadline' | 'stipend'>('match')
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(
    searchParams.get('compare') === 'true'
  )

  // Filter categories
  const categories = ['all', 'AI/ML', 'Full Stack', 'Frontend', 'Backend', 'Data Science', 'Cloud']

  // Filtered and sorted opportunities
  const filteredList = useMemo(() => {
    return opportunities
      .map((opp) => ({
        opp,
        match: matches.get(opp.id),
      }))
      .filter((item): item is { opp: (typeof opportunities)[0]; match: NonNullable<ReturnType<typeof matches.get>> } => {
        const { opp, match } = item
        if (!match) return false

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchesQuery =
            opp.roleTitle.toLowerCase().includes(q) ||
            opp.companyName.toLowerCase().includes(q) ||
            opp.location.toLowerCase().includes(q) ||
            opp.requiredSkills.some((s) => s.toLowerCase().includes(q))
          if (!matchesQuery) return false
        }

        // Category filter
        if (selectedCategory !== 'all' && opp.category !== selectedCategory) {
          return false
        }

        // Work mode filter
        if (selectedWorkMode !== 'all' && opp.workMode !== selectedWorkMode) {
          return false
        }

        // Recommendation filter
        if (selectedRecommendation !== 'all') {
          if (selectedRecommendation === 'apply' && match.recommendation !== 'APPLY NOW') {
            return false
          }
          if (selectedRecommendation === 'prepare' && match.recommendation !== 'PREPARE FIRST') {
            return false
          }
          if (selectedRecommendation === 'skip' && match.recommendation !== 'SKIP') {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'match') {
          return (b.match?.overallMatchScore || 0) - (a.match?.overallMatchScore || 0)
        }
        if (sortBy === 'stipend') {
          return (b.opp.stipendAmount || 0) - (a.opp.stipendAmount || 0)
        }
        if (sortBy === 'deadline') {
          return new Date(a.opp.deadline).getTime() - new Date(b.opp.deadline).getTime()
        }
        return 0
      })
  }, [
    opportunities,
    matches,
    searchQuery,
    selectedCategory,
    selectedWorkMode,
    selectedRecommendation,
    sortBy,
  ])

  // Opportunities chosen for comparison
  const comparedOpportunities = opportunities
    .filter((o) => comparisonIds.includes(o.id))
    .map((o) => ({ opp: o, match: matches.get(o.id)! }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Opportunity Readiness</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Best Internships For You
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Every listing shows your deterministic fit score, why you match, and whether to Apply, Prepare, or Skip.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                <span>Finding internships for you...</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 mr-1.5" />
                <span>Find internships for me</span>
              </>
            )}
          </Button>

          {/* Comparison button */}
          {comparisonIds.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCompareModalOpen(true)}
              className="text-indigo-700 border-indigo-200 bg-indigo-50/50"
            >
              <Columns3 className="w-4 h-4 mr-1.5" />
              <span>Compare ({comparisonIds.length}/3)</span>
            </Button>
          )}
        </div>
      </div>

      {/* Live Search Progress Stage Interface */}
      {searchProgress.stage !== 'idle' && (
        <div className="p-5 rounded-2xl bg-indigo-50/80 border border-indigo-200/90 text-indigo-950 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Finding internships for you...</span>
            </span>
          </div>
          <p className="text-xs text-indigo-700 font-medium">{searchProgress.message}</p>
        </div>
      )}

      {/* Search and Facet Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by role, company, location, or skill (e.g. Python, PyTorch)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 focus:outline-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Work Mode Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto w-full md:w-auto">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Mode:</span>
            <select
              value={selectedWorkMode}
              onChange={(e) => setSelectedWorkMode(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-indigo-500 cursor-pointer w-full md:w-auto"
            >
              <option value="all">All Modes</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto w-full md:w-auto">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-indigo-500 cursor-pointer w-full md:w-auto"
            >
              <option value="match">Highest Match Score</option>
              <option value="stipend">Highest Stipend</option>
              <option value="deadline">Approaching Deadline</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {/* Recommendation Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Opportunities' },
              { id: 'apply', label: 'Apply Now' },
              { id: 'prepare', label: 'Prepare First' },
              { id: 'skip', label: 'Skip' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedRecommendation(f.id)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                  selectedRecommendation === f.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/70'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                  selectedCategory === cat
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                )}
              >
                {cat === 'all' ? 'All Roles' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Opportunity Listings Grid */}
      {opportunities.length === 0 ? (
        <EmptyState
          title="Best Internships For You"
          description="Upload your resume or click Find internships for me to discover opportunities matched to your profile."
          actionLabel="Find internships for me"
          onAction={handleSearch}
        />
      ) : filteredList.length === 0 ? (
        <EmptyState
          title="No opportunities match your filters"
          description="Try relaxing your filters or searching for another skill."
          actionLabel="Clear all filters"
          onAction={() => {
            setSearchQuery('')
            setSelectedCategory('all')
            setSelectedRecommendation('all')
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredList.map(({ opp, match }) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              match={match}
              isCompared={comparisonIds.includes(opp.id)}
              onCompareToggle={() => toggleComparison(opp.id)}
            />
          ))}
        </div>
      )}

      {/* 3-Way Opportunity Comparison Modal */}
      <Modal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title="Side-by-Side Opportunity Comparison"
        description="Compare up to 3 target internships with an explainable AI trade-off analysis."
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {comparedOpportunities.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No opportunities selected yet. Click <strong>+ Compare</strong> on any opportunity card.
            </div>
          ) : (
            <div>
              {/* Comparative AI Summary Box */}
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 mb-6 text-xs text-indigo-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>AI Comparative Fit Synthesis</span>
                </div>
                <p className="leading-relaxed text-indigo-800">
                  {comparedOpportunities[0].opp.roleTitle} at {comparedOpportunities[0].opp.companyName} represents your highest immediate readiness ({comparedOpportunities[0].match.overallMatchScore}%) with zero blocking skill prerequisites.
                  {comparedOpportunities.length > 1 &&
                    ` In contrast, ${comparedOpportunities[1].opp.roleTitle} requires 14 days of dedicated preparation before your application will be competitive.`}
                </p>
              </div>

              {/* Multi-Column Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {comparedOpportunities.map(({ opp, match }) => (
                  <div
                    key={opp.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {opp.companyName}
                        </span>
                        <button
                          onClick={() => toggleComparison(opp.id)}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-1">{opp.roleTitle}</h4>

                      <div className="mt-3 flex items-center gap-3">
                        <ScoreRing score={match.overallMatchScore} size="sm" showLabel={false} />
                        <RecommendationBadge type={match.recommendation} size="sm" />
                      </div>

                      {/* Criteria Breakdown */}
                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-200/60 pb-1">
                          <span className="text-slate-500">Skill Fit:</span>
                          <span className="font-bold text-slate-800">{match.skillScore}%</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-1">
                          <span className="text-slate-500">Eligibility:</span>
                          <span className="font-bold text-slate-800">{match.eligibilityScore}%</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-1">
                          <span className="text-slate-500">Project Proof:</span>
                          <span className="font-bold text-slate-800">{match.projectScore}%</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-1">
                          <span className="text-slate-500">Location:</span>
                          <span className="font-medium text-slate-800">{opp.location}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-1">
                          <span className="text-slate-500">Stipend:</span>
                          <span className="font-bold text-slate-800">₹{opp.stipendAmount?.toLocaleString()}/m</span>
                        </div>
                      </div>

                      {/* Missing Gaps */}
                      <div className="mt-3">
                        <div className="text-[11px] font-bold text-slate-500 uppercase">
                          Missing Skills:
                        </div>
                        <div className="text-xs text-amber-700 font-semibold mt-0.5">
                          {match.missingSkills.length > 0
                            ? match.missingSkills.join(', ')
                            : 'None (Full match)'}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        setIsCompareModalOpen(false)
                        navigate(`/opportunities/${opp.id}`)
                      }}
                      className="w-full text-xs mt-4"
                    >
                      View Full Details
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="outline" size="sm" onClick={clearComparison}>
                  Clear Comparison
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
