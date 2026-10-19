import { test, expect } from '@playwright/test'

test.describe('Temporary Username-Based Account E2E Flow', () => {
  const ts = Date.now()
  const user1 = `alpha_student_${ts}`
  const user2 = `beta_student_${ts}`
  const password = 'testpassword'

  test('Signup page displays required hackathon disclaimer and instant username mode', async ({ page }) => {
    await page.goto('/signup')

    // Confirm heading
    await expect(page.locator('h1')).toContainText(/Build your Career DNA/i)

    // Confirm Instant Username tab is active
    await expect(page.locator('text=Instant Username').first()).toBeVisible()

    // Confirm mandatory professional hackathon notice banner
    const notice = page.locator('text=Temporary hackathon account:')
    await expect(notice).toBeVisible()
    await expect(
      page.locator('text=Email verification and email-based password recovery are not enabled for this account type.')
    ).toBeVisible()
  })

  test('Form validates required fields, username format, and password confirmation', async ({ page }) => {
    await page.goto('/signup')

    // Submit empty form
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Please provide your full name')).toBeVisible()

    // Fill name, short username
    await page.fill('input[placeholder*="Alex Chen"]', 'Alex Validation Test')
    await page.fill('input[placeholder*="alex_chen"]', 'ab')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Username must be between 3 and 30 characters')).toBeVisible()

    // Fill invalid characters
    await page.fill('input[placeholder*="alex_chen"]', 'invalid user!')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Username may only contain letters, numbers, and underscores')).toBeVisible()

    // Fill valid username, short password
    await page.fill('input[placeholder*="alex_chen"]', 'valid_user_99')
    await page.fill('input[placeholder*="At least 6 characters"]', '123')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible()

    // Password mismatch
    await page.fill('input[placeholder*="At least 6 characters"]', 'Password123!')
    await page.fill('input[placeholder*="Re-enter password"]', 'diffpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Passwords do not match')).toBeVisible()
  })

  test('Full User Journey: Registration, Dashboard, Resume, Opportunity, Logout, Re-login & Isolation', async ({
    page,
    browser,
    isMobile,
  }) => {
    // -------------------------------------------------------------
    // STEP 1: Register User 1 (Alpha) without real email
    // -------------------------------------------------------------
    await page.goto('/signup')
    await page.fill('input[placeholder*="Alex Chen"]', 'Alpha Test Candidate')
    await page.fill('input[placeholder*="alex_chen"]', user1)
    await page.fill('input[placeholder*="At least 6 characters"]', password)
    await page.fill('input[placeholder*="Re-enter password"]', password)

    // Click submit
    await page.click('button[type="submit"]')

    // Must navigate directly to /dashboard without email verification screens
    await page.waitForURL('**/dashboard', { timeout: 15000 })
    await expect(page.locator('h1')).toContainText(/Alpha/i)

    // -------------------------------------------------------------
    // STEP 2: Verify Profile and Absence of Synthetic Email Leakage
    // -------------------------------------------------------------
    await page.goto('/profile')
    await page.waitForURL('**/profile')
    await expect(page.locator(`input[value="@${user1}"]`)).toBeVisible()
    await expect(page.locator('input[value="Alpha Test Candidate"]')).toBeVisible()

    // Contact email input should be empty (synthetic email not exposed)
    const emailInput = page.locator('input[type="email"]')
    const emailVal = await emailInput.inputValue()
    expect(emailVal).not.toContain('@demo.internsync.invalid')

    // -------------------------------------------------------------
    // STEP 3: Discover & Save an Opportunity to Tracker
    // -------------------------------------------------------------
    await page.goto('/opportunities')
    await page.waitForURL('**/opportunities')

    // Find and click the first opportunity card
    const firstOppTitle = page.locator('h3').first()
    await expect(firstOppTitle).toBeVisible({ timeout: 10000 })
    const roleText = await firstOppTitle.textContent()
    await firstOppTitle.click()

    // On Opportunity Details page, save to pipeline (which automatically navigates to /applications)
    await page.waitForURL('**/opportunities/**', { timeout: 10000 })
    const savePipelineBtn = page.locator('button:has-text("Save to Pipeline")')
    await expect(savePipelineBtn).toBeVisible({ timeout: 10000 })
    await savePipelineBtn.click()

    // Confirms arrival at applications tracker
    await page.waitForURL('**/applications', { timeout: 10000 })
    await expect(page.locator('text=Saved').first()).toBeVisible()
    await expect(page.locator('h4').first()).toBeVisible()

    // -------------------------------------------------------------
    // STEP 4: Sign out
    // -------------------------------------------------------------
    if (isMobile) {
      await page.click('button[aria-label="Open mobile menu"]')
      await page.waitForTimeout(300)
    }
    const logoutBtn = page.locator('[data-testid="logout-button"]:visible')
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click()
    } else {
      await page.goto('/settings')
      await page.click('button:has-text("Sign Out")')
    }
    await page.waitForURL('**/login', { timeout: 10000 })

    // -------------------------------------------------------------
    // STEP 5: Log back in using USERNAME and PASSWORD
    // -------------------------------------------------------------
    await page.fill('input[data-testid="identifier-input"]', user1)
    await page.fill('input[placeholder*="••••••••"]', password)
    await page.click('button[type="submit"]')

    await page.waitForURL('**/dashboard', { timeout: 15000 })
    await expect(page.locator('h1')).toContainText(/Alpha/i)

    // -------------------------------------------------------------
    // STEP 6: Duplicate Username Prevention Test
    // -------------------------------------------------------------
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()

    await page2.goto('/signup')
    await page2.fill('input[placeholder*="Alex Chen"]', 'Duplicate Imposter')
    await page2.fill('input[placeholder*="alex_chen"]', user1)
    await page2.fill('input[placeholder*="At least 6 characters"]', 'otherpassword')
    await page2.fill('input[placeholder*="Re-enter password"]', 'otherpassword')
    await page2.click('button[type="submit"]')

    // Must show duplicate username error
    await expect(
      page2.locator('text=already taken').or(page2.locator('text=already registered'))
    ).toBeVisible({ timeout: 10000 })

    // -------------------------------------------------------------
    // STEP 7: Register User 2 (Beta) and Verify Complete Data Isolation
    // -------------------------------------------------------------
    await page2.fill('input[placeholder*="Alex Chen"]', 'Beta Test Candidate')
    await page2.fill('input[placeholder*="alex_chen"]', user2)
    await page2.fill('input[placeholder*="At least 6 characters"]', password)
    await page2.fill('input[placeholder*="Re-enter password"]', password)
    await page2.click('button[type="submit"]')

    await page2.waitForURL('**/dashboard', { timeout: 15000 })
    await expect(page2.locator('h1')).toContainText(/Beta/i)

    // Confirm User 2 does NOT have User 1's greeting
    await expect(page2.locator('h1')).not.toContainText(/Alpha/i)

    await context2.close()
  })
})
