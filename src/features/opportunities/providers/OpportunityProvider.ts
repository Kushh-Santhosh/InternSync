import type { ProviderHealth, RawSearchResult, SearchQuery } from '@/types'

export interface RawOpportunityDetails {
  title: string
  company: string
  location: string
  workMode: 'remote' | 'hybrid' | 'onsite'
  description: string
  requirementsText: string
  applicationUrl: string
  source: string
  sourceUrl?: string
  sourceDomain: string
  postedAt?: string
  deadline?: string
  stipend?: string
}

export interface OpportunityProvider {
  readonly id: string
  readonly name: string
  search(query: SearchQuery): Promise<RawSearchResult[]>
  getDetails?(urlOrId: string): Promise<RawOpportunityDetails | null>
  healthCheck(): Promise<ProviderHealth>
}

export type OpportunityDiscoveryProvider = OpportunityProvider
