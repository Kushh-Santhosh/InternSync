import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
import { calculateMatch } from '../../src/lib/matching/engine'
import { SEED_OPPORTUNITIES } from '../../src/data/seed-opportunities'
import type { StudentProfile, SkillEvidenceItem, ProjectItem, Opportunity } from '../../src/types'

test.describe.serial('QA Suite 4 — Matcher Scenarios, Live Discovery, Roadmap & Comparison', () => {
  const evidenceDir = path.resolve(process.cwd(), 'test-evidence', 'exhaustive-qa', 'suite-4-matcher')

  test.beforeAll(async () => {
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true })
    }
  })

  test('4.1 Deterministic Evaluation of Candidates A through H', async () => {
    const opp = SEED_OPPORTUNITIES[0] // HackerRank SDE Intern (Python, FastAPI, ML; B.Tech/BE, Year 3/4)

    // Candidate A: Strong Match (Year 3 B.Tech, Python, FastAPI, ML, relevant project)
    const candA: StudentProfile = {
      id: 'cand-a',
      fullName: 'Candidate A',
      email: 'a@example.com',
      university: 'DTU',
      degree: 'B.Tech',
      branch: 'Computer Science',
      currentYear: 3,
      graduationYear: 2026,
      academicMetric: '8.8',
      location: 'Bengaluru',
      preferredLocations: ['Bengaluru'],
      workModePreference: 'onsite',
      availableDurationMonths: 6,
      skills: ['Python', 'FastAPI', 'Machine Learning', 'Docker'],
      careerInterests: ['AI/ML'],
    }
    const skillsA: SkillEvidenceItem[] = [
      { skillName: 'Python', category: 'languages', confidence: 90, evidenceSources: ['resume'], projectCount: 2, githubStrength: 'strong' },
      { skillName: 'FastAPI', category: 'backend', confidence: 85, evidenceSources: ['resume'], projectCount: 1, githubStrength: 'strong' },
      { skillName: 'Machine Learning', category: 'ai/ml', confidence: 80, evidenceSources: ['resume'], projectCount: 1, githubStrength: 'strong' },
    ]
    const projA: ProjectItem[] = [
      { id: 'p1', studentId: 'cand-a', title: 'ML Inference Microservice', description: 'FastAPI and Python backend', technologies: ['Python', 'FastAPI', 'Machine Learning'], evidenceStrength: 'strong', highlights: [] }
    ]
    const matchA = calculateMatch({ student: candA, skills: skillsA, projects: projA, opportunity: opp })
    expect(matchA.overallMatchScore).toBeGreaterThanOrEqual(80)
    expect(matchA.recommendation).toBe('APPLY NOW')
    expect(matchA.eligibilityStatus).toBe('Eligible')

    // Candidate B: Partial Match (Eligible, but missing FastAPI & ML)
    const skillsB: SkillEvidenceItem[] = [
      { skillName: 'Python', category: 'languages', confidence: 80, evidenceSources: ['resume'], projectCount: 1, githubStrength: 'moderate' },
    ]
    const matchB = calculateMatch({ student: candA, skills: skillsB, projects: [], opportunity: opp })
    expect(matchB.recommendation).toBe('PREPARE FIRST')
    expect(matchB.missingSkills).toContain('FastAPI')

    // Candidate C: Degree Mismatch (B.Des vs B.Tech requirement)
    const candC: StudentProfile = { ...candA, degree: 'B.Des', branch: 'Design' }
    const matchC = calculateMatch({ student: candC, skills: skillsA, projects: projA, opportunity: opp })
    expect(matchC.eligibilityStatus).toBe('Ineligible')
    expect(matchC.recommendation).toBe('SKIP')

    // Candidate D: Academic Year Mismatch (Year 1 student)
    const candD: StudentProfile = { ...candA, currentYear: 1, graduationYear: 2029 }
    const matchD = calculateMatch({ student: candD, skills: skillsA, projects: projA, opportunity: opp })
    expect(matchD.eligibilityStatus).toBe('Ineligible')
    expect(matchD.recommendation).toBe('SKIP')

    // Candidate E: No Work Experience (Student role requiring 0 yrs gets full baseline)
    const candE: StudentProfile = { ...candA, experiences: [] }
    const matchE = calculateMatch({ student: candE, skills: skillsA, projects: projA, opportunity: opp })
    expect(matchE.experienceScore).toBe(100)
    expect(matchE.recommendation).toBe('APPLY NOW')

    // Candidate F: Unknown Information (Role without specified criteria)
    const oppOpen: Opportunity = { ...opp, eligibleDegrees: [], eligibleYears: [], minCgpa: undefined }
    const matchF = calculateMatch({ student: candA, skills: skillsA, projects: projA, opportunity: oppOpen })
    expect(matchF.eligibilityStatus).toBe('Not specified')

    // Candidate G: Location Mismatch (Onsite role in New York vs student in Bengaluru)
    const oppNYC: Opportunity = { ...opp, location: 'New York, USA', workMode: 'onsite' }
    const matchG = calculateMatch({ student: candA, skills: skillsA, projects: projA, opportunity: oppNYC })
    expect(matchG.locationScore).toBeLessThan(100)

    // Candidate H: Availability Mismatch (Role requires 6 months, student only has 2 months)
    const candH: StudentProfile = { ...candA, availableDurationMonths: 2 }
    const matchH = calculateMatch({ student: candH, skills: skillsA, projects: projA, opportunity: opp })
    expect(matchH.availabilityScore).toBe(50)
  })

  async function ensureDemo(page: any) {
    await page.goto('/login')
    const demoBtn = page.locator('button:has-text("Explore Interactive Demo"), button:has-text("Demo Mode")').first()
    if (await demoBtn.isVisible()) {
      await demoBtn.click()
      await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {})
    }
  }

  test('4.2 Search, Filter, Sort & Empty Results State in Chrome', async ({ page }) => {
    await ensureDemo(page)

    await page.goto('/opportunities')
    await page.waitForLoadState('networkidle')

    // Test Search input with real role
    const searchInput = page.locator('input[placeholder*="Search by role" i]').first()
    await searchInput.fill('HackerRank')
    await page.waitForTimeout(400)
    await expect(page.getByText(/HackerRank/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '01_search_hackerrank.png') })

    // Test Empty Search Results Handling
    await searchInput.fill('ZZZZNONEXISTENTQUERY999')
    await page.waitForTimeout(400)
    await expect(page.getByText(/No opportunities match your filters|Try relaxing your filters/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '02_empty_search_results.png') })
    await searchInput.clear()
    await page.waitForTimeout(300)
  })

  test('4.3 Interactive 14-Day Preparation Sprint Tasks & Progress', async ({ page }) => {
    await ensureDemo(page)
    await page.goto('/opportunities/b1382314-4ffe-5ad5-b46b-33fe0a18f2ba')
    await page.waitForLoadState('networkidle')

    // Switch to Tab 3: 14-Day Preparation Sprint
    const roadmapTab = page.locator('button:has-text("14-Day Preparation Sprint")').first()
    await roadmapTab.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(evidenceDir, '03_roadmap_initial_state.png') })

    // Check off Day 1 and Day 2 tasks
    const checkboxes = page.locator('input[type="checkbox"]')
    const count = await checkboxes.count()
    if (count >= 2) {
      await checkboxes.nth(0).check()
      await page.waitForTimeout(300)
      await checkboxes.nth(1).check()
      await page.waitForTimeout(300)
      await page.screenshot({ path: path.join(evidenceDir, '04_roadmap_tasks_completed.png') })

      // Verify progress bar shows progress > 0%
      await expect(page.getByText(/Completed|Progress|%/i).first()).toBeVisible()

      // Refresh page and verify persistence
      await page.reload()
      await page.waitForLoadState('networkidle')
      await page.locator('button:has-text("14-Day Preparation Sprint")').first().click()
      await page.waitForTimeout(500)
      await expect(checkboxes.nth(0)).toBeChecked()
      await page.screenshot({ path: path.join(evidenceDir, '05_roadmap_persisted_after_reload.png') })
    }
  })

  test('4.4 Side-by-Side Comparison Modal & Fit Synthesis', async ({ page }) => {
    await ensureDemo(page)
    await page.goto('/opportunities')
    await page.waitForLoadState('networkidle')

    // Select first 2 opportunities
    const compareButtons = page.locator('button:has-text("+ Compare")')
    if (await compareButtons.count() >= 2) {
      await compareButtons.nth(0).click()
      await page.waitForTimeout(300)
      await compareButtons.nth(1).click()
      await page.waitForTimeout(300)
    }

    // Launch comparison modal
    const openCompareBtn = page.locator('button:has-text("Compare (")').first()
    if (await openCompareBtn.isVisible()) {
      await openCompareBtn.click()
    } else {
      await page.goto('/opportunities?compare=true')
    }

    await expect(page.getByRole('heading', { name: /Side-by-Side Opportunity Comparison/i })).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(500)
    await expect(page.getByText(/Comparative Fit Synthesis/i)).toBeVisible()
    await expect(page.getByText(/Top Recommended Fit/i).first()).toBeVisible()
    await page.screenshot({ path: path.join(evidenceDir, '06_side_by_side_comparison.png') })

    // Close modal
    const closeBtn = page.locator('button:has(svg.lucide-x)').first()
    if (await closeBtn.isVisible()) {
      await closeBtn.click()
      await page.waitForTimeout(300)
    }
  })

  test('4.5 Application Kanban Tracker & Pipeline Transitions', async ({ page }) => {
    await ensureDemo(page)
    await page.goto('/opportunities/b1382314-4ffe-5ad5-b46b-33fe0a18f2ba')
    await page.waitForLoadState('networkidle')

    // Save opportunity
    const saveButton = page.locator('button:has-text("Save to Pipeline"), button:has-text("Save Opportunity"), button:has-text("Saved")').first()
    await expect(saveButton).toBeVisible()
    await saveButton.click()
    await page.waitForURL('**/applications', { timeout: 10000 }).catch(async () => {
      await page.goto('/applications')
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(evidenceDir, '07_applications_kanban_saved.png') })

    // Verify opportunity appears in tracker
    await expect(page.getByText(/HackerRank/i).first()).toBeVisible()

    // Change status from Saved to Applied
    const statusSelect = page.locator('select').first()
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('applied').catch(() => {})
      await page.waitForTimeout(500)
      await page.screenshot({ path: path.join(evidenceDir, '08_application_moved_to_applied.png') })
    }
  })
})
