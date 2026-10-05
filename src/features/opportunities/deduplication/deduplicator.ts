import type { Opportunity } from '@/types'

function normalizeStr(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Deduplicates opportunities discovered across multiple providers and sources.
 * Retains the most direct application URL and tracks provenance.
 */
export function deduplicateOpportunities(opportunities: Opportunity[]): Opportunity[] {
  const mergedMap = new Map<string, Opportunity>()

  for (const opp of opportunities) {
    // Generate composite key: company + role + location
    const normCompany = normalizeStr(opp.companyName)
    const normRole = normalizeStr(opp.roleTitle)
    const normLoc = normalizeStr(opp.location)
    const dedupeKey = `${normCompany}_${normRole}_${normLoc.slice(0, 5)}`

    const existing = mergedMap.get(dedupeKey)
    if (!existing) {
      mergedMap.set(dedupeKey, {
        ...opp,
        duplicateSources: [opp.source],
      })
    } else {
      // Merge sources
      const allSources = Array.from(new Set([...(existing.duplicateSources || [existing.source]), opp.source]))

      // Determine best application URL: prefer official careers / ATS over aggregator
      const isOppAts =
        opp.applicationUrl.includes('greenhouse.io') ||
        opp.applicationUrl.includes('lever.co') ||
        opp.applicationUrl.includes('careers.')
      const isExistingAts =
        existing.applicationUrl.includes('greenhouse.io') ||
        existing.applicationUrl.includes('lever.co') ||
        existing.applicationUrl.includes('careers.')

      const bestAppUrl = isOppAts && !isExistingAts ? opp.applicationUrl : existing.applicationUrl
      const bestSource = isOppAts && !isExistingAts ? opp.source : existing.source

      // Combine skills
      const combinedSkills = Array.from(new Set([...existing.requiredSkills, ...opp.requiredSkills]))
      const combinedPrefSkills = Array.from(new Set([...existing.preferredSkills, ...opp.preferredSkills]))

      mergedMap.set(dedupeKey, {
        ...existing,
        applicationUrl: bestAppUrl,
        source: bestSource,
        duplicateSources: allSources,
        requiredSkills: combinedSkills,
        preferredSkills: combinedPrefSkills,
        description: existing.description.length >= opp.description.length ? existing.description : opp.description,
      })
    }
  }

  return Array.from(mergedMap.values())
}
