import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

test.describe.serial('SaarthiX Smart Internship Matcher — Real Chrome Browser Product Walkthrough', () => {
  const evidenceDir = path.resolve(process.cwd(), 'test-evidence', 'live-browser-acceptance')

  test.beforeAll(() => {
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true })
    }
  })

  test('Complete End-to-End User Journey with Real Resume & Chrome Automation', async ({ page }) => {
    test.setTimeout(120000)

    console.log('--- Step 1: Navigating to Landing Page ---')
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /From Apply Everywhere to/i })).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '01_landing_page.png') })

    // Locate the real student resume in fixtures
    const resumePath = path.resolve(process.cwd(), 'fixtures', 'rahul_sharma_real_resume.pdf')
    expect(fs.existsSync(resumePath)).toBe(true)

    console.log('--- Step 2: Uploading Real Student Resume via UI Dropzone ---')
    // Set file input on the landing page hero upload card
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(resumePath)

    // Wait for the processing steps or redirection to opportunities
    console.log('--- Step 3: Waiting for AI Document Processing & Opportunity Matching ---')
    await page.waitForURL('**/opportunities', { timeout: 60000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '02_opportunities_after_upload.png') })

    // Verify opportunities loaded
    const viewButtons = page.locator('button:has-text("View opportunity")')
    await expect(viewButtons.first()).toBeVisible({ timeout: 10000 })
    const cardCount = await viewButtons.count()
    console.log(`Discovered & displayed ${cardCount} matched opportunities`)
    expect(cardCount).toBeGreaterThan(0)

    console.log('--- Step 4: Inspecting Career DNA for Extracted Resume Fields ---')
    await page.goto('/career-dna')
    await page.waitForURL('**/career-dna')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '03_career_dna_extracted_profile.png') })

    // Verify extracted profile elements
    const bodyText = (await page.textContent('body')) || ''
    expect(bodyText).toContain('Rahul Sharma')
    expect(bodyText).toMatch(/PES University|Delhi Technological University|University/i)
    expect(bodyText).toMatch(/B\.Tech|Computer Science/i)

    // Verify extracted Work Experience section
    const expHeading = page.getByRole('heading', { name: /Professional & Internship Experience/i })
    await expect(expHeading).toBeVisible()
    expect(bodyText).toMatch(/TechCorp Solutions|TechNova Solutions|Web Development Intern|Software Engineering Intern/i)

    // Verify extracted Certifications section
    const certHeading = page.getByRole('heading', { name: /Certifications & (?:Verified )?Credentials/i })
    await expect(certHeading).toBeVisible()
    expect(bodyText).toMatch(/AWS Certified Cloud Practitioner/i)

    console.log('--- Step 5: Reviewing & Verifying Profile in Profile Workspace ---')
    await page.goto('/profile')
    await page.waitForURL('**/profile')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '04_profile_review_workspace.png') })

    // Verify profile inputs contain extracted data
    const fullNameInput = page.locator('label:has-text("Full Name") + input')
    await expect(fullNameInput).toHaveValue(/Rahul Sharma/i)
    const uniInput = page.locator('label:has-text("University") + input')
    await expect(uniInput).toHaveValue(/PES University|Delhi Technological University/i)

    console.log('--- Step 6: Testing Detailed Opportunity Fit & 3-Category Skill Gap Analysis ---')
    await page.goto('/opportunities')
    await page.waitForURL('**/opportunities')
    await page.waitForTimeout(800)

    // Click on the first opportunity card to view detailed match breakdown
    const firstViewBtn = page.locator('button:has-text("View opportunity")').first()
    await firstViewBtn.click()
    await page.waitForURL(/\/opportunities\//, { timeout: 10000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '05_opportunity_fit_details.png') })

    // Verify 8-Dimension Fit Dimensions card
    await expect(page.getByText(/Deterministic Fit Dimensions/i)).toBeVisible()
    await expect(page.getByText(/Skills \(30%\)/i)).toBeVisible()
    await expect(page.getByText(/Eligibility \(20%\)/i)).toBeVisible()
    await expect(page.getByText(/Projects \(15%\)/i)).toBeVisible()
    await expect(page.getByText(/Experience \(10%\)/i)).toBeVisible()

    // Verify 3-Category Skill Gap Analysis
    await expect(page.getByText(/Three-Category Skill Gap Analysis/i)).toBeVisible()
    await expect(page.getByText(/1\. Already Satisfied/i)).toBeVisible()
    await expect(page.getByText(/2\. Needs Improvement/i)).toBeVisible()
    await expect(page.getByText(/3\. Missing Requirements/i)).toBeVisible()

    // Verify Hard Eligibility Gate
    await expect(page.getByText(/Hard Eligibility Gate/i)).toBeVisible()

    console.log('--- Step 7: Testing 14-Day Preparation Sprint with Genuine Learning URLs ---')
    // Click on "14-Day Preparation Sprint" tab
    await page.click('button:has-text("14-Day Preparation Sprint")')
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(evidenceDir, '06_14_day_roadmap_sprint.png') })

    // Verify sprint progress bar and daily timeline
    await expect(page.getByText(/Targeted Preparation Sprint/i)).toBeVisible()
    await expect(page.getByText(/Sprint Completion:/i)).toBeVisible()

    // Verify Day 1 details
    await expect(page.locator('text=D1').first()).toBeVisible()
    await expect(page.getByText(/🎯 Expected Outcome:/i).first()).toBeVisible()

    // Verify real learning resources with external link icon
    const resourceLinks = page.locator('a:has-text("Documentation"), a:has-text("Tutorial"), a:has-text("Guide"), a:has-text("Reference")')
    const resCount = await resourceLinks.count()
    console.log(`Found ${resCount} verified learning resource links in roadmap`)
    expect(resCount).toBeGreaterThan(0)

    // Test interactive completion toggle
    const day1Checkbox = page.locator('input[id^="day-checkbox-"]').first()
    await day1Checkbox.click()
    await page.waitForTimeout(300)
    // Check that sprint completion updated
    await expect(page.getByText(/Sprint Completion: 1 of 14 Days Completed/i)).toBeVisible()

    console.log('--- Step 8: Saving Opportunity to Pipeline & Marking as Applied ---')
    // Click "Save to Pipeline"
    await page.click('button:has-text("Save to Pipeline")')
    await page.waitForURL('**/applications', { timeout: 10000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '07_applications_pipeline_saved.png') })

    // Verify application item exists in tracker
    await expect(page.locator('main').getByText(/Saved/i).first()).toBeVisible()

    console.log('--- Step 9: Testing Side-by-Side Opportunity Comparison Modal ---')
    await page.goto('/opportunities')
    await page.waitForURL('**/opportunities')
    await page.waitForTimeout(500)

    // Toggle comparison on first two opportunities
    const compareButtons = page.locator('button:has-text("+ Compare")')
    const compareCount = await compareButtons.count()
    if (compareCount >= 2) {
      await compareButtons.nth(0).click()
      await page.waitForTimeout(300)
      await compareButtons.nth(1).click()
      await page.waitForTimeout(300)
    }

    // Open comparison modal via sticky comparison bar or URL query
    const openCompareBtn = page.locator('button:has-text("Compare (")').first()
    if (await openCompareBtn.isVisible()) {
      await openCompareBtn.click()
    } else {
      await page.goto('/opportunities?compare=true')
    }

    // Verify comparison modal details
    await expect(page.getByRole('heading', { name: /Side-by-Side Opportunity Comparison/i })).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(evidenceDir, '08_side_by_side_comparison_modal.png') })

    await expect(page.getByText(/Comparative Fit Synthesis/i)).toBeVisible()
    await expect(page.getByText(/Top Recommended Fit/i).first()).toBeVisible()
    await expect(page.getByText(/Skills Matched:/i).first()).toBeVisible()
    await expect(page.getByText(/Duration & Stipend:/i).first()).toBeVisible()

    console.log('--- Step 10: Verifying Session & Data Persistence Across Browser Reload ---')
    await page.reload()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(evidenceDir, '09_persisted_state_after_reload.png') })

    // Verify still authenticated/in demo session with opportunities
    await expect(page.locator('main').getByText(/Best Internships For You/i)).toBeVisible()

    console.log('=== Real Chrome Browser Product Walkthrough Completed Successfully ===')
  })
})
