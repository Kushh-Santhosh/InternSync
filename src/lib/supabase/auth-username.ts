import { supabase } from './client'

export const SYNTHETIC_EMAIL_DOMAIN = 'demo.internsync.invalid'

const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'internsync',
  'system',
  'support',
  'help',
  'root',
  'api',
  'auth',
  'test',
  'guest',
  'demo',
])

/**
 * Normalizes a student username: trims whitespace and converts to lowercase.
 */
export function normalizeUsername(username: string): string {
  return (username || '').trim().toLowerCase()
}

/**
 * Validates a username according to platform rules:
 * - 3 to 30 characters
 * - Alphanumeric characters and underscores only
 * - Not a reserved keyword
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  const normalized = normalizeUsername(username)

  if (!normalized) {
    return { valid: false, error: 'Username is required.' }
  }

  if (normalized.length < 3 || normalized.length > 30) {
    return { valid: false, error: 'Username must be between 3 and 30 characters.' }
  }

  const allowedRegex = /^[a-z0-9_]+$/
  if (!allowedRegex.test(normalized)) {
    return {
      valid: false,
      error: 'Username may only contain letters, numbers, and underscores (no spaces or special symbols).',
    }
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    return { valid: false, error: `Username "${normalized}" is reserved. Please choose another.` }
  }

  return { valid: true }
}

/**
 * Generates an internal synthetic email identifier for Supabase Auth compatibility.
 * This address is never used as a real mailbox, contact email, or for password recovery.
 */
export function getUsernameSyntheticEmail(username: string): string {
  const normalized = normalizeUsername(username)
  return `${normalized}@${SYNTHETIC_EMAIL_DOMAIN}`
}

/**
 * Checks if a given email is a synthetic identifier used for temporary username accounts.
 */
export function isSyntheticEmail(email?: string): boolean {
  if (!email) return false
  return email.toLowerCase().endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`)
}

/**
 * Extracts a displayable username handle (e.g. "@alex_chen") or email.
 */
export function extractDisplayIdentifier(
  email?: string,
  username?: string,
  fallbackName?: string
): string {
  if (username) return `@${username}`
  if (email && isSyntheticEmail(email)) {
    const prefix = email.split('@')[0]
    return `@${prefix}`
  }
  if (email) return email
  return fallbackName || 'Student'
}

export interface ProvisionUsernameResult {
  success: boolean
  username: string
  email: string
  userId?: string
  error?: string
}

/**
 * Provisions a temporary username-based account:
 * First attempts serverless endpoint /api/auth/register-username.
 * If serverless endpoint is unreachable or lacks the service key, seamlessly utilizes
 * the verified Supabase PostgreSQL security definer stored procedure provision_username_student.
 */
export async function provisionUsernameAccount(
  fullName: string,
  username: string,
  password: string
): Promise<ProvisionUsernameResult> {
  const validation = validateUsername(username)
  if (!validation.valid) {
    return {
      success: false,
      username: normalizeUsername(username),
      email: '',
      error: validation.error,
    }
  }

  if (!fullName.trim() || fullName.trim().length < 2) {
    return {
      success: false,
      username: normalizeUsername(username),
      email: '',
      error: 'Please provide your full name (at least 2 characters).',
    }
  }

  if (!password || password.length < 6) {
    return {
      success: false,
      username: normalizeUsername(username),
      email: '',
      error: 'Password must be at least 6 characters.',
    }
  }

  const normalized = normalizeUsername(username)
  const syntheticEmail = getUsernameSyntheticEmail(normalized)

  // 1. Attempt serverless API route
  try {
    const response = await fetch('/api/auth/register-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: fullName.trim(),
        username: normalized,
        password,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        return {
          success: true,
          username: data.username || normalized,
          email: data.email || syntheticEmail,
          userId: data.userId,
        }
      }
    }

    // If endpoint returned 409 Conflict (username taken), respect it immediately
    if (response.status === 409) {
      const errData = await response.json().catch(() => ({}))
      return {
        success: false,
        username: normalized,
        email: syntheticEmail,
        error: errData.error || `Username "${normalized}" is already taken. Please choose another username.`,
      }
    }

    if (response.status === 400) {
      const errData = await response.json().catch(() => ({}))
      return {
        success: false,
        username: normalized,
        email: syntheticEmail,
        error: errData.error || 'Invalid account details.',
      }
    }
  } catch (apiErr) {
    console.warn('[UsernameAuth] Serverless registration endpoint check failed; checking RPC fallback:', apiErr)
  }

  // 2. Direct database RPC fallback (Postgres SECURITY DEFINER)
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('provision_username_student', {
        p_username: normalized,
        p_password: password,
        p_full_name: fullName.trim(),
      })

      if (error) {
        console.error('[UsernameAuth] RPC provisioning error:', error)
        return {
          success: false,
          username: normalized,
          email: syntheticEmail,
          error: error.message || 'Database provisioning failed.',
        }
      }

      if (data && typeof data === 'object') {
        const res = data as any
        if (res.success) {
          return {
            success: true,
            username: res.username || normalized,
            email: res.email || syntheticEmail,
            userId: res.userId,
          }
        } else {
          return {
            success: false,
            username: normalized,
            email: syntheticEmail,
            error: res.error || 'Failed to provision account.',
          }
        }
      }
    } catch (rpcErr: unknown) {
      console.error('[UsernameAuth] RPC exception:', rpcErr)
      return {
        success: false,
        username: normalized,
        email: syntheticEmail,
        error: rpcErr instanceof Error ? rpcErr.message : 'Failed to create account.',
      }
    }
  }

  return {
    success: false,
    username: normalized,
    email: syntheticEmail,
    error: 'Authentication service is unavailable. Please check your connection or explore via Demo Mode.',
  }
}
