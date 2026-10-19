import type { VercelRequest, VercelResponse } from '@vercel/node'
// @ts-ignore
import { handleAuthRegisterUsername, sendJson } from '../_handler.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
      return
    }
    await handleAuthRegisterUsername(req, res)
  } catch (err: any) {
    console.error('[Auth Register Crash]', err)
    sendJson(res, 500, {
      error: err?.message || String(err),
      code: 'AUTH_REGISTER_CRASH',
    })
  }
}
