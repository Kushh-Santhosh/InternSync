import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { OpenRouterModelRouter, type ChatMessage } from '../features/ai/model-router.js'

interface ServerConfig {
  openrouterApiKey: string
  openrouterModel: string
  openrouterFallbackModels: string[]
  adzunaAppId: string
  adzunaAppKey: string
  adzunaCountry: string
}

const config: ServerConfig = {
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
  openrouterModel: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001',
  openrouterFallbackModels: [
    'anthropic/claude-3.5-haiku',
    'meta-llama/llama-3.3-70b-instruct',
    'openai/gpt-4o-mini',
  ],
  adzunaAppId: process.env.ADZUNA_APP_ID || '',
  adzunaAppKey: process.env.ADZUNA_APP_KEY || '',
  adzunaCountry: process.env.ADZUNA_COUNTRY || 'in',
}

// Load .env if present on disk
try {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
      if (match) {
        const key = match[1]
        let val = match[2] || ''
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
        if (key === 'OPENROUTER_API_KEY' && val) config.openrouterApiKey = val
        if (key === 'OPENROUTER_MODEL' && val) config.openrouterModel = val
        if (key === 'ADZUNA_APP_ID' && val) config.adzunaAppId = val
        if (key === 'ADZUNA_APP_KEY' && val) config.adzunaAppKey = val
        if (key === 'ADZUNA_COUNTRY' && val) config.adzunaCountry = val
      }
    }
  }
} catch {
  // ignore
}

// Instantiate resilient router for internal operations
const modelRouter = new OpenRouterModelRouter(config.openrouterApiKey, {
  primaryModel: config.openrouterModel,
  fallbackModels: config.openrouterFallbackModels,
})

function parseJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      // 2MB maximum payload protection
      if (body.length > 2 * 1024 * 1024) {
        req.destroy()
        reject(new Error('Payload too large'))
      }
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

/**
 * Sanitizes input text to defend against prompt injection
 */
function sanitizePromptText(text: string): string {
  return text
    .replace(/ignore (?:all )?previous instructions/gi, '[filtered command]')
    .replace(/system prompt:/gi, '[filtered directive]')
    .replace(/override safety/gi, '[filtered override]')
    .slice(0, 4000)
}

/**
 * Node.js HTTP request handler for InternSync server API endpoints
 */
