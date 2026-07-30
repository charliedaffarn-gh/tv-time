import { supabase } from './supabase'
import type { TmdbSearchResult, TmdbShowDetails, TmdbSeasonDetails } from '../types'

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

export function posterUrl(path: string | null, size: 'w200' | 'w342' | 'w500' = 'w342') {
  if (!path) return null
  return `https://image.tmdb.org/t/p/${size}${path}`
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
