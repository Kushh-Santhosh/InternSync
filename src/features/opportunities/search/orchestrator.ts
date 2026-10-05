import { AdzunaProvider } from '../providers/AdzunaProvider'
import { DemoProvider } from '../providers/DemoProvider'
import { OpenRouterWebProvider } from '../providers/OpenRouterWebProvider'
import type { OpportunityProvider } from '../providers/OpportunityProvider'
import { generateSearchQueries } from './query-generator'
import { deduplicateOpportunities } from '../deduplication/deduplicator'
import {
  buildOpportunityFromExtraction,
  extractRequirementsDeterministically,
} from '../extraction/requirement-extractor'
import { verifyOpportunityUrl } from '../url-verifier/url-verifier'
import { calculateMatch } from '@/lib/matching/engine'
import type {
  LiveSearchProgress,
  MatchResult,
  Opportunity,
  RawSearchResult,
  SkillEvidenceItem,
  StudentProfile,
} from '@/types'

export interface SearchOrchestratorConfig {
  openrouterApiKey?: string
  adzunaAppId?: string
  adzunaAppKey?: string
  adzunaCountry?: string
  maxQueries?: number
  maxWebResults?: number
  maxAnalyzed?: number
}

export interface SearchRunResult {
  opportunities: Opportunity[]
  matches: Map<string, MatchResult>
  counts: {
    totalDiscovered: number
    deduplicated: number
    analyzed: number
    applyNow: number
    prepareFirst: number
    skip: number
  }
}

// In-memory discovery cache with 45-minute TTL
interface CacheEntry {
  timestamp: number
  result: SearchRunResult
}
const searchCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 45 * 60 * 1000

export class OpportunitySearchOrchestrator {
  private openrouterProvider: OpenRouterWebProvider
  private adzunaProvider: AdzunaProvider
  private demoProvider: DemoProvider
  private maxQueries: number
  private maxWebResults: number
  private maxAnalyzed: number

  constructor(config: SearchOrchestratorConfig = {}) {
    this.openrouterProvider = new OpenRouterWebProvider({
      apiKey: config.openrouterApiKey,
    })
    this.adzunaProvider = new AdzunaProvider({
      appId: config.adzunaAppId,
      appKey: config.adzunaAppKey,
      country: config.adzunaCountry || 'in',
    })
    this.demoProvider = new DemoProvider()
    this.maxQueries = config.maxQueries || 6
    this.maxWebResults = config.maxWebResults || 30
    this.maxAnalyzed = config.maxAnalyzed || 15
  }

  async runDiscovery(
    student: StudentProfile,
    skills: SkillEvidenceItem[],
    isDemoMode: boolean,
    onProgress?: (progress: LiveSearchProgress) => void,
    forceRefresh = false
  ): Promise<SearchRunResult> {
    const cacheKey = `${student.id}_${isDemoMode}_${skills.map((s) => s.skillName).sort().join(',')}`

    if (!forceRefresh) {
      const cached = searchCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.result
      }
    }

    // 1. Stage: Reading DNA
    onProgress?.({
      stage: 'reading_dna',
      message: `Analyzing Career DNA for ${student.fullName || 'Candidate'}...`,
      totalFound: 0,
      relevantFound: 0,
      applyNowCount: 0,
      prepareFirstCount: 0,
      skipCount: 0,
    })

    const topSkills = skills
      .filter((s) => s.confidence >= 60)
      .sort((a, b) => b.confidence - a.confidence)
      .map((s) => s.skillName)

    // 2. Stage: Generate targeted queries
    onProgress?.({
      stage: 'generating_queries',
      message: 'Generating multi-vector search queries from Career DNA...',
      totalFound: 0,
      relevantFound: 0,
      applyNowCount: 0,
      prepareFirstCount: 0,
      skipCount: 0,
    })

    const queries = generateSearchQueries(student, topSkills, {
      maxQueries: this.maxQueries,
    })

