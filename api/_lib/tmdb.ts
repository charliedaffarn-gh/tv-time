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
