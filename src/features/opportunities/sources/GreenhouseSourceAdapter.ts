import type { RawSearchResult } from '../../../types/index.ts'
import type { EmployerSource } from './registry.ts'

interface GreenhouseJob {
  id: number | string
  title: string
  absolute_url: string
  updated_at?: string
  location?: { name?: string }
  content?: string
  departments?: Array<{ id: number; name: string }>
  offices?: Array<{ id: number; name: string; location?: string }>
}

interface GreenhouseBoardResponse {
  jobs: GreenhouseJob[]
}

interface CacheItem {
  timestamp: number
  jobs: GreenhouseJob[]
}

// In-memory cache for Greenhouse board responses (45 minutes TTL)
const boardCache = new Map<string, CacheItem>()
const BOARD_CACHE_TTL = 45 * 60 * 1000

export class GreenhouseSourceAdapter {
  /**
   * Fetches all current published jobs for a verified Greenhouse board token.
   * Utilizes server-side caching to prevent repeated network round-trips.
   */
  async fetchBoardJobs(source: EmployerSource): Promise<GreenhouseJob[]> {
    const cached = boardCache.get(source.boardToken)
    if (cached && Date.now() - cached.timestamp < BOARD_CACHE_TTL) {
      return cached.jobs
    }

    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(source.boardToken)}/jobs?content=true`

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

      const data = (await response.json()) as GreenhouseBoardResponse
      const jobs = Array.isArray(data?.jobs) ? data.jobs : []

      boardCache.set(source.boardToken, {
        timestamp: Date.now(),
        jobs,
      })

      return jobs
    } catch {
      return []
    }
  }

  /**
   * Searches a specific employer board for positions matching query parameters.
   */
  async searchEmployer(
    source: EmployerSource,
    queryText: string,
    targetRole?: string,
    locationFilter?: string
  ): Promise<RawSearchResult[]> {
    const jobs = await this.fetchBoardJobs(source)
    if (jobs.length === 0) return []

    const qLower = (queryText || '').toLowerCase().trim()
    const roleLower = (targetRole || '').toLowerCase().trim()
    const locLower = (locationFilter || '').toLowerCase().trim()

    // Key keywords for student / early career / internship discovery
    const isInternTarget =
      qLower.includes('intern') ||
      roleLower.includes('intern') ||
      qLower.includes('student') ||
      qLower.includes('trainee') ||
      qLower.includes('graduate') ||
      qLower.includes('early')

    const matchedJobs = jobs.filter((job) => {
      const titleLower = (job.title || '').toLowerCase()
      const jobLoc = (job.location?.name || '').toLowerCase()

      // 1. Role / Title matching
      const isInternTitle =
        titleLower.includes('intern') ||
        titleLower.includes('trainee') ||
        titleLower.includes('apprentice') ||
        titleLower.includes('co-op') ||
        titleLower.includes('graduate') ||
        titleLower.includes('fellow') ||
        titleLower.includes('campus') ||
        titleLower.includes('early career') ||
        titleLower.includes('junior') ||
        titleLower.includes('associate')

      // Check if job matches query keywords
      const matchesKeyword =
        !qLower ||
        titleLower.includes(qLower) ||
        (roleLower && titleLower.includes(roleLower)) ||
        qLower.split(' ').some((term) => term.length > 3 && titleLower.includes(term))

      // If user specifically requested internships, prioritize or require early career signals
      if (isInternTarget && !isInternTitle) {
        // Also permit entry-level software/data roles if keyword matches strongly
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
          jobLoc.includes('remote') ||
          jobLoc.includes('home based') ||
          jobLoc.includes('worldwide') ||
          jobLoc.includes('anywhere')
        const matchesLoc =
          isRemoteJob ||
          jobLoc.includes(locLower) ||
          (locLower === 'india' && (jobLoc.includes('bangalore') || jobLoc.includes('bengaluru') || jobLoc.includes('noida') || jobLoc.includes('gurgaon') || jobLoc.includes('hyderabad') || jobLoc.includes('pune') || jobLoc.includes('mumbai') || jobLoc.includes('chennai')))

        if (!matchesLoc) {
          // If searching India or specific city, don't return strictly other in-office cities
          if (locLower === 'india' || locLower === 'bengaluru' || locLower === 'bangalore') {
            return false
          }
        }
      }

      return true
    })

    return matchedJobs.map((job) => {
      // Clean HTML tags and decode HTML entities from content for clean snippet
      const cleanSnippet = (job.content || '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 350)

      const locName = job.location?.name || 'Remote / Multiple Locations'

      return {
        title: `${job.title} @ ${source.name}`,
        company: source.name,
        url: job.absolute_url,
        domain: 'boards.greenhouse.io',
        snippet: cleanSnippet
          ? `${source.name} is hiring for ${job.title} in ${locName}. ${cleanSnippet}`
          : `${source.name} official career listing for ${job.title} (${locName}).`,
        source: `Greenhouse (${source.name})`,
        discoveredAt: job.updated_at || new Date().toISOString(),
      }
    })
  }
}
