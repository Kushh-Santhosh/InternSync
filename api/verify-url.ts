import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleVerifyUrl, sendJson } from '../src/server/api-handler.ts'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
      return
    }
    await handleVerifyUrl(req, res)
  } catch (err: any) {
    console.error('[Verify URL Crash]', err)
    sendJson(res, 500, {
      error: err?.message || String(err),
      code: 'VERIFY_URL_CRASH',
      status: 'UNVERIFIED',
    })
  }
}
