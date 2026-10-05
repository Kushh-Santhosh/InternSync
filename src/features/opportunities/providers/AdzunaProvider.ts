import type { ProviderHealth, RawSearchResult, SearchQuery } from '@/types'
import type { OpportunityProvider, RawOpportunityDetails } from './OpportunityProvider'

export interface AdzunaConfig {
  appId?: string
  appKey?: string
  country?: string // 'in', 'us', 'gb', etc.
}

export class AdzunaProvider implements OpportunityProvider {
  readonly id = 'adzuna-provider'
  readonly name = 'Adzuna Jobs API Provider'
  private config: AdzunaConfig

  constructor(config: AdzunaConfig = {}) {
    this.config = {
      country: config.country || 'in',
      appId: config.appId,
      appKey: config.appKey,
    }
  }

  isConfigured(): boolean {
    return Boolean(this.config.appId && this.config.appKey)
  }

  async search(query: SearchQuery): Promise<RawSearchResult[]> {
    if (!this.isConfigured()) {
      return []
    }

    try {
      const country = this.config.country || 'in'
      const what = encodeURIComponent(`${query.text} internship`)
      const where = query.location ? encodeURIComponent(query.location) : ''
      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${this.config.appId}&app_key=${this.config.appKey}&what=${what}&where=${where}&content-type=application/json`

      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Adzuna API returned status ${res.status}`)
      }

      const data = await res.json()
      const results: RawSearchResult[] = []

      for (const item of data.results || []) {
        let domain = 'adzuna.com'
        try {
          if (item.redirect_url) {
            domain = new URL(item.redirect_url).hostname
          }
        } catch {
          // ignore invalid url
        }

        results.push({
          title: item.title?.replace(/<[^>]+>/g, '') || 'Internship Opportunity',
          url: item.redirect_url,
          domain,
          snippet: item.description?.replace(/<[^>]+>/g, '').slice(0, 200) || '',
          source: 'Adzuna',
          discoveredAt: item.created || new Date().toISOString(),
        })
      }

      return results
    } catch {
      return []
    }
  }

  async getDetails(_urlOrId: string): Promise<RawOpportunityDetails | null> {
    return null
  }

  async healthCheck(): Promise<ProviderHealth> {
    if (!this.isConfigured()) {
      return {
        provider: this.name,
        status: 'NOT_CONFIGURED',
        message: 'Adzuna structured feed is connecting.',
        lastChecked: new Date().toISOString(),
      }
    }

    try {
      const country = this.config.country || 'in'
      const url = `https://api.adzuna.com/v1/api/jobs/${country}/categories?app_id=${this.config.appId}&app_key=${this.config.appKey}`
      const res = await fetch(url)
      if (res.ok) {
        return {
          provider: this.name,
          status: 'ACTIVE',
          message: `Connected successfully to Adzuna API (${country.toUpperCase()}).`,
          lastChecked: new Date().toISOString(),
        }
      } else {
        return {
          provider: this.name,
          status: 'ERROR',
          message: `Adzuna API returned status ${res.status}. Check API credentials.`,
          lastChecked: new Date().toISOString(),
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed'
      return {
        provider: this.name,
        status: 'ERROR',
        message,
        lastChecked: new Date().toISOString(),
      }
    }
  }
}
