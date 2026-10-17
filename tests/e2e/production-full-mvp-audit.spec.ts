import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

const PROD_URL = 'https://intern-sync-one.vercel.app'
const evidenceDir = path.resolve(process.cwd(), 'test-evidence', 'mvp-audit')

test.beforeAll(() => {
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true })
  }
})

test.describe.serial('InternSync Production MVP End-to-End Real User Audit', () => {
  test('Complete End-to-End Audit across 2 independent students with live discovery and mobile inspection', async ({ page, isMobile }) => {
    test.setTimeout(240000)

    const viewportLabel = isMobile ? 'mobile' : 'desktop'
    console.log(`\n================ STARTING AUDIT ON [${viewportLabel}] ================`)

    // ────────────────────────────────────────────────────────────
    // 1. LANDING PAGE AUDIT
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 1: Public Landing Page ---')
    await page.goto(PROD_URL, { waitUntil: 'networkidle' })
    await expect(page).toHaveTitle(/InternSync/i)
    await expect(page.locator('text=InternSync').first()).toBeVisible()
    await expect(page.locator('text=Opportunity-Readiness Platform').first()).toBeVisible()

    await page.screenshot({
      path: path.join(evidenceDir, `${viewportLabel}_01_landing.png`),
      fullPage: true,
    })

    // ────────────────────────────────────────────────────────────
    // 2. SIGN IN AS STUDENT 1: PRIYA NAIR (Software Engineer)
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 2: Login as Priya Nair (Student 1) ---')
    await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible()

    await page.fill('input[placeholder="name@university.edu"]', 'priya.nair.student@internsync.dev')
    await page.fill('input[placeholder="••••••••"]', 'testpassword')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
    console.log('Successfully logged in! Current URL:', page.url())

    await page.screenshot({
      path: path.join(evidenceDir, `${viewportLabel}_02_priya_dashboard.png`),
    })

    // ────────────────────────────────────────────────────────────
    // 3. SETTINGS: CONFIGURE PROFILE (PRIYA NAIR)
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 3: Configure Priya\'s Career Profile in Settings ---')
    await page.goto(`${PROD_URL}/settings`, { waitUntil: 'networkidle' })

    // Tab 1: Profile
    const nameInput = page.locator('input[placeholder*="Sharma"]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('Priya Nair')
    }

    const uniInput = page.locator('input[placeholder*="PES"], input[placeholder*="University"]').first()
    if (await uniInput.isVisible()) {
      await uniInput.fill('PES University, Bengaluru')
    }

    // Degree Program
    const degreeInputs = page.locator('input[placeholder*="Degree"], input[placeholder*="B.Tech"]')
    if (await degreeInputs.count() > 0) {
      await degreeInputs.first().fill('B.Tech')
    }

    // Graduation Year
    const gradYearInputs = page.locator('input[placeholder*="2026"], input[placeholder*="2028"]')
    if (await gradYearInputs.count() > 0) {
      await gradYearInputs.first().fill('2026')
    }

    // Save Profile button
    const saveProfileBtn = page.locator('button:has-text("Save Profile")').first()
    if (await saveProfileBtn.isVisible()) {
      await saveProfileBtn.click()
      await page.waitForTimeout(1200)
    }

    // Tab 2: Career Preferences
    const careerTab = page.locator('button:has-text("Career Preferences")').first()
    if (await careerTab.isVisible()) {
      await careerTab.click()
      await page.waitForTimeout(600)

      const targetRoleInput = page.locator('input[placeholder*="Engineer"], input[placeholder*="Developer"]').first()
      if (await targetRoleInput.isVisible()) {
        await targetRoleInput.fill('Software Engineering Intern')
      }

      const locInput = page.locator('input[placeholder*="Bengaluru"]').first()
      if (await locInput.isVisible()) {
        await locInput.fill('Bengaluru, Remote')
      }

      const savePrefBtn = page.locator('button:has-text("Save Preferences")').first()
      if (await savePrefBtn.isVisible()) {
        await savePrefBtn.click()
        await page.waitForTimeout(1200)
      }
    }

    await page.screenshot({
      path: path.join(evidenceDir, `${viewportLabel}_03_priya_profile_saved.png`),
    })

    // Verify persistence after hard refresh
    console.log('--- Verifying persistence after page reload ---')
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    const pageText = await page.textContent('body')
    expect(pageText).toContain('Priya Nair')

    // ────────────────────────────────────────────────────────────
    // 4. CAREER DNA
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 4: Inspect Career DNA ---')
    await page.goto(`${PROD_URL}/career-dna`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    // Confirm Year 3 standing if verification banner appears
    const year3Btn = page.locator('button:has-text("Year 3")').first()
    if (await year3Btn.isVisible()) {
      console.log('Confirming academic standing: Year 3')
      await year3Btn.click()
      await page.waitForTimeout(800)
    }

    await page.screenshot({
      path: path.join(evidenceDir, `${viewportLabel}_04_priya_career_dna.png`),
      fullPage: true,
    })

    // ────────────────────────────────────────────────────────────
    // 5. SKILL LAB: VALIDATE PYTHON SKILL
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 5: Validate Skill in Skill Lab ---')
    await page.goto(`${PROD_URL}/skill-lab`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    const startQuizBtn = page.locator('button:has-text("Start Assessment"), button:has-text("Test Python"), button:has-text("Validate")').first()
    if (await startQuizBtn.isVisible()) {
      await startQuizBtn.click()
      await page.waitForTimeout(600)

      // Select first quiz answer
      const answerChoice = page.locator('button[class*="rounded-xl border"]:has-text("A."), button:has-text("B.")').first()
      if (await answerChoice.isVisible()) {
        await answerChoice.click()
        await page.waitForTimeout(400)

        const submitAnswer = page.locator('button:has-text("Submit Answer")').first()
        if (await submitAnswer.isVisible()) {
          await submitAnswer.click()
          await page.waitForTimeout(1000)
        }
      }
    }

    await page.screenshot({
      path: path.join(evidenceDir, `${viewportLabel}_05_priya_skill_lab.png`),
    })

    // ────────────────────────────────────────────────────────────
    // 6. LIVE OPPORTUNITY DISCOVERY (PUBLIC BASELINE)
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 6: Live Opportunity Discovery ---')
    await page.goto(`${PROD_URL}/opportunities`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    // Check for "Find internships for me" button
    const discoverBtn = page.locator('button:has-text("Find internships for me")').first()
    if (await discoverBtn.isVisible()) {
      console.log('Clicking "Find internships for me"...')
      await discoverBtn.click()

      // Wait for search progress to complete
      await page.waitForTimeout(8000)
    }

    await page.screenshot({
      path: path.join(evidenceDir, `${viewportLabel}_06_priya_opportunities.png`),
      fullPage: true,
    })

    // Verify opportunity cards render with recommendations and employers
    const viewOppButtons = page.locator('button:has-text("View opportunity")')
    const cardCount = await viewOppButtons.count()
    console.log(`Visible Opportunity Cards: ${cardCount}`)
    expect(cardCount).toBeGreaterThan(0)

    // ────────────────────────────────────────────────────────────
    // 7. OPPORTUNITY DETAIL & BOOKMARKING
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 7: View Opportunity Detail & Bookmark ---')
    if (cardCount > 0) {
      await viewOppButtons.first().click()
      await page.waitForURL('**/opportunities/**', { timeout: 10000 })
      await page.waitForTimeout(1000)

      await page.screenshot({
        path: path.join(evidenceDir, `${viewportLabel}_07_opportunity_detail.png`),
        fullPage: true,
      })

      // Check external application button exists
      const applyBtn = page.locator('a:has-text("Apply"), a:has-text("Apply directly")').first()
      if (await applyBtn.isVisible()) {
        const href = await applyBtn.getAttribute('href')
        console.log(`Direct Application URL verified: ${href}`)
        expect(href).toMatch(/^https?:\/\//)
      }

      // Bookmark / Save opportunity
      const saveOppBtn = page.locator('button:has-text("Save"), button:has-text("Save to Pipeline")').first()
      if (await saveOppBtn.isVisible()) {
        await saveOppBtn.click()
        await page.waitForTimeout(1000)
        console.log('Saved opportunity to pipeline!')
      }
    }

    // ────────────────────────────────────────────────────────────
    // 8. APPLICATIONS TRACKER
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 8: Applications Tracker ---')
    await page.goto(`${PROD_URL}/applications`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: path.join(evidenceDir, `${viewportLabel}_08_priya_applications_tracker.png`),
    })

    // ────────────────────────────────────────────────────────────
    // 9. LOGOUT & VERIFY SESSION CLEARED
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 9: Logout Priya Nair ---')
    await page.goto(`${PROD_URL}/settings`, { waitUntil: 'networkidle' })
    const accountTab = page.locator('button:has-text("Account")').first()
    if (await accountTab.isVisible()) {
      await accountTab.click()
      await page.waitForTimeout(600)
    }

    const logoutBtn = page.locator('button:has-text("Sign Out")').first()
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click()
    } else {
      const sidebarLogout = page.locator('button[data-testid="logout-button"], button[aria-label="Sign out"]').first()
      if (await sidebarLogout.isVisible()) {
        await sidebarLogout.click()
      }
    }

    await page.waitForURL((u) => u.pathname.includes('/login') || u.pathname === '/', { timeout: 15000 })
    console.log('Logged out successfully! Current URL:', page.url())

    // Verify protected route cannot be accessed without login
    await page.goto(`${PROD_URL}/career-dna`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    expect(page.url()).toMatch(/\/login|\/$/)

    // ────────────────────────────────────────────────────────────
    // 10. SIGN IN AS STUDENT 2: ANANYA SEN (Product Design)
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 10: Login as Ananya Sen (Student 2) ---')
    await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle' })
    await page.fill('input[placeholder="name@university.edu"]', 'ananya.design.student@internsync.dev')
    await page.fill('input[placeholder="••••••••"]', 'testpassword')
    await page.click('button[type="submit"]')
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })

    await page.screenshot({
      path: path.join(evidenceDir, `${viewportLabel}_09_ananya_dashboard.png`),
    })

    // ────────────────────────────────────────────────────────────
    // 11. VERIFY ACCOUNT ISOLATION (ZERO DATA FROM PRIYA)
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 11: Verify Account Isolation ---')
    await page.goto(`${PROD_URL}/settings`, { waitUntil: 'networkidle' })
    const ananyaPageText = await page.textContent('body')
    // Priya's name or specific PES university should NOT be in Ananya's account
    expect(ananyaPageText).not.toContain('Priya Nair')
    expect(ananyaPageText).not.toContain('PES University')

    // Configure Ananya as Product Designer
    const ananyaName = page.locator('input[placeholder*="Sharma"]').first()
    if (await ananyaName.isVisible()) {
      await ananyaName.fill('Ananya Sen')
    }
    const ananyaUni = page.locator('input[placeholder*="PES"], input[placeholder*="University"]').first()
    if (await ananyaUni.isVisible()) {
      await ananyaUni.fill('National Institute of Design')
    }
    const ananyaDegreeInputs = page.locator('input[placeholder*="Degree"], input[placeholder*="B.Tech"]')
    if (await ananyaDegreeInputs.count() > 0) {
      await ananyaDegreeInputs.first().fill('B.Des')
    }

    const ananyaSave = page.locator('button:has-text("Save Profile")').first()
    if (await ananyaSave.isVisible()) {
      await ananyaSave.click()
      await page.waitForTimeout(1200)
    }

    await page.screenshot({
      path: path.join(evidenceDir, `${viewportLabel}_10_ananya_profile_saved.png`),
    })

    console.log(`\n================ AUDIT COMPLETED ON [${viewportLabel}] ================`)
  })
})
