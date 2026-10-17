import type { ProviderHealth, RawSearchResult, SearchQuery } from '@/types'
import type { OpportunityProvider } from './OpportunityProvider'

export interface OpenRouterConfig {
  apiKey?: string
  model?: string
  engine?: string
  maxResults?: number
  maxTotalResults?: number
}

export class OpenRouterWebProvider implements OpportunityProvider {
  readonly id = 'openrouter-web'
  readonly name = 'OpenRouter Live Web Search Provider'
  private config: OpenRouterConfig

  constructor(config: OpenRouterConfig = {}) {
    this.config = {
      model: config.model || 'meta-llama/llama-3.3-70b-instruct',
      engine: config.engine || 'auto',
      maxResults: config.maxResults || 10,
      maxTotalResults: config.maxTotalResults || 30,
      apiKey: config.apiKey,
    }
  }

  isConfigured(): boolean {
    return true
  }

  /**
   * Performs live web search through the backend proxy endpoint to keep secrets safe
   */
  async search(query: SearchQuery): Promise<RawSearchResult[]> {
    let serverRes: Response
    try {
      serverRes = await fetch('/api/search/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
    } catch (err: unknown) {
      throw new Error(`Failed to reach live search backend: ${err instanceof Error ? err.message : String(err)}`)
    }

    let data: any = null
    try {
      data = await serverRes.json()
    } catch {
      data = {}
    }

    if (!serverRes.ok) {
      if (data?.code === 'SEARCH_NOT_CONFIGURED' || serverRes.status === 503) {
        throw new Error('SEARCH_NOT_CONFIGURED: Live web search is not configured on the server. Please add OPENROUTER_API_KEY in the Vercel project Environment Variables.')
      }
      if (data?.code === 'PROVIDER_CREDITS_EXHAUSTED' || serverRes.status === 402) {
        throw new Error('PROVIDER_CREDITS_EXHAUSTED: OpenRouter account has insufficient credits. Please add credits at https://openrouter.ai/settings/credits.')
      }
      if (data?.code === 'PROVIDER_AUTH_FAILED' || serverRes.status === 401) {
        throw new Error('PROVIDER_AUTH_FAILED: Invalid OpenRouter API key.')
      }
      throw new Error(data?.error || `Live search service returned status ${serverRes.status}`)
    }

    if (Array.isArray(data?.results)) {
      return data.results
    }

    return []
  }

  async healthCheck(): Promise<ProviderHealth> {
    try {
      const res = await fetch('/api/settings/health')
      if (res.ok) {
        const data = await res.json()
        if (data.openrouter) {
          return data.openrouter
        }
      }
    } catch {
      // Server endpoint not reachable
    }

    return {
      provider: this.name,
      status: 'NOT_CONFIGURED',
      message: 'Backend search service is unreachable or unconfigured.',
      model: this.config.model,
      lastChecked: new Date().toISOString(),
    }
  }
}

