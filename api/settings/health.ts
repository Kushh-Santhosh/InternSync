import type { VercelRequest, VercelResponse } from '@vercel/node'
// @ts-ignore
import { handleSettingsHealth, sendJson } from '../_handler.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
      return
    }
    await handleSettingsHealth(req, res)
  } catch (err: any) {
    console.error('[API Health Crash]', err)
    sendJson(res, 500, {
      error: err?.message || String(err),
      code: 'HEALTH_CRASH',
    })
  }
}
