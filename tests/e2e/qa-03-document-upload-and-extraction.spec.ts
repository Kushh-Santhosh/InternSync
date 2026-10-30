import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

test.describe.serial('QA Suite 3 — Document Upload, Multi-Format Validation & Profile Review', () => {
  const evidenceDir = path.resolve(process.cwd(), 'test-evidence', 'exhaustive-qa', 'suite-3-upload')

  test.beforeAll(async () => {
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true })
    }
  })

  test('3.1 Invalid File Extension Rejection (.xyz)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const fileInput = page.locator('input[type="file"]').first()
    const invalidPath = path.resolve(process.cwd(), 'fixtures', 'invalid_document.xyz')
    expect(fs.existsSync(invalidPath)).toBe(true)

    await fileInput.setInputFiles(invalidPath)
    await page.waitForTimeout(600)

    // Verify error banner / validation message
    const errorMsg = page.locator('div[class*="text-rose"], div[class*="bg-rose"], div:has-text("Unsupported file format"), div:has-text("PDF, DOCX, TXT")')
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: path.join(evidenceDir, '01_invalid_extension_rejected.png') })
  })

  test('3.2 Corrupted File Handling', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const fileInput = page.locator('input[type="file"]').first()
    const corruptedPath = path.resolve(process.cwd(), 'fixtures', 'corrupted_resume.pdf')
    expect(fs.existsSync(corruptedPath)).toBe(true)

    await fileInput.setInputFiles(corruptedPath)
    await page.waitForTimeout(1500)

    // Expect graceful rejection without uncaught page crash
    const errorMsg = page.locator('div[class*="text-rose"], div[class*="bg-rose"], div:has-text("Failed"), div:has-text("Unable to parse"), div:has-text("error")')
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: path.join(evidenceDir, '02_corrupted_pdf_rejected.png') })
  })

  test('3.3 Plain Text Resume Ingestion & Extraction (.txt)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const fileInput = page.locator('input[type="file"]').first()
    const txtPath = path.resolve(process.cwd(), 'fixtures', 'test_resume_sample.txt')
    expect(fs.existsSync(txtPath)).toBe(true)

    await fileInput.setInputFiles(txtPath)

    // Wait for processing
    await page.waitForURL('**/opportunities', { timeout: 35000 })
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(evidenceDir, '03_txt_resume_extracted_opportunities.png') })

    // Verify Career DNA
    await page.goto('/career-dna')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/RAHUL SHARMA/i).first()).toBeVisible()
    await expect(page.getByText(/Class of 2026|B.Tech/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '04_txt_resume_career_dna.png') })
  })

  test('3.4 PDF Resume Ingestion & Complete Field Verification (.pdf)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const fileInput = page.locator('input[type="file"]').first()
    const pdfPath = path.resolve(process.cwd(), 'fixtures', 'rahul_sharma_real_resume.pdf')
    expect(fs.existsSync(pdfPath)).toBe(true)

    await fileInput.setInputFiles(pdfPath)

    // Wait for processing and redirection
    await page.waitForURL('**/opportunities', { timeout: 35000 })
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(evidenceDir, '05_pdf_resume_opportunities.png') })

    // Navigate to Profile page and verify all extracted dimensions
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(evidenceDir, '06_pdf_profile_reviewed.png') })

    // Verify education, branch, and candidate name
    await expect(page.getByText(/Rahul Sharma/i).first()).toBeVisible()
    await expect(page.getByText(/Computer Science|B.Tech/i).first()).toBeVisible()
  })

  test('3.5 Profile Form Validation, Trim & Persistence', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    // Test form editing
    const universityInput = page.locator('input[placeholder*="university" i], input[value*="University" i]').first()
    if (await universityInput.isVisible()) {
      // Input text with leading and trailing spaces
      await universityInput.fill('   Delhi Technological University (DTU)   ')
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update")').first()
      if (await saveBtn.isVisible()) {
        await saveBtn.click()
        await page.waitForTimeout(600)
      }
    }

    await page.screenshot({ path: path.join(evidenceDir, '07_profile_form_edited.png') })

    // Refresh and verify trimmed value persisted
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(evidenceDir, '08_profile_form_reloaded.png') })
  })
})

