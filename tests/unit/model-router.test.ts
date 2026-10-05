import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenRouterModelRouter } from '@/features/ai/model-router'

describe('OpenRouterModelRouter', () => {
  let router: OpenRouterModelRouter

  beforeEach(() => {
    vi.restoreAllMocks()
    router = new OpenRouterModelRouter('sk-or-test-key', {
      primaryModel: 'google/gemini-2.0-flash-001',
      fallbackModels: ['anthropic/claude-3.5-haiku', 'meta-llama/llama-3.3-70b-instruct'],
      cooldownDurationMs: 1000,
    })
  })

  it('orders candidate models starting with primary model', () => {
    const candidates = router.getCandidateModels()
    expect(candidates[0]).toBe('google/gemini-2.0-flash-001')
    expect(candidates).toContain('anthropic/claude-3.5-haiku')
    expect(candidates).toContain('meta-llama/llama-3.3-70b-instruct')
  })

  it('correctly classifies retriable errors vs non-retriable errors', () => {
    // Retriable
    expect(router.isRetriableError(408)).toBe(true)
    expect(router.isRetriableError(429)).toBe(true)
    expect(router.isRetriableError(500)).toBe(true)
    expect(router.isRetriableError(502)).toBe(true)
    expect(router.isRetriableError(503)).toBe(true)
    expect(router.isRetriableError(504)).toBe(true)

    // Non-retriable
    expect(router.isRetriableError(400)).toBe(false)
    expect(router.isRetriableError(401)).toBe(false)
    expect(router.isRetriableError(403)).toBe(false)
    expect(router.isRetriableError(404)).toBe(false)
  })

  it('fails over to secondary model when primary returns 429', async () => {
    const fetchMock = vi.fn()
    // First call (primary) returns 429 Rate Limit
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded',
    })
    // Second call (fallback) returns 200 OK
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { role: 'assistant', content: 'Fallback response success' } }],
      }),
    })
    globalThis.fetch = fetchMock

    const result = await router.executeChatCompletion({
      messages: [{ role: 'user', content: 'Hello' }],
    })

    expect(result.content).toBe('Fallback response success')
    expect(result.wasFallback).toBe(true)
    expect(result.modelUsed).toBe('anthropic/claude-3.5-haiku')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('puts model into cooldown after 2 consecutive failures and restores after expiry', () => {
    const primary = 'google/gemini-2.0-flash-001'
    router.recordFailure(primary)
    expect(router.getCandidateModels()[0]).toBe(primary) // 1 failure still healthy

    router.recordFailure(primary) // 2nd failure triggers cooldown
    const candidatesDuringCooldown = router.getCandidateModels()
    expect(candidatesDuringCooldown[0]).toBe('anthropic/claude-3.5-haiku')
    expect(candidatesDuringCooldown).not.toContain(primary)

    // Fast-forward cooldown (1000ms)
    vi.setSystemTime(Date.now() + 1500)
    const candidatesAfterCooldown = router.getCandidateModels()
    expect(candidatesAfterCooldown).toContain(primary)
    vi.useRealTimers()
  })

  it('rejects immediately on non-retriable 401 invalid key without looping fallbacks', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Invalid API Key',
    })
    globalThis.fetch = fetchMock

    await expect(
      router.executeChatCompletion({
        messages: [{ role: 'user', content: 'Test' }],
      })
    ).rejects.toThrow(/non-retriable error \[401\]/)

    // Did not attempt next model because 401 is an account/auth issue
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
