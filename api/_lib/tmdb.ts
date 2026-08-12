const TMDB_BASE = 'https://api.themoviedb.org/3'

export async function tmdbFetch(
  path: string,
  params: Record<string, string> = {},
): Promise<{ status: number; body: unknown }> {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not configured')
  }

  const url = new URL(`${TMDB_BASE}${path}`)
  url.searchParams.set('api_key', apiKey)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const res = await fetch(url)
  const body = await res.json()
  return { status: res.status, body }
}

export type TmdbMediaType = 'tv' | 'movie'

/** Anything other than the literal string 'movie' is treated as 'tv' -- a missing or stale `type` param (e.g. a cached PWA client mid-deploy) must keep working exactly as it did before movies existed. */
export function parseMediaType(value: unknown): TmdbMediaType {
  return value === 'movie' ? 'movie' : 'tv'
}

/**
 * TMDB's /movie/* list endpoints use `title`/`release_date` instead of TV's
 * `name`/`first_air_date`, and don't reliably include `media_type` on every
 * endpoint. Normalizing here means every client-side list consumer can stay
 * TV/movie-agnostic and just read `name`/`first_air_date`/`media_type`.
 */
export function normalizeResults<T extends Record<string, unknown>>(
  results: T[],
  type: TmdbMediaType,
): T[] {
  if (type === 'tv') {
    return results.map((r) => ({ ...r, media_type: 'tv' }))
  }
  return results.map((r) => ({
    ...r,
    name: r.title,
    first_air_date: r.release_date,
    media_type: 'movie',
  }))
}

/** Applies normalizeResults() to a whole TMDB response body if it has a `.results` array; passes anything else (error bodies included) through unchanged. */
export function normalizeResultsBody(body: unknown, type: TmdbMediaType): unknown {
  if (
    body &&
    typeof body === 'object' &&
    Array.isArray((body as { results?: unknown }).results)
  ) {
    const typed = body as { results: Record<string, unknown>[] }
    return { ...typed, results: normalizeResults(typed.results, type) }
  }
  return body
}
