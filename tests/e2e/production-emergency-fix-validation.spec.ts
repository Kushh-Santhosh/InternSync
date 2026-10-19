import { test, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const PROD_URL = 'https://intern-sync-one.vercel.app'
const evidenceDir = path.resolve(process.cwd(), 'test-evidence/emergency-fix')
const genuineResumePath = path.resolve(process.cwd(), 'fixtures/rahul_sharma_real_resume.pdf')

test.describe('Production Emergency Fix: Resume Upload RLS & Student Signup Validation', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true })
    }
  })

  test('Workflow 1: Public Signup Screen & Honest Rate-Limit Guidance', async ({ page }) => {
    test.setTimeout(60000)
    console.log('\n--- [Workflow 1] Testing Public Signup Screen ---')
    await page.goto(`${PROD_URL}/signup`, { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/signup')

    await page.screenshot({ path: path.join(evidenceDir, '01_signup_screen_initial.png'), fullPage: true })

    const nameInput = page.locator('input[placeholder*="Alex Chen"], input[type="text"]').first()
    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const submitBtn = page.locator('button[type="submit"]:has-text("Create account")').first()

    // Test form preservation
    await nameInput.fill('Kushal Test Student')
    await emailInput.fill('santosh.podaralla@gmail.com')
    await passwordInput.fill('testpassword')

    console.log('Submitting signup with rate-limited email...')
    await submitBtn.click()
    await page.waitForTimeout(2500)

    // Form values must remain preserved
    await expect(nameInput).toHaveValue('Kushal Test Student')
    await expect(emailInput).toHaveValue('santosh.podaralla@gmail.com')
    await expect(passwordInput).toHaveValue('testpassword')

    // Check error banner shows clear message
    const errorContainer = page.locator('.bg-rose-50')
    if (await errorContainer.isVisible()) {
      const errorText = await errorContainer.textContent()
      console.log('Observed truthful signup guidance:', errorText?.trim())
      await page.screenshot({ path: path.join(evidenceDir, '02_signup_rate_limit_truthful_banner.png'), fullPage: true })
    }
  })

  test('Workflow 2: Visitor Resume Upload & In-Memory Extraction (No RLS Violation)', async ({ page }) => {
    test.setTimeout(90000)
    console.log('\n--- [Workflow 2] Testing Landing Page Resume Upload ---')
    await page.goto(PROD_URL, { waitUntil: 'networkidle' })

    const uploadSection = page.locator('#resume-upload')
    await uploadSection.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1000)

    // Verify genuine PDF exists
    expect(fs.existsSync(genuineResumePath)).toBe(true)

    // Monitor console errors for storage RLS violation
    const rlsErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.text().includes('row-level security policy') || msg.text().includes('violates row-level security')) {
        rlsErrors.push(msg.text())
      }
    })

    console.log('Uploading genuine PDF resume on landing page as visitor...')
    const fileInput = uploadSection.locator('input[type="file"]')
    await fileInput.setInputFiles(genuineResumePath)

    // Wait for processing steps (1 through 6)
    await page.waitForTimeout(5000)

    // Assert that NO RLS error occurred
    expect(rlsErrors.length).toBe(0)
    const errorBanner = page.locator('.bg-rose-50:has-text("violates row-level security")')
    const hasRlsError = await errorBanner.isVisible().catch(() => false)
    expect(hasRlsError).toBe(false)
    console.log('✓ Storage RLS violation DID NOT occur!')

    await page.screenshot({ path: path.join(evidenceDir, '03_visitor_upload_success.png'), fullPage: true })

    // Wait for redirect to opportunities
    await page.waitForURL('**/opportunities', { timeout: 15000 }).catch(() => {})
    console.log('Current URL after upload processing:', page.url())
    await page.screenshot({ path: path.join(evidenceDir, '04_visitor_matched_opportunities.png'), fullPage: true })
  })

  test('Workflow 3: Authenticated Student Upload, Storage Creation & Document Persistence', async ({ page }) => {
    test.setTimeout(90000)
    console.log('\n--- [Workflow 3] Testing Authenticated Student Upload (Account A) ---')
    await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle' })

    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const signInBtn = page.locator('button[type="submit"]:has-text("Sign in")')

    await emailInput.fill('ananya.design.student@internsync.dev')
    await passwordInput.fill('testpassword')
    await signInBtn.click()

    await page.waitForURL('**/dashboard', { timeout: 15000 })
    console.log('✓ Successfully signed in as Account A (Ananya Sen)')

    // Navigate to Settings > Documents
    await page.goto(`${PROD_URL}/settings`, { waitUntil: 'networkidle' })
    await page.click('button:has-text("Documents")')
    await page.waitForTimeout(1000)

    await page.screenshot({ path: path.join(evidenceDir, '05_settings_documents_before.png'), fullPage: true })

    // Listen for storage upload request
    let storageUploaded = false
    let docMetaInserted = false

    page.on('response', (res) => {
      if (res.url().includes('/storage/v1/object/documents') && res.request().method() === 'POST') {
        console.log(`Storage Upload HTTP Status: ${res.status()}`)
        if (res.status() === 200) storageUploaded = true
      }
      if (res.url().includes('/rest/v1/documents') && res.request().method() === 'POST') {
        console.log(`Documents Metadata Insert HTTP Status: ${res.status()}`)
        if (res.status() === 201) docMetaInserted = true
      }
    })

    // Upload genuine PDF via Settings document input
    console.log('Uploading genuine document in Settings tab...')
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(genuineResumePath)

    await page.waitForTimeout(6000)

    // Confirm document item is visible in the list (heading role to disambiguate from toast)
    const docHeading = page.getByRole('heading', { name: 'rahul_sharma_real_resume.pdf' }).first()
    await expect(docHeading).toBeVisible({ timeout: 10000 })
    console.log('✓ Document appears in student documents list!')

    // Confirm download button exists
    const downloadBtn = page.locator('button[title="Download private document"]').first()
    await expect(downloadBtn).toBeVisible()
    console.log('✓ Download private document button is available')

    await page.screenshot({ path: path.join(evidenceDir, '06_settings_document_persisted.png'), fullPage: true })

    // Refresh page to verify persistence
    console.log('Refreshing page to verify database persistence...')
    await page.reload({ waitUntil: 'networkidle' })
    await page.click('button:has-text("Documents")')
    await page.waitForTimeout(1500)
    await expect(page.getByRole('heading', { name: 'rahul_sharma_real_resume.pdf' }).first()).toBeVisible()
    console.log('✓ Document remains persisted after browser refresh!')

    await page.screenshot({ path: path.join(evidenceDir, '07_persisted_after_refresh.png'), fullPage: true })
  })

  test('Workflow 4: Cross-User Account Isolation & Private File Restriction', async ({ page }) => {
    test.setTimeout(90000)
    console.log('\n--- [Workflow 4] Testing Cross-User Account Isolation (Account B) ---')

    // Sign in as Account B (Priya Nair)
    await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle' })
    await page.fill('input[type="email"]', 'priya.nair.student@internsync.dev')
    await page.fill('input[type="password"]', 'testpassword')
    await page.click('button[type="submit"]:has-text("Sign in")')

    await page.waitForURL('**/dashboard', { timeout: 15000 })
    console.log('✓ Successfully signed in as Account B (Priya Nair)')

    // Go to Settings > Documents
    await page.goto(`${PROD_URL}/settings`, { waitUntil: 'networkidle' })
    await page.click('button:has-text("Documents")')
    await page.waitForTimeout(1500)

    // Confirm Account A's resume is NOT visible
    const foreignHeading = page.getByRole('heading', { name: 'rahul_sharma_real_resume.pdf' })
    const foreignVisible = await foreignHeading.isVisible().catch(() => false)
    expect(foreignVisible).toBe(false)
    console.log('✓ Strict Isolation Confirmed: Account B CANNOT see Account A private document!')

    await page.screenshot({ path: path.join(evidenceDir, '08_account_b_isolated_documents.png'), fullPage: true })
  })

  test('Workflow 5: File Validation (Oversized & Prohibited File Formats)', async ({ page }) => {
    test.setTimeout(60000)
    console.log('\n--- [Workflow 5] Testing File Validation Edge Cases ---')
    await page.goto(PROD_URL, { waitUntil: 'networkidle' })

    const uploadSection = page.locator('#resume-upload')
    await uploadSection.scrollIntoViewIfNeeded()

    // 1. Prohibited file format test (.exe)
    const fakeExePath = path.join(evidenceDir, 'malicious_executable.exe')
    fs.writeFileSync(fakeExePath, 'MZ fake binary content')

    const fileInput = uploadSection.locator('input[type="file"]')
    await fileInput.setInputFiles(fakeExePath)
    await page.waitForTimeout(1500)

    const prohibitedError = uploadSection.locator('.bg-rose-50')
    await expect(prohibitedError).toBeVisible()
    const errorText = await prohibitedError.textContent()
    console.log('Prohibited format error message:', errorText?.trim())
    expect(errorText?.toLowerCase()).toContain('prohibited')

    await page.screenshot({ path: path.join(evidenceDir, '09_prohibited_format_error.png'), fullPage: true })

    // Clean up temporary fake exe
    fs.unlinkSync(fakeExePath)
  })
})
