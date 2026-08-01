import type { VercelRequest, VercelResponse } from '@vercel/node'
import { tmdbFetch } from '../_lib/tmdb.js'
import { getAuthedUserId } from '../_lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const userId = await getAuthedUserId(req)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const { status, body } = await tmdbFetch('/genre/tv/list')
    res.setHeader('Cache-Control', 'private, max-age=86400')
    res.status(status).json(body)
  } catch {
    res.status(502).json({ error: 'TMDB request failed' })
  }
}
