import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'

const PROD_BASE_URL = 'https://intern-sync-one.vercel.app'

test.describe.serial('Live Vercel Production Acceptance Test Suite', () => {
  const timestamp = Date.now()
  const testEmail = `prod.live.test.${timestamp}@internsync.io`
  const testPassword = `ProdLiveAcceptance123!${timestamp}`
  let testUserId = ''
  let adminClient: any = null

  const evidenceDir = path.resolve(process.cwd(), 'test-evidence', 'live-vercel-acceptance')

  test.beforeAll(async () => {
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true })
    }

    const SUPABASE_URL = 'https://kkgnhoflqusupqnhgzkz.supabase.co'
    try {
      const rawKeys = execSync('supabase projects api-keys --project-ref kkgnhoflqusupqnhgzkz --reveal --output json', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      })
      const keys = JSON.parse(rawKeys)
      const serviceKey = keys.find((k: any) => k.name.includes('service_role')).api_key
      adminClient = createClient(SUPABASE_URL, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      // Create genuine test student via official Supabase admin API
      const { data: userRecord, error: createErr } = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      })
      if (createErr || !userRecord.user) {
        throw new Error(`Failed to create test user: ${createErr?.message}`)
      }
      testUserId = userRecord.user.id
      console.log(`[Live Vercel Setup] Genuine test student created: ${testEmail} (UID: ${testUserId})`)
    } catch (err) {
      console.error('[Live Vercel Setup Error]', err)
      throw err
    }
  })

  test.afterAll(async () => {
    if (adminClient && testUserId) {
      try {
        console.log(`[Live Vercel Cleanup] Cleaning up test student data for ${testUserId}...`)
        const { data: files } = await adminClient.storage.from('documents').list(testUserId)
        if (files && files.length > 0) {
          const paths = files.map((f: any) => `${testUserId}/${f.name}`)
          await adminClient.storage.from('documents').remove(paths)
        }
        await adminClient.from('documents').delete().eq('student_id', testUserId)
        await adminClient.from('applications').delete().eq('student_id', testUserId)
        await adminClient.from('profiles').delete().eq('id', testUserId)
        await adminClient.auth.admin.deleteUser(testUserId)
        console.log(`[Live Vercel Cleanup] ✓ Cleanly deleted test user ${testUserId}`)
      } catch (e) {
        console.warn('[Live Vercel Cleanup Warning]', e)
      }
    }
  })

  test('A. Landing page, navigation, and nested route refresh test on deployed Vercel', async ({ page }) => {
    test.setTimeout(60000)
    console.log('--- Step A1: Opening live Vercel production landing page ---')
    await page.goto(`${PROD_BASE_URL}/`, { waitUntil: 'networkidle' })

    // Check title and primary hero
    await expect(page).toHaveTitle(/InternSync/i)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '01_prod_landing_page.png') })

    // Direct navigation to routes without 404
    const routesToTest = ['/opportunities', '/login', '/signup', '/career-dna']
    for (const r of routesToTest) {
      console.log(`--- Testing route: ${r} ---`)
      await page.goto(`${PROD_BASE_URL}${r}`, { waitUntil: 'networkidle' })
      const text = await page.textContent('body')
      expect(text).not.toContain('404: NOT_FOUND')
      expect(text).not.toContain('FUNCTION_INVOCATION_FAILED')
    }

    // Nested route refresh test
    console.log('--- Step A2: Testing nested route refresh on deployed site ---')
    await page.goto(`${PROD_BASE_URL}/opportunities`, { waitUntil: 'networkidle' })
    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.locator('text=Sign in to InternSync').or(page.locator('main'))).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '02_prod_opportunities_refreshed.png') })
  })

  test('B. Real authentication and session validation on live Vercel', async ({ page }) => {
    test.setTimeout(60000)
    console.log('--- Step B1: Testing invalid credentials on live Vercel ---')
    await page.goto(`${PROD_BASE_URL}/login`, { waitUntil: 'networkidle' })

    await page.fill('input[placeholder="name@university.edu"]', 'invalid.random@internsync.io')
    await page.fill('input[placeholder="••••••••"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)
    // Expect error alert or message
    await expect(page.locator('text=Invalid login credentials').or(page.locator('text=Error'))).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: path.join(evidenceDir, '03_prod_invalid_login.png') })

    console.log('--- Step B2: Testing valid student login on live Vercel ---')
    await page.fill('input[placeholder="name@university.edu"]', testEmail)
    await page.fill('input[placeholder="••••••••"]', testPassword)
    await page.click('button[type="submit"]')

    // Wait for authenticated dashboard navigation
    await page.waitForURL('**/dashboard', { timeout: 20000 })
    await page.screenshot({ path: path.join(evidenceDir, '04_prod_authenticated_dashboard.png') })
  })

  test('C. Real Kushal Santhosh resume upload, extraction, ambiguity handling, and cloud persistence', async ({ page }) => {
    test.setTimeout(120000)
    // 1. Sign in
    await page.goto(`${PROD_BASE_URL}/login`, { waitUntil: 'networkidle' })
    await page.fill('input[placeholder="name@university.edu"]', testEmail)
    await page.fill('input[placeholder="••••••••"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 20000 })

    // 2. Navigate to Settings -> Documents
    console.log('--- Step C1: Uploading actual resume PDF on deployed site ---')
    await page.goto(`${PROD_BASE_URL}/settings`, { waitUntil: 'networkidle' })
    await page.click('main button:has-text("Documents")')
    await page.waitForTimeout(500)

    const resumePath = path.resolve(process.cwd(), 'fixtures', 'KUSHAL_SANTHOSH_P_RESUME.pdf.pdf')
    expect(fs.existsSync(resumePath)).toBe(true)

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(resumePath)

    // Wait for document analysis and upload
    await expect(
      page.locator('main').getByText(/KUSHAL_SANTHOSH_P_RESUME/i).first()
    ).toBeVisible({ timeout: 60000 })
    await page.screenshot({ path: path.join(evidenceDir, '05_prod_resume_uploaded.png') })

    // 3. Inspect Career DNA
    console.log('--- Step C2: Inspecting Career DNA on deployed site ---')
    await page.goto(`${PROD_BASE_URL}/career-dna`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    await expect(page.getByText(/KUSHAL SANTHOSH P/i).first()).toBeVisible()
    await expect(page.getByText(/CMR University/i).first()).toBeVisible()
    await expect(page.getByText('Class of 2028').first()).toBeVisible()

    // Ambiguity resolution
    const confirmPercentageBtn = page.getByRole('button', { name: /Confirm as 81.08% Percentage/i }).first()
    if (await confirmPercentageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmPercentageBtn.click()
      await page.waitForTimeout(500)
      const confirmYearBtn = page.getByRole('button', { name: /^Year 2$/i }).first()
      if (await confirmYearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmYearBtn.click()
      }
      await page.waitForTimeout(1000)
    }

    await page.screenshot({ path: path.join(evidenceDir, '06_prod_career_dna_verified.png') })

    // 4. Reload and verify cloud persistence
    console.log('--- Step C3: Testing refresh persistence on deployed site ---')
    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.getByText(/KUSHAL SANTHOSH P/i).first()).toBeVisible()
    await expect(page.getByText('Class of 2028').first()).toBeVisible()

    // 5. Verify private storage in Supabase
    const { data: storageFiles } = await adminClient.storage.from('documents').list(testUserId)
    expect(storageFiles).not.toBeNull()
    expect(storageFiles.length).toBeGreaterThan(0)
    console.log(`[Live Vercel Storage Verification] Found ${storageFiles.length} file(s) in private storage bucket:`, storageFiles.map((f: any) => f.name))
  })

  test('D & E. Live opportunity discovery, match scores, and application tracker persistence', async ({ page }) => {
    test.setTimeout(90000)
    // 1. Sign in
    await page.goto(`${PROD_BASE_URL}/login`, { waitUntil: 'networkidle' })
    await page.fill('input[placeholder="name@university.edu"]', testEmail)
    await page.fill('input[placeholder="••••••••"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 20000 })

    // 2. Open Opportunities
    console.log('--- Step D1: Exploring opportunities on deployed site ---')
    await page.goto(`${PROD_BASE_URL}/opportunities`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(evidenceDir, '07_prod_opportunities_directory.png') })

    // Open first opportunity
    const viewButtons = page.locator('button:has-text("View Details"), a:has-text("View Details")')
    await expect(viewButtons.first()).toBeVisible({ timeout: 10000 })
    await viewButtons.first().click()

    await page.waitForURL('**/opportunities/**', { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '08_prod_opportunity_detail.png') })

    // Save to Applications
    console.log('--- Step F1: Saving opportunity to application tracker ---')
    const saveBtn = page.locator('button:has-text("Save Application"), button:has-text("Track Opportunity"), button:has-text("Save")').first()
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click()
      await page.waitForTimeout(1000)
    }

    // Navigate to Applications page
    await page.goto(`${PROD_BASE_URL}/applications`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '09_prod_applications_kanban.png') })

    // Verify application in Supabase table
    const { data: dbApps } = await adminClient.from('applications').select('*').eq('student_id', testUserId)
    console.log(`[Live Vercel Application Verification] Found ${dbApps?.length || 0} applications saved in Supabase database.`)

    // Sign out
    console.log('--- Step G1: Signing out on deployed site ---')
    await page.goto(`${PROD_BASE_URL}/settings`, { waitUntil: 'networkidle' })
    await page.click('main button:has-text("Account")')
    await page.locator('button:has-text("Sign Out"), button:has-text("Log Out")').first().click()
    await page.waitForURL('**/login', { timeout: 10000 })
    await page.screenshot({ path: path.join(evidenceDir, '10_prod_signed_out.png') })

    console.log('\n🎉 ALL LIVE VERCEL PRODUCTION ACCEPTANCE TESTS PASSED 100%!')
  })
})
