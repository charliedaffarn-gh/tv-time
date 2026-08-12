import { useEffect, useState } from 'react'
import { fetchMovieDetailsCached } from '../lib/tmdbCache'
import type { TmdbMovieDetails } from '../types'

export function useMovieDetails(tmdbId: number) {
  const [details, setDetails] = useState<TmdbMovieDetails | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setDetails(null)
    setError(false)
    fetchMovieDetailsCached(tmdbId)
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
