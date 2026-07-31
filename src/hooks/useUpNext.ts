import { useEffect, useState } from 'react'
import { fetchSeasonEpisodesCached } from '../lib/tmdbCache'
import { computeNextEpisode, type EpisodePointer } from '../lib/nextEpisode'
import type { TmdbShowDetails } from '../types'

export interface UpNext extends EpisodePointer {
  name: string | null
}

/** undefined = still loading, null = caught up (nothing next has aired yet) */
export function useUpNext(watched: ReadonlySet<string>, details: TmdbShowDetails | null) {
  const [upNext, setUpNext] = useState<UpNext | null | undefined>(undefined)

  useEffect(() => {
    if (!details) return
    const next = computeNextEpisode(watched, details.seasons)
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
    // `watched` is rebuilt as a new Set on every Dashboard refresh; re-running
    // whenever `details` changes (rare, only on tmdb_id change) plus whenever
    // this show's own watched count changes is what we actually want, so key
    // off its size + details rather than object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watched.size, details])

  return upNext
}
