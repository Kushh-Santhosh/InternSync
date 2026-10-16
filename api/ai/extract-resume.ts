import type { VercelRequest, VercelResponse } from '@vercel/node'
// @ts-ignore
import { handleAiExtractResume, sendJson } from '../_handler.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
      return
    }
    await handleAiExtractResume(req, res)
  } catch (err: any) {
    console.error('[AI Extract Resume Crash]', err)
    sendJson(res, 500, {
      error: err?.message || String(err),
      code: 'EXTRACT_RESUME_CRASH',
    })
  }
}
