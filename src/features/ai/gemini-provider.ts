import { GoogleGenAI } from '@google/genai'
import type { ChatMessage, RouterCompletionResult } from './model-router.js'

export interface GeminiConfig {
  apiKey: string
  primaryModel: string
  fallbackModels: string[]
  searchEnabled?: boolean
  requestTimeoutMs?: number
  cooldownDurationMs?: number
}

export interface GroundedSearchResult {
  title: string
  company: string
  url: string
  domain: string
  snippet: string
  source: string
  discoveredAt: string
}

export class GeminiProvider {
  private apiKey: string
  private client: GoogleGenAI | null = null
  private primaryModel: string
  private fallbackModels: string[]
  private searchEnabled: boolean
  private requestTimeoutMs: number
  private cooldownDurationMs: number
  private modelCooldowns: Map<string, number> = new Map()

  public static readonly DEFAULT_MODELS = {
    PRIMARY: 'gemini-3.1-flash-lite-preview',
    FALLBACKS: [
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
      'gemini-2.5-flash',
      'gemini-flash-latest',
    ],
  }

  private groundingDisabledUntil: number = 0

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey || ''
    this.primaryModel = config.primaryModel || GeminiProvider.DEFAULT_MODELS.PRIMARY
    this.fallbackModels = config.fallbackModels?.length
      ? config.fallbackModels
      : [...GeminiProvider.DEFAULT_MODELS.FALLBACKS]
    this.searchEnabled = config.searchEnabled ?? true
    this.requestTimeoutMs = config.requestTimeoutMs ?? 15000
    this.cooldownDurationMs = config.cooldownDurationMs ?? 300000 // 5 minutes

