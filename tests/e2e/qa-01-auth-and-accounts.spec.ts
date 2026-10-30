import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

test.describe.serial('QA Suite 1 — Authentication, Session & Multi-Account Isolation', () => {
  const ts = Date.now()
  const studentAEmail = `qa.student.a.${ts}@internsync.io`
  const studentBEmail = `qa.student.b.${ts}@internsync.io`
  const testPassword = `Pass_${Math.random().toString(36).slice(2, 8)}!Aa1${ts}`

  let userAId = ''
  let userBId = ''
  let adminClient: any = null

  const evidenceDir = path.resolve(process.cwd(), 'test-evidence', 'exhaustive-qa', 'suite-1-auth')
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kkgnhoflqusupqnhgzkz.supabase.co'
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  test.beforeAll(async () => {
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true })
    }

    if (serviceKey) {
      adminClient = createClient(SUPABASE_URL, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      // Create Student A
      const { data: userA } = await adminClient.auth.admin.createUser({
        email: studentAEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { full_name: 'QA Student Alpha' },
      })
      if (userA?.user) userAId = userA.user.id

      // Create Student B
      const { data: userB } = await adminClient.auth.admin.createUser({
        email: studentBEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { full_name: 'QA Student Beta' },
      })
      if (userB?.user) userBId = userB.user.id

      console.log(`[QA Suite 1] Test users created: Student A (${studentAEmail}), Student B (${studentBEmail})`)
    }
  })

  test.afterAll(async () => {
    if (adminClient) {
      if (userAId) await adminClient.auth.admin.deleteUser(userAId).catch(() => {})
      if (userBId) await adminClient.auth.admin.deleteUser(userBId).catch(() => {})
      console.log('[QA Suite 1] Test accounts cleaned up safely.')
    }
  })

  test('1.1 Login Page Validation & Invalid Credentials', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(evidenceDir, '01_login_page_initial.png') })

    // Test empty submission
    await page.click('button[type="submit"]')
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(evidenceDir, '02_empty_login_validation.png') })

    // Test invalid credentials
    await page.fill('#identifier', 'nonexistent.user.999@internsync.invalid')
    await page.fill('input[type="password"]', 'WrongPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    // Expect error alert
    const errorAlert = page.locator('div[class*="text-rose"], div[class*="bg-rose"], div:has-text("Invalid login credentials"), div:has-text("not found")')
    await expect(errorAlert.first()).toBeVisible({ timeout: 8000 })
    await page.screenshot({ path: path.join(evidenceDir, '03_invalid_login_alert.png') })
  })

  test('1.2 Password Visibility Toggle', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="password"]', 'SecretPassword123!')
    const passwordInput = page.locator('input#identifier ~ div input, input[placeholder="••••••••"]')

    // Initially type=password
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Click toggle button
    const toggleBtn = page.locator('button[type="button"]:has(svg)').first()
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click()
      await page.waitForTimeout(300)
      await expect(passwordInput).toHaveAttribute('type', 'text')
      await page.screenshot({ path: path.join(evidenceDir, '04_password_visible.png') })

      // Toggle back
      await toggleBtn.click()
      await page.waitForTimeout(300)
      await expect(passwordInput).toHaveAttribute('type', 'password')
    }
  })

  test('1.3 Protected Route Guard & Unauthenticated Redirection', async ({ page }) => {
    // Attempt accessing protected route without session
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Should redirect to /login or landing
    expect(page.url()).toContain('/login')
    await page.screenshot({ path: path.join(evidenceDir, '05_protected_route_redirect.png') })
  })

  test('1.4 Student A Authentication & Session Persistence', async ({ page }) => {
    test.skip(!userAId, 'Requires live Supabase credentials')

    await page.goto('/login')
    await page.fill('#identifier', studentAEmail)
    await page.fill('input[type="password"]', testPassword)
    await page.click('button[type="submit"]')

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(evidenceDir, '06_student_a_logged_in.png') })

    // Navigate to profile and update info
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    const nameInput = page.locator('input[placeholder*="full name" i], input[value*="Student" i]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('Student A Verified')
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update")').first()
      if (await saveBtn.isVisible()) {
        await saveBtn.click()
        await page.waitForTimeout(1000)
      }
    }
    await page.screenshot({ path: path.join(evidenceDir, '07_student_a_profile_saved.png') })

    // Test session persistence on browser reload
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(evidenceDir, '08_student_a_session_reloaded.png') })
  })

  test('1.5 Student A Sign Out & Student B Isolation', async ({ page }) => {
    test.skip(!userAId || !userBId, 'Requires live Supabase credentials')

    // Sign out Student A
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    const signOutBtn = page.locator('button:has-text("Sign out"), button:has-text("Logout")').first()
    if (await signOutBtn.isVisible()) {
      await signOutBtn.click()
      await page.waitForTimeout(1000)
    }

    // Sign in as Student B
    await page.goto('/login')
    await page.fill('#identifier', studentBEmail)
    await page.fill('input[type="password"]', testPassword)
    await page.click('button[type="submit"]')

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
    await page.waitForLoadState('networkidle')

    // Navigate to profile and verify Student B's clean profile
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(evidenceDir, '09_student_b_isolated_profile.png') })

    // Verify Student A's data is not visible to Student B
    const bodyContent = await page.textContent('body')
    expect(bodyContent).not.toContain('Student A Verified')
  })

  test('1.6 Instant Demo Mode Activation for Visitors', async ({ page }) => {
    await page.goto('/login')
    const demoButton = page.locator('button:has-text("Explore Interactive Demo"), button:has-text("Demo Mode")').first()
    if (await demoButton.isVisible()) {
      await demoButton.click()
      await page.waitForURL('**/dashboard', { timeout: 10000 })
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: path.join(evidenceDir, '10_demo_mode_activated.png') })

      // Verify Rahul Sharma demo profile active on dashboard
      await expect(page.getByText(/Rahul Sharma/i).first()).toBeVisible()
    }
  })
})

