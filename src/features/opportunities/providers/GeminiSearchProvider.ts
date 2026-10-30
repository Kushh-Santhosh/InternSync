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
    return Boolean(this.config.apiKey || typeof window !== 'undefined')
  }

  /**
   * Performs live grounded search via server proxy endpoint or direct API
   */
  async search(query: SearchQuery): Promise<RawSearchResult[]> {
    let serverRes: Response
    try {
      serverRes = await fetch('/api/search/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, provider: 'gemini' }),
      })
    } catch (err: unknown) {
      throw new Error(`Failed to reach Gemini search backend: ${err instanceof Error ? err.message : String(err)}`)
    }

    let data: any = null
    try {
      data = await serverRes.json()
    } catch {
      data = {}
    }

    if (!serverRes.ok) {
      if (data?.code === 'SEARCH_NOT_CONFIGURED' || serverRes.status === 503) {
        throw new Error('SEARCH_NOT_CONFIGURED: Gemini search grounding is not configured on the server.')
      }
      if (data?.code === 'GEMINI_QUOTA_EXHAUSTED' || serverRes.status === 429) {
        throw new Error('GEMINI_QUOTA_EXHAUSTED: Gemini search grounding quota exhausted.')
      }
      throw new Error(data?.error || `Gemini search service returned status ${serverRes.status}`)
    }

    if (Array.isArray(data?.results)) {
      return data.results.map((r: any) => ({
        ...r,
        source: r.source || 'Google Gemini Grounding',
      }))
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
