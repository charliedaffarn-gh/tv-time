import { getShowDetails, getSeasonEpisodes, getMovieDetails } from './tmdb'
import type { TmdbShowDetails, TmdbSeasonDetails, TmdbMovieDetails } from '../types'

const showCache = new Map<number, Promise<TmdbShowDetails>>()
const seasonCache = new Map<string, Promise<TmdbSeasonDetails>>()
// Kept separate from showCache -- TV and movie tmdb_ids are independent
// namespaces, so the same numeric id can legitimately be both a show and a
// film. A single cache keyed only by tmdb_id would return one's details
// for the other's request.
const movieCache = new Map<number, Promise<TmdbMovieDetails>>()

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

export function fetchMovieDetailsCached(tmdbId: number): Promise<TmdbMovieDetails> {
  let entry = movieCache.get(tmdbId)
  if (!entry) {
    entry = getMovieDetails(tmdbId)
    movieCache.set(tmdbId, entry)
    entry.catch(() => movieCache.delete(tmdbId))
  }
  return entry
}
