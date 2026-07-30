import type { TmdbSeasonSummary } from '../types'

export interface EpisodePointer {
  season: number
  episode: number
}

/**
 * Given a user's current watch pointer and a show's season summaries,
 * work out which episode comes next. Season 0 ("Specials") is ignored.
 * Returns null once the user has caught up with everything released so far.
 */
export function computeNextEpisode(
  current: EpisodePointer,
  seasons: TmdbSeasonSummary[],
): EpisodePointer | null {
  const realSeasons = seasons
    .filter((s) => s.season_number >= 1 && s.episode_count > 0)
    .sort((a, b) => a.season_number - b.season_number)

  if (realSeasons.length === 0) return null

  if (current.season === 0 && current.episode === 0) {
    return { season: realSeasons[0].season_number, episode: 1 }
  }

  const idx = realSeasons.findIndex((s) => s.season_number === current.season)
  if (idx === -1) return null

  const nextEpisodeNumber = current.episode + 1
  if (nextEpisodeNumber <= realSeasons[idx].episode_count) {
    return { season: current.season, episode: nextEpisodeNumber }
  }

  const nextSeason = realSeasons[idx + 1]
  if (nextSeason) {
    return { season: nextSeason.season_number, episode: 1 }
  }

  return null
}
