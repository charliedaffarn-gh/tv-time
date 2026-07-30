import type { VercelRequest, VercelResponse } from '@vercel/node'
import { tmdbFetch } from '../_lib/tmdb'
import { getAuthedUserId } from '../_lib/auth'

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

  const id = typeof req.query.id === 'string' ? req.query.id : ''
  if (!/^\d+$/.test(id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }

  try {
    const { status, body } = await tmdbFetch(`/tv/${id}`)
    res.setHeader('Cache-Control', 'private, max-age=3600')
    res.status(status).json(body)
  } catch {
    res.status(502).json({ error: 'TMDB request failed' })
  }
}
