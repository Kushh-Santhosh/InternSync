import type { VercelRequest, VercelResponse } from '@vercel/node'
// @ts-ignore
import { handleSearchAdzuna, sendJson } from '../_handler.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
      return
    }
    await handleSearchAdzuna(req, res)
  } catch (err: any) {
    console.error('[Search Adzuna Crash]', err)
    sendJson(res, 500, {
      error: err?.message || String(err),
      code: 'SEARCH_ADZUNA_CRASH',
      results: [],
    })
  }
}
