import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

test.describe.serial('QA Suite 2 — Route Inventory, Button Interaction & Responsive Audits', () => {
  const evidenceDir = path.resolve(process.cwd(), 'test-evidence', 'exhaustive-qa', 'suite-2-pages')

  test.beforeAll(async () => {
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true })
    }
  })

  test('2.1 Explore Public Routes (Landing, Legal & Auth)', async ({ page }) => {
    // 1. Landing Page
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/From Apply Everywhere to|Know Where You Fit/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '01_landing_page_desktop.png') })

    // 2. Privacy Policy
    await page.goto('/privacy')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Privacy Policy|Data Protection/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '02_privacy_page.png') })

    // 3. Terms of Service
    await page.goto('/terms')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Terms of Service|Terms of Use/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '03_terms_page.png') })

    // 4. Signup Page
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Build your Career DNA|Create account/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '04_signup_page.png') })

    // 5. 404 Not Found Page
    await page.goto('/some-nonexistent-route-for-qa-test')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Page not found|404/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '05_404_not_found_page.png') })
  })

  test('2.2 Explore Core Application Pages with Interactive Demo Mode', async ({ page }) => {
    // Activate demo session
    await page.goto('/login')
    const demoBtn = page.locator('button:has-text("Explore Interactive Demo"), button:has-text("Demo Mode")').first()
    await demoBtn.click()
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // 1. Dashboard Page
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '06_dashboard_page.png') })

    // 2. Career DNA Page
    await page.goto('/career-dna')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Career DNA|Core Skills/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '07_career_dna_page.png') })

    // 3. Opportunities Directory
    await page.goto('/opportunities')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Best Internships For You|Opportunity Readiness/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '08_opportunities_page.png') })

    // 4. Opportunity Detail Page (HackerRank SDE Intern)
    await page.goto('/opportunities/b1382314-4ffe-5ad5-b46b-33fe0a18f2ba')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Software Development Engineer Intern/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '09_opportunity_detail_tab1.png') })

    // Test Tabs on Opportunity Detail
    const matchBreakdownTab = page.locator('button:has-text("Match Breakdown"), button:has-text("8-Dimension")').first()
    if (await matchBreakdownTab.isVisible()) {
      await matchBreakdownTab.click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: path.join(evidenceDir, '10_opportunity_detail_tab2.png') })
    }

    const roadmapTab = page.locator('button:has-text("14-Day Roadmap"), button:has-text("Preparation Sprint")').first()
    if (await roadmapTab.isVisible()) {
      await roadmapTab.click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: path.join(evidenceDir, '11_opportunity_detail_tab3_roadmap.png') })
    }

    // 5. Skill Lab Page
    await page.goto('/skill-lab')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Skill Lab|Assessments/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '12_skill_lab_page.png') })

    // 6. Career Paths Page
    await page.goto('/career-paths')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Career Paths|Recommended Trajectories/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '13_career_paths_page.png') })

    // 7. Dream Role Simulator Page
    await page.goto('/dream-internship')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Dream Role|Target Internship/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '14_dream_internship_page.png') })

    // 8. Applications Tracker Kanban Page
    await page.goto('/applications')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Applications|Pipeline|Kanban/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '15_applications_page.png') })

    // 9. Career Assistant Page
    await page.goto('/assistant')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Assistant|Career Copilot/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '16_career_assistant_page.png') })

    // 10. Profile Review & Edit Page
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Profile|Academic Standing/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '17_profile_page.png') })

    // 11. Settings Page
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Settings|API Keys|Integrations/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '18_settings_page.png') })
  })

  test('2.3 Interactive Button Clicks & Filters in Opportunities Page', async ({ page }) => {
    await page.goto('/login')
    await page.locator('button:has-text("Explore Interactive Demo"), button:has-text("Demo Mode")').first().click()
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    await page.goto('/opportunities')
    await page.waitForLoadState('networkidle')

    // 1. Search Bar Input
    const searchInput = page.locator('input[placeholder*="Search by role" i]').first()
    await expect(searchInput).toBeVisible()
    await searchInput.fill('Python')
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(evidenceDir, '19_search_filter_python.png') })
    await searchInput.clear()
    await page.waitForTimeout(300)

    // 2. Filter Buttons: Apply Now / Prepare First / All
    const applyNowFilter = page.locator('button:has-text("Apply Now")').first()
    if (await applyNowFilter.isVisible()) {
      await applyNowFilter.click()
      await page.waitForTimeout(400)
      await page.screenshot({ path: path.join(evidenceDir, '20_filter_apply_now.png') })
    }

    const allFilter = page.locator('button:has-text("All Opportunities")').first()
    if (await allFilter.isVisible()) {
      await allFilter.click()
      await page.waitForTimeout(300)
    }

    // 3. Work Mode Select Filter
    const modeSelect = page.locator('select').nth(1)
    if (await modeSelect.isVisible()) {
      await modeSelect.selectOption({ label: 'Remote' }).catch(() => {})
      await page.waitForTimeout(300)
      await page.screenshot({ path: path.join(evidenceDir, '21_work_mode_filter_remote.png') })
      await modeSelect.selectOption({ index: 0 }).catch(() => {})
    }

    // 4. Sort Combobox
    const sortSelect = page.locator('select').nth(2)
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption({ label: 'Highest Match Score' }).catch(() => {})
      await page.waitForTimeout(300)
    }

    // 5. Preferences Modal Button
    const prefBtn = page.locator('button:has-text("Preferences")').first()
    if (await prefBtn.isVisible()) {
      await prefBtn.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: path.join(evidenceDir, '22_preferences_modal.png') })
      // Close modal
      const closeBtn = page.locator('button:has(svg.lucide-x), button:has-text("Cancel"), button:has-text("Close")').first()
      if (await closeBtn.isVisible()) await closeBtn.click()
      await page.waitForTimeout(300)
    }
  })

  test('2.4 Responsive Layout Inspection (Desktop, Laptop, Tablet, Mobile)', async ({ page }) => {
    // 1. Desktop: 1920x1080
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(evidenceDir, '23_viewport_1920x1080_desktop.png') })

    // 2. Laptop: 1366x768
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(evidenceDir, '24_viewport_1366x768_laptop.png') })

    // 3. Tablet: 768x1024
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(evidenceDir, '25_viewport_768x1024_tablet.png') })

    // 4. Mobile: 390x844 (iPhone 12/13/14 portrait)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(evidenceDir, '26_viewport_390x844_mobile.png') })

    // Check Mobile Navigation / Drawer toggle
    const mobileMenuTrigger = page.locator('button[aria-label*="menu" i], button:has(svg.lucide-menu)').first()
    if (await mobileMenuTrigger.isVisible()) {
      await mobileMenuTrigger.click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: path.join(evidenceDir, '27_mobile_drawer_open.png') })
    }
  })
})