    // If Demo Mode, use DemoProvider
    if (isDemoMode) {
      const rawResults: RawSearchResult[] = []
      for (const q of queries) {
        const res = await this.demoProvider.search(q)
        rawResults.push(...res)
      }

      const extractedOpps = rawResults.map((raw, i) => {
        const extraction = extractRequirementsDeterministically(raw)
        return buildOpportunityFromExtraction(`opp-live-demo-${i}`, raw, extraction)
      })

      const deduped = deduplicateOpportunities(extractedOpps)
      const matches = new Map<string, MatchResult>()
      let applyNow = 0
      let prepareFirst = 0
      let skip = 0

      for (const opp of deduped) {
        const match = calculateMatch({
          student,
          skills,
          projects: [],
          opportunity: opp,
        })
        matches.set(opp.id, match)
        if (match.recommendation === 'APPLY NOW') applyNow++
        else if (match.recommendation === 'PREPARE FIRST') prepareFirst++
        else skip++
      }

      const outcome: SearchRunResult = {
        opportunities: deduped,
        matches,
        counts: {
          totalDiscovered: rawResults.length,
          deduplicated: deduped.length,
          analyzed: deduped.length,
          applyNow,
          prepareFirst,
          skip,
        },
      }

      searchCache.set(cacheKey, { timestamp: Date.now(), result: outcome })
      return outcome
    }

    // Connected Mode: Check providers
    const activeProviders: OpportunityProvider[] = []
    activeProviders.push(this.openrouterProvider)
    if (this.adzunaProvider.isConfigured()) {
      activeProviders.push(this.adzunaProvider)
    }

    // 3. Stage: Searching live web
    onProgress?.({
      stage: 'searching_web',
      message: 'Searching the live web and configured opportunity sources...',
      totalFound: 0,
      relevantFound: 0,
      applyNowCount: 0,
      prepareFirstCount: 0,
      skipCount: 0,
    })

    const rawDiscovered: RawSearchResult[] = []
    for (const q of queries) {
      for (const provider of activeProviders) {
        try {
          const results = await provider.search(q)
          rawDiscovered.push(...results)
        } catch {
          // continue
        }
      }
      if (rawDiscovered.length >= this.maxWebResults) break
    }

    // 4. Stage: Deduplicating
    onProgress?.({
      stage: 'deduplicating',
      message: `Discovered ${rawDiscovered.length} raw listings. Deduplicating and verifying URLs...`,
      totalFound: rawDiscovered.length,
      relevantFound: 0,
      applyNowCount: 0,
      prepareFirstCount: 0,
      skipCount: 0,
    })

    const extractedOpps: Opportunity[] = []
    const limitedRaw = rawDiscovered.slice(0, this.maxAnalyzed)

    for (let i = 0; i < limitedRaw.length; i++) {
      const raw = limitedRaw[i]
      const urlStatus = await verifyOpportunityUrl(raw.url)
      const extraction = extractRequirementsDeterministically(raw)
      const opp = buildOpportunityFromExtraction(`opp-live-${Date.now()}-${i}`, raw, extraction)
      opp.urlStatus = urlStatus.status
      extractedOpps.push(opp)
    }

    const deduped = deduplicateOpportunities(extractedOpps)

    // 5. Stage: Matching
    onProgress?.({
      stage: 'matching',
      message: 'Running deterministic 8-factor matching engine against Career DNA...',
      totalFound: rawDiscovered.length,
      relevantFound: deduped.length,
      applyNowCount: 0,
      prepareFirstCount: 0,
      skipCount: 0,
    })

    const matches = new Map<string, MatchResult>()
    let applyNow = 0
    let prepareFirst = 0
    let skip = 0

    for (const opp of deduped) {
      const match = calculateMatch({
        student,
        skills,
        projects: [],
        opportunity: opp,
      })
      matches.set(opp.id, match)
      if (match.recommendation === 'APPLY NOW') applyNow++
      else if (match.recommendation === 'PREPARE FIRST') prepareFirst++
      else skip++
    }

    const runResult: SearchRunResult = {
      opportunities: deduped,
      matches,
      counts: {
        totalDiscovered: rawDiscovered.length,
        deduplicated: deduped.length,
        analyzed: deduped.length,
        applyNow,
        prepareFirst,
        skip,
      },
    }

    searchCache.set(cacheKey, { timestamp: Date.now(), result: runResult })

    onProgress?.({
      stage: 'completed',
      message: `Completed discovery: ${applyNow} Apply Now, ${prepareFirst} Prepare First, ${skip} Skip.`,
      totalFound: rawDiscovered.length,
      relevantFound: deduped.length,
      applyNowCount: applyNow,
      prepareFirstCount: prepareFirst,
      skipCount: skip,
    })

    return runResult
  }
}
