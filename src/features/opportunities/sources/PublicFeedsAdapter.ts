import type { RawSearchResult } from '../../../types/index.ts'

interface JobicyJob {
  id: number
  url: string
  jobTitle: string
  companyName: string
  jobExcerpt?: string
  jobDescription?: string
  jobType?: string
  jobLevel?: string
  pubDate?: string
  annualSalaryMin?: string
  annualSalaryMax?: string
  salaryCurrency?: string
  jobGeo?: string
}

interface CacheItem {
  timestamp: number
  jobs: JobicyJob[]
}

let feedCache: CacheItem | null = null
const FEED_CACHE_TTL = 45 * 60 * 1000

export class PublicFeedsAdapter {
  /**
   * Fetches permitted public job listings from Jobicy API.
   * Cached for 45 minutes to adhere to fair usage policies.
   */
  async fetchFeedJobs(): Promise<JobicyJob[]> {
    if (feedCache && Date.now() - feedCache.timestamp < FEED_CACHE_TTL) {
      return feedCache.jobs
    }

    try {
      const response = await fetch('https://jobicy.com/api/v2/remote-jobs?count=50', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'InternSync-ReadinessPlatform/1.0 (Opportunity Discovery Engine)',
        },
        signal: AbortSignal.timeout(6000),
      })

      if (!response.ok) {
        return feedCache ? feedCache.jobs : []
      }

      const data = (await response.json()) as { jobs?: JobicyJob[] }
      const jobs = Array.isArray(data?.jobs) ? data.jobs : []

      feedCache = {
        timestamp: Date.now(),
        jobs,
      }

      return jobs
    } catch {
      return feedCache ? feedCache.jobs : []
    }
  }

  /**
   * Searches the public feed for matching tech internships and junior positions.
   */
  async searchFeed(
    queryText: string,
    targetRole?: string,
    locationFilter?: string
  ): Promise<RawSearchResult[]> {
    const jobs = await this.fetchFeedJobs()
    if (jobs.length === 0) return []

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

    const matchedJobs = jobs.filter((job) => {
      const titleLower = (job.jobTitle || '').toLowerCase()
      const levelLower = (job.jobLevel || '').toLowerCase()
      const geoLower = (job.jobGeo || '').toLowerCase()

      const isEarlyCareer =
        titleLower.includes('intern') ||
        titleLower.includes('trainee') ||
        titleLower.includes('apprentice') ||
        titleLower.includes('graduate') ||
        titleLower.includes('junior') ||
        titleLower.includes('associate') ||
        levelLower.includes('entry') ||
        levelLower.includes('junior') ||
        levelLower.includes('intern')

      const matchesKeyword =
        !qLower ||
        titleLower.includes(qLower) ||
        (roleLower && titleLower.includes(roleLower)) ||
        qLower.split(' ').some((term) => term.length > 3 && titleLower.includes(term))

      if (isInternTarget && !isEarlyCareer) {
        if (!titleLower.includes('engineer') && !titleLower.includes('developer') && !titleLower.includes('analyst')) {
          return false
        }
      }

      if (!matchesKeyword && !isEarlyCareer) {
        return false
      }

      if (locLower && locLower !== 'any' && locLower !== 'all') {
        const isWorldwide =
          geoLower.includes('anywhere') ||
          geoLower.includes('worldwide') ||
          geoLower.includes('remote') ||
          geoLower.includes('global') ||
          geoLower.includes('apac')
        const matchesLoc = isWorldwide || geoLower.includes(locLower)

        if (!matchesLoc && (locLower === 'india' || locLower === 'bengaluru' || locLower === 'bangalore')) {
          // Keep if worldwide remote
          if (!isWorldwide) return false
        }
      }

      return true
    })

    return matchedJobs.map((job) => {
      const cleanSnippet = (job.jobExcerpt || job.jobDescription || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 350)

      return {
        title: `${job.jobTitle} @ ${job.companyName}`,
        company: job.companyName,
        url: job.url,
        domain: 'jobicy.com',
        snippet: cleanSnippet
          ? `${job.companyName} is hiring: ${cleanSnippet}`
          : `${job.companyName} remote opportunity: ${job.jobTitle} (${job.jobGeo || 'Remote'}).`,
        source: `Jobicy (${job.companyName})`,
        discoveredAt: job.pubDate || new Date().toISOString(),
      }
    })
  }
}
