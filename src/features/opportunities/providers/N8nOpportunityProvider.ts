import type { ProviderHealth, RawSearchResult, SearchQuery } from '@/types'
import type { OpportunityDiscoveryProvider } from './OpportunityProvider'

export interface N8nProviderConfig {
  webhookUrl?: string
  authToken?: string
  timeoutMs?: number
}

/**
 * Expected JSON Contract for n8n Webhook:
 *
 * Incoming Request from InternSync to n8n:
 * POST /api/n8n/opportunity-discovery (or external webhookUrl)
 * Headers: { "Content-Type": "application/json", "Authorization": "Bearer <token>" }
 * Body: {
 *   query: {
 *     text: string
 *     role?: string
 *     location?: string
 *     skills?: string[]
 *   },
 *   candidateContext?: {
 *     degree?: string
 *     currentYear?: number
 *     targetRoles?: string[]
 *   }
 * }
 *
 * Expected Response from n8n to InternSync:
 * {
 *   success: boolean,
 *   count: number,
 *   opportunities: Array<{
 *     title: string,
 *     company: string,
 *     location: string,
 *     workMode: 'remote' | 'hybrid' | 'onsite',
 *     applicationUrl: string,
 *     sourceDomain: string,
 *     snippet: string,
 *     requiredSkills?: string[],
 *     stipend?: string,
 *     deadline?: string
 *   }>
 * }
 */
export class N8nOpportunityProvider implements OpportunityDiscoveryProvider {
  readonly id = 'n8n-opportunity-provider'
  readonly name = 'n8n Automated Opportunity Scraper'
  private config: N8nProviderConfig

  constructor(config: N8nProviderConfig = {}) {
    this.config = {
      webhookUrl: config.webhookUrl,
      authToken: config.authToken,
      timeoutMs: config.timeoutMs || 8000,
    }
  }

  isConfigured(): boolean {
    return Boolean(this.config.webhookUrl)
  }

  async search(query: SearchQuery): Promise<RawSearchResult[]> {
    if (!this.isConfigured()) {
      // Graceful standby without failing or blocking other providers
      return []
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs)

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (this.config.authToken) {
        headers['Authorization'] = `Bearer ${this.config.authToken}`
      }

      const res = await fetch(this.config.webhookUrl!, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: {
            text: query.text,
            role: query.role,
            location: query.location,
            skills: query.skills,
          },
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!res.ok) {
        console.warn(`[N8nProvider] Webhook returned status ${res.status}`)
        return []
      }

      const data = await res.json()
      const rawList = data.opportunities || data.data || []
      const results: RawSearchResult[] = []

      for (const item of rawList) {
        if (!item.applicationUrl && !item.url) continue

        const url = item.applicationUrl || item.url
        let domain = item.sourceDomain || 'n8n-crawler'
        try {
          domain = new URL(url).hostname
        } catch {
          // preserve domain
        }

        results.push({
          title: item.title || 'Internship Opportunity',
          url,
          domain,
          snippet: item.snippet || item.description || '',
          source: 'n8n',
          discoveredAt: new Date().toISOString(),
        })
      }

      return results
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('[N8nProvider] Webhook request timed out')
      } else {
        console.warn('[N8nProvider] Discovery error:', err.message)
      }
      return []
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    if (!this.isConfigured()) {
      return {
        provider: this.name,
        status: 'NOT_CONFIGURED',
        message: 'Optional n8n webhook not configured (running in standby)',
        lastChecked: new Date().toISOString(),
      }
    }

    return {
      provider: this.name,
      status: 'ACTIVE',
      message: 'n8n webhook active and responding',
      lastChecked: new Date().toISOString(),
    }
  }
}
