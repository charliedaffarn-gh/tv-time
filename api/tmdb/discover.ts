import type { VercelRequest, VercelResponse } from '@vercel/node'
import { tmdbFetch } from '../_lib/tmdb.js'
import { getAuthedUserId } from '../_lib/auth.js'

const ALLOWED_SORTS = new Set(['popularity.desc', 'vote_average.desc'])

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

  const genre = typeof req.query.with_genres === 'string' ? req.query.with_genres : ''
  const sortBy = typeof req.query.sort_by === 'string' ? req.query.sort_by : ''
  const voteCountGte = typeof req.query.vote_count_gte === 'string' ? req.query.vote_count_gte : ''

  if (genre && !/^\d+$/.test(genre)) {
    res.status(400).json({ error: 'Invalid with_genres' })
    return
  }
  if (voteCountGte && !/^\d+$/.test(voteCountGte)) {
    res.status(400).json({ error: 'Invalid vote_count_gte' })
    return
  }

  const params: Record<string, string> = {
    sort_by: ALLOWED_SORTS.has(sortBy) ? sortBy : 'popularity.desc',
  }
  if (genre) params.with_genres = genre
  if (voteCountGte) params['vote_count.gte'] = voteCountGte

  try {
    const { status, body } = await tmdbFetch('/discover/tv', params)
    res.setHeader('Cache-Control', 'private, max-age=3600')
    res.status(status).json(body)
  } catch {
    res.status(502).json({ error: 'TMDB request failed' })
  }
}
