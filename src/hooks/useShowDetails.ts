import { useEffect, useState } from 'react'
import { fetchShowDetailsCached } from '../lib/tmdbCache'
import type { TmdbShowDetails } from '../types'

export function useShowDetails(tmdbId: number) {
  const [details, setDetails] = useState<TmdbShowDetails | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setDetails(null)
    setError(false)
    fetchShowDetailsCached(tmdbId)
      .then((d) => {
        if (!cancelled) setDetails(d)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [tmdbId])

  return { details, error }
}
