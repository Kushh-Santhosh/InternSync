import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleApiRequest, sendJson } from '../src/server/api-handler.ts'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure req.url starts with /api/ for matching
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url)
  }

  const handled = await handleApiRequest(req, res)
  if (!handled) {
    sendJson(res, 404, {
      error: `API route not found: ${req.url}`,
      code: 'ROUTE_NOT_FOUND',
    })
  }
}
