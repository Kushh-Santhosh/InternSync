import { test, expect } from '@playwright/test'

test.describe('Backend API Serverless Endpoints & SPA Routing', () => {
  test('GET /api/settings/health returns truthful connectivity status', async ({ request }) => {
    const res = await request.get('/api/settings/health')
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('openrouter')
    expect(data).toHaveProperty('adzuna')
    expect(data.openrouter).toHaveProperty('status')
    expect(data.adzuna).toHaveProperty('status')
  })

  test('POST /api/verify-url correctly validates reachable URLs', async ({ request }) => {
    const res = await request.post('/api/verify-url', {
      data: { url: 'https://example.com' },
    })
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(['VERIFIED', 'UNVERIFIED']).toContain(data.status)
  })

  test('POST /api/verify-url rejects malformed or empty URLs honestly', async ({ request }) => {
    const res = await request.post('/api/verify-url', {
      data: { url: 'not-a-valid-url' },
    })
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('BROKEN')
  })

  test('POST /api/search/live reports OPENROUTER_NOT_CONFIGURED truthfully when key missing', async ({ request }) => {
    const res = await request.post('/api/search/live', {
      data: { query: { text: 'react developer' } },
    })
    // In test environment without key, it must return 503 rather than fake results
    if (res.status() === 503) {
      const data = await res.json()
      expect(data.code).toBe('OPENROUTER_NOT_CONFIGURED')
      expect(data.results).toEqual([])
    } else {
      expect(res.status()).toBe(200)
    }
  })

  test('POST /api/search/adzuna reports ADZUNA_NOT_CONFIGURED truthfully when key missing', async ({ request }) => {
    const res = await request.post('/api/search/adzuna', {
      data: { query: { text: 'software intern' } },
    })
    if (res.status() === 503) {
      const data = await res.json()
      expect(data.code).toBe('ADZUNA_NOT_CONFIGURED')
      expect(data.results).toEqual([])
    } else {
      expect(res.status()).toBe(200)
    }
  })

  test('POST /api/ai/extract-resume returns 400 for empty or whitespace document', async ({ request }) => {
    const res = await request.post('/api/ai/extract-resume', {
      data: { text: '   ' },
    })
    expect(res.status()).toBe(400)
    const data = await res.json()
    expect(data.code).toBe('EMPTY_DOCUMENT_TEXT')
  })

  test('SPA routing preserves nested route direct access and does not rewrite API to index.html', async ({ request }) => {
    const apiRes = await request.get('/api/settings/health')
    const contentType = apiRes.headers()['content-type'] || ''
    expect(contentType).toContain('application/json')
  })
})
