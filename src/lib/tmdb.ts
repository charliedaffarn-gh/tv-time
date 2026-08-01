import { supabase } from './supabase'
import type { TmdbSearchResult, TmdbShowDetails, TmdbSeasonDetails, TmdbGenre } from '../types'

async function authedFetch<T>(path: string): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const res = await fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    throw new Error(`Request to ${path} failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function posterUrl(path: string | null, size: 'w92' | 'w200' | 'w342' | 'w500' = 'w342') {
  if (!path) return null
  return `https://image.tmdb.org/t/p/${size}${path}`
}

// No region picker in the UI yet -- this app has one household of users, so a
// single hardcoded region is enough for now. Revisit if that stops being true.
export const WATCH_REGION = 'GB'

const CONCLUDED_STATUSES = new Set(['Ended', 'Canceled'])

/** True once TMDB says the show itself is done -- no more episodes are ever coming. */
export function isShowConcluded(status: string): boolean {
  return CONCLUDED_STATUSES.has(status)
}

export function searchShows(query: string): Promise<{ results: TmdbSearchResult[] }> {
  return authedFetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`)
}

export function getShowDetails(tmdbId: number): Promise<TmdbShowDetails> {
  return authedFetch(`/api/tmdb/show?id=${tmdbId}`)
}

export function getSeasonEpisodes(tmdbId: number, season: number): Promise<TmdbSeasonDetails> {
  return authedFetch(`/api/tmdb/season?id=${tmdbId}&season=${season}`)
}

export function getRecommendations(tmdbId: number): Promise<{ results: TmdbSearchResult[] }> {
  return authedFetch(`/api/tmdb/recommendations?id=${tmdbId}`)
}

export function getGenres(): Promise<{ genres: TmdbGenre[] }> {
  return authedFetch('/api/tmdb/genres')
}

export function getTrending(): Promise<{ results: TmdbSearchResult[] }> {
  return authedFetch('/api/tmdb/trending')
}

export function getPopular(): Promise<{ results: TmdbSearchResult[] }> {
  return authedFetch('/api/tmdb/popular')
}

export function getTopRated(): Promise<{ results: TmdbSearchResult[] }> {
  return authedFetch('/api/tmdb/discover?sort_by=vote_average.desc&vote_count_gte=300')
}

export function getShowsByGenre(genreId: number): Promise<{ results: TmdbSearchResult[] }> {
  return authedFetch(`/api/tmdb/discover?with_genres=${genreId}`)
}
