import { test, expect } from '@playwright/test'

test.describe('Authentication, Demo Mode, and Session Isolation', () => {
  test('Landing page loads with brand, value proposition and navigation', async ({ page, isMobile }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/InternSync/)
    await expect(page.locator('text=InternSync').first()).toBeVisible()
    if (!isMobile) {
      await expect(page.locator('text=Sign in').first()).toBeVisible()
    } else {
      await expect(page.locator('button:has(svg.lucide-menu)').first()).toBeVisible()
    }
  })

  test('Unauthenticated access to protected route redirects to login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/login**')
    await expect(page.locator('h1')).toContainText(/Sign in/i)
  })

  test('Login form requires identifier and password', async ({ page }) => {
    await page.goto('/login')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Please enter your username or email address.')).toBeVisible()
  })

  test('Interactive Demo Mode activates cleanly without credentials', async ({ page }) => {
    await page.goto('/login')
    const demoButton = page.locator('text=Explore Interactive Demo Mode')
    await expect(demoButton).toBeVisible()
    await demoButton.click()

    await page.waitForURL('**/dashboard')
    await expect(page.locator('text=Rahul Sharma').first()).toBeVisible()
    await expect(page.locator('text=Interactive Demo Mode').first()).toBeVisible()
  })

  test('Session persists through page refresh', async ({ page }) => {
    await page.goto('/login')
    await page.click('text=Explore Interactive Demo Mode')
    await page.waitForURL('**/dashboard')

    await page.reload()
    await expect(page.locator('main').getByText(/Rahul/i).first()).toBeVisible()
  })

  test('Logout cleanly clears session and redirects to login', async ({ page, isMobile }) => {
    await page.goto('/login')
    await page.click('text=Explore Interactive Demo Mode')
    await page.waitForURL('**/dashboard')

    if (isMobile) {
      await page.click('button[aria-label="Open mobile menu"]')
      await page.waitForTimeout(300)
    }

    // Click visible sign out button in sidebar
    await page.click('[data-testid="logout-button"]:visible')
    await page.waitForURL('**/login')
    // Attempting to visit dashboard must now redirect back to login
    await page.goto('/dashboard')
    await page.waitForURL('**/login**')
  })
})
