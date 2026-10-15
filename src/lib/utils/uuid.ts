/**
 * Deterministic UUIDv5 generator and validator.
 * Conforms to RFC 4122 UUIDv5 (SHA-1 hashing).
 * Zero external dependencies; works in Node.js, browsers, and edge environments.
 */

// InternSync Opportunity Namespace UUID: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' (DNS namespace)
const DEFAULT_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUUID(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false
  return UUID_REGEX.test(id)
}

/**
 * Standard pure-TypeScript SHA-1 implementation for deterministic UUID generation.
 */
function sha1(bytes: Uint8Array): Uint8Array {
  // Convert Uint8Array to 32-bit big-endian words
  const words: number[] = []
  for (let i = 0; i < bytes.length; i += 4) {
    words.push(
      ((bytes[i] || 0) << 24) |
      ((bytes[i + 1] || 0) << 16) |
      ((bytes[i + 2] || 0) << 8) |
      (bytes[i + 3] || 0)
    )
  }

  const bitLength = bytes.length * 8
  words[bitLength >> 5] |= 0x80 << (24 - (bitLength % 32))
  words[(((bitLength + 64) >> 9) << 4) + 15] = bitLength

  let h0 = 0x67452301
  let h1 = 0xefcdab89
  let h2 = 0x98badcfe
  let h3 = 0x10325476
  let h4 = 0xc3d2e1f0

  const w = new Array(80)

  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t++) {
      w[t] = words[i + t] || 0
    }
    for (let t = 16; t < 80; t++) {
      const v = w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16]
      w[t] = (v << 1) | (v >>> 31)
    }

    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4

    for (let t = 0; t < 80; t++) {
      let f: number
      let k: number
      if (t < 20) {
        f = (b & c) | (~b & d)
        k = 0x5a827999
      } else if (t < 40) {
        f = b ^ c ^ d
        k = 0x6ed9eba1
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d)
        k = 0x8f1bbcdc
      } else {
        f = b ^ c ^ d
        k = 0xca62c1d6
      }

      const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[t]) | 0
      e = d
      d = c
      c = (b << 30) | (b >>> 2)
      b = a
      a = temp
    }

    h0 = (h0 + a) | 0
    h1 = (h1 + b) | 0
    h2 = (h2 + c) | 0
    h3 = (h3 + d) | 0
    h4 = (h4 + e) | 0
  }

  const result = new Uint8Array(20)
  const h = [h0, h1, h2, h3, h4]
  for (let i = 0; i < 5; i++) {
    result[i * 4] = (h[i] >>> 24) & 0xff
    result[i * 4 + 1] = (h[i] >>> 16) & 0xff
    result[i * 4 + 2] = (h[i] >>> 8) & 0xff
    result[i * 4 + 3] = h[i] & 0xff
  }
  return result
}

function parseUuidToBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, '')
  const bytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

/**
 * Generates an RFC 4122 UUIDv5 deterministically from a namespace and a name string.
 */
export function generateDeterministicUUID(name: string, namespace: string = DEFAULT_NAMESPACE): string {
  const nsBytes = parseUuidToBytes(namespace)
  const encoder = new TextEncoder()
  const nameBytes = encoder.encode(name)

  const toHash = new Uint8Array(nsBytes.length + nameBytes.length)
  toHash.set(nsBytes, 0)
  toHash.set(nameBytes, nsBytes.length)

  const hash = sha1(toHash)

  // Set RFC 4122 version to 5 (0x50)
  hash[6] = (hash[6] & 0x0f) | 0x50
  // Set RFC 4122 variant to 2 (0x80)
  hash[8] = (hash[8] & 0x3f) | 0x80

  const hex: string[] = []
  for (let i = 0; i < 16; i++) {
    hex.push(hash[i].toString(16).padStart(2, '0'))
  }

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-')
}

/**
 * Normalizes an opportunity source URL for collision-resistant identity generation.
 * Strips common tracking parameters (utm_*, ref, etc.) and normalizes host/protocol.
 */
export function normalizeCanonicalUrl(rawUrl?: string): string {
  if (!rawUrl || rawUrl.trim() === '' || rawUrl === '#') return ''
  try {
    const parsed = new URL(rawUrl.trim())
    parsed.protocol = parsed.protocol.toLowerCase()
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, '')
    
    // Remove query tracking params
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source', 'fbclid', 'gclid']
    trackingParams.forEach((param) => parsed.searchParams.delete(param))
    
    // Remove trailing slash on path
    parsed.pathname = parsed.pathname.replace(/\/+$/, '')
    
    return parsed.toString()
  } catch {
    return rawUrl.trim().toLowerCase()
  }
}

/**
 * Generates a stable, collision-resistant UUID for an opportunity based on its
 * canonical URL, company name, and role title.
 */
export function generateOpportunityId(
  canonicalUrl?: string,
  companyName?: string,
  roleTitle?: string
): string {
  const normUrl = normalizeCanonicalUrl(canonicalUrl)
  const normCompany = (companyName || '').trim().toLowerCase()
  const normRole = (roleTitle || '').trim().toLowerCase()

  const seed = normUrl
    ? `url:${normUrl}`
    : `meta:${normCompany}|${normRole}`

  return generateDeterministicUUID(seed)
}

/**
 * Generates a deterministic UUID for an application row based on student ID and opportunity ID.
 */
export function generateApplicationId(studentId: string, opportunityId: string): string {
  return generateDeterministicUUID(`app:${studentId}:${opportunityId}`)
}
