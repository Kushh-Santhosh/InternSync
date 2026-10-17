import type { RawSearchResult } from '../../../types/index.ts'
import type { EmployerSource } from './registry.ts'

interface LeverPosting {
  id: string
  text: string
  hostedUrl: string
  applyUrl?: string
  createdAt?: number
  descriptionPlain?: string
  description?: string
  categories?: {
    commitment?: string
    department?: string
    location?: string
    team?: string
    allLocations?: string[]
  }
  workplaceType?: string
}

interface CacheItem {
  timestamp: number
  postings: LeverPosting[]
}

// In-memory cache for Lever postings (45 minutes TTL)
const leverCache = new Map<string, CacheItem>()
const LEVER_CACHE_TTL = 45 * 60 * 1000

export class LeverSourceAdapter {
  /**
   * Fetches all current published postings for a verified Lever company token.
   * Utilizes server-side caching to prevent repeated network round-trips.
   */
  async fetchPostings(source: EmployerSource): Promise<LeverPosting[]> {
    const cached = leverCache.get(source.boardToken)
    if (cached && Date.now() - cached.timestamp < LEVER_CACHE_TTL) {
      return cached.postings
    }

    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(source.boardToken)}?mode=json`

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'InternSync-ReadinessPlatform/1.0 (Opportunity Discovery Engine)',
        },
        signal: AbortSignal.timeout(6000),
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      const postings = Array.isArray(data) ? (data as LeverPosting[]) : []

      leverCache.set(source.boardToken, {
        timestamp: Date.now(),
        postings,
      })

      return postings
    } catch {
      return []
    }
  }

  /**
   * Searches a specific Lever employer board for postings matching query parameters.
   */
  async searchEmployer(
    source: EmployerSource,
    queryText: string,
    targetRole?: string,
    locationFilter?: string
  ): Promise<RawSearchResult[]> {
    const postings = await this.fetchPostings(source)
    if (postings.length === 0) return []

    const qLower = (queryText || '').toLowerCase().trim()
    const roleLower = (targetRole || '').toLowerCase().trim()
    const locLower = (locationFilter || '').toLowerCase().trim()

    const isInternTarget =
      qLower.includes('intern') ||
      roleLower.includes('intern') ||
      qLower.includes('student') ||
      qLower.includes('trainee') ||
      qLower.includes('graduate') ||
      qLower.includes('early')

    const matchedPostings = postings.filter((posting) => {
      const titleLower = (posting.text || '').toLowerCase()
      const commitment = (posting.categories?.commitment || '').toLowerCase()
      const jobLoc = (posting.categories?.location || '').toLowerCase()
      const allLocs = (posting.categories?.allLocations || []).map((l) => l.toLowerCase()).join(' ')
      const combinedLoc = `${jobLoc} ${allLocs} ${posting.workplaceType || ''}`.toLowerCase()

      // 1. Role / Title / Commitment matching
      const isInternTitle =
        titleLower.includes('intern') ||
        titleLower.includes('trainee') ||
        titleLower.includes('apprentice') ||
        titleLower.includes('co-op') ||
        titleLower.includes('graduate') ||
        titleLower.includes('junior') ||
        titleLower.includes('associate') ||
        commitment.includes('intern')

      const matchesKeyword =
        !qLower ||
        titleLower.includes(qLower) ||
        (roleLower && titleLower.includes(roleLower)) ||
        qLower.split(' ').some((term) => term.length > 3 && titleLower.includes(term))

      if (isInternTarget && !isInternTitle) {
        if (!titleLower.includes('engineer') && !titleLower.includes('developer') && !titleLower.includes('analyst')) {
          return false
        }
      }

      if (!matchesKeyword && !isInternTitle) {
        return false
      }

      // 2. Location matching
      if (locLower && locLower !== 'any' && locLower !== 'all') {
        const isRemoteJob =
          combinedLoc.includes('remote') ||
          posting.workplaceType === 'remote' ||
          combinedLoc.includes('worldwide')

        const matchesLoc =
          isRemoteJob ||
          combinedLoc.includes(locLower) ||
          (locLower === 'india' && (combinedLoc.includes('bangalore') || combinedLoc.includes('bengaluru') || combinedLoc.includes('noida') || combinedLoc.includes('gurgaon') || combinedLoc.includes('hyderabad') || combinedLoc.includes('pune') || combinedLoc.includes('mumbai') || combinedLoc.includes('delhi')))

        if (!matchesLoc) {
          if (locLower === 'india' || locLower === 'bengaluru' || locLower === 'bangalore') {
            return false
          }
        }
      }

      return true
    })

    return matchedPostings.map((posting) => {
      const plainDesc =
        posting.descriptionPlain ||
        (posting.description || '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

      const snippet = plainDesc.slice(0, 350)
      const locName = posting.categories?.location || 'Remote / Multiple Locations'

      return {
        title: `${posting.text} @ ${source.name}`,
        company: source.name,
        url: posting.applyUrl || posting.hostedUrl,
        domain: 'jobs.lever.co',
        snippet: snippet
          ? `${source.name} is hiring for ${posting.text} in ${locName}. ${snippet}`
          : `${source.name} official career posting for ${posting.text} (${locName}).`,
        source: `Lever (${source.name})`,
        discoveredAt: posting.createdAt ? new Date(posting.createdAt).toISOString() : new Date().toISOString(),
      }
    })
  }
}
