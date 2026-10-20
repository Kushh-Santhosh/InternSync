import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import { SEED_OPPORTUNITIES } from '../src/data/seed-opportunities.ts'
import { generateOpportunityId } from '../src/lib/utils/uuid.ts'

const SUPABASE_URL = 'https://kkgnhoflqusupqnhgzkz.supabase.co'

function getServiceKey(): string {
  // 1. Read from approved server-side environment variable
  const envKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (envKey) return envKey

  // 2. Query via Supabase CLI if logged in locally
  try {
    const rawKeys = execSync('supabase projects api-keys --project-ref kkgnhoflqusupqnhgzkz --reveal --output json', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    })
    const parsed = JSON.parse(rawKeys)
    const key = parsed.find((k: any) => k.name.includes('service_role') || k.name.includes('secret'))?.api_key
    if (key) return key
  } catch {}

  throw new Error(
    'Supabase secret key not configured. Set the SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable.'
  )
}

const serviceKey = getServiceKey()
const supabase = createClient(SUPABASE_URL, serviceKey)

async function syncVerifiedOpportunities() {
  console.log('[Sync] Starting verified opportunities sync to Supabase...')
  console.log(`[Sync] Verified dataset count: ${SEED_OPPORTUNITIES.length}`)

  const verifiedIds = new Set(
    SEED_OPPORTUNITIES.map(opp =>
      generateOpportunityId(opp.sourceUrl || opp.applicationUrl, opp.companyName, opp.roleTitle)
    )
  )

  // 1. Fetch all existing opportunities
  const { data: existingOpps, error: fetchErr } = await supabase
    .from('opportunities')
    .select('id, company_name, role_title, application_url')

  if (fetchErr) {
    console.error('Error fetching existing opportunities:', fetchErr)
    return
  }

  // 2. Identify unverified / obsolete / non-internship records to purge
  const toDelete = (existingOpps || []).filter(o => !verifiedIds.has(o.id))
  if (toDelete.length > 0) {
    console.log(`[Sync] Removing ${toDelete.length} obsolete/unverified records from Supabase...`)
    const deleteIds = toDelete.map(o => o.id)
    const { error: delErr } = await supabase.from('opportunities').delete().in('id', deleteIds)
    if (delErr) {
      console.error('Error deleting unverified opportunities:', delErr)
    } else {
      console.log(`[Sync] Successfully purged ${toDelete.length} unverified records.`)
    }
  } else {
    console.log('[Sync] No obsolete records found to purge.')
  }

  // 3. Upsert verified opportunities
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

  // 4. Verify final remote state
  const { data: finalOpps } = await supabase.from('opportunities').select('id, company_name, role_title, application_url')
  console.log(`[Sync] Final count of opportunities in Supabase: ${finalOpps?.length}`)
  const badUrls = finalOpps?.filter(o => o.application_url?.includes('example.com') || o.application_url?.includes('jobicy.com'))
  console.log(`[Sync] Remaining bad/unverified opps in Supabase: ${badUrls?.length || 0}`)
}

syncVerifiedOpportunities().catch(console.error)
