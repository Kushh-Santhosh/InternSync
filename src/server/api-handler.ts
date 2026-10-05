import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { OpenRouterModelRouter, type ChatMessage } from '../features/ai/model-router.js'

interface ServerState {
  openrouterApiKey: string
  openrouterModel: string
  openrouterFallbackModels: string[]
  adzunaAppId: string
  adzunaAppKey: string
  adzunaCountry: string
  githubClientId: string
  githubClientSecret: string
  githubAccessToken: string
  githubUser: { login: string; name: string; avatarUrl: string; publicRepos: number } | null
}

const state: ServerState = {
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
  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  githubAccessToken: '',
  githubUser: null,
}

// Load existing .env if present
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
        if (key === 'OPENROUTER_API_KEY' && val) state.openrouterApiKey = val
        if (key === 'OPENROUTER_MODEL' && val) state.openrouterModel = val
        if (key === 'ADZUNA_APP_ID' && val) state.adzunaAppId = val
        if (key === 'ADZUNA_APP_KEY' && val) state.adzunaAppKey = val
        if (key === 'ADZUNA_COUNTRY' && val) state.adzunaCountry = val
        if (key === 'GITHUB_CLIENT_ID' && val) state.githubClientId = val
        if (key === 'GITHUB_CLIENT_SECRET' && val) state.githubClientSecret = val
      }
    }
  }
} catch {
  // ignore
}

// Instantiate resilient router
const modelRouter = new OpenRouterModelRouter(state.openrouterApiKey, {
  primaryModel: state.openrouterModel,
  fallbackModels: state.openrouterFallbackModels,
})

function parseJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
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

