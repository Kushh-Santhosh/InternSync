import { test, expect } from '@playwright/test'

test.describe('Navigation, Responsive Layouts, and Error States', () => {
  test('Non-existent route displays honest 404 page', async ({ page }) => {
    await page.goto('/some-completely-invalid-path-12345')
    await expect(page.getByText(/404|Page Not Found|Not Found/i).first()).toBeVisible()
    await expect(page.locator('a[href="/"], a[href="/dashboard"]').first()).toBeVisible()
  })

  test('Direct navigation to nested routes works after demo authentication', async ({ page }) => {
    await page.goto('/login')
    await page.click('text=Explore Interactive Demo Mode')
    await page.waitForURL('**/dashboard')

    // Navigate directly to /career-paths
    await page.goto('/career-paths')
    await page.waitForURL('**/career-paths')
    await expect(page.locator('main').getByText(/Optimal Internship Path|Career Direction/i).first()).toBeVisible()

    // Navigate directly to /profile
    await page.goto('/profile')
    await page.waitForURL('**/profile')
    await expect(page.locator('main').getByText(/Academic Profile|Profile/i).first()).toBeVisible()

    // Navigate directly to /assistant
    await page.goto('/assistant')
    await page.waitForURL('**/assistant')
    await expect(page.locator('main').getByRole('heading', { name: /Career Assistant/i })).toBeVisible()
  })

  test('Mobile layout displays hamburger menu button and opens drawer', async ({ page, isMobile }) => {
    await page.goto('/login')
    await page.click('text=Explore Interactive Demo Mode')
    await page.waitForURL('**/dashboard')

    if (isMobile) {
      // Find hamburger menu button on topbar
      await page.click('button[aria-label="Open mobile menu"]')

      // Drawer should open and show navigation links
      await expect(page.locator('nav a:has-text("Career DNA"):visible').first()).toBeVisible()
    }
  })
})
