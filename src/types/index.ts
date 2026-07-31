export type ShowStatus = 'library' | 'watching' | 'finished'

export interface UserShow {
  id: string
  user_id: string
  tmdb_id: number
  title: string
  poster_path: string | null
  status: ShowStatus
  created_at: string
  updated_at: string
}

export interface WatchedEpisode {
  id: string
  user_show_id: string
  season_number: number
  episode_number: number
  watched_at: string
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
  still_path: string | null
}

export interface TmdbShowDetails {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  status: string
  number_of_seasons: number
  seasons: TmdbSeasonSummary[]
  next_episode_to_air: TmdbEpisodeRef | null
  last_episode_to_air: TmdbEpisodeRef | null
}

export interface TmdbSeasonDetails {
  season_number: number
  episodes: TmdbEpisodeRef[]
}
