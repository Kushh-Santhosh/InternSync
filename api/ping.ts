import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const handlerMod = await import('./_handler.js')
    res.status(200).json({
      status: 'ok',
      timestamp: Date.now(),
      exports: Object.keys(handlerMod),
    })
  } catch (err: any) {
    res.status(200).json({
      status: 'import_failed',
      message: err?.message,
      stack: err?.stack,
      code: err?.code,
    })
  }
}
