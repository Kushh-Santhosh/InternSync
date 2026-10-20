import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'

const PROD_BASE_URL = 'https://intern-sync-one.vercel.app'

test.describe('Live Opportunity Search & Service State Inspection', () => {
  const timestamp = Date.now()
  const testEmail = `live.search.${timestamp}@internsync.io`
  const testPassword = process.env.TEST_PASSWORD || `Search_${Math.random().toString(36).slice(2, 10)}!Aa1`
  let testUserId = ''
  let adminClient: any = null

  const evidenceDir = path.resolve(process.cwd(), 'test-evidence', 'live-search-inspection')

  test.beforeAll(async () => {
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true })
    }

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kkgnhoflqusupqnhgzkz.supabase.co'
    try {
      let serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
      if (!serviceKey) {
        try {
          const rawKeys = execSync('supabase projects api-keys --project-ref kkgnhoflqusupqnhgzkz --reveal --output json', {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore'],
          })
          const keys = JSON.parse(rawKeys)
          serviceKey = keys.find((k: any) => k.name.includes('service_role') || k.name.includes('secret'))?.api_key
        } catch {}
      }
      if (serviceKey) {
        adminClient = createClient(SUPABASE_URL, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      }
    } catch (err) {
      console.warn('[Setup Warning] Unable to initialize Supabase admin client:', err)
    }

    const { data: userRecord, error: createErr } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Kushal Santhosh P',
        name: 'Kushal Santhosh P',
      },
    })
    if (createErr || !userRecord.user) {
      throw new Error(`Failed to create test user: ${createErr?.message}`)
    }
    testUserId = userRecord.user.id
  })

  test.afterAll(async () => {
    if (adminClient && testUserId) {
      await adminClient.auth.admin.deleteUser(testUserId)
    }
  })

  test('Signs in, triggers live search, and verifies genuine network request/response and honest UI state', async ({ page }) => {
    // Track network request to /api/search/live
    let capturedSearchRequest: any = null
    let capturedSearchResponse: any = null

    page.on('request', (req) => {
      if (req.url().includes('/api/search/live')) {
        capturedSearchRequest = {
          url: req.url(),
          method: req.method(),
          postData: req.postData(),
        }
      }
    })

    page.on('response', async (res) => {
      if (res.url().includes('/api/search/live')) {
        try {
          const body = await res.json().catch(() => null)
          capturedSearchResponse = {
            status: res.status(),
            body,
          }
        } catch {
          // Response body stream closed
        }
      }
    })

    // 1. Sign in
    await page.goto(`${PROD_BASE_URL}/login`, { waitUntil: 'networkidle' })
    await page.fill('input[placeholder="name@university.edu"]', testEmail)
    await page.fill('input[placeholder="••••••••"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 20000 })

    // 2. Navigate to Opportunities
    await page.goto(`${PROD_BASE_URL}/opportunities`, { waitUntil: 'networkidle' })
    await page.screenshot({ path: path.join(evidenceDir, '01_opportunities_initial.png') })

    // 3. Trigger live search
    const searchBtn = page.getByRole('button', { name: /find internships for me/i }).first()
    if (await searchBtn.isVisible()) {
      await searchBtn.click()
    } else {
      const liveBtn = page.getByRole('button', { name: /live discovery|search live|find internships/i }).first()
      await liveBtn.click()
    }

    // Wait for the network request to finish
    await page.waitForTimeout(4000)
    await page.screenshot({ path: path.join(evidenceDir, '02_after_search_triggered.png') })

    console.log('[Live Network Inspection] Captured Request:', capturedSearchRequest)
    console.log('[Live Network Inspection] Captured Response:', capturedSearchResponse)

    expect(capturedSearchRequest).not.toBeNull()
    expect(capturedSearchResponse).not.toBeNull()

    // Assert that the request contains the proper query payload
    const parsedPayload = JSON.parse(capturedSearchRequest.postData)
    expect(parsedPayload.query).toBeTruthy()
    expect(typeof (parsedPayload.query.text || parsedPayload.query)).toBe('string')

    // Inspect the actual response status and verify honest UI notice
    if (capturedSearchResponse.status === 200) {
      console.log(`[Live Discovery] SUCCESS: Retrieved ${capturedSearchResponse.body.results?.length} genuine live listings!`)
      if (capturedSearchResponse.body.results?.length > 0) {
        const first = capturedSearchResponse.body.results[0]
        console.log(`[Live Discovery] Sample listing: "${first.title}" @ ${first.company} -> URL: ${first.url}`)
        expect(first.url).toMatch(/^https?:\/\//)
      }
    } else if (capturedSearchResponse.status === 503) {
      console.log('[Live Discovery] Truthful SEARCH_NOT_CONFIGURED response received:', capturedSearchResponse.body)
      expect(capturedSearchResponse.body.code).toBe('SEARCH_NOT_CONFIGURED')
      // Assert that UI displays honest alert and not endless spinner
      await expect(page.getByText(/live search notice/i)).toBeVisible({ timeout: 5000 })
      await expect(page.getByText(/OPENROUTER_API_KEY/i)).toBeVisible({ timeout: 5000 })
    } else if (capturedSearchResponse.status === 402) {
      console.log('[Live Discovery] Truthful PROVIDER_CREDITS_EXHAUSTED response received:', capturedSearchResponse.body)
      expect(capturedSearchResponse.body.code).toBe('PROVIDER_CREDITS_EXHAUSTED')
      await expect(page.getByText(/live search notice/i)).toBeVisible({ timeout: 5000 })
    }
  })
})
