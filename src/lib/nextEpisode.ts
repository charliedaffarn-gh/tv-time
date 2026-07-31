import type { TmdbSeasonSummary } from '../types'

export interface EpisodePointer {
  season: number
  episode: number
}

export function episodeKey(season: number, episode: number): string {
  return `${season}-${episode}`
}

/**
 * Given the set of episodes a user has watched (as "season-episode" keys)
 * and a show's season summaries, find the first episode not yet watched.
 * Season 0 ("Specials") is ignored. Returns null once the user has caught
 * up with everything released so far.
 */
export function computeNextEpisode(
  watched: ReadonlySet<string>,
  seasons: TmdbSeasonSummary[],
): EpisodePointer | null {
  const realSeasons = seasons
    .filter((s) => s.season_number >= 1 && s.episode_count > 0)
    .sort((a, b) => a.season_number - b.season_number)

  for (const season of realSeasons) {
    for (let episode = 1; episode <= season.episode_count; episode++) {
      if (!watched.has(episodeKey(season.season_number, episode))) {
        return { season: season.season_number, episode }
      }
    }
  }

  return null
}
