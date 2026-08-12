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

export interface Profile {
  id: string
  display_name: string
}

export type ShareStatus = 'pending' | 'accepted' | 'dismissed'

export interface ShowShare {
  id: string
  from_user_id: string
  to_user_id: string
  tmdb_id: number
  title: string
  poster_path: string | null
  status: ShareStatus
  created_at: string
  from_profile: { display_name: string } | null
}

export interface TmdbSearchResult {
  id: number
  name: string
  poster_path: string | null
  first_air_date: string | null
  overview: string
  media_type: 'tv' | 'movie'
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

export interface TmdbWatchProvider {
  provider_name: string
  logo_path: string | null
}

export interface TmdbWatchProviderRegion {
  link: string
  flatrate?: TmdbWatchProvider[]
  rent?: TmdbWatchProvider[]
  buy?: TmdbWatchProvider[]
}

export interface TmdbShowDetails {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  status: string
  vote_average: number
  vote_count: number
  genres: { id: number; name: string }[]
  networks: { id: number; name: string; logo_path: string | null }[]
  number_of_seasons: number
  seasons: TmdbSeasonSummary[]
  next_episode_to_air: TmdbEpisodeRef | null
  last_episode_to_air: TmdbEpisodeRef | null
  external_ids?: { imdb_id: string | null }
  'watch/providers'?: { results: Record<string, TmdbWatchProviderRegion> }
}

export interface TmdbSeasonDetails {
  season_number: number
  episodes: TmdbEpisodeRef[]
}

export interface TmdbGenre {
  id: number
  name: string
}

export interface TmdbMovieDetails {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  status: string
  vote_average: number
  vote_count: number
  genres: { id: number; name: string }[]
  release_date: string | null
  runtime: number | null
  imdb_id: string | null
  'watch/providers'?: { results: Record<string, TmdbWatchProviderRegion> }
}

export type FilmStatus = 'to_watch' | 'watched'

export interface UserFilm {
  id: string
  user_id: string
  tmdb_id: number
  title: string
  poster_path: string | null
  status: FilmStatus
  created_at: string
  updated_at: string
}

export interface FilmShare {
  id: string
  from_user_id: string
  to_user_id: string
  tmdb_id: number
  title: string
  poster_path: string | null
  status: ShareStatus
  created_at: string
  from_profile: { display_name: string } | null
}

export type MediaCardView = 'grid' | 'list'
