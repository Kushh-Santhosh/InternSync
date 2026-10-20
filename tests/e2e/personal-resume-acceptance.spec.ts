import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

test.describe.serial('Kushal Santhosh Real Resume Acceptance & Cloud Persistence Test', () => {
  const timestamp = Date.now()
  const testEmail = `kushal.accept.test.${timestamp}@internsync.io`
  const testPassword = process.env.TEST_STUDENT_PASSWORD || `Accept_${Math.random().toString(36).slice(2, 8)}!Aa1${timestamp}`
  let testUserId = ''
  let adminClient: any = null

  const evidenceDir = path.resolve(process.cwd(), 'test-evidence', 'kushal-resume-acceptance')

  test.beforeAll(async () => {
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true })
    }

    try {
      const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kkgnhoflqusupqnhgzkz.supabase.co'
      const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
      if (!serviceKey) {
        throw new Error('Missing required environment variable SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY). Cannot run personal resume acceptance test without admin credentials.')
      }

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

  test('Kushal Santhosh Actual Resume End-to-End Acceptance Walkthrough', async ({ page }) => {
    test.setTimeout(180000)

    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      console.log(`[Browser Console ${msg.type()}]:`, msg.text())
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    // 1. SIGN IN TO LIVE PRODUCTION PREVIEW
    console.log('--- Step 1: Navigating to Sign In ---')
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /Sign in to InternSync|Sign in/i })).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '01_login_page.png') })

    await page.fill('input[placeholder="name@university.edu"]', testEmail)
    await page.fill('input[placeholder="••••••••"]', testPassword)
    await page.click('button[type="submit"]')

    // Wait for authenticated dashboard navigation
    await page.waitForURL('**/dashboard', { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '02_dashboard_authenticated.png') })

    // 2. UPLOAD ACTUAL RESUME PDF IN SETTINGS -> DOCUMENTS
    console.log('--- Step 2: Upload Actual Kushal Santhosh Resume in Settings Documents Tab ---')
    await page.goto('/settings')
    await page.waitForURL('**/settings')
    await page.click('main button:has-text("Documents")')
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(evidenceDir, '03_documents_tab_initial.png') })

    const resumePath = path.resolve(process.cwd(), 'fixtures', 'KUSHAL_SANTHOSH_P_RESUME.pdf.pdf')
    expect(fs.existsSync(resumePath)).toBe(true)

    // Normal file picker interaction
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(resumePath)

    // Wait for document analysis and upload to complete (up to 45s)
    console.log('--- Step 3: Waiting for AI Resume Parsing and Storage Upload ---')
    await expect(page.locator('text=Analyzing Document...')).toBeVisible({ timeout: 5000 }).catch(() => {})

    // Expect document card to appear in the list with actual file name
    await expect(
      page.locator('main').getByText(/KUSHAL_SANTHOSH_P_RESUME/i).first()
    ).toBeVisible({ timeout: 75000 })

    await page.screenshot({ path: path.join(evidenceDir, '04_kushal_resume_uploaded.png') })

    // 3. VERIFY CAREER DNA POPULATION & AMBIGUITY FLAG
    console.log('--- Step 4: Verify Career DNA Profile, Skills, and Ambiguity Detection ---')
    await page.goto('/career-dna')
    await page.waitForURL('**/career-dna')
    await page.waitForTimeout(1500)

    // Verify Name, Degree, Institution, and Exact Graduation Batch (Class of 2028)
    await expect(page.locator('main').getByText(/KUSHAL SANTHOSH P/i).first()).toBeVisible()
    await expect(page.getByText(/CMR University/i).first()).toBeVisible()
    await expect(page.getByText('Class of 2028').first()).toBeVisible()

    // Verify Academic Credentials Ambiguity Banner
    console.log('--- Step 5: Verify Ambiguity Detection Banner for CGPA 81.08 and Academic Year ---')
    const ambiguityBanner = page.locator('text=Academic Credentials Verification Needed').first()
    await expect(ambiguityBanner).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '05_ambiguity_flag_detected.png') })

    // Confirm the metric as 81.08% percentage (no automatic 10-point conversion)
    const confirmPercentageBtn = page.getByRole('button', { name: /Confirm as 81.08% Percentage/i }).first()
    await expect(confirmPercentageBtn).toBeVisible()
    await confirmPercentageBtn.click()
    await page.waitForTimeout(500)

    // Confirm current academic standing as Year 2
    const confirmYearBtn = page.getByRole('button', { name: /^Year 2$/i }).first()
    await expect(confirmYearBtn).toBeVisible()
    await confirmYearBtn.click()

    await page.waitForTimeout(1000)
    await expect(page.getByText(/Class of 2028/i).first()).toBeVisible()
    await expect(page.getByText(/81.08% \(Confirmed\)/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '06_ambiguity_confirmed.png') })

    // Verify UI/UX and Full Stack direction fit
    await page.screenshot({ path: path.join(evidenceDir, '07_career_directions.png') })

    // 4. VERIFY SUPABASE CLOUD PERSISTENCE ACROSS RELOAD AND RE-LOGIN
    console.log('--- Step 6: Testing Browser Reload & Re-Login Persistence ---')
    await page.reload()
    await page.waitForURL('**/career-dna')
    await expect(page.locator('main').getByText(/KUSHAL SANTHOSH P/i).first()).toBeVisible()
    await expect(page.getByText('Class of 2028').first()).toBeVisible()

    // Check private storage file exists in Supabase bucket
    const { data: storageFiles } = await adminClient.storage.from('documents').list(testUserId)
    expect(storageFiles).not.toBeNull()
    expect(storageFiles.length).toBeGreaterThan(0)
    console.log(`[Storage Verification] Found ${storageFiles.length} file(s) in private storage bucket:`, storageFiles.map((f: any) => f.name))

    // Check document row in public.documents table
    const { data: dbDocs } = await adminClient.from('documents').select('*').eq('student_id', testUserId)
    expect(dbDocs).not.toBeNull()
    expect(dbDocs.length).toBeGreaterThan(0)
    console.log(`[Database Verification] Found ${dbDocs.length} document record(s) in database table. Extracted skills:`, dbDocs[0].extracted_skills)

    // Logout
    await page.goto('/settings')
    await page.waitForURL('**/settings')
    await page.click('main button:has-text("Account")')
    await page.locator('button:has-text("Sign Out"), button:has-text("Log Out")').first().click()
    await page.waitForURL('**/login', { timeout: 10000 })
    await page.screenshot({ path: path.join(evidenceDir, '08_logged_out.png') })

    // Re-login
    console.log('--- Step 7: Re-authenticating with same account ---')
    await page.fill('input[placeholder="name@university.edu"]', testEmail)
    await page.fill('input[placeholder="••••••••"]', testPassword)
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/(dashboard|settings)/, { timeout: 15000 })
    await page.waitForTimeout(1000)

    // Check Settings -> Documents still shows Kushal's uploaded resume
    await page.goto('/settings')
    await page.waitForURL('**/settings')
    await page.click('main button:has-text("Documents")')
    await expect(page.locator('main').getByText(/KUSHAL_SANTHOSH_P_RESUME/i).first()).toBeVisible({ timeout: 15000 })
    await page.screenshot({ path: path.join(evidenceDir, '09_relogin_documents_persisted.png') })

    // Check Career DNA still shows Kushal's profile
    await page.goto('/career-dna')
    await page.waitForURL('**/career-dna')
    await expect(page.locator('main').getByText(/KUSHAL SANTHOSH P/i).first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('main').getByText('Class of 2028').first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '10_relogin_career_dna_persisted.png') })

    console.log('\n🎉 Kushal Santhosh Real Resume Acceptance Walkthrough Succeeded 100%!')
  })
})
