export type ShowStatus = 'library' | 'watching' | 'finished'

export interface UserShow {
  id: string
  user_id: string
  tmdb_id: number
  title: string
  poster_path: string | null
  status: ShowStatus
  current_season: number
  current_episode: number
  created_at: string
  updated_at: string
}

export interface TmdbSearchResult {
  id: number
  name: string
  poster_path: string | null
  first_air_date: string | null
  overview: string
}

export interface TmdbSeasonSummary {
  season_number: number
  episode_count: number
  name: string
}

export interface TmdbEpisodeRef {
  season_number: number
  episode_number: number
  name: string
  air_date: string | null
}

export interface TmdbShowDetails {
  id: number
  name: string
  poster_path: string | null
  number_of_seasons: number
  seasons: TmdbSeasonSummary[]
  next_episode_to_air: TmdbEpisodeRef | null
  last_episode_to_air: TmdbEpisodeRef | null
}

export interface TmdbSeasonDetails {
  season_number: number
  episodes: TmdbEpisodeRef[]
}