    if (this.apiKey) {
      this.client = new GoogleGenAI({ apiKey: this.apiKey })
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.client)
  }

  public setApiKey(key: string) {
    this.apiKey = key
    this.client = key ? new GoogleGenAI({ apiKey: key }) : null
  }

  public getCandidateModels(): string[] {
    const now = Date.now()
    const candidates: string[] = []
    
    // Always include modern active fallback models to guarantee operational resilience
    const all = [
      this.primaryModel,
      ...this.fallbackModels,
      'gemini-3.1-flash-lite-preview',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
    ]

    for (const model of all) {
      const cooldownUntil = this.modelCooldowns.get(model)
      if (cooldownUntil && cooldownUntil > now) {
        // Still in cooldown
        continue
      }
      if (!candidates.includes(model)) {
        candidates.push(model)
      }
    }

    // If all in cooldown, return primary as fallback
    if (candidates.length === 0) {
      candidates.push(this.primaryModel)
    }

    return candidates
  }

  public recordSuccess(model: string) {
    this.modelCooldowns.delete(model)
  }

  public recordFailure(model: string) {
    this.modelCooldowns.set(model, Date.now() + this.cooldownDurationMs)
  }

  public isRetriableError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err)
    // 429 / RESOURCE_EXHAUSTED, 503 / UNAVAILABLE, 500 / INTERNAL, 408 / TIMEOUT, 404 / NOT_FOUND / no longer available
    return (
      msg.includes('429') ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('503') ||
      msg.includes('UNAVAILABLE') ||
      msg.includes('500') ||
      msg.includes('INTERNAL') ||
      msg.includes('408') ||
      msg.includes('TIMEOUT') ||
      msg.includes('404') ||
      msg.includes('NOT_FOUND') ||
      msg.includes('no longer available') ||
      msg.includes('is not found') ||
      msg.includes('quota') ||
      msg.includes('rate limit')
    )
  }

  /**
   * Execute chat completion with model fallback
   */
  public async executeChatCompletion(options: {
    messages: ChatMessage[]
    temperature?: number
  }): Promise<RouterCompletionResult> {
    if (!this.isConfigured() || !this.client) {
      throw new Error('GEMINI_NOT_CONFIGURED: Missing Gemini API Key')
    }

    const candidateModels = this.getCandidateModels()
    let lastError: Error | null = null
    let fallbackReason: string | undefined

    const systemMsg = options.messages.find((m) => m.role === 'system')?.content || ''
    const nonSystemMsgs = options.messages.filter((m) => m.role !== 'system')

    // Format contents for Gemini
    const contents = nonSystemMsgs.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    for (let i = 0; i < candidateModels.length; i++) {
      const model = candidateModels[i]
      const wasFallback = i > 0

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini timeout after ${this.requestTimeoutMs}ms`)), this.requestTimeoutMs)
        )

        const generatePromise = this.client.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: systemMsg || undefined,
            temperature: options.temperature ?? 0.2,
          },
        })

        const response = await Promise.race([generatePromise, timeoutPromise])
        const text = response.text || ''

        this.recordSuccess(model)
        return {
          content: text,
          modelUsed: model,
          wasFallback,
          fallbackReason,
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        this.recordFailure(model)
        fallbackReason = `Gemini model ${model} failed (${msg.slice(0, 100)}). Falling back.`
        lastError = err instanceof Error ? err : new Error(msg)

        if (!this.isRetriableError(err)) {
          // Non-retriable error (e.g. 401 INVALID_ARGUMENT auth key completely invalid)
          throw lastError
        }
      }
    }

    throw lastError || new Error('All Gemini model candidates failed.')
  }

  /**
   * Grounded search for live internship listings using Google Search tool
   */
  public async searchOpportunitiesWithGrounding(query: {
    text: string
    role?: string
    location?: string
  }): Promise<GroundedSearchResult[]> {
    if (!this.isConfigured() || !this.client || !this.searchEnabled) {
      return []
    }

    if (this.groundingDisabledUntil > Date.now()) {
      return []
    }

    const candidateModels = this.getCandidateModels()
    const prompt = `Search live, public web listings for currently active internship opportunities in 2026.
Query: "${query.text}"
Role: "${query.role || 'Software Intern'}"
Location: "${query.location || 'India / Remote'}"

CRITICAL RULES:
1. ONLY return active listings from 2025/2026. Do NOT return 2024 or older expired listings.
2. For each discovered opportunity, provide markdown links with genuine URLs:
[Job Title @ Company](https://real-application-or-career-url) - Snippet and key required skills.`

    for (const model of candidateModels) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini Grounded Search timeout')), 8000)
        )

        const callPromise = this.client.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.1,
          },
        })

        const response = await Promise.race([callPromise, timeoutPromise])
        const content = response.text || ''
        this.recordSuccess(model)

        // Parse markdown links
        const results: GroundedSearchResult[] = []
        const urlRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
        let match: RegExpExecArray | null

        while ((match = urlRegex.exec(content)) !== null) {
          const linkText = match[1]
          const rawUrl = match[2]
          let domain = 'careers'
          try {
            domain = new URL(rawUrl).hostname.replace(/^www\./, '')
          } catch {
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
            source: `Google Search Grounding (${domain})`,
            discoveredAt: new Date().toISOString(),
          })
        }

        // Also inspect groundingMetadata chunks if available
        const candidate = response.candidates?.[0]
        const groundingMetadata = (candidate as any)?.groundingMetadata
        if (groundingMetadata?.groundingChunks) {
          for (const chunk of groundingMetadata.groundingChunks) {
            if (chunk.web?.uri && chunk.web?.title) {
              const uri = chunk.web.uri
              try {
                const domain = new URL(uri).hostname.replace(/^www\./, '')
                if (!results.some((r) => r.url === uri)) {
                  results.push({
                    title: chunk.web.title,
                    company: domain,
                    url: uri,
                    domain,
                    snippet: chunk.web.title,
                    source: `Google Grounding Web (${domain})`,
                    discoveredAt: new Date().toISOString(),
                  })
                }
              } catch {
                // ignore invalid uri
              }
            }
          }
        }

        return results
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        this.recordFailure(model)
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
          // Grounding quota is exhausted on this key/project; disable grounding for 10 mins to prevent delays
          this.groundingDisabledUntil = Date.now() + 600000
          break
        }
        if (!this.isRetriableError(err)) {
          break
        }
      }
    }

    return []
  }
}
