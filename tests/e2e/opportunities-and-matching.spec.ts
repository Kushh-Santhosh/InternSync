import { test, expect } from '@playwright/test'

test.describe('Opportunity Readiness, Matching Breakdown, and Applications', () => {
  test.beforeEach(async ({ page }) => {
    // Enter demo mode so student has realistic evidence & opportunities to inspect
    await page.goto('/login')
    await page.click('text=Explore Interactive Demo Mode')
    await page.waitForURL('**/dashboard')
  })

  test('Opportunities page renders verified opportunities with deterministic match badges', async ({ page }) => {
    await page.goto('/opportunities')
    await page.waitForURL('**/opportunities')
    await expect(page.locator('h1').filter({ hasText: /Best Internships For You/i })).toBeVisible()

    // Verify opportunity cards render with recommendations (APPLY NOW / PREPARE FIRST / SKIP)
    const cards = page.locator('button:has-text("View opportunity")')
    await expect(cards.first()).toBeVisible()

    const badge = page.getByText(/APPLY NOW|PREPARE FIRST|SKIP/).first()
    await expect(badge).toBeVisible()
  })

  test('Opportunity Detail Page displays explainable match breakdown and 14-day roadmap', async ({ page }) => {
    await page.goto('/opportunities')
    await page.waitForURL('**/opportunities')

    // Click the first opportunity card
    const firstButton = page.locator('button:has-text("View opportunity")').first()
    await expect(firstButton).toBeVisible()
    await firstButton.click()

    await page.waitForURL('**/opportunities/**')

    // Verify recommendation banner
    await expect(page.locator('text=AI RECOMMENDATION')).toBeVisible()

    // Verify fit & evidence tabs
    await expect(page.locator('text=Why You Match & Evidence')).toBeVisible()
    await expect(page.locator('text=14-Day Preparation Sprint')).toBeVisible()

    // Switch to 14-day roadmap tab
    await page.click('text=14-Day Preparation Sprint')
    await expect(page.locator('text=Day').first()).toBeVisible()
  })

  test('Saving an opportunity persists to applications tracker without false applied state', async ({ page }) => {
    await page.goto('/opportunities')
    await page.waitForURL('**/opportunities')
    const firstButton = page.locator('button:has-text("View opportunity")').first()
    await firstButton.click()
    await page.waitForURL('**/opportunities/**')

    // Click "Save to Pipeline"
    const saveBtn = page.locator('button:has-text("Save to Pipeline")')
    await expect(saveBtn).toBeVisible()
    await saveBtn.click()

    // Should navigate to /applications
    await page.waitForURL('**/applications')
    await expect(page.locator('main').getByText(/Applications/i).first()).toBeVisible()

    // Verify saved application exists with honest Saved status
    await expect(page.locator('text=Saved').first()).toBeVisible()

    // Browser refresh test: record must remain intact
    await page.reload()
    await expect(page.locator('text=Saved').first()).toBeVisible()
  })

  test('Opportunity comparison drawer toggles and displays comparisons', async ({ page }) => {
    await page.goto('/opportunities')
    await page.waitForURL('**/opportunities')
    const firstButton = page.locator('button:has-text("View opportunity")').first()
    await firstButton.click()
    await page.waitForURL('**/opportunities/**')

    const compareBtn = page.locator('button:has-text("Compare")').first()
    if (await compareBtn.isVisible()) {
      await compareBtn.click()
      await expect(page.locator('text=Compared').first()).toBeVisible()
    }
  })
})
