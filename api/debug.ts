import type { VercelRequest, VercelResponse } from '@vercel/node'
import fs from 'node:fs'
import path from 'node:path'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  let rootFiles: string[] = []
  let apiFiles: string[] = []
  let srcFiles: string[] = []

  try {
    rootFiles = fs.readdirSync('/var/task')
  } catch (e: any) {
    rootFiles = [e.message]
  }

  try {
    apiFiles = fs.readdirSync('/var/task/api')
  } catch (e: any) {
    apiFiles = [e.message]
  }

  try {
    srcFiles = fs.readdirSync('/var/task/src')
  } catch (e: any) {
    srcFiles = [e.message]
  }

  res.status(200).json({
    rootFiles,
    apiFiles,
    srcFiles,
  })
}
