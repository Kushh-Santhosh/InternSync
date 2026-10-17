import { test, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const PROD_URL = 'https://intern-sync-one.vercel.app'
const evidenceDir = path.resolve(process.cwd(), 'test-evidence/mvp-audit')

test.describe('Production Public Registration & Authentication Security Audit', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true })
    }
  })

  test('Public Registration, Verification State, Login Security, and Route Protection', async ({ page }) => {
    test.setTimeout(120000)
    console.log('--- Step 1: Open Public Signup Page ---')
    await page.goto(`${PROD_URL}/signup`, { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/signup')

    // Verify title and form elements
    await expect(page.locator('h1:has-text("Build your Career DNA")')).toBeVisible()
    const nameInput = page.locator('input[placeholder*="Alex Chen"], input[type="text"]').first()
    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const submitBtn = page.locator('button[type="submit"]:has-text("Create account")').first()

    // 1. Invalid input: Empty submission
    console.log('--- Step 2: Test Invalid Input (Empty Submission) ---')
    await submitBtn.click()
    const emptyErr = page.locator('text=Please provide your name and email')
    await expect(emptyErr).toBeVisible()

    // 2. Invalid input: Short password
    console.log('--- Step 3: Test Invalid Input (Short Password) ---')
    await nameInput.fill('Audit Test Student')
    await emailInput.fill('audit.test@example.com')
    await passwordInput.fill('123')
    await submitBtn.click()
    const shortPassErr = page.locator('text=Password should be at least 6 characters')
    await expect(shortPassErr).toBeVisible()

    // 3. Valid Registration through the actual UI
    console.log('--- Step 4: Valid Registration Submission ---')
    const uniqueEmail = `audit.student.${Date.now()}@internsync.dev`
    const validPassword = 'testpassword'

    await nameInput.fill('Audit Test Student')
    await emailInput.fill(uniqueEmail)
    await passwordInput.fill(validPassword)

    // Listen for signup API network response
    const signupResponsePromise = page.waitForResponse((res) =>
      res.url().includes('/auth/v1/signup')
    )

    await submitBtn.click()

    const signupResponse = await signupResponsePromise
    const signupStatus = signupResponse.status()
    const signupJson = await signupResponse.json().catch(() => ({}))

    console.log(`Supabase /auth/v1/signup Status: ${signupStatus}`)
    console.log(`Supabase /auth/v1/signup Response:`, JSON.stringify(signupJson))

    if (signupStatus === 429) {
      console.log('Observed Supabase Auth Rate Limit: email rate limit exceeded (built-in mailer limit).')
      const rateLimitBanner = page.getByText('email rate limit exceeded')
      await expect(rateLimitBanner).toBeVisible()
      await page.screenshot({
        path: path.join(evidenceDir, 'registration_01_rate_limit_banner.png'),
        fullPage: true,
      })
    } else if (signupStatus === 200) {
      // Check confirmation screen
      await expect(page.locator('h2:has-text("Verify your email")')).toBeVisible({ timeout: 10000 })
      await expect(page.locator(`text=${uniqueEmail}`)).toBeVisible()
      await page.screenshot({
        path: path.join(evidenceDir, 'registration_01_verify_email_screen.png'),
        fullPage: true,
      })
    }

    // 4. Test Login with unverified account
    console.log('--- Step 5: Test Sign-in with Unverified Account ---')
    await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle' })
    await page.fill('input[type="email"]', uniqueEmail)
    await page.fill('input[type="password"]', validPassword)

    const loginResponsePromise = page.waitForResponse((res) =>
      res.url().includes('/auth/v1/token')
    )
    await page.click('button[type="submit"]:has-text("Sign in")')

    const loginResponse = await loginResponsePromise
    const loginStatus = loginResponse.status()
    const loginJson = await loginResponse.json().catch(() => ({}))

    console.log(`Supabase /auth/v1/token Status for unverified user: ${loginStatus}`)
    console.log(`Supabase /auth/v1/token Response:`, JSON.stringify(loginJson))

    // Expect error explaining unconfirmed email or invalid credentials
    const loginErrMsg = page.locator('.bg-rose-50, .text-rose-700, [role="alert"]')
    await expect(loginErrMsg).toBeVisible()
    await page.screenshot({
      path: path.join(evidenceDir, 'registration_02_unverified_login_attempt.png'),
      fullPage: true,
    })

    // 5. Test Duplicate Registration
    console.log('--- Step 6: Test Duplicate Registration ---')
    await page.goto(`${PROD_URL}/signup`, { waitUntil: 'networkidle' })
    await nameInput.fill('Audit Test Student Duplicate')
    await emailInput.fill(uniqueEmail)
    await passwordInput.fill(validPassword)

    const dupResponsePromise = page.waitForResponse((res) =>
      res.url().includes('/auth/v1/signup')
    )
    await submitBtn.click()
    const dupResponse = await dupResponsePromise
    console.log(`Supabase Duplicate Signup Status: ${dupResponse.status()}`)
    await page.screenshot({
      path: path.join(evidenceDir, 'registration_03_duplicate_signup.png'),
      fullPage: true,
    })

    // 6. Test Wrong Password on Login
    console.log('--- Step 7: Test Wrong Password on Login ---')
    await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle' })
    await page.fill('input[type="email"]', uniqueEmail)
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]:has-text("Sign in")')
    await expect(page.locator('.bg-rose-50, .text-rose-700, [role="alert"]')).toBeVisible()
    await page.screenshot({
      path: path.join(evidenceDir, 'registration_04_wrong_password.png'),
      fullPage: true,
    })

    // 7. Test Protected Route Access when logged out
    console.log('--- Step 8: Test Protected Routes when logged out ---')
    const protectedPaths = ['/dashboard', '/profile', '/opportunities', '/applications', '/career-dna', '/skill-lab', '/settings', '/onboarding']
    for (const p of protectedPaths) {
      await page.goto(`${PROD_URL}${p}`, { waitUntil: 'load' })
      await page.waitForTimeout(500)
      const currentUrl = page.url()
      console.log(`Accessing protected route ${p} -> redirected to: ${currentUrl}`)
      expect(currentUrl).toMatch(/\/(login|signup|$)/)
    }
    await page.screenshot({
      path: path.join(evidenceDir, 'registration_05_protected_route_redirect.png'),
      fullPage: true,
    })
  })
})
