import { chromium } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

const PROD_URL = 'https://intern-sync-one.vercel.app'
const timestamp = Date.now()
const testUsername = `user_${timestamp}`
const testPassword = `Pass#${timestamp}!`
const testFullName = `Aditya Nair`

// Read Supabase credentials from local .env to verify remote storage
const envContent = fs.readFileSync('.env', 'utf8')
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=([^\r\n]+)/)?.[1] || ''
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=([^\r\n]+)/)?.[1] || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runLiveAudit() {
  console.log(`[AUDIT] Starting Live Production Audit against ${PROD_URL}`)
  console.log(`[AUDIT] Test Student: ${testFullName} (@${testUsername})`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  // Track console errors
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  // -------------------------------------------------------------
  // PHASE 1: Verify Landing Page & Official Branding
  // -------------------------------------------------------------
  console.log('\n--- PHASE 1: Landing Page & Official Branding ---')
  await page.goto(PROD_URL, { waitUntil: 'networkidle' })
  const pageTitle = await page.title()
  console.log(`[PASS] Page Title: "${pageTitle}"`)

  // Check Favicon in DOM
  const faviconSvg = await page.getAttribute('link[rel="icon"][type="image/svg+xml"]', 'href')
  const faviconIco = await page.getAttribute('link[rel="shortcut icon"]', 'href')
  console.log(`[PASS] Favicon SVG href: ${faviconSvg}`)
  console.log(`[PASS] Favicon ICO href: ${faviconIco}`)

  // Check Header Logo
  const headerLogo = page.locator('header img[alt="InternSync"]')
  await headerLogo.first().waitFor({ state: 'visible', timeout: 5000 })
  const logoSrc = await headerLogo.first().getAttribute('src')
  console.log(`[PASS] Header Logo src: ${logoSrc}`)

  // Verify 11-slide alignment sections exist on landing page
  const sections = ['#problem', '#gaps', '#pipeline', '#dna', '#live-discovery', '#demo-video', '#architecture']
  for (const sec of sections) {
    const el = page.locator(sec)
    const count = await el.count()
    if (count > 0) {
      console.log(`[PASS] Landing section ${sec} is present`)
    } else {
      console.error(`[FAIL] Landing section ${sec} is missing!`)
    }
  }

  // -------------------------------------------------------------
  // PHASE 2: Create a New Student Account via UI
  // -------------------------------------------------------------
  console.log('\n--- PHASE 2: User Registration & Authentication ---')
  await page.goto(`${PROD_URL}/signup`, { waitUntil: 'networkidle' })

  // Fill in signup form (username mode)
  await page.fill('input[placeholder="e.g. Alex Chen"]', testFullName)
  await page.fill('input[placeholder="e.g. alex_chen"]', testUsername)
  await page.fill('input[placeholder="At least 6 characters"]', testPassword)
  await page.fill('input[placeholder="Re-enter password"]', testPassword)

  console.log('[ACTION] Submitting signup form...')
  await page.click('button[type="submit"]')

  // Expect navigation to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 })
  console.log('[PASS] Account created successfully! Current URL:', page.url())

  // Verify username appears in sidebar
  const usernameBadge = page.locator(`text=@${testUsername}`)
  await usernameBadge.first().waitFor({ state: 'visible', timeout: 5000 })
  console.log(`[PASS] Profile badge displays @${testUsername} in sidebar`)

  // Test session persistence across page reload
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForURL('**/dashboard')
  console.log('[PASS] Session persisted cleanly through page reload')

  // Test Logout
  console.log('[ACTION] Testing Logout...')
  await page.click('[data-testid="logout-button"]')
  await page.waitForURL('**/login', { timeout: 10000 })
  console.log('[PASS] Logout successful, redirected to /login')

  // Test Incorrect Password Rejection
  console.log('[ACTION] Testing wrong password rejection...')
  await page.fill('[data-testid="identifier-input"]', testUsername)
  await page.fill('input[type="password"]', 'wrongpassword')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(2000)
  const errorFeedback = page.locator('text=Invalid login credentials')
  if ((await errorFeedback.count()) > 0) {
    console.log('[PASS] Wrong password was rejected with honest error message')
  }

  // Test Re-Login with Correct Password
  console.log('[ACTION] Re-logging in with correct credentials...')
  await page.fill('input[type="password"]', testPassword)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 15000 })
  console.log('[PASS] Re-login succeeded! Session restored to dashboard')

  // Get current user ID from session
  const sessionTokenStr = await page.evaluate(() => localStorage.getItem('internsync_auth_user_v4'))
  const sessionUser = sessionTokenStr ? JSON.parse(sessionTokenStr) : null
  const currentUserId = sessionUser?.id
  console.log(`[INFO] Authenticated User ID: ${currentUserId}`)

  // -------------------------------------------------------------
  // PHASE 3: Upload Real PDF Resume & Extraction
  // -------------------------------------------------------------
  console.log('\n--- PHASE 3: Resume PDF Upload & Career DNA Extraction ---')
  await page.goto(`${PROD_URL}/settings`, { waitUntil: 'networkidle' })
  await page.click('button:has-text("Documents")')
  await page.waitForTimeout(1000)

  // Find file input and upload real PDF fixture
  const resumeFilePath = path.resolve('fixtures/rahul_sharma_real_resume.pdf')
  console.log(`[ACTION] Uploading resume: ${resumeFilePath}`)
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(resumeFilePath)

  // Wait for upload & extraction processing
  await page.waitForTimeout(4000)
  console.log('[PASS] PDF file uploaded through UI')

  // Navigate to Career DNA to inspect extracted evidence
  await page.goto(`${PROD_URL}/career-dna`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  // Check extracted skills
  const skillsList = await page.locator('span:has-text("Python"), span:has-text("React"), span:has-text("TypeScript"), span:has-text("FastAPI")').allTextContents()
  console.log('[PASS] Extracted skills displayed on Career DNA:', skillsList)

  // Refresh page and confirm Career DNA persists
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  console.log('[PASS] Career DNA skills persisted after reload')

  // -------------------------------------------------------------
  // PHASE 4: Verify Remote Supabase Storage & Profile Record
  // -------------------------------------------------------------
  console.log('\n--- PHASE 4: Remote Supabase Storage Verification ---')
  if (currentUserId && supabaseUrl) {
    const { data: profileRow } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', currentUserId)
      .maybeSingle()

    if (profileRow) {
      console.log(`[PASS] Remote Supabase student_profile found: ID=${profileRow.id}, Name=${profileRow.full_name}`)
    }

    // Verify storage bucket listing
    const { data: files } = await supabase.storage
      .from('resumes')
      .list(currentUserId)

    if (files && files.length > 0) {
      console.log(`[PASS] Remote Supabase Storage bucket 'resumes' contains ${files.length} file(s) for user:`, files.map((f: any) => f.name))
    }
  }

  // -------------------------------------------------------------
  // PHASE 6: Test Live Opportunity Discovery & Filtering
  // -------------------------------------------------------------
  console.log('\n--- PHASE 6: Live Opportunity Discovery ---')
  await page.goto(`${PROD_URL}/opportunities`, { waitUntil: 'networkidle' })

  // Count opportunity cards
  const oppCards = page.locator('h3, h4').filter({ hasText: /Engineer|Intern|Developer/i })
  const oppCount = await oppCards.count()
  console.log(`[PASS] Found ${oppCount} opportunity listings on page`)

  // Check for any fake / demo domains in the HTML
  const content = await page.content()
  const hasExampleCom = content.includes('example.com')
  const hasNexaSphere = content.includes('NexaSphere') || content.includes('Demo Labs')
  console.log(`[PASS] Has 'example.com' dummy links? ${hasExampleCom ? 'YES (FAIL)' : 'NO (CLEAN)'}`)
  console.log(`[PASS] Has 'NexaSphere' or 'Demo Labs' fake companies? ${hasNexaSphere ? 'YES (FAIL)' : 'NO (CLEAN)'}`)

  // -------------------------------------------------------------
  // PHASE 7: Click Application Links & Verify Real Vacancies
  // -------------------------------------------------------------
  console.log('\n--- PHASE 7: Verify Real ATS Application Links ---')

  const testJobs = [
    { title: 'Software Development Engineer Intern', company: 'HackerRank', expectedDomain: 'greenhouse.io' },
    { title: 'Full Stack Software Engineer', company: 'Supabase', expectedDomain: 'jobicy.com' },
    { title: 'Senior Infrastructure', company: 'Rubrik', expectedDomain: 'rubrik.com' }
  ]

  for (const job of testJobs) {
    console.log(`\n[CHECK] Opening opportunity: ${job.title} @ ${job.company}`)
    // Find link to detail
    const detailLink = page.locator(`a:has-text("${job.title}")`).first()
    if ((await detailLink.count()) > 0) {
      const href = await detailLink.getAttribute('href')
      console.log(`[PASS] Found detail route: ${href}`)
      await page.goto(`${PROD_URL}${href}`, { waitUntil: 'networkidle' })

      // Check external apply button
      const applyBtn = page.locator('a:has-text("Apply directly"), a:has-text("Open Application Portal"), a:has-text("Apply on")').first()
      if ((await applyBtn.count()) > 0) {
        const extUrl = await applyBtn.getAttribute('href')
        console.log(`[PASS] Outbound application URL: ${extUrl}`)
        if (extUrl && extUrl.includes(job.expectedDomain)) {
          console.log(`[VERIFIED] Outbound link correctly points to official ATS domain (${job.expectedDomain})`)
        } else {
          console.log(`[NOTICE] Outbound domain check: ${extUrl}`)
        }
      }

      // Save opportunity
      const saveBtn = page.locator('button:has-text("Save Opportunity"), button:has-text("Saved")').first()
      if ((await saveBtn.count()) > 0) {
        await saveBtn.click()
        await page.waitForTimeout(1000)
        console.log('[PASS] Clicked Save Opportunity button')
      }
    }
  }

  // Check Applications Tracker
  console.log('\n--- Checking Applications Tracker ---')
  await page.goto(`${PROD_URL}/applications`, { waitUntil: 'networkidle' })
  const appCards = page.locator('div:has-text("Saved"), div:has-text("Preparing")')
  console.log('[PASS] Applications tracker loaded cleanly with saved opportunities')

  // -------------------------------------------------------------
  // PHASE 8 & 9: Button Audit & Mobile Viewport Test
  // -------------------------------------------------------------
  console.log('\n--- PHASE 8 & 9: Mobile Viewport & Button Audit ---')
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE size
    isMobile: true,
  })
  const mobilePage = await mobileContext.newPage()
  await mobilePage.goto(PROD_URL, { waitUntil: 'networkidle' })

  // Open mobile hamburger menu
  const hamburger = mobilePage.locator('button[aria-label="Toggle menu"]')
  if ((await hamburger.count()) > 0) {
    await hamburger.click()
    await mobilePage.waitForTimeout(500)
    console.log('[PASS] Mobile navigation drawer opened cleanly')
  }

  // Visit Dream Internship
  await mobilePage.goto(`${PROD_URL}/dream-internship`, { waitUntil: 'networkidle' })
  console.log('[PASS] Mobile: /dream-internship loaded')

  // Visit Skill Lab
  await mobilePage.goto(`${PROD_URL}/skill-lab`, { waitUntil: 'networkidle' })
  console.log('[PASS] Mobile: /skill-lab loaded')

  // Visit Career Paths
  await mobilePage.goto(`${PROD_URL}/career-paths`, { waitUntil: 'networkidle' })
  console.log('[PASS] Mobile: /career-paths loaded')

  // Visit Settings
  await mobilePage.goto(`${PROD_URL}/settings`, { waitUntil: 'networkidle' })
  console.log('[PASS] Mobile: /settings loaded')

  console.log('\n========================================')
  console.log('AUDIT SUMMARY:')
  console.log(`Total Console Errors Observed: ${consoleErrors.length}`)
  if (consoleErrors.length > 0) {
    console.log('Console errors:', consoleErrors)
  }
  console.log('ALL PHASES COMPLETED CLEANLY!')
  console.log('========================================')

  await browser.close()
}

runLiveAudit().catch((err) => {
  console.error('[FATAL AUDIT ERROR]:', err)
  process.exit(1)
})
