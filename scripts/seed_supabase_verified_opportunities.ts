import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import { SEED_OPPORTUNITIES } from '../src/data/seed-opportunities.ts'
import { generateOpportunityId } from '../src/lib/utils/uuid.ts'

const SUPABASE_URL = 'https://kkgnhoflqusupqnhgzkz.supabase.co'
const rawKeys = execSync('supabase projects api-keys --project-ref kkgnhoflqusupqnhgzkz --reveal --output json', { encoding: 'utf-8' })
const parsed = JSON.parse(rawKeys)
const serviceKey = parsed.find((k: any) => k.name === 'service_role')?.api_key
const supabase = createClient(SUPABASE_URL, serviceKey)

async function syncVerifiedOpportunities() {
  console.log('[Sync] Removing legacy example.com opportunities from Supabase...')
  const { data: badOpps, error: findErr } = await supabase
    .from('opportunities')
    .select('id, company_name, application_url')
    .ilike('application_url', '%example.com%')

  if (findErr) {
    console.error('Error finding bad opps:', findErr)
    return
  }

  if (badOpps && badOpps.length > 0) {
    const badIds = badOpps.map(b => b.id)
    const { error: delErr } = await supabase.from('opportunities').delete().in('id', badIds)
    if (delErr) {
      console.error('Error deleting bad opps:', delErr)
    } else {
      console.log(`[Sync] Successfully deleted ${badOpps.length} obsolete example.com opportunities.`)
    }
  } else {
    console.log('[Sync] No example.com opportunities found.')
  }

  console.log(`[Sync] Upserting ${SEED_OPPORTUNITIES.length} verified opportunities...`)
  let count = 0
  for (const opp of SEED_OPPORTUNITIES) {
    const oppId = generateOpportunityId(opp.sourceUrl || opp.applicationUrl, opp.companyName, opp.roleTitle)
    const { error: upsertErr } = await supabase.from('opportunities').upsert({
      id: oppId,
      company_name: opp.companyName,
      company_logo: opp.companyLogo || null,
      role_title: opp.roleTitle,
      category: opp.category || 'Engineering',
      description: opp.description || 'Verified internship opportunity',
      location: opp.location || 'Remote',
      work_mode: opp.workMode || 'remote',
      internship_duration_months: opp.internshipDurationMonths || 3,
      stipend_amount: opp.stipendAmount || null,
      stipend_currency: opp.stipendCurrency || 'INR',
      stipend_period: opp.stipendPeriod || 'month',
      application_url: opp.applicationUrl,
      source: opp.source || 'InternSync Verified',
      deadline: opp.deadline || new Date(Date.now() + 30 * 86400000).toISOString(),
      eligible_years: opp.eligibleYears || [3, 4],
      eligible_degrees: opp.eligibleDegrees || ['B.Tech', 'BE', 'MCA'],
      required_skills: opp.requiredSkills || [],
      preferred_skills: opp.preferredSkills || [],
      is_demo: Boolean(opp.isDemo),
    })

    if (upsertErr) {
      console.error(`Failed to upsert ${opp.companyName} - ${opp.roleTitle}:`, upsertErr.message)
    } else {
      count++
    }
  }

  console.log(`[Sync] Successfully upserted ${count}/${SEED_OPPORTUNITIES.length} verified opportunities into Supabase.`)

  const { data: finalOpps } = await supabase.from('opportunities').select('id, company_name, role_title, application_url')
  console.log(`[Sync] Final count of opportunities in Supabase: ${finalOpps?.length}`)
  const remainingBad = finalOpps?.filter(o => o.application_url?.includes('example.com'))
  console.log(`[Sync] Remaining example.com opps in Supabase: ${remainingBad?.length}`)
}

syncVerifiedOpportunities().catch(console.error)
