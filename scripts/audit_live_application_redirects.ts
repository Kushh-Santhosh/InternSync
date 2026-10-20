import { chromium } from '@playwright/test'
import * as fs from 'fs'
import { SEED_OPPORTUNITIES } from '../src/data/seed-opportunities.ts'

export interface DetailedOpportunityAuditRecord {
  index: number
  opportunityId: string
  displayedCompany: string
  displayedRoleTitle: string
  originalSource: string
  postingId: string
  applicationUrlInRecord: string
  detailUrlOpened: string
  actionClicked: string
  finalBrowserDestination: string
  renderedDestinationTitle: string
  renderedRoleHeading: string
  formElementsCount: number
  employerMatched: boolean
  roleMatched: boolean
  vacancyStatus: 'OPEN_AND_VERIFIED' | 'CLOSED_OR_UNAVAILABLE' | 'GENERIC_OR_MISMATCHED'
  passFail: 'PASS' | 'FAIL'
  evidence: string
}

function extractPostingId(url: string): string {
  const ghMatch = url.match(/jobs\/(\d+)|gh_jid=(\d+)/i)
  if (ghMatch) return ghMatch[1] || ghMatch[2]
  const leverMatch = url.match(/lever\.co\/[^/]+\/([a-f0-9-]{16,})/i)
  if (leverMatch) return leverMatch[1]
  const ashbyMatch = url.match(/ashbyhq\.com\/[^/]+\/([a-f0-9-]{16,})/i)
  if (ashbyMatch) return ashbyMatch[1]
  return 'N/A'
}

