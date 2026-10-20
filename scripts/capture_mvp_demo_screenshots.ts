import { chromium } from 'playwright'
import * as path from 'path'
import * as fs from 'fs'

const PROD_URL = 'https://intern-sync-one.vercel.app'
const screenshotDir = path.resolve(process.cwd(), 'docs/submission/mvp-demo/screenshots')

async function run() {
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true })
  }

  console.log('Launching browser to capture high-resolution MVP demo screenshots...')
  const browser = await chromium.launch({ headless: true })

  // 1. Desktop Context (1920x1080, deviceScaleFactor: 2 for Retina sharpness)
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await desktopContext.newPage()

  try {
    // 1. Landing Hero
    console.log('Capturing Landing Page...')
    await page.goto(`${PROD_URL}/`, { waitUntil: 'networkidle' })
    await page.screenshot({ path: path.join(screenshotDir, '01_landing_hero.png'), fullPage: false })

    // Landing Features (scroll down)
    await page.evaluate(() => window.scrollBy(0, 900))
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(screenshotDir, '02_landing_features.png'), fullPage: false })

    // 2. Signup Page
    console.log('Capturing Signup Page...')
    await page.goto(`${PROD_URL}/signup`, { waitUntil: 'networkidle' })
    await page.screenshot({ path: path.join(screenshotDir, '03_signup_flow.png'), fullPage: false })

    // 3. Login Page
    console.log('Capturing Login Page...')
    await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle' })
    await page.screenshot({ path: path.join(screenshotDir, '04_login_screen.png'), fullPage: false })

    const demoPassword = process.env.DEMO_STUDENT_PASSWORD || `Demo_${Date.now().toString(36)}!Aa1`

    // 4. Authenticate as Priya Nair (Student 1 - Technical Track)
    console.log('Logging in as Priya Nair...')
    await page.fill('input[type="email"]', 'priya.nair.student@internsync.dev')
    await page.fill('input[type="password"]', demoPassword)
    await page.click('button[type="submit"]:has-text("Sign in")')
    await page.waitForURL('**/dashboard', { timeout: 15000 })
    await page.waitForTimeout(1000)

    console.log('Capturing Priya Dashboard...')
    await page.screenshot({ path: path.join(screenshotDir, '05_priya_dashboard.png'), fullPage: false })

    // 5. Priya Profile Settings
    console.log('Capturing Priya Profile Settings...')
    await page.goto(`${PROD_URL}/settings`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(screenshotDir, '06_priya_profile_settings.png'), fullPage: false })

    // 6. Priya Career DNA
    console.log('Capturing Priya Career DNA...')
    await page.goto(`${PROD_URL}/career-dna`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(screenshotDir, '07_priya_career_dna.png'), fullPage: false })

    // 7. Priya Skill Lab
    console.log('Capturing Priya Skill Lab...')
    await page.goto(`${PROD_URL}/skill-lab`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(screenshotDir, '08_priya_skill_lab.png'), fullPage: false })

    // 8. Live Opportunity Discovery
    console.log('Capturing Opportunities Page...')
    await page.goto(`${PROD_URL}/opportunities`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    const findBtn = page.locator('button:has-text("Find internships for me")')
    if (await findBtn.isVisible()) {
      await findBtn.click()
      await page.waitForTimeout(4000)
    }

    await page.screenshot({ path: path.join(screenshotDir, '09_live_opportunities_feed.png'), fullPage: false })

    // 9. Opportunity Detail
    console.log('Capturing Opportunity Detail...')
    const viewButtons = page.locator('button:has-text("View opportunity")')
    if (await viewButtons.count() > 0) {
      await viewButtons.first().click()
      await page.waitForURL('**/opportunities/**', { timeout: 8000 })
      await page.waitForTimeout(1000)
      await page.screenshot({ path: path.join(screenshotDir, '10_opportunity_detail_breakdown.png'), fullPage: false })

      // Bookmark it if possible
      const saveBtn = page.locator('button:has-text("Save Opportunity"), button:has-text("Saved")')
      if (await saveBtn.isVisible()) {
        const text = await saveBtn.textContent()
        if (text?.includes('Save Opportunity')) {
          await saveBtn.click()
          await page.waitForTimeout(800)
        }
      }
    }

    // 10. Applications Tracker
    console.log('Capturing Applications Tracker...')
    await page.goto(`${PROD_URL}/applications`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(screenshotDir, '11_applications_tracker_pipeline.png'), fullPage: false })

    // 11. Empty Search State (Test Honest Zero Results)
    console.log('Capturing Honest Empty State...')
    await page.goto(`${PROD_URL}/opportunities`, { waitUntil: 'networkidle' })
    const searchInput = page.locator('input[placeholder*="Search by title"], input[placeholder*="Search by company"], input[type="text"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('Quantum Submarine Astronaut 9999')
      await page.waitForTimeout(500)
      await page.screenshot({ path: path.join(screenshotDir, '17_honest_empty_search.png'), fullPage: false })
    }

    // 12. Sign out Priya
    console.log('Logging out Priya...')
    await page.goto(`${PROD_URL}/settings`, { waitUntil: 'networkidle' })
    const logoutBtn = page.locator('button:has-text("Sign Out"), button[data-testid="logout-button"]').first()
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click()
      await page.waitForTimeout(1000)
    } else {
      await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle' })
    }

    // 13. Login as Ananya Sen (Student 2 - Design Track)
    console.log('Logging in as Ananya Sen...')
    await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle' })
    await page.fill('input[type="email"]', 'ananya.design.student@internsync.dev')
    await page.fill('input[type="password"]', demoPassword)
    await page.click('button[type="submit"]:has-text("Sign in")')
    await page.waitForURL('**/dashboard', { timeout: 15000 })
    await page.waitForTimeout(1000)

    console.log('Capturing Ananya Dashboard...')
    await page.screenshot({ path: path.join(screenshotDir, '12_ananya_dashboard_design.png'), fullPage: false })

    // 14. Ananya Profile
    console.log('Capturing Ananya Profile...')
    await page.goto(`${PROD_URL}/settings`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(screenshotDir, '13_ananya_profile_design.png'), fullPage: false })

    // 15. Ananya Career DNA
    console.log('Capturing Ananya Career DNA...')
    await page.goto(`${PROD_URL}/career-dna`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(screenshotDir, '14_ananya_career_dna.png'), fullPage: false })

    // 16. Ananya Design Opportunities
    console.log('Capturing Ananya Opportunities...')
    await page.goto(`${PROD_URL}/opportunities`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    const findDesignBtn = page.locator('button:has-text("Find internships for me")')
    if (await findDesignBtn.isVisible()) {
      await findDesignBtn.click()
      await page.waitForTimeout(3000)
    }
    await page.screenshot({ path: path.join(screenshotDir, '15_ananya_design_opportunities.png'), fullPage: false })

  } catch (err) {
    console.error('Error during desktop captures:', err)
  } finally {
    await desktopContext.close()
  }

  // 2. Mobile Context (Pixel 5: 393x851, scaleFactor: 2)
  console.log('Capturing Mobile Viewports...')
  const mobileContext = await browser.newContext({
    viewport: { width: 393, height: 851 },
    deviceScaleFactor: 2,
    isMobile: true,
  })
  const mobilePage = await mobileContext.newPage()

  try {
    // Mobile Landing
    await mobilePage.goto(`${PROD_URL}/`, { waitUntil: 'networkidle' })
    await mobilePage.screenshot({ path: path.join(screenshotDir, '18_mobile_landing.png'), fullPage: false })

    // Mobile Login & Dashboard
    await mobilePage.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle' })
    await mobilePage.fill('input[type="email"]', 'priya.nair.student@internsync.dev')
    await mobilePage.fill('input[type="password"]', demoPassword)
    await mobilePage.click('button[type="submit"]:has-text("Sign in")')
    await mobilePage.waitForURL('**/dashboard', { timeout: 15000 })
    await mobilePage.waitForTimeout(1000)

    await mobilePage.screenshot({ path: path.join(screenshotDir, '19_mobile_dashboard.png'), fullPage: false })

    // Mobile Opportunities
    await mobilePage.goto(`${PROD_URL}/opportunities`, { waitUntil: 'networkidle' })
    await mobilePage.waitForTimeout(1000)
    await mobilePage.screenshot({ path: path.join(screenshotDir, '20_mobile_opportunities.png'), fullPage: false })

    // Mobile Detail
    const mobileViewBtn = mobilePage.locator('button:has-text("View opportunity")')
    if (await mobileViewBtn.count() > 0) {
      await mobileViewBtn.first().click()
      await mobilePage.waitForURL('**/opportunities/**', { timeout: 8000 })
      await mobilePage.waitForTimeout(1000)
      await mobilePage.screenshot({ path: path.join(screenshotDir, '21_mobile_detail.png'), fullPage: false })
    }

  } catch (err) {
    console.error('Error during mobile captures:', err)
  } finally {
    await mobileContext.close()
  }

  await browser.close()
  console.log('All high-resolution production screenshots captured successfully!')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
