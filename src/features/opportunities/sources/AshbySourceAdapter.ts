import type { RawSearchResult } from '../../../types/index.ts'
import type { EmployerSource } from './registry.ts'

interface AshbyJob {
  id: string
  title: string
  department?: string
  team?: string
  employmentType?: string
  location?: string
  secondaryLocations?: string[]
  publishedAt?: string
  isListed?: boolean
  isRemote?: boolean
  workplaceType?: string
  jobUrl: string
  applyUrl?: string
  descriptionPlain?: string
}

interface AshbyBoardResponse {
  jobs: AshbyJob[]
}

interface CacheItem {
  timestamp: number
  jobs: AshbyJob[]
}

const ashbyCache = new Map<string, CacheItem>()
const BOARD_CACHE_TTL = 45 * 60 * 1000

export class AshbySourceAdapter {
  async fetchBoardJobs(source: EmployerSource): Promise<AshbyJob[]> {
    const cached = ashbyCache.get(source.boardToken)
    if (cached && Date.now() - cached.timestamp < BOARD_CACHE_TTL) {
      return cached.jobs
    }

    const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(source.boardToken)}`

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'InternSync-ReadinessPlatform/1.0 (Opportunity Discovery Engine)',
        },
        signal: AbortSignal.timeout(6000),
      })

      if (!response.ok) {
        return []
      }

      const data = (await response.json()) as AshbyBoardResponse
      const jobs = Array.isArray(data?.jobs) ? data.jobs : []

      ashbyCache.set(source.boardToken, {
        timestamp: Date.now(),
        jobs,
      })

      return jobs
    } catch {
      return []
    }
  }

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

    const isInternTarget =
      qLower.includes('intern') ||
      roleLower.includes('intern') ||
      qLower.includes('student') ||
      qLower.includes('trainee') ||
      qLower.includes('graduate') ||
      qLower.includes('early')

    const matched = jobs.filter((job) => {
      const titleLower = (job.title || '').toLowerCase()
      const jobLoc = (job.location || '').toLowerCase()

      // Exclude Senior / Staff / Manager / SDE 2
      const isSenior =
        /\b(?:senior|sr\.?|lead|staff|principal|director|head of|vice president|vp|manager|architect|sde[- ]*[2-5]|sde[- ]*(?:ii|iii|iv|v)|engineer[- ]*[2-5]|engineer[- ]*(?:ii|iii|iv|v))\b/i.test(
          titleLower
        )

      if (isInternTarget && isSenior && !titleLower.includes('intern')) {
        return false
      }

      // Clean title avoiding false positive match on 'internal' or 'international'
      const cleanTitleForIntern = titleLower.replace(/\b(?:internal|international)\b/gi, '')
      const isInternTitle =
        cleanTitleForIntern.includes('intern') ||
        titleLower.includes('trainee') ||
        titleLower.includes('apprentice') ||
        titleLower.includes('co-op') ||
        titleLower.includes('graduate') ||
        titleLower.includes('fellow') ||
        titleLower.includes('campus') ||
        titleLower.includes('university') ||
        titleLower.includes('early career')

      // Role domain checks: Design vs Tech
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
        roleLower.includes('full stack') ||
        qLower.includes('data') ||
        roleLower.includes('data') ||
        qLower.includes('machine learning') ||
        roleLower.includes('machine learning') ||
        qLower.includes('ai') ||
        roleLower.includes('ai')

      const isDevJob =
        titleLower.includes('engineer') ||
        titleLower.includes('developer') ||
        titleLower.includes('data') ||
        titleLower.includes('analyst') ||
        titleLower.includes('science') ||
        titleLower.includes('ai') ||
        titleLower.includes('ml') ||
        titleLower.includes('devops') ||
        titleLower.includes('cloud') ||
        titleLower.includes('intern')

      if (isDevQuery && !isDevJob && !isDesignJob) {
        return false
      }

      // Keyword matching
      const matchesKeyword =
        !qLower ||
        cleanTitleForIntern.includes(qLower) ||
        (roleLower && cleanTitleForIntern.includes(roleLower)) ||
        qLower.split(' ').some((term) => term.length > 3 && cleanTitleForIntern.includes(term))

      if (isInternTarget && !isInternTitle && !isDevJob && !isDesignJob) {
        return false
      }

      if (!matchesKeyword && !isInternTitle) {
        return false
      }

      // Location matching
      if (locLower && locLower !== 'any' && locLower !== 'all') {
        const isRemoteJob =
          Boolean(job.isRemote) ||
          jobLoc.includes('remote') ||
          jobLoc.includes('home based') ||
          jobLoc.includes('worldwide') ||
          jobLoc.includes('anywhere') ||
          jobLoc.includes('global')

        const isIndiaTarget =
          locLower.includes('india') ||
          locLower.includes('bengaluru') ||
          locLower.includes('bangalore')

        const jobInIndia =
          jobLoc.includes('india') ||
          jobLoc.includes('bangalore') ||
          jobLoc.includes('bengaluru')

        if (isIndiaTarget && !jobInIndia && !isRemoteJob) {
          return false
        }
      }

      return true
    })

    return matched.map((job) => {
      const applyUrl = job.applyUrl || job.jobUrl
      return {
        title: job.title,
        company: source.name,
        url: applyUrl,
        domain: 'jobs.ashbyhq.com',
        snippet: job.descriptionPlain
          ? job.descriptionPlain.slice(0, 300).trim()
          : `${job.title} at ${source.name}. Department: ${job.department || 'Engineering'}. Location: ${job.location || 'Remote'}.`,
        source: `Ashby (${source.name})`,
        discoveredAt: job.publishedAt || new Date().toISOString(),
      }
    })
  }
}