async function runApplicationAudit(baseUrl: string) {
  console.log(`\n============================================================`)
  console.log(`INTERNSYNC LIVE PRODUCTION APPLICATION-LINK & DATA AUDIT`)
  console.log(`Target: ${baseUrl}`)
  console.log(`Catalog: ${SEED_OPPORTUNITIES.length} verified opportunities`)
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log(`============================================================\n`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  // Enter demo mode
  console.log('[Step 1] Navigating to login and entering Demo Mode...')
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('text=Explore Interactive Demo Mode', { timeout: 15000 })
  await page.click('text=Explore Interactive Demo Mode')
  await page.waitForURL('**/dashboard', { timeout: 20000 })
  console.log('[PASS] Entered Demo Mode (Rahul Sharma). Current URL:', page.url())

  // Go to /opportunities
  console.log('[Step 2] Navigating to Opportunities directory...')
  await page.goto(`${baseUrl}/opportunities`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('button:has-text("View opportunity")', { timeout: 15000 })

  const results: DetailedOpportunityAuditRecord[] = []

  for (let i = 0; i < SEED_OPPORTUNITIES.length; i++) {
    const opp = SEED_OPPORTUNITIES[i]
    const postingId = extractPostingId(opp.applicationUrl)
    console.log(`\n------------------------------------------------------------`)
    console.log(`[${i + 1}/${SEED_OPPORTUNITIES.length}] Auditing: ${opp.companyName} — "${opp.roleTitle}"`)
    console.log(`Posting ID: ${postingId} | Source: ${opp.source}`)
    console.log(`Target ATS URL: ${opp.applicationUrl}`)

    // Navigate to opportunity details page directly via URL
    const detailUrl = `${baseUrl}/opportunities/${opp.id}`
    await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForSelector('h1', { timeout: 15000 })

    // Verify detail page heading
    const pageHeading = await page.locator('h1').first().innerText()
    console.log(`Detail Page H1: "${pageHeading}"`)

    // Check Open Application Portal button
    const portalBtn = page.locator('button:has-text("Open Application Portal")')
    const hasPortalBtn = (await portalBtn.count()) > 0

    if (!hasPortalBtn) {
      console.error(`[FAIL] "Open Application Portal" button missing on ${detailUrl}`)
      results.push({
        index: i + 1,
        opportunityId: opp.id,
        displayedCompany: opp.companyName,
        displayedRoleTitle: opp.roleTitle,
        originalSource: opp.source,
        postingId,
        applicationUrlInRecord: opp.applicationUrl,
        detailUrlOpened: detailUrl,
        actionClicked: 'NONE',
        finalBrowserDestination: 'NOT_FOUND',
        renderedDestinationTitle: '',
        renderedRoleHeading: '',
        formElementsCount: 0,
        employerMatched: false,
        roleMatched: false,
        vacancyStatus: 'CLOSED_OR_UNAVAILABLE',
        passFail: 'FAIL',
        evidence: 'Missing Open Application Portal button on details page',
      })
      continue
    }

    // Click "Open Application Portal" and intercept popup
    let destinationUrl = ''
    let destTitle = ''
    let destH1 = ''
    let formElementsCount = 0

    try {
      const [popup] = await Promise.all([
        context.waitForEvent('page', { timeout: 15000 }).catch(() => null),
        portalBtn.click(),
      ])

      if (popup) {
        await popup.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => null)
        await popup.waitForTimeout(2500) // Allow SPA hydration (Ashby, Greenhouse, Lever)
        destinationUrl = popup.url()
        destTitle = await popup.title().catch(() => '')
        const h1List = await popup.locator('h1, h2, h3, [role="heading"]').allInnerTexts().catch(() => [])
        destH1 = h1List.slice(0, 3).join(' | ').replace(/\n/g, ' ')

        // Check for application form inputs or explicit Apply buttons
        formElementsCount = await popup.locator('input, textarea, button[type="submit"], a.postings-btn, button:has-text("Apply"), a:has-text("Apply"), button:has-text("Submit")').count().catch(() => 0)
        const hasForm = formElementsCount > 0

        console.log(`[PASS] Clicked Open Application Portal!`)
        console.log(`  Destination URL: ${destinationUrl}`)
        console.log(`  Page Title: "${destTitle}"`)
        console.log(`  Heading: "${destH1}"`)
        console.log(`  Has Form Inputs / Submit: ${hasForm ? 'YES (' + formElementsCount + ' elements)' : 'NO'}`)

        // Verify employer & role match
        const cleanCompany = opp.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
        const cleanDest = (destinationUrl + ' ' + destTitle + ' ' + destH1).toLowerCase().replace(/[^a-z0-9]/g, '')
        const employerMatched = cleanDest.includes(cleanCompany)

        // Check if role or internship keyword is present
        const roleTokens = opp.roleTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !['intern', 'internship', 'student'].includes(w))
        const hasRoleToken = roleTokens.length === 0 || roleTokens.some(t => cleanDest.includes(t))
        const roleMatched = hasRoleToken

        const isGenericCareersPage = /(careers|jobs)\/?$/i.test(destinationUrl.replace(/\/$/, ''))
        const isVerifiedVacancy = employerMatched && roleMatched && hasForm && !isGenericCareersPage

        await popup.close().catch(() => null)

        const evidence = isVerifiedVacancy
          ? `Verified direct vacancy on ${opp.source} with ${formElementsCount} interactive application elements matching ${opp.companyName} - "${opp.roleTitle}"`
          : `Destination failed verification: employerMatch=${employerMatched}, roleMatch=${roleMatched}, formPresent=${hasForm}, isGeneric=${isGenericCareersPage}`

        results.push({
          index: i + 1,
          opportunityId: opp.id,
          displayedCompany: opp.companyName,
          displayedRoleTitle: opp.roleTitle,
          originalSource: opp.source,
          postingId,
          applicationUrlInRecord: opp.applicationUrl,
          detailUrlOpened: detailUrl,
          actionClicked: 'Open Application Portal',
          finalBrowserDestination: destinationUrl,
          renderedDestinationTitle: destTitle,
          renderedRoleHeading: destH1,
          formElementsCount,
          employerMatched,
          roleMatched,
          vacancyStatus: isVerifiedVacancy ? 'OPEN_AND_VERIFIED' : (isGenericCareersPage ? 'GENERIC_OR_MISMATCHED' : 'CLOSED_OR_UNAVAILABLE'),
          passFail: isVerifiedVacancy ? 'PASS' : 'FAIL',
          evidence,
        })
      } else {
        throw new Error('Popup window did not open within timeout')
      }
    } catch (clickErr: any) {
      console.error(`[FAIL] Could not verify destination: ${clickErr.message}`)
      results.push({
        index: i + 1,
        opportunityId: opp.id,
        displayedCompany: opp.companyName,
        displayedRoleTitle: opp.roleTitle,
        originalSource: opp.source,
        postingId,
        applicationUrlInRecord: opp.applicationUrl,
        detailUrlOpened: detailUrl,
        actionClicked: 'Open Application Portal',
        finalBrowserDestination: 'ERROR',
        renderedDestinationTitle: '',
        renderedRoleHeading: '',
        formElementsCount: 0,
        employerMatched: false,
        roleMatched: false,
        vacancyStatus: 'CLOSED_OR_UNAVAILABLE',
        passFail: 'FAIL',
        evidence: clickErr.message,
      })
    }

    // Verify navigation back to opportunities directory works
    await page.goto(`${baseUrl}/opportunities`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForSelector('button:has-text("View opportunity")', { timeout: 15000 })
    const listCards = await page.locator('button:has-text("View opportunity")').count()
    if (listCards > 0) {
      console.log(`[PASS] Returned to directory. Navigation functional (${listCards} cards visible).`)
    } else {
      console.error(`[FAIL] Navigation broke returning to directory!`)
    }
  }

  await browser.close()

  fs.writeFileSync('test-evidence/audit_application_actions_verified.json', JSON.stringify(results, null, 2))
  console.log(`\nAudit completed for ${results.length} records. Results written to test-evidence/audit_application_actions_verified.json`)

  const passedCount = results.filter(r => r.passFail === 'PASS').length
  console.log(`\n============================================================`)
  console.log(`FINAL ACTION AUDIT RESULT: ${passedCount}/${results.length} VERIFIED`)
  console.log(`============================================================\n`)

  if (passedCount < results.length) {
    console.error(`FAILED: ${results.length - passedCount} records failed verification.`)
  }
}

const targetUrl = process.argv[2] || 'https://intern-sync-one.vercel.app'
runApplicationAudit(targetUrl).catch((err) => {
  console.error('Fatal audit error:', err)
  process.exit(1)
})
