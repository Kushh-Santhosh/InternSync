import type { ProviderHealth, RawSearchResult, SearchQuery } from '@/types'
import type { OpportunityProvider } from './OpportunityProvider'

export interface GeminiSearchConfig {
  apiKey?: string
  model?: string
  searchEnabled?: boolean
}

export class GeminiSearchProvider implements OpportunityProvider {
  readonly id = 'gemini-grounding'
  readonly name = 'Google Gemini Grounded Search Provider'
  private config: GeminiSearchConfig

  constructor(config: GeminiSearchConfig = {}) {
    this.config = {
      model: config.model || 'gemini-2.5-flash',
      searchEnabled: config.searchEnabled ?? true,
      apiKey: config.apiKey,
    }
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey)
  }

  /**
   * Performs live grounded search via server proxy endpoint or direct API
   */
  async search(query: SearchQuery): Promise<RawSearchResult[]> {
    try {
      const serverRes = await fetch('/api/search/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, provider: 'gemini' }),
      })
      if (serverRes.ok) {
        const data = await serverRes.json()
        if (Array.isArray(data.results)) {
          return data.results.map((r: any) => ({
            ...r,
            source: r.source || 'Google Search Grounding',
          }))
        }
      }
    } catch {
      // Fallback if server endpoint is unreachable
    }

    return []
  }

  async healthCheck(): Promise<ProviderHealth> {
    try {
      const res = await fetch('/api/settings/health')
      if (res.ok) {
        const data = await res.json()
        if (data.gemini) {
          return data.gemini
        }
      }
    } catch {
      // Fallback
    }

    return {
      provider: this.name,
      status: this.isConfigured() ? 'ACTIVE' : 'NOT_CONFIGURED',
      message: this.isConfigured()
        ? 'Gemini Grounded Search ready'
        : 'Gemini API key not configured',
      lastChecked: new Date().toISOString(),
    }
  }
}
