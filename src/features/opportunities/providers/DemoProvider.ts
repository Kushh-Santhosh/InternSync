import { SEED_OPPORTUNITIES } from '@/data/seed-opportunities'
import type { ProviderHealth, RawSearchResult, SearchQuery } from '@/types'
import type { OpportunityProvider, RawOpportunityDetails } from './OpportunityProvider'

export class DemoProvider implements OpportunityProvider {
  readonly id = 'demo-provider'
  readonly name = 'InternSync Seed Opportunity Provider'

  async search(query: SearchQuery): Promise<RawSearchResult[]> {
    const q = query.text.toLowerCase()
    const matches = SEED_OPPORTUNITIES.filter(
      (opp) =>
        opp.roleTitle.toLowerCase().includes(q) ||
        opp.companyName.toLowerCase().includes(q) ||
        opp.requiredSkills.some((s) => s.toLowerCase().includes(q)) ||
        opp.location.toLowerCase().includes(q)
    )

    return matches.map((m) => ({
      title: `${m.roleTitle} @ ${m.companyName}`,
      url: m.applicationUrl,
      domain: new URL(m.applicationUrl).hostname,
      snippet: m.description.slice(0, 180) + '...',
      source: m.source,
      discoveredAt: m.postedAt,
    }))
  }

  async getDetails(idOrUrl: string): Promise<RawOpportunityDetails | null> {
    const found = SEED_OPPORTUNITIES.find((o) => o.id === idOrUrl || o.applicationUrl === idOrUrl)
    if (!found) return null

    return {
      title: found.roleTitle,
      company: found.companyName,
      location: found.location,
      workMode: found.workMode,
      description: found.description,
      requirementsText: [...found.requiredSkills, ...found.preferredSkills].join(', '),
      applicationUrl: found.applicationUrl,
      source: found.source,
      sourceUrl: found.sourceUrl,
      sourceDomain: found.applicationUrl ? new URL(found.applicationUrl).hostname : 'demo.internsync.io',
      postedAt: found.postedAt,
      deadline: found.deadline,
      stipend: found.stipendAmount ? `₹${found.stipendAmount.toLocaleString()}/mo` : undefined,
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    return {
      provider: this.name,
      status: 'ACTIVE',
      message: 'Demo dataset provider is active with 34 verified opportunities.',
      lastChecked: new Date().toISOString(),
    }
  }
}