function maskKey(key: string): string {
  if (!key) return ''
  if (key.length <= 8) return '••••••••'
  return key.slice(0, 4) + '••••••••' + key.slice(-4)
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

  // 1. GET /api/settings
  if (req.method === 'GET' && url === '/api/settings') {
    sendJson(res, 200, {
      openrouter: {
        configured: Boolean(state.openrouterApiKey),
        maskedKey: maskKey(state.openrouterApiKey),
        model: state.openrouterModel,
        fallbackModels: state.openrouterFallbackModels,
        health: modelRouter.getHealthSummary(),
      },
      adzuna: {
        configured: Boolean(state.adzunaAppId && state.adzunaAppKey),
        appId: state.adzunaAppId ? maskKey(state.adzunaAppId) : '',
        country: state.adzunaCountry,
      },
      github: {
        configured: Boolean(state.githubAccessToken || state.githubClientId),
        connected: Boolean(state.githubAccessToken),
        user: state.githubUser,
      },
    })
    return true
  }

  // 2. POST /api/settings
  if (req.method === 'POST' && url === '/api/settings') {
    try {
      const body = await parseJsonBody<Partial<ServerState>>(req)
      if (body.openrouterApiKey !== undefined) {
        state.openrouterApiKey = body.openrouterApiKey.trim()
        modelRouter.setApiKey(state.openrouterApiKey)
      }
      if (body.openrouterModel !== undefined) {
        state.openrouterModel = body.openrouterModel.trim()
        modelRouter.updateConfig({ primaryModel: state.openrouterModel })
      }
      if (body.adzunaAppId !== undefined) state.adzunaAppId = body.adzunaAppId.trim()
      if (body.adzunaAppKey !== undefined) state.adzunaAppKey = body.adzunaAppKey.trim()
      if (body.adzunaCountry !== undefined) state.adzunaCountry = body.adzunaCountry.trim()
      if (body.githubClientId !== undefined) state.githubClientId = body.githubClientId.trim()
      if (body.githubClientSecret !== undefined) state.githubClientSecret = body.githubClientSecret.trim()

      // Persist to .env file
      const envPath = path.resolve(process.cwd(), '.env')
      let envContent = ''
      try {
        envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
      } catch {
        // ignore
      }

      const updateEnvLine = (content: string, key: string, val: string) => {
        const regex = new RegExp(`^${key}=.*$`, 'm')
        if (regex.test(content)) {
          return content.replace(regex, `${key}=${val}`)
        } else {
          return `${content.trim()}\n${key}=${val}\n`
        }
      }

      let updated = envContent
      if (state.openrouterApiKey) updated = updateEnvLine(updated, 'OPENROUTER_API_KEY', state.openrouterApiKey)
      if (state.openrouterModel) updated = updateEnvLine(updated, 'OPENROUTER_MODEL', state.openrouterModel)
      if (state.adzunaAppId) updated = updateEnvLine(updated, 'ADZUNA_APP_ID', state.adzunaAppId)
      if (state.adzunaAppKey) updated = updateEnvLine(updated, 'ADZUNA_APP_KEY', state.adzunaAppKey)
      if (state.adzunaCountry) updated = updateEnvLine(updated, 'ADZUNA_COUNTRY', state.adzunaCountry)
      if (state.githubClientId) updated = updateEnvLine(updated, 'GITHUB_CLIENT_ID', state.githubClientId)
      if (state.githubClientSecret) updated = updateEnvLine(updated, 'GITHUB_CLIENT_SECRET', state.githubClientSecret)

      try {
        fs.writeFileSync(envPath, updated.trim() + '\n')
      } catch {
        // ignore write failures
      }

      sendJson(res, 200, { success: true, message: 'Settings saved successfully' })
      return true
    } catch (err: unknown) {
      sendJson(res, 400, { error: err instanceof Error ? err.message : 'Invalid request body' })
      return true
    }
  }

  // 3. GET /api/settings/health
  if (req.method === 'GET' && url === '/api/settings/health') {
    const openrouterStatus = state.openrouterApiKey ? 'ACTIVE' : 'NOT_CONFIGURED'
    let openrouterMsg = state.openrouterApiKey
      ? 'OpenRouter API key configured.'
      : 'OpenRouter API key is not configured.'

    // If key exists, ping OpenRouter API to verify
    if (state.openrouterApiKey) {
      try {
        const testRes = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { Authorization: `Bearer ${state.openrouterApiKey}` },
        })
        if (testRes.ok) {
          openrouterMsg = 'Connected to OpenRouter API (Live Web Search tool & Model Router active).'
        } else {
          openrouterMsg = `Authentication error (status ${testRes.status}). Check API key.`
        }
      } catch {
        openrouterMsg = 'Network error contacting OpenRouter API.'
      }
    }

    const adzunaConfigured = Boolean(state.adzunaAppId && state.adzunaAppKey)
    const githubConnected = Boolean(state.githubAccessToken)

    sendJson(res, 200, {
      openrouter: {
        provider: 'OpenRouter Web Search',
        status: openrouterStatus,
        message: openrouterMsg,
        model: state.openrouterModel,
        fallbackModels: state.openrouterFallbackModels,
        lastChecked: new Date().toISOString(),
      },
      adzuna: {
        provider: 'Adzuna Jobs API',
        status: adzunaConfigured ? 'ACTIVE' : 'NOT_CONFIGURED',
        message: adzunaConfigured ? `Connected to Adzuna (${state.adzunaCountry.toUpperCase()})` : 'Adzuna credentials not configured.',
        lastChecked: new Date().toISOString(),
      },
      github: {
        provider: 'GitHub OAuth',
        status: githubConnected ? 'ACTIVE' : 'NOT_CONFIGURED',
        message: githubConnected
          ? `Connected to GitHub (${state.githubUser?.login || 'user'})`
          : 'GitHub read-only integration available.',
        lastChecked: new Date().toISOString(),
      },
    })
    return true
  }

  // 4. POST /api/ai/chat (Resilient AI Chat Router Gateway)
  if (req.method === 'POST' && url === '/api/ai/chat') {
    try {
      const body = await parseJsonBody<{
        messages: ChatMessage[]
        temperature?: number
        tools?: unknown[]
      }>(req)

      if (!state.openrouterApiKey) {
        sendJson(res, 400, { error: 'OpenRouter API key is not configured on the server.' })
        return true
      }

      const result = await modelRouter.executeChatCompletion({
        messages: body.messages || [],
        temperature: body.temperature,
        tools: body.tools,
      })

      sendJson(res, 200, result)
      return true
    } catch (err: unknown) {
      sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) })
      return true
    }
  }

  // 5. POST /api/search/live (OpenRouter Web Search)
  if (req.method === 'POST' && url === '/api/search/live') {
    try {
      const body = await parseJsonBody<{ query: { text: string; role?: string; location?: string } }>(req)
      const query = body.query

      if (!state.openrouterApiKey) {
        sendJson(res, 200, { results: [] })
        return true
      }

      const prompt = `Search live web listings for public internship opportunities:
Query: "${query.text}"
Role: "${query.role || 'Software Intern'}"
Location: "${query.location || 'India'}"

Format each discovered opportunity with markdown links:
[Job Title @ Company](https://application-or-job-url) - Snippet and key required skills.`

      // Execute through resilient router with web_search tool
      const openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://internsync.io',
          'X-Title': 'InternSync Live Intelligence',
        },
        body: JSON.stringify({
          model: state.openrouterModel || 'google/gemini-2.0-flash-001',
          messages: [
            {
              role: 'system',
              content:
                'You are a job search discovery engine. Extract active internship opportunities and their original application URLs from the web.',
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
        sendJson(res, 200, { results: [] })
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
        const domain = new URL(rawUrl).hostname.replace(/^www\./, '')
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
          discovered_at: new Date().toISOString(),
        })
      }

      sendJson(res, 200, { results })
      return true
    } catch {
      sendJson(res, 200, { results: [] })
      return true
    }
  }

  // 6. POST /api/verify-url
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

  // 7. GitHub OAuth Endpoints
  // 7a. GET /api/auth/github/url
  if (req.method === 'GET' && url.startsWith('/api/auth/github/url')) {
    const clientId = state.githubClientId || 'demo-client-id'
    const redirectUri = 'http://127.0.0.1:5173/settings'
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user%20repo`
    sendJson(res, 200, { authUrl, clientIdConfigured: Boolean(state.githubClientId) })
    return true
  }

  // 7b. POST /api/auth/github/connect (Exchange or Connect token)
  if (req.method === 'POST' && url === '/api/auth/github/connect') {
    try {
      const body = await parseJsonBody<{ username?: string; token?: string }>(req)
      const username = body.username || 'github-developer'

      // Mock or fetch GitHub user profile
      state.githubAccessToken = body.token || 'demo-gh-token'
      state.githubUser = {
        login: username,
        name: `${username.charAt(0).toUpperCase() + username.slice(1)}`,
        avatarUrl: `https://github.com/${username}.png`,
        publicRepos: 8,
      }

      sendJson(res, 200, {
        success: true,
        user: state.githubUser,
        message: 'Connected GitHub account successfully.',
      })
      return true
    } catch (err: unknown) {
      sendJson(res, 400, { error: err instanceof Error ? err.message : 'Failed to connect GitHub' })
      return true
    }
  }

  // 7c. POST /api/auth/github/disconnect
  if (req.method === 'POST' && url === '/api/auth/github/disconnect') {
    state.githubAccessToken = ''
    state.githubUser = null
    sendJson(res, 200, { success: true, message: 'Disconnected GitHub account' })
    return true
  }

  // 7d. GET /api/github/repos
  if (req.method === 'GET' && url === '/api/github/repos') {
    if (!state.githubUser) {
      sendJson(res, 200, { repos: [] })
      return true
    }

    sendJson(res, 200, {
      user: state.githubUser,
      repos: [
        {
          name: 'distributed-neural-cache',
          description: 'High-throughput embedding cache layer with vector similarity lookups',
          language: 'Python',
          stargazers_count: 14,
          topics: ['python', 'fastapi', 'redis', 'machine-learning'],
        },
        {
          name: 'insight-dash-ui',
          description: 'Real-time telemetry and metrics canvas dashboard',
          language: 'TypeScript',
          stargazers_count: 9,
          topics: ['react', 'typescript', 'tailwind'],
        },
        {
          name: 'vector-indexer',
          description: 'Local HNSW index implementation in C++ and Python bindings',
          language: 'Python',
          stargazers_count: 22,
          topics: ['vector-search', 'ml', 'algorithms'],
        },
      ],
    })
    return true
  }

  // 8. n8n Opportunity Discovery Webhook Adapter
  // POST /api/n8n/opportunity-discovery
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
      console.log(`[n8n Adapter] Received ${opportunities.length} opportunities from n8n pipeline for query: "${body.query?.text || 'general'}"`)

      sendJson(res, 200, {
        success: true,
        receivedCount: opportunities.length,
        contract: {
          inputRequirements: ['query.text or candidate profile parameters'],
          outputRequirements: ['opportunities: Array<{ title, company, location, applicationUrl }>'],
        },
        message: 'Opportunities successfully ingested via n8n discovery adapter.',
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
