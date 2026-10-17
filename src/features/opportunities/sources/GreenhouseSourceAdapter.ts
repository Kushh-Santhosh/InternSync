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

      // Exclude Senior / Manager / Director / Lead roles for student internship searches
      const isSeniorOrManager =
        titleLower.includes('manager') ||
        titleLower.includes('director') ||
        titleLower.includes('vice president') ||
        titleLower.includes('head of') ||
        titleLower.includes('lead ') ||
        titleLower.includes('principal') ||
        titleLower.includes('staff ') ||
        titleLower.includes('sr.') ||
        titleLower.includes('senior')

      if (isInternTarget && isSeniorOrManager && !titleLower.includes('intern')) {
        return false
      }

      // Clean title avoiding false matches on 'internal' or 'international'
      const cleanTitleForIntern = titleLower.replace(/\b(?:internal|international)\b/gi, '')
      const isInternTitle =
        cleanTitleForIntern.includes('intern') ||
        titleLower.includes('trainee') ||
        titleLower.includes('apprentice') ||
        titleLower.includes('co-op') ||
        titleLower.includes('graduate') ||
        titleLower.includes('fellow') ||
        titleLower.includes('campus') ||
        titleLower.includes('early career') ||
        titleLower.includes('junior') ||
        titleLower.includes('associate')

      // Domain filtering: Design vs Engineering
      const isDesignQuery =
        qLower.includes('design') ||
        roleLower.includes('design') ||
        qLower.includes('ui') ||
        roleLower.includes('ui') ||
        qLower.includes('ux') ||
        roleLower.includes('ux')

      const isDesignJob =
        titleLower.includes('design') ||
        titleLower.includes('ui') ||
        titleLower.includes('ux') ||
        titleLower.includes('creative') ||
        titleLower.includes('product designer')

      if (isDesignQuery && !isDesignJob) {
        return false
      }

      const isDevQuery =
        qLower.includes('software') ||
        roleLower.includes('software') ||
        qLower.includes('developer') ||
        roleLower.includes('developer') ||
        qLower.includes('frontend') ||
        roleLower.includes('frontend') ||
        qLower.includes('backend') ||
        roleLower.includes('backend') ||
        qLower.includes('full stack') ||
        roleLower.includes('full stack')

      const isDevJob =
        titleLower.includes('engineer') ||
        titleLower.includes('developer') ||
        titleLower.includes('software') ||
        titleLower.includes('frontend') ||
        titleLower.includes('backend') ||
        titleLower.includes('full stack') ||
        titleLower.includes('fullstack') ||
        titleLower.includes('web') ||
        titleLower.includes('programmer') ||
        titleLower.includes('data') ||
        titleLower.includes('ai') ||
        titleLower.includes('ml') ||
        titleLower.includes('devops') ||
        titleLower.includes('cloud') ||
        titleLower.includes('intern')

      // Exclude non-tech occupations from tech searches
      const isNonTech =
        titleLower.includes('interpreter') ||
        titleLower.includes('translator') ||
        titleLower.includes('payroll') ||
        titleLower.includes('auditor') ||
        titleLower.includes('audit') ||
        titleLower.includes('customer account manager') ||
        titleLower.includes('legal counsel') ||
        titleLower.includes('recruiter') ||
        titleLower.includes('account executive')

      if ((isDevQuery || isDesignQuery) && isNonTech) {
        return false
      }

      if (isDevQuery && !isDevJob && !isDesignJob) {
        return false
      }

      // Highly specific term matching (e.g., quantum, submarine, aerospace)
      const stopWords = new Set(['intern', 'internship', 'student', 'summer', 'winter', '2025', '2026', 'india', 'remote', 'the', 'and', 'for', 'with', 'in', 'at'])
      const specificTerms = qLower.split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w))
      const isHighlySpecificSearch = specificTerms.some((t) => ['quantum', 'submarine', 'aerospace', 'biotech', 'neuro', 'hardware', 'rf', 'robotics'].includes(t))
      if (isHighlySpecificSearch) {
        const matchesSpecific = specificTerms.some((t) => titleLower.includes(t))
        if (!matchesSpecific) return false
      }

      // Check if job matches query keywords
      const cleanTitleForMatch = titleLower.replace(/\b(?:internal|international)\b/gi, '')
      const matchesKeyword =
        !qLower ||
        cleanTitleForMatch.includes(qLower) ||
        (roleLower && cleanTitleForMatch.includes(roleLower)) ||
        qLower.split(' ').some((term) => term.length > 3 && cleanTitleForMatch.includes(term))

      // If user specifically requested internships, require early career signals or matching entry engineering
      if (isInternTarget && !isInternTitle) {
        if (!isDevJob && !isDesignJob) {
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
          jobLoc.includes('anywhere') ||
          jobLoc.includes('global') ||
          jobLoc.includes('virtual')

        const isIndiaTarget =
          locLower.includes('india') ||
          locLower.includes('bengaluru') ||
          locLower.includes('bangalore') ||
          locLower.includes('hyderabad') ||
          locLower.includes('pune') ||
          locLower.includes('mumbai') ||
          locLower.includes('delhi') ||
          locLower.includes('noida') ||
          locLower.includes('gurgaon') ||
          locLower.includes('chennai')

        const jobInIndia =
          jobLoc.includes('india') ||
          jobLoc.includes('bangalore') ||
          jobLoc.includes('bengaluru') ||
          jobLoc.includes('hyderabad') ||
          jobLoc.includes('pune') ||
          jobLoc.includes('mumbai') ||
          jobLoc.includes('delhi') ||
          jobLoc.includes('noida') ||
          jobLoc.includes('gurgaon') ||
          jobLoc.includes('chennai')

        const matchesLoc =
          isRemoteJob ||
          jobLoc.includes(locLower) ||
          (isIndiaTarget && jobInIndia)

        if (!matchesLoc) {
          return false
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
