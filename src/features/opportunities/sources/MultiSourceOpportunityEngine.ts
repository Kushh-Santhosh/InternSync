import type { RawSearchResult, SearchQuery } from '../../../types/index.ts'
import { getVerifiedEmployerSources, type EmployerSource } from './registry.ts'
import { GreenhouseSourceAdapter } from './GreenhouseSourceAdapter.ts'
import { LeverSourceAdapter } from './LeverSourceAdapter.ts'
import { AshbySourceAdapter } from './AshbySourceAdapter.ts'
import { PublicFeedsAdapter } from './PublicFeedsAdapter.ts'

export interface MultiSourceEngineResult {
  results: RawSearchResult[]
  totalDiscovered: number
  uniqueCount: number
  sourcesQueried: string[]
  durationMs: number
}

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

export class MultiSourceOpportunityEngine {
  private greenhouseAdapter = new GreenhouseSourceAdapter()
  private leverAdapter = new LeverSourceAdapter()
  private ashbyAdapter = new AshbySourceAdapter()
  private publicFeedsAdapter = new PublicFeedsAdapter()

  /**
   * Discovers genuine opportunity listings across verified employer boards and public feeds.
   * Completely independent of paid AI search engines.
   */
  async search(query: SearchQuery): Promise<MultiSourceEngineResult> {
    const t0 = Date.now()
    const queryText = query.text || ''
    const targetRole = query.role || ''
    const location = query.location || 'India'

    const verifiedSources = getVerifiedEmployerSources()
    const sourcesQueried: string[] = []

    // 1. Concurrently query verified employer boards (concurrency limit 6)
    const boardResults = await runWithConcurrency(
      verifiedSources,
      6,
      async (source: EmployerSource) => {
        sourcesQueried.push(`${source.provider.toUpperCase()} (${source.name})`)
        try {
          if (source.provider === 'greenhouse') {
            return await this.greenhouseAdapter.searchEmployer(source, queryText, targetRole, location)
          } else if (source.provider === 'lever') {
            return await this.leverAdapter.searchEmployer(source, queryText, targetRole, location)
          } else {
            return await this.ashbyAdapter.searchEmployer(source, queryText, targetRole, location)
          }
        } catch {
          return []
        }
      }
    )

    // 2. Query permitted public feed
    sourcesQueried.push('Jobicy Remote Tech Feed')
    const feedResults = await this.publicFeedsAdapter.searchFeed(queryText, targetRole, location).catch(() => [])

    const allRaw = [...boardResults.flat(), ...feedResults]

    // 3. Deduplicate by canonical URL and title/company identity
    const seenUrls = new Set<string>()
    const seenIdentities = new Set<string>()
    const uniqueResults: RawSearchResult[] = []

    for (const item of allRaw) {
      const cleanUrl = item.url ? item.url.split('?')[0].toLowerCase().trim() : ''
      const cleanIdentity = item.title.toLowerCase().trim()

      if (cleanUrl && seenUrls.has(cleanUrl)) continue
      if (seenIdentities.has(cleanIdentity)) continue

      if (cleanUrl) seenUrls.add(cleanUrl)
      seenIdentities.add(cleanIdentity)
      uniqueResults.push(item)
    }

    // Sort by freshness and relevance
    uniqueResults.sort((a, b) => {
      const timeA = Date.parse(a.discoveredAt) || 0
      const timeB = Date.parse(b.discoveredAt) || 0
      return timeB - timeA
    })

    const durationMs = Date.now() - t0

    return {
      results: uniqueResults,
      totalDiscovered: allRaw.length,
      uniqueCount: uniqueResults.length,
      sourcesQueried,
      durationMs,
    }
  }
}
