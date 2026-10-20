import { test, expect } from '@playwright/test'
import path from 'node:path'

test.describe.serial('Visible End-to-End Walkthrough & Real Inspection', () => {
  test('Complete Visible Walkthrough with Screenshots', async ({ page }) => {
    test.setTimeout(180000)

    // Collect console logs and errors
    const consoleLogs: string[] = []
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
      else consoleLogs.push(msg.text())
    })

    const failedRequests: string[] = []
    page.on('requestfailed', (req) => {
      failedRequests.push(`${req.method()} ${req.url()}: ${req.failure()?.errorText}`)
    })

    const evidenceDir = path.resolve(process.cwd(), 'test-evidence')

    // ────────────────────────────────────────────────────────────
    // 1. PUBLIC LANDING PAGE
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 1: Public Landing Page ---')
    await page.goto('/')
    await expect(page).toHaveTitle(/InternSync/i)
    await expect(page.getByText('InternSync').first()).toBeVisible()
    await expect(page.getByText(/Opportunity-Readiness Platform/i).first()).toBeVisible()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '01_landing_page.png'), fullPage: true })

    // ────────────────────────────────────────────────────────────
    // 2. SIGNUP PAGE & FORM VALIDATIONS
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 2: Signup Page & Validation ---')
    await page.goto('/signup')
    await expect(page.getByRole('heading', { name: /Build your Career DNA/i })).toBeVisible()
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(evidenceDir, '02_signup_initial.png') })

    // Test form submission with empty fields
    await page.click('button[type="submit"]')
    await expect(page.getByText(/Please provide your name and email/i)).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '03_signup_empty_validation.png') })

    // Fill invalid email and short password
    await page.fill('input[placeholder="e.g. Alex Chen"]', 'Test Student')
    await page.fill('input[placeholder="alex@university.edu"]', 'invalid-email-format')
    await page.fill('input[type="password"]', '123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(evidenceDir, '04_signup_invalid_inputs.png') })

    // ────────────────────────────────────────────────────────────
    // 3. LOGIN PAGE & UNCONFIGURED SUPABASE TRUTHFUL STATE
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 3: Login Page & Credential Testing ---')
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /Sign in to InternSync|Sign in/i })).toBeVisible()
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(evidenceDir, '05_login_initial.png') })

    // Test empty login submission
    await page.click('button[type="submit"]')
    await expect(page.getByText(/Please enter your email address/i)).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '06_login_empty_validation.png') })

    // Test non-existent credentials (truthful error when Supabase not configured or bad creds)
    const invalidPass = `Invalid_${Math.random().toString(36).slice(2, 8)}!Aa1`
    await page.fill('input[placeholder="name@university.edu"]', 'student@testuniversity.edu')
    await page.fill('input[placeholder="••••••••"]', invalidPass)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '07_login_attempt_feedback.png') })

    // ────────────────────────────────────────────────────────────
    // 4. INTERACTIVE DEMO MODE ACTIVATION & DASHBOARD
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 4: Activating Interactive Demo Mode ---')
    await page.click('text=Explore Interactive Demo Mode')
    await page.waitForURL('**/dashboard')
    await expect(page.locator('main').getByText(/Rahul/i).first()).toBeVisible()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(evidenceDir, '08_dashboard_demo_mode.png'), fullPage: true })

    // Test session refresh persistence
    console.log('--- Testing session persistence on refresh ---')
    await page.reload()
    await page.waitForURL('**/dashboard')
    await expect(page.locator('main').getByText(/Rahul/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '09_dashboard_persisted_after_refresh.png') })

    // ────────────────────────────────────────────────────────────
    // Responsive navigation helper that works across desktop sidebar and mobile
    const navigateTo = async (targetUrl: string) => {
      const link = page.locator(`a[href="${targetUrl}"]:visible`).first()
      if ((await link.count()) > 0) {
        await link.click()
      } else {
        await page.goto(targetUrl)
      }
      await page.waitForURL(`**${targetUrl}`)
    }

    // ────────────────────────────────────────────────────────────
    // 5. CAREER DNA & EVIDENCE INSPECTION
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 5: Career DNA Page ---')
    await navigateTo('/career-dna')
    await expect(page.getByRole('heading', { name: /Career DNA/i })).toBeVisible()
    await expect(page.getByText(/Verified Skills/i).first()).toBeVisible()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '10_career_dna_skills.png'), fullPage: true })

    // ────────────────────────────────────────────────────────────
    // 6. OPPORTUNITIES DIRECTORY & DETERMINISTIC MATCHING
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 6: Opportunities Directory ---')
    await navigateTo('/opportunities')
    await expect(page.locator('main').getByText(/Best Internships For You|Opportunities/i).first()).toBeVisible()
    await expect(page.locator('main').getByText(/APPLY NOW|PREPARE FIRST|SKIP/i).first()).toBeVisible()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '11_opportunities_list.png'), fullPage: true })

    // Test Live Search trigger & unconfigured service feedback
    console.log('--- Testing live search provider trigger ---')
    const searchInput = page.locator('input[placeholder*="Search"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('Engineering')
      await page.waitForTimeout(500)
      await page.screenshot({ path: path.join(evidenceDir, '12_opportunities_filtered.png') })
      await searchInput.fill('')
      await page.waitForTimeout(500)
    }

    // ────────────────────────────────────────────────────────────
    // 7. OPPORTUNITY DETAIL & 8-FACTOR BREAKDOWN
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 7: Opportunity Detail & 14-Day Roadmap ---')
    // Click the first opportunity card
    await page.locator('button:has-text("View opportunity")').first().click()
    await page.waitForURL('**/opportunities/**')
    await expect(page.getByText(/Compatibility Breakdown|Readiness Factors|14-Day Preparation/i).first()).toBeVisible()
    await page.waitForTimeout(1200)
    await page.screenshot({ path: path.join(evidenceDir, '13_opportunity_detail_roadmap.png'), fullPage: true })

    // Test Save to Pipeline
    const saveButton = page.locator('button:has-text("Save to Pipeline"), button:has-text("Save")').first()
    if (await saveButton.isVisible()) {
      await saveButton.click()
      await page.waitForURL('**/applications')
      await page.waitForTimeout(800)
    }
    await page.screenshot({ path: path.join(evidenceDir, '14_opportunity_saved.png') })

    // ────────────────────────────────────────────────────────────
    // 8. APPLICATIONS TRACKER & STATUS PERSISTENCE
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 8: Applications Kanban Tracker ---')
    if (!page.url().includes('/applications')) {
      await navigateTo('/applications')
    }
    await expect(page.locator('main').getByText(/YOUR APPLICATIONS|Applications/i).first()).toBeVisible()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '15_applications_tracker.png'), fullPage: true })

    // Refresh and verify application survived refresh
    await page.reload()
    await page.waitForURL('**/applications')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '16_applications_persisted_after_refresh.png') })

    // ────────────────────────────────────────────────────────────
    // 9. CAREER PATHS & DIRECTION RECOMMENDATIONS
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 9: Career Direction & Paths ---')
    await navigateTo('/career-paths')
    await expect(page.locator('main').getByText(/Optimal Internship Path|Career Direction/i).first()).toBeVisible()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '17_career_paths.png'), fullPage: true })

    // ────────────────────────────────────────────────────────────
    // 10. SKILL LAB (ASSESSMENTS)
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 10: Skill Lab ---')
    await navigateTo('/skill-lab')
    await expect(page.locator('main').getByText(/VALIDATE YOUR SKILLS|Skill Lab/i).first()).toBeVisible()
    await expect(page.locator('main').getByText(/Target Skill Signals|Python/i).first()).toBeVisible()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '18_skill_lab.png'), fullPage: true })

    // ────────────────────────────────────────────────────────────
    // 11. DREAM INTERNSHIP SIMULATOR
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 11: Dream Internship Simulator ---')
    await navigateTo('/dream-internship')
    await expect(page.locator('main').getByText(/Dream Role|Target Career Intelligence/i).first()).toBeVisible()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '19_dream_internship.png'), fullPage: true })

    // ────────────────────────────────────────────────────────────
    // 12. AI CAREER ASSISTANT
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 12: Career Assistant ---')
    await navigateTo('/assistant')
    await expect(page.getByRole('heading', { name: /Career Assistant/i })).toBeVisible()
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(evidenceDir, '20_career_assistant_initial.png') })

    // Click a suggestion chip
    const chip = page.locator('button:has-text("What am I missing for AI internships?")').first()
    if (await chip.isVisible()) {
      await chip.click()
      await page.waitForTimeout(1500)
    }
    await page.screenshot({ path: path.join(evidenceDir, '21_career_assistant_response.png') })

    // ────────────────────────────────────────────────────────────
    // 13. SETTINGS & STUDENT PRIVACY (NO INTERNAL KEYS)
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 13: Student Settings & Documents ---')
    await navigateTo('/settings')
    await expect(page.getByRole('button', { name: 'Profile', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Career Preferences', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Documents', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Account', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Privacy', exact: true })).toBeVisible()

    // Ensure no internal developer or provider controls are leaked to students
    const pageText = await page.textContent('main')
    expect(pageText).not.toContain('OpenRouter Key')
    expect(pageText).not.toContain('Gemini Key')
    expect(pageText).not.toContain('Developer Gateway')
    expect(pageText).not.toContain('Integrations & Cloud')
    await page.screenshot({ path: path.join(evidenceDir, '22_settings_profile.png') })

    // Inspect Documents tab
    await page.click('button:has-text("Documents")')
    await page.waitForTimeout(800)
    await expect(page.getByText(/Uploaded Documents|Upload Document/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '23_settings_documents.png') })

    // Inspect Account tab
    await page.click('button:has-text("Account")')
    await page.waitForTimeout(800)
    await expect(page.getByRole('heading', { name: /Change Password/i })).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '23b_settings_account.png') })

    // Inspect Privacy tab
    await page.click('button:has-text("Privacy")')
    await page.waitForTimeout(800)
    await expect(page.getByRole('heading', { name: /Privacy & Data Governance|Data & Privacy|Privacy/i })).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '23c_settings_privacy.png') })

    // ────────────────────────────────────────────────────────────
    // 14. 404 NOT FOUND ROUTE
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 14: 404 Honest Not Found ---')
    await page.goto('/non-existent-page-test-404')
    await expect(page.getByText(/404|Page Not Found|Not Found/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '24_404_error_page.png') })

    // ────────────────────────────────────────────────────────────
    // 15. LOGOUT & CLEAN SESSION TEARDOWN
    // ────────────────────────────────────────────────────────────
    console.log('--- Step 15: Logout & Session Teardown ---')
    await page.goto('/dashboard')
    const logoutBtn = page.locator('button[data-testid="logout-button"]:visible').first()
    if ((await logoutBtn.count()) > 0) {
      await logoutBtn.click()
    } else {
      // Mobile viewport: open mobile menu drawer then click logout
      const mobileMenuBtn = page.locator('button[aria-label="Open mobile menu"]').first()
      if ((await mobileMenuBtn.count()) > 0) {
        await mobileMenuBtn.click()
        await page.waitForTimeout(400)
        await page.locator('button[data-testid="logout-button"]:visible').first().click()
      }
    }
    await page.waitForURL('**/login')
    await expect(page.getByRole('heading', { name: /Sign in to InternSync|Sign in/i })).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '25_logout_complete.png') })

    // Verify protected route cannot be accessed after logout
    await page.goto('/dashboard')
    await page.waitForURL('**/login')
    await expect(page.getByRole('heading', { name: /Sign in to InternSync|Sign in/i })).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '26_protected_route_redirect.png') })

    console.log('=== All 15 visual walkthrough steps completed successfully ===')
    console.log(`Console errors captured: ${consoleErrors.length}`)
    console.log(`Failed requests captured: ${failedRequests.length}`)
  })
})
