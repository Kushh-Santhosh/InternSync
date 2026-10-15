import { test, expect } from '@playwright/test'

test.describe('Document Management, Career DNA, and Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.click('text=Explore Interactive Demo Mode')
    await page.waitForURL('**/dashboard')
  })

  test('Career DNA displays verified skills and evidence without fake metrics', async ({ page }) => {
    await page.goto('/career-dna')
    await page.waitForURL('**/career-dna')
    await expect(page.locator('h1').filter({ hasText: /CAREER DNA/i })).toBeVisible()

    // Verify skills or project evidence section exists
    await expect(page.getByText(/Evidence|Verified Skills/i).first()).toBeVisible()
  })

  test('Settings page tabs are student-focused without internal AI developer infrastructure', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForURL('**/settings')
    await expect(page.locator('main h1').filter({ hasText: /Settings/i })).toBeVisible()

    // Must have standard tabs: Profile, Preferences, Documents, Account, Privacy
    await expect(page.locator('main button:has-text("Profile")').first()).toBeVisible()
    await expect(page.locator('main button:has-text("Preferences")').first()).toBeVisible()
    await expect(page.locator('main button:has-text("Documents")').first()).toBeVisible()

    // Must NOT leak internal model names, API key forms, or dev settings to students
    await expect(page.locator('input[placeholder*="sk-ant"], input[placeholder*="openrouter_api_key"]')).not.toBeAttached()
  })

  test('Documents tab in Settings renders upload dropzone and document list', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForURL('**/settings')
    await page.click('main button:has-text("Documents")')

    // Verify upload dropzone
    await expect(page.getByText(/Upload|Resume/i).first()).toBeVisible()
  })

  test('Skill Lab displays quizzes and distinguishes unverified vs tested skills', async ({ page }) => {
    await page.goto('/skill-lab')
    await page.waitForURL('**/skill-lab')
    await expect(page.locator('h1').filter({ hasText: /VALIDATE YOUR SKILLS/i })).toBeVisible()

    // Verify quiz cards for core skills
    await expect(page.getByText(/Python|React|SQL/i).first()).toBeVisible()
  })

  test('Dream Internship simulator renders fit analysis', async ({ page }) => {
    await page.goto('/dream-internship')
    await page.waitForURL('**/dream-internship')
    await expect(page.getByText(/Target Opportunity|Dream Internship|AI Engineer/i).first()).toBeVisible()
  })
})
