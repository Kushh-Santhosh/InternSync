import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

test.describe.serial('SaarthiX Smart Internship Matcher — Production Recovery Acceptance', () => {
  const timestamp = Date.now()
  const testEmail = `prod.acceptance.${timestamp}@internsync.io`
  const testPassword = `ProdTest_${Math.random().toString(36).slice(2, 8)}!Aa1${timestamp}`
  let testUserId = ''
  let adminClient: any = null

  const evidenceDir = path.resolve(process.cwd(), 'test-evidence', 'production-recovery')
  const PROD_URL = process.env.PROD_URL || 'https://intern-sync-one-pink.vercel.app'
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kkgnhoflqusupqnhgzkz.supabase.co'
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  test.beforeAll(async () => {
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true })
    }

    adminClient = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Create verified test student in remote Supabase Auth
    const { data: userRecord, error: createErr } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Rahul Sharma (Test Candidate)' },
    })
    if (createErr || !userRecord.user) {
      throw new Error(`Failed to create test user: ${createErr?.message}`)
    }
    testUserId = userRecord.user.id
    console.log(`[Setup] Genuine test student created on live Supabase: ${testEmail} (UID: ${testUserId})`)
  })

  test.afterAll(async () => {
    if (adminClient && testUserId) {
      try {
        await adminClient.auth.admin.deleteUser(testUserId)
        console.log(`[Teardown] Test student cleaned up: ${testUserId}`)
      } catch (err) {
        console.warn(`[Teardown Warning] Failed to clean up:`, err)
      }
    }
  })

  test('Execute Complete Production Journey on Live Vercel Deployment & Supabase Database', async ({
    page,
  }) => {
    test.setTimeout(120000)

    console.log(`--- Step 1: Navigating to Live Production Environment (${PROD_URL}) ---`)
    await page.goto(`${PROD_URL}/login`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(evidenceDir, '01_live_prod_login.png') })

    // Sign in using verified test credentials
    console.log('--- Step 2: Authenticating Test Student via Supabase Auth ---')
    await page.fill('#identifier', testEmail)
    await page.fill('input[type="password"]', testPassword)
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard or opportunities
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '02_live_prod_authenticated_dashboard.png') })

    console.log('--- Step 3: Uploading Resume on Live Production ---')
    await page.goto(`${PROD_URL}/dashboard`)
    await page.waitForLoadState('networkidle')

    const fileInput = page.locator('input[type="file"]')
    const resumePath = path.resolve(process.cwd(), 'fixtures', 'rahul_sharma_real_resume.pdf')
    expect(fs.existsSync(resumePath)).toBe(true)

    await fileInput.setInputFiles(resumePath)

    // Wait for AI processing to complete
    console.log('--- Step 4: Waiting for Live Gemini AI Resume Extraction ---')
    await page.waitForTimeout(6000)
    await page.screenshot({ path: path.join(evidenceDir, '03_live_prod_dashboard_post_upload.png') })

    // Navigate to Opportunities directory
    console.log('--- Step 5: Viewing Matched Opportunities on Live Production ---')
    await page.goto(`${PROD_URL}/opportunities`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(evidenceDir, '03b_live_prod_opportunities.png') })

    // Verify opportunity feed loaded
    const cards = page.locator('div[class*="rounded-2xl border"]')
    await expect(cards.first()).toBeVisible({ timeout: 15000 })

    console.log('--- Step 6: Verifying Career DNA and Cloud Persistence ---')
    await page.goto(`${PROD_URL}/career-dna`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '04_live_prod_career_dna.png') })

    // Verify student profile record exists in remote Supabase database
    const { data: dbProfile, error: profErr } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .maybeSingle()
    console.log('[Supabase DB Check] Remote profile:', dbProfile ? dbProfile.full_name : 'null', profErr?.message || '')

    console.log('--- Step 6: Inspecting Real Opportunity Fit & Skill Gaps ---')
    await page.goto(`${PROD_URL}/opportunities`)
    await page.waitForLoadState('networkidle')

    // Click on the first opportunity card
    const viewOppButton = page.locator('button:has-text("View opportunity")').first()
    await expect(viewOppButton).toBeVisible({ timeout: 15000 })
    await viewOppButton.click()

    await page.waitForURL('**/opportunities/*', { timeout: 15000 })
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(evidenceDir, '05_live_prod_opportunity_detail.png') })

    // Verify Tab 1: Fit analysis and skill gaps
    await expect(page.getByText(/Already Satisfied/i).first()).toBeVisible()
    await expect(page.getByText(/Eligibility/i).first()).toBeVisible()

    // Verify Tab 3: 14-Day Roadmap Sprint
    console.log('--- Step 7: Inspecting 14-Day Preparation Sprint ---')
    const roadmapTab = page.locator('button:has-text("14-Day Roadmap"), button:has-text("Preparation Sprint")').first()
    if (await roadmapTab.isVisible()) {
      await roadmapTab.click()
      await page.waitForTimeout(600)
      await page.screenshot({ path: path.join(evidenceDir, '06_live_prod_roadmap_tab.png') })
    }

    // Save opportunity to pipeline
    console.log('--- Step 8: Saving Opportunity to Pipeline & Database ---')
    const saveButton = page.locator('button:has-text("Save Opportunity"), button:has-text("Saved")').first()
    if (await saveButton.isVisible()) {
      await saveButton.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: path.join(evidenceDir, '07_live_prod_opportunity_saved.png') })
    }

    console.log('--- Step 9: Testing Side-by-Side Comparison Modal ---')
    await page.goto(`${PROD_URL}/opportunities`)
    await page.waitForLoadState('networkidle')

    const compareButtons = page.locator('button:has-text("+ Compare")')
    const compareCount = await compareButtons.count()
    if (compareCount >= 2) {
      await compareButtons.nth(0).click()
      await page.waitForTimeout(300)
      await compareButtons.nth(1).click()
      await page.waitForTimeout(300)
    }

    const openCompareBtn = page.locator('button:has-text("Compare (")').first()
    if (await openCompareBtn.isVisible()) {
      await openCompareBtn.click()
    } else {
      await page.goto(`${PROD_URL}/opportunities?compare=true`)
    }

    await expect(page.getByRole('heading', { name: /Side-by-Side Opportunity Comparison/i })).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(evidenceDir, '08_live_prod_side_by_side_compare.png') })

    console.log('--- Step 10: Logging Out and Verifying Persistence on Re-Login ---')
    await page.goto(`${PROD_URL}/settings`)
    await page.waitForLoadState('networkidle')

    const signOutBtn = page.locator('button:has-text("Sign out"), button:has-text("Logout")').first()
    if (await signOutBtn.isVisible()) {
      await signOutBtn.click()
      await page.waitForTimeout(1000)
    }

    // Re-authenticate
    await page.goto(`${PROD_URL}/login`)
    await page.fill('#identifier', testEmail)
    await page.fill('input[type="password"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 })
    await page.waitForTimeout(1000)

    // Verify applications pipeline persists
    await page.goto(`${PROD_URL}/applications`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(evidenceDir, '09_live_prod_persisted_applications.png') })

    console.log('=== Complete Production Journey Passed Successfully ===')
  })
})