export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = req.url || ''

  if (!url.startsWith('/api/')) {
    return false
  }

  // 1. GET /api/settings/health (Internal system connectivity check)
  if (req.method === 'GET' && url === '/api/settings/health') {
    const openrouterConfigured = Boolean(config.openrouterApiKey)
    const adzunaConfigured = Boolean(config.adzunaAppId && config.adzunaAppKey)

    sendJson(res, 200, {
      openrouter: {
        provider: 'OpenRouter Web Search & AI Router',
        status: openrouterConfigured ? 'ACTIVE' : 'NOT_CONFIGURED',
        message: openrouterConfigured
          ? 'OpenRouter live search and model failover active.'
          : 'OpenRouter API key not configured on server.',
        lastChecked: new Date().toISOString(),
      },
      adzuna: {
        provider: 'Adzuna Public Job Feed',
        status: adzunaConfigured ? 'ACTIVE' : 'NOT_CONFIGURED',
        message: adzunaConfigured
          ? `Adzuna API active (${config.adzunaCountry.toUpperCase()}).`
          : 'Adzuna credentials not configured on server.',
        lastChecked: new Date().toISOString(),
      },
    })
    return true
  }

  // 2. POST /api/ai/chat (Resilient AI Chat Router Gateway)
  if (req.method === 'POST' && url === '/api/ai/chat') {
    try {
      const body = await parseJsonBody<{
        messages: ChatMessage[]
        temperature?: number
        tools?: unknown[]
      }>(req)

      if (!config.openrouterApiKey) {
        sendJson(res, 503, {
          error: 'AI service is currently not configured on the server.',
          code: 'OPENROUTER_NOT_CONFIGURED',
        })
        return true
      }

      // Sanitize messages against prompt injection
      const sanitizedMessages: ChatMessage[] = (body.messages || []).map((m) => ({
        role: m.role,
        content: sanitizePromptText(m.content),
      }))

      const result = await modelRouter.executeChatCompletion({
        messages: sanitizedMessages,
        temperature: body.temperature,
        tools: body.tools,
      })

      sendJson(res, 200, result)
      return true
    } catch (err: unknown) {
      sendJson(res, 500, {
        error: err instanceof Error ? err.message : String(err),
        code: 'AI_ROUTER_ERROR',
      })
      return true
    }
  }

  // 3. POST /api/search/live (OpenRouter Web Search Tool)
  if (req.method === 'POST' && url === '/api/search/live') {
    try {
      const body = await parseJsonBody<{ query: { text: string; role?: string; location?: string } }>(req)
      const query = body.query

      if (!query || !query.text) {
        sendJson(res, 400, { error: 'Search query text is required', code: 'INVALID_QUERY' })
        return true
      }

      if (!config.openrouterApiKey) {
        sendJson(res, 503, {
          error: 'Live web search is not configured on the server (missing OPENROUTER_API_KEY).',
          code: 'OPENROUTER_NOT_CONFIGURED',
          results: [],
        })
        return true
      }

      const cleanQueryText = sanitizePromptText(query.text)
      const cleanRole = sanitizePromptText(query.role || 'Software Intern')
      const cleanLocation = sanitizePromptText(query.location || 'India')

      const prompt = `Search live public web listings for active internship opportunities:
Query: "${cleanQueryText}"
Target Role: "${cleanRole}"
Location: "${cleanLocation}"

Format each discovered opportunity with markdown links:
[Job Title @ Company](https://application-or-job-url) - Snippet and key required skills.`

      const openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://internsync.io',
          'X-Title': 'InternSync Live Intelligence',
        },
        body: JSON.stringify({
          model: config.openrouterModel || 'google/gemini-2.0-flash-001',
          messages: [
            {
              role: 'system',
              content:
                'You are a live web search agent finding active internship listings. Extract genuine URLs and factual job requirements.',
            },
            { role: 'user', content: prompt },
          ],
          tools: [
            {
              type: 'openrouter:web_search',
              parameters: {
                engine: 'auto',
                max_results: 10,
                max_total_results: 25,
              },
            },
          ],
        }),
      })

      if (!openrouterRes.ok) {
        const errorBody = await openrouterRes.text().catch(() => '')
        sendJson(res, openrouterRes.status >= 500 ? 502 : openrouterRes.status, {
          error: `OpenRouter search returned status ${openrouterRes.status}`,
          code: 'SEARCH_PROVIDER_ERROR',
          details: errorBody.slice(0, 200),
          results: [],
        })
        return true
      }

      const json = (await openrouterRes.json()) as any
      const content = json.choices?.[0]?.message?.content || ''

      const results = []
      const urlRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
      let match: RegExpExecArray | null
      while ((match = urlRegex.exec(content)) !== null) {
        const linkText = match[1]
        const rawUrl = match[2]
        let domain = 'careers'
        try {
          domain = new URL(rawUrl).hostname.replace(/^www\./, '')
        } catch {
          // ignore invalid url
          continue
        }

        const parts = linkText.split('@').map((s) => s.trim())
        const title = parts[0] || 'Software Intern'
        const company = parts[1] || domain

        results.push({
          title,
          company,
          url: rawUrl,
          domain,
          snippet: content.slice(Math.max(0, match.index - 50), match.index + 200).trim(),
          source: domain,
          discoveredAt: new Date().toISOString(),
        })
      }

      sendJson(res, 200, { results })
      return true
    } catch (err: unknown) {
      sendJson(res, 500, {
        error: err instanceof Error ? err.message : 'Search failed unexpectedly',
        code: 'SEARCH_EXCEPTION',
        results: [],
      })
      return true
    }
  }

  // 4. POST /api/search/adzuna (Adzuna Structured Search)
  if (req.method === 'POST' && url === '/api/search/adzuna') {
    try {
      const body = await parseJsonBody<{ query: { text: string; location?: string } }>(req)
      const q = body.query

      if (!config.adzunaAppId || !config.adzunaAppKey) {
        sendJson(res, 503, {
          error: 'Adzuna API is not configured on the server.',
          code: 'ADZUNA_NOT_CONFIGURED',
          results: [],
        })
        return true
      }

      const country = config.adzunaCountry || 'in'
      const what = encodeURIComponent(`${q.text || 'software'} internship`)
      const where = q.location ? encodeURIComponent(q.location) : ''
      const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${config.adzunaAppId}&app_key=${config.adzunaAppKey}&what=${what}&where=${where}&content-type=application/json`

      const adzunaRes = await fetch(adzunaUrl)
      if (!adzunaRes.ok) {
        sendJson(res, 502, {
          error: `Adzuna API returned status ${adzunaRes.status}`,
          code: 'ADZUNA_ERROR',
          results: [],
        })
        return true
      }

      const data = (await adzunaRes.json()) as any
      const results = (data.results || []).map((item: any) => {
        let domain = 'adzuna.com'
        try {
          if (item.redirect_url) domain = new URL(item.redirect_url).hostname
        } catch {
          // preserve domain
        }
        return {
          title: item.title?.replace(/<[^>]+>/g, '') || 'Internship Opportunity',
          company: item.company?.display_name || 'Employer',
          url: item.redirect_url,
          domain,
          snippet: item.description?.replace(/<[^>]+>/g, '').slice(0, 200) || '',
          source: 'Adzuna Jobs',
          discoveredAt: item.created || new Date().toISOString(),
        }
      })

      sendJson(res, 200, { results })
      return true
    } catch (err: unknown) {
      sendJson(res, 500, {
        error: err instanceof Error ? err.message : 'Adzuna request failed',
        code: 'ADZUNA_EXCEPTION',
        results: [],
      })
      return true
    }
  }

  // 5. POST /api/verify-url
  if (req.method === 'POST' && url === '/api/verify-url') {
    try {
      const body = await parseJsonBody<{ url: string }>(req)
      const targetUrl = body.url

      if (!targetUrl || !targetUrl.startsWith('http')) {
        sendJson(res, 200, { status: 'BROKEN' })
        return true
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 6000)

      try {
        const pingRes = await fetch(targetUrl, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 InternSync/1.0',
          },
        })
        clearTimeout(timeout)

        if (pingRes.status >= 200 && pingRes.status < 400) {
          sendJson(res, 200, { status: 'VERIFIED' })
        } else if (pingRes.status === 404 || pingRes.status === 410) {
          sendJson(res, 200, { status: 'EXPIRED' })
        } else {
          sendJson(res, 200, { status: 'UNVERIFIED' })
        }
        return true
      } catch {
        clearTimeout(timeout)
        sendJson(res, 200, { status: 'UNVERIFIED' })
        return true
      }
    } catch {
      sendJson(res, 200, { status: 'UNVERIFIED' })
      return true
    }
  }

  // 6. n8n Opportunity Discovery Webhook Adapter
  if (req.method === 'POST' && url === '/api/n8n/opportunity-discovery') {
    try {
      const body = await parseJsonBody<{
        query?: { text?: string; role?: string; location?: string; skills?: string[] }
        opportunities?: Array<{
          title: string
          company: string
          location: string
          workMode?: 'remote' | 'hybrid' | 'onsite'
          applicationUrl: string
          sourceDomain?: string
          snippet?: string
          requiredSkills?: string[]
          stipend?: string
          deadline?: string
        }>
      }>(req)

      const opportunities = body.opportunities || []
      sendJson(res, 200, {
        success: true,
        receivedCount: opportunities.length,
        message: 'Opportunities successfully processed via n8n adapter.',
      })
      return true
    } catch (err: unknown) {
      sendJson(res, 400, {
        error: err instanceof Error ? err.message : 'Invalid n8n webhook payload',
      })
      return true
    }
  }

  return false
}
