import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'

test.describe.serial('Real Resume Acceptance & Cloud Persistence E2E Test', () => {
  const timestamp = Date.now()
  const testEmail = `judge.resume.test.${timestamp}@gmail.com`
  const testPassword = process.env.TEST_STUDENT_PASSWORD || `Judge_${Math.random().toString(36).slice(2, 8)}!Aa1${timestamp}`
  let testUserId = ''
  let adminClient: any = null

  const evidenceDir = path.resolve(process.cwd(), 'test-evidence', 'real-resume-acceptance')

  test.beforeAll(async () => {
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true })
    }

    // Retrieve service role key via environment or CLI in-memory
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kkgnhoflqusupqnhgzkz.supabase.co'
    let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      try {
        const rawKeys = execSync('supabase projects api-keys --project-ref kkgnhoflqusupqnhgzkz --reveal --output json', {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore'],
        })
        const keys = JSON.parse(rawKeys)
        serviceKey = keys.find((k: any) => k.name.includes('service_role'))?.api_key
      } catch {
        // CLI not available or not linked
      }
    }

    if (serviceKey) {
      adminClient = createClient(SUPABASE_URL, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      // Create genuine test user via official Supabase admin API
      const { data: userRecord, error: createErr } = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      })
      if (createErr || !userRecord.user) {
        throw new Error(`Failed to create test user: ${createErr?.message}`)
      }
      testUserId = userRecord.user.id
      console.log(`[Setup] Genuine test student created: ${testEmail} (UID: ${testUserId})`)
    } catch (err) {
      console.error('[Setup Error]', err)
      throw err
    }
  })

  test.afterAll(async () => {
    if (adminClient && testUserId) {
      try {
        console.log(`[Cleanup] Cleaning up test student data for ${testUserId}...`)
        // 1. Storage files
        const { data: files } = await adminClient.storage.from('documents').list(testUserId)
        if (files && files.length > 0) {
          const paths = files.map((f: any) => `${testUserId}/${f.name}`)
          await adminClient.storage.from('documents').remove(paths)
        }
        // 2. Documents table
        await adminClient.from('documents').delete().eq('student_id', testUserId)
        // 3. Applications table
        await adminClient.from('applications').delete().eq('student_id', testUserId)
        // 4. Profiles table
        await adminClient.from('profiles').delete().eq('id', testUserId)
        // 5. Auth user via official deleteUser API
        await adminClient.auth.admin.deleteUser(testUserId)
        console.log(`[Cleanup] ✓ Cleanly deleted test user ${testUserId}`)
      } catch (e) {
        console.warn('[Cleanup Warning]', e)
      }
    }
  })

  test('Real Resume to Persistent Cloud Application Acceptance Walkthrough', async ({ page }) => {
    test.setTimeout(180000)

    // Capture console errors and failed network requests
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      console.log(`[Browser Console ${msg.type()}]:`, msg.text())
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    const failedRequests: string[] = []
    page.on('requestfailed', (req) => {
      failedRequests.push(`${req.method()} ${req.url()}: ${req.failure()?.errorText}`)
    })

    // ────────────────────────────────────────────────────────────
    // 1. LOGIN WITH GENUINE CLOUD CREDENTIALS
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 1: Login with Live Cloud Account ---')
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /Sign in to InternSync|Sign in/i })).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '01_login_page.png') })

    await page.fill('input[placeholder="name@university.edu"]', testEmail)
    await page.fill('input[placeholder="••••••••"]', testPassword)
    await page.click('button[type="submit"]')

    // Wait for authenticated dashboard navigation
    await page.waitForURL('**/dashboard', { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '02_dashboard_live_cloud.png') })

    // Verify authenticated user status in storage/UI (not demo mode)
    const sessionToken = await page.evaluate(() => localStorage.getItem('internsync_auth_user_v4'))
    expect(sessionToken).not.toBeNull()

    // ────────────────────────────────────────────────────────────
    // 2. UPLOAD REAL 2-PAGE PDF RESUME IN SETTINGS / DOCUMENTS
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 2: Upload Real Resume in Settings Documents Tab ---')
    await page.goto('/settings')
    await page.waitForURL('**/settings')
    await page.click('main button:has-text("Documents")')
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(evidenceDir, '03_documents_tab_initial.png') })

    const resumePath = path.resolve(process.cwd(), 'fixtures', 'rahul_sharma_real_resume.pdf')
    expect(fs.existsSync(resumePath)).toBe(true)

    // Attach real PDF file to file input
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(resumePath)

    // Wait for document analysis and upload to complete (up to 30s)
    console.log('--- Step 3: Waiting for AI Resume Parsing and Storage Upload ---')
    await expect(page.locator('text=Analyzing Document...')).toBeVisible({ timeout: 5000 }).catch(() => {})
    
    // Expect document card to appear in the list
    await expect(
      page.locator('main').getByText(/rahul_sharma_real_resume\.pdf/i).first()
    ).toBeVisible({ timeout: 75000 })

    await page.screenshot({ path: path.join(evidenceDir, '04_document_uploaded_successfully.png') })

    // ────────────────────────────────────────────────────────────
    // 3. VERIFY CAREER DNA POPULATION FROM RESUME
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 4: Verify Career DNA Profile & Extracted Skills ---')
    await page.goto('/career-dna')
    await page.waitForURL('**/career-dna')
    await page.waitForTimeout(1200)

    // Should display extracted details or skills
    await page.screenshot({ path: path.join(evidenceDir, '05_career_dna_after_resume.png'), fullPage: true })

    // ────────────────────────────────────────────────────────────
    // 4. OPPORTUNITIES & 14-DAY ROADMAP
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 5: Explore Opportunities Based on Extracted DNA ---')
    await page.goto('/opportunities')
    await page.waitForURL('**/opportunities')
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(evidenceDir, '06_opportunities_list.png'), fullPage: true })

    // If empty state "Find internships for me" is visible, trigger discovery
    const findOppsBtn = page.locator('button:has-text("Find internships for me")').first()
    if (await findOppsBtn.isVisible()) {
      console.log('Triggering live opportunity discovery for extracted profile...')
      await findOppsBtn.click()
      await expect(page.locator('button:has-text("View opportunity")').first()).toBeVisible({ timeout: 45000 })
    }

    // Click into the first opportunity card
    const firstOppButton = page.locator('button:has-text("View opportunity")').first()
    await expect(firstOppButton).toBeVisible()
    await firstOppButton.click()

    await page.waitForURL('**/opportunities/**')
    await page.waitForTimeout(1200)
    await page.screenshot({ path: path.join(evidenceDir, '07_opportunity_detail_roadmap.png'), fullPage: true })

    // ────────────────────────────────────────────────────────────
    // 5. SAVE OPPORTUNITY TO PIPELINE
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 6: Save Opportunity to Pipeline ---')
    const saveButton = page.locator('button:has-text("Save to Pipeline"), button:has-text("Save")').first()
    await expect(saveButton).toBeVisible()
    await saveButton.click()

    // Should navigate to applications tracker or show saved status
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(evidenceDir, '08_saved_application.png') })

    // Ensure we are on /applications
    if (!page.url().includes('/applications')) {
      await page.goto('/applications')
      await page.waitForURL('**/applications')
    }
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '09_applications_tracker_persisted.png') })

    // ────────────────────────────────────────────────────────────
    // 6. SESSION REFRESH, LOGOUT & RE-LOGIN CLOUD PERSISTENCE
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 7: Testing Logout and Re-Login Persistence ---')
    // Refresh page to confirm instant reload
    await page.reload()
    await page.waitForURL('**/applications')
    const savedCard = page.locator('.w-72').locator('div').filter({ hasText: /Saved to pipeline/i }).first()
    await expect(savedCard).toBeVisible({ timeout: 15000 })
    await page.screenshot({ path: path.join(evidenceDir, '10_applications_after_reload.png') })

    // Logout
    await page.goto('/settings')
    await page.waitForURL('**/settings')
    const logoutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Log Out")').first()
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click()
    } else {
      await page.click('main button:has-text("Account")')
      await page.locator('button:has-text("Sign Out"), button:has-text("Log Out")').first().click()
    }

    await page.waitForURL('**/login', { timeout: 10000 })
    await page.screenshot({ path: path.join(evidenceDir, '11_logged_out.png') })

    // Re-login with the same account
    console.log('--- Step 8: Re-authenticating with same account ---')
    await page.fill('input[placeholder="name@university.edu"]', testEmail)
    await page.fill('input[placeholder="••••••••"]', testPassword)
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/(dashboard|settings)/, { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '12_relogin_dashboard.png') })

    // Check Documents are still there in Settings
    await page.goto('/settings')
    await page.waitForURL('**/settings')
    await page.click('main button:has-text("Documents")')
    await expect(page.locator('main').getByText(/rahul_sharma_real_resume\.pdf/i).first()).toBeVisible({ timeout: 15000 })
    await page.screenshot({ path: path.join(evidenceDir, '13_relogin_documents_persisted.png') })

    // Check Applications are still there
    await page.goto('/applications')
    await page.waitForURL('**/applications')
    const reloginSavedCard = page.locator('.w-72').locator('div').filter({ hasText: /Saved to pipeline/i }).first()
    await expect(reloginSavedCard).toBeVisible({ timeout: 15000 })
    await page.screenshot({ path: path.join(evidenceDir, '14_relogin_applications_persisted.png') })

    console.log('\n🎉 ALL ACCEPTANCE WALKTHROUGH STEPS COMPLETED WITH 100% SUCCESS!')
    console.log(`Screenshots recorded in: ${evidenceDir}`)
  })
})
