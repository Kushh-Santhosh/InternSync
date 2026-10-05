/**
 * OpenRouter AI Model Router
 *
 * Implements resilient multi-model routing with automatic failover,
 * exponential backoff, health tracking, and circuit-breaker cooldowns.
 * Used server-side or via secure API gateway so secrets never touch client code.
 */

export interface ModelHealth {
  modelId: string
  displayName: string
  lastSuccess?: string
  lastFailure?: string
  consecutiveFailures: number
  cooldownUntil?: number
  isHealthy: boolean
}

export interface RouterConfig {
  primaryModel: string
  fallbackModels: string[]
  maxRetriesPerModel: number
  cooldownDurationMs: number
  requestTimeoutMs: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface RouterChatCompletionOptions {
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  tools?: unknown[]
  response_format?: { type: string }
}

export interface RouterCompletionResult {
  content: string
  modelUsed: string
  wasFallback: boolean
  fallbackReason?: string
  toolCalls?: unknown[]
}

export class OpenRouterModelRouter {
  private config: RouterConfig
  private healthState: Map<string, ModelHealth>
  private apiKey: string

  public static readonly DEFAULT_MODELS = {
    PRIMARY: 'google/gemini-2.0-flash-001',
    FALLBACKS: [
      'anthropic/claude-3.5-haiku',
      'meta-llama/llama-3.3-70b-instruct',
      'openai/gpt-4o-mini',
    ],
  }

  constructor(apiKey = '', configPartial?: Partial<RouterConfig>) {
    this.apiKey = apiKey
    this.config = {
      primaryModel: configPartial?.primaryModel || OpenRouterModelRouter.DEFAULT_MODELS.PRIMARY,
      fallbackModels: configPartial?.fallbackModels || [...OpenRouterModelRouter.DEFAULT_MODELS.FALLBACKS],
      maxRetriesPerModel: configPartial?.maxRetriesPerModel ?? 1,
      cooldownDurationMs: configPartial?.cooldownDurationMs ?? 300_000, // 5 min
      requestTimeoutMs: configPartial?.requestTimeoutMs ?? 25_000,
    }
    this.healthState = new Map()
    this.initializeHealthState()
  }

  public setApiKey(key: string) {
    this.apiKey = key
  }

  public updateConfig(configPartial: Partial<RouterConfig>) {
    this.config = { ...this.config, ...configPartial }
    this.initializeHealthState()
  }

  private initializeHealthState() {
    const allModels = [this.config.primaryModel, ...this.config.fallbackModels]
    for (const m of allModels) {
      if (!this.healthState.has(m)) {
        this.healthState.set(m, {
          modelId: m,
          displayName: m.split('/').pop() || m,
          consecutiveFailures: 0,
          isHealthy: true,
        })
      }
    }
  }

  /**
   * Determine if an HTTP status or error is retriable/eligible for failover
   */
  public isRetriableError(status: number): boolean {
    // 408 Timeout, 429 Rate Limit, 500, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout
    return [408, 429, 500, 502, 503, 504].includes(status)
  }

  /**
   * Gets ordered candidates: primary (if healthy) -> fallbacks (if healthy)
   */
  public getCandidateModels(): string[] {
    const now = Date.now()
    const candidates: string[] = []

    const evaluate = (modelId: string) => {
      const h = this.healthState.get(modelId)
      if (!h) {
        candidates.push(modelId)
        return
      }
      // If in cooldown, check if cooldown expired
      if (h.cooldownUntil && h.cooldownUntil <= now) {
        h.cooldownUntil = undefined
        h.isHealthy = true
        h.consecutiveFailures = 0
      }
      if (h.isHealthy) {
        candidates.push(modelId)
      }
    }

    // Check primary first
    evaluate(this.config.primaryModel)

    // Check fallbacks
    for (const fb of this.config.fallbackModels) {
      if (fb !== this.config.primaryModel && !candidates.includes(fb)) {
        evaluate(fb)
      }
    }

    // If all models are in cooldown, reset primary as last resort
    if (candidates.length === 0) {
      candidates.push(this.config.primaryModel)
    }

    return candidates
  }

  /**
   * Records a success for the specified model
   */
  public recordSuccess(modelId: string) {
    const h = this.healthState.get(modelId)
    if (h) {
      h.consecutiveFailures = 0
      h.lastSuccess = new Date().toISOString()
      h.isHealthy = true
      h.cooldownUntil = undefined
    }
  }

  /**
   * Records a failure and applies circuit breaker cooldown if threshold met
   */
  public recordFailure(modelId: string) {
    let h = this.healthState.get(modelId)
    if (!h) {
      h = {
        modelId,
        displayName: modelId.split('/').pop() || modelId,
        consecutiveFailures: 0,
        isHealthy: true,
      }
      this.healthState.set(modelId, h)
    }

    h.consecutiveFailures += 1
    h.lastFailure = new Date().toISOString()

    // If 2 or more consecutive failures, place into cooldown
    if (h.consecutiveFailures >= 2) {
      h.isHealthy = false
      h.cooldownUntil = Date.now() + this.config.cooldownDurationMs
    }
  }

  /**
   * Executes a chat completion through the OpenRouter failover chain
   */
  public async executeChatCompletion(
    options: RouterChatCompletionOptions
  ): Promise<RouterCompletionResult> {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_NOT_CONFIGURED: Missing OpenRouter API Key')
    }

    const candidateModels = this.getCandidateModels()
    let lastError: Error | null = null
    let fallbackReason: string | undefined

    for (let i = 0; i < candidateModels.length; i++) {
      const currentModel = candidateModels[i]
      const wasFallback = i > 0

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs)

        const payload: Record<string, unknown> = {
          model: currentModel,
          messages: options.messages,
        }
        if (options.temperature !== undefined) payload.temperature = options.temperature
        if (options.max_tokens !== undefined) payload.max_tokens = options.max_tokens
        if (options.tools) payload.tools = options.tools
        if (options.response_format) payload.response_format = options.response_format

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://internsync.io',
            'X-Title': 'InternSync Resilient Gateway',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (res.ok) {
          const json = (await res.json()) as any
          this.recordSuccess(currentModel)
          const choice = json.choices?.[0]?.message
          return {
            content: choice?.content || '',
            modelUsed: currentModel,
            wasFallback,
            fallbackReason,
            toolCalls: choice?.tool_calls,
          }
        }

        // Non-OK response
        const status = res.status
        const errorText = await res.text().catch(() => '')

        // Check if error is retriable
        if (this.isRetriableError(status)) {
          this.recordFailure(currentModel)
          fallbackReason = `Model ${currentModel} returned status ${status} (${errorText.slice(0, 100)}). Automatically fell back.`
          lastError = new Error(`OpenRouter ${status}: ${errorText}`)
          continue // try next fallback candidate
        } else {
          // Non-retriable: client error, 401 unauth, 400 bad request, safety refusal
          throw new Error(`OpenRouter non-retriable error [${status}]: ${errorText}`)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('non-retriable') || msg.includes('OPENROUTER_NOT_CONFIGURED')) {
          throw err
        }
        // Timeout or network error
        this.recordFailure(currentModel)
        fallbackReason = `Network/timeout with ${currentModel}: ${msg}. Switched to fallback.`
        lastError = err instanceof Error ? err : new Error(msg)
      }
    }

    throw lastError || new Error('All OpenRouter model candidates failed.')
  }

  /**
   * Return health snapshot of all registered models
   */
  public getHealthSummary(): ModelHealth[] {
    return Array.from(this.healthState.values())
  }
}
