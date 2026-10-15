import { AdzunaProvider } from '../providers/AdzunaProvider'
import { DemoProvider } from '../providers/DemoProvider'
import { OpenRouterWebProvider } from '../providers/OpenRouterWebProvider'
import { GeminiSearchProvider } from '../providers/GeminiSearchProvider'
import type { OpportunityProvider } from '../providers/OpportunityProvider'
import { generateSearchQueries } from './query-generator'
import { deduplicateOpportunities } from '../deduplication/deduplicator'
import {
  buildOpportunityFromExtraction,
  extractRequirementsDeterministically,
} from '../extraction/requirement-extractor'
import { verifyOpportunityUrl } from '../url-verifier/url-verifier'
import { calculateMatch } from '@/lib/matching/engine'
import { generateOpportunityId } from '@/lib/utils/uuid'
import type {
  LiveSearchProgress,
  MatchResult,
  Opportunity,
  ProjectItem,
  RawSearchResult,
  SearchQuery,
  SkillEvidenceItem,
  StudentProfile,
} from '@/types'

export interface SearchOrchestratorConfig {
  openrouterApiKey?: string
  geminiApiKey?: string
  adzunaEnabled?: boolean
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

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return []
  const results: R[] = new Array(items.length)
  let currentIndex = 0

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (currentIndex < items.length) {
      const idx = currentIndex++
      results[idx] = await fn(items[idx])
    }
  })

  await Promise.all(workers)
  return results
}

function deduplicateRawResults(results: RawSearchResult[]): RawSearchResult[] {
  const seen = new Set<string>()
  const deduped: RawSearchResult[] = []
  for (const item of results) {
    const key = item.url
      ? item.url.toLowerCase().trim()
      : `${item.title.toLowerCase().trim()}___${(item.domain || item.source || '').toLowerCase().trim()}`
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(item)
    }
  }
  return deduped
}

export class OpportunitySearchOrchestrator {
  private openrouterProvider: OpenRouterWebProvider
  private geminiProvider: GeminiSearchProvider
  private adzunaProvider: AdzunaProvider
  private adzunaEnabled: boolean
  private demoProvider: DemoProvider
  private maxQueries: number
  private maxWebResults: number
  private maxAnalyzed: number

  constructor(config: SearchOrchestratorConfig = {}) {
    this.openrouterProvider = new OpenRouterWebProvider({
      apiKey: config.openrouterApiKey,
    })
    this.geminiProvider = new GeminiSearchProvider({
      apiKey: config.geminiApiKey,
    })
    this.adzunaEnabled = config.adzunaEnabled ?? false
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
    projects: ProjectItem[] = [],
    isDemoMode = false,
    onProgress?: (progress: LiveSearchProgress) => void,
    forceRefresh = false
  ): Promise<SearchRunResult> {
    const cacheKey = `${student.id}_${isDemoMode}_${skills.map((s) => s.skillName).sort().join(',')}_${projects.map((p) => p.title).sort().join(',')}`

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
      const demoTaskResults = await runWithConcurrency(
        queries,
        4,
        async (q: SearchQuery) => this.demoProvider.search(q)
      )
      const rawResults = demoTaskResults.flat()
      const dedupedRaw = deduplicateRawResults(rawResults)

      const extractedOpps = dedupedRaw.map((raw: RawSearchResult) => {
        const extraction = extractRequirementsDeterministically(raw)
        const oppId = generateOpportunityId(raw.url || extraction.application_url, extraction.company, extraction.title)
        return buildOpportunityFromExtraction(oppId, raw, extraction, 'VERIFIED')
      }).filter((opp) => opp.freshnessStatus !== 'expired' && opp.freshnessStatus !== 'closed')

      const deduped = deduplicateOpportunities(extractedOpps)
      const matches = new Map<string, MatchResult>()
      let applyNow = 0
      let prepareFirst = 0
      let skip = 0

      for (const opp of deduped) {
        const match = calculateMatch({
          student,
          skills,
          projects,
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
    activeProviders.push(this.geminiProvider)
    if (this.adzunaEnabled && this.adzunaProvider.isConfigured()) {
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

    // Fan out search tasks concurrently with bounded concurrency (3 tasks at a time)
    const queryTasks: Array<{ query: SearchQuery; provider: OpportunityProvider }> = []
    for (const q of queries) {
      for (const provider of activeProviders) {
        queryTasks.push({ query: q, provider })
      }
    }

    const taskResults = await runWithConcurrency(
      queryTasks,
      3,
      async ({ query, provider }: { query: SearchQuery; provider: OpportunityProvider }) => {
        try {
          const timeoutPromise = new Promise<RawSearchResult[]>((_, reject) =>
            setTimeout(() => reject(new Error('Search provider timeout')), 8000)
          )
          return await Promise.race([provider.search(query), timeoutPromise])
        } catch {
          return []
        }
      }
    )

    const rawDiscovered: RawSearchResult[] = taskResults.flat()

    // 4. Stage: Deduplicating and parallel extraction
    onProgress?.({
      stage: 'deduplicating',
      message: `Discovered ${rawDiscovered.length} raw listings. Deduplicating and verifying URLs...`,
      totalFound: rawDiscovered.length,
      relevantFound: 0,
      applyNowCount: 0,
      prepareFirstCount: 0,
      skipCount: 0,
    })

    // Deduplicate raw listings BEFORE running expensive URL verification
    const dedupedRaw = deduplicateRawResults(rawDiscovered).slice(0, this.maxAnalyzed)

    // Verify URLs and extract requirements in parallel (5 concurrent items)
    const extractedOpps = await runWithConcurrency(
      dedupedRaw,
      5,
      async (raw: RawSearchResult) => {
        const urlStatus = await verifyOpportunityUrl(raw.url)
        const extraction = extractRequirementsDeterministically(raw)
        const oppId = generateOpportunityId(raw.url || extraction.application_url, extraction.company, extraction.title)
        const opp = buildOpportunityFromExtraction(oppId, raw, extraction, urlStatus.status)
        return opp
      }
    )

    // Strict freshness rule: exclude confirmed expired or archived/closed postings from active recommendations
    const freshOpps = extractedOpps.filter(
      (opp) => opp.freshnessStatus !== 'expired' && opp.freshnessStatus !== 'closed'
    )

    const deduped = deduplicateOpportunities(freshOpps)

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
        projects,
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
