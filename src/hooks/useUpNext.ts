import { useEffect, useState } from 'react'
import { fetchSeasonEpisodesCached } from '../lib/tmdbCache'
import { computeNextEpisode, type EpisodePointer } from '../lib/nextEpisode'
import type { TmdbShowDetails } from '../types'

export interface UpNext extends EpisodePointer {
  name: string | null
}

/** undefined = still loading, null = caught up (nothing next has aired yet) */
export function useUpNext(
  season: number,
  episode: number,
  details: TmdbShowDetails | null,
) {
  const [upNext, setUpNext] = useState<UpNext | null | undefined>(undefined)

  useEffect(() => {
    if (!details) return
    const next = computeNextEpisode({ season, episode }, details.seasons)
    if (!next) {
      setUpNext(null)
      return
    }
    let cancelled = false
    setUpNext(undefined)
    fetchSeasonEpisodesCached(details.id, next.season)
      .then((seasonDetails) => {
        if (cancelled) return
        const ep = seasonDetails.episodes.find((e) => e.episode_number === next.episode)
        setUpNext({ season: next.season, episode: next.episode, name: ep?.name ?? null })
      })
      .catch(() => {
        if (!cancelled) setUpNext({ season: next.season, episode: next.episode, name: null })
      })
    return () => {
      cancelled = true
    }
  }, [season, episode, details])

  return upNext
}
