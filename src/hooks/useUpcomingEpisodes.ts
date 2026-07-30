import { useEffect, useState } from 'react'
import { fetchShowDetailsCached } from '../lib/tmdbCache'
import type { TmdbEpisodeRef, UserShow } from '../types'

export interface UpcomingItem {
  show: UserShow
  next: TmdbEpisodeRef
}

/** Real-world upcoming air dates for shows in "watching", independent of personal watch progress. */
export function useUpcomingEpisodes(shows: UserShow[]): UpcomingItem[] {
  const watching = shows.filter((s) => s.status === 'watching')
  const watchingKey = watching.map((s) => s.tmdb_id).join(',')
  const [items, setItems] = useState<UpcomingItem[]>([])

  useEffect(() => {
    if (watching.length === 0) {
      setItems([])
      return
    }
    let cancelled = false
    Promise.all(
      watching.map(async (show) => {
        try {
          const details = await fetchShowDetailsCached(show.tmdb_id)
          return details.next_episode_to_air ? { show, next: details.next_episode_to_air } : null
        } catch {
          return null
        }
      }),
    ).then((results) => {
      if (cancelled) return
      const upcoming = results
        .filter((r): r is UpcomingItem => r !== null && !!r.next.air_date)
        .sort((a, b) => (a.next.air_date! < b.next.air_date! ? -1 : 1))
      setItems(upcoming)
    })
    return () => {
      cancelled = true
    }
    // watchingKey captures the set of watched shows; re-fetching on every
    // unrelated field change (e.g. episode pointer) would be wasteful.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchingKey])

  return items
}
