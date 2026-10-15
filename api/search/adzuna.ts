import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleSearchAdzuna, sendJson } from '../../src/server/api-handler.ts'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
    return
  }
  await handleSearchAdzuna(req, res)
}
