import { getShowDetails, getSeasonEpisodes } from './tmdb'
import type { TmdbShowDetails, TmdbSeasonDetails } from '../types'

const showCache = new Map<number, Promise<TmdbShowDetails>>()
const seasonCache = new Map<string, Promise<TmdbSeasonDetails>>()

export function fetchShowDetailsCached(tmdbId: number): Promise<TmdbShowDetails> {
  let entry = showCache.get(tmdbId)
  if (!entry) {
    entry = getShowDetails(tmdbId)
    showCache.set(tmdbId, entry)
    entry.catch(() => showCache.delete(tmdbId))
  }
  return entry
}

export function fetchSeasonEpisodesCached(
  tmdbId: number,
  season: number,
): Promise<TmdbSeasonDetails> {
  const key = `${tmdbId}-${season}`
  let entry = seasonCache.get(key)
  if (!entry) {
    entry = getSeasonEpisodes(tmdbId, season)
    seasonCache.set(key, entry)
    entry.catch(() => seasonCache.delete(key))
  }
  return entry
}
