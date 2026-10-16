import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const info: Record<string, any> = {
    nodeVersion: process.version,
    env: process.env.NODE_ENV,
  }

  try {
    const mod = await import('../src/server/api-handler.ts')
    info.apiHandlerImport = 'SUCCESS'
    info.keys = Object.keys(mod)
  } catch (err: any) {
    info.apiHandlerImport = 'FAILED'
    info.error = {
      message: err?.message,
      code: err?.code,
      stack: err?.stack,
    }
  }

  res.status(200).json(info)
}
