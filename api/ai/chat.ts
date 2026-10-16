import type { VercelRequest, VercelResponse } from '@vercel/node'
// @ts-ignore
import { handleAiChat, sendJson } from '../_handler.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
      return
    }
    await handleAiChat(req, res)
  } catch (err: any) {
    console.error('[AI Chat Crash]', err)
    sendJson(res, 500, {
      error: err?.message || String(err),
      code: 'AI_CHAT_CRASH',
    })
  }
}
