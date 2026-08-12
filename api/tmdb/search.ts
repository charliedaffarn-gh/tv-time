import type { VercelRequest, VercelResponse } from '@vercel/node'
import { tmdbFetch, parseMediaType, normalizeResultsBody } from '../_lib/tmdb.js'
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

  const query = typeof req.query.query === 'string' ? req.query.query.trim() : ''
  if (!query) {
    res.status(400).json({ error: 'Missing query parameter' })
    return
  }
  const type = parseMediaType(req.query.type)

  try {
    const { status, body } = await tmdbFetch(`/search/${type}`, { query })
    res.setHeader('Cache-Control', 'private, max-age=300')
    res.status(status).json(normalizeResultsBody(body, type))
  } catch {
    res.status(502).json({ error: 'TMDB request failed' })
  }
}
