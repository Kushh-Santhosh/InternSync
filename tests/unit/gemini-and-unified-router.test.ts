import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GeminiProvider } from '@/features/ai/gemini-provider'
import { OpenRouterModelRouter, UnifiedAiRouter } from '@/features/ai/model-router'

describe('GeminiProvider', () => {
  let provider: GeminiProvider

  beforeEach(() => {
    vi.restoreAllMocks()
    provider = new GeminiProvider({
      apiKey: 'test-gemini-key',
      primaryModel: 'gemini-2.5-flash',
      fallbackModels: ['gemini-2.0-flash', 'gemini-1.5-flash'],
      cooldownDurationMs: 1000,
    })
  })

  it('correctly configures candidate models starting with primary', () => {
    const candidates = provider.getCandidateModels()
    expect(candidates[0]).toBe('gemini-2.5-flash')
    expect(candidates).toContain('gemini-2.0-flash')
    expect(candidates).toContain('gemini-1.5-flash')
  })

  it('correctly identifies retriable vs non-retriable errors', () => {
    // Retriable errors
    expect(provider.isRetriableError(new Error('RESOURCE_EXHAUSTED: 429 quota reached'))).toBe(true)
    expect(provider.isRetriableError(new Error('503 Service Unavailable'))).toBe(true)
    expect(provider.isRetriableError(new Error('500 Internal error'))).toBe(true)
    expect(provider.isRetriableError(new Error('404 NOT_FOUND model does not exist'))).toBe(true)
    expect(provider.isRetriableError(new Error('408 Request TIMEOUT'))).toBe(true)

    // Non-retriable errors
    expect(provider.isRetriableError(new Error('401 UNAUTHENTICATED: API_KEY_INVALID'))).toBe(false)
    expect(provider.isRetriableError(new Error('400 INVALID_ARGUMENT'))).toBe(false)
  })

  it('puts model into cooldown on failure and removes it from immediate candidates', () => {
    const primary = 'gemini-2.5-flash'
    expect(provider.getCandidateModels()[0]).toBe(primary)

    provider.recordFailure(primary)
    const candidatesDuringCooldown = provider.getCandidateModels()
    expect(candidatesDuringCooldown).not.toContain(primary)
    expect(candidatesDuringCooldown[0]).toBe('gemini-2.0-flash')

    provider.recordSuccess(primary)
    expect(provider.getCandidateModels()[0]).toBe(primary)
  })
})

describe('UnifiedAiRouter Multi-Provider Failover', () => {
  let openrouterRouter: OpenRouterModelRouter
  let geminiProvider: GeminiProvider
  let unifiedRouter: UnifiedAiRouter

  beforeEach(() => {
    vi.restoreAllMocks()
    openrouterRouter = new OpenRouterModelRouter('sk-or-test-key', {
      primaryModel: 'meta-llama/llama-3.3-70b-instruct',
      fallbackModels: ['openai/gpt-4o-mini'],
      cooldownDurationMs: 1000,
    })
    geminiProvider = new GeminiProvider({
      apiKey: 'test-gemini-key',
      primaryModel: 'gemini-2.5-flash',
      fallbackModels: ['gemini-2.0-flash'],
      cooldownDurationMs: 1000,
    })
    unifiedRouter = new UnifiedAiRouter(openrouterRouter, geminiProvider, 'openrouter')
  })

  it('routes to primary provider (OpenRouter) when healthy', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { role: 'assistant', content: 'OpenRouter response' } }],
      }),
    })
    globalThis.fetch = fetchMock

    const res = await unifiedRouter.executeChat({
      messages: [{ role: 'user', content: 'Hello' }],
    })

    expect(res.providerUsed).toBe('openrouter')
    expect(res.content).toBe('OpenRouter response')
    expect(res.requestId).toMatch(/^req-/)
  })

  it('falls back to Gemini when OpenRouter encounters transient / retriable failure', async () => {
    // OpenRouter calls fail with 429
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded on OpenRouter',
    })
    globalThis.fetch = fetchMock

    // Mock Gemini executeChatCompletion
    vi.spyOn(geminiProvider, 'executeChatCompletion').mockResolvedValueOnce({
      content: 'Gemini fallback response',
      modelUsed: 'gemini-2.5-flash',
      wasFallback: false,
    })

    const res = await unifiedRouter.executeChat({
      messages: [{ role: 'user', content: 'Hello' }],
    })

    expect(res.providerUsed).toBe('gemini')
    expect(res.content).toBe('Gemini fallback response')
    expect(res.wasFallback).toBe(true)
  })

  it('falls back from Gemini to OpenRouter when Gemini is primary and fails', async () => {
    const geminiPrimaryRouter = new UnifiedAiRouter(openrouterRouter, geminiProvider, 'gemini')

    // Gemini fails
    vi.spyOn(geminiProvider, 'executeChatCompletion').mockRejectedValueOnce(
      new Error('RESOURCE_EXHAUSTED: 429 Quota exceeded')
    )

    // OpenRouter succeeds
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { role: 'assistant', content: 'OpenRouter fallback response' } }],
      }),
    })
    globalThis.fetch = fetchMock

    const res = await geminiPrimaryRouter.executeChat({
      messages: [{ role: 'user', content: 'Analyze credentials' }],
    })

    expect(res.providerUsed).toBe('openrouter')
    expect(res.content).toBe('OpenRouter fallback response')
    expect(res.wasFallback).toBe(true)
  })

  it('fails truthfully when every configured provider fails', async () => {
    // OpenRouter fails
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'OpenRouter Service Unavailable',
    })
    globalThis.fetch = fetchMock

    // Gemini fails
    vi.spyOn(geminiProvider, 'executeChatCompletion').mockRejectedValueOnce(
      new Error('503 Gemini Service Unavailable')
    )

    await expect(
      unifiedRouter.executeChat({
        messages: [{ role: 'user', content: 'Test' }],
      })
    ).rejects.toThrow()
  })
})
