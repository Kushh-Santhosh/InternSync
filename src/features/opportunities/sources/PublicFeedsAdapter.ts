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

      const cleanTitleForIntern = titleLower.replace(/\b(?:internal|international)\b/gi, '')
      const isEarlyCareer =
        cleanTitleForIntern.includes('intern') ||
        titleLower.includes('trainee') ||
        titleLower.includes('apprentice') ||
        titleLower.includes('graduate') ||
        titleLower.includes('junior') ||
        titleLower.includes('associate') ||
        levelLower.includes('entry') ||
        levelLower.includes('junior') ||
        levelLower.includes('intern')

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
        titleLower.includes('nurse') ||
        titleLower.includes('driver') ||
        titleLower.includes('payroll') ||
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

      const matchesKeyword =
        !qLower ||
        titleLower.includes(qLower) ||
        (roleLower && titleLower.includes(roleLower)) ||
        qLower.split(' ').some((term) => term.length > 3 && titleLower.includes(term))

      if (isInternTarget && !isEarlyCareer) {
        if (!isDevJob && !isDesignJob) {
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

        if (!matchesLoc) {
          return false
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
